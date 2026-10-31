import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
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
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px 20px',
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 10
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

