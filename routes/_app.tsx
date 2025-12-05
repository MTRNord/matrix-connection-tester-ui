import { define } from "../utils.ts";
import { getAvailableLocales, type Locale } from "../lib/i18n.ts";
import LanguageSelector from "../islands/LanguageSelector.tsx";

export default define.page(function App({ Component, url, state }) {
  const currentPath = url.pathname;
  const { i18n } = state;
  const locale = i18n.getLocale();
  const availableLocales = getAvailableLocales();

  // Create translations map for language selector
  const languageTranslations = availableLocales.reduce((acc, lang) => {
    acc[lang] = i18n.tString(`language.${lang}`);
    return acc;
  }, {} as Record<Locale, string>);

  // Define top-level pages (no back link)
  const topLevelPages = ["/", "/alerts", "/docs", "/statistics"];
  const showBackLink = !topLevelPages.includes(currentPath);

  // Determine back link URL
  const getBackLink = () => {
    if (currentPath === "/results") return "/";
    if (currentPath === "/verify") return "/alerts";
    // Default to home for other pages
    return "/";
  };

  // Check if current path is a docs sub-page
  const isDocsSubPage = currentPath.startsWith("/docs/");

  // Get the docs page title from the path
  const getDocsPageTitle = (path: string): string => {
    const pageName = path.replace("/docs/", "").replace(/\//g, "_").replace(
      /-/g,
      "_",
    );
    const titleKey = `docs.${pageName}.title`;
    return i18n.tString(titleKey);
  };

  return (
    <html lang={locale} class="govuk-template govuk-template--rebranded">
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta
          name="description"
          content="A tool to test Matrix server connectivity"
        />
        <link rel="manifest" href="/assets/rebrand/manifest.json" />
        <title>Matrix Connectivity Tester</title>
      </head>
      <body class="govuk-template__body">
        <script>
          document.body.className += ' js-enabled' + ('noModule' in
          HTMLScriptElement.prototype ? ' govuk-frontend-supported' : '');
        </script>
        <a
          href="#main-content"
          class="govuk-skip-link"
          data-module="govuk-skip-link"
        >
          {i18n.t("common.skip_to_main")}
        </a>
        <header class="govuk-header" data-module="govuk-header">
          <div class="govuk-header__container govuk-width-container">
            <div class="govuk-header__logo">
              <a
                href="/"
                class="govuk-header__link govuk-header__link--homepage"
              >
                {i18n.t("header.title")}
              </a>
            </div>
            <div class="govuk-header__content">
              <LanguageSelector
                currentLocale={locale}
                availableLocales={availableLocales}
                translations={languageTranslations}
                label={i18n.tString("language.select")}
                changeButtonText={i18n.tString("language.change")}
              />
            </div>
          </div>
        </header>
        <div
          class="govuk-service-navigation"
          data-module="govuk-service-navigation"
        >
          <div class="govuk-width-container">
            <div class="govuk-service-navigation__container">
              <nav aria-label="Menu" class="govuk-service-navigation__wrapper">
                <button
                  type="button"
                  class="govuk-service-navigation__toggle govuk-js-service-navigation-toggle"
                  aria-controls="navigation"
                  hidden
                >
                  {i18n.t("common.menu")}
                </button>
                <ul class="govuk-service-navigation__list" id="navigation">
                  <li
                    class={`govuk-service-navigation__item${
                      currentPath === "/"
                        ? " govuk-service-navigation__item--active"
                        : ""
                    }`}
                  >
                    <a
                      class="govuk-service-navigation__link"
                      href="/"
                      {...(currentPath === "/" && { "aria-current": "page" })}
                    >
                      {i18n.t("nav.home")}
                    </a>
                  </li>
                  <li
                    class={`govuk-service-navigation__item${
                      currentPath === "/alerts"
                        ? " govuk-service-navigation__item--active"
                        : ""
                    }`}
                  >
                    <a
                      class="govuk-service-navigation__link"
                      href="/alerts"
                      {...(currentPath === "/alerts" && {
                        "aria-current": "page",
                      })}
                    >
                      {i18n.t("nav.alerts")}
                    </a>
                  </li>
                  <li
                    class={`govuk-service-navigation__item${
                      currentPath === "/docs"
                        ? " govuk-service-navigation__item--active"
                        : ""
                    }`}
                  >
                    <a
                      class="govuk-service-navigation__link"
                      href="/docs"
                      {...(currentPath === "/docs" &&
                        { "aria-current": "page" })}
                    >
                      {i18n.t("nav.documentation")}
                    </a>
                  </li>
                  <li
                    class={`govuk-service-navigation__item${
                      currentPath === "/statistics"
                        ? " govuk-service-navigation__item--active"
                        : ""
                    }`}
                  >
                    <a
                      class="govuk-service-navigation__link"
                      href="/statistics"
                      {...(currentPath === "/statistics" && {
                        "aria-current": "page",
                      })}
                    >
                      {i18n.t("nav.statistics")}
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
        <div class="govuk-width-container">
          <div class="govuk-phase-banner">
            <p class="govuk-phase-banner__content">
              <strong class="govuk-tag govuk-phase-banner__content__tag">
                {i18n.t("banner.alpha")}
              </strong>
              <span class="govuk-phase-banner__text">
                {i18n.t("banner.message")}{" "}
                <a
                  class="govuk-link"
                  rel="noreferrer noopener"
                  href="https://github.com/MTRNord/matrix-connection-tester-ui/issues"
                >
                  {i18n.t("banner.github")}
                </a>.
              </span>
            </p>
          </div>
          {(currentPath === "/results" || currentPath === "/alerts" ||
            currentPath === "/docs" || currentPath === "/statistics" ||
            currentPath === "/verify" || isDocsSubPage) && (
            <nav class="govuk-breadcrumbs" aria-label="Breadcrumb">
              <ol class="govuk-breadcrumbs__list">
                <li class="govuk-breadcrumbs__list-item">
                  <a class="govuk-breadcrumbs__link" href="/">
                    {i18n.t("nav.home")}
                  </a>
                </li>
                {currentPath === "/verify" && (
                  <li class="govuk-breadcrumbs__list-item">
                    <a class="govuk-breadcrumbs__link" href="/alerts">
                      {i18n.t("nav.alerts")}
                    </a>
                  </li>
                )}
                {isDocsSubPage && (
                  <li class="govuk-breadcrumbs__list-item">
                    <a class="govuk-breadcrumbs__link" href="/docs">
                      {i18n.t("nav.documentation")}
                    </a>
                  </li>
                )}
                <li class="govuk-breadcrumbs__list-item">
                  {currentPath === "/results" && i18n.t("results.title")}
                  {currentPath === "/alerts" && i18n.t("nav.alerts")}
                  {currentPath === "/docs" && i18n.t("nav.documentation")}
                  {currentPath === "/statistics" && i18n.t("nav.statistics")}
                  {currentPath === "/verify" && i18n.t("alerts.verify_title")}
                  {isDocsSubPage && getDocsPageTitle(currentPath)}
                </li>
              </ol>
            </nav>
          )}
          {showBackLink && currentPath !== "/results" &&
            currentPath !== "/alerts" && currentPath !== "/docs" &&
            currentPath !== "/statistics" && currentPath !== "/verify" &&
            !isDocsSubPage && (
            <a href={getBackLink()} class="govuk-back-link">
              {i18n.t("common.back")}
            </a>
          )}
          <main class="govuk-main-wrapper app-conent" id="main-content">
            <Component />
          </main>
        </div>
        <footer class="govuk-footer">
          <div class="govuk-width-container">
            <div class="govuk-footer__meta">
              <div class="govuk-footer__meta-item govuk-footer__meta-item--grow">
                <h2 class="govuk-visually-hidden">
                  {i18n.t("footer.support_links")}
                </h2>
                <ul class="govuk-footer__inline-list">
                  <li class="govuk-footer__inline-list-item">
                    <a
                      class="govuk-footer__link"
                      rel="noreferrer noopener"
                      href="https://matrix.org"
                    >
                      {i18n.t("footer.matrix_org")}
                    </a>
                  </li>
                  <li class="govuk-footer__inline-list-item">
                    <a
                      class="govuk-footer__link"
                      rel="noreferrer noopener"
                      href="https://github.com/MTRNord/matrix-connection-tester-ui/"
                    >
                      {i18n.t("footer.ui_source")}
                    </a>
                  </li>
                  <li class="govuk-footer__inline-list-item">
                    <a
                      class="govuk-footer__link"
                      rel="noreferrer noopener"
                      href="https://github.com/MTRNord/rust-federation-tester/"
                    >
                      {i18n.t("footer.api_source")}
                    </a>
                  </li>
                </ul>
                <svg
                  aria-hidden="true"
                  focusable="false"
                  class="govuk-footer__licence-logo"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 483.2 195.7"
                  height="17"
                  width="41"
                >
                  <path
                    fill="currentColor"
                    d="M421.5 142.8V.1l-50.7 32.3v161.1h112.4v-50.7zm-122.3-9.6A47.12 47.12 0 0 1 221 97.8c0-26 21.1-47.1 47.1-47.1 16.7 0 31.4 8.7 39.7 21.8l42.7-27.2A97.63 97.63 0 0 0 268.1 0c-36.5 0-68.3 20.1-85.1 49.7A98 98 0 0 0 97.8 0C43.9 0 0 43.9 0 97.8s43.9 97.8 97.8 97.8c36.5 0 68.3-20.1 85.1-49.7a97.76 97.76 0 0 0 149.6 25.4l19.4 22.2h3v-87.8h-80l24.3 27.5zM97.8 145c-26 0-47.1-21.1-47.1-47.1s21.1-47.1 47.1-47.1 47.2 21 47.2 47S123.8 145 97.8 145"
                  />
                </svg>
                <span class="govuk-footer__licence-description">
                  {i18n.t("footer.license_text")}{" "}
                  <a
                    class="govuk-footer__link"
                    href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
                    rel="license"
                  >
                    {i18n.t("footer.license_name")}
                  </a>
                  {i18n.t("footer.license_suffix")}
                </span>
              </div>
            </div>
          </div>
        </footer>
        <script type="module" src="/js/govuk-frontend.min.js"></script>

        <script type="module" src="/js/govuk-frontend.min.js"></script>
        <script
          type="module"
          // deno-lint-ignore react-no-danger
          dangerouslySetInnerHTML={{
            __html: `
          import { initAll } from '/js/govuk-frontend.min.js';
          initAll({
            accordion: {
              i18n: {
                hideAllSections: "${i18n.t("accordion.hide_all")}",
                hideSection: "${i18n.t("accordion.hide_section")}",
                hideSectionAriaLabel: "${
              i18n.t("accordion.hide_section_aria_label")
            }",
                showAllSections: "${i18n.t("accordion.show_all")}",
                showSection: "${i18n.t("accordion.show_section")}",
                showSectionAriaLabel: "${
              i18n.t("accordion.show_section_aria_label")
            }",
              }
            }
          });
        `,
          }}
        />
      </body>
    </html>
  );
});
