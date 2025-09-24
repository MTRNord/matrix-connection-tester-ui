import { useCallback, useState } from "react";
import type { components } from "../../../api/api";
import { flattenCards } from "./utils";
import { PipelineStage } from "./PipelineStage";
import "./DiscoveryPipeline.scss";
import type { CardData } from "./types";
import { useTranslation } from "react-i18next";
import { H1, LeadParagraph } from "govuk-react";

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
    console.log("Calculating lines for", allCards.length, "cards", { allCards });

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

export default function DiscoveryPipeline({ data }: { data: Root }) {
    const [lines, setLines] = useState<Line[] | undefined>(undefined);
    const { t } = useTranslation();

    const rootCard: CardData = {
        id: "input-card",
        label: t("federation.discoverypipeline.input_validation", "Input validation"),
        subtitle: t("federation.discoverypipeline.input_description", "This checks validity of the given server_name"),
        status: data.Error ? "fail" : "ok",
        children: []
    };

    const wkCard: CardData = {
        id: "wellknown-card",
        label: t("federation.discoverypipeline.wellknown_results", "Well-Known Results"),
        subtitle: t("federation.discoverypipeline.wellknown_description", "This is Step 3.1 of the Matrix Spec"),
        children: [],
        content: Object.keys(data.WellKnownResult)?.map((host) => {
            const wk = data.WellKnownResult?.[host];
            return {
                name: host,
                status: wk?.Error ? "fail" : "ok",
            }
        }) || [],
    }
    const srvCard: CardData = {
        id: "srv-card",
        label: t("federation.discoverypipeline.srv_results", "SRV Results"),
        status: data.DNSResult?.SRVSkipped ? "ok" : (data.DNSResult?.SrvTargets && Object.keys(data.DNSResult?.SrvTargets).length > 0) ? (data.FederationOK ? "ok" : "warn") : "warn",
        subtitle: t("federation.discoverypipeline.dns_description", "These are steps 3.2 to 3.5 of the Matrix Spec"),
        children: [],
        content: Object.keys(data.DNSResult?.SrvTargets || []).flatMap((host) => {
            const srv = data.DNSResult?.SrvTargets?.[host];
            return srv?.map((target) => {
                return {
                    name: (target.Priority !== undefined && target.Weight !== undefined) ? `${target.Target}:${target.Port} (priority ${target.Priority}, weight ${target.Weight})` : `${target.Target}:${target.Port}`,
                }
            }) || [];
        }) || [],
    }

    const federationCard: CardData = {
        id: "federation-card",
        label: t("federation.discoverypipeline.federation_result", "Federation Result"),
        subtitle: t("federation.discoverypipeline.federation_description", "This checks validity of the versions endpoint and the server keys"),
        status: data.FederationOK ? "ok" : "fail",
        children: []
    };
    rootCard.children = [wkCard];
    wkCard.children = [srvCard];
    srvCard.children = [federationCard];


    const stages: CardData[][] = [];
    const assignLevel = (card: CardData, depth: number) => {
        if (!stages[depth]) stages[depth] = [];
        if (!stages[depth].includes(card)) stages[depth].push(card);
        for (const child of card.children || []) {
            assignLevel(child, depth + 1);
        }
    };
    assignLevel(rootCard, 0);

    const flatCards = flattenCards(rootCard);

    // Callback ref to measure and update lines
    const containerRef = useCallback((node: HTMLDivElement | null) => {
        const id = requestAnimationFrame(() => {
            if (node && lines?.length !== flatCards.length - 1) {
                const containerRect = node.getBoundingClientRect();
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
                setLines(calculateLines(flatCards, node));
            };
        });
        return () => cancelAnimationFrame(id);
    }, [flatCards, lines]);

    return (
        <>
            <H1>{t('federation.discoverypipeline.title', "Discovery Pipeline")}</H1>

            <LeadParagraph>
                {t('federation.discoverypipeline.description', "Shows the steps taken to discover and connect to the server, along with their results. (This currently only works for the well-known path)")}
            </LeadParagraph>

            <div className="pipeline-vertical" ref={containerRef}>
                <svg className="pipeline-arrows">
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
        </>
    );
}
