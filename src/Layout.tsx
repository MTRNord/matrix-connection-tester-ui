import { GlobalStyle, TopNav, Page, Footer } from "govuk-react";
import { useTranslation, Trans } from "react-i18next";
import App from "./App";
import { ReloadPrompt } from "./ReloadPrompt";

const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

export default function Main() {
    const { t } = useTranslation();
    return (
        <>
            <GlobalStyle />
            <ReloadPrompt />
            <TopNav company={t("Connection Tester")}>
            </TopNav>
            <Page.WidthContainer>
                <Page.Main>
                    <App />
                </Page.Main>
            </Page.WidthContainer>
            <Footer meta={
                <>
                    <Footer.MetaLinks heading='Project Links'>
                        <Footer.Link href="https://matrix.org/"><Trans>Matrix.org</Trans></Footer.Link>
                        <Footer.Link href="https://github.com/MTRNord/matrix-connection-tester-ui/"><Trans>UI Repository</Trans></Footer.Link>
                        <Footer.Link href="https://github.com/MTRNord/rust-federation-tester/"><Trans>Federation Tester API Repository</Trans></Footer.Link>
                    </Footer.MetaLinks>
                    <Footer.MetaCustom>
                        <Trans>Version:</Trans> {APP_VERSION}
                    </Footer.MetaCustom>
                </>
            } />
        </>
    )
}