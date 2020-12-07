module.exports = {
  /**
   * Navigators
   */
  get createStackTransitionNavigator() {
    return require('./createStackTransitionNavigator').default;
  },

  get Shared() {
    return require('./Shared');
  },

  /**
   * Views
   */
  get Transitioner() {
    return require('./Transitioner').default;
  },

  get PerformanceDebugging() {
    return require('./PerformanceDebugging').default;
  },
};
