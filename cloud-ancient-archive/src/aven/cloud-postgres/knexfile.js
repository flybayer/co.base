
module.exports = {
  production: {
    client: 'pg',
    connection: {
      ssl: !!process.env.SQL_USE_SSL
        ? {
            rejectUnauthorized: false,
          }
        : false,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DATABASE,
      host: process.env.SQL_HOST,
      port: process.env.SQL_PORT,
    },
  },
};
