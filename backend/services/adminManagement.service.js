const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const AuditLog = require("../models/auditLog.model");
const {
  ASSIGNABLE_PERMISSIONS,
  SUPERADMIN_ONLY_PERMISSIONS
} = require("../constants/permissions");

/**
 * Create a new admin (Superadmin only)
 */
const createAdmin = async ({ name, email, password, createdBy }) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists with this email");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  // Validate password strength
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create admin with ZERO permissions
  const admin = await User.create({
    name,
    email,
    passwordHash,
    role: "admin",
    permissions: [], // Empty by default
    isVerified: true, // Admins are auto-verified
    createdBy,
    status: "active"
  });

  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    permissions: admin.permissions,
    isVerified: admin.isVerified,
    status: admin.status,
    createdAt: admin.createdAt
  };
};

/**
 * Get all admins (Superadmin only)
 */
const getAllAdmins = async () => {
  const admins = await User.find({ role: "admin" })
    .select("-passwordHash")
    .populate("createdBy", "name email")
    .populate("lastPermissionUpdatedBy", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return admins.map((admin) => ({
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    permissions: admin.permissions,
    permissionCount: admin.permissions.length,
    isVerified: admin.isVerified,
    status: admin.status,
    createdBy: admin.createdBy,
    createdAt: admin.createdAt,
    lastPermissionUpdate: admin.lastPermissionUpdate,
    lastPermissionUpdatedBy: admin.lastPermissionUpdatedBy
  }));
};

/**
 * Get single admin details (Superadmin only)
 */
const getAdminById = async (adminId) => {
  const admin = await User.findOne({
    _id: adminId,
    role: "admin"
  })
    .select("-passwordHash")
    .populate("createdBy", "name email")
    .populate("lastPermissionUpdatedBy", "name email")
    .lean();

  if (!admin) {
    throw new Error("Admin not found");
  }

  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    permissions: admin.permissions,
    permissionCount: admin.permissions.length,
    isVerified: admin.isVerified,
    status: admin.status,
    createdBy: admin.createdBy,
    createdAt: admin.createdAt,
    lastPermissionUpdate: admin.lastPermissionUpdate,
    lastPermissionUpdatedBy: admin.lastPermissionUpdatedBy
  };
};

/**
 * Update admin permissions (Superadmin only)
 */
const updateAdminPermissions = async ({
  adminId,
  permissions,
  updatedBy
}) => {
  // Find admin
  const admin = await User.findOne({
    _id: adminId,
    role: "admin"
  });

  if (!admin) {
    throw new Error("Admin not found");
  }

  // Validate permissions - only assignable permissions allowed
  const invalidPermissions = permissions.filter(
    (perm) => !ASSIGNABLE_PERMISSIONS.includes(perm)
  );

  if (invalidPermissions.length > 0) {
    throw new Error(
      `Invalid permissions: ${invalidPermissions.join(", ")}. These permissions cannot be assigned to regular admins.`
    );
  }

  // Check for duplicate permissions
  const uniquePermissions = [...new Set(permissions)];

  if (uniquePermissions.length !== permissions.length) {
    throw new Error("Duplicate permissions found");
  }

  // Store old permissions for audit
  const oldPermissions = [...admin.permissions];

  // Update permissions
  admin.permissions = uniquePermissions;
  admin.lastPermissionUpdate = new Date();
  admin.lastPermissionUpdatedBy = updatedBy;
  await admin.save();

  // Calculate changes
  const addedPermissions = uniquePermissions.filter(
    (perm) => !oldPermissions.includes(perm)
  );
  const removedPermissions = oldPermissions.filter(
    (perm) => !uniquePermissions.includes(perm)
  );

  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    permissions: admin.permissions,
    permissionCount: admin.permissions.length,
    lastPermissionUpdate: admin.lastPermissionUpdate,
    changes: {
      added: addedPermissions,
      removed: removedPermissions
    }
  };
};

/**
 * Add permissions to admin (Superadmin only)
 */
