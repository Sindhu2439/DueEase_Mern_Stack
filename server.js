const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const groupRoutes = require("./routes/groupRoutes");
const expenseRoutes = require("./routes/expenseRoutes");


// ==================== MONGODB CONNECTION ====================

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((error) => {
        console.log("MongoDB connection failed:", error);
    });


// ==================== EXPRESS APP ====================

const app = express();


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


// ==================== START SERVER ====================

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});