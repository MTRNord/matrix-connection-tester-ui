import { Button, WarningText } from "govuk-react";
import useSWR from "swr";

const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

const fetchVersion = async () => {
    const res = await fetch("/version.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch version");
    const data = await res.json();
    return data.version;
};

export function ReloadPrompt() {
    const { data: latestVersion } = useSWR("/version.json", fetchVersion, {
        refreshInterval: 0,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
    });

    const show = latestVersion && latestVersion !== APP_VERSION;

    if (!show) return null;
    return (
        <div
            style={{
                position: "sticky",
                top: 0,
                zIndex: 1000,
                background: "#fff3cd",
                borderBottom: "2px solid #f47738",
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                padding: "0.5rem 0",
            }}
        >
            <WarningText style={{ width: "fit-content", margin: "0 1rem" }}>
                A new version of this app is available.
            </WarningText>
            <Button
                onClick={() => window.location.reload()}
                style={{
                    background: "#f47738",
                    color: "black",
                    border: "none",
                    fontWeight: "bold",
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    margin: "0 1rem",
                }}
            >
                Reload
            </Button>
        </div>
    );
}