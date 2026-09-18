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


// ==================== EXPRESS APP ====================

const app = express();


// ==================== HTTP SERVER ====================

const server = http.createServer(app);


// ==================== SOCKET.IO ====================

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});


// Make Socket.IO available to routes
app.set("io", io);


// ==================== MIDDLEWARE ====================

app.use(cors());
app.use(express.json());


// ==================== ROUTES ====================

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);


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


    // Join a specific group room
    socket.on("joinGroup", (groupId) => {

        socket.join(groupId);

        console.log(`User joined group: ${groupId}`);
    });


    // User disconnected
    socket.on("disconnect", () => {

        console.log("User disconnected:", socket.id);
    });

});


// ==================== MONGODB CONNECTION ====================

mongoose.connect(process.env.MONGO_URI)
    .then(() => {

        console.log("MongoDB connected successfully");

        const PORT = 5000;

        server.listen(PORT, () => {

            console.log(
                `Server running on http://localhost:${PORT}`
            );

        });

    })
    .catch((error) => {

        console.log(
            "MongoDB connection failed:",
            error
        );

    });