const current_env_database = JSON.parse(process.env.ENVIRONMENT)

module.exports = {
  env_db : require("knex")({
    client: 'mysql',
    connection: {
      host: current_env_database.DATABASE_HOST,
      port: 3306,
      user: current_env_database.DATABASE_USER,
      password: current_env_database.DATABASE_PASSWORD,
      database : current_env_database.DATABASE
    }
  }),
  account_db : require("knex")({
    client: 'mysql',
    connection: {
      host: current_env_database.DATABASE_HOST,
      port: 3306,
      user: current_env_database.DATABASE_USER,
      password: current_env_database.DATABASE_PASSWORD,
      database: current_env_database.ACCOUNT_DATABASE
    }
  })
};