const addPermissionsToAdmin = async ({ adminId, permissions, updatedBy }) => {
  const admin = await User.findOne({
    _id: adminId,
    role: "admin"
  });

  if (!admin) {
    throw new Error("Admin not found");
  }

  // Validate permissions
  const invalidPermissions = permissions.filter(
    (perm) => !ASSIGNABLE_PERMISSIONS.includes(perm)
  );

  if (invalidPermissions.length > 0) {
    throw new Error(
      `Invalid permissions: ${invalidPermissions.join(", ")}`
    );
  }

  // Add new permissions (avoid duplicates)
  const newPermissions = permissions.filter(
    (perm) => !admin.permissions.includes(perm)
  );

  if (newPermissions.length === 0) {
    throw new Error("All permissions already assigned");
  }

  admin.permissions = [...admin.permissions, ...newPermissions];
  admin.lastPermissionUpdate = new Date();
  admin.lastPermissionUpdatedBy = updatedBy;
  await admin.save();

  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    permissions: admin.permissions,
    added: newPermissions
  };
};

/**
 * Remove permissions from admin (Superadmin only)
 */
const removePermissionsFromAdmin = async ({
  adminId,
  permissions,
  updatedBy
}) => {
  const admin = await User.findOne({
    _id: adminId,
    role: "admin"
  });

  if (!admin) {
    throw new Error("Admin not found");
  }

  // Remove permissions
  const removedPermissions = permissions.filter((perm) =>
    admin.permissions.includes(perm)
  );

  if (removedPermissions.length === 0) {
    throw new Error("None of the specified permissions are assigned");
  }

  admin.permissions = admin.permissions.filter(
    (perm) => !permissions.includes(perm)
  );
  admin.lastPermissionUpdate = new Date();
  admin.lastPermissionUpdatedBy = updatedBy;
  await admin.save();

  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    permissions: admin.permissions,
    removed: removedPermissions
  };
};

/**
 * Delete admin (Superadmin only)
 */
const deleteAdmin = async (adminId) => {
  const admin = await User.findOne({
    _id: adminId,
    role: "admin"
  });

  if (!admin) {
    throw new Error("Admin not found");
  }

  // Cannot delete superadmin
  if (admin.role === "superadmin") {
    throw new Error("Cannot delete superadmin");
  }

  await User.findByIdAndDelete(adminId);

  return {
    message: "Admin deleted successfully",
    deletedAdmin: {
      id: admin._id,
      name: admin.name,
      email: admin.email
    }
  };
};

/**
 * Block/Unblock admin (Superadmin only)
 */
const toggleAdminStatus = async (adminId) => {
  const admin = await User.findOne({
    _id: adminId,
    role: "admin"
  });

  if (!admin) {
    throw new Error("Admin not found");
  }

  // Toggle status
  admin.status = admin.status === "active" ? "blocked" : "active";
  await admin.save();

  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    status: admin.status,
    message: `Admin ${admin.status === "active" ? "activated" : "blocked"} successfully`
  };
};

/**
 * Get admin activity logs (Superadmin only)
 */
const getAdminActivityLogs = async (adminId, options = {}) => {
  const { page = 1, limit = 50 } = options;

  const result = await AuditLog.getLogs(
    { actorId: adminId },
    { page, limit, sort: { createdAt: -1 } }
  );

  return result;
};

/**
 * Get all audit logs (Superadmin only)
 */
const getAllAuditLogs = async (filters = {}, options = {}) => {
  const result = await AuditLog.getLogs(filters, options);
  return result;
};

/**
 * Get admin statistics
 */
const getAdminStats = async () => {
  const totalAdmins = await User.countDocuments({ role: "admin" });
  const activeAdmins = await User.countDocuments({
    role: "admin",
    status: "active"
  });
  const blockedAdmins = await User.countDocuments({
    role: "admin",
    status: "blocked"
  });

  const adminsWithPermissions = await User.countDocuments({
    role: "admin",
    permissions: { $ne: [] }
  });

  const adminsWithoutPermissions = await User.countDocuments({
    role: "admin",
    permissions: []
  });

  return {
    total: totalAdmins,
    active: activeAdmins,
    blocked: blockedAdmins,
    withPermissions: adminsWithPermissions,
    withoutPermissions: adminsWithoutPermissions
  };
};

module.exports = {
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdminPermissions,
  addPermissionsToAdmin,
  removePermissionsFromAdmin,
  deleteAdmin,
  toggleAdminStatus,
  getAdminActivityLogs,
  getAllAuditLogs,
  getAdminStats
};