import { Tag } from "govuk-react";
import type { CardData, Status } from "./types";

export function StatusTag({ status }: { status: Status }) {
    switch (status) {
        case "ok": return <Tag tint="GREEN">OK</Tag>;
        case "fail": return <Tag tint="RED">Fail</Tag>;
        case "warn": return <Tag tint="YELLOW">Warn</Tag>;
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
