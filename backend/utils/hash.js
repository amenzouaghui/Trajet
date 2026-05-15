const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

/**
 * Hash a plain‑text password.
 * @param {string} plain Password in clear text
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plain, salt);
}

/**
 * Compare a plain password with a hashed version.
 * @param {string} plain Plain password
 * @param {string} hash  Hashed password from DB
 * @returns {Promise<boolean>} true if they match
 */
async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
