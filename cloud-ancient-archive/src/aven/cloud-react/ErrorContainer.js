import React from 'react';

// This simple class component allows us to use functions to define an error boundary ;-)

export const ErrorContext = React.createContext(null);

export default class ErrorContainer extends React.Component {
  state = { error: null, errorInfo: null };
  static contextType = ErrorContext;
  componentDidCatch(e, i) {
    this.handleCatch(e, i);
  }
  handleCatch = (e, i) => {
    const { onCatch, canCatchError } = this.props;
    if (canCatchError && !canCatchError(e, i)) {
      if (this.context && this.context.handleCatch) {
        return this.context.handleCatch(e, i, this.retry);
      }
      throw e;
    }
    this.setState({ error: e, errorInfo: i });
    onCatch && onCatch(e, i, this.retry);
  };
  retry = () => {
    this.setState({ error: null, errorInfo: null });
  };
  renderContent() {
    if (this.state.error) {
      return this.props.renderError({
        error: this.state.error,
        errorInfo: this.state.errorInfo,
        onRetry: this.retry,
      });
    }
    return this.props.children;
  }
  render() {
    return (
      <ErrorContext.Provider value={this}>
        {this.renderContent()}
      </ErrorContext.Provider>
    );
  }
}
