import { H2, Table, Tag, LoadingBox, ErrorText, LeadParagraph, WarningText } from "govuk-react";
import type { ApiSchemaType, ClientWellKnownType } from "../../apiTypes";
import { ApiError } from "../../apiTypes";
import { useTranslation, Trans } from "react-i18next";
import { translateApiError } from "../../utils/errorTranslation";

interface WellKnownTabProps {
    data: ApiSchemaType;
    clientWellKnownData?: ClientWellKnownType;
    clientWellKnownError?: Error;
    clientWellKnownWarnings?: ApiError[];
}

export default function WellKnownTab({
    data,
    clientWellKnownData,
    clientWellKnownError,
    clientWellKnownWarnings
}: WellKnownTabProps) {
    const { t } = useTranslation();

    const wellKnown = Object.entries(data?.WellKnownResult || {});

    return (
        <>
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

            {/* Client Well-Known Section */}
            <H2 size="SMALL">{t('federation.wellKnown.clientDiscovery.title')}</H2>
            <LeadParagraph>
                {t('federation.wellKnown.clientDiscovery.description')}
            </LeadParagraph>

            {/* Display warnings if any */}
            {clientWellKnownWarnings && clientWellKnownWarnings.length > 0 && (
                <>
                    {clientWellKnownWarnings.map((warning, index) => (
                        <WarningText key={index}>
                            <strong>{t('common.warning')}:</strong> {warning.message}
                        </WarningText>
                    ))}
                </>
            )}

            {clientWellKnownData ? (
                <div style={{ overflowX: "auto", width: "100%" }}>
                    <Table>
                        <Table.Row>
                            <Table.CellHeader>{t('federation.wellKnown.clientDiscovery.property')}</Table.CellHeader>
                            <Table.CellHeader>{t('federation.wellKnown.clientDiscovery.value')}</Table.CellHeader>
                        </Table.Row>
                        <Table.Row>
                            <Table.CellHeader>{t('federation.wellKnown.clientDiscovery.homeserverBaseUrl')}</Table.CellHeader>
                            <Table.Cell>
                                <code>{clientWellKnownData["m.homeserver"]?.base_url || t('federation.wellKnown.clientDiscovery.notSpecified')}</code>
                            </Table.Cell>
                        </Table.Row>
                        {clientWellKnownData["m.identity_server"] && (
                            <Table.Row>
                                <Table.CellHeader>{t('federation.wellKnown.clientDiscovery.identityServerBaseUrl')}</Table.CellHeader>
                                <Table.Cell>
                                    <code>{clientWellKnownData["m.identity_server"].base_url}</code>
                                </Table.Cell>
                            </Table.Row>
                        )}
                        {clientWellKnownData["m.tile_server"] && (
                            <Table.Row>
                                <Table.CellHeader>{t('federation.wellKnown.clientDiscovery.tileServerMapStyleUrl')}</Table.CellHeader>
                                <Table.Cell>
                                    <code>{clientWellKnownData["m.tile_server"].map_style_url}</code>
                                </Table.Cell>
                            </Table.Row>
                        )}
                        {/* Display any additional fields */}
                        {Object.entries(clientWellKnownData)
                            .filter(([key]) => !key.startsWith('m.homeserver') && !key.startsWith('m.identity_server') && !key.startsWith('m.tile_server'))
                            .map(([key, value]) => (
                                <Table.Row key={key}>
                                    <Table.CellHeader>
                                        {key} <Tag tint="BLUE" color="black">{t('federation.wellKnown.clientDiscovery.custom')}</Tag>
                                    </Table.CellHeader>
                                    <Table.Cell>
                                        <code>{JSON.stringify(value)}</code>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        }
                    </Table>
                </div>
            ) : clientWellKnownError ? (
                // Check if this is a warning error (like Content-Type issues)
                clientWellKnownError instanceof ApiError && clientWellKnownError.isWarning ? (
                    <WarningText>
                        {t('federation.wellKnown.errors.failedToFetchClientWellKnown')}<br />
                        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{translateApiError(clientWellKnownError, t)}</pre>
                    </WarningText>
                ) : (
                    <ErrorText>
                        {t('federation.wellKnown.errors.failedToFetchClientWellKnown')}<br />
                        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{translateApiError(clientWellKnownError, t)}</pre>
                    </ErrorText>
                )
            ) : (
                <LoadingBox loading={true}>
                    <p>{t('federation.wellKnown.errors.loadingClientWellKnown')}</p>
                </LoadingBox>
            )}
        </>
    );
}
