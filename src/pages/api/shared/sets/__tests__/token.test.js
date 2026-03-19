/**
 * Tests for GET /api/shared/sets/[token]
 * Public endpoint — no auth required, rate limited, strips sensitive fields.
 */

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/rateLimit', () => ({
  createRateLimiter: jest.fn(() => ({
    check: jest.fn(() => true),
  })),
}));

const { createClient } = require('@supabase/supabase-js');
const { createRateLimiter } = require('@/lib/rateLimit');

function mockReqRes({ method = 'GET', query = {} } = {}) {
  const req = {
    method,
    query,
    headers: { 'x-forwarded-for': '127.0.0.1' },
    socket: { remoteAddress: '127.0.0.1' },
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return { req, res };
}

function setupSupabaseMock(rpcReturn) {
  const rpcMock = jest.fn().mockResolvedValue(rpcReturn);
  const schemaMock = jest.fn().mockReturnValue({ rpc: rpcMock });
  createClient.mockReturnValue({ schema: schemaMock });
  return { rpcMock, schemaMock };
}

describe('GET /api/shared/sets/[token]', () => {
  let handler;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    jest.mock('@supabase/supabase-js', () => ({
      createClient: jest.fn(),
    }));
    jest.mock('@/lib/rateLimit', () => ({
      createRateLimiter: jest.fn(() => ({
        check: jest.fn(() => true),
      })),
    }));
  });

  function loadHandler(rpcReturn) {
    const { createClient: cc } = require('@supabase/supabase-js');
    const rpcMock = jest.fn().mockResolvedValue(rpcReturn);
    const schemaMock = jest.fn().mockReturnValue({ rpc: rpcMock });
    cc.mockReturnValue({ schema: schemaMock });

    handler = require('../[token]').default;
    return { rpcMock, schemaMock };
  }

  test('rejects non-GET methods with 405', async () => {
    loadHandler({ data: null, error: null });
    const { req, res } = mockReqRes({
      method: 'POST',
      query: { token: 'abc' },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  test('returns 400 for missing token', async () => {
    loadHandler({ data: null, error: null });
    const { req, res } = mockReqRes({ query: {} });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Missing'),
      })
    );
  });

  test('returns 400 for empty string token', async () => {
    loadHandler({ data: null, error: null });
    const { req, res } = mockReqRes({ query: { token: '   ' } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 404 when token not found', async () => {
    loadHandler({ data: null, error: null });
    const { req, res } = mockReqRes({ query: { token: 'nonexistent' } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 500 on RPC error', async () => {
    loadHandler({ data: null, error: { message: 'db error' } });
    const { req, res } = mockReqRes({ query: { token: 'abc' } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Database error' })
    );
  });

  test('strips sensitive fields from set and items', async () => {
    const mockData = {
      entity_id: 'set-123',
      set: { title: 'Test', owner: 'secret-owner-id', description: 'desc' },
      items: [
        {
          type: 'vocab',
          english: 'hello',
          owner: 'secret-owner-id',
          srs_level: 5,
          srs_reviewed_last: '2025-01-01',
          known_status: 'known',
          kana: 'こんにちは',
        },
      ],
    };
    loadHandler({ data: mockData, error: null });
    const { req, res } = mockReqRes({ query: { token: 'valid-token' } });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.success).toBe(true);

    // Set should NOT have owner
    expect(responseData.data.set.owner).toBeUndefined();
    expect(responseData.data.set.title).toBe('Test');

    // Items should NOT have sensitive fields
    const item = responseData.data.items[0];
    expect(item.owner).toBeUndefined();
    expect(item.srs_level).toBeUndefined();
    expect(item.srs_reviewed_last).toBeUndefined();
    expect(item.known_status).toBeUndefined();
    expect(item.english).toBe('hello');
    expect(item.kana).toBe('こんにちは');
  });

  test('returns correct item_count', async () => {
    const mockData = {
      entity_id: 'set-123',
      set: { title: 'Test' },
      items: [{ type: 'vocab' }, { type: 'grammar' }],
    };
    loadHandler({ data: mockData, error: null });
    const { req, res } = mockReqRes({ query: { token: 'valid' } });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].data.item_count).toBe(2);
  });

  test('rate limiter blocks excessive requests', async () => {
    const { createRateLimiter: crl } = require('@/lib/rateLimit');
    const checkMock = jest.fn(() => false);
    crl.mockReturnValue({ check: checkMock });

    const { createClient: cc } = require('@supabase/supabase-js');
    cc.mockReturnValue({ schema: jest.fn() });

    handler = require('../[token]').default;

    const { req, res } = mockReqRes({ query: { token: 'valid' } });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('Too many requests'),
      })
    );
  });

  test('calls RPC with trimmed token', async () => {
    const { rpcMock } = loadHandler({ data: null, error: null });
    const { req, res } = mockReqRes({ query: { token: '  abc-token  ' } });
    await handler(req, res);

    expect(rpcMock).toHaveBeenCalledWith('get_set_by_share_token', {
      token: 'abc-token',
    });
  });
});
