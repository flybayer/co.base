function getEnv(n) {
  return process.env[n];
}

module.exports = {
  production: {
    client: 'pg',
    connection: {
      ssl: !!getEnv('SQL_USE_SSL'),
      user: getEnv('SQL_USER'),
      password: getEnv('SQL_PASSWORD'),
      database: getEnv('SQL_DATABASE'),
      host: getEnv('SQL_HOST'),
    },
  },
};
