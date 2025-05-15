/**
 * Database configuration
 */
module.exports = {
    mongodb: {
        uri: process.env.MONGODB_URI || "mongodb://localhost:27017/grofresh",
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
};
