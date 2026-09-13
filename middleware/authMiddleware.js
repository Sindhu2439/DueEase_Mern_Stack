const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "No authorization token provided"
            });
        }

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Invalid authorization format"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const userId =
            decoded.id ||
            decoded.userId ||
            decoded._id;

        if (!userId) {
            return res.status(401).json({
                message: "User ID not found in token"
            });
        }

        // Make user ID available to all protected routes
        req.userId = userId;

        // Also keep the user object available
        req.user = {
            id: userId
        };

        next();

    } catch (error) {
        console.error(
            "Authentication error:",
            error.message
        );

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};

module.exports = authMiddleware;