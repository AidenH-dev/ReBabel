/**
 * Tests for POST /api/bug-reporter/report
 * Tests SPEC-LLM-002
 */

jest.mock('@auth0/nextjs-auth0', () => ({
  withApiAuthRequired: (fn) => fn,
  getSession: jest.fn(),
}));

jest.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    schema: jest.fn(),
  },
}));

// Mock global fetch for GitHub API calls
global.fetch = jest.fn();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockReqRes({ method = 'POST', body = {} } = {}) {
  const req = { method, body };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return { req, res };
}

/** Minimal valid report body covering all required fields. */
const validBody = {
  title: 'Button does not respond',
  description: 'Clicking the submit button does nothing.',
  severity: 'broken',
  context: {
    url: 'https://app.rebabel.io/learn/grammar',
    route: '/learn/grammar',
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0',
    consoleErrors: [],
    timestamp: '2026-03-09T10:00:00.000Z',
    componentTree: 'App > GrammarPage > SubmitButton',
  },
};

/** Configure the permission RPC to return the given boolean. */
function mockPermission(allowed) {
  const { supabaseAdmin } = require('@/lib/supabaseAdmin');
  const rpcMock = jest.fn().mockResolvedValue({ data: allowed, error: null });
  supabaseAdmin.schema.mockReturnValue({ rpc: rpcMock });
  return rpcMock;
}

