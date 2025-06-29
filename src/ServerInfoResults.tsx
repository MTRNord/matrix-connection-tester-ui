import { useState, useEffect } from "react";
import { LoadingBox, ErrorText, Tabs } from "govuk-react";
import type { ApiSchemaType, ClientWellKnownType, ClientServerVersionsType } from "./apiTypes";
import useSWR from "swr";
import { fetchData, fetchClientWellKnown, fetchClientServerVersions } from "./api";
import { useTranslation } from "react-i18next";
import { translateApiError } from "./utils/errorTranslation";
import {
    OverviewTab,
    DnsTab,
    WellKnownTab,
    ReportsTab,
    ErrorsTab,
    RawDataTab
} from "./components/ServerInfo";

export default function ServerInfoResults({ serverName }: { serverName: string }) {
    // Get initial tab from URL hash or default to "overview"
    const getInitialTab = () => {
        const hash = window.location.hash.slice(1); // Remove the #
        const validTabs = ["overview", "dns", "server-wellknown", "reports", "errors", "raw"];
        return validTabs.includes(hash) ? hash : "overview";
    };

    const [selectedTab, setSelectedTab] = useState<string>(getInitialTab);
    const { t } = useTranslation();

    // Listen for browser back/forward navigation
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);
            const validTabs = ["overview", "dns", "server-wellknown", "reports", "errors", "raw"];
            if (validTabs.includes(hash)) {
                setSelectedTab(hash);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Ensure the URL hash matches the selected tab
    useEffect(() => {
        const currentHash = window.location.hash.slice(1);
        if (currentHash !== selectedTab) {
            window.history.replaceState(null, '', `#${selectedTab}`);
        }
    }, [selectedTab]);

    const { data, error, isLoading, isValidating } = useSWR<ApiSchemaType>(
        serverName ? ['federation', serverName] : null,
        () => fetchData(serverName),
        { keepPreviousData: false }
    );

    // Fetch client well-known data
    const { data: clientWellKnownData, error: clientWellKnownError } = useSWR<ClientWellKnownType>(
        serverName ? ['clientWellKnown', serverName] : null,
        () => fetchClientWellKnown(serverName),
        { keepPreviousData: false }
    );

    // Fetch client server versions data - use homeserver URL from well-known if available
    const homeserverUrl = clientWellKnownData?.["m.homeserver"]?.base_url;
    const { data: clientServerVersionsData, error: clientServerVersionsError } = useSWR<ClientServerVersionsType>(
        serverName ? ['clientServerVersions', serverName, homeserverUrl] : null,
        () => fetchClientServerVersions(serverName, homeserverUrl),
        { keepPreviousData: false }
    );

    if (isLoading && !data) {
        return (
            <LoadingBox loading={true}>
                <p>{t('federation.loading')}</p>
            </LoadingBox>
        );
    }

    if (error || !data) {
        return (
            <ErrorText>
                {t('federation.apiError')}<br />
                <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{translateApiError(error, t)}</pre>
            </ErrorText>
        );
    }

    // Helper for tab selection - updates both state and URL hash
    const handleTabClick = (tab: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        setSelectedTab(tab);
        window.history.pushState(null, '', `#${tab}`);
    };

    return (
        <Tabs>
            <Tabs.Title>{t('federation.title')}</Tabs.Title>
            <Tabs.List>
                <Tabs.Tab
                    href="#overview"
                    selected={selectedTab === "overview"}
                    onClick={handleTabClick("overview")}
                >{t('federation.tabs.overview')}</Tabs.Tab>
                <Tabs.Tab
                    href="#dns"
                    selected={selectedTab === "dns"}
                    onClick={handleTabClick("dns")}
                >{t('federation.tabs.dns')}</Tabs.Tab>
                <Tabs.Tab
                    href="#server-wellknown"
                    selected={selectedTab === "server-wellknown"}
                    onClick={handleTabClick("server-wellknown")}
                >{t('federation.tabs.wellKnown')}</Tabs.Tab>
                <Tabs.Tab
                    href="#reports"
                    selected={selectedTab === "reports"}
                    onClick={handleTabClick("reports")}
                >{t('federation.tabs.reports')}</Tabs.Tab>
                {Object.keys(data.ConnectionErrors ?? {}).length > 0 && (<Tabs.Tab
                    href="#errors"
                    selected={selectedTab === "errors"}
                    onClick={handleTabClick("errors")}
                >{t('federation.tabs.errors')}</Tabs.Tab>)}
                <Tabs.Tab
                    href="#raw"
                    selected={selectedTab === "raw"}
                    onClick={handleTabClick("raw")}
                >{t('federation.tabs.raw')}</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel id="overview" selected={selectedTab === "overview"}>
                <OverviewTab
                    data={data}
                    clientServerVersionsData={clientServerVersionsData}
                    clientServerVersionsError={clientServerVersionsError}
                    isValidating={isValidating}
                />
            </Tabs.Panel>

            <Tabs.Panel id="dns" selected={selectedTab === "dns"}>
                <DnsTab data={data} />
            </Tabs.Panel>

            <Tabs.Panel id="server-wellknown" selected={selectedTab === "server-wellknown"}>
                <WellKnownTab
                    data={data}
                    clientWellKnownData={clientWellKnownData}
                    clientWellKnownError={clientWellKnownError}
                />
            </Tabs.Panel>

            <Tabs.Panel id="reports" selected={selectedTab === "reports"}>
                <ReportsTab data={data} />
            </Tabs.Panel>

            {Object.keys(data.ConnectionErrors ?? {}).length > 0 && (
                <Tabs.Panel id="errors" selected={selectedTab === "errors"}>
                    <ErrorsTab data={data} />
                </Tabs.Panel>
            )}

            <Tabs.Panel id="raw" selected={selectedTab === "raw"}>
                <RawDataTab
                    data={data}
                    clientWellKnownData={clientWellKnownData}
                    clientWellKnownError={clientWellKnownError}
                    clientServerVersionsData={clientServerVersionsData}
                    clientServerVersionsError={clientServerVersionsError}
                />
            </Tabs.Panel>
        </Tabs>
    );
}
