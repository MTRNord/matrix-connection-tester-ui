import { useState } from "react";
import { H2, Table, Panel, Tag, Link, LoadingBox, ErrorText, Paragraph, ListItem, Tabs, Details, LeadParagraph, ErrorSummary } from "govuk-react";
import type { ApiSchemaType, ErrorType } from "./apiTypes";
import useSWR from "swr";
import { fetchData } from "./api";
import { useTranslation, Trans } from "react-i18next";
import { translateApiError } from "./utils/errorTranslation";

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
    let panelTitle = t('federation.overview.status.working');
    let panelColor = undefined;
    if (!federationOK) {
        if (anyConnectionSuccess) {
            panelTitle = t('federation.overview.status.partiallyFailed');
            panelColor = "#f47738"; // GOV.UK orange for warning/partial
        } else {
            panelTitle = t('federation.overview.status.failed');
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
        <div data-testid="federation-results">
            <Tabs>
                <Tabs.Title>{t('federation.title')}</Tabs.Title>
                <Tabs.List>
                    <Tabs.Tab
                        id="overview-tab"
                        href="#overview"
                        selected={selectedTab === "overview"}
                        onClick={handleTabClick("overview")}
                    >{t('federation.tabs.overview')}</Tabs.Tab>
                    <Tabs.Tab
                        id="dns-tab"
                        href="#dns"
                        selected={selectedTab === "dns"}
                        onClick={handleTabClick("dns")}
                    >{t('federation.tabs.dns')}</Tabs.Tab>
                    <Tabs.Tab
                        id="server-wellknown-tab"
                        href="#server-wellknown"
                        selected={selectedTab === "server-wellknown"}
                        onClick={handleTabClick("server-wellknown")}
                    >{t('federation.tabs.wellKnown')}</Tabs.Tab>
                    <Tabs.Tab
                        id="reports-tab"
                        href="#reports"
                        selected={selectedTab === "reports"}
                        onClick={handleTabClick("reports")}
                    >{t('federation.tabs.reports')}</Tabs.Tab>
                    {Object.keys(data.ConnectionErrors ?? {}).length > 0 && (<Tabs.Tab
                        id="errors-tab"
                        href="#errors"
                        selected={selectedTab === "errors"}
                        onClick={handleTabClick("errors")}
                    >{t('federation.tabs.errors')}</Tabs.Tab>)}
                    <Tabs.Tab
                        id="raw-tab"
                        href="#raw"
                        selected={selectedTab === "raw"}
                        onClick={handleTabClick("raw")}
                    >{t('federation.tabs.raw')}</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel id="overview" selected={selectedTab === "overview"}>
                    <H2>{t('federation.overview.title')}</H2>

                    <LeadParagraph>
                        {t('federation.overview.description')}
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
                                <Table.CellHeader>{t('federation.overview.serverSoftware')}</Table.CellHeader>
                                <Table.Cell>
                                    {(() => {
                                        // Use the first available per-host version name for software info
                                        const firstVersion = connReports.find(([, report]) => report.Version)?.[1]?.Version;
                                        const versionName = firstVersion?.name || t('common.unknown');
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
                                                    {t(`federation.overview.maturity.${softwareInfo.maturity}`)}
                                                </Tag>
                                            </>
                                        ) : (
                                            <>
                                                {versionName}
                                                {!softwareInfo && versionName !== t('common.unknown') && (
                                                    <Tag
                                                        style={{ paddingRight: 8, marginLeft: 8 }}
                                                        tint="GREY"
                                                        color="black"
                                                    >{t('common.unknown')}</Tag>
                                                )}
                                            </>
                                        );
                                    })()}
                                </Table.Cell>
                            </Table.Row>

                            <Table.Row>
                                <Table.CellHeader>{t('federation.overview.dnsAddresses')}</Table.CellHeader>
                                <Table.Cell>
                                    {dnsAddrs.length > 0
                                        ? dnsAddrs.map(addr => <div key={addr}>{addr}</div>)
                                        : t('federation.overview.noAddressesFound')}
                                </Table.Cell>
                            </Table.Row>
                        </Table>
                    </div>
                    <div style={{ overflowX: "auto", width: "100%" }}>
                        <H2 size="SMALL">{t('federation.overview.versionsPerHost')}</H2>
                        <Table>
                            {/* Versions (per host) header row */}
                            <Table.Row>
                                {connReports.length > 0 ? (
                                    <>
                                        <Table.CellHeader>{t('common.host')}</Table.CellHeader>
                                        <Table.CellHeader>{t('common.version')}</Table.CellHeader>
                                        {connReports.some(([, r]) => !!r.Error) && (
                                            <Table.CellHeader>{t('common.error')}</Table.CellHeader>
                                        )}
                                    </>
                                ) : (
                                    <Table.Cell>
                                        <Tag tint="GREY" color="black">{t('federation.overview.noReports')}</Tag>
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
                                            : <Tag tint="GREY" color="black">{t('common.unknown')}</Tag>
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
                    <H2>{t('federation.dns.title')}</H2>
                    <LeadParagraph>
                        {t('federation.dns.description')}
                    </LeadParagraph>

                    {/* DNS Addresses Section */}
                    {dnsAddrs.length > 0 && (
                        <>
                            <H2 size="SMALL">{t('federation.dns.directIpAddresses.title')}</H2>
                            <LeadParagraph>
                                {t('federation.dns.directIpAddresses.description')}
                            </LeadParagraph>
                            <div style={{ overflowX: "auto", width: "100%", marginBottom: "2rem" }}>
                                <Table>
                                    <Table.Row>
                                        <Table.CellHeader>{t('federation.dns.directIpAddresses.ipAddress')}</Table.CellHeader>
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
                    <H2 size="SMALL">{t('federation.dns.srvRecords.title')}</H2>
                    <LeadParagraph>
                        {t('federation.dns.srvRecords.description')}
                    </LeadParagraph>

                    {/* Error Messages for SRV Records */}
                    {srvTargets.some(([, targets]) => targets.some(target => target.Error)) && (
                        <ErrorSummary
                            heading={t('federation.dns.srvRecords.errorHeading')}
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
                                <Table.CellHeader>{t('federation.dns.srvRecords.target')}</Table.CellHeader>
                                <Table.CellHeader>{t('federation.dns.srvRecords.port')}</Table.CellHeader>
                                <Table.CellHeader>{t('federation.dns.srvRecords.priority')}</Table.CellHeader>
                                <Table.CellHeader>{t('federation.dns.srvRecords.weight')}</Table.CellHeader>
                                <Table.CellHeader>{t('federation.dns.srvRecords.addresses')}</Table.CellHeader>
                                <Table.CellHeader>{t('federation.dns.srvRecords.status')}</Table.CellHeader>
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
                                                    : <Tag tint="GREY" color="black">{t('common.na')}</Tag>}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {target.Weight !== undefined
                                                    ? target.Weight
                                                    : <Tag tint="GREY" color="black">{t('common.na')}</Tag>}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {target.Addrs && target.Addrs.length > 0
                                                    ? target.Addrs.map(addr => <div key={addr}>{addr}</div>)
                                                    : <Tag tint="GREY" color="black">{t('common.none')}</Tag>}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {target.Error ? (
                                                    <Tag tint="RED" color="black">{t('common.error')}</Tag>
                                                ) : (
                                                    <Tag tint="GREEN" color="black">{t('common.ok')}</Tag>
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
                                                ? t('federation.dns.srvRecords.srvSkipped')
                                                : t('federation.dns.srvRecords.noRecords')}
                                        </Tag>
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table>
                    </div>
                </Tabs.Panel>

                <Tabs.Panel id="server-wellknown" selected={selectedTab === "server-wellknown"}>
                    <H2>{t('federation.wellKnown.title')}</H2>
                    <LeadParagraph>
                        <Trans i18nKey="federation.wellKnown.description" components={{ code: <code /> }} />
                    </LeadParagraph>

                    <div style={{ overflowX: "auto", width: "100%" }}>
                        <Table>
                            <Table.Row>
                                <Table.CellHeader>{t('federation.wellKnown.key')}</Table.CellHeader>
                                <Table.CellHeader>{t('federation.wellKnown.server')}</Table.CellHeader>
                                <Table.CellHeader>{t('federation.wellKnown.cacheExpiresAt')}</Table.CellHeader>
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
                    <H2>{t('federation.reports.title')}</H2>
                    {connReports.length > 0 ? (
                        connReports.map(([host, report]) => (
                            <div key={host} style={{ marginBottom: 24 }}>
                                <H2 size="SMALL">{host}</H2>
                                <div style={{ overflowX: "auto", width: "100%" }}>
                                    <Table>
                                        <Table.Row>
                                            <Table.CellHeader>{t('federation.reports.checks.check')}</Table.CellHeader>
                                            <Table.CellHeader>{t('federation.reports.checks.result')}</Table.CellHeader>
                                        </Table.Row>
                                        {report.Version && (
                                            <Table.Row>
                                                <Table.Cell>{t('federation.reports.checks.serverVersion')}</Table.Cell>
                                                <Table.Cell>
                                                    {report.Version.name} ({report.Version.version})
                                                </Table.Cell>
                                            </Table.Row>
                                        )}
                                        <Table.Row>
                                            <Table.Cell>{t('federation.reports.checks.allChecksOk')}</Table.Cell>
                                            <Table.Cell>
                                                {report.Checks.AllChecksOK ? (
                                                    <Tag
                                                        style={{ paddingRight: 8 }}
                                                        tint="GREEN"
                                                        color="black">{t('federation.reports.checks.yes')}</Tag>
                                                ) : (
                                                    <Tag
                                                        style={{ paddingRight: 8 }}
                                                        tint="RED"
                                                        color="black"
                                                    >{t('federation.reports.checks.no')}</Tag>
                                                )}
                                            </Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell>{t('federation.reports.checks.serverVersionParses')}</Table.Cell>
                                            <Table.Cell>
                                                {report.Checks.ServerVersionParses ? (
                                                    <Tag style={{ paddingRight: 8 }} tint="GREEN" color="black">{t('federation.reports.checks.yes')}</Tag>
                                                ) : (
                                                    <Tag style={{ paddingRight: 8 }} tint="RED" color="black">{t('federation.reports.checks.no')}</Tag>
                                                )}
                                            </Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell>{t('federation.reports.checks.cipherSuite')}</Table.Cell>
                                            <Table.Cell>
                                                {report.Cipher.CipherSuite} ({report.Cipher.Version})
                                            </Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell>{t('federation.reports.checks.validCertificates')}</Table.Cell>
                                            <Table.Cell>
                                                {report.Checks.ValidCertificates ? (
                                                    <Tag
                                                        style={{ paddingRight: 8 }}
                                                        tint="GREEN"
                                                        color="black"
                                                    >{t('federation.reports.checks.yes')}</Tag>
                                                ) : (
                                                    <Tag
                                                        style={{ paddingRight: 8 }}
                                                        tint="RED"
                                                        color="black"
                                                    >{t('federation.reports.checks.no')}</Tag>
                                                )}
                                            </Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell>{t('federation.reports.checks.ed25519KeyPresent')}</Table.Cell>
                                            <Table.Cell>
                                                {report.Checks.HasEd25519Key ? (
                                                    <Tag
                                                        style={{ paddingRight: 8 }}
                                                        tint="GREEN"
                                                        color="black">{t('federation.reports.checks.yes')}</Tag>
                                                ) : (
                                                    <Tag
                                                        style={{ paddingRight: 8 }}
                                                        tint="RED"
                                                        color="black"
                                                    >{t('federation.reports.checks.no')}</Tag>
                                                )}
                                            </Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell>{t('federation.reports.checks.matchingServerName')}</Table.Cell>
                                            <Table.Cell>
                                                {report.Checks.MatchingServerName ? (
                                                    <Tag
                                                        style={{ paddingRight: 8 }}
                                                        tint="GREEN"
                                                        color="black">{t('federation.reports.checks.yes')}</Tag>
                                                ) : (
                                                    <Tag
                                                        style={{ paddingRight: 8 }}
                                                        tint="RED"
                                                        color="black"
                                                    >{t('federation.reports.checks.no')}</Tag>
                                                )}
                                            </Table.Cell>
                                        </Table.Row>
                                        <Table.Row>
                                            <Table.Cell>{t('federation.reports.checks.matchingSignature')}</Table.Cell>
                                            <Table.Cell>
                                                {report.Checks.AllEd25519ChecksOK ? (
                                                    <Tag
                                                        style={{ paddingRight: 8 }}
                                                        tint="GREEN"
                                                        color="black">{t('federation.reports.checks.yes')}</Tag>
                                                ) : (
                                                    <>
                                                        <Tag
                                                            style={{ paddingRight: 8, marginBottom: 4 }}
                                                            tint="RED"
                                                            color="black"
                                                        >{t('federation.reports.checks.no')}</Tag>
                                                        {report.Checks.Ed25519Checks && (
                                                            <div style={{ marginTop: 8 }}>
                                                                <strong>{t('federation.reports.checks.failingKeys')}</strong>
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
                                <H2 size="SMALL">{t('federation.reports.keys.title')}</H2>

                                <div style={{ overflowX: "auto", width: "100%" }}>
                                    <Table>
                                        <Table.Row>
                                            <Table.CellHeader>{t('federation.reports.keys.keyId')}</Table.CellHeader>
                                            <Table.CellHeader>{t('federation.reports.keys.key')}</Table.CellHeader>
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
                                                    >{keyId}</code> <Tag style={{ paddingRight: 8 }} tint="GREY" color="black">{t('federation.reports.keys.expired')}</Tag>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <code>{keyObj.key}</code> (expired at {new Date(keyObj.expired_ts).toLocaleString()})
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table>
                                </div>
                                <H2 size="SMALL">{t('federation.reports.certificates.title')}</H2>

                                <div style={{ overflowX: "auto", width: "100%" }}>
                                    <Table>
                                        <Table.Row>
                                            <Table.CellHeader>{t('federation.reports.certificates.issuer')}</Table.CellHeader>
                                            <Table.CellHeader>{t('federation.reports.certificates.subject')}</Table.CellHeader>
                                            <Table.CellHeader>{t('federation.reports.certificates.fingerprint')}</Table.CellHeader>
                                            <Table.CellHeader>{t('federation.reports.certificates.dnsNames')}</Table.CellHeader>
                                        </Table.Row>
                                        {report.Certificates && report.Certificates.map((cert, index) => (
                                            <Table.Row key={index}>
                                                <Table.Cell>{cert.IssuerCommonName}</Table.Cell>
                                                <Table.Cell>{cert.SubjectCommonName}</Table.Cell>
                                                <Table.Cell>{cert.SHA256Fingerprint}</Table.Cell>
                                                <Table.Cell>
                                                    {cert.DNSNames && cert.DNSNames.length > 0
                                                        ? cert.DNSNames.join(", ")
                                                        : t('common.none')}
                                                </Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table>
                                </div>
                                <Details summary={t('federation.reports.showRawReport')}>
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
                        <Paragraph>{t('federation.reports.noReportsAvailable')}</Paragraph>
                    )}
                </Tabs.Panel>
                {Object.keys(data.ConnectionErrors ?? {}).length > 0 && (
                    <Tabs.Panel id="errors" selected={selectedTab === "errors"}>
                        <H2>{t('federation.connectionErrors.title')}</H2>
                        <LeadParagraph>
                            {t('federation.connectionErrors.description')}
                        </LeadParagraph>

                        <div style={{ overflowX: "auto", width: "100%" }}>
                            <Table>
                                <Table.Row>
                                    <Table.CellHeader>{t('federation.connectionErrors.hostIp')}</Table.CellHeader>
                                    <Table.CellHeader>{t('common.error')}</Table.CellHeader>
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
                    <H2>{t('federation.raw.title')}</H2>
                    <LeadParagraph>
                        {t('federation.raw.description')}
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
        </div>
    );
}