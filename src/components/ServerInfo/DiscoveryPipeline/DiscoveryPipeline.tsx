import { useRef, useState } from "react";
import type { components } from "../../../api/api";
import { flattenCards } from "./utils";
import { PipelineStage } from "./PipelineStage";
import "./DiscoveryPipeline.scss";
import type { CardData, Line } from "./types";
import { useTranslation } from "react-i18next";
import { H1, LeadParagraph } from "govuk-react";

type Root = components["schemas"]["Root"];

export default function DiscoveryPipeline({ data }: { data: Root }) {
    const [lines, setLines] = useState<Line[] | undefined>(undefined);
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);

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

    const srvCardContent = Object.keys(data.DNSResult?.SrvTargets || []).flatMap((host) => {
        const srv = data.DNSResult?.SrvTargets?.[host];
        return srv?.map((target) => {
            return {
                name: (target.Priority !== undefined && target.Weight !== undefined) ? `${target.Target}:${target.Port} (priority ${target.Priority}, weight ${target.Weight})` : `${target.Target}:${target.Port}`,
            }
        }) ?? [];
    });

    const srvCard: CardData = {
        id: "srv-card",
        label: t("federation.discoverypipeline.srv_results", "SRV Results"),
        status: data.DNSResult?.SRVSkipped ? (Object.keys(data.WellKnownResult).some((host) => {
            const wk = data.WellKnownResult?.[host];
            return wk?.Error;
        }) ? "fail" : "ok") : (data.DNSResult?.SrvTargets && Object.keys(data.DNSResult?.SrvTargets).length > 0) ? (data.FederationOK ? "ok" : "warn") : "warn",
        subtitle: t("federation.discoverypipeline.dns_description", "These are steps 3.2 to 3.5 of the Matrix Spec"),
        children: [],
        content: srvCardContent.length > 0 ? srvCardContent : undefined,
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
                {stages.map((stage, i) => <PipelineStage key={i} stage={stage} flatCards={flatCards} setLines={setLines} containerRef={containerRef} />)}
            </div>
        </>
    );
}
