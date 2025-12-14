import type { ComponentChildren } from "preact";
import type { I18n } from "../../lib/i18n.ts";
import DocsSidebar from "./DocsSidebar.tsx";

interface DocsLayoutProps {
  children: ComponentChildren;
  currentPath: string;
  i18n: I18n;
  title: string;
  description?: string;
}

export default function DocsLayout({
  children,
  currentPath,
  i18n,
  title,
  description,
}: DocsLayoutProps) {
  return (
    <>
      <div class="govuk-grid-row">
        <div class="govuk-grid-column-full">
          <div class="govuk-warning-text">
            <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
            <strong class="govuk-warning-text__text">
              <span class="govuk-visually-hidden">
                {i18n.t("common.warning")}
              </span>
              {i18n.t("docs.common.wip_warning")}
            </strong>
          </div>
          <h1 class="govuk-heading-xl">{title}</h1>
          {description && (
            <p class="govuk-body-l govuk-!-margin-bottom-8">{description}</p>
          )}
        </div>
      </div>

      <div class="govuk-grid-row">
        <div class="govuk-grid-column-one-quarter">
          <DocsSidebar currentPath={currentPath} i18n={i18n} />
        </div>

        <div class="govuk-grid-column-three-quarters">
          {children}
        </div>
      </div>
    </>
  );
}
