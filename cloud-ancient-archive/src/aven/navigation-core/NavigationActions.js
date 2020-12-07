const BACK = 'Navigation/BACK';
const INIT = 'Navigation/INIT';
const NAVIGATE = 'Navigation/NAVIGATE';
const SET_PARAMS = 'Navigation/SET_PARAMS';
const URL = 'Navigation/URL';

const back = (payload = {}) => ({
  type: BACK,
  key: payload.key,
  immediate: payload.immediate,
});

const url = inputUrl => ({
  type: URL,
  url: inputUrl,
});

const init = (payload = {}) => {
  const action = {
    type: INIT,
  };
  if (payload.params) {
    action.params = payload.params;
  }
  return action;
};

const navigate = payload => {
  const action = {
    type: NAVIGATE,
    routeName: payload.routeName,
  };
  if (payload.params) {
    action.params = payload.params;
  }
  if (payload.action) {
    action.action = payload.action;
  }
  if (payload.key) {
    action.key = payload.key;
  }
  return action;
};

const setParams = payload => ({
  type: SET_PARAMS,
  key: payload.key,
  params: payload.params,
});

export default {
  // Action constants
  BACK,
  INIT,
  NAVIGATE,
  SET_PARAMS,
  URL,

  // Action creators
  back,
  init,
  navigate,
  setParams,
  url,
};
