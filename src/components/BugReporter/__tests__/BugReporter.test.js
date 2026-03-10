/**
 * @jest-environment jsdom
 */

// Tests for BugReporter component — SPEC-LLM-UI-001 through SPEC-LLM-UI-009
import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock html2canvas before importing component
jest.mock('html2canvas', () =>
  jest.fn(() =>
    Promise.resolve({
      toDataURL: () => 'data:image/png;base64,FAKEBASE64DATA',
    })
  )
);

// Mock PremiumContext
jest.mock('@/contexts/PremiumContext', () => ({
  usePremium: () => ({
    isPremium: false,
    sessionsUsedToday: 1,
    canStartSession: false,
    dailyLimit: 1,
  }),
}));

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark' }),
}));

// Mock useFetchLogger to avoid intercepting global.fetch
jest.mock('@/hooks/useFetchLogger', () => ({
  useFetchLogger: () => ({ current: [] }),
}));

// Mock useActionTrail to avoid document event listeners
jest.mock('@/hooks/useActionTrail', () => ({
  useActionTrail: () => ({ current: [] }),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Import component after mocks are set up
const BugReporter = (() => {
  try {
    return require('../BugReporter').default;
  } catch {
    return null;
  }
})();

const { BugReporterProvider } = require('@/contexts/BugReporterContext');

// Helper: render component inside required providers
function renderBugReporter() {
  if (!BugReporter) throw new Error('BugReporter module not implemented yet');
  return render(
    <BugReporterProvider>
      <BugReporter />
    </BugReporterProvider>
  );
}

// Helper: set up permission fetch mock
function mockPermission(allowed) {
  global.fetch.mockImplementation((url) => {
    if (url === '/api/bug-reporter/permission') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ allowed }),
      });
    }
    if (url === '/api/bug-reporter/report') {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            issueUrl: 'https://github.com/org/repo/issues/42',
            issueNumber: 42,
          }),
      });
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
// SPEC-LLM-UI-001: component must exist
// ─────────────────────────────────────────────
describe('SPEC-LLM-UI-001 — module exists', () => {
  it('exports a default React component', () => {
    expect(BugReporter).not.toBeNull();
    expect(typeof BugReporter).toBe('function');
  });
});

// ─────────────────────────────────────────────
// SPEC-LLM-UI-002: does not render when permission denied
// ─────────────────────────────────────────────
describe('SPEC-LLM-UI-002 — hidden when permission denied', () => {
  it('renders nothing when /api/bug-reporter/permission returns allowed: false', async () => {
    mockPermission(false);
    const { container } = renderBugReporter();
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith('/api/bug-reporter/permission')
    );
    expect(screen.queryByRole('button', { name: /bug/i })).toBeNull();
    expect(container.firstChild).toBeNull();
  });
});

