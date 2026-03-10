/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BugReporterErrorBoundary from '../BugReporterErrorBoundary';
import { BugReporterProvider } from '@/contexts/BugReporterContext';

// Component that throws on render
function ThrowingComponent({ shouldThrow }) {
  if (shouldThrow) throw new Error('Test crash');
  return <div>Normal content</div>;
}

// Suppress expected React error boundary console output
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  console.error.mockRestore();
});

describe('BugReporterErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <BugReporterProvider>
        <BugReporterErrorBoundary>
          <div>Safe content</div>
        </BugReporterErrorBoundary>
      </BugReporterProvider>
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('shows fallback UI when a child component crashes', () => {
    render(
      <BugReporterProvider>
        <BugReporterErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BugReporterErrorBoundary>
      </BugReporterProvider>
    );

    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByTestId('report-crash-button')).toBeInTheDocument();
  });

  it('calls openReporterRef when "Report this crash" is clicked', () => {
    const openMock = jest.fn();

    // Render with a pre-wired openReporterRef
    function TestWrapper() {
      const ctx =
        require('@/contexts/BugReporterContext').useBugReporterContext();
      React.useEffect(() => {
        ctx.openReporterRef.current = openMock;
      }, [ctx.openReporterRef]);
      return (
        <BugReporterErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </BugReporterErrorBoundary>
      );
    }

    render(
      <BugReporterProvider>
        <TestWrapper />
      </BugReporterProvider>
    );

    fireEvent.click(screen.getByTestId('report-crash-button'));
    expect(openMock).toHaveBeenCalled();
  });
});
