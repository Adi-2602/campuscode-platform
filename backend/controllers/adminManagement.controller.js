const {
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
} = require("../services/adminManagement.service");

const {
  ASSIGNABLE_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  PERMISSION_CATEGORIES
} = require("../constants/permissions");

const { manualLog } = require("../middlewares/auditLog.middleware");

/**
 * Create a new admin (Superadmin only)
 * POST /admin/admins/create
 */
const createAdminHandler = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "name, email, and password are required"
      });
    }

    const admin = await createAdmin({
      name,
      email,
      password,
      createdBy: req.user.id
    });

    // Log action
    await manualLog({
      user: req.user,
      req,
      action: "create_admin",
      actionDescription: `Created new admin: ${admin.email}`,
      permissionUsed: "CREATE_ADMIN",
      targetType: "admin",
      targetId: admin.id,
      targetEmail: admin.email,
      targetName: admin.name,
      metadata: { permissions: admin.permissions },
      success: true
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin
    });
  } catch (error) {
    await manualLog({
      user: req.user,
      req,
      action: "create_admin_failed",
      permissionUsed: "CREATE_ADMIN",
      targetType: "admin",
      success: false,
      errorMessage: error.message
    });

    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get all admins (Superadmin only)
 * GET /admin/admins
 */
const getAllAdminsHandler = async (req, res) => {
  try {
    const admins = await getAllAdmins();

    await manualLog({
      user: req.user,
      req,
      action: "view_all_admins",
      permissionUsed: "MANAGE_ADMIN_PERMISSIONS",
      targetType: "admin",
      metadata: { count: admins.length },
      success: true
    });

    res.json({
      admins,
      count: admins.length
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get single admin details (Superadmin only)
 * GET /admin/admins/:adminId
 */
const getAdminByIdHandler = async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await getAdminById(adminId);

    await manualLog({
      user: req.user,
      req,
      action: "view_admin_details",
      permissionUsed: "MANAGE_ADMIN_PERMISSIONS",
      targetType: "admin",
      targetId: adminId,
      targetEmail: admin.email,
      targetName: admin.name,
      success: true
    });

    res.json({
      admin
    });
  } catch (error) {
    res.status(404).json({
      error: error.message
    });
  }
};

/**
 * Update admin permissions (Superadmin only)
 * PATCH /admin/admins/:adminId/permissions
 */
const updateAdminPermissionsHandler = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        error: "permissions must be an array"
      });
    }

    const result = await updateAdminPermissions({
      adminId,
      permissions,
      updatedBy: req.user.id
    });

    await manualLog({
      user: req.user,
      req,
      action: "update_admin_permissions",
      actionDescription: `Updated permissions for admin: ${result.email}`,
      permissionUsed: "MANAGE_ADMIN_PERMISSIONS",
      targetType: "admin",
      targetId: adminId,
      targetEmail: result.email,
      targetName: result.name,
      metadata: {
        newPermissions: result.permissions,
        added: result.changes.added,
        removed: result.changes.removed
      },
      success: true
    });

    res.json({
      message: "Admin permissions updated successfully",
      admin: result
    });
  } catch (error) {
    await manualLog({
      user: req.user,
      req,
      action: "update_admin_permissions_failed",
      permissionUsed: "MANAGE_ADMIN_PERMISSIONS",
      targetType: "admin",
      targetId: req.params.adminId,
      success: false,
      errorMessage: error.message
    });

    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Add permissions to admin (Superadmin only)
 * POST /admin/admins/:adminId/permissions/add
 */
const addPermissionsHandler = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        error: "permissions array is required and cannot be empty"
      });
    }

    const result = await addPermissionsToAdmin({
      adminId,
      permissions,
      updatedBy: req.user.id
    });

    await manualLog({
      user: req.user,
      req,
      action: "add_admin_permissions",
      actionDescription: `Added permissions to admin: ${result.email}`,
      permissionUsed: "MANAGE_ADMIN_PERMISSIONS",
      targetType: "admin",
      targetId: adminId,
      targetEmail: result.email,
      targetName: result.name,
      metadata: { added: result.added },
      success: true
    });

    res.json({
      message: "Permissions added successfully",
      admin: result
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Remove permissions from admin (Superadmin only)
 * POST /admin/admins/:adminId/permissions/remove
 */
const removePermissionsHandler = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        error: "permissions array is required and cannot be empty"
      });
    }

    const result = await removePermissionsFromAdmin({
      adminId,
      permissions,
      updatedBy: req.user.id
    });

    await manualLog({
      user: req.user,
      req,
      action: "remove_admin_permissions",
      actionDescription: `Removed permissions from admin: ${result.email}`,
      permissionUsed: "MANAGE_ADMIN_PERMISSIONS",
      targetType: "admin",
      targetId: adminId,
      targetEmail: result.email,
      targetName: result.name,
      metadata: { removed: result.removed },
      success: true
    });

    res.json({
      message: "Permissions removed successfully",
      admin: result
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Delete admin (Superadmin only)
 * DELETE /admin/admins/:adminId
 */
const deleteAdminHandler = async (req, res) => {
  try {
    const { adminId } = req.params;

    const result = await deleteAdmin(adminId);

    await manualLog({
      user: req.user,
      req,
      action: "delete_admin",
      actionDescription: `Deleted admin: ${result.deletedAdmin.email}`,
      permissionUsed: "MANAGE_ADMIN_PERMISSIONS",
      targetType: "admin",
      targetId: adminId,
      targetEmail: result.deletedAdmin.email,
      targetName: result.deletedAdmin.name,
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Block/Unblock admin (Superadmin only)
 * PATCH /admin/admins/:adminId/status
 */
const toggleAdminStatusHandler = async (req, res) => {
  try {
    const { adminId } = req.params;

    const result = await toggleAdminStatus(adminId);

    await manualLog({
      user: req.user,
      req,
      action: `${result.status === "active" ? "activate" : "block"}_admin`,
      actionDescription: result.message,
      permissionUsed: "MANAGE_ADMIN_PERMISSIONS",
      targetType: "admin",
      targetId: adminId,
      targetEmail: result.email,
      targetName: result.name,
      metadata: { newStatus: result.status },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
};

/**
 * Get admin activity logs (Superadmin only)
 * GET /admin/admins/:adminId/logs
 */
const getAdminActivityLogsHandler = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { page, limit } = req.query;

    const result = await getAdminActivityLogs(adminId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get all audit logs (Superadmin only)
 * GET /admin/audit-logs
 */
const getAllAuditLogsHandler = async (req, res) => {
  try {
    const {
      actorId,
      action,
      permissionUsed,
      targetType,
      success,
      startDate,
      endDate,
      page,
      limit
    } = req.query;

    const filters = {};
    if (actorId) filters.actorId = actorId;
    if (action) filters.action = action;
    if (permissionUsed) filters.permissionUsed = permissionUsed;
    if (targetType) filters.targetType = targetType;
    if (success !== undefined) filters.success = success === "true";
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50
    };

    const result = await getAllAuditLogs(filters, options);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get admin statistics (Superadmin only)
 * GET /admin/admins/stats
 */
const getAdminStatsHandler = async (req, res) => {
  try {
    const stats = await getAdminStats();

    res.json({
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get available permissions list (Superadmin only)
 * GET /admin/permissions
 */
const getAvailablePermissionsHandler = async (req, res) => {
  try {
    res.json({
      permissions: ASSIGNABLE_PERMISSIONS,
      descriptions: PERMISSION_DESCRIPTIONS,
      categories: PERMISSION_CATEGORIES
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = {
  createAdminHandler,
  getAllAdminsHandler,
  getAdminByIdHandler,
  updateAdminPermissionsHandler,
  addPermissionsHandler,
  removePermissionsHandler,
  deleteAdminHandler,
  toggleAdminStatusHandler,
  getAdminActivityLogsHandler,
  getAllAuditLogsHandler,
  getAdminStatsHandler,
  getAvailablePermissionsHandler
};