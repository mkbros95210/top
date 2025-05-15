const express = require("express");
const { check } = require("express-validator");
const authController = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register user
 * @access  Public
 */
router.post(
    "/register",
    [
        check("f_name", "First name is required").not().isEmpty(),
        check("l_name", "Last name is required").not().isEmpty(),
        check("email", "Please include a valid email").isEmail(),
        check("phone", "Phone number is required").not().isEmpty(),
        check("password", "Password must be at least 6 characters").isLength({
            min: 6,
        }),
    ],
    authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
    "/login",
    [
        check("email", "Please include a valid email").isEmail(),
        check("password", "Password is required").exists(),
    ],
    authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get user profile
 * @access  Private
 */
router.get("/me", auth, authController.getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put("/profile", auth, authController.updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put(
    "/change-password",
    [
        auth,
        check("current_password", "Current password is required")
            .not()
            .isEmpty(),
        check(
            "new_password",
            "New password must be at least 6 characters"
        ).isLength({ min: 6 }),
    ],
    authController.changePassword
);

module.exports = router;
