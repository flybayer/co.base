const _pubConfig =
  process.env.PUBLIC_CONFIG_JSON && JSON.parse(process.env.PUBLIC_CONFIG_JSON);
export const getPublicConfig = valueName => {
  if (process.env[valueName]) {
    return process.env[valueName];
  }
  if (_pubConfig && _pubConfig[valueName] !== undefined) {
    return _pubConfig[valueName];
  }
  return process.env[valueName];
};
const _secretConfig =
  process.env.SECRET_CONFIG_JSON && JSON.parse(process.env.SECRET_CONFIG_JSON);
export const getSecretConfig = valueName => {
  if (process.env[valueName]) {
    return process.env[valueName];
  }
  if (_secretConfig && _secretConfig[valueName] !== undefined) {
    return _secretConfig[valueName];
  }
  return process.env[valueName];
};

export const IS_DEV = process.env.NODE_ENV !== 'production';
