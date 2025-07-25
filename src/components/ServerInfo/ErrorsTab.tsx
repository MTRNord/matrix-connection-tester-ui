import { H2, Table, LeadParagraph } from "govuk-react";
import { useTranslation } from "react-i18next";
import type { components } from "../../api/api";
import React from "react";

interface ErrorsTabProps {
    data: components["schemas"]["Root"];
}

function ErrorsTab({ data }: ErrorsTabProps) {
    const { t } = useTranslation();

    return (
        <>
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
        </>
    );
}

export default React.memo(ErrorsTab);