import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Storybook Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          border: '1px solid #ff6b6b', 
          borderRadius: '8px',
          backgroundColor: '#fff5f5',
          color: '#d63031'
        }}>
          <h3>Component Error in Storybook</h3>
          <p><strong>Error:</strong> {this.state.error?.message || 'Unknown error'}</p>
          <p><small>This component may require additional context or props that are not available in Storybook.</small></p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 