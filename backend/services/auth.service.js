const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Register a new user (student / teacher)
 * 🔥 MODIFIED: Block admin/superadmin registration
 */
const registerUser = async ({ name, email, rollNo, password, role }) => {
  // 🔥 NEW: Block admin and superadmin creation via registration
  if (role === "admin" || role === "superadmin") {
    throw new Error(
      "Cannot create admin or superadmin accounts via registration. Contact system administrator."
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    rollNo,
    passwordHash,
    role,
    isVerified: role === "student" // students auto-verified
  });

  return user;
};

/**
 * Login user
 * 🔥 MODIFIED: Include permissions in JWT and response
 */
const loginUser = async ({ email, password }) => {
  const query = email ? email.toString().trim() : "";
  console.log(`[AUTH-DEBUG] Login attempt for query: "${query}"`);

  const orConditions = [
    { email: query.toLowerCase() },
    { rollNo: query.toUpperCase() }
  ];

  // Include facultyId if it's numeric (for teachers)
  if (/^\d+$/.test(query)) {
    orConditions.push({ facultyId: parseInt(query, 10) });
  }

  const user = await User.findOne({ $or: orConditions });
  if (!user) {
    console.log(`[AUTH-DEBUG] User not found for query: "${query}"`);
    throw new Error("Invalid credentials");
  }

  console.log(`[AUTH-DEBUG] User found: ${user.email} (Role: ${user.role}, Status: ${user.status}, Verified: ${user.isVerified})`);

  if (user.status !== "active") {
    console.log(`[AUTH-DEBUG] Login rejected: Account status is ${user.status}`);
    throw new Error("Account is blocked");
  }

  if (user.role === "teacher" && !user.isVerified) {
    console.log(`[AUTH-DEBUG] Login rejected: Teacher account not verified`);
    throw new Error("Teacher account not verified by admin");
  }

  // 🔥 NEW: Check if admin account and blocked
  if (user.role === "admin" && user.status === "blocked") {
    console.log(`[AUTH-DEBUG] Login rejected: Admin account is blocked`);
    throw new Error("Admin account is blocked");
  }

  console.log(`[AUTH-DEBUG] Comparing password for user: ${user.email}`);
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  
  if (!isMatch) {
    console.log(`[AUTH-DEBUG] Password mismatch for user: ${user.email}`);
    throw new Error("Invalid credentials");
  }

  console.log(`[AUTH-DEBUG] Login successful for: ${user.email}`);

  // 🔥 MODIFIED: Include permissions in JWT payload
  const tokenPayload = {
    id: user._id,
    role: user.role,
    name: user.name,
    email: user.email
  };

  // Include permissions for admin (superadmin has implicit all permissions)
  if (user.role === "admin") {
    tokenPayload.permissions = user.permissions;
  }

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: "1d"
  });

  // 🔥 MODIFIED: Include permissions in response
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  // Add permissions to response for admin
  if (user.role === "admin") {
    userResponse.permissions = user.permissions;
    userResponse.permissionCount = user.permissions.length;
  }

  // Add superadmin indicator
  if (user.role === "superadmin") {
    userResponse.isSuperAdmin = true;
  }

  return {
    token,
    user: userResponse
  };
};

module.exports = {
  registerUser,
  loginUser
};