const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const groupRoutes = require("./routes/groupRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const receiptRoutes = require("./routes/receiptRoutes");

// ==================== EXPRESS APP ====================

const app = express();

// ==================== HTTP SERVER ====================

const server = http.createServer(app);

// ==================== ENVIRONMENT ====================

const PORT = process.env.PORT || 5000;

const FRONTEND_URL =
    process.env.FRONTEND_URL || "http://localhost:5173";

// ==================== ALLOWED ORIGINS ====================

const allowedOrigins = [
    "http://localhost:5173",
    "https://dueease-frontend.onrender.com",
    FRONTEND_URL
];

// Remove duplicate origins
const uniqueOrigins = [...new Set(allowedOrigins)];

// ==================== SOCKET.IO ====================

const io = new Server(server, {
    cors: {
        origin: uniqueOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Make Socket.IO available to routes
app.set("io", io);

// ==================== MIDDLEWARE ====================

app.use(
    cors({
        origin: uniqueOrigins,
        credentials: true
    })
);

app.use(express.json());

// ==================== ROUTES ====================

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/receipts", receiptRoutes);

// ==================== HOME ROUTE ====================

app.get("/", (req, res) => {
    res.send("DueEase Backend is running!");
});

// ==================== PROTECTED ROUTE ====================

app.get("/api/protected", authMiddleware, (req, res) => {
    res.json({
        message: "You have access to this protected route!",
        userId: req.userId
    });
});

// ==================== SOCKET.IO CONNECTION ====================

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("joinGroup", (groupId) => {
        socket.join(groupId);

        console.log(`User joined group: ${groupId}`);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// ==================== MONGODB CONNECTION ====================

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log("MongoDB connection failed:", error);
    });