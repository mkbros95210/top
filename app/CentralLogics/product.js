/**
 * प्रोडक्ट लॉजिक - प्रोडक्ट ऑपरेशन के लिए हेल्पर फंक्शन
 */

const CategoryDiscount = require("../../models/CategoryDiscount");
const FavoriteProduct = require("../../models/FavoriteProduct");
const Order = require("../../models/Order");
const OrderDetail = require("../../models/OrderDetail");
const Product = require("../../models/Product");
const Review = require("../../models/Review");
const User = require("../../models/User");
const Helpers = require("./helpers");

/**
 * आईडी द्वारा प्रोडक्ट प्राप्त करें
 * @param {string} id - प्रोडक्ट आईडी
 * @returns {Promise<Object>} रेटिंग और रिव्यू के साथ प्रोडक्ट
 */
const get_product = async (id) => {
    return await Product.findOne({ _id: id, status: 1 })
        .populate("wishlist")
        .populate("rating")
        .populate({
            path: "active_reviews",
            populate: {
                path: "customer",
            },
        });
};

/**
 * नवीनतम प्रोडक्ट प्राप्त करें
 * @param {number} limit - वापस करने के लिए प्रोडक्ट की संख्या
 * @param {number} offset - पेज नंबर
 * @returns {Promise<Object>} पेजिनेटेड प्रोडक्ट
 */
const get_latest_products = async (limit = 10, offset = 1) => {
    const skip = (offset - 1) * limit;

    const products = await Product.find({ status: 1 })
        .populate("wishlist")
        .populate("rating")
        .populate("active_reviews")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Product.countDocuments({ status: 1 });

    return {
        total_size: total,
        limit,
        offset,
        products,
    };
};

/**
 * यूजर के लिए पसंदीदा प्रोडक्ट प्राप्त करें
 * @param {number} limit - वापस करने के लिए प्रोडक्ट की संख्या
 * @param {number} offset - पेज नंबर
 * @param {string} user_id - यूजर आईडी
 * @returns {Promise<Object>} पेजिनेटेड पसंदीदा प्रोडक्ट
 */
const get_favorite_products = async (limit, offset, user_id) => {
    limit = limit || 10;
    offset = offset || 1;
    const skip = (offset - 1) * limit;

    // यूजर के पसंदीदा प्रोडक्ट प्राप्त करें
    const user = await User.findById(user_id).populate("favorite_products");
    const favorite_product_ids = user.favorite_products.map(
        (fp) => fp.product_id
    );

    // पसंदीदा प्रोडक्ट प्राप्त करें
    const products = await Product.find({ _id: { $in: favorite_product_ids } })
        .skip(skip)
        .limit(limit);

    const total = await Product.countDocuments({
        _id: { $in: favorite_product_ids },
    });

    // प्रोडक्ट को फॉर्मेट करें
    const formatted_products = await Helpers.product_data_formatting(
        products,
        true
    );

    return {
        total_size: total,
        limit,
        offset,
        products: formatted_products,
    };
};

/**
 * संबंधित प्रोडक्ट प्राप्त करें
 * @param {string} product_id - प्रोडक्ट आईडी
 * @returns {Promise<Array>} संबंधित प्रोडक्ट
 */
const get_related_products = async (product_id) => {
    const product = await Product.findById(product_id);
    if (!product) return [];

    return await Product.find({
        category_ids: product.category_ids,
        _id: { $ne: product._id },
        status: 1,
    })
        .populate("wishlist")
        .populate("rating")
        .populate("active_reviews")
        .limit(10);
};

/**
 * नाम से प्रोडक्ट खोजें
 * @param {string} name - खोज क्वेरी
 * @param {number} limit - वापस करने के लिए प्रोडक्ट की संख्या
 * @param {number} offset - पेज नंबर
 * @returns {Promise<Object>} पेजिनेटेड खोज परिणाम
 */
const search_products = async (name, limit = 10, offset = 1) => {
    const skip = (offset - 1) * limit;
    const keywords = name.split(" ");

    // कीवर्ड के साथ खोज क्वेरी बनाएं
    const searchQuery = {
        status: 1,
        $or: [
            ...keywords.map((keyword) => ({
                name: { $regex: keyword, $options: "i" },
            })),
            {
                "tags.tag": {
                    $in: keywords.map((keyword) => new RegExp(keyword, "i")),
                },
            },
        ],
    };

    const products = await Product.find(searchQuery)
        .populate("wishlist")
        .populate("rating")
        .populate("active_reviews")
        .skip(skip)
        .limit(limit);

    const total = await Product.countDocuments(searchQuery);

    return {
        total_size: total,
        limit,
        offset,
        products,
    };
};

/**
 * प्रोडक्ट रिव्यू प्राप्त करें
 * @param {string} id - प्रोडक्ट आईडी
 * @returns {Promise<Array>} प्रोडक्ट रिव्यू
 */
