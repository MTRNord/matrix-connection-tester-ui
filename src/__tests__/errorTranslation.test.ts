import { describe, it, expect, vi } from 'vitest';
import { translateApiError } from '../utils/errorTranslation';
import { ApiError } from '../apiTypes';

describe('translateApiError', () => {
    it('translates ApiError with existing translation key', () => {
        const mockT = vi.fn((key: string) => {
            const translations: Record<string, string> = {
                'apiErrors.EMPTY_SERVER_NAME': 'Server name cannot be empty',
                'apiErrors.API_SERVER_NOT_CONFIGURED': 'API server URL is not configured',
            };
            return translations[key] || key;
        });

        const error = new ApiError('EMPTY_SERVER_NAME', 'Original message');
        const result = translateApiError(error, mockT);

        expect(mockT).toHaveBeenCalledWith('apiErrors.EMPTY_SERVER_NAME');
        expect(result).toBe('Server name cannot be empty');
    });

    it('falls back to original message when translation key does not exist', () => {
        const mockT = vi.fn((key: string) => key); // Returns the key itself when no translation

        const error = new ApiError('UNKNOWN_ERROR', 'Original error message');
        const result = translateApiError(error, mockT);

        expect(mockT).toHaveBeenCalledWith('apiErrors.UNKNOWN_ERROR');
        expect(result).toBe('Original error message');
    });

    it('handles regular Error objects', () => {
        const mockT = vi.fn();
        const error = new Error('Regular error message');
        const result = translateApiError(error, mockT);

        expect(mockT).not.toHaveBeenCalled();
        expect(result).toBe('Regular error message');
    });

    it('handles non-Error objects by converting to string', () => {
        const mockT = vi.fn();
        const error = 'String error';
        const result = translateApiError(error, mockT);

        expect(mockT).not.toHaveBeenCalled();
        expect(result).toBe('String error');
    });

    it('handles null and undefined errors', () => {
        const mockT = vi.fn();

        const nullResult = translateApiError(null, mockT);
        const undefinedResult = translateApiError(undefined, mockT);

        expect(nullResult).toBe('null');
        expect(undefinedResult).toBe('undefined');
    });

    it('handles objects by converting to string', () => {
        const mockT = vi.fn();
        const error = { message: 'Object error', code: 500 };
        const result = translateApiError(error, mockT);

        expect(result).toBe('[object Object]');
    });

    it('translates multiple different ApiError codes correctly', () => {
        const mockT = vi.fn((key: string) => {
            const translations: Record<string, string> = {
                'apiErrors.API_HTTP_ERROR': 'Failed to connect to the federation API server',
                'apiErrors.SUPPORT_HTTP_ERROR': 'Failed to fetch support information from the server',
                'apiErrors.SUPPORT_INVALID_CONTENT_TYPE': 'Expected JSON response from support endpoint',
            };
            return translations[key] || key;
        });

        const httpError = new ApiError('API_HTTP_ERROR', 'HTTP error');
        const supportError = new ApiError('SUPPORT_HTTP_ERROR', 'Support error');
        const contentTypeError = new ApiError('SUPPORT_INVALID_CONTENT_TYPE', 'Content type error');

        expect(translateApiError(httpError, mockT)).toBe('Failed to connect to the federation API server');
        expect(translateApiError(supportError, mockT)).toBe('Failed to fetch support information from the server');
        expect(translateApiError(contentTypeError, mockT)).toBe('Expected JSON response from support endpoint');
    });
});
