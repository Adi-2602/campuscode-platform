const jwt = require("jsonwebtoken");
const { AUTH_EVENTS } = require("../utils/socketEvents");

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token and attaches user to socket
 */
const authenticateSocket = (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = 
      socket.handshake.auth.token || 
      socket.handshake.headers.authorization?.split(" ")[1] ||
      socket.handshake.query.token;

    if (!token) {
      const error = new Error("Authentication error: No token provided");
      error.data = { type: "UNAUTHORIZED" };
      return next(error);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to socket
    socket.user = {
      id: decoded.id,
      role: decoded.role,
      name: decoded.name || "Unknown",
      email: decoded.email || "Unknown",
      permissions: decoded.permissions || []
    };

    // Continue to next middleware
    next();
  } catch (error) {
    const err = new Error("Authentication error: Invalid token");
    err.data = { 
      type: "UNAUTHORIZED",
      message: error.message 
    };
    return next(err);
  }
};

/**
 * Authorize socket by role
 */
const authorizeSocketRole = (...allowedRoles) => {
  return (socket, next) => {
    if (!socket.user) {
      const error = new Error("User not authenticated");
      error.data = { type: "UNAUTHORIZED" };
      return next(error);
    }

    if (!allowedRoles.includes(socket.user.role)) {
      const error = new Error("Access denied: Insufficient permissions");
      error.data = { 
        type: "FORBIDDEN",
        requiredRoles: allowedRoles,
        userRole: socket.user.role
      };
      return next(error);
    }

    next();
  };
};

/**
 * Authorize socket by permission
 */
const authorizeSocketPermission = (requiredPermission) => {
  return (socket, next) => {
    if (!socket.user) {
      const error = new Error("User not authenticated");
      error.data = { type: "UNAUTHORIZED" };
      return next(error);
    }

    // Superadmin has all permissions
    if (socket.user.role === "superadmin") {
      return next();
    }

    // Check if user has the required permission
    if (!socket.user.permissions || 
        !socket.user.permissions.includes(requiredPermission)) {
      const error = new Error("Access denied: Missing permission");
      error.data = { 
        type: "FORBIDDEN",
        requiredPermission,
        userPermissions: socket.user.permissions
      };
      return next(error);
    }

    next();
  };
};

/**
 * Log socket connection
 */
const logSocketConnection = (socket, next) => {
  console.log(`[Socket.IO] Connection from ${socket.user?.email || "unknown"} (${socket.id})`);
  next();
};

/**
 * Rate limiting for socket events
 */
const socketRateLimit = (maxEvents = 100, windowMs = 60000) => {
  const clients = new Map();

  return (socket, next) => {
    const clientId = socket.user?.id || socket.id;
    const now = Date.now();

    if (!clients.has(clientId)) {
      clients.set(clientId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const client = clients.get(clientId);

    // Reset if window expired
    if (now > client.resetTime) {
      client.count = 1;
      client.resetTime = now + windowMs;
      return next();
    }

    // Check if limit exceeded
    if (client.count >= maxEvents) {
      const error = new Error("Rate limit exceeded");
      error.data = { 
        type: "RATE_LIMIT",
        resetTime: client.resetTime
      };
      return next(error);
    }

    client.count++;
    next();
  };
};

/**
 * Handle socket errors
 */
const handleSocketError = (socket) => {
  socket.on("error", (error) => {
    console.error(`[Socket.IO] Error for ${socket.user?.email}:`, error.message);
    
    socket.emit(AUTH_EVENTS.UNAUTHORIZED, {
      error: error.message,
      type: error.data?.type || "ERROR"
    });
  });
};

/**
 * Cleanup on disconnect
 */
const handleSocketDisconnect = (socket) => {
  socket.on("disconnect", (reason) => {
    console.log(`[Socket.IO] Disconnected: ${socket.user?.email} - Reason: ${reason}`);
  });
};

module.exports = {
  authenticateSocket,
  authorizeSocketRole,
  authorizeSocketPermission,
  logSocketConnection,
  socketRateLimit,
  handleSocketError,
  handleSocketDisconnect
};