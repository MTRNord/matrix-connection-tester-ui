import { GlobalStyle, TopNav, Page, Footer, ErrorSummary } from "govuk-react";
import { useTranslation, Trans } from "react-i18next";
import { ReloadPrompt } from "./ReloadPrompt";
import { BrowserRouter, Route, Routes } from 'react-router';
import { ErrorBoundary } from "react-error-boundary";
import { lazy, Suspense } from "react";

const App = lazy(() => import("./pages/Main"));
const ClientApp = lazy(() => import("./pages/ClientApp"));
const Alerts = lazy(() => import("./pages/Alerts"));
const AlertVerify = lazy(() => import("./pages/AlertVerify"));

const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

export default function Main() {
    const { t } = useTranslation();
    return (
        <>
            <GlobalStyle />
            <header>
                <ReloadPrompt />
                <TopNav company={<TopNav.Anchor href="/">{t("Connection Tester")}</TopNav.Anchor>}>
                    <TopNav.NavLink href="/">
                        Federation Tester
                    </TopNav.NavLink>
                    {/*<TopNav.NavLink href="/client">
                        Client Tester
                    </TopNav.NavLink>*/}
                    <TopNav.NavLink href="/alerts">
                        Alerts
                    </TopNav.NavLink>
                </TopNav>
            </header>
            <Page.WidthContainer>
                <Page.Main>
                    <Suspense fallback={<div className="container">Loading...</div>}>
                        <ErrorBoundary fallback={
                            <ErrorSummary
                                heading={t('app.errors.uiFailedToLoad')}
                                description={t('app.errors.componentFailedToLoad')}
                            />
                        }>
                            <BrowserRouter>
                                <Routes>
                                    <Route path="/" element={
                                        <App />
                                    } />
                                    <Route path="/client" element={
                                        <ClientApp />
                                    } />
                                    <Route path="/alerts" element={<Alerts />} />
                                    <Route path="/verify" element={<AlertVerify />} />
                                </Routes>
                            </BrowserRouter>
                        </ErrorBoundary>
                    </Suspense>
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