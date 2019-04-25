const Knex = require('knex');

function connect() {

  const config = {
    user: process.env.SQL_USER || 'root',
    password: process.env.SQL_PASSWORD || 'tornado135!',
    database: process.env.SQL_DATABASE || 'camelia',
    socketPath:  `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
    // port: 3306,
    // host: 'localhost'

  };

  // Connect to the database
  const knex = Knex({
    client: 'mysql',
    connection: config
  });
  console.log(config);
  console.log("SQL connect!");
  return knex;
}

const knex = connect();

module.exports = knex
