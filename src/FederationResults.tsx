import { useState } from "react";
import { H2, Table, Panel, Tag, Link, LoadingBox, ErrorText, Paragraph, ListItem, Tabs, Details, LeadParagraph, ErrorSummary } from "govuk-react";
import type { ApiSchemaType, ErrorType } from "./apiTypes";
import useSWR from "swr";
import { fetchData } from "./api";
import { useTranslation } from "react-i18next";

// Example lookup table for known server software
const KNOWN_SERVER_SOFTWARE: Record<string, { maturity: "Stable" | "Beta" | "Experimental", url: string }> = {
    "synapse": { maturity: "Stable", url: "https://github.com/matrix-org/synapse" },
    "dendrite": { maturity: "Beta", url: "https://github.com/matrix-org/dendrite" },
    "conduit": { maturity: "Experimental", url: "https://gitlab.com/famedly/conduit" },
    "construct": { maturity: "Experimental", url: "https://github.com/matrix-construct/construct" },
    "continuwuity": { maturity: "Beta", url: "https://continuwuity.org/" },
    "matrix-key-server": { maturity: "Experimental", url: "https://github.com/t2bot/matrix-key-server" },
};

function getServerSoftwareInfo(name: string) {
    return KNOWN_SERVER_SOFTWARE[name.toLowerCase()] || null;
}

