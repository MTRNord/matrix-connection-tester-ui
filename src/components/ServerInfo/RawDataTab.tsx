import { H2, LoadingBox, ErrorText, LeadParagraph, Details } from "govuk-react";
import type { ClientWellKnownType, ClientServerVersionsType } from "../../apiTypes";
import { useTranslation } from "react-i18next";
import { translateApiError } from "../../utils/errorTranslation";
import type { components } from "../../api/api";
import React from "react";

interface RawDataTabProps {
    data: components["schemas"]["Root"];
    clientWellKnownData?: ClientWellKnownType;
    clientWellKnownError?: Error;
    clientServerVersionsData?: ClientServerVersionsType;
    clientServerVersionsError?: Error;
}

function RawDataTab({
    data,
    clientWellKnownData,
    clientWellKnownError,
    clientServerVersionsData,
    clientServerVersionsError
}: RawDataTabProps) {
    const { t } = useTranslation();

    return (
        <>
            <H2>{t('federation.raw.title')}</H2>
            <LeadParagraph>
                {t('federation.raw.description')}
            </LeadParagraph>

            {/* Federation Data (Server-side) */}
            <H2 size="SMALL">{t('federation.raw.federationData.title')}</H2>
            <Details summary={t('federation.raw.federationData.showRaw')}>
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
            </Details>

            {/* Client Well-Known Data */}
            <H2 size="SMALL">{t('federation.raw.clientWellKnownData.title')}</H2>
            {clientWellKnownData ? (
                <Details summary={t('federation.raw.clientWellKnownData.showRaw')}>
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
                        {JSON.stringify(clientWellKnownData, null, 2)}
                    </pre>
                </Details>
            ) : clientWellKnownError ? (
                <ErrorText>
                    {t('serverInfo.errors.failedToFetchClientWellKnown')}<br />
                    <div
                        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                        dangerouslySetInnerHTML={{ __html: translateApiError(clientWellKnownError, t) }}
                    />
                </ErrorText>
            ) : (
                <LoadingBox loading={true}>
                    <p>{t('serverInfo.errors.loadingClientWellKnown')}</p>
                </LoadingBox>
            )}

            {/* Client Server Versions Data */}
            <H2 size="SMALL">{t('federation.raw.clientServerVersions.title')}</H2>
            {clientServerVersionsData ? (
                <Details summary={t('federation.raw.clientServerVersions.showRaw')}>
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
                        {JSON.stringify(clientServerVersionsData, null, 2)}
                    </pre>
                </Details>
            ) : clientServerVersionsError ? (
                <ErrorText>
                    {t('serverInfo.errors.failedToFetchClientServerVersions')}<br />
                    <div
                        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                        dangerouslySetInnerHTML={{ __html: translateApiError(clientServerVersionsError, t) }}
                    />
                </ErrorText>
            ) : (
                <LoadingBox loading={true}>
                    <p>{t('serverInfo.errors.loadingClientServerVersions')}</p>
                </LoadingBox>
            )}
        </>
    );
}

export default React.memo(RawDataTab);