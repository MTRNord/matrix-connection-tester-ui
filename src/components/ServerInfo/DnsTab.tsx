import { H2, Table, Tag, LeadParagraph, ErrorSummary } from "govuk-react";
import { useTranslation } from "react-i18next";
import type { components } from "../../api/api";

interface DnsTabProps {
    data: components["schemas"]["Root"];
}

export default function DnsTab({ data }: DnsTabProps) {
    const { t } = useTranslation();

    // DNS info
    const dnsAddrs = data?.DNSResult?.Addrs || [];
    const srvTargets = Object.entries(data?.DNSResult?.SrvTargets || {});

    // Helper to get user-friendly error message
    const getErrorMessage = (error: components["schemas"]["Error"]) => {
        const translationKey = `DNS.errorCodes.${error.ErrorCode}`;
        const translatedMessage = t(translationKey);

        // If no translation found, fall back to the raw error message
        return translatedMessage !== translationKey ? translatedMessage : error.Error;
    };

    return (
        <>
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
                        <Table.CellHeader>{t('federation.dns.srvRecords.srv_prefix')}</Table.CellHeader>
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
                                    <Table.Cell><code>{target.SrvPrefix}</code></Table.Cell>
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
        </>
    );
}
