const {
  getAllCollections,
  getCollectionDocuments,
  getDocumentById,
  searchDocuments,
  getCollectionStats,
  getDatabaseStats,
  getCollectionIndexes,
  countByField
} = require("../services/databaseExplorer.service");

const { manualLog } = require("../middlewares/auditLog.middleware");

/**
 * Get all collections in database
 * GET /admin/monitoring/database/collections
 * Permission: VIEW_DB
 */
const getAllCollectionsHandler = async (req, res) => {
  try {
    const result = await getAllCollections();

    await manualLog({
      user: req.user,
      req,
      action: "view_database_collections",
      permissionUsed: "VIEW_DB",
      targetType: "system",
      metadata: { totalCollections: result.totalCollections },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get documents from a collection
 * GET /admin/monitoring/database/collections/:collectionName/documents
 * Permission: VIEW_DB
 */
const getCollectionDocumentsHandler = async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { page, limit, sort } = req.query;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort: sort ? JSON.parse(sort) : { _id: -1 }
    };

    const result = await getCollectionDocuments(collectionName, options);

    await manualLog({
      user: req.user,
      req,
      action: "view_collection_documents",
      permissionUsed: "VIEW_DB",
      targetType: "system",
      metadata: {
        collectionName,
        documentCount: result.documents.length
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Get single document by ID
 * GET /admin/monitoring/database/collections/:collectionName/documents/:documentId
 * Permission: VIEW_DB
 */
const getDocumentByIdHandler = async (req, res) => {
  try {
    const { collectionName, documentId } = req.params;

    const result = await getDocumentById(collectionName, documentId);

    await manualLog({
      user: req.user,
      req,
      action: "view_document_details",
      permissionUsed: "VIEW_DB",
      targetType: "system",
      metadata: {
        collectionName,
        documentId
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Search documents in a collection
 * GET /admin/monitoring/database/collections/:collectionName/search
 * Permission: VIEW_DB
 */
const searchDocumentsHandler = async (req, res) => {
  try {
    const { collectionName } = req.params;
    
    // Handle both GET (query string) and POST (request body)
    let searchQuery, page, limit;
    
    if (req.method === 'POST') {
      // POST request - expects { query: {...}, page, limit } in body
      searchQuery = req.body.query;
      page = parseInt(req.body.page) || 1;
      limit = parseInt(req.body.limit) || 20;
      
      if (!searchQuery) {
        return res.status(400).json({
          error: "Query object is required in request body"
        });
      }
    } else {
      // GET request - expects ?query=searchText
      searchQuery = req.query.query;
      page = parseInt(req.query.page) || 1;
      limit = parseInt(req.query.limit) || 20;
      
      if (!searchQuery) {
        return res.status(400).json({
          error: "Search query is required"
        });
      }
      
      // For GET, convert text search to MongoDB query
      // This part depends on your existing implementation
      // You may need to keep your existing text search logic here
    }

    // Call your service function with the search query
    const result = await searchDocuments(collectionName, searchQuery, { page, limit });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
/**
 * Get collection statistics
 * GET /admin/monitoring/database/collections/:collectionName/stats
 * Permission: VIEW_DB
 */
const getCollectionStatsHandler = async (req, res) => {
  try {
    const { collectionName } = req.params;

    const result = await getCollectionStats(collectionName);

    await manualLog({
      user: req.user,
      req,
      action: "view_collection_stats",
      permissionUsed: "VIEW_DB",
      targetType: "system",
      metadata: {
        collectionName,
        documentCount: result.statistics.documentCount
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Get database statistics
 * GET /admin/monitoring/database/stats
 * Permission: VIEW_DB
 */
const getDatabaseStatsHandler = async (req, res) => {
  try {
    const result = await getDatabaseStats();

    await manualLog({
      user: req.user,
      req,
      action: "view_database_stats",
      permissionUsed: "VIEW_DB",
      targetType: "system",
      metadata: {
        database: result.database,
        collections: result.statistics.collections,
        documents: result.statistics.documents
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get collection indexes
 * GET /admin/monitoring/database/collections/:collectionName/indexes
 * Permission: VIEW_DB
 */
const getCollectionIndexesHandler = async (req, res) => {
  try {
    const { collectionName } = req.params;

    const result = await getCollectionIndexes(collectionName);

    await manualLog({
      user: req.user,
      req,
      action: "view_collection_indexes",
      permissionUsed: "VIEW_DB",
      targetType: "system",
      metadata: {
        collectionName,
        indexCount: result.indexCount
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

/**
 * Count documents by field
 * GET /admin/monitoring/database/collections/:collectionName/count-by/:fieldName
 * Permission: VIEW_DB
 */
const countByFieldHandler = async (req, res) => {
  try {
    const { collectionName, fieldName } = req.params;

    const result = await countByField(collectionName, fieldName);

    await manualLog({
      user: req.user,
      req,
      action: "count_by_field",
      permissionUsed: "VIEW_DB",
      targetType: "system",
      metadata: {
        collectionName,
        fieldName,
        groupCount: result.totalGroups
      },
      success: true
    });

    res.json(result);
  } catch (error) {
    res.status(error.message.includes("not found") ? 404 : 500).json({
      error: error.message
    });
  }
};

module.exports = {
  getAllCollectionsHandler,
  getCollectionDocumentsHandler,
  getDocumentByIdHandler,
  searchDocumentsHandler,
  getCollectionStatsHandler,
  getDatabaseStatsHandler,
  getCollectionIndexesHandler,
  countByFieldHandler
};