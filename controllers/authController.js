const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/user");

/**
 * Register a new user
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { f_name, l_name, email, phone, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "User already exists with this email" });
        }

        // Generate referral code
        const referralCode = Math.random()
            .toString(36)
            .substring(2, 10)
            .toUpperCase();

        // Create user
        const user = new User({
            f_name,
            l_name,
            name: `${f_name} ${l_name}`,
            email,
            phone,
            password,
            referral_code: referralCode,
        });

        // Save user to database
        await user.save();

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        // Return user without password
        const userObject = user.toObject();
        delete userObject.password;

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: userObject,
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        // Return user without password
        const userObject = user.toObject();
        delete userObject.password;

        res.status(200).json({
            message: "Login successful",
            token,
            user: userObject,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password")
            .populate("orders")
            .populate("addresses")
            .populate("favorite_products");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 */
exports.updateProfile = async (req, res) => {
    try {
        const { f_name, l_name, phone } = req.body;

        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update user
        user.f_name = f_name || user.f_name;
        user.l_name = l_name || user.l_name;
        user.name = `${f_name || user.f_name} ${l_name || user.l_name}`;
        user.phone = phone || user.phone;

        await user.save();

        // Return user without password
        const userObject = user.toObject();
        delete userObject.password;

        res.status(200).json({
            message: "Profile updated successfully",
            user: userObject,
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Change password
 * @route PUT /api/auth/change-password
 */
exports.changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check current password
        const isMatch = await user.comparePassword(current_password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ message: "Current password is incorrect" });
        }

        // Update password
        user.password = new_password;
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
