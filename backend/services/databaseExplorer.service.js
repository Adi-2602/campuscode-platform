const mongoose = require("mongoose");

/**
 * Get all collection names in the database
 */
const getAllCollections = async () => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();

    const collectionInfo = await Promise.all(
      collections.map(async (collection) => {
        const count = await mongoose.connection.db
          .collection(collection.name)
          .countDocuments();

        return {
          name: collection.name,
          type: collection.type,
          documentCount: count
        };
      })
    );

    return {
      collections: collectionInfo,
      totalCollections: collectionInfo.length,
      database: mongoose.connection.name
    };
  } catch (error) {
    throw new Error(`Failed to fetch collections: ${error.message}`);
  }
};

/**
 * Get documents from a specific collection
 */
const getCollectionDocuments = async (collectionName, options = {}) => {
  try {
    const { page = 1, limit = 20, sort = { _id: -1 }, filter = {} } = options;

    // Check if collection exists
    const collections = await mongoose.connection.db
      .listCollections({ name: collectionName })
      .toArray();

    if (collections.length === 0) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const collection = mongoose.connection.db.collection(collectionName);

    const skip = (page - 1) * limit;

    // Get documents with pagination
    const [documents, total] = await Promise.all([
      collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter)
    ]);

    return {
      collectionName,
      documents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }
};

/**
 * Get a single document by ID from a collection
 */
const getDocumentById = async (collectionName, documentId) => {
  try {
    // Check if collection exists
    const collections = await mongoose.connection.db
      .listCollections({ name: collectionName })
      .toArray();

    if (collections.length === 0) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const collection = mongoose.connection.db.collection(collectionName);

    // Try to convert to ObjectId if it's a valid ObjectId string
    let query;
    if (mongoose.Types.ObjectId.isValid(documentId)) {
      query = { _id: new mongoose.Types.ObjectId(documentId) };
    } else {
      query = { _id: documentId };
    }

    const document = await collection.findOne(query);

    if (!document) {
      throw new Error(`Document not found in collection '${collectionName}'`);
    }

    return {
      collectionName,
      document
    };
  } catch (error) {
    throw new Error(`Failed to fetch document: ${error.message}`);
  }
};

/**
 * Search documents in a collection
 */
/**
 * Search documents in a collection
 */
const searchDocuments = async (collectionName, searchQuery, options = {}) => {
  try {
    const { page = 1, limit = 20 } = options;

    // Check if collection exists
    const collections = await mongoose.connection.db
      .listCollections({ name: collectionName })
      .toArray();

    if (collections.length === 0) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const collection = mongoose.connection.db.collection(collectionName);

    let filter;

    // Check if searchQuery is a string (text search) or object (MongoDB query)
    if (typeof searchQuery === 'string') {
      // Build text search query using $regex
      filter = {
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { email: { $regex: searchQuery, $options: "i" } },
          { title: { $regex: searchQuery, $options: "i" } },
          { description: { $regex: searchQuery, $options: "i" } }
        ]
      };
    } else if (typeof searchQuery === 'object' && searchQuery !== null) {
      // Use the query object directly for MongoDB queries
      filter = searchQuery;
    } else {
      throw new Error('Invalid search query type. Must be a string or object.');
    }

    const skip = (page - 1) * limit;

    const [documents, total] = await Promise.all([
      collection.find(filter).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter)
    ]);

    return {
      collectionName,
      searchQuery,
      documents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw new Error(`Failed to search documents: ${error.message}`);
  }
};

/**
 * Get collection statistics
 */
const getCollectionStats = async (collectionName) => {
  try {
    // Check if collection exists
    const collections = await mongoose.connection.db
      .listCollections({ name: collectionName })
      .toArray();

    if (collections.length === 0) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const stats = await mongoose.connection.db
      .collection(collectionName)
      .stats();

    return {
      collectionName,
      statistics: {
        documentCount: stats.count,
        size: stats.size,
        averageDocumentSize: stats.avgObjSize,
        storageSize: stats.storageSize,
        indexes: stats.nindexes,
        indexSize: stats.totalIndexSize
      }
    };
  } catch (error) {
    throw new Error(`Failed to fetch collection stats: ${error.message}`);
  }
};

/**
 * Get database statistics
 */
const getDatabaseStats = async () => {
  try {
    const dbStats = await mongoose.connection.db.stats();

    return {
      database: mongoose.connection.name,
      statistics: {
        collections: dbStats.collections,
        views: dbStats.views,
        documents: dbStats.objects,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSize,
        averageDocumentSize: dbStats.avgObjSize
      },
      sizeInMB: {
        dataSize: (dbStats.dataSize / (1024 * 1024)).toFixed(2),
        storageSize: (dbStats.storageSize / (1024 * 1024)).toFixed(2),
        indexSize: (dbStats.indexSize / (1024 * 1024)).toFixed(2)
      }
    };
  } catch (error) {
    throw new Error(`Failed to fetch database stats: ${error.message}`);
  }
};

/**
 * Get indexes for a collection
 */
const getCollectionIndexes = async (collectionName) => {
  try {
    // Check if collection exists
    const collections = await mongoose.connection.db
      .listCollections({ name: collectionName })
      .toArray();

    if (collections.length === 0) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const collection = mongoose.connection.db.collection(collectionName);
    const indexes = await collection.indexes();

    return {
      collectionName,
      indexes,
      indexCount: indexes.length
    };
  } catch (error) {
    throw new Error(`Failed to fetch indexes: ${error.message}`);
  }
};

/**
 * Count documents by field value
 */
const countByField = async (collectionName, fieldName) => {
  try {
    // Check if collection exists
    const collections = await mongoose.connection.db
      .listCollections({ name: collectionName })
      .toArray();

    if (collections.length === 0) {
      throw new Error(`Collection '${collectionName}' not found`);
    }

    const collection = mongoose.connection.db.collection(collectionName);

    const aggregation = [
      {
        $group: {
          _id: `$${fieldName}`,
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ];

    const results = await collection.aggregate(aggregation).toArray();

    return {
      collectionName,
      fieldName,
      results,
      totalGroups: results.length
    };
  } catch (error) {
    throw new Error(`Failed to count by field: ${error.message}`);
  }
};

module.exports = {
  getAllCollections,
  getCollectionDocuments,
  getDocumentById,
  searchDocuments,
  getCollectionStats,
  getDatabaseStats,
  getCollectionIndexes,
  countByField
};