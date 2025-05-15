const fs = require("fs");
const path = require("path");
const Helpers = require("./helpers");

/**
 * Translates a key to the corresponding text in the current locale
 *
 * @param {string} key - The translation key to look up
 * @returns {string} - The translated text
 */
function translate(key) {
    try {
        // Get current locale from session or default to 'en'
        // In a Node.js environment, you'd typically use a request object or context
        // This implementation assumes you have a session mechanism
        const local =
            global.session && global.session.local
                ? global.session.local
                : "en";

        // Read the language file
        const langFilePath = path.join(
            process.cwd(),
            "resources",
            "lang",
            local,
            "messages.js"
        );
        let langArray = {};

        try {
            langArray = require(langFilePath);
        } catch (err) {
            // If file doesn't exist, create an empty object
            langArray = {};
        }

        // Process the key similar to the PHP version
        const processedKey = Helpers.removeInvalidCharacters(key)
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

        if (!langArray[key]) {
            // Key doesn't exist, add it to the language file
            langArray[key] = processedKey;

            // Write back to the file
            const fileContent = `module.exports = ${JSON.stringify(
                langArray,
                null,
                2
            )};`;
            fs.writeFileSync(langFilePath, fileContent);

            return processedKey;
        } else {
            // Return the translation
            return langArray[key];
        }
    } catch (error) {
        console.error("Translation error:", error);
        // Return the key as fallback
        return key;
    }
}

module.exports = { translate };
