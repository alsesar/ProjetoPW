import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep the original error available in the console for debugging classes and examples.
    console.error('Application render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { children, fallback: FallbackComponent } = this.props;
    const { error } = this.state;

    if (error && FallbackComponent) {
      return <FallbackComponent error={error} onReset={this.handleReset} />;
    }

    return children;
  }
}
