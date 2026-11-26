const jwt = require('jsonwebtoken');

/**
 * Generates signed JSON Web Token (JWT)
 * @param {string} id - User MongoDB ObjectId
 * @param {string} role - User role (User / Admin)
 * @param {string} email - User email
 * @returns {string} Signed JWT token string
 */
const generateToken = (id, role, email) => {
  return jwt.sign(
    { id, role, email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
  );
};

module.exports = generateToken;
