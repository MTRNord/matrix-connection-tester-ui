import useSWR from "swr";
import { fetchSupportInfo } from "./api";
import type { SupportWellKnownType } from "./apiTypes";
import { H2, Table, Tag, Link, HintText, LoadingBox, Paragraph, ErrorText } from "govuk-react";

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
    const { data, error, isLoading, isValidating } = useSWR<SupportWellKnownType>(
        serverName ? ['support', serverName] : null,
        () => fetchSupportInfo(serverName),
        { keepPreviousData: false }
    );

    if (isLoading && !data) {
        return (
            <LoadingBox loading={true}>
                <p>⌛ Getting support info…</p>
            </LoadingBox>
        );
    }

    if (error || !data || (!data.contacts && !data.support_page)) {
        return (
            <>
                <H2>Support Contacts</H2>
                <Tag backgroundColor="#b1b4b6" color="black">No support information published</Tag>
                <HintText>
                    If you are the server administrator, please consider publishing your support contacts in
                    <code>.well-known/matrix/support</code> to help users find assistance
                    <br /><br />
                    If you believe this is an error, please check the server configuration or contact the server administrator.
                    <br /><br />
                    {error && <ErrorText>{linkify(error.message)}</ErrorText>}
                </HintText>
            </>
        );
    }

    return (
        <div>
            {/* eslint-disable-next-line no-constant-binary-expression -- This seems to be overly jumpy*/}
            {isValidating && false && (
                <LoadingBox loading={true}>
                    <Paragraph supportingText>Refreshing support info…</Paragraph>
                </LoadingBox>
            )}
            <H2>Support Contacts</H2>
            {data.contacts && data.contacts.length > 0 ? (
                <Table>
                    <Table.Row>
                        <Table.CellHeader>Role</Table.CellHeader>
                        <Table.CellHeader>Email</Table.CellHeader>
                        <Table.CellHeader>Matrix ID</Table.CellHeader>
                    </Table.Row>
                    {data.contacts.map((contact, idx) => (
                        <Table.Row key={idx}>
                            <Table.Cell>
                                {contact.role === "m.role.admin" ? "Admin" : contact.role === "m.role.security" ? "Security" : contact.role}
                            </Table.Cell>
                            <Table.Cell>
                                {contact.email_address ? (
                                    <Link href={`mailto:${contact.email_address}`}>{contact.email_address}</Link>
                                ) : (
                                    <Tag style={{ paddingRight: 8 }} backgroundColor="#b1b4b6" color="black">N/A</Tag>
                                )}
                            </Table.Cell>
                            <Table.Cell>
                                {contact.matrix_id ? (
                                    <code>{contact.matrix_id}</code>
                                ) : (
                                    <Tag style={{ paddingRight: 8 }} backgroundColor="#b1b4b6" color="black">N/A</Tag>
                                )}
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table>
            ) : (
                <Tag backgroundColor="#b1b4b6" color="black">No contacts published</Tag>

            )}

            {data.support_page && (
                <Paragraph>
                    {`**Support Page:** [${data.support_page}](${data.support_page})`}
                </Paragraph>
            )}
        </div>
    );
}