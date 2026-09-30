require('dotenv').config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./config/logger.config");
const { initializeSocket, setSocketInstance } = require("./config/socket.config");

// Single-process server (no cluster) - handy for local debugging
if (!process.env.MONGO_URI) {
    console.error("❌ [SOLO] MONGO_URI is not set. Add it to your .env file.");
    process.exit(1);
}

const PORT = process.env.PORT || 5000;

async function start() {
    try {
        console.log("🚀 [SOLO] Starting solo server...");

        // Connect to MongoDB FIRST
        console.log("🗄️ [SOLO] Connecting to DB...");
        await connectDB();
        console.log("✅ [SOLO] Connected to DB.");

        // Create HTTP server
        const server = http.createServer(app);

        // Initialize Socket.IO
        console.log("🔌 [SOLO] Initializing Socket...");
        const io = initializeSocket(server);
        setSocketInstance(io);
        console.log("✅ [SOLO] Socket initialized.");

        // Start server
        server.listen(PORT, () => {
            console.log(`✅ [SOLO] Solo server listening on port ${PORT}`);
        });

        process.on("uncaughtException", (error) => {
            console.error("🔥 [SOLO] UNCAUGHT EXCEPTION:");
            console.error(error.message);
            console.error(error.stack);
            process.exit(1);
        });

        process.on("unhandledRejection", (error) => {
            console.error("🔥 [SOLO] UNHANDLED REJECTION:");
            console.error(error instanceof Error ? error.message : error);
            console.error(error instanceof Error ? error.stack : "No stack trace");
            process.exit(1);
        });

    } catch (error) {
        console.error("❌ [SOLO] Failed to start solo server:");
        console.error(error);
        process.exit(1);
    }
}

start();
