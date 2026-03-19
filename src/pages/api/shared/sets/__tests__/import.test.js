/**
 * Tests for POST /api/shared/sets/import
 * Authenticated endpoint — imports a shared set into user's account.
 */

jest.mock('@auth0/nextjs-auth0', () => ({
  withApiAuthRequired: (fn) => fn,
  getSession: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const { getSession } = require('@auth0/nextjs-auth0');
const { createClient } = require('@supabase/supabase-js');

function mockReqRes({ method = 'POST', body = {} } = {}) {
  const req = { method, body };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return { req, res };
}

describe('POST /api/shared/sets/import', () => {
  let handler;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    jest.mock('@auth0/nextjs-auth0', () => ({
      withApiAuthRequired: (fn) => fn,
      getSession: jest.fn(),
    }));
    jest.mock('@supabase/supabase-js', () => ({
      createClient: jest.fn(),
    }));
  });

  function setupMocks({ sessionUser = null, rpcResponses = {} } = {}) {
    const { getSession: gs } = require('@auth0/nextjs-auth0');
    gs.mockResolvedValue(sessionUser ? { user: { sub: sessionUser } } : null);

    const rpcMock = jest.fn().mockImplementation((fnName, params) => {
      const key = fnName;
      if (rpcResponses[key]) return Promise.resolve(rpcResponses[key]);
      return Promise.resolve({ data: null, error: null });
    });
    const schemaMock = jest.fn().mockReturnValue({ rpc: rpcMock });
    const { createClient: cc } = require('@supabase/supabase-js');
    cc.mockReturnValue({ schema: schemaMock });

    handler = require('../import').default;
    return { rpcMock, schemaMock };
  }

  test('returns 401 without auth session', async () => {
    setupMocks({ sessionUser: null });
    const { req, res } = mockReqRes({ body: { shareToken: 'abc' } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 405 for non-POST', async () => {
    setupMocks({ sessionUser: 'user-1' });
    const { req, res } = mockReqRes({ method: 'GET', body: {} });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  test('returns 400 for missing shareToken', async () => {
    setupMocks({ sessionUser: 'user-1' });
    const { req, res } = mockReqRes({ body: {} });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('shareToken') })
    );
  });

  test('returns 404 when shared set not found', async () => {
    setupMocks({
      sessionUser: 'user-1',
      rpcResponses: {
        get_set_by_share_token: { data: null, error: null },
      },
    });
    const { req, res } = mockReqRes({ body: { shareToken: 'nonexistent' } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 409 on duplicate import', async () => {
    setupMocks({
      sessionUser: 'user-1',
      rpcResponses: {
        get_set_by_share_token: {
          data: {
            entity_id: 'source-set-123',
            set: { title: 'Test', owner: 'other-user' },
            items: [],
          },
          error: null,
        },
        check_duplicate_import: {
          data: { existing_set_entity_id: 'already-imported-456' },
          error: null,
        },
      },
    });
    const { req, res } = mockReqRes({ body: { shareToken: 'valid-token' } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('already imported'),
        setEntityId: 'already-imported-456',
      })
    );
  });

  test('does not leak error messages in catch block', async () => {
    // Simulate an error thrown inside the try block (e.g. RPC throws)
    const { getSession: gs } = require('@auth0/nextjs-auth0');
    gs.mockResolvedValue({ user: { sub: 'user-1' } });

    const rpcMock = jest
      .fn()
      .mockRejectedValue(new Error('Sensitive DB connection string here'));
    const schemaMock = jest.fn().mockReturnValue({ rpc: rpcMock });
    const { createClient: cc } = require('@supabase/supabase-js');
    cc.mockReturnValue({ schema: schemaMock });

    handler = require('../import').default;

    const { req, res } = mockReqRes({ body: { shareToken: 'abc' } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const response = res.json.mock.calls[0][0];
    expect(response.error).toBe('Internal server error');
    expect(response.message).toBeUndefined();
  });

  test('successful import creates set with imported_from and returns 201', async () => {
    const { rpcMock } = setupMocks({
      sessionUser: 'user-1',
      rpcResponses: {
        get_set_by_share_token: {
          data: {
            entity_id: 'source-set-123',
            set: {
              title: 'Shared Set',
              description: 'desc',
              tags: '["tag1"]',
              set_type: 'vocab',
              owner: 'other-user',
            },
            items: [
              {
                type: 'vocab',
                english: 'hello',
                kana: 'こんにちは',
                kanji: '',
                lexical_category: 'noun',
              },
            ],
          },
          error: null,
        },
        check_duplicate_import: {
          data: { existing_set_entity_id: null },
          error: null,
        },
        insert_json_to_set: {
          data: [{ entity_ids: ['new-set-789'] }],
          error: null,
        },
        insert_json_to_kb_vocab: {
          data: [{ entity_ids: ['vocab-item-001'] }],
          error: null,
        },
        create_relations_from_set_group_v3: {
          data: null,
          error: null,
        },
      },
    });

    const { req, res } = mockReqRes({ body: { shareToken: 'valid-token' } });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const response = res.json.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.setEntityId).toBe('new-set-789');

    // Verify insert_json_to_set was called with imported_from
    const insertSetCall = rpcMock.mock.calls.find(
      (c) => c[0] === 'insert_json_to_set'
    );
    expect(insertSetCall).toBeDefined();
    const setJson = JSON.parse(insertSetCall[1].json_array_input);
    expect(setJson[0].imported_from).toBe('source-set-123');
    expect(setJson[0].owner).toBe('user-1');
    expect(setJson[0].srs_enabled).toBe('false');
    expect(setJson[0].share_token).toBe('');
  });
});
