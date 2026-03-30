/**
 * Tests for session-state API routes + sessions/[id]/reinitiate
 * Session persistence (Issues #106, #107) — Phase 2: API Layer
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

function mockReqRes({ method = 'POST', body = {}, query = {} } = {}) {
  const req = {
    method,
    body,
    query,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  };
  return { req, res };
}

function setupMocks({ sessionUser = 'auth0|test', rpcResponses = {} } = {}) {
  // Re-require after jest.resetModules() to get fresh mock references
  const { getSession: gs } = require('@auth0/nextjs-auth0');
  const { createClient: cc } = require('@supabase/supabase-js');

  gs.mockResolvedValue(
    sessionUser
      ? {
          user: {
            sub: sessionUser,
            email: 'test@test.com',
            'https://rebabel.org/app_metadata': {},
          },
        }
      : null
  );

  // Always include resolve_user_identity so withAuth can resolve the user
  const defaultRpcResponses = {
    resolve_user_identity: {
      data: { user_id: 'usr_test123', created: false },
      error: null,
    },
    ...rpcResponses,
  };

  const rpcMock = jest.fn().mockImplementation((fnName) => {
    if (defaultRpcResponses[fnName])
      return Promise.resolve(defaultRpcResponses[fnName]);
    return Promise.resolve({ data: null, error: null });
  });
  // supabaseKvs calls .rpc() directly (schema set in client options)
  // Also provide .schema() for any code that chains it
  const schemaMock = jest.fn().mockReturnValue({ rpc: rpcMock });
  cc.mockReturnValue({ rpc: rpcMock, schema: schemaMock });

  return { rpcMock, schemaMock };
}

// ============================================================
// create.ts
// ============================================================

describe('POST /api/analytics/user/session-state/create', () => {
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

  function loadHandler() {
    handler = require('../../session-state/create').default;
  }

  test('1. returns 405 for non-POST', async () => {
    setupMocks();
    loadHandler();
    const { req, res } = mockReqRes({ method: 'GET' });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  test('2. returns 400 for missing sessionType', async () => {
    setupMocks();
    loadHandler();
    const { req, res } = mockReqRes({ body: { items: [{ itemId: 'v1' }] } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('sessionType') })
    );
  });

  test('3. returns 400 for empty items array', async () => {
    setupMocks();
    loadHandler();
    const { req, res } = mockReqRes({
      body: { sessionType: 'quiz', items: [] },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('4. returns 400 for items with missing itemId', async () => {
    setupMocks();
    loadHandler();
    const { req, res } = mockReqRes({
      body: { sessionType: 'quiz', items: [{ foo: 'bar' }] },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('itemId') })
    );
  });

  test('5. returns 200 with entityId on success', async () => {
    const { rpcMock } = setupMocks({
      rpcResponses: {
        create_session_state: {
          data: {
            success: true,
            entity_id: 'ss_abc',
            total_chunks: 1,
            is_chunked: false,
            existing: false,
          },
          error: null,
        },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({
      body: {
        sessionType: 'quiz',
        sourceSetId: 'set_1',
        items: [{ itemId: 'v1' }, { itemId: 'v2' }],
      },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        entityId: 'ss_abc',
        isChunked: false,
      })
    );
    // Verify order was computed from index
    expect(rpcMock).toHaveBeenCalledWith(
      'create_session_state',
      expect.objectContaining({
        p_items: [
          { item_id: 'v1', order: '0' },
          { item_id: 'v2', order: '1' },
        ],
      })
    );
  });

  test('6. returns 200 with existing=true on duplicate', async () => {
    setupMocks({
      rpcResponses: {
        create_session_state: {
          data: {
            success: true,
            entity_id: 'ss_abc',
            total_chunks: 1,
            is_chunked: false,
            existing: true,
          },
          error: null,
        },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({
      body: { sessionType: 'quiz', items: [{ itemId: 'v1' }] },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ existing: true })
    );
  });
});

// ============================================================
// active.ts
// ============================================================

describe('GET /api/analytics/user/session-state/active', () => {
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

  function loadHandler() {
    handler = require('../../session-state/active').default;
  }

  test('7. returns 405 for non-GET', async () => {
    setupMocks();
    loadHandler();
    const { req, res } = mockReqRes({ method: 'POST' });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  test('8. returns 200 with active=false when no session', async () => {
    setupMocks({
      rpcResponses: {
        get_active_session_state: { data: null, error: null },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({
      method: 'GET',
      query: { sessionType: 'quiz' },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, active: false });
  });

  test('9. returns 200 with active=true and state', async () => {
    const mockState = {
      entity_id: 'ss_abc',
      state_status: 'active',
      session_type: 'quiz',
    };
    setupMocks({
      rpcResponses: {
        get_active_session_state: { data: mockState, error: null },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({
      method: 'GET',
      query: { sessionType: 'quiz', setId: 'set_1' },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      active: true,
      state: mockState,
    });
  });
});

// ============================================================
// [id]/index.ts (GET session state)
// ============================================================

describe('GET /api/analytics/user/session-state/[id]', () => {
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

  function loadHandler() {
    handler = require('../../session-state/[id]/index').default;
  }

  test('10. returns 405 for non-GET', async () => {
    setupMocks();
    loadHandler();
    const { req, res } = mockReqRes({
      method: 'POST',
      query: { id: '550e8400-e29b-41d4-a716-446655440000' },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  test('11. returns 400 for invalid UUID', async () => {
    setupMocks();
    loadHandler();
    const { req, res } = mockReqRes({
      method: 'GET',
      query: { id: 'not-a-uuid' },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('12. returns 404 when session not found', async () => {
    setupMocks({
      rpcResponses: {
        get_session_state: { data: null, error: null },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({
      method: 'GET',
      query: { id: '550e8400-e29b-41d4-a716-446655440000' },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('13. returns 200 with state, items, questions', async () => {
    const mockData = {
      state: { entity_id: 'ss_abc', state_status: 'active' },
      items: [{ entity_id: 'si_1', item_id: 'v1', order: '0' }],
      questions: [],
    };
    setupMocks({
      rpcResponses: {
        get_session_state: { data: mockData, error: null },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({
      method: 'GET',
      query: { id: '550e8400-e29b-41d4-a716-446655440000' },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        state: mockData.state,
        items: mockData.items,
        questions: mockData.questions,
      })
    );
  });
});

// ============================================================
// [id]/save.ts
// ============================================================

describe('POST /api/analytics/user/session-state/[id]/save', () => {
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

  function loadHandler() {
    handler = require('../../session-state/[id]/save').default;
  }

  const validId = '550e8400-e29b-41d4-a716-446655440000';

  test('14. returns 405 for non-POST', async () => {
    setupMocks();
    loadHandler();
    const { req, res } = mockReqRes({ method: 'GET', query: { id: validId } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  test('15. returns 400 for invalid UUID', async () => {
    setupMocks();
    loadHandler();
    const { req, res } = mockReqRes({ query: { id: 'bad' } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('16. returns 200 on success with stateStatus', async () => {
    const { rpcMock } = setupMocks({
      rpcResponses: {
        save_session_progress: {
          data: { success: true, state_status: 'active' },
          error: null,
        },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({
      query: { id: validId },
      body: { currentIndex: 3, statsCorrect: 2, completedItems: [] },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      stateStatus: 'active',
    });
    // Verify camelCase -> snake_case mapping
    expect(rpcMock).toHaveBeenCalledWith(
      'save_session_progress',
      expect.objectContaining({
        p_progress: expect.objectContaining({
          current_index: '3',
          stats_correct: '2',
        }),
      })
    );
  });

  test('17. returns 200 with empty completedItems', async () => {
    setupMocks({
      rpcResponses: {
        save_session_progress: {
          data: { success: true, state_status: 'active' },
          error: null,
        },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({
      query: { id: validId },
      body: { currentIndex: 5 },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('18. returns 403 when RPC returns not_owner', async () => {
    setupMocks({
      rpcResponses: {
        save_session_progress: {
          data: { success: false, error: 'not_owner' },
          error: null,
        },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({
      query: { id: validId },
      body: { currentIndex: 1 },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('19. returns 409 when RPC returns session_not_active', async () => {
    setupMocks({
      rpcResponses: {
        save_session_progress: {
          data: { success: false, error: 'session_not_active' },
          error: null,
        },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({
      query: { id: validId },
      body: { currentIndex: 1 },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

// ============================================================
// [id]/abandon.ts
// ============================================================

describe('POST /api/analytics/user/session-state/[id]/abandon', () => {
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

  function loadHandler() {
    handler = require('../../session-state/[id]/abandon').default;
  }

  const validId = '550e8400-e29b-41d4-a716-446655440000';

  test('20. returns 405 for non-POST', async () => {
    setupMocks();
    loadHandler();
    const { req, res } = mockReqRes({ method: 'GET', query: { id: validId } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  test('21. returns 200 on success', async () => {
    setupMocks({
      rpcResponses: {
        abandon_session_state: { data: { success: true }, error: null },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({ query: { id: validId } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test('22. returns 404 when session not found', async () => {
    setupMocks({
      rpcResponses: {
        abandon_session_state: {
          data: { success: false, error: 'session_not_found' },
          error: null,
        },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({ query: { id: validId } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('23. returns 409 when session not active', async () => {
    setupMocks({
      rpcResponses: {
        abandon_session_state: {
          data: { success: false, error: 'session_not_active' },
          error: null,
        },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({ query: { id: validId } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

// ============================================================
// sessions/[id]/reinitiate.ts
// ============================================================

describe('POST /api/analytics/user/sessions/[id]/reinitiate', () => {
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

  function loadHandler() {
    handler = require('../../sessions/[id]/reinitiate').default;
  }

  const validId = '550e8400-e29b-41d4-a716-446655440000';

  test('24. returns 405 for non-POST', async () => {
    setupMocks();
    loadHandler();
    const { req, res } = mockReqRes({ method: 'GET', query: { id: validId } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  test('25. returns 403 when session belongs to different user', async () => {
    setupMocks({
      rpcResponses: {
        get_user_stat_session: {
          data: { owner: 'usr_other_user', session_status: 'hung' },
          error: null,
        },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({ query: { id: validId } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('26. returns 200 on success', async () => {
    setupMocks({
      rpcResponses: {
        get_user_stat_session: {
          data: { owner: 'usr_test123', session_status: 'hung' },
          error: null,
        },
        reinitiate_session: { data: { success: true }, error: null },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({ query: { id: validId } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test('27. returns 404 when session not found', async () => {
    setupMocks({
      rpcResponses: {
        get_user_stat_session: { data: null, error: null },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({ query: { id: validId } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(403); // null session -> ownership fails
  });

  test('28. returns 409 when session already finished', async () => {
    setupMocks({
      rpcResponses: {
        get_user_stat_session: {
          data: { owner: 'usr_test123', session_status: 'finished' },
          error: null,
        },
        reinitiate_session: {
          data: { success: false, error: 'session_already_finished' },
          error: null,
        },
      },
    });
    loadHandler();
    const { req, res } = mockReqRes({ query: { id: validId } });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

// ============================================================
// Error handling
// ============================================================

describe('Error handling', () => {
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

  test('29. returns 500 on Supabase connection error', async () => {
    // Make resolve_user_identity work but the target RPC fail
    setupMocks({
      rpcResponses: {
        get_active_session_state: {
          data: null,
          error: { message: 'connection refused', code: 'ECONNREFUSED' },
        },
      },
    });
    const handler = require('../../session-state/active').default;
    const { req, res } = mockReqRes({ method: 'GET' });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('30. returns 500 on RPC error for save route', async () => {
    setupMocks({
      rpcResponses: {
        save_session_progress: {
          data: null,
          error: { message: 'db error', code: '500' },
        },
      },
    });
    const handler = require('../../session-state/[id]/save').default;
    const { req, res } = mockReqRes({
      query: { id: '550e8400-e29b-41d4-a716-446655440000' },
      body: { currentIndex: 1 },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
