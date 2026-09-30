/**
 * Script to create the initial superadmin account
 * This should be run ONCE during initial setup
 * 
 * Usage:
 * node scripts/createSuperadmin.js
 * 
 * SUPERADMIN_PASSWORD is required (set it in .env or inline):
 * SUPERADMIN_EMAIL=admin@example.com SUPERADMIN_PASSWORD=yourpassword node scripts/createSuperadmin.js
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import User model
const User = require("../models/user.model");

// Superadmin credentials (can be overridden by environment variables)
const SUPERADMIN_CONFIG = {
  name: process.env.SUPERADMIN_NAME || "Super Administrator",
  email: process.env.SUPERADMIN_EMAIL || "superadmin@campuscode.com",
  password: process.env.SUPERADMIN_PASSWORD,
  role: "superadmin"
};

// No default password: this repo is public, so a built-in one would be known to everyone.
if (!SUPERADMIN_CONFIG.password) {
  console.error("❌ Set SUPERADMIN_PASSWORD before running this script.");
  process.exit(1);
}

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    // 🔥 FIXED: Removed deprecated options
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/campuscode");
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

/**
 * Create superadmin user
 */
const createSuperadmin = async () => {
  try {
    console.log("\n🚀 Starting superadmin creation...\n");

    // Check if superadmin already exists
    const existingSuperadmin = await User.findOne({ role: "superadmin" });

    if (existingSuperadmin) {
      console.log("⚠️  Superadmin already exists!");
      console.log("   Email:", existingSuperadmin.email);
      console.log("   Created:", existingSuperadmin.createdAt);
      console.log("\n❌ Cannot create multiple superadmins.");
      console.log("   If you need to reset the superadmin, please delete the existing one from the database first.\n");
      return false;
    }

    // Check if email is already used by another user
    const existingUser = await User.findOne({ email: SUPERADMIN_CONFIG.email });

    if (existingUser) {
      console.log("❌ Email already in use by another user!");
      console.log("   Email:", existingUser.email);
      console.log("   Role:", existingUser.role);
      console.log("\n   Please use a different email or delete the existing user.\n");
      return false;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(SUPERADMIN_CONFIG.password, 10);

    // Create superadmin
    const superadmin = await User.create({
      name: SUPERADMIN_CONFIG.name,
      email: SUPERADMIN_CONFIG.email,
      passwordHash,
      role: "superadmin",
      permissions: [], // Superadmin doesn't need explicit permissions
      isVerified: true,
      status: "active"
    });

    console.log("✅ Superadmin created successfully!\n");
    console.log("📋 Superadmin Details:");
    console.log("   Name:", superadmin.name);
    console.log("   Email:", superadmin.email);
    console.log("   Role:", superadmin.role);
    console.log("   ID:", superadmin._id);
    console.log("   Created:", superadmin.createdAt);
    console.log("\n🔐 Login Credentials:");
    console.log("   Email:", SUPERADMIN_CONFIG.email);
    console.log("   Password: (the SUPERADMIN_PASSWORD you set)");
    console.log("\n⚠️  IMPORTANT: Change the password after first login!\n");

    return true;
  } catch (error) {
    console.error("❌ Error creating superadmin:", error);
    return false;
  }
};

/**
 * Main function
 */
const main = async () => {
  try {
    await connectDB();
    const success = await createSuperadmin();

    if (success) {
      console.log("🎉 Setup complete!");
    } else {
      console.log("⚠️  Setup incomplete. Please check the errors above.");
    }

    await mongoose.connection.close();
    console.log("\n✅ Database connection closed.\n");
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
main();