const get_product_review = async (id) => {
    return await Review.find({ product_id: id, status: 1 });
};

/**
 * स्टार वैल्यू द्वारा रेटिंग गिनती प्राप्त करें
 * @param {Array} reviews - रिव्यू का एरे
 * @returns {Array} 5, 4, 3, 2, 1 स्टार रिव्यू की गिनती
 */
const get_rating = (reviews) => {
    let rating5 = 0;
    let rating4 = 0;
    let rating3 = 0;
    let rating2 = 0;
    let rating1 = 0;

    reviews.forEach((review) => {
        if (review.rating === 5) rating5 += 1;
        if (review.rating === 4) rating4 += 1;
        if (review.rating === 3) rating3 += 1;
        if (review.rating === 2) rating2 += 1;
        if (review.rating === 1) rating1 += 1;
    });

    return [rating5, rating4, rating3, rating2, rating1];
};

/**
 * रिव्यू से समग्र रेटिंग प्राप्त करें
 * @param {Array} reviews - रिव्यू का एरे
 * @returns {Array} [औसत रेटिंग, कुल रेटिंग गिनती]
 */
const get_overall_rating = (reviews) => {
    const totalRating = reviews.length;
    let rating = 0;

    reviews.forEach((review) => {
        rating += review.rating;
    });

    const overallRating =
        totalRating === 0 ? 0 : parseFloat((rating / totalRating).toFixed(2));

    return [overallRating, totalRating];
};

/**
 * लोकप्रिय प्रोडक्ट प्राप्त करें
 * @param {number} limit - वापस करने के लिए प्रोडक्ट की संख्या
 * @param {number} offset - पेज नंबर
 * @returns {Promise<Object>} पेजिनेटेड लोकप्रिय प्रोडक्ट
 */
