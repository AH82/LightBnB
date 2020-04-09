const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  // user: 'labber',
  password: '123',
  // password: 'labber',
  host: 'localhost',
  database: 'lightbnb'
});


module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback)
  },
}