// ─────────────────────────────────────────────
// SPEC-LLM-UI-003: renders floating button when allowed
// ─────────────────────────────────────────────
describe('SPEC-LLM-UI-003 — floating button when allowed', () => {
  it('renders a floating bug button when permission is granted', async () => {
    mockPermission(true);
    renderBugReporter();
    const button = await screen.findByTestId('bug-reporter-button');
    expect(button).toBeInTheDocument();
  });

  it('bug button has fixed positioning styles', async () => {
    mockPermission(true);
    renderBugReporter();
    const button = await screen.findByTestId('bug-reporter-button');
    expect(button.style.position).toBe('fixed');
    expect(button).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// SPEC-LLM-UI-004: opens modal on button click
// ─────────────────────────────────────────────
describe('SPEC-LLM-UI-004 — modal opens on button click', () => {
  it('shows the report modal when the floating button is clicked', async () => {
    mockPermission(true);
    renderBugReporter();
    const button = await screen.findByTestId('bug-reporter-button');
    fireEvent.click(button);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// SPEC-LLM-UI-005: modal contains required fields
// ─────────────────────────────────────────────
describe('SPEC-LLM-UI-005 — modal has required form fields', () => {
  async function openModal() {
    mockPermission(true);
    renderBugReporter();
    const button = await screen.findByTestId('bug-reporter-button');
    fireEvent.click(button);
  }

  it('has a title text input', async () => {
    await openModal();
    expect(screen.getByTestId('bug-title-input')).toBeInTheDocument();
  });

  it('has a description textarea', async () => {
    await openModal();
    expect(screen.getByTestId('bug-description-input')).toBeInTheDocument();
  });

  it('has severity radio buttons for Cosmetic, Broken, Crash', async () => {
    await openModal();
    expect(screen.getByLabelText(/cosmetic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/broken/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/crash/i)).toBeInTheDocument();
  });

  it('has an include screenshot checkbox checked by default', async () => {
    await openModal();
    const checkbox = screen.getByTestId('screenshot-checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox.checked).toBe(true);
  });
});

// ─────────────────────────────────────────────
// SPEC-LLM-UI-006: submit disabled when required fields empty
// ─────────────────────────────────────────────
describe('SPEC-LLM-UI-006 — submit disabled when fields empty', () => {
  it('disables submit button when title and description are empty', async () => {
    mockPermission(true);
    renderBugReporter();
    const button = await screen.findByTestId('bug-reporter-button');
    fireEvent.click(button);
    const submitBtn = screen.getByTestId('bug-submit-button');
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit button when title and description are filled', async () => {
    mockPermission(true);
    renderBugReporter();
    const button = await screen.findByTestId('bug-reporter-button');
    fireEvent.click(button);
    fireEvent.change(screen.getByTestId('bug-title-input'), {
      target: { value: 'Something broke' },
    });
    fireEvent.change(screen.getByTestId('bug-description-input'), {
      target: { value: 'It was working before' },
    });
    expect(screen.getByTestId('bug-submit-button')).not.toBeDisabled();
  });
});

// ─────────────────────────────────────────────
// SPEC-LLM-UI-007: calls /api/bug-reporter/report on submit
// ─────────────────────────────────────────────
describe('SPEC-LLM-UI-007 — POSTs correct payload on submit', () => {
  it('calls /api/bug-reporter/report with title, description, severity, context including new fields', async () => {
    mockPermission(true);
    renderBugReporter();
    const button = await screen.findByTestId('bug-reporter-button');
    fireEvent.click(button);

    fireEvent.change(screen.getByTestId('bug-title-input'), {
      target: { value: 'Login button missing' },
    });
    fireEvent.change(screen.getByTestId('bug-description-input'), {
      target: { value: 'The login button is not visible on mobile' },
    });
    const checkbox = screen.getByTestId('screenshot-checkbox');
    if (checkbox.checked) fireEvent.click(checkbox);

    await act(async () => {
      fireEvent.click(screen.getByTestId('bug-submit-button'));
    });

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/bug-reporter/report',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    );

    const reportCall = global.fetch.mock.calls.find(
      ([url]) => url === '/api/bug-reporter/report'
    );
    const body = JSON.parse(reportCall[1].body);
    expect(body.title).toBe('Login button missing');
    expect(body.description).toBe('The login button is not visible on mobile');
    expect(['cosmetic', 'broken', 'crash']).toContain(body.severity);
    expect(body.context).toBeDefined();
    expect(body.context.url).toBeDefined();
    expect(body.context.route).toBeDefined();
    expect(body.context.viewport).toBeDefined();
    expect(body.context.userAgent).toBeDefined();
    expect(body.context.timestamp).toBeDefined();
    // New fields
    expect(body.context.sourceFile).toBeDefined();
    expect(Array.isArray(body.context.networkRequests)).toBe(true);
    expect(Array.isArray(body.context.actionTrail)).toBe(true);
    expect(body.context.appState).toBeDefined();
    expect(body.context.appState.theme).toBe('dark');
    expect(body.context.appState.isPremium).toBe(false);
    expect(body.context.appState.sessionsUsedToday).toBe(1);
    expect(body.context.appState.dailyLimit).toBe(1);
  });
});

// ─────────────────────────────────────────────
// SPEC-LLM-UI-008: shows success message after submit
// ─────────────────────────────────────────────
describe('SPEC-LLM-UI-008 — success message after submission', () => {
  it('shows success message with GitHub issue link after submit', async () => {
    mockPermission(true);
    renderBugReporter();
    const button = await screen.findByTestId('bug-reporter-button');
    fireEvent.click(button);

    fireEvent.change(screen.getByTestId('bug-title-input'), {
      target: { value: 'Crash on load' },
    });
    fireEvent.change(screen.getByTestId('bug-description-input'), {
      target: { value: 'App crashes when loading sets page' },
    });
    const checkbox = screen.getByTestId('screenshot-checkbox');
    if (checkbox.checked) fireEvent.click(checkbox);

    await act(async () => {
      fireEvent.click(screen.getByTestId('bug-submit-button'));
    });

    await waitFor(() =>
      expect(screen.getByTestId('bug-success-message')).toBeInTheDocument()
    );
    expect(
      screen.getByRole('link', { name: /view issue/i })
    ).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────
// SPEC-LLM-UI-009: closes modal on cancel
// ─────────────────────────────────────────────
describe('SPEC-LLM-UI-009 — cancel button closes modal', () => {
  it('closes the modal when Cancel is clicked', async () => {
    mockPermission(true);
    renderBugReporter();
    const button = await screen.findByTestId('bug-reporter-button');
    fireEvent.click(button);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('bug-cancel-button'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

// ─────────────────────────────────────────────
// SPEC-LLM-UI-010: console errors captured in context
// ─────────────────────────────────────────────
describe('SPEC-LLM-UI-010 — console errors captured in context', () => {
  it('includes consoleErrors array in submitted context', async () => {
    mockPermission(true);
    renderBugReporter();
    const button = await screen.findByTestId('bug-reporter-button');

    fireEvent.click(button);

    fireEvent.change(screen.getByTestId('bug-title-input'), {
      target: { value: 'Error test' },
    });
    fireEvent.change(screen.getByTestId('bug-description-input'), {
      target: { value: 'Testing error capture' },
    });
    const checkbox = screen.getByTestId('screenshot-checkbox');
    if (checkbox.checked) fireEvent.click(checkbox);

    await act(async () => {
      fireEvent.click(screen.getByTestId('bug-submit-button'));
    });

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/bug-reporter/report',
        expect.anything()
      )
    );

    const reportCall = global.fetch.mock.calls.find(
      ([url]) => url === '/api/bug-reporter/report'
    );
    const body = JSON.parse(reportCall[1].body);
    expect(Array.isArray(body.context.consoleErrors)).toBe(true);
  });
});