export default function FederationResults({ serverName }: { serverName: string }) {
    const [selectedTab, setSelectedTab] = useState<string>("overview");
    const { t } = useTranslation();

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

    // DNS info
    const dnsAddrs = data?.DNSResult?.Addrs || [];
    const srvTargets = Object.entries(data?.DNSResult?.SrvTargets || {});
    const wellKnown = Object.entries(data?.WellKnownResult || {});

    // Connection reports
    const connReports = Object.entries(data?.ConnectionReports ?? {});

    // Determine if any connection report was successful
    const anyConnectionSuccess = connReports.some(
        ([, report]) => report.Checks?.AllChecksOK
    );

    // Determine panel message and color
    let panelTitle = "Federation is working.";
    let panelColor = undefined;
    if (!federationOK) {
        if (anyConnectionSuccess) {
            panelTitle = "Federation partially failed. Check below for more information.";
            panelColor = "#f47738"; // GOV.UK orange for warning/partial
        } else {
            panelTitle = "Federation failed.";
            panelColor = "#d4351c";
        }
    }

    // Helper for tab selection
    const handleTabClick = (tab: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        setSelectedTab(tab);
    };

    // Helper to get user-friendly error message
    const getErrorMessage = (error: ErrorType) => {
        const translationKey = `DNS.errorCodes.${error.ErrorCode}`;
        const translatedMessage = t(translationKey);

        // If no translation found, fall back to the raw error message
        return translatedMessage !== translationKey ? translatedMessage : error.Error;
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
                >DNS Resolution</Tabs.Tab>
                <Tabs.Tab
                    href="#server-wellknown"
                    selected={selectedTab === "server-wellknown"}
                    onClick={handleTabClick("server-wellknown")}
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

                <LeadParagraph>
                    This page informs you about the federation status.
                    If it is green below you can assume that the server is reachable and federates correctly with the wider Matrix network.
                    If there it is orange or red, there are issues with the server. To debug this please check each tab step by step.
                </LeadParagraph>

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

                <div style={{ overflowX: "auto", width: "100%" }}>
                    <Table>
                        <Table.Row>
                            <Table.CellHeader>Server Software</Table.CellHeader>
                            <Table.Cell>
                                {(() => {
                                    // Use the first available per-host version name for software info
                                    const firstVersion = connReports.find(([, report]) => report.Version)?.[1]?.Version;
                                    const versionName = firstVersion?.name || "Unknown";
                                    const softwareInfo = getServerSoftwareInfo(versionName);
                                    return softwareInfo ? (
                                        <>
                                            <Link href={softwareInfo.url} target="_blank" rel="noopener noreferrer">
                                                {versionName}
                                            </Link>
                                            {" "}
                                            <Tag
                                                tint={softwareInfo.maturity === "Stable"
                                                    ? "GREEN"
                                                    : softwareInfo.maturity === "Beta"
                                                        ? "BLUE"
                                                        : "ORANGE"}
                                                color="black"
                                                style={{ paddingRight: 8 }}
                                            >
                                                {softwareInfo.maturity}
                                            </Tag>
                                        </>
                                    ) : (
                                        <>
                                            {versionName}
                                            {!softwareInfo && versionName !== "Unknown" && (
                                                <Tag
                                                    style={{ paddingRight: 8, marginLeft: 8 }}
                                                    tint="GREY"
                                                    color="black"
                                                >Unknown</Tag>
                                            )}
                                        </>
                                    );
                                })()}
                            </Table.Cell>
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
                </div>
                <div style={{ overflowX: "auto", width: "100%" }}>
                    <H2 size="SMALL">Versions (per host)</H2>
                    <Table>
                        {/* Versions (per host) header row */}
                        <Table.Row>
                            {connReports.length > 0 ? (
                                <>
                                    <Table.CellHeader>Host</Table.CellHeader>
                                    <Table.CellHeader>Version</Table.CellHeader>
                                    {connReports.some(([, r]) => !!r.Error) && (
                                        <Table.CellHeader>Error</Table.CellHeader>
                                    )}
                                </>
                            ) : (
                                <Table.Cell>
                                    <Tag tint="GREY" color="black">No reports</Tag>
                                </Table.Cell>
                            )}
                        </Table.Row>
                        {/* Render a row for each host if there are reports */}
                        {connReports.length > 0 && connReports.map(([host, report]) => (
                            <Table.Row key={host}>
                                <Table.Cell>
                                    <code>{host}</code>
                                </Table.Cell>
                                <Table.Cell style={{
                                    maxWidth: 320,
                                    overflowWrap: "break-word",
                                    wordBreak: "break-all",
                                    verticalAlign: "top"
                                }}>
                                    {report.Version
                                        ? <span style={{
                                            display: "inline-block",
                                            maxWidth: 300,
                                            overflowWrap: "break-word",
                                            wordBreak: "break-all",
                                            verticalAlign: "top"
                                        }}>
                                            {report.Version.name} <span style={{ color: "#6c757d" }}>({report.Version.version})</span>
                                        </span>
                                        : <Tag tint="GREY" color="black">Unknown</Tag>
                                    }
                                </Table.Cell>
                                {connReports.some(([, r]) => !!r.Error) && (
                                    <Table.Cell style={{ verticalAlign: "top" }}>
                                        {report.Error && (
                                            <Tag tint="RED" color="white">
                                                {report.Error}
                                            </Tag>
                                        )}
                                    </Table.Cell>
                                )}
                            </Table.Row>
                        ))}
                    </Table>
                </div>
            </Tabs.Panel>

            <Tabs.Panel id="dns" selected={selectedTab === "dns"}>
                <H2>DNS Resolution</H2>
                <LeadParagraph>
                    This section shows the DNS resolution results including direct IP addresses and SRV records found during the Server-Server Discovery algorithm.
                </LeadParagraph>

                {/* DNS Addresses Section */}
                {dnsAddrs.length > 0 && (
                    <>
                        <H2 size="SMALL">Direct IP Addresses</H2>
                        <LeadParagraph>
                            These are the direct IP addresses resolved for the server.
                        </LeadParagraph>
                        <div style={{ overflowX: "auto", width: "100%", marginBottom: "2rem" }}>
                            <Table>
                                <Table.Row>
                                    <Table.CellHeader>IP Address</Table.CellHeader>
                                </Table.Row>
                                {dnsAddrs.map(addr => (
                                    <Table.Row key={addr}>
                                        <Table.Cell><code>{addr}</code></Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table>
                        </div>
                    </>
                )}

                {/* SRV Records Section */}
                <H2 size="SMALL">SRV Records</H2>
                <LeadParagraph>
                    The following SRV records were found when using the Server-Server Discovery algorithm.
                    If you see no SRV records here, the server has no SRV records configured.
                </LeadParagraph>

                {/* Error Messages for SRV Records */}
                {srvTargets.some(([, targets]) => targets.some(target => target.Error)) && (
                    <ErrorSummary
                        heading="DNS Resolution Issues"
                        description={
                            srvTargets
                                .flatMap(([srvRecord, targets]) =>
                                    targets
                                        .filter(target => target.Error)
                                        .map(target => `${srvRecord} → ${target.Target}: ${getErrorMessage(target.Error!)}`)
                                )
                                .join('\n\n')
                        }
                    />
                )}

                <div style={{ overflowX: "auto", width: "100%" }}>
                    <Table>
                        <Table.Row>
                            <Table.CellHeader>Target</Table.CellHeader>
                            <Table.CellHeader>Port</Table.CellHeader>
                            <Table.CellHeader>Priority</Table.CellHeader>
                            <Table.CellHeader>Weight</Table.CellHeader>
                            <Table.CellHeader>Addresses</Table.CellHeader>
                            <Table.CellHeader>Status</Table.CellHeader>
                        </Table.Row>
                        {srvTargets.length > 0 ? (
                            srvTargets.map(([srvRecord, targets]) =>
                                targets.map((target, index) => (
                                    <Table.Row key={`${srvRecord}-${index}`}>
                                        <Table.Cell><code>{target.Target}</code></Table.Cell>
                                        <Table.Cell>{target.Port}</Table.Cell>
                                        <Table.Cell>
                                            {target.Priority !== undefined
                                                ? target.Priority
                                                : <Tag tint="GREY" color="black">N/A</Tag>}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {target.Weight !== undefined
                                                ? target.Weight
                                                : <Tag tint="GREY" color="black">N/A</Tag>}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {target.Addrs && target.Addrs.length > 0
                                                ? target.Addrs.map(addr => <div key={addr}>{addr}</div>)
                                                : <Tag tint="GREY" color="black">None</Tag>}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {target.Error ? (
                                                <Tag tint="RED" color="black">Error</Tag>
                                            ) : (
                                                <Tag tint="GREEN" color="black">OK</Tag>
                                            )}
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            )
                        ) : (
                            <Table.Row>
                                <Table.Cell colSpan={7} style={{ textAlign: "center" }}>
                                    <Tag tint={data?.DNSResult?.SRVSkipped ? "GREEN" : "GREY"} color="black">
                                        {data?.DNSResult?.SRVSkipped
                                            ? "SRV lookup was skipped"
                                            : "No SRV records found"}
                                    </Tag>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table>
                </div>
            </Tabs.Panel>

            <Tabs.Panel id="server-wellknown" selected={selectedTab === "server-wellknown"}>
                <H2>Server Well-Known Results</H2>
                <LeadParagraph>
                    The following well-known results were found when querying the server for its <code>/.well-known/matrix/server</code> endpoint.
                    If you see no entries here, the server has either no well-known endpoint or it is not configured correctly.
                    If you see a <code>m.server</code> entry, this is the server that the Matrix client should connect to.
                </LeadParagraph>

                <div style={{ overflowX: "auto", width: "100%" }}>
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
                </div>
            </Tabs.Panel>

            <Tabs.Panel id="reports" selected={selectedTab === "reports"}>
                <H2>Connection Reports</H2>
                {connReports.length > 0 ? (
                    connReports.map(([host, report]) => (
                        <div key={host} style={{ marginBottom: 24 }}>
                            <H2 size="SMALL">{host}</H2>
                            <div style={{ overflowX: "auto", width: "100%" }}>
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
                                                    tint="GREEN"
                                                    color="black">Yes</Tag>
                                            ) : (
                                                <Tag
                                                    style={{ paddingRight: 8 }}
                                                    tint="RED"
                                                    color="black"
                                                >No</Tag>
                                            )}
                                        </Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.Cell>Server Version Parses</Table.Cell>
                                        <Table.Cell>
                                            {report.Checks.ServerVersionParses ? (
                                                <Tag style={{ paddingRight: 8 }} tint="GREEN" color="black">Yes</Tag>
                                            ) : (
                                                <Tag style={{ paddingRight: 8 }} tint="RED" color="black">No</Tag>
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
                                                    tint="GREEN"
                                                    color="black"
                                                >Yes</Tag>
                                            ) : (
                                                <Tag
                                                    style={{ paddingRight: 8 }}
                                                    tint="RED"
                                                    color="black"
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
                                                    tint="GREEN"
                                                    color="black">Yes</Tag>
                                            ) : (
                                                <Tag
                                                    style={{ paddingRight: 8 }}
                                                    tint="RED"
                                                    color="black"
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
                                                    tint="GREEN"
                                                    color="black">Yes</Tag>
                                            ) : (
                                                <Tag
                                                    style={{ paddingRight: 8 }}
                                                    tint="RED"
                                                    color="black"
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
                                                    tint="GREEN"
                                                    color="black">Yes</Tag>
                                            ) : (
                                                <>
                                                    <Tag
                                                        style={{ paddingRight: 8, marginBottom: 4 }}
                                                        tint="RED"
                                                        color="black"
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
                                                                                tint="RED"
                                                                                color="black"
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
                            </div>
                            <H2 size="SMALL">Keys</H2>

                            <div style={{ overflowX: "auto", width: "100%" }}>
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
                                                >{keyId}</code> <Tag style={{ paddingRight: 8 }} tint="GREY" color="black">Expired</Tag>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <code>{keyObj.key}</code> (expired at {new Date(keyObj.expired_ts).toLocaleString()})
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table>
                            </div>
                            <H2 size="SMALL">Certificates</H2>

                            <div style={{ overflowX: "auto", width: "100%" }}>
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
                            </div>
                            <Details summary="Show Raw Report">
                                <pre
                                    style={{
                                        background: "#f3f2f1",
                                        padding: 12,
                                        borderRadius: 4,
                                        overflowX: "auto",
                                        maxWidth: "100%",
                                        boxSizing: "border-box"
                                    }}
                                >
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
                    <LeadParagraph>
                        The following connection errors were encountered when trying to connect to the server.
                        These errors indicate issues with the network connectivity or server configuration.
                    </LeadParagraph>

                    <div style={{ overflowX: "auto", width: "100%" }}>
                        <Table>
                            <Table.Row>
                                <Table.CellHeader>Host/IP</Table.CellHeader>
                                <Table.CellHeader>Error</Table.CellHeader>
                            </Table.Row>
                            {Object.entries(data.ConnectionErrors ?? {}).map(([host, errObj]) => (
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
                    </div>
                </Tabs.Panel>
            )}

            <Tabs.Panel id="raw" selected={selectedTab === "raw"}>
                <H2>Full Raw API Response</H2>
                <LeadParagraph>
                    This is the raw JSON response from the API.
                    It contains all the information that was used to generate the information in the other tabs.
                    You can use this to debug issues or to see more detailed information about the server.
                </LeadParagraph>
                <pre
                    style={{
                        background: "#f3f2f1",
                        padding: 12,
                        borderRadius: 4,
                        overflowX: "auto",
                        maxWidth: "100%",
                        boxSizing: "border-box"
                    }}
                >
                    {JSON.stringify(data, null, 2)}
                </pre>
            </Tabs.Panel>
        </Tabs >
    );
}