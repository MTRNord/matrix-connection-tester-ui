import { H2, Table, Tag, Link, LoadingBox, ErrorText, LeadParagraph, Panel } from "govuk-react";
import type { ApiSchemaType, ClientServerVersionsType } from "../../apiTypes";
import { useTranslation } from "react-i18next";
import { translateApiError } from "../../utils/errorTranslation";

// Example lookup table for known server software
const KNOWN_SERVER_SOFTWARE: Record<string, { maturity: "Stable" | "Beta" | "Experimental", url: string }> = {
    "synapse": { maturity: "Stable", url: "https://github.com/matrix-org/synapse" },
    "dendrite": { maturity: "Beta", url: "https://github.com/matrix-org/dendrite" },
    "conduit": { maturity: "Experimental", url: "https://gitlab.com/famedly/conduit" },
    "construct": { maturity: "Experimental", url: "https://github.com/matrix-construct/construct" },
    "continuwuity": { maturity: "Beta", url: "https://continuwuity.org/" },
    "matrix-key-server": { maturity: "Experimental", url: "https://github.com/t2bot/matrix-key-server" },
};

// Lookup table for unstable features with MSC information
const UNSTABLE_FEATURES: Record<string, { msc?: string, title?: string, description?: string }> = {
    "org.matrix.e2e_cross_signing": {
        msc: "MSC1756",
        title: "Cross-signing",
        description: "Device verification via cross-signing"
    },
    "org.matrix.label_based_filtering": {
        msc: "MSC2326",
        title: "Label-based filtering",
        description: "Message filtering based on labels"
    },
    "org.matrix.msc2432": {
        msc: "MSC2432",
        title: "Alias event authorization",
        description: "Updated authorization rules for alias events"
    },
    "org.matrix.msc3026.busy_presence": {
        msc: "MSC3026",
        title: "Busy presence",
        description: "Additional presence state for busy status"
    },
    "org.matrix.msc2716": {
        msc: "MSC2716",
        title: "Incrementally importing history",
        description: "Import message history into existing rooms"
    },
    "org.matrix.msc3440.stable": {
        msc: "MSC3440",
        title: "Threading",
        description: "Message threading support"
    },
    "org.matrix.msc3489": {
        msc: "MSC3489",
        title: "Beeper contact discovery",
        description: "Enhanced contact discovery mechanisms"
    },
    "uk.half-shot.msc2666.query_mutual_rooms": {
        msc: "MSC2666",
        title: "Query mutual rooms",
        description: "Query rooms shared with another user"
    },
    "org.matrix.msc2285.stable": {
        msc: "MSC2285",
        title: "Private Read Receipts",
        description: "Private read receipts for messages"
    },
    "org.matrix.msc3771": {
        msc: "MSC3771",
        title: "Read receipts for threads",
        description: "Read receipts specifically for message threads",
    },
    "org.matrix.msc3827.stable": {
        msc: "MSC3827",
        title: "Filtering of /publicRooms by room type",
        description: "Filter public rooms by type",
    },
    "org.matrix.msc3773": {
        msc: "MSC3773",
        title: "Notifications for threads",
        description: "Thread notifications",
    },
    "fi.mau.msc2815": {
        msc: "MSC2815",
        title: "Proposal to allow room moderators to view redacted event content",
        description: "Allows room moderators to view redacted content in events"
    },
    "fi.mau.msc2659.stable": {
        msc: "MSC2659",
        title: "Application service ping endpoint",
        description: "Provides a ping endpoint for application services to check connectivity"
    },
    "org.matrix.msc3882": {
        msc: "MSC3882",
        title: "Allow an existing session to sign in a new session",
        description: "Allows an existing session to sign in a new session without re-authentication"
    },
    "org.matrix.msc3881": {
        msc: "MSC3881",
        title: "Remotely toggle push notifications for another client",
        description: "Allows a user to remotely toggle push notifications for another client",
    },
    "org.matrix.msc3874": {
        msc: "MSC3874",
        title: "Filtering threads from the /messages endpoint",
        description: "Allows filtering of threads from the /messages endpoint",
    },
    "org.matrix.msc3912": {
        msc: "MSC3912",
        title: "Redaction of related events",
        description: "Allows redaction of related events in a room",
    },
    "org.matrix.msc3981": {
        msc: "MSC3981",
        title: "/relations recursion",
        description: "Allows recursion in /relations queries to fetch related events",
    },
    "org.matrix.msc3391": {
        msc: "MSC3391",
        title: "API to delete account data",
        description: "Provides an API to delete account data for a user",
    },
    "org.matrix.msc4069": {
        msc: "MSC4069",
        title: "Inhibit profile propagation",
        description: "Allows users to inhibit profile information from being propagated to other clients",
    },
    "org.matrix.msc4028": {
        msc: "MSC4028",
        title: "Push all encrypted events except for muted rooms",
        description: "Allows clients to push all encrypted events except for those in muted rooms",
    },
    "org.matrix.msc4108": {
        msc: "MSC4108",
        title: "Mechanism to allow OIDC sign in and E2EE set up via QR code",
        description: "Provides a mechanism for OIDC sign-in and E2EE setup via QR code",
    },
    "org.matrix.msc4140": {
        msc: "MSC4140",
        title: "Delayed events",
        description: "Allows events to be sent with a delay",
    },
    "org.matrix.simplified_msc3575": {
        msc: "MSC4186",
        title: "Simplified Sliding Sync",
        description: "The new sliding sync protocol prominently used by clients like Element X"
    },
    "uk.tcpip.msc4133": {
        msc: "MSC4133",
        title: "Extending User Profile API with Key:Value Pairs",
        description: "Extends the User Profile API to support key-value pairs for user profiles"
    },
    "org.matrix.msc4155": {
        msc: "MSC4155",
        title: "Invite filtering",
        description: "Allows filtering of invites based on user preferences"
    }
};

