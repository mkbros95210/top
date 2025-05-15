/**
 * Authentication configuration
 */
module.exports = {
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },

    // Password hashing
    bcrypt: {
        salt_rounds: 10,
    },
};
