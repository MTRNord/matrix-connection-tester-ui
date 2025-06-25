import useSWR from "swr";
import { fetchSupportInfo } from "./api";
import type { SupportWellKnownType } from "./apiTypes";
import { H2, Table, Tag, Link, HintText, LoadingBox, Paragraph, ErrorText, LeadParagraph } from "govuk-react";
import { useTranslation, Trans } from "react-i18next";
import { translateApiError } from "./utils/errorTranslation";

function linkify(text: string) {
    // Simple URL regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) =>
        urlRegex.test(part) ? (
            <Link key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</Link>
        ) : (
            part
        )
    );
}


export default function SupportInfo({ serverName }: { serverName: string }) {
    const { t } = useTranslation();
    const { data, error, isLoading, isValidating } = useSWR<SupportWellKnownType>(
        serverName ? ['support', serverName] : null,
        () => fetchSupportInfo(serverName),
        { keepPreviousData: false }
    );

    if (isLoading && !data) {
        return (
            <LoadingBox loading={true}>
                <p>{t('support.loading')}</p>
            </LoadingBox>
        );
    }

    if (error || !data || (!data.contacts && !data.support_page)) {
        return (
            <>
                <H2>{t('support.title')}</H2>
                <Tag tint="GREY" color="black">{t('support.noSupportPublished')}</Tag>
                <HintText>
                    <Trans i18nKey="support.adminHint" components={{ code: <code /> }} />
                    <br /><br />
                    {t('support.errorHint')}
                    <br /><br />
                    {error && <ErrorText>{linkify(translateApiError(error, t))}</ErrorText>}
                </HintText>
            </>
        );
    }

    return (
        <div>
            {/* eslint-disable-next-line no-constant-binary-expression -- This seems to be overly jumpy*/}
            {isValidating && false && (
                <LoadingBox loading={true}>
                    <Paragraph supportingText>{t('support.refreshing')}</Paragraph>
                </LoadingBox>
            )}
            <H2>{t('support.title')}</H2>
            <LeadParagraph>
                <Trans i18nKey="support.description" components={{ code: <code /> }} />
            </LeadParagraph>

            {data.contacts && data.contacts.length > 0 ? (
                <div style={{ overflowX: "auto", width: "100%" }}>
                    <Table>
                        <Table.Row>
                            <Table.CellHeader>{t('support.table.role')}</Table.CellHeader>
                            <Table.CellHeader>{t('support.table.email')}</Table.CellHeader>
                            <Table.CellHeader>{t('support.table.matrixId')}</Table.CellHeader>
                        </Table.Row>
                        {data.contacts.map((contact, idx) => (
                            <Table.Row key={idx}>
                                <Table.Cell>
                                    {contact.role === "m.role.admin" ? t('support.roles.admin') :
                                        contact.role === "m.role.security" ? t('support.roles.security') :
                                            contact.role}
                                </Table.Cell>
                                <Table.Cell>
                                    {contact.email_address ? (
                                        <Link href={`mailto:${contact.email_address}`}>{contact.email_address}</Link>
                                    ) : (
                                        <Tag style={{ paddingRight: 8 }} tint="GREY" color="black">{t('common.na')}</Tag>
                                    )}
                                </Table.Cell>
                                <Table.Cell>
                                    {contact.matrix_id ? (
                                        <code>{contact.matrix_id}</code>
                                    ) : (
                                        <Tag style={{ paddingRight: 8 }} tint="GREY" color="black">{t('common.na')}</Tag>
                                    )}
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table>
                </div>
            ) : (
                <Tag tint="GREY" color="black">{t('support.noContactsPublished')}</Tag>

            )}

            {data.support_page && (
                <Paragraph>
                    {`**${t('support.supportPage')}** [${data.support_page}](${data.support_page})`}
                </Paragraph>
            )}
        </div>
    );
}