const get_popular_products = async (limit = 10, offset = 1) => {
    const skip = (offset - 1) * limit;

    const products = await Product.find({ status: 1 })
        .populate("rating")
        .populate("active_reviews")
        .sort({ popularity_count: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Product.countDocuments({ status: 1 });

    return {
        total_size: total,
        limit,
        offset,
        products,
    };
};

/**
 * सबसे ज्यादा देखे गए प्रोडक्ट प्राप्त करें
 * @param {number} limit - वापस करने के लिए प्रोडक्ट की संख्या
 * @param {number} offset - पेज नंबर
 * @returns {Promise<Object>} पेजिनेटेड सबसे ज्यादा देखे गए प्रोडक्ट
 */
const get_most_viewed_products = async (limit = 10, offset = 1) => {
    const skip = (offset - 1) * limit;

    const products = await Product.find({ status: 1 })
        .populate("rating")
        .populate("active_reviews")
        .sort({ view_count: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Product.countDocuments({ status: 1 });

    return {
        total_size: total,
        limit,
        offset,
        products,
    };
};

/**
 * ट्रेंडिंग प्रोडक्ट प्राप्त करें
 * @param {number} limit - वापस करने के लिए प्रोडक्ट की संख्या
 * @param {number} offset - पेज नंबर
 * @returns {Promise<Object>} पेजिनेटेड ट्रेंडिंग प्रोडक्ट
 */
const get_trending_products = async (limit = 10, offset = 1) => {
    const skip = (offset - 1) * limit;

    // जांचें कि क्या हमारे पास कोई ऑर्डर है
    const orderDetailsCount = await OrderDetail.countDocuments();

    let products;
    let total;

    if (orderDetailsCount > 0) {
        // पिछले 30 दिनों में ऑर्डर किए गए प्रोडक्ट प्राप्त करें
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // ऑर्डर गिनती के साथ प्रोडक्ट को एकत्रित करें
        const productsWithOrderCount = await OrderDetail.aggregate([
            { $match: { createdAt: { $gt: thirtyDaysAgo } } },
            { $group: { _id: "$product_id", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        const productIds = productsWithOrderCount.map((p) => p._id);

        products = await Product.find({
            _id: { $in: productIds },
            status: 1,
        })
            .populate("rating")
            .populate("active_reviews");

        // ऑर्डर गिनती के आधार पर प्रोडक्ट को सॉर्ट करें
        products = products.sort((a, b) => {
            const aCount =
                productsWithOrderCount.find((p) => p._id.equals(a._id))
                    ?.count || 0;
            const bCount =
                productsWithOrderCount.find((p) => p._id.equals(b._id))
                    ?.count || 0;
            return bCount - aCount;
        });

        total = await OrderDetail.aggregate([
            { $match: { createdAt: { $gt: thirtyDaysAgo } } },
            { $group: { _id: "$product_id" } },
            { $count: "total" },
        ]);

        total = total.length > 0 ? total[0].total : 0;
    } else {
        // यदि कोई ऑर्डर नहीं है, तो रैंडम प्रोडक्ट वापस करें
        products = await Product.find({ status: 1 })
            .populate("rating")
            .populate("active_reviews")
            .skip(skip)
            .limit(limit);

        total = await Product.countDocuments({ status: 1 });
    }

    return {
        total_size: total,
        limit,
        offset,
        products,
    };
};

/**
 * अनुशंसित प्रोडक्ट प्राप्त करें
 * @param {Object} user - यूजर ऑब्जेक्ट
 * @param {number} limit - वापस करने के लिए प्रोडक्ट की संख्या
 * @param {number} offset - पेज नंबर
 * @returns {Promise<Object>} पेजिनेटेड अनुशंसित प्रोडक्ट
 */
const get_recommended_products = async (user, limit = 10, offset = 1) => {
    const skip = (offset - 1) * limit;

    let products;
    let total;

    if (user) {
        // यूजर के लिए ऑर्डर आईडी प्राप्त करें
        const orders = await Order.find({ user_id: user._id });
        const orderIds = orders.map((order) => order._id);

        // ऑर्डर विवरण से प्रोडक्ट आईडी प्राप्त करें
        const orderDetails = await OrderDetail.find({
            order_id: { $in: orderIds },
        });
        const productIds = [
            ...new Set(orderDetails.map((detail) => detail.product_id)),
        ];

        // उन प्रोडक्ट से कैटेगरी प्राप्त करें
        const purchasedProducts = await Product.find({
            _id: { $in: productIds },
        });

        // प्रोडक्ट से कैटेगरी आईडी निकालें
        const categoryIds = [];
        purchasedProducts.forEach((product) => {
            const categories =
                typeof product.category_ids === "string"
                    ? JSON.parse(product.category_ids)
                    : product.category_ids;

            categories.forEach((category) => {
                if (category.position === 1) {
                    categoryIds.push(category.id);
                }
            });
        });

        // डुप्लिकेट हटाएं
        const uniqueCategoryIds = [...new Set(categoryIds)];

        // इन कैटेगरी वाले प्रोडक्ट ढूंढें
        const query = {
            status: 1,
            $or: uniqueCategoryIds.map((id) => ({
                category_ids: {
                    $elemMatch: {
                        id: id,
                        position: 1,
                    },
                },
            })),
        };

        products = await Product.find(query)
            .populate("rating")
            .populate("active_reviews")
            .skip(skip)
            .limit(limit);

        total = await Product.countDocuments(query);
    } else {
        // यदि कोई यूजर नहीं है, तो रैंडम प्रोडक्ट वापस करें
        products = await Product.find({ status: 1 })
            .populate("rating")
            .populate("active_reviews")
            .skip(skip)
            .limit(limit);

        total = await Product.countDocuments({ status: 1 });
    }

    return {
        total_size: total,
        limit,
        offset,
        products,
    };
};

/**
 * सबसे ज्यादा समीक्षा वाले प्रोडक्ट प्राप्त करें
 * @param {number} limit - वापस करने के लिए प्रोडक्ट की संख्या
 * @param {number} offset - पेज नंबर
 * @returns {Promise<Object>} पेजिनेटेड सबसे ज्यादा समीक्षा वाले प्रोडक्ट
 */
const get_most_reviewed_products = async (limit = 10, offset = 1) => {
    const skip = (offset - 1) * limit;

    // समीक्षा गिनती के साथ प्रोडक्ट को एकत्रित करें
    const productsWithReviewCount = await Review.aggregate([
        { $match: { status: 1 } },
        { $group: { _id: "$product_id", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $skip: skip },
        { $limit: limit },
    ]);

    const productIds = productsWithReviewCount.map((p) => p._id);

    const products = await Product.find({
        _id: { $in: productIds },
        status: 1,
    })
        .populate("rating")
        .populate("active_reviews");

    // समीक्षा गिनती के आधार पर प्रोडक्ट को सॉर्ट करें
    products.sort((a, b) => {
        const aCount =
            productsWithReviewCount.find((p) => p._id.equals(a._id))?.count ||
            0;
        const bCount =
            productsWithReviewCount.find((p) => p._id.equals(b._id))?.count ||
            0;
        return bCount - aCount;
    });

    const total = await Review.aggregate([
        { $match: { status: 1 } },
        { $group: { _id: "$product_id" } },
        { $count: "total" },
    ]);

    return {
        total_size: total.length > 0 ? total[0].total : 0,
        limit,
        offset,
        products,
    };
};

module.exports = {
    get_product,
    get_latest_products,
    get_favorite_products,
    get_related_products,
    search_products,
    get_product_review,
    get_rating,
    get_overall_rating,
    get_popular_products,
    get_most_viewed_products,
    get_trending_products,
    get_recommended_products,
    get_most_reviewed_products,
};
