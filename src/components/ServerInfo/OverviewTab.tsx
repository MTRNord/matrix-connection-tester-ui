import { H2, Table, Tag, Link, LoadingBox, ErrorText, WarningText, LeadParagraph, Panel, H1 } from "govuk-react";
import type { ApiSchemaType, ClientServerVersionsType } from "../../apiTypes";
import { useTranslation } from "react-i18next";
import { translateApiError } from "../../utils/errorTranslation";
import unstableFeatures from "../../data/unstableFeatures.json";

// Example lookup table for known server software
const KNOWN_SERVER_SOFTWARE: Record<string, { maturity: "Stable" | "Beta" | "Experimental", url: string }> = {
    "synapse": { maturity: "Stable", url: "https://github.com/matrix-org/synapse" },
    "dendrite": { maturity: "Beta", url: "https://github.com/matrix-org/dendrite" },
    "conduit": { maturity: "Experimental", url: "https://gitlab.com/famedly/conduit" },
    "construct": { maturity: "Experimental", url: "https://github.com/matrix-construct/construct" },
    "continuwuity": { maturity: "Beta", url: "https://continuwuity.org/" },
    "matrix-key-server": { maturity: "Experimental", url: "https://github.com/t2bot/matrix-key-server" },
};

// Type for unstable feature info
type UnstableFeatureInfo = {
    msc?: string;
    title?: string;
    description?: string;
};

// Unstable features lookup table loaded from JSON
const UNSTABLE_FEATURES: Record<string, UnstableFeatureInfo> = unstableFeatures;

function getServerSoftwareInfo(name: string) {
    return KNOWN_SERVER_SOFTWARE[name.toLowerCase()] || null;
}

function getUnstableFeatureInfo(feature: string): UnstableFeatureInfo | null {
    return UNSTABLE_FEATURES[feature] || null;
}

interface OverviewTabProps {
    data: ApiSchemaType;
    clientServerVersionsData?: ClientServerVersionsType;
    clientServerVersionsError?: Error;
    clientServerVersionsWarnings?: Error[];
    isValidating: boolean;
}

