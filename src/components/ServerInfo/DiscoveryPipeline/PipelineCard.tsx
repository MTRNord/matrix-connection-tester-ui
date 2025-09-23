import { Tag } from "govuk-react";
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
                <StatusTag status={card.status} />
            </div>
            {card.content && <div className="stage-card-body">{card.content}</div>}
        </div>
    );
}
