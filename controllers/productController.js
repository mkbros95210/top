const { validationResult } = require("express-validator");
const Product = require("../models/product");
const mongoose = require("mongoose");

/**
 * Get all products with pagination
 * @route GET /api/products
 */
exports.getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skipIndex = (page - 1) * limit;

        const search = req.query.search || "";
        const category = req.query.category || null;
        const featured = req.query.featured === "1" ? 1 : null;

        // Build query
        let query = { status: 1 }; // Only active products

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { "translations.name": { $regex: search, $options: "i" } },
            ];
        }

        if (category) {
            query.category_id = mongoose.Types.ObjectId(category);
        }

        if (featured) {
            query.is_featured = featured;
        }

        // Execute query with pagination
        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skipIndex)
            .limit(limit)
            .populate("category_id", "name");

        // Get total count
        const total = await Product.countDocuments(query);

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            products,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit,
            },
        });
    } catch (error) {
        console.error("Get products error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Get a product by ID
 * @route GET /api/products/:id
 */
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate("category_id", "name")
            .populate({
                path: "reviews",
                populate: {
                    path: "user_id",
                    select: "name image",
                },
            })
            .populate("tags", "name");

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Increment view count or record visit if user is logged in
        if (req.user) {
            // Implementation of recording visit would be added here
        }

        res.status(200).json({ product });
    } catch (error) {
        console.error("Get product error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Create a new product (admin only)
 * @route POST /api/products
 */
exports.createProduct = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name,
            description,
            price,
            tax,
            category_id,
            discount,
            discount_type,
            unit,
            total_stock,
            capacity,
            is_featured,
            status,
            translations,
            tags,
        } = req.body;

        // Handle image upload (implementation would depend on your file upload mechanism)
        let image = null;
        if (req.file) {
            image = req.file.path;
        }

        // Create new product
        const product = new Product({
            name,
            description,
            price,
            tax: tax || 0,
            category_id,
            discount: discount || 0,
            discount_type: discount_type || "percent",
            unit,
            total_stock: total_stock || 0,
            capacity,
            is_featured: is_featured || 0,
            status: status || 1,
            image,
            translations: translations || [],
        });

        // Save product
        await product.save();

        // Handle tags if provided
        if (tags && tags.length > 0) {
            // Implementation would depend on how you handle tags
        }

        res.status(201).json({
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        console.error("Create product error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Update a product (admin only)
 * @route PUT /api/products/:id
 */
exports.updateProduct = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Find product
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Update fields
        const updateData = req.body;

        // Handle image upload if a new image is provided
        if (req.file) {
            updateData.image = req.file.path;
        }

        // Update product
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            message: "Product updated successfully",
            product: updatedProduct,
        });
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

/**
 * Delete a product (admin only)
 * @route DELETE /api/products/:id
 */
exports.deleteProduct = async (req, res) => {
    try {
        // Find product
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Delete product
        await Product.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
