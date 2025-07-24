import { useState, useEffect, useCallback } from "react";
import { LoadingBox, Tabs, ErrorSummary } from "govuk-react";
import type { ClientWellKnownType, ClientServerVersionsType, ApiResponseWithWarnings } from "../../apiTypes";
import useSWR from "swr";
import { fetchData, fetchClientWellKnown, fetchClientServerVersions } from "../../api";
import { useTranslation } from "react-i18next";
import { translateApiError } from "../../utils/errorTranslation";
import {
    OverviewTab,
    DnsTab,
    WellKnownTab,
    ReportsTab,
    ErrorsTab,
    RawDataTab
} from ".";
import type { components } from "../../api/api";

export default function ServerInfoResults({ serverName }: { serverName: string }) {
    // Get initial tab from URL hash or default to "overview"
    const getInitialTab = () => {
        const hash = window.location.hash.slice(1); // Remove the #
        const validTabs = ["overview", "dns", "server-wellknown", "reports", "errors", "raw"];
        return validTabs.includes(hash) ? hash : "overview";
    };

    const [selectedTab, setSelectedTab] = useState<string>(getInitialTab);

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

    // Helper for tab selection - updates both state and URL hash
    const handleTabClick = useCallback((tab: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        setSelectedTab(tab);
        window.history.pushState(null, '', `#${tab}`);
    }, []);
    
    const { t } = useTranslation();

    const { data, error, isLoading, isValidating } = useSWR<components["schemas"]["Root"]>(
        serverName ? ['federation', serverName] : null,
        () => fetchData(serverName),
        { keepPreviousData: false }
    );

    // Fetch client well-known data
    const { data: clientWellKnownResponse, error: clientWellKnownError } = useSWR<ApiResponseWithWarnings<ClientWellKnownType>>(
        serverName ? ['clientWellKnown', serverName] : null,
        () => fetchClientWellKnown(serverName),
        { keepPreviousData: false }
    );

    // Extract data and warnings from the response
    const clientWellKnownData = clientWellKnownResponse?.data;
    const clientWellKnownWarnings = clientWellKnownResponse?.warnings;

    // Fetch client server versions data - use homeserver URL from well-known if available
    const homeserverUrl = clientWellKnownData?.["m.homeserver"]?.base_url;
    // Check if we have a client well-known response (even if it doesn't have base_url)
    const hasClientWellKnown = !!clientWellKnownData && !clientWellKnownError;
    const { data: clientServerVersionsResponse, error: clientServerVersionsError } = useSWR<ApiResponseWithWarnings<ClientServerVersionsType>>(
        serverName ? ['clientServerVersions', serverName, homeserverUrl, hasClientWellKnown] : null,
        () => fetchClientServerVersions(serverName, homeserverUrl, hasClientWellKnown),
        { keepPreviousData: false }
    );

    // Extract data and warnings from the client server versions response
    const clientServerVersionsData = clientServerVersionsResponse?.data;
    const clientServerVersionsWarnings = clientServerVersionsResponse?.warnings;

    if (isLoading && !data) {
        return (
            <LoadingBox loading={true}>
                <p>{t('federation.loading')}</p>
            </LoadingBox>
        );
    }

    if (error || !data) {
        return (
            <ErrorSummary
                heading={t('federation.apiError')}
                description={translateApiError(error, t)} />
        );
    }

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
                    clientServerVersionsWarnings={clientServerVersionsWarnings}
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
                    clientWellKnownWarnings={clientWellKnownWarnings}
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
