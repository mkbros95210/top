const express = require("express");
const { check } = require("express-validator");
const adminController = require("../controllers/adminController");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

/**
 * @route   POST /api/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post(
    "/login",
    [
        check("email", "Please include a valid email").isEmail(),
        check("password", "Password is required").exists(),
    ],
    adminController.login
);

/**
 * @route   GET /api/admin/me
 * @desc    Get admin profile
 * @access  Private (Admin)
 */
router.get("/me", adminAuth, adminController.getProfile);

/**
 * @route   PUT /api/admin/profile
 * @desc    Update admin profile
 * @access  Private (Admin)
 */
router.put("/profile", adminAuth, adminController.updateProfile);

/**
 * @route   PUT /api/admin/change-password
 * @desc    Change admin password
 * @access  Private (Admin)
 */
router.put(
    "/change-password",
    [
        adminAuth,
        check("current_password", "Current password is required")
            .not()
            .isEmpty(),
        check(
            "new_password",
            "New password must be at least 6 characters"
        ).isLength({ min: 6 }),
    ],
    adminController.changePassword
);

/**
 * @route   GET /api/admin/all
 * @desc    Get all admins
 * @access  Private (Super Admin)
 */
router.get("/all", adminAuth, adminController.getAllAdmins);

/**
 * @route   POST /api/admin/create
 * @desc    Create new admin
 * @access  Private (Super Admin)
 */
router.post(
    "/create",
    [
        adminAuth,
        check("name", "Name is required").not().isEmpty(),
        check("email", "Please include a valid email").isEmail(),
        check("password", "Password must be at least 6 characters").isLength({
            min: 6,
        }),
        check("role_id", "Role ID is required").not().isEmpty(),
    ],
    adminController.createAdmin
);

module.exports = router;
