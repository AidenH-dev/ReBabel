/**
 * Tests for POST /api/database/v2/sets/share
 * Authenticated endpoint — generate or revoke share tokens for sets.
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

describe('POST /api/database/v2/sets/share', () => {
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
      if (rpcResponses[fnName]) return Promise.resolve(rpcResponses[fnName]);
      return Promise.resolve({ data: null, error: null });
    });
    const schemaMock = jest.fn().mockReturnValue({ rpc: rpcMock });
    const { createClient: cc } = require('@supabase/supabase-js');
    cc.mockReturnValue({ schema: schemaMock });

    handler = require('../share').default;
    return { rpcMock, schemaMock };
  }

  test('returns 401 without auth session', async () => {
    setupMocks({ sessionUser: null });
    const { req, res } = mockReqRes({
      body: { setId: 'set-1', action: 'generate' },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('returns 405 for non-POST', async () => {
    setupMocks({ sessionUser: 'user-1' });
    const { req, res } = mockReqRes({ method: 'GET', body: {} });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  test('returns 400 for missing setId', async () => {
    setupMocks({ sessionUser: 'user-1' });
    const { req, res } = mockReqRes({ body: { action: 'generate' } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('setId') })
    );
  });

  test('returns 400 for invalid action', async () => {
    setupMocks({ sessionUser: 'user-1' });
    const { req, res } = mockReqRes({
      body: { setId: 'set-1', action: 'delete' },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('generate') })
    );
  });

  test('returns 404 when set not found', async () => {
    setupMocks({
      sessionUser: 'user-1',
      rpcResponses: {
        get_set_with_items_v2: { data: null, error: null },
      },
    });
    const { req, res } = mockReqRes({
      body: { setId: 'nonexistent', action: 'generate' },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 403 when user does not own set', async () => {
    setupMocks({
      sessionUser: 'user-1',
      rpcResponses: {
        get_set_with_items_v2: {
          data: { set: { owner: 'other-user', title: 'Not Yours' }, items: [] },
          error: null,
        },
      },
    });
    const { req, res } = mockReqRes({
      body: { setId: 'set-1', action: 'generate' },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('do not own') })
    );
  });

  test('revoke action sets shareToken to null', async () => {
    const { rpcMock } = setupMocks({
      sessionUser: 'user-1',
      rpcResponses: {
        get_set_with_items_v2: {
          data: { set: { owner: 'user-1', title: 'My Set' }, items: [] },
          error: null,
        },
        update_set_by_id: { data: null, error: null },
      },
    });
    const { req, res } = mockReqRes({
      body: { setId: 'set-1', action: 'revoke' },
    });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response.shareToken).toBeNull();
    expect(response.shareUrl).toBeNull();

    // Verify update_set_by_id was called with empty share_token
    const updateCall = rpcMock.mock.calls.find(
      (c) => c[0] === 'update_set_by_id'
    );
    expect(updateCall).toBeDefined();
    expect(JSON.parse(updateCall[1].json_updates).share_token).toBe('');
  });

  test('generate returns existing token with slug in URL', async () => {
    setupMocks({
      sessionUser: 'user-1',
      rpcResponses: {
        get_set_with_items_v2: {
          data: {
            set: { owner: 'user-1', title: 'N5 Vocab Basics' },
            items: [],
          },
          error: null,
        },
        get_share_token_for_set: {
          data: { share_token: 'existing-token-uuid' },
          error: null,
        },
      },
    });
    const { req, res } = mockReqRes({
      body: { setId: 'set-1', action: 'generate' },
    });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response.shareToken).toBe('existing-token-uuid');
    expect(response.shareUrl).toContain('existing-token-uuid');
    expect(response.shareUrl).toContain('/n5-vocab-basics');
  });

  test('generate creates new 7-char base36 token when none exists', async () => {
    setupMocks({
      sessionUser: 'user-1',
      rpcResponses: {
        get_set_with_items_v2: {
          data: { set: { owner: 'user-1', title: 'My Set' }, items: [] },
          error: null,
        },
        get_share_token_for_set: {
          data: { share_token: null },
          error: null,
        },
        get_set_by_share_token: { data: null, error: null },
        update_set_by_id: { data: null, error: null },
      },
    });
    const { req, res } = mockReqRes({
      body: { setId: 'set-1', action: 'generate' },
    });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.shareToken).toBeDefined();
    // New tokens are 7 chars, lowercase alphanumeric
    expect(response.shareToken).toMatch(/^[a-z0-9]{7}$/);
    expect(response.shareUrl).toContain(response.shareToken);
    // URL should include slug
    expect(response.shareUrl).toContain('/my-set');
  });

  test('collision retry generates a new token on collision', async () => {
    let callCount = 0;
    const { getSession: gs } = require('@auth0/nextjs-auth0');
    gs.mockResolvedValue({ user: { sub: 'user-1' } });

    const rpcMock = jest.fn().mockImplementation((fnName) => {
      if (fnName === 'get_set_with_items_v2') {
        return Promise.resolve({
          data: { set: { owner: 'user-1', title: 'Test' }, items: [] },
          error: null,
        });
      }
      if (fnName === 'get_share_token_for_set') {
        return Promise.resolve({ data: { share_token: null }, error: null });
      }
      if (fnName === 'get_set_by_share_token') {
        callCount++;
        // First call collides, second doesn't
        if (callCount === 1) {
          return Promise.resolve({
            data: { set: { id: 'other' } },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }
      if (fnName === 'update_set_by_id') {
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });
    const schemaMock = jest.fn().mockReturnValue({ rpc: rpcMock });
    const { createClient: cc } = require('@supabase/supabase-js');
    cc.mockReturnValue({ schema: schemaMock });

    handler = require('../share').default;

    const { req, res } = mockReqRes({
      body: { setId: 'set-1', action: 'generate' },
    });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    // get_set_by_share_token should have been called at least twice (collision + success)
    const collisionCalls = rpcMock.mock.calls.filter(
      (c) => c[0] === 'get_set_by_share_token'
    );
    expect(collisionCalls.length).toBeGreaterThanOrEqual(2);
  });

  test('returns 500 when all collision retries exhausted', async () => {
    const { getSession: gs } = require('@auth0/nextjs-auth0');
    gs.mockResolvedValue({ user: { sub: 'user-1' } });

    const rpcMock = jest.fn().mockImplementation((fnName) => {
      if (fnName === 'get_set_with_items_v2') {
        return Promise.resolve({
          data: { set: { owner: 'user-1', title: 'Test' }, items: [] },
          error: null,
        });
      }
      if (fnName === 'get_share_token_for_set') {
        return Promise.resolve({ data: { share_token: null }, error: null });
      }
      if (fnName === 'get_set_by_share_token') {
        // Always collides
        return Promise.resolve({
          data: { set: { id: 'existing' } },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });
    const schemaMock = jest.fn().mockReturnValue({ rpc: rpcMock });
    const { createClient: cc } = require('@supabase/supabase-js');
    cc.mockReturnValue({ schema: schemaMock });

    handler = require('../share').default;

    const { req, res } = mockReqRes({
      body: { setId: 'set-1', action: 'generate' },
    });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    const response = res.json.mock.calls[0][0];
    expect(response.error).toContain('unique share token');
  });

  test('does not leak error messages in catch block', async () => {
    // Simulate an error thrown inside the try block (e.g. RPC throws)
    const { getSession: gs } = require('@auth0/nextjs-auth0');
    gs.mockResolvedValue({ user: { sub: 'user-1' } });

    const rpcMock = jest
      .fn()
      .mockRejectedValue(new Error('Sensitive connection info'));
    const schemaMock = jest.fn().mockReturnValue({ rpc: rpcMock });
    const { createClient: cc } = require('@supabase/supabase-js');
    cc.mockReturnValue({ schema: schemaMock });

    handler = require('../share').default;

    const { req, res } = mockReqRes({
      body: { setId: 'set-1', action: 'generate' },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const response = res.json.mock.calls[0][0];
    expect(response.error).toBe('Internal server error');
    expect(response.message).toBeUndefined();
  });

  test('uses RPC instead of direct table query for existing token check', async () => {
    const { rpcMock, schemaMock } = setupMocks({
      sessionUser: 'user-1',
      rpcResponses: {
        get_set_with_items_v2: {
          data: { set: { owner: 'user-1', title: 'My Set' }, items: [] },
          error: null,
        },
        get_share_token_for_set: {
          data: { share_token: null },
          error: null,
        },
        get_set_by_share_token: { data: null, error: null },
        update_set_by_id: { data: null, error: null },
      },
    });
    const { req, res } = mockReqRes({
      body: { setId: 'set-1', action: 'generate' },
    });
    await handler(req, res);

    // Verify get_share_token_for_set was called (RPC, not direct table query)
    const tokenCall = rpcMock.mock.calls.find(
      (c) => c[0] === 'get_share_token_for_set'
    );
    expect(tokenCall).toBeDefined();
    expect(tokenCall[1]).toEqual({ set_entity_id: 'set-1' });

    // Verify no .from() was called (no direct table query)
    const fromCalls = schemaMock.mock.results.filter(
      (r) => r.value && r.value.from
    ).length;
    expect(fromCalls).toBe(0);
  });
});

describe('generateShortToken', () => {
  let generateShortToken;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('@auth0/nextjs-auth0', () => ({
      withApiAuthRequired: (fn) => fn,
      getSession: jest.fn(),
    }));
    jest.mock('@supabase/supabase-js', () => ({
      createClient: jest
        .fn()
        .mockReturnValue({
          schema: jest.fn().mockReturnValue({ rpc: jest.fn() }),
        }),
    }));
    generateShortToken = require('../share').generateShortToken;
  });

  test('generates 7-character token', () => {
    const token = generateShortToken();
    expect(token.length).toBe(7);
  });

  test('only contains lowercase letters and digits', () => {
    // Generate several tokens and check all characters
    for (let i = 0; i < 20; i++) {
      const token = generateShortToken();
      expect(token).toMatch(/^[a-z0-9]{7}$/);
    }
  });

  test('generates different tokens on subsequent calls', () => {
    const tokens = new Set();
    for (let i = 0; i < 10; i++) {
      tokens.add(generateShortToken());
    }
    // With 36^7 possibilities, 10 tokens should all be unique
    expect(tokens.size).toBe(10);
  });
});
