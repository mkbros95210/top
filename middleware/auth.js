const jwt = require("jsonwebtoken");
const User = require("../models/user");

/**
 * Authentication middleware to protect routes
 */
module.exports = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            return res
                .status(401)
                .json({ message: "No token, authorization denied" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(401).json({ message: "Token is not valid" });
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Token is not valid" });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token has expired" });
        }

        console.error("Auth middleware error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
