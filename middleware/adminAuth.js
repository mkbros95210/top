const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");

/**
 * Admin authentication middleware to protect admin routes
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

        // Find admin
        const admin = await Admin.findById(decoded.id).select("-password");

        if (!admin) {
            return res
                .status(401)
                .json({ message: "Not authorized as an admin" });
        }

        // Add admin to request
        req.admin = admin;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Token is not valid" });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token has expired" });
        }

        console.error("Admin auth middleware error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
