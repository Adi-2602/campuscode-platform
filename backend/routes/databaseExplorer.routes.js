const express = require("express");

const {
  getAllCollectionsHandler,
  getCollectionDocumentsHandler,
  getDocumentByIdHandler,
  searchDocumentsHandler,
  getCollectionStatsHandler,
  getDatabaseStatsHandler,
  getCollectionIndexesHandler,
  countByFieldHandler
} = require("../controllers/databaseExplorer.controller");

const { authenticate } = require("../middlewares/auth.middleware");
const {
  requirePermission,
  requireAdminRole
} = require("../middlewares/permission.middleware");

const { PERMISSIONS } = require("../constants/permissions");

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdminRole());

/**
 * @swagger
 * tags:
 *   name: Database Explorer
 *   description: Database viewing and exploration APIs (VIEW_DB permission)
 */

/**
 * @swagger
 * /admin/monitoring/database/stats:
 *   get:
 *     summary: Get database statistics
 *     description: View overall database statistics (collections, size, indexes)
 *     tags: [Database Explorer]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/stats",
  requirePermission(PERMISSIONS.VIEW_DB, {
    action: "view_database_stats",
    targetType: "system"
  }),
  getDatabaseStatsHandler
);

/**
 * @swagger
 * /admin/monitoring/database/collections:
 *   get:
 *     summary: Get all collections
 *     description: List all collections in the database with document counts
 *     tags: [Database Explorer]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  "/collections",
  requirePermission(PERMISSIONS.VIEW_DB, {
    action: "view_collections",
    targetType: "system"
  }),
  getAllCollectionsHandler
);

/**
 * @swagger
 * /admin/monitoring/database/collections/:collectionName/documents:
 *   get:
 *     summary: Get documents from a collection
 *     description: View documents in a specific collection with pagination
 *     tags: [Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection name (e.g., users, classes, exams)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: JSON sort object (e.g., {"createdAt":-1})
 */
router.get(
  "/collections/:collectionName/documents",
  requirePermission(PERMISSIONS.VIEW_DB, {
    action: "view_collection_documents",
    targetType: "system"
  }),
  getCollectionDocumentsHandler
);

/**
 * @swagger
 * /admin/monitoring/database/collections/:collectionName/documents/:documentId:
 *   get:
 *     summary: Get single document by ID
 *     description: View detailed information of a specific document
 *     tags: [Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID (MongoDB ObjectId or custom ID)
 */
router.get(
  "/collections/:collectionName/documents/:documentId",
  requirePermission(PERMISSIONS.VIEW_DB, {
    action: "view_document_details",
    targetType: "system"
  }),
  getDocumentByIdHandler
);

/**
 * @swagger
 * /admin/monitoring/database/collections/:collectionName/search:
 *   get:
 *     summary: Search documents in a collection
 *     description: Search for documents by name, email, title, or description
 *     tags: [Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 */
router.get(
  "/collections/:collectionName/search",
  requirePermission(PERMISSIONS.VIEW_DB, {
    action: "search_collection",
    targetType: "system"
  }),
  searchDocumentsHandler
);

/**
 * @swagger
 * /admin/monitoring/database/collections/:collectionName/stats:
 *   get:
 *     summary: Get collection statistics
 *     description: View statistics for a specific collection (size, count, indexes)
 *     tags: [Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  "/collections/:collectionName/stats",
  requirePermission(PERMISSIONS.VIEW_DB, {
    action: "view_collection_stats",
    targetType: "system"
  }),
  getCollectionStatsHandler
);

/**
 * @swagger
 * /admin/monitoring/database/collections/:collectionName/indexes:
 *   get:
 *     summary: Get collection indexes
 *     description: View all indexes defined on a collection
 *     tags: [Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 */
router.get(
  "/collections/:collectionName/indexes",
  requirePermission(PERMISSIONS.VIEW_DB, {
    action: "view_collection_indexes",
    targetType: "system"
  }),
  getCollectionIndexesHandler
);

/**
 * @swagger
 * /admin/monitoring/database/collections/:collectionName/count-by/:fieldName:
 *   get:
 *     summary: Count documents by field value
 *     description: Aggregate count of documents grouped by a specific field
 *     tags: [Database Explorer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: fieldName
 *         required: true
 *         schema:
 *           type: string
 *         description: Field name to group by (e.g., role, status)
 */
router.get(
  "/collections/:collectionName/count-by/:fieldName",
  requirePermission(PERMISSIONS.VIEW_DB, {
    action: "count_by_field",
    targetType: "system"
  }),
  countByFieldHandler
);

module.exports = router;