import { define } from "../utils.ts";

export default define.page(function NotFound(ctx) {
  const { i18n } = ctx.state;

  return (
    <div class="govuk-grid-row">
      <div class="govuk-grid-column-two-thirds">
        <h1 class="govuk-heading-l">{i18n.t("notfound.title")}</h1>
        <p class="govuk-body">
          {i18n.t("notfound.check_address")}
        </p>
        <p class="govuk-body">
          {i18n.t("notfound.check_paste")}
        </p>
        <p class="govuk-body">
          {i18n.t("notfound.report_issue")}{" "}
          <a
            class="govuk-link"
            rel="noreferrer noopener"
            href="https://github.com/MTRNord/matrix-connection-tester-ui/issues"
          >
            {i18n.t("notfound.open_issue")}
          </a>{" "}
          .
        </p>
      </div>
    </div>
  );
});