function getServerSoftwareInfo(name: string) {
    return KNOWN_SERVER_SOFTWARE[name.toLowerCase()] || null;
}

function getUnstableFeatureInfo(feature: string) {
    return UNSTABLE_FEATURES[feature] || null;
}

interface OverviewTabProps {
    data: ApiSchemaType;
    clientServerVersionsData?: ClientServerVersionsType;
    clientServerVersionsError?: Error;
    isValidating: boolean;
}

export default function OverviewTab({
    data,
    clientServerVersionsData,
    clientServerVersionsError,
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
            <H2>{t('federation.overview.title')}</H2>

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

            {/* Client Server Versions Section */}
            <div style={{ overflowX: "auto", width: "100%" }}>
                <H2 size="SMALL">{t('federation.overview.clientServerApi.title')}</H2>
                {clientServerVersionsData ? (
                    <>
                        {/* Server Information */}
                        {clientServerVersionsData.server && (
                            <>
                                <H2 size="SMALL">{t('federation.overview.clientServerApi.serverInformation')}</H2>
                                <Table>
                                    <Table.Row>
                                        <Table.CellHeader>{t('federation.overview.clientServerApi.serverName')}</Table.CellHeader>
                                        <Table.Cell>{clientServerVersionsData.server.name}</Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.CellHeader>{t('federation.overview.clientServerApi.serverVersion')}</Table.CellHeader>
                                        <Table.Cell>{clientServerVersionsData.server.version}</Table.Cell>
                                    </Table.Row>
                                </Table>
                            </>
                        )}

                        {/* Supported Versions */}
                        <H2 size="SMALL">{t('federation.overview.clientServerApi.supportedVersions')}</H2>
                        <LeadParagraph>
                            {t('federation.overview.clientServerApi.description')}
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
                            <p>{t('federation.overview.clientServerApi.noSupportedVersions')}</p>
                        )}

                        {/* Unstable Features */}
                        {clientServerVersionsData.unstable_features && Object.keys(clientServerVersionsData.unstable_features).length > 0 && (
                            <>
                                <H2 size="SMALL">{t('federation.overview.clientServerApi.unstableFeatures.title')}</H2>
                                <LeadParagraph>
                                    {t('federation.overview.clientServerApi.unstableFeatures.description')}
                                </LeadParagraph>
                                <Table>
                                    <Table.Row>
                                        <Table.CellHeader>{t('federation.overview.clientServerApi.unstableFeatures.feature')}</Table.CellHeader>
                                        <Table.CellHeader>{t('federation.overview.clientServerApi.unstableFeatures.status')}</Table.CellHeader>
                                        <Table.CellHeader>{t('federation.overview.clientServerApi.unstableFeatures.featureDescription')}</Table.CellHeader>
                                        <Table.CellHeader>{t('federation.overview.clientServerApi.unstableFeatures.msc')}</Table.CellHeader>
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
                                                        {enabled ? t('federation.overview.clientServerApi.unstableFeatures.enabled') : t('federation.overview.clientServerApi.unstableFeatures.disabled')}
                                                    </Tag>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {featureInfo?.description || t('federation.overview.clientServerApi.unstableFeatures.noDescription')}
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
                                                        <Tag tint="GREY" color="black">{t('federation.overview.clientServerApi.unstableFeatures.unknown')}</Tag>
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
                    <ErrorText>
                        {t('federation.overview.errors.failedToFetchClientServerVersions')}<br />
                        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{translateApiError(clientServerVersionsError, t)}</pre>
                    </ErrorText>
                ) : (
                    <LoadingBox loading={true}>
                        <p>{t('federation.overview.errors.loadingClientServerVersions')}</p>
                    </LoadingBox>
                )}
            </div>
        </>
    );
}
