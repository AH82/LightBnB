// const properties = require('./json/properties.json');
// const users = require('./json/users.json');
// const {Pool} = require('pg');
const pool = require('./db'); /* directory goes to default --> /index.js */

// Connecting to the lightbnb database
// const pool = new Pool({
//   user: 'vagrant',
//   // user: 'labber',
//   password: '123',
//   // password: 'labber',
//   host: 'localhost',
//   database: 'lightbnb'
// });

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const query = `
  SELECT id, name, email, password
  FROM users
  WHERE email = $1;
  `;
  const values = [`${email}`];
  return pool.query(query, values)
  .then(res => {
    // console.log(res)
    if (res.rows[0]) {
      // console.log('yoooohooooo');
      // console.log(res);
      return res.rows[0];
    } else return null;
  });
  
  
  // let user;
  // for (const userId in users) {
  //   user = users[userId];
  //   if (user.email.toLowerCase() === email.toLowerCase()) {
  //     break;
  //   } else {
  //     user = null;
  //   }
  // }
  // return Promise.resolve(user);
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const query = `
  SELECT id, name, email, password
  FROM users
  WHERE id = $1;
  `;
  const values = [`${id}`];
  return pool.query(query, values)
  .then(res => res.rows[0] ? res.rows[0] : null);
  
  // return Promise.resolve(users[id]);
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) { //user is object
  const query = `
  INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3) RETURNING *;
  `;
  const values = [
    `${user.name}`, 
    `${user.email}`, 
    `${user.password}`
  ];
  return pool.query(query, values)
  .then(res => {
    return res.rows[0];
  });

  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  const query = `
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;
  `;
  // masonwhitfield@outlook.com
  const values = [`${guest_id}`, `${limit}`];
  return pool.query(query, values)
  .then(res => {
    console.log(res.rows)
    return res.rows});
  // return getAllProperties(null, 2);
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;
  if (Object.keys(options)[0]) {
    queryString += `WHERE `
  }
  // 3
  if (options.city) {
    if (queryParams[0]) { queryString +=`AND ` };
    queryParams.push(`%${options.city}%`);
    queryString += `city LIKE $${queryParams.length} `;
  }
  if (options.owner_id) {
    if (queryParams[0]) { queryString +=`AND ` };
    queryParams.push(options.owner_id);
    queryString += `properties.owner_id = $${queryParams.length} `;
  }
  if (options.minimum_price_per_night) {
    if (queryParams[0]) { queryString +=`AND ` };
    queryParams.push(options.minimum_price_per_night);
    queryString += `properties.cost_per_night >= $${queryParams.length} `;
  }
  if (options.maximum_price_per_night) {
    if (queryParams[0]) { queryString +=`AND ` };
    queryParams.push(options.maximum_price_per_night);
    queryString += `properties.cost_per_night <= $${queryParams.length} `;
  }

  // 4
  queryString += `
  GROUP BY properties.id
  `;
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }
  
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams)
  .then(res => res.rows);

  // .catch(err => console.error('query error', err.stack));
  
  //   const limitedProperties = {};
  //   for (let i = 1; i <= limit; i++) {
  //     limitedProperties[i] = properties[i];
  //   }
  //   return Promise.resolve(limitedProperties);
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  
  const queryParams = [
    `${property.owner_id}`,
    `${property.title}`,
    `${property.description}`,
    `${property.thumbnail_photo_url}`,
    `${property.cover_photo_url}`,
    `${property.cost_per_night}`,
    `${property.street}`,
    `${property.city}`,
    `${property.province}`,
    `${property.post_code}`,
    `${property.country}`,
    `${property.parking_spaces}`,
    `${property.number_of_bathrooms}`,
    `${property.number_of_bedrooms}`
  ];
  
  let queryString = `
  INSERT INTO properties (
    owner_id,
    title,
    description,
    thumbnail_photo_url,
    cover_photo_url,
    cost_per_night,
    street,
    city,
    province,
    post_code,
    country,
    parking_spaces,
    number_of_bathrooms,
    number_of_bedrooms
  )
  VALUES (`
    for (let i = 1; i <= queryParams.length; i++) {
      queryString += `$${i}${(i === queryParams.length) ? ``:`, `}`;
    };
    queryString += `)
  RETURNING *;
  `;

    // 5
    console.log(queryString, queryParams);

    // 6
    return pool.query(queryString, queryParams)
    .then(res => res.rows);

  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);
}
exports.addProperty = addProperty;
