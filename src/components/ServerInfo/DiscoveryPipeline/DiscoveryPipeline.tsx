import { useState } from "react";
import type { components } from "../../../api/api";
import { flattenCards } from "./utils";
import { PipelineStage } from "./PipelineStage";
import "./DiscoveryPipeline.scss";
import type { CardData } from "./types";

type Root = components["schemas"]["Root"];

interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    key: string;
}

const calculateLines = (allCards: CardData[], containerRef?: HTMLDivElement): Line[] | undefined => {
    if (!containerRef) return;

    const containerRect = containerRef.getBoundingClientRect();
    const newLines: Line[] = [];

    for (const from of allCards) {
        for (const to of from.children || []) {
            const fromEl = document.getElementById(from.id);
            const toEl = document.getElementById(to.id);
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

export default function DiscoveryPipeline({ data }: { data: Root }) {

    const [lines, setLines] = useState<Line[] | undefined>(undefined);



    // === Build tree ===
    const federationCard: CardData = { id: "federation", label: "Federation Result", status: data.FederationOK ? "ok" : "fail", children: [] };
    const rootCard: CardData = {
        id: "input",
        label: "Input Validation",
        status: data.Error ? "fail" : "ok",
        content: data.Version.name,
        children: []
    };


    const dnsCards: CardData[] = data.DNSResult?.Addrs?.map((addr) => ({ id: `dns-${addr}`, label: addr, status: "ok", children: [] })) || [];
    rootCard.children = dnsCards;

    dnsCards.forEach((dns) => {
        const host = dns.label;
        const wk = data.WellKnownResult?.[host];

        const wkCard: CardData = {
            id: `wk-${host}`,
            label: host,
            status: wk?.Error ? "fail" : "ok",
            content: wk?.Error ? wk.Error.Error : wk?.["m.server"],
            children: [],
        };
        dns.children!.push(wkCard);

        // Always create a connection card if either report or error exists
        const report = data.ConnectionReports?.[host];
        const error = data.ConnectionErrors?.[host];

        if (report || error) {
            const connCard: CardData = {
                id: `conn-${host}`,
                label: host,
                status: report
                    ? report.Checks.AllChecksOK ? "ok" : "fail"
                    : "fail",
                content: report
                    ? `${report.Version.name} ${report.Version.version}`
                    : error?.Error,
                children: [federationCard], // attach federation at the end
            };
            wkCard.children!.push(connCard);
        } else {
            // if neither exists, still attach federationCard
            wkCard.children!.push(federationCard);
        }
    });


    const stages: CardData[][] = [];
    const assignLevel = (card: CardData, depth: number) => {
        if (!stages[depth]) stages[depth] = [];
        if (!stages[depth].includes(card)) stages[depth].push(card);
        card.children?.forEach((child: CardData) => assignLevel(child, depth + 1));
    };
    assignLevel(rootCard, 0);

    const flatCards = flattenCards(rootCard);

    // Callback ref to measure and update lines
    const containerRef = (node: HTMLDivElement | null) => {
        if (node) {
            const containerRect = node.getBoundingClientRect();
            const pos: Record<string, { x: number; y: number; width: number; height: number }> = {};
            flatCards.forEach((card: CardData) => {
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
            });
            setLines(calculateLines(flatCards, node));
        };
    }

    return (
        <div className="pipeline-wrapper">
            <div className="pipeline-vertical" ref={containerRef}>
                <svg className="pipeline-arrows" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="6"
                            markerHeight="6"
                            refX="5"
                            refY="3"
                            orient="auto"
                        >
                            <polygon points="0 0, 6 3, 0 6" fill="#505a5f" />
                        </marker>
                    </defs>
                    {lines?.map((line) => (
                        <polyline
                            key={line.key}
                            points={`${line.x1},${line.y1} ${line.x1},${(line.y1 + line.y2) / 2} ${line.x2},${(line.y1 + line.y2) / 2} ${line.x2},${line.y2}`}
                            stroke="#505a5f"
                            strokeWidth={1.5}
                            fill="none"
                            markerEnd="url(#arrowhead)"
                        />
                    ))}
                </svg>
                {stages.map((stage, i) => <PipelineStage key={i} stage={stage} />)}
            </div>
        </div>
    );
}
