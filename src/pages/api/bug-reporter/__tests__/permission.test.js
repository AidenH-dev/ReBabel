/**
 * Tests for GET /api/bug-reporter/permission
 * Tests SPEC-LLM-001
 */

// Mock @auth0/nextjs-auth0 before importing the handler
jest.mock('@auth0/nextjs-auth0', () => ({
  withApiAuthRequired: (fn) => fn,
  getSession: jest.fn(),
}));

// Mock the supabaseAdmin lib
jest.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    schema: jest.fn(),
  },
}));

const { getSession } = require('@auth0/nextjs-auth0');
const { supabaseAdmin } = require('@/lib/supabaseAdmin');

// Helper to build mock req/res
function mockReqRes({ method = 'GET', body = {} } = {}) {
  const req = { method, body };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return { req, res };
}

// Helper to set up the supabase schema -> rpc mock chain
function mockRpc(returnValue) {
  const rpcMock = jest.fn().mockResolvedValue(returnValue);
  const schemaMock = jest.fn().mockReturnValue({ rpc: rpcMock });
  supabaseAdmin.schema.mockImplementation(schemaMock);
  return { rpcMock, schemaMock };
}

describe('GET /api/bug-reporter/permission', () => {
  let handler;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Re-mock after resetModules
    jest.mock('@auth0/nextjs-auth0', () => ({
      withApiAuthRequired: (fn) => fn,
      getSession: jest.fn(),
    }));
    jest.mock('@/lib/supabaseAdmin', () => ({
      supabaseAdmin: {
        schema: jest.fn(),
      },
    }));

    handler = require('../permission').default;
  });

  // Tests SPEC-LLM-001: Reject unauthenticated requests with 401
  test('returns 401 when session is missing', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue(null);

    const { req, res } = mockReqRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  // Tests SPEC-LLM-001: Reject unauthenticated requests with 401 (no user.sub)
  test('returns 401 when session has no user sub', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({ user: {} });

    const { req, res } = mockReqRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  // Tests SPEC-LLM-001: Returns { allowed: true } when RPC returns true
  test('returns { allowed: true } when user has permission', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({ user: { sub: 'auth0|user123' } });

    const { supabaseAdmin } = require('@/lib/supabaseAdmin');
    const rpcMock = jest.fn().mockResolvedValue({ data: true, error: null });
    supabaseAdmin.schema.mockReturnValue({ rpc: rpcMock });

    const { req, res } = mockReqRes();
    await handler(req, res);

    expect(supabaseAdmin.schema).toHaveBeenCalledWith('v1_kvs_rebabel');
    expect(rpcMock).toHaveBeenCalledWith('check_bug_reporter_permission', {
      p_user_id: 'auth0|user123',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ allowed: true });
  });

  // Tests SPEC-LLM-001: Returns { allowed: false } when RPC returns false
  test('returns { allowed: false } when user does not have permission', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({ user: { sub: 'auth0|user999' } });

    const { supabaseAdmin } = require('@/lib/supabaseAdmin');
    const rpcMock = jest.fn().mockResolvedValue({ data: false, error: null });
    supabaseAdmin.schema.mockReturnValue({ rpc: rpcMock });

    const { req, res } = mockReqRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ allowed: false });
  });

  // Tests SPEC-LLM-001: Only allows GET method
  test('returns 405 for non-GET methods', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({ user: { sub: 'auth0|user123' } });

    const { req, res } = mockReqRes({ method: 'POST' });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  // Tests SPEC-LLM-001: Handles Supabase RPC errors gracefully
  test('returns 500 when Supabase RPC fails', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({ user: { sub: 'auth0|user123' } });

    const { supabaseAdmin } = require('@/lib/supabaseAdmin');
    const rpcMock = jest
      .fn()
      .mockResolvedValue({ data: null, error: new Error('DB error') });
    supabaseAdmin.schema.mockReturnValue({ rpc: rpcMock });

    const { req, res } = mockReqRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
