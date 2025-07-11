import { H2, Table, Tag, ListItem, Details, Paragraph } from "govuk-react";
import { useTranslation } from "react-i18next";
import type { components } from "../../api/api";

interface ReportsTabProps {
    data: components["schemas"]["Root"];
}

export default function ReportsTab({ data }: ReportsTabProps) {
    const { t } = useTranslation();

    // Connection reports
    const connReports = Object.entries(data?.ConnectionReports ?? {});

    return (
        <>
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
                                            <code>{keyObj.key}</code> (expired at {new Date(keyObj.expired_ts || 0).toLocaleString()})
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
        </>
    );
}
