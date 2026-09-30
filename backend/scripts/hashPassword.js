// Prints a bcrypt hash for a password, e.g. to seed a user by hand.
// Usage: PASSWORD_TO_HASH='your-password' node scripts/hashPassword.js
require('dotenv').config();
const bcrypt = require('bcrypt');

const password = process.env.PASSWORD_TO_HASH;
const saltRounds = 10;

if (!password) {
    console.error('Set PASSWORD_TO_HASH before running this script.');
    process.exit(1);
}

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`Hash: ${hash}`);
});
