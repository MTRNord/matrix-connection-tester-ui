import { ApiError } from "../apiTypes";

/**
 * Translates API errors using the provided translation function
 */
export function translateApiError(error: unknown, t: (key: string, extras?: Record<string, string>) => string): string {
    if (error instanceof ApiError) {
        const translationKey = `apiErrors.${error.code}`;
        let translatedMessage = t(translationKey);
        if (error.code === "SUPPORT_HTTP_ERROR" && error.details?.status) {
            translatedMessage = t(translationKey, { status: String(error.details.status) });
        }

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
