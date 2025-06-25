/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

declare const __APP_VERSION__: string;

declare global {
    var __APP_VERSION__: string;
}