/** Configure fetch for a successful GitHub issue creation. */
function mockGitHubSuccess({
  issueNumber = 42,
  issueUrl = 'https://github.com/owner/repo/issues/42',
} = {}) {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ number: issueNumber, html_url: issueUrl }),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/bug-reporter/report', () => {
  let handler;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    jest.mock('@auth0/nextjs-auth0', () => ({
      withApiAuthRequired: (fn) => fn,
      getSession: jest.fn(),
    }));
    jest.mock('@/lib/supabaseAdmin', () => ({
      supabaseAdmin: {
        schema: jest.fn(),
      },
    }));

    process.env.GITHUB_PAT = 'ghp_testtoken';
    process.env.GITHUB_REPO = 'owner/repo';

    handler = require('../report').default;
  });

  // Tests SPEC-LLM-002: Reject unauthenticated requests
  test('returns 401 when session is missing', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue(null);

    const { req, res } = mockReqRes({ body: validBody });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  // Tests SPEC-LLM-002: Reject unauthenticated requests (no user sub)
  test('returns 401 when session has no user sub', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({ user: {} });

    const { req, res } = mockReqRes({ body: validBody });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  // Tests SPEC-LLM-002: Reject non-POST methods
  test('returns 405 for non-POST methods', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'u@test.com' },
    });

    const { req, res } = mockReqRes({ method: 'GET', body: validBody });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  // Tests SPEC-LLM-002: Reject users without bug reporter permission
  test('returns 403 when user does not have bug reporter permission', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|noperm', email: 'noperm@test.com' },
    });
    mockPermission(false);

    const { req, res } = mockReqRes({ body: validBody });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    );
  });

  // Tests SPEC-LLM-002: Reject missing required field — title
  test('returns 400 when title is missing', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'u@test.com' },
    });
    mockPermission(true);

    const body = { ...validBody };
    delete body.title;

    const { req, res } = mockReqRes({ body });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Tests SPEC-LLM-002: Reject missing required field — description
  test('returns 400 when description is missing', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'u@test.com' },
    });
    mockPermission(true);

    const body = { ...validBody };
    delete body.description;

    const { req, res } = mockReqRes({ body });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Tests SPEC-LLM-002: Reject invalid severity value
  test('returns 400 when severity is not a valid value', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'u@test.com' },
    });
    mockPermission(true);

    const { req, res } = mockReqRes({
      body: { ...validBody, severity: 'unknown-level' },
    });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Tests SPEC-LLM-002: Reject missing context object
  test('returns 400 when context is missing', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'u@test.com' },
    });
    mockPermission(true);

    const body = { ...validBody };
    delete body.context;

    const { req, res } = mockReqRes({ body });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Tests SPEC-LLM-002: Successful issue creation returns 200 with issue URL and number
  test('returns 200 with issueUrl and issueNumber on success', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'reporter@test.com' },
    });
    mockPermission(true);
    mockGitHubSuccess({
      issueNumber: 7,
      issueUrl: 'https://github.com/owner/repo/issues/7',
    });

    const { req, res } = mockReqRes({ body: validBody });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      issueUrl: 'https://github.com/owner/repo/issues/7',
      issueNumber: 7,
    });
  });

  // Tests SPEC-LLM-002: GitHub API is called with correct repo and auth header
  test('calls GitHub API with correct URL and Authorization header', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'reporter@test.com' },
    });
    mockPermission(true);
    mockGitHubSuccess();

    const { req, res } = mockReqRes({ body: validBody });
    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/owner/repo/issues',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer ghp_testtoken',
        }),
      })
    );
  });

  // Tests SPEC-LLM-002: Issue body contains all required context sections
  test('formats GitHub issue body with severity, reporter, page, description, and environment', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'reporter@test.com' },
    });
    mockPermission(true);
    mockGitHubSuccess();

    const { req, res } = mockReqRes({ body: validBody });
    await handler(req, res);

    const fetchCall =
      global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const issuePayload = JSON.parse(fetchCall[1].body);

    expect(issuePayload.body).toContain('broken');
    expect(issuePayload.body).toContain('reporter@test.com');
    expect(issuePayload.body).toContain('https://app.rebabel.io/learn/grammar');
    expect(issuePayload.body).toContain(
      'Clicking the submit button does nothing.'
    );
    expect(issuePayload.body).toContain('1440x900');
    expect(issuePayload.body).toContain('Mozilla/5.0');
    expect(issuePayload.body).toContain(
      'Auto-generated by ReBabel Bug Reporter'
    );
  });

  // Tests enhanced issue body: network requests section
  test('renders network requests table when present in context', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'reporter@test.com' },
    });
    mockPermission(true);
    mockGitHubSuccess();

    const bodyWithNetwork = {
      ...validBody,
      context: {
        ...validBody.context,
        networkRequests: [
          { method: 'GET', url: '/api/test', status: 200, durationMs: 150 },
          {
            method: 'POST',
            url: '/api/broken',
            status: 500,
            durationMs: 800,
            bodyPreview: '{"error":"db down"}',
          },
        ],
      },
    };

    const { req, res } = mockReqRes({ body: bodyWithNetwork });
    await handler(req, res);

    const fetchCall =
      global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const issuePayload = JSON.parse(fetchCall[1].body);

    expect(issuePayload.body).toContain('Recent API Calls');
    expect(issuePayload.body).toContain('/api/test');
    expect(issuePayload.body).toContain('150ms');
    expect(issuePayload.body).toContain('/api/broken');
    expect(issuePayload.body).toContain('500');
    expect(issuePayload.body).toContain('{"error":"db down"}');
  });

  // Tests enhanced issue body: action trail section
  test('renders action trail when present in context', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'reporter@test.com' },
    });
    mockPermission(true);
    mockGitHubSuccess();

    const bodyWithTrail = {
      ...validBody,
      context: {
        ...validBody.context,
        actionTrail: [
          {
            timestamp: '2026-03-10T14:32:01.000Z',
            eventType: 'click',
            tag: 'button',
            text: 'Start',
            testId: 'start-btn',
          },
        ],
      },
    };

    const { req, res } = mockReqRes({ body: bodyWithTrail });
    await handler(req, res);

    const fetchCall =
      global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const issuePayload = JSON.parse(fetchCall[1].body);

    expect(issuePayload.body).toContain('User Action Trail');
    expect(issuePayload.body).toContain('click button');
    expect(issuePayload.body).toContain('"Start"');
    expect(issuePayload.body).toContain('start-btn');
  });

  // Tests enhanced issue body: source file
  test('renders source file when present in context', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'reporter@test.com' },
    });
    mockPermission(true);
    mockGitHubSuccess();

    const bodyWithSource = {
      ...validBody,
      context: {
        ...validBody.context,
        sourceFile: 'src/pages/learn/grammar.js',
      },
    };

    const { req, res } = mockReqRes({ body: bodyWithSource });
    await handler(req, res);

    const fetchCall =
      global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const issuePayload = JSON.parse(fetchCall[1].body);

    expect(issuePayload.body).toContain('src/pages/learn/grammar.js');
  });

  // Tests enhanced issue body: application state
  test('renders application state section when present', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'reporter@test.com' },
    });
    mockPermission(true);
    mockGitHubSuccess();

    const bodyWithState = {
      ...validBody,
      context: {
        ...validBody.context,
        appState: {
          theme: 'dark',
          isPremium: false,
          sessionsUsedToday: 1,
          dailyLimit: 1,
          canStartSession: false,
        },
      },
    };

    const { req, res } = mockReqRes({ body: bodyWithState });
    await handler(req, res);

    const fetchCall =
      global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const issuePayload = JSON.parse(fetchCall[1].body);

    expect(issuePayload.body).toContain('Application State');
    expect(issuePayload.body).toContain('Theme: dark');
    expect(issuePayload.body).toContain('Premium: false');
    expect(issuePayload.body).toContain('Sessions today: 1 / 1');
  });

  // Tests enhanced issue body: error boundary / React crash
  test('renders React crash section when errorBoundary data present', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'reporter@test.com' },
    });
    mockPermission(true);
    mockGitHubSuccess();

    const bodyWithCrash = {
      ...validBody,
      context: {
        ...validBody.context,
        errorBoundary: {
          error: 'Cannot read properties of undefined',
          stack: 'Error: Cannot read...',
          componentStack: '\n    at SRSCard\n    at StudyPage',
        },
      },
    };

    const { req, res } = mockReqRes({ body: bodyWithCrash });
    await handler(req, res);

    const fetchCall =
      global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const issuePayload = JSON.parse(fetchCall[1].body);

    expect(issuePayload.body).toContain('React Crash');
    expect(issuePayload.body).toContain('Cannot read properties of undefined');
    expect(issuePayload.body).toContain('Component Stack');
    expect(issuePayload.body).toContain('SRSCard');
  });

  // Tests backward compat: old context shape without new fields still works
  test('handles old context shape without new fields (backward compat)', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'reporter@test.com' },
    });
    mockPermission(true);
    mockGitHubSuccess();

    // Old-style context with no new fields
    const oldBody = {
      ...validBody,
      context: {
        url: 'https://app.rebabel.io/learn',
        route: '/learn',
        viewport: { width: 1440, height: 900 },
        userAgent: 'Mozilla/5.0',
        consoleErrors: [],
        timestamp: '2026-03-09T10:00:00.000Z',
        componentTree: 'App > LearnPage',
      },
    };

    const { req, res } = mockReqRes({ body: oldBody });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    const fetchCall =
      global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const issuePayload = JSON.parse(fetchCall[1].body);

    // Should still render the basic sections without errors
    expect(issuePayload.body).toContain('Bug Report');
    expect(issuePayload.body).toContain('/learn');
    expect(issuePayload.body).not.toContain('Recent API Calls');
    expect(issuePayload.body).not.toContain('User Action Trail');
    expect(issuePayload.body).not.toContain('Application State');
    expect(issuePayload.body).not.toContain('React Crash');
  });

  // Tests SPEC-LLM-002: Issue is created with correct title
  test('sets the GitHub issue title to the provided title', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'reporter@test.com' },
    });
    mockPermission(true);
    mockGitHubSuccess();

    const { req, res } = mockReqRes({ body: validBody });
    await handler(req, res);

    const fetchCall =
      global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const issuePayload = JSON.parse(fetchCall[1].body);

    expect(issuePayload.title).toBe('Button does not respond');
  });

  // Tests SPEC-LLM-002: Issue labels include "bug" and the severity label
  test('adds bug label and severity label to the GitHub issue', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'reporter@test.com' },
    });
    mockPermission(true);
    mockGitHubSuccess();

    const { req, res } = mockReqRes({ body: validBody });
    await handler(req, res);

    const fetchCall =
      global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
    const issuePayload = JSON.parse(fetchCall[1].body);

    expect(issuePayload.labels).toContain('bug');
    expect(issuePayload.labels).toContain('severity:broken');
  });

  // Tests SPEC-LLM-002: All three valid severity values are accepted
  test.each(['cosmetic', 'broken', 'crash'])(
    'accepts severity value "%s"',
    async (severity) => {
      const { getSession } = require('@auth0/nextjs-auth0');
      getSession.mockResolvedValue({
        user: { sub: 'auth0|user123', email: 'u@test.com' },
      });
      mockPermission(true);
      mockGitHubSuccess();

      const { req, res } = mockReqRes({ body: { ...validBody, severity } });
      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    }
  );

  // Tests SPEC-LLM-002: Screenshot is uploaded as a repo file and referenced in the issue body
  test('uploads screenshot to repo and embeds URL in issue body', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'reporter@test.com' },
    });
    mockPermission(true);

    // First fetch = upload screenshot to Contents API
    // Second fetch = create the issue
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: {
            html_url:
              'https://github.com/owner/repo/blob/main/bug-reports/screenshots/test.png',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          number: 5,
          html_url: 'https://github.com/owner/repo/issues/5',
        }),
      });

    const bodyWithScreenshot = {
      ...validBody,
      screenshot:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };
    const { req, res } = mockReqRes({ body: bodyWithScreenshot });
    await handler(req, res);

    // First call should be to the Contents API
    const firstCall = global.fetch.mock.calls[0];
    expect(firstCall[0]).toContain(
      'https://api.github.com/repos/owner/repo/contents/bug-reports/screenshots/'
    );
    expect(firstCall[1].method).toBe('PUT');

    // Issue body should embed the screenshot URL
    const secondCall = global.fetch.mock.calls[1];
    const issuePayload = JSON.parse(secondCall[1].body);
    expect(issuePayload.body).toContain(
      'https://github.com/owner/repo/blob/main/bug-reports/screenshots/'
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  // Tests SPEC-LLM-002: Returns 500 when GitHub API request fails
  test('returns 500 when GitHub API returns an error response', async () => {
    const { getSession } = require('@auth0/nextjs-auth0');
    getSession.mockResolvedValue({
      user: { sub: 'auth0|user123', email: 'reporter@test.com' },
    });
    mockPermission(true);

    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Not Found' }),
    });

    const { req, res } = mockReqRes({ body: validBody });
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
