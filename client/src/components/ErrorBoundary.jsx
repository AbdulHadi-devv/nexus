import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="not-found-page">
          <div className="not-found-content">
            <div className="not-found-code">
              <AlertTriangle size={96} strokeWidth={1.2} style={{ color: '#ef4444', opacity: 0.5 }} />
            </div>
            <h1 className="not-found-title">Something went wrong</h1>
            <p className="not-found-message">
              We're sorry, an unexpected error occurred. Please try again.
            </p>
            {this.state.error && (
              <details style={{ textAlign: 'left', marginBottom: '20px', padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', fontSize: '0.8rem' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Error details</summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: 'var(--text-muted)' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="not-found-actions">
              <button onClick={this.handleReset} className="primary-button">
                <Home size={16} /> Go to Home
              </button>
              <button onClick={() => window.location.reload()} className="cancel-button">
                <RefreshCw size={16} /> Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;