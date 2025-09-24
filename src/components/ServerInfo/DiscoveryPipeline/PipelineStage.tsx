import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import { PipelineCard } from "./PipelineCard";
import type { CardData, Line } from "./types";
const calculateLines = (allCards: CardData[], containerRef?: HTMLDivElement): Line[] | undefined => {
    if (!containerRef) return;

    const containerRect = containerRef.getBoundingClientRect();
    const newLines: Line[] = [];

    for (const from of allCards) {
        for (const to of from.children || []) {
            const fromEl = document.getElementById(from.id);
            const toEl = document.getElementById(to.id);
            console.log("From", from.id, fromEl, "to", to.id, toEl);
            if (!fromEl || !toEl) return;

            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();

            // compute start/end at bottom/top edges
            const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
            const y1 = fromRect.bottom - containerRect.top;
            const x2 = toRect.left + toRect.width / 2 - containerRect.left;
            const y2 = toRect.top - containerRect.top;

            newLines.push({
                key: `${from.id}-${to.id}`,
                x1,
                y1,
                x2,
                y2,
            });
        }
    }
    return newLines;
}

export function PipelineStage({ stage, containerRef, setLines, flatCards }: { stage: CardData[], containerRef: RefObject<HTMLDivElement | null>, setLines: Dispatch<SetStateAction<Line[] | undefined>>, flatCards: CardData[] }) {
    // Callback ref to measure and update lines
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cards = useCallback((_node: HTMLDivElement | null) => {
        const id = requestAnimationFrame(() => {
            if (containerRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const pos: Record<string, { x: number; y: number; width: number; height: number }> = {};
                for (const card of flatCards) {
                    const el = document.getElementById(card.id);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        pos[card.id] = {
                            x: rect.left + rect.width / 2 - containerRect.left,
                            y: rect.top + rect.height / 2 - containerRect.top,
                            width: rect.width,
                            height: rect.height,
                        };
                    }
                }
                setLines(calculateLines(flatCards, containerRef.current));
            };
        });
        return () => cancelAnimationFrame(id);
    }, [containerRef, flatCards, setLines]);


    return (
        <div className="stage">
            <div className="stage-cards" ref={cards}>{stage.map((card) => <PipelineCard key={card.id} card={card} />)}</div>
        </div>
    );
}
