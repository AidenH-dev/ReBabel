import React from 'react';
import {
  BugReporterProvider,
  useBugReporterContext,
} from '@/contexts/BugReporterContext';

// Wrapper to inject context into the class component via render prop
function ErrorBoundaryWithContext({ children }) {
  const { setErrorData, openReporterRef } = useBugReporterContext();
  return (
    <BugReporterErrorBoundaryInner
      setErrorData={setErrorData}
      openReporterRef={openReporterRef}
    >
      {children}
    </BugReporterErrorBoundaryInner>
  );
}

class BugReporterErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const { setErrorData } = this.props;
    setErrorData({
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack || null,
    });
  }

  handleReport = () => {
    const { openReporterRef } = this.props;
    if (openReporterRef.current) {
      openReporterRef.current();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="error-boundary-fallback"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>!</div>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 600,
              marginBottom: '8px',
              color: '#1a1a1a',
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '24px',
              maxWidth: '400px',
            }}
          >
            The app crashed unexpectedly. You can report this crash so it gets
            fixed.
          </p>
          <button
            data-testid="report-crash-button"
            onClick={this.handleReport}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#fff',
              backgroundColor: '#da1c60',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Report this crash
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryWithContext;
