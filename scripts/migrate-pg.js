const pathJoin = require('path').join;
const spawn = require('@expo/spawn-async');
const envPrefix = process.argv[2];
require('dotenv').config();
const Knex = require('knex');

function getEnv(name) {
  if (envPrefix) {
    return process.env[`${envPrefix}${name}`];
  } else {
    return process.env[name];
  }
}
async function run() {
  const conn = {
    host: getEnv('SQL_HOST'),
    port: Number(getEnv('SQL_PORT')),
    user: getEnv('SQL_USER'),
    passsword: getEnv('SQL_PASSWORD'),
    database: getEnv('SQL_DATABASE'),
    ssl: !!getEnv('SQL_USE_SSL')
      ? {
          rejectUnauthorized: false,
        }
      : false,
  };
  const knex = Knex({
    client: 'pg',
    connection: conn,
    useNullAsDefault: true,
  });
  console.log('letsgo', conn);
  await knex.migrate.latest({
    directory: pathJoin(__dirname, '../src/aven/cloud-postgres/migrations'),
  });

  console.log('conn', conn);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
