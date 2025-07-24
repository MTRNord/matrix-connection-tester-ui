import React, { useCallback, useEffect, useState } from "react";
import { BackLink, H1, Paragraph, Tabs } from "govuk-react";
import CreateAlertForm from "../components/alerts/CreateAlertForm";
import { Link } from "react-router";
import CheckAlerts from "../components/alerts/CheckAlerts";
import { useTranslation } from "react-i18next";

const validTabs = ["create-alert", "check-alerts"];

export default function Alerts() {
    const { t } = useTranslation();
    // Get initial tab from URL hash or default to "overview"
    const getInitialTab = () => {
        const hash = window.location.hash.slice(1); // Remove the #
        return validTabs.includes(hash) ? hash : "create-alert";
    };

    const [selectedTab, setSelectedTab] = useState<string>(getInitialTab);

    // Listen for browser back/forward navigation
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);
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

    return (
        <>
            <H1>{t("app.alertTitle") || "Alerts Management"}</H1>
            <BackLink as={Link} to="/">
                Federation Tester
            </BackLink>
            <Paragraph>
                {`Create, check or delete alerts which allow you to be notified of connection issues with specific servers. 
            You will receive an email when a server is unreachable or has connection errors.`}
            </Paragraph>


            <Tabs>
                <Tabs.Title>Alerts</Tabs.Title>
                <Tabs.List>
                    <Tabs.Tab
                        href="#create-alert"
                        selected={selectedTab === "create-alert"}
                        onClick={handleTabClick("create-alert")}
                    >Create Alert</Tabs.Tab>
                    <Tabs.Tab
                        href="#check-alerts"
                        selected={selectedTab === "check-alerts"}
                        onClick={handleTabClick("check-alerts")}
                    >List Alerts</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel id="create-alert" selected={selectedTab === "create-alert"}>
                    <CreateAlertForm />
                </Tabs.Panel>
                <Tabs.Panel id="check-alerts" selected={selectedTab === "check-alerts"}>
                    <CheckAlerts />
                </Tabs.Panel>
            </Tabs>
        </>
    );
}
