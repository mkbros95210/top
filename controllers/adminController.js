const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const Admin = require("../models/admin");
const AdminRole = require("../models/adminRole");

/**
 * Admin login
 * @route POST /api/admin/login
 */
exports.login = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find admin
        const admin = await Admin.findOne({ email }).populate("role");
        if (!admin) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check if admin is active
        if (admin.status !== 1) {
            return res.status(400).json({ message: "Account is inactive" });
        }

        // Check password
        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate token
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        // Return admin without password
        const adminObject = admin.toObject();
        delete adminObject.password;

        res.status(200).json({
            message: "Login successful",
            token,
            admin: adminObject,
        });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Get admin profile
 * @route GET /api/admin/me
 */
exports.getProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id)
            .select("-password")
            .populate("role");

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.status(200).json({ admin });
    } catch (error) {
        console.error("Get admin profile error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Update admin profile
 * @route PUT /api/admin/profile
 */
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;

        // Find admin
        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Update admin
        admin.name = name || admin.name;
        admin.phone = phone || admin.phone;

        // Handle image upload if provided
        if (req.file) {
            admin.image = req.file.path;
        }

        await admin.save();

        // Return admin without password
        const adminObject = admin.toObject();
        delete adminObject.password;

        res.status(200).json({
            message: "Profile updated successfully",
            admin: adminObject,
        });
    } catch (error) {
        console.error("Update admin profile error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Change admin password
 * @route PUT /api/admin/change-password
 */
exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        // Find admin
        const admin = await Admin.findById(req.admin.id);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Check current password
        const isMatch = await admin.comparePassword(current_password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ message: "Current password is incorrect" });
        }

        // Update password
        admin.password = new_password;
        await admin.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Change admin password error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Get all admins (super admin only)
 * @route GET /api/admin/all
 */
exports.getAllAdmins = async (req, res) => {
    try {
        // Check if super admin
        if (
            !req.admin.role ||
            !req.admin.role.modules.includes("admin_management")
        ) {
            return res
                .status(403)
                .json({ message: "Not authorized for this action" });
        }

        const admins = await Admin.find()
            .select("-password")
            .populate("role")
            .sort({ createdAt: -1 });

        res.status(200).json({ admins });
    } catch (error) {
        console.error("Get all admins error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Create new admin (super admin only)
 * @route POST /api/admin/create
 */
exports.createAdmin = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Check if super admin
        if (
            !req.admin.role ||
            !req.admin.role.modules.includes("admin_management")
        ) {
            return res
                .status(403)
                .json({ message: "Not authorized for this action" });
        }

        const { name, email, password, phone, role_id } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res
                .status(400)
                .json({ message: "Admin already exists with this email" });
        }

        // Create new admin
        const admin = new Admin({
            name,
            email,
            password,
            phone,
            role_id,
        });

        // Handle image upload if provided
        if (req.file) {
            admin.image = req.file.path;
        }

        await admin.save();

        // Return admin without password
        const adminObject = admin.toObject();
        delete adminObject.password;

        res.status(201).json({
            message: "Admin created successfully",
            admin: adminObject,
        });
    } catch (error) {
        console.error("Create admin error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
