const { Server } = require("socket.io");
const {
  authenticateSocket,
  logSocketConnection,
  handleSocketError,
  handleSocketDisconnect
} = require("../middlewares/socket.middleware");

const {
  CONNECTION_EVENTS,
  AUTH_EVENTS,
  ROOMS
} = require("../utils/socketEvents");

/**
 * Initialize Socket.IO server
 */
const initializeSocket = (httpServer) => {
  const { createAdapter } = require("@socket.io/redis-adapter");
  const { getRedisClient } = require("./redis");

  // ... inside initializeSocket ...
  const pubClient = getRedisClient();
  const subClient = pubClient.duplicate();

  // ✨ NEW: Add error listeners to prevent worker crashes on Redis flickering
  pubClient.on('error', (err) => {
    console.error('[Socket.IO Redis Pub] ❌ Error:', err.message);
  });

  subClient.on('error', (err) => {
    console.error('[Socket.IO Redis Sub] ❌ Error:', err.message);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket'], // Forced websocket for cluster stability
    adapter: createAdapter(pubClient, subClient), // ✨ NEW: Redis Adapter
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(authenticateSocket);
  io.use(logSocketConnection);

  // Connection handler
  io.on(CONNECTION_EVENTS.CONNECT, (socket) => {
    console.log(`[Socket.IO] ✅ User connected: ${socket.user.email} (${socket.user.role})`);

    // Send authentication success
    socket.emit(AUTH_EVENTS.AUTHENTICATED, {
      message: "Successfully connected to real-time server",
      user: {
        id: socket.user.id,
        name: socket.user.name,
        email: socket.user.email,
        role: socket.user.role
      }
    });

    // Join role-based rooms
    joinRoleBasedRooms(socket);

    // Register event handlers
    registerEventHandlers(socket, io);

    // Handle errors
    handleSocketError(socket);

    // Handle disconnect
    handleSocketDisconnect(socket);
  });

  // ✨ NEW: Listen for cluster requests to get local stats
  io.serverSideEmit("get_node_stats_listener_ready"); // Just log readiness if needed

  io.on("get_node_stats", (cb) => {
    try {
      // Calculate local stats immediately without Redis overhead
      const localSockets = io.sockets.sockets; // Map of socketId -> socket

      const byRole = {};
      const localRoomsM = new Map();

      for (const [id, socket] of localSockets.entries()) {
        const role = socket.user?.role || "unknown";
        byRole[role] = (byRole[role] || 0) + 1;

        if (socket.rooms) {
          socket.rooms.forEach(room => {
            if (room !== id && room !== "") {
              localRoomsM.set(room, (localRoomsM.get(room) || 0) + 1);
            }
          });
        }
      }

      const activeRooms = Array.from(localRoomsM.entries()).map(([name, count]) => ({
        name,
        userCount: count
      }));

      // Return immediately via callback
      cb({
        total: localSockets.size,
        byRole,
        activeRooms
      });
    } catch (err) {
      console.error("[Socket.IO Cluster] Error getting node stats:", err);
      // Return empty stats on error so we don't timeout the cluster
      cb({ total: 0, byRole: {}, activeRooms: [] });
    }
  });

  console.log("🔌 Socket.IO server initialized");
  return io;
};

/**
 * Join user to role-based rooms
 */
const joinRoleBasedRooms = (socket) => {
  const { role, id } = socket.user;

  // Join role-specific room
  switch (role) {
    case "superadmin":
    case "admin":
      socket.join(ROOMS.ADMINS);
      socket.join(ROOMS.admin(id));
      console.log(`[Socket.IO] Admin joined room: ${ROOMS.ADMINS}`);
      break;

    case "teacher":
      socket.join(ROOMS.TEACHERS);
      socket.join(ROOMS.teacher(id));
      console.log(`[Socket.IO] Teacher joined room: ${ROOMS.TEACHERS}`);
      break;

    case "student":
      socket.join(ROOMS.STUDENTS);
      socket.join(ROOMS.student(id));
      console.log(`[Socket.IO] Student joined room: ${ROOMS.STUDENTS}`);
      break;

    default:
      console.warn(`[Socket.IO] Unknown role: ${role}`);
  }
};

/**
 * Register all event handlers
 */
const registerEventHandlers = (socket, io) => {
  // Join specific rooms
  socket.on("join:exam", (examId) => {
    const room = ROOMS.exam(examId);
    socket.join(room);
    console.log(`[Socket.IO] ${socket.user.email} joined exam room: ${room}`);

    socket.emit("joined:exam", { examId, room });
  });

  socket.on("leave:exam", (examId) => {
    const room = ROOMS.exam(examId);
    socket.leave(room);
    console.log(`[Socket.IO] ${socket.user.email} left exam room: ${room}`);

    socket.emit("left:exam", { examId, room });
  });

  socket.on("join:class", (classId) => {
    const room = ROOMS.class(classId);
    socket.join(room);
    console.log(`[Socket.IO] ${socket.user.email} joined class room: ${room}`);

    socket.emit("joined:class", { classId, room });
  });

  socket.on("leave:class", (classId) => {
    const room = ROOMS.class(classId);
    socket.leave(room);
    console.log(`[Socket.IO] ${socket.user.email} left class room: ${room}`);

    socket.emit("left:class", { classId, room });
  });

  // Ping/Pong for connection health
  socket.on("ping", () => {
    socket.emit("pong", { timestamp: Date.now() });
  });

  // Get active rooms
  socket.on("get:rooms", () => {
    const rooms = Array.from(socket.rooms).filter(room => room !== socket.id);
    socket.emit("rooms:list", { rooms });
  });
};

/**
 * Get Socket.IO instance (for use in other parts of app)
 */
let ioInstance = null;

const setSocketInstance = (io) => {
  ioInstance = io;
};

const getSocketInstance = () => {
  if (!ioInstance) {
    throw new Error("Socket.IO not initialized. Call initializeSocket first.");
  }
  return ioInstance;
};

module.exports = {
  initializeSocket,
  setSocketInstance,
  getSocketInstance
};