export default function OverviewTab({
    data,
    clientServerVersionsData,
    clientServerVersionsError,
    clientServerVersionsWarnings,
    isValidating
}: OverviewTabProps) {
    const { t } = useTranslation();

    // Federation status
    const federationOK = data?.FederationOK;

    // DNS info
    const dnsAddrs = data?.DNSResult?.Addrs || [];

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

    return (
        <>
            <H1>{t('federation.overview.title')}</H1>

            <LeadParagraph>
                {t('federation.overview.description')}
            </LeadParagraph>

            {/* eslint-disable-next-line no-constant-binary-expression -- This seems to be overly jumpy*/}
            {isValidating && false && (
                <LoadingBox loading={true}>
                    <p>Refreshing data…</p>
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
                <H2>{t('federation.overview.versionsPerHost')}</H2>
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

            {/* Client Server Versions Section */}
            <div style={{ overflowX: "auto", width: "100%" }}>
                <H1>{t('serverInfo.clientServerApi.title')}</H1>
                {clientServerVersionsData ? (
                    <>
                        {(() => {
                            // Determine client API status
                            let apiPanelTitle = t('serverInfo.clientServerApi.status.working');
                            let apiPanelColor = undefined; // Green (default)

                            // Check if we have supported versions
                            const hasVersions = clientServerVersionsData.versions && clientServerVersionsData.versions.length > 0;
                            const hasModernVersions = clientServerVersionsData.versions?.some(v => v.startsWith('v1.'));

                            if (!hasVersions) {
                                apiPanelTitle = t('serverInfo.clientServerApi.status.failed');
                                apiPanelColor = "#d4351c"; // Red
                            } else if (!hasModernVersions) {
                                apiPanelTitle = t('serverInfo.clientServerApi.status.partiallyWorking');
                                apiPanelColor = "#f47738"; // Orange
                            }

                            return (
                                <Panel
                                    title={apiPanelTitle}
                                    style={{
                                        background: apiPanelColor,
                                        color: "white",
                                        marginBottom: "2rem"
                                    }}
                                />
                            );
                        })()}

                        {/* Show warnings if they exist */}
                        {clientServerVersionsWarnings && clientServerVersionsWarnings.length > 0 && (
                            <div style={{ marginBottom: "1rem" }}>
                                {clientServerVersionsWarnings.map((warning, index) => (
                                    <WarningText key={index}>
                                        <strong>Warning:</strong>
                                        <div
                                            style={{
                                                marginTop: "0.5rem",
                                                padding: "12px",
                                                backgroundColor: "#fff2e6",
                                                borderLeft: "10px solid #f47738",
                                                lineHeight: "1.5"
                                            }}
                                            dangerouslySetInnerHTML={{ __html: translateApiError(warning, t) }}
                                        />
                                    </WarningText>
                                ))}
                            </div>
                        )}

                        {/* Server Information */}
                        {clientServerVersionsData.server && (
                            <>
                                <H2>{t('serverInfo.clientServerApi.serverInformation')}</H2>
                                <Table>
                                    <Table.Row>
                                        <Table.CellHeader>{t('serverInfo.clientServerApi.serverName')}</Table.CellHeader>
                                        <Table.Cell>{clientServerVersionsData.server.name}</Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.CellHeader>{t('serverInfo.clientServerApi.serverVersion')}</Table.CellHeader>
                                        <Table.Cell>{clientServerVersionsData.server.version}</Table.Cell>
                                    </Table.Row>
                                </Table>
                            </>
                        )}

                        {/* Supported Versions */}
                        <H2>{t('serverInfo.clientServerApi.supportedVersions')}</H2>
                        <LeadParagraph>
                            {t('serverInfo.clientServerApi.description')}
                        </LeadParagraph>
                        {clientServerVersionsData.versions?.length > 0 ? (
                            <div style={{
                                padding: "12px 0",
                                marginBottom: "1rem",
                                lineHeight: "1.8"
                            }}>
                                {clientServerVersionsData.versions.map((version) => {
                                    // Determine version color based on spec compliance
                                    let tagColor: "GREEN" | "BLUE" | "GREY" | "ORANGE" = "GREY";

                                    // Latest stable versions (as of Matrix Spec 1.15)
                                    if (version === "v1.11" || version === "v1.10" || version === "v1.9") {
                                        tagColor = "GREEN"; // Latest/current versions
                                    } else if (version.startsWith("v1.") && parseFloat(version.substring(2)) >= 1) {
                                        tagColor = "BLUE"; // Stable but older versions
                                    } else if (version.startsWith("r0.")) {
                                        tagColor = "ORANGE"; // Legacy r0.x versions
                                    }

                                    return (
                                        <span key={version} style={{ marginRight: "8px", marginBottom: "4px", display: "inline-block" }}>
                                            <Tag tint={tagColor} color="black">
                                                {version}
                                            </Tag>
                                        </span>
                                    );
                                })}
                            </div>
                        ) : (
                            <p>{t('serverInfo.clientServerApi.noSupportedVersions')}</p>
                        )}

                        {/* Unstable Features */}
                        {clientServerVersionsData.unstable_features && Object.keys(clientServerVersionsData.unstable_features).length > 0 && (
                            <>
                                <H2>{t('serverInfo.clientServerApi.unstableFeatures.title')}</H2>
                                <LeadParagraph>
                                    {t('serverInfo.clientServerApi.unstableFeatures.description')}
                                </LeadParagraph>
                                <Table>
                                    <Table.Row>
                                        <Table.CellHeader>{t('serverInfo.clientServerApi.unstableFeatures.feature')}</Table.CellHeader>
                                        <Table.CellHeader>{t('serverInfo.clientServerApi.unstableFeatures.status')}</Table.CellHeader>
                                        <Table.CellHeader>{t('serverInfo.clientServerApi.unstableFeatures.featureDescription')}</Table.CellHeader>
                                        <Table.CellHeader>{t('serverInfo.clientServerApi.unstableFeatures.msc')}</Table.CellHeader>
                                    </Table.Row>
                                    {Object.entries(clientServerVersionsData.unstable_features).map(([feature, enabled]) => {
                                        const featureInfo = getUnstableFeatureInfo(feature);
                                        return (
                                            <Table.Row key={feature}>
                                                <Table.Cell>
                                                    <code>{feature}</code>
                                                    {featureInfo?.title && (
                                                        <div style={{ fontSize: "0.875rem", color: "#6c757d", marginTop: 4 }}>
                                                            {featureInfo.title}
                                                        </div>
                                                    )}
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Tag tint={enabled ? "GREEN" : "RED"} color="black">
                                                        {enabled ? t('serverInfo.clientServerApi.unstableFeatures.enabled') : t('serverInfo.clientServerApi.unstableFeatures.disabled')}
                                                    </Tag>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {featureInfo?.description || t('serverInfo.clientServerApi.unstableFeatures.noDescription')}
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {featureInfo?.msc ? (
                                                        <Link
                                                            href={`https://github.com/matrix-org/matrix-spec-proposals/pull/${featureInfo.msc.replace('MSC', '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            {featureInfo.msc}
                                                        </Link>
                                                    ) : (
                                                        <Tag tint="GREY" color="black">{t('serverInfo.clientServerApi.unstableFeatures.unknown')}</Tag>
                                                    )}
                                                </Table.Cell>
                                            </Table.Row>
                                        );
                                    })}
                                </Table>
                            </>
                        )}
                    </>
                ) : clientServerVersionsError ? (
                    <>
                        {(() => {
                            // Check if this is a warning error (like Content-Type issues or fallback scenarios)
                            const isWarning = 'isWarning' in clientServerVersionsError && clientServerVersionsError.isWarning;
                            const bannerTitle = isWarning
                                ? t('serverInfo.clientServerApi.status.partiallyWorking')
                                : t('serverInfo.clientServerApi.status.failed');
                            const bannerColor = isWarning ? "#f47738" : "#d4351c"; // Orange for warning, red for error

                            return (
                                <Panel
                                    title={bannerTitle}
                                    style={{
                                        background: bannerColor,
                                        color: "white",
                                        marginBottom: "1rem"
                                    }}
                                />
                            );
                        })()}
                        {/* Use WarningText for warnings, ErrorText for actual errors */}
                        {(() => {
                            const isWarning = 'isWarning' in clientServerVersionsError && clientServerVersionsError.isWarning;
                            const TextComponent = isWarning ? WarningText : ErrorText;
                            const errorMessage = translateApiError(clientServerVersionsError, t);

                            return (
                                <TextComponent>
                                    {t('serverInfo.errors.failedToFetchClientServerVersions')}<br />
                                    <div
                                        style={{
                                            marginTop: "0.5rem",
                                            padding: "12px",
                                            backgroundColor: "#f3f2f1",
                                            borderLeft: `10px solid ${isWarning ? "#f47738" : "#d4351c"}`,
                                            lineHeight: "1.5"
                                        }}
                                        dangerouslySetInnerHTML={{ __html: errorMessage }}
                                    />
                                </TextComponent>
                            );
                        })()}
                    </>
                ) : (
                    <LoadingBox loading={true}>
                        <p>{t('serverInfo.errors.loadingClientServerVersions')}</p>
                    </LoadingBox>
                )}
            </div>
        </>
    );
}
