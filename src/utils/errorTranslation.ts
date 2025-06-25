import { ApiError } from "../apiTypes";

/**
 * Translates API errors using the provided translation function
 */
export function translateApiError(error: unknown, t: (key: string) => string): string {
    if (error instanceof ApiError) {
        const translationKey = `apiErrors.${error.code}`;
        const translatedMessage = t(translationKey);

        // If translation exists, use it; otherwise fall back to original message
        if (translatedMessage !== translationKey) {
            return translatedMessage;
        }
    }

    // For non-ApiError or missing translations, return the original message
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
}
