/**
 * Application configuration
 */
module.exports = {
    name: process.env.APP_NAME || "GroFresh",
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 8000,
    url: process.env.APP_URL || "http://localhost:8000",
    debug: process.env.APP_DEBUG === "true",
    mode: process.env.APP_MODE || "live",

    // Pagination defaults
    pagination: {
        limit: 10,
        max_limit: 100,
    },

    // File upload configuration
    upload: {
        path: process.env.UPLOAD_PATH || "uploads",
        allowed_types: ["image/jpeg", "image/png", "image/gif"],
        max_size: 2 * 1024 * 1024, // 2MB
    },

    // Software information
    software: {
        id: process.env.SOFTWARE_ID,
        buyer_username: process.env.BUYER_USERNAME,
        purchase_code: process.env.PURCHASE_CODE,
    },
};
