import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/subjects';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary, #09090c)',
          color: '#ffffff',
          padding: 24,
          textAlign: 'center',
          position: 'relative',
          zIndex: 100
        }}>
          <div style={{
            maxWidth: 500,
            padding: 32,
            borderRadius: 20,
            background: 'var(--bg-card, #121217)',
            border: '1px solid var(--theme-accent-border, rgba(129,140,248,0.4))',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(244,63,94,0.15)',
              border: '1px solid rgba(244,63,94,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 22
            }}>
              ⚡
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
              Adaptive Interface State Recovered
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.6, marginBottom: 24 }}>
              CogFlow encountered a transient render state while synchronizing real-time telemetry. Click below to smoothly resume your curriculum session.
            </p>
            <details style={{ marginBottom: 20, textAlign: 'left', color: '#cbd5e1', fontSize: 12 }}>
              <summary style={{ cursor: 'pointer', marginBottom: 8 }}>View error details</summary>
              <pre style={{
                maxHeight: 220,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                padding: 12,
                borderRadius: 8,
                background: '#09090c',
                color: '#fecaca',
                fontSize: 11,
                lineHeight: 1.5
              }}>
                {this.state.error?.toString()}
                {this.state.errorInfo?.componentStack || ''}
              </pre>
            </details>
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px 20px',
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 10,
                border: '1px solid #818cf8',
                background: '#4f46e5',
                color: '#ffffff',
                cursor: 'pointer',
                appearance: 'none'
              }}
            >
              Resume Curriculum Catalog →
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

