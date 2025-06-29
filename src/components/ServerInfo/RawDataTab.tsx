import { H2, LoadingBox, ErrorText, LeadParagraph, Details } from "govuk-react";
import type { ApiSchemaType, ClientWellKnownType, ClientServerVersionsType } from "../../apiTypes";
import { useTranslation } from "react-i18next";
import { translateApiError } from "../../utils/errorTranslation";

interface RawDataTabProps {
    data: ApiSchemaType;
    clientWellKnownData?: ClientWellKnownType;
    clientWellKnownError?: Error;
    clientServerVersionsData?: ClientServerVersionsType;
    clientServerVersionsError?: Error;
}

export default function RawDataTab({
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
                    {t('federation.raw.errors.failedToFetchClientWellKnown')}<br />
                    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{translateApiError(clientWellKnownError, t)}</pre>
                </ErrorText>
            ) : (
                <LoadingBox loading={true}>
                    <p>{t('federation.raw.errors.loadingClientWellKnown')}</p>
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
                    {t('federation.raw.errors.failedToFetchClientServerVersions')}<br />
                    <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{translateApiError(clientServerVersionsError, t)}</pre>
                </ErrorText>
            ) : (
                <LoadingBox loading={true}>
                    <p>{t('federation.raw.errors.loadingClientServerVersions')}</p>
                </LoadingBox>
            )}
        </>
    );
}
