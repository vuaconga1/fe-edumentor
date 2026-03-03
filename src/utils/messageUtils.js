/**
 * Normalizes message types from different formats (string enum names or numbers)
 * into standard C# integer enums.
 * 0 = Text, 1 = File, 2 = Image, 3 = System
 * 
 * @param {string|number} rawType The raw message type to parse
 * @param {number} fallback The fallback type if unknown (default: 0)
 * @returns {number} The normalized integer message type
 */
export const normalizeMessageType = (rawType, fallback = 0) => {
    if (rawType == null) return fallback;

    if (typeof rawType === 'string') {
        const lower = rawType.toLowerCase();
        if (lower === 'text') return 0;
        if (lower === 'file') return 1;
        if (lower === 'image') return 2;
        if (lower === 'system') return 3;
        const num = Number(rawType);
        return isNaN(num) ? fallback : num;
    }

    const num = Number(rawType);
    return isNaN(num) ? fallback : num;
};

/**
 * Gets a clean preview string for notifications and conversation lists based on message type.
 * 
 * @param {number} messageType The normalized message type
 * @param {string} content The original message content (used for Text types)
 * @returns {string} The appropriate display preview
 */
export const getMessagePreview = (messageType, content) => {
    if (messageType === 2) return "Image";
    if (messageType === 1) return "File";
    return content || "";
};

/**
 * Checks if a message is an image or file either by its explicit type
 * or by parsing its URL extension as a fallback.
 * 
 * @param {number} messageType The normalized message type
 * @param {string} content The message content/url
 * @returns {boolean} True if it is considered a media file
 */
export const isMediaFile = (messageType, content) => {
    if (messageType === 1 || messageType === 2) return true;
    if (!content) return false;

    const isUrl = /^\/uploads\//i.test(content) || /^https?:\/\//i.test(content);
    const hasImageExt = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(content);
    return isUrl && hasImageExt;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Converts relative "/uploads/..." to absolute "https://.../uploads/..."
 * @param {string} url The URL to absolute-ify
 */
export const toAbsolute = (url) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url)) return url;
    return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};
