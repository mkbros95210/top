const BusinessSetting = require("../models/BusinessSetting");
const CategoryDiscount = require("../models/CategoryDiscount");
const Currency = require("../models/Currency");
const DMReview = require("../models/DMReview");
const Order = require("../models/Order");
const Review = require("../models/Review");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

class Helpers {
    static error_processor(validator) {
        const err_keeper = [];
        for (const [index, error] of Object.entries(
            validator.errors.getMessages()
        )) {
            err_keeper.push({ code: index, message: error[0] });
        }
        return err_keeper;
    }

    static combinations(arrays) {
        let result = [[]];
        for (const [property, property_values] of Object.entries(arrays)) {
            const tmp = [];
            for (const result_item of result) {
                for (const property_value of property_values) {
                    tmp.push({ ...result_item, [property]: property_value });
                }
            }
            result = tmp;
        }
        return result;
    }

    static variation_price(product, variation) {
        let result;

        if (!variation || JSON.parse(variation).length === 0) {
            result = product.price;
        } else {
            const match = JSON.parse(variation)[0];
            result = 0;

            for (const [property, value] of Object.entries(
                JSON.parse(product.variations)
            )) {
                if (value.type === match.type) {
                    result = value.price;
                }
            }
        }

        return this.set_price(result);
    }

    static async product_data_formatting(data, multi_data = false) {
        if (multi_data === true) {
            const storage = [];

            for (const item of data) {
                const variations = [];
                item.category_ids = JSON.parse(item.category_ids);
                item.image = JSON.parse(item.image);
                item.attributes = JSON.parse(item.attributes);
                item.choice_options = JSON.parse(item.choice_options);

                const categories = Array.isArray(item.category_ids)
                    ? item.category_ids
                    : JSON.parse(item.category_ids);
                if (categories && categories.length > 0) {
                    const ids = [];
                    for (const value of categories) {
                        if (value.position === 1) {
                            ids.push(value.id);
                        }
                    }
                    item.category_discount = await CategoryDiscount.findOne({
                        category_id: { $in: ids },
                        status: 1,
                    });
                } else {
                    item.category_discount = [];
                }

                for (const variation of JSON.parse(item.variations)) {
                    variations.push({
                        type: variation.type,
                        price: parseFloat(variation.price),
                        stock: variation.stock ? parseInt(variation.stock) : 0,
                    });
                }
                item.variations = variations;

                if (item.translations && item.translations.length) {
                    for (const translation of item.translations) {
                        if (translation.key === "name") {
                            item.name = translation.value;
                        }
                        if (translation.key === "description") {
                            item.description = translation.value;
                        }
                    }
                }

                delete item.translations;
                storage.push(item);
            }

            return storage;
        } else {
            const variations = [];
            data.category_ids = JSON.parse(data.category_ids);
            data.image = JSON.parse(data.image);
            data.attributes = JSON.parse(data.attributes);
            data.choice_options = JSON.parse(data.choice_options);

            const categories = Array.isArray(data.category_ids)
                ? data.category_ids
                : JSON.parse(data.category_ids);
            if (categories && categories.length > 0) {
                const ids = [];
                for (const value of categories) {
                    if (value.position === 1) {
                        ids.push(value.id);
                    }
                }
                data.category_discount = await CategoryDiscount.findOne({
                    category_id: { $in: ids },
                    status: 1,
                });
            } else {
                data.category_discount = [];
            }

            for (const variation of JSON.parse(data.variations)) {
                variations.push({
                    type: variation.type,
                    price: parseFloat(variation.price),
                    stock: variation.stock ? parseInt(variation.stock) : 0,
                });
            }
            data.variations = variations;

            if (data.translations && data.translations.length > 0) {
                for (const translation of data.translations) {
                    if (translation.key === "name") {
                        data.name = translation.value;
                    }
                    if (translation.key === "description") {
                        data.description = translation.value;
                    }
                }
            }

            return data;
        }
    }

    static async get_business_settings(name) {
        let config = null;
        const data = await BusinessSetting.findOne({ key: name });

        if (data) {
            try {
                config = JSON.parse(data.value);
            } catch (e) {
                config = data.value;
            }
        }

        return config;
    }

    static async currency_code() {
        const data = await BusinessSetting.findOne({ key: "currency" });
        return data ? data.value : null;
    }

    static async currency_symbol() {
        const currencyCode = await this.currency_code();
        const currency = await Currency.findOne({
            currency_code: currencyCode,
        });
        return currency ? currency.currency_symbol : null;
    }

    static async set_symbol(amount) {
        const decimalPointSettings = await this.get_business_settings(
            "decimal_point_settings"
        );
        const position = await this.get_business_settings(
            "currency_symbol_position"
        );
        const symbol = await this.currency_symbol();

        if (position === "left") {
            return `${symbol}${Number(amount).toFixed(decimalPointSettings)}`;
        } else {
            return `${Number(amount).toFixed(decimalPointSettings)}${symbol}`;
        }
    }

    static async set_price(amount) {
        const decimalPointSettings = await this.get_business_settings(
            "decimal_point_settings"
        );
        return Number(amount).toFixed(decimalPointSettings);
    }

    static async send_push_notif_to_device(fcmToken, data) {
        const key = await BusinessSetting.findOne({
            key: "push_notification_key",
        });

        if (!key) {
            return { message: "Push notification setup error" };
        }

        // Implementation would depend on the FCM library/service you choose
        // This is a placeholder for the actual implementation
        try {
            // Example with firebase-admin:
            // const message = {
            //   notification: {
            //     title: data.title,
            //     body: data.description,
            //   },
            //   token: fcmToken
            // };
            //
            // const response = await admin.messaging().send(message);
            // return response;

            return { message: "Notification sent successfully" };
        } catch (error) {
            console.error("Push notification error:", error);
            return { message: "Failed to send notification" };
        }
    }

    static removeInvalidCharacters(str) {
        return str.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "");
    }
}

module.exports = Helpers;
