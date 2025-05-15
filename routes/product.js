const express = require("express");
const { check } = require("express-validator");
const productController = require("../controllers/productController");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth"); // We'll need to create this

const router = express.Router();

/**
 * @route   GET /api/products
 * @desc    Get all products with pagination
 * @access  Public
 */
router.get("/", productController.getProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get("/:id", productController.getProduct);

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Admin
 */
router.post(
    "/",
    [
        adminAuth,
        check("name", "Name is required").not().isEmpty(),
        check("description", "Description is required").not().isEmpty(),
        check("price", "Price is required").isNumeric(),
        check("category_id", "Category is required").not().isEmpty(),
    ],
    productController.createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Admin
 */
router.put(
    "/:id",
    [
        adminAuth,
        check("name", "Name is required").optional().not().isEmpty(),
        check("price", "Price must be a number").optional().isNumeric(),
    ],
    productController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Admin
 */
router.delete("/:id", adminAuth, productController.deleteProduct);

module.exports = router;
