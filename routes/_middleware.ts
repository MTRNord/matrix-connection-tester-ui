import { define } from "../utils.ts";
import { detectLocale, getAvailableLocales, type Locale } from "../lib/i18n.ts";

/**
 * Middleware to set up i18n for each request
 * Automatically detects locale from Accept-Language header, cookies, or query params
 */
export default define.middleware(async (ctx) => {
  const url = new URL(ctx.req.url);
  const cookies = ctx.req.headers.get("Cookie") || "";

  // Priority: query param > cookie > Accept-Language header > default
  const langParam = url.searchParams.get("lang");
  const cookieMatch = cookies.match(/lang=([^;]+)/);
  const cookieLang = cookieMatch ? cookieMatch[1] : null;
  const acceptLanguage = ctx.req.headers.get("Accept-Language");
  const detectedLocale = detectLocale(acceptLanguage);

  // Validate and select locale
  const availableLocales = getAvailableLocales();
  let selectedLocale: Locale = detectedLocale;

  if (langParam && availableLocales.includes(langParam as Locale)) {
    selectedLocale = langParam as Locale;
  } else if (cookieLang && availableLocales.includes(cookieLang as Locale)) {
    selectedLocale = cookieLang as Locale;
  }

  // Create i18n instance with selected locale
  ctx.state.i18n = new (await import("../lib/i18n.ts")).I18n(selectedLocale);

  let response = await ctx.next();

  // Set cookie if language was explicitly selected via query param
  if (
    langParam && availableLocales.includes(langParam as Locale) &&
    langParam !== cookieLang
  ) {
    const newHeaders = new Headers(response.headers);

    newHeaders.append(
      "Set-Cookie",
      `lang=${langParam}; Path=/; Max-Age=31536000; SameSite=Lax`,
    );

    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return response;
});
