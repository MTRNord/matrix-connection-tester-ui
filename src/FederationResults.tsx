import { useState } from "react";
import { H2, Table, Panel, Tag, Link, LoadingBox, ErrorText, Paragraph, ListItem, Tabs, Details } from "govuk-react";
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
    const [selectedTab, setSelectedTab] = useState<string>("overview");

    const { data, error, isLoading, isValidating } = useSWR<ApiSchemaType>(
        serverName ? ['federation', serverName] : null,
        () => fetchData(serverName),
        { keepPreviousData: false }
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
    const dnsHosts = data?.DNSResult?.Hosts || {};
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

    // Helper for tab selection
    const handleTabClick = (tab: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        setSelectedTab(tab);
    };

    return (
        <Tabs>
            <Tabs.Title>Federation Test Results</Tabs.Title>
            <Tabs.List>
                <Tabs.Tab
                    href="#overview"
                    selected={selectedTab === "overview"}
                    onClick={handleTabClick("overview")}
                >Overview</Tabs.Tab>
                <Tabs.Tab
                    href="#dns"
                    selected={selectedTab === "dns"}
                    onClick={handleTabClick("dns")}
                >DNS Hosts</Tabs.Tab>
                <Tabs.Tab
                    href="#wellknown"
                    selected={selectedTab === "wellknown"}
                    onClick={handleTabClick("wellknown")}
                >Well-Known</Tabs.Tab>
                <Tabs.Tab
                    href="#reports"
                    selected={selectedTab === "reports"}
                    onClick={handleTabClick("reports")}
                >Connection Reports</Tabs.Tab>
                {Object.keys(data.ConnectionErrors ?? {}).length > 0 && (<Tabs.Tab
                    href="#errors"
                    selected={selectedTab === "errors"}
                    onClick={handleTabClick("errors")}
                >Connection Errors</Tabs.Tab>)}
                <Tabs.Tab
                    href="#raw"
                    selected={selectedTab === "raw"}
                    onClick={handleTabClick("raw")}
                >Raw API</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel id="overview" selected={selectedTab === "overview"}>
                <H2>Federation Overview</H2>
                {/* eslint-disable-next-line no-constant-binary-expression -- This seems to be overly jumpy*/}
                {isValidating && false && (
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
                                    <Tag
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
                </Table>
            </Tabs.Panel>

            <Tabs.Panel id="dns" selected={selectedTab === "dns"}>
                <H2>DNS Hosts</H2>
                <Table>
                    <Table.Row>
                        <Table.CellHeader>Host</Table.CellHeader>
                        <Table.CellHeader>Addresses</Table.CellHeader>
                        <Table.CellHeader>CNAME</Table.CellHeader>
                        <Table.CellHeader>Error</Table.CellHeader>
                    </Table.Row>
                    {Object.keys(dnsHosts).length > 0 ? (
                        Object.entries(dnsHosts).map(([host, info]) => (
                            <Table.Row key={host}>
                                <Table.Cell><code>{host}</code></Table.Cell>
                                <Table.Cell>
                                    {info.Addrs && info.Addrs.length > 0
                                        ? info.Addrs.join(", ")
                                        : <Tag style={{ paddingRight: 8 }} backgroundColor="#b1b4b6" color="black">None</Tag>}
                                </Table.Cell>
                                <Table.Cell>
                                    {info.CName || <Tag style={{ paddingRight: 8 }} backgroundColor="#b1b4b6" color="black">None</Tag>}
                                </Table.Cell>
                                <Table.Cell>
                                    {info.Error ? (
                                        <ErrorText >
                                            {info.Error}
                                        </ErrorText>
                                    ) : (
                                        <Tag style={{ paddingRight: 8 }} backgroundColor="#00703c" color="white">OK</Tag>
                                    )}
                                </Table.Cell>
                            </Table.Row>
                        ))
                    ) : (
                        <Table.Row>
                            <Table.Cell colSpan={4} style={{ textAlign: "center" }}>
                                <Tag style={{ paddingRight: 8 }} backgroundColor="#b1b4b6" color="black">No hosts found</Tag>
                            </Table.Cell>
                        </Table.Row>
                    )}
                </Table>
            </Tabs.Panel>

            <Tabs.Panel id="wellknown" selected={selectedTab === "wellknown"}>
                <H2>Well-Known Results</H2>
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
            </Tabs.Panel>

            <Tabs.Panel id="reports" selected={selectedTab === "reports"}>
                <H2>Connection Reports</H2>
                {connReports.length > 0 ? (
                    connReports.map(([host, report]) => (
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
                                <Table.Row>
                                    <Table.Cell>Maching serverName</Table.Cell>
                                    <Table.Cell>
                                        {report.Checks.MatchingServerName ? (
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
                                    <Table.Cell>Matching Signature for all keys</Table.Cell>
                                    <Table.Cell>
                                        {report.Checks.AllEd25519ChecksOK ? (
                                            <Tag
                                                style={{ paddingRight: 8 }}
                                                backgroundColor="#00703c"
                                                color="white">Yes</Tag>
                                        ) : (
                                            <>
                                                <Tag
                                                    style={{ paddingRight: 8, marginBottom: 4 }}
                                                    backgroundColor="#d4351c"
                                                    color="white"
                                                >No</Tag>
                                                {report.Checks.Ed25519Checks && (
                                                    <div style={{ marginTop: 8 }}>
                                                        <strong>Failing keys:</strong>
                                                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                                                            {Object.entries(report.Checks.Ed25519Checks)
                                                                .filter(([, check]) => !check.MatchingSignature)
                                                                .map(([key]) => (
                                                                    <ListItem key={key}>
                                                                        <Tag
                                                                            backgroundColor="#d4351c"
                                                                            color="white"
                                                                            style={{ paddingRight: 8, marginBottom: 4 }}
                                                                        >
                                                                            <code>{key}</code>
                                                                        </Tag>
                                                                    </ListItem>
                                                                ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </Table.Cell>
                                </Table.Row>
                            </Table>
                            <H2 size="SMALL">Keys</H2>
                            <Table>
                                <Table.Row>
                                    <Table.CellHeader>Key ID</Table.CellHeader>
                                    <Table.CellHeader>Key</Table.CellHeader>
                                </Table.Row>
                                {report.Keys?.verify_keys && Object.entries(report.Keys.verify_keys).map(([keyId, keyObj]) => (
                                    <Table.Row key={keyId}>
                                        <Table.Cell>
                                            <code>{keyId}</code>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <code>{keyObj.key}</code>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                                {report.Keys?.old_verify_keys && Object.entries(report.Keys.old_verify_keys).map(([keyId, keyObj]) => (
                                    <Table.Row key={keyId}>
                                        <Table.Cell>
                                            <code
                                                style={{ marginRight: 8 }}
                                            >{keyId}</code> <Tag style={{ paddingRight: 8 }} backgroundColor="#b1b4b6" color="black">Expired</Tag>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <code>{keyObj.key}</code> (expired at {new Date(keyObj.expired_ts * 1000).toLocaleString()})
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table>
                            <H2 size="SMALL">Certificates</H2>
                            <Table>
                                <Table.Row>
                                    <Table.CellHeader>Issuer</Table.CellHeader>
                                    <Table.CellHeader>Subject</Table.CellHeader>
                                    <Table.CellHeader>SHA256 Fingerprint</Table.CellHeader>
                                    <Table.CellHeader>DNS Names</Table.CellHeader>
                                </Table.Row>
                                {report.Certificates && report.Certificates.map((cert, index) => (
                                    <Table.Row key={index}>
                                        <Table.Cell>{cert.IssuerCommonName}</Table.Cell>
                                        <Table.Cell>{cert.SubjectCommonName}</Table.Cell>
                                        <Table.Cell>{cert.SHA256Fingerprint}</Table.Cell>
                                        <Table.Cell>
                                            {cert.DNSNames && cert.DNSNames.length > 0
                                                ? cert.DNSNames.join(", ")
                                                : "None"}
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table>
                            <Details summary="Show Raw Report">
                                <pre style={{ background: "#f3f2f1", padding: 12, borderRadius: 4 }}>
                                    {JSON.stringify(report, null, 2)}
                                </pre>
                            </Details>
                        </div>
                    ))
                ) : (
                    <Paragraph>No connection reports available.</Paragraph>
                )}
            </Tabs.Panel>
            {Object.keys(data.ConnectionErrors ?? {}).length > 0 && (
                <Tabs.Panel id="errors" selected={selectedTab === "errors"}>
                    <H2>Connection Errors</H2>

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

                </Tabs.Panel>)}

            < Tabs.Panel id="raw" selected={selectedTab === "raw"}>
                <H2>Full Raw API Response</H2>
                <pre style={{ background: "#f3f2f1", padding: 12, borderRadius: 4 }}>
                    {JSON.stringify(data, null, 2)}
                </pre>
            </Tabs.Panel>
        </Tabs >
    );
}