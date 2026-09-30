const crypto = require("crypto");

/**
 * Generate a secure random password
 * @param {number} length - Password length (default: 12)
 * @param {object} options - Options for password generation
 * @returns {string} Generated password
 */
const generatePassword = (length = 12, options = {}) => {
  const {
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
    excludeSimilar = true // Exclude similar characters like 0, O, l, 1, I
  } = options;

  let charset = "";
  let password = "";

  // Define character sets
  const uppercase = excludeSimilar ? "ABCDEFGHJKLMNPQRSTUVWXYZ" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = excludeSimilar ? "abcdefghijkmnopqrstuvwxyz" : "abcdefghijklmnopqrstuvwxyz";
  const numbers = excludeSimilar ? "23456789" : "0123456789";
  const symbols = "!@#$%^&*-_=+";

  // Build charset based on options
  if (includeUppercase) charset += uppercase;
  if (includeLowercase) charset += lowercase;
  if (includeNumbers) charset += numbers;
  if (includeSymbols) charset += symbols;

  if (charset.length === 0) {
    throw new Error("At least one character type must be included");
  }

  // Generate password
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % charset.length;
    password += charset[randomIndex];
  }

  // Ensure password contains at least one character from each enabled type
  let mustHave = [];
  if (includeUppercase) mustHave.push(uppercase[crypto.randomInt(uppercase.length)]);
  if (includeLowercase) mustHave.push(lowercase[crypto.randomInt(lowercase.length)]);
  if (includeNumbers) mustHave.push(numbers[crypto.randomInt(numbers.length)]);
  if (includeSymbols) mustHave.push(symbols[crypto.randomInt(symbols.length)]);

  // Replace random positions with required characters
  mustHave.forEach((char, index) => {
    if (index < length) {
      const position = crypto.randomInt(length);
      password = password.substring(0, position) + char + password.substring(position + 1);
    }
  });

  return password;
};

/**
 * Generate a simple alphanumeric password (for students/teachers)
 * Format: 8-12 characters, mix of letters and numbers
 */
const generateSimplePassword = () => {
  return generatePassword(10, {
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilar: true
  });
};

/**
 * Generate a strong password (for admins)
 * Format: 12-16 characters, includes symbols
 */
const generateStrongPassword = () => {
  return generatePassword(14, {
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true
  });
};

/**
 * Generate multiple passwords
 */
const generatePasswordBatch = (count, type = "simple") => {
  const passwords = [];
  
  for (let i = 0; i < count; i++) {
    if (type === "strong") {
      passwords.push(generateStrongPassword());
    } else {
      passwords.push(generateSimplePassword());
    }
  }
  
  return passwords;
};

/**
 * Validate password strength
 */
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*\-_=+]/.test(password);

  const score = {
    length: password.length >= minLength,
    uppercase: hasUppercase,
    lowercase: hasLowercase,
    number: hasNumber,
    symbol: hasSymbol,
    strength: 0
  };

  // Calculate strength score
  if (score.length) score.strength += 20;
  if (score.uppercase) score.strength += 20;
  if (score.lowercase) score.strength += 20;
  if (score.number) score.strength += 20;
  if (score.symbol) score.strength += 20;

  // Bonus for length
  if (password.length >= 12) score.strength += 10;
  if (password.length >= 16) score.strength += 10;

  return score;
};

module.exports = {
  generatePassword,
  generateSimplePassword,
  generateStrongPassword,
  generatePasswordBatch,
  validatePasswordStrength
};