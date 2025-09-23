import { PipelineCard } from "./PipelineCard";
import type { CardData } from "./types";

export function PipelineStage({ stage }: { stage: CardData[] }) {
    return (
        <div className="stage">
            <div className="stage-cards">{stage.map((card) => <PipelineCard key={card.id} card={card} />)}</div>
        </div>
    );
}
