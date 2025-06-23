import { H2, Table, Panel, Details, Tag, Link, LoadingBox, ErrorText, Paragraph, } from "govuk-react";
import type { ApiSchemaType } from "./apiTypes";
import useSWR from "swr";
import { fetchData } from "./api";

// Example lookup table for known server software
const KNOWN_SERVER_SOFTWARE: Record<string, { maturity: "Stable" | "Beta" | "Experimental", url: string }> = {
    "synapse": { maturity: "Stable", url: "https://github.com/matrix-org/synapse" },
    "dendrite": { maturity: "Beta", url: "https://github.com/matrix-org/dendrite" },
    "conduit": { maturity: "Experimental", url: "https://gitlab.com/famedly/conduit" },
    "construct": { maturity: "Experimental", url: "https://github.com/matrix-construct/construct" },
    "continuwuity": { maturity: "Beta", url: "https://continuwuity.org/" }
};

function getServerSoftwareInfo(name: string) {
    return KNOWN_SERVER_SOFTWARE[name.toLowerCase()] || null;
}

export default function FederationResults({ serverName }: { serverName: string }) {
    const { data, error, isLoading, isValidating } = useSWR<ApiSchemaType>(
        serverName ? ['federation', serverName] : null,
        () => fetchData(serverName),
        { keepPreviousData: true }
    );

    if (isLoading && !data) {
        return (
            <LoadingBox loading={true}>
                <p>⌛ Getting info from API…</p>
            </LoadingBox>
        );
    }

    if (error || !data) {
        return (
            <ErrorText>
                ⚠️ Something went wrong talking to the API<br />
                <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{error.message}</pre>
            </ErrorText>
        );
    }


    // Federation status
    const federationOK = data?.FederationOK;
    const versionName = data?.Version?.name || "Unknown";
    const versionString = data?.Version?.version || "";
    const softwareInfo = getServerSoftwareInfo(versionName);

    // DNS info
    const dnsAddrs = data?.DNSResult?.Addrs || [];
    const wellKnown = Object.entries(data?.WellKnownResult || {});

    // Connection reports
    const connReports = Object.entries(data?.ConnectionReports ?? {});

    // Determine if any connection report was successful
    const anyConnectionSuccess = connReports.some(
        ([, report]) => report.Checks?.AllChecksOK
    );

    // Determine panel message and color
    let panelTitle = "Federation is working for this server.";
    let panelColor = "#00703c";
    if (!federationOK) {
        if (anyConnectionSuccess) {
            panelTitle = "Federation partially failed for this server. Check below for more information.";
            panelColor = "#f47738"; // GOV.UK orange for warning/partial
        } else {
            panelTitle = "Federation failed for this server.";
            panelColor = "#d4351c";
        }
    }

    return (
        <>
            <H2>Federation Test Result</H2>
            {isValidating && (
                <LoadingBox loading={true}>
                    <Paragraph supportingText>Refreshing data…</Paragraph>
                </LoadingBox>
            )}
            <Panel
                title={panelTitle}
                style={{
                    background: panelColor,
                    color: "white",
                }}
            />

            <Table>
                <Table.Row>
                    <Table.CellHeader>Server Software</Table.CellHeader>
                    <Table.Cell>
                        {softwareInfo ? (
                            <>
                                <Link href={softwareInfo.url} target="_blank" rel="noopener noreferrer">
                                    {versionName}
                                </Link>
                                {" "}
                                <Tag
                                    backgroundColor={softwareInfo.maturity === "Stable"
                                        ? "#00703c"
                                        : softwareInfo.maturity === "Beta"
                                            ? "#1d70b8"
                                            : "#f47738"}
                                    color="white"
                                    style={{ paddingRight: 8 }}
                                >
                                    {softwareInfo.maturity}
                                </Tag>
                            </>
                        ) : (
                            <>
                                {versionName}
                            </>
                        )}
                        {!softwareInfo && versionName !== "Unknown" && (
                            <>
                                {" "}
                                < Tag
                                    style={{ paddingRight: 8 }}
                                    backgroundColor="#b1b4b6"
                                    color="black">Unknown</Tag>
                            </>
                        )}
                    </Table.Cell>
                </Table.Row>
                <Table.Row>
                    <Table.CellHeader>Version</Table.CellHeader>
                    <Table.Cell>{versionString}</Table.Cell>
                </Table.Row>
                <Table.Row>
                    <Table.CellHeader>DNS Addresses</Table.CellHeader>
                    <Table.Cell>
                        {dnsAddrs.length > 0
                            ? dnsAddrs.map(addr => <div key={addr}>{addr}</div>)
                            : "No addresses found"}
                    </Table.Cell>
                </Table.Row>
            </Table >

            <Details summary="Show Well-Known Results">
                <Table>
                    <Table.Row>
                        <Table.CellHeader>Key</Table.CellHeader>
                        <Table.CellHeader>m.server</Table.CellHeader>
                        <Table.CellHeader>Cache Expires At</Table.CellHeader>
                    </Table.Row>
                    {wellKnown.map(([key, value]) => (
                        <Table.Row key={key}>
                            <Table.Cell>{key}</Table.Cell>
                            <Table.Cell>{value["m.server"]}</Table.Cell>
                            <Table.Cell>
                                {value.CacheExpiresAt
                                    ? new Date(value.CacheExpiresAt * 1000).toLocaleString()
                                    : ""}
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table>
            </Details>


            {connReports.length > 0 && (
                <Details summary="Show Connection Reports">
                    {connReports.map(([host, report]) => (
                        <div key={host} style={{ marginBottom: 24 }}>
                            <H2 size="SMALL">{host}</H2>
                            <Table>
                                <Table.Row>
                                    <Table.CellHeader>Check</Table.CellHeader>
                                    <Table.CellHeader>Result</Table.CellHeader>
                                </Table.Row>
                                <Table.Row>
                                    <Table.Cell>All Checks OK</Table.Cell>
                                    <Table.Cell>
                                        {report.Checks.AllChecksOK ? (
                                            <Tag
                                                style={{ paddingRight: 8 }}
                                                backgroundColor="#00703c"
                                                color="white">Yes</Tag>
                                        ) : (
                                            <Tag
                                                style={{ paddingRight: 8 }}
                                                backgroundColor="#d4351c"
                                                color="white"
                                            >No</Tag>
                                        )}
                                    </Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.Cell>Cipher Suite</Table.Cell>
                                    <Table.Cell>
                                        {report.Cipher.CipherSuite} ({report.Cipher.Version})
                                    </Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.Cell>Valid Certificates</Table.Cell>
                                    <Table.Cell>
                                        {report.Checks.ValidCertificates ? (
                                            <Tag
                                                style={{ paddingRight: 8 }}
                                                backgroundColor="#00703c"
                                                color="white"
                                            >Yes</Tag>
                                        ) : (
                                            <Tag
                                                style={{ paddingRight: 8 }}
                                                backgroundColor="#d4351c"
                                                color="white"
                                            >No</Tag>
                                        )}
                                    </Table.Cell>
                                </Table.Row>
                                <Table.Row>
                                    <Table.Cell>Ed25519 Key Present</Table.Cell>
                                    <Table.Cell>
                                        {report.Checks.HasEd25519Key ? (
                                            <Tag
                                                style={{ paddingRight: 8 }}
                                                backgroundColor="#00703c"
                                                color="white">Yes</Tag>
                                        ) : (
                                            <Tag
                                                style={{ paddingRight: 8 }}
                                                backgroundColor="#d4351c"
                                                color="white"
                                            >No</Tag>
                                        )}
                                    </Table.Cell>
                                </Table.Row>
                                {/* Add more checks as needed */}
                            </Table>
                            <Details summary="Show Raw Report">
                                <pre style={{ background: "#f3f2f1", padding: 12, borderRadius: 4 }}>
                                    {JSON.stringify(report, null, 2)}
                                </pre>
                            </Details>
                        </div>
                    ))}
                </Details>)}

            {Object.keys(data.ConnectionErrors ?? {}).length > 0 && (
                <Details summary="Show Connection Errors">
                    <Table>
                        <Table.Row>
                            <Table.CellHeader>Host/IP</Table.CellHeader>
                            <Table.CellHeader>Error</Table.CellHeader>
                        </Table.Row>
                        {Object.entries(data.ConnectionErrors ?? []).map(([host, errObj]) => (
                            <Table.Row key={host}>
                                <Table.Cell>
                                    <code>{host}</code>
                                </Table.Cell>
                                <Table.Cell>
                                    <span style={{ color: "#d4351c" }}>{errObj.Error}</span>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table>
                </Details>
            )}

            <Details summary="Show Full Raw API Response">
                <pre style={{ background: "#f3f2f1", padding: 12, borderRadius: 4 }}>
                    {JSON.stringify(data, null, 2)}
                </pre>
            </Details>
        </>
    );
}