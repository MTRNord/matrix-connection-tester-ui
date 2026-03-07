import { define } from "../../utils.ts";
import { getConfig } from "../../lib/api.ts";
import { page } from "fresh";
import OAuthCallback from "../../islands/oauth-callback.tsx";

export const handler = define.handlers({
  async GET(ctx) {
    const url = ctx.url;
    try {
      const apiConfig = await getConfig(`${url.protocol}//${url.host}`);
      return page({
        apiUrl: apiConfig.api_server_url ?? "",
        clientId: apiConfig.oauth2_client_id ?? "",
      });
    } catch {
      return page({ apiUrl: "", clientId: "" });
    }
  },
});

export default define.page<typeof handler>(function OAuthCallbackPage(ctx) {
  const { i18n } = ctx.state;
  const { apiUrl, clientId } = ctx.data;

  return (
    <>
      <h1 class="govuk-heading-xl">{i18n.tString("alerts.verify_title")}</h1>
      <OAuthCallback
        apiUrl={apiUrl}
        clientId={clientId}
        locale={i18n.getLocale()}
      />
    </>
  );
});
