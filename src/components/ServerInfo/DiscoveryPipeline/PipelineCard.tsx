import { ListItem, SectionBreak, Tag, UnorderedList } from "govuk-react";
import type { CardData, Status } from "./types";
import { useTranslation } from "react-i18next";

export function StatusTag({ status }: { status: Status }) {
    const { t } = useTranslation();
    switch (status) {
        case "ok": return <Tag tint="GREEN">{t("common.ok")}</Tag>;
        case "fail": return <Tag tint="RED">{t("common.error")}</Tag>;
        case "warn": return <Tag tint="YELLOW">{t("common.warning")}</Tag>;
    }
}

export function PipelineCard({ card }: { card: CardData }) {
    return (
        <div className="stage-card" id={card.id}>
            <div className="stage-card-header">
                <span>{card.label}</span>
                {card.status && <StatusTag status={card.status} />}
            </div>
            {card.subtitle && (
                <div className="stage-card-subtitle">
                    {card.subtitle}
                </div>
            )}
            {card.content && (
                <>
                    <SectionBreak
                        level="LARGE"
                        visible
                    />
                    <UnorderedList>
                        {card.content?.map((thing) => {
                            return (
                                <ListItem key={thing.name}>
                                    <span>{thing.name}</span>&nbsp;
                                    {thing.status && <StatusTag status={thing.status} />}
                                </ListItem>
                            )
                        })}
                    </UnorderedList>
                </>
            )}
        </div>
    );
}
