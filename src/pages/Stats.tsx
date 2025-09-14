import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Data, Layout } from 'plotly.js';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { getMetrics } from '../api';
import { parsePrometheusText, getMetricSamples } from '../utils/prometheus';
import { ErrorSummary, LoadingBox, H1, Paragraph, SectionBreak, H2, H3 } from 'govuk-react';

const fetcher = async () => {
    const text = await getMetrics();
    return parsePrometheusText(text);
};

// Accessible colour palette (WCAG friendly high contrast) – sourced from GOV.UK and ColorBrewer-like sets
const PALETTE = ['#1d70b8', '#00703c', '#d4351c', '#6f72af', '#ffdd00', '#b58840', '#912b88'];

function StatsPage() {
    const { t } = useTranslation();
    const { data, error, isLoading } = useSWR('metrics', fetcher, { refreshInterval: 60_000 });

    const familyMetric = useMemo(() => data ? getMetricSamples(data, 'federation_request_family_total') : [], [data]);

    // Build a map of family -> versions counts using per-server metrics (success + failure aggregated)
    const versionMetrics = useMemo(() => data ? getMetricSamples(data, 'federation_request_total') : [], [data]);

    const topFamilies = useMemo(() => {
        const entries = familyMetric
            .map(s => ({ family: s.labels.software_family || 'unknown', value: s.value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 3);
        return entries.map(e => e.family);
    }, [familyMetric]);

    interface VersionDist { family: string; versions: Record<string, number>; }
    const versionDistributions: VersionDist[] = useMemo(() => {
        if (!topFamilies.length || !versionMetrics.length) return [];
        const acc: Record<string, Record<string, number>> = {};
        for (const sample of versionMetrics) {
            const family = sample.labels.software_family || 'unknown';
            if (!topFamilies.includes(family)) continue;
            const version = sample.labels.software_version || 'unknown';
            // We aggregate both success & failure results, treat sample.value as count (counter semantics)
            acc[family] = acc[family] || {};
            acc[family][version] = (acc[family][version] || 0) + sample.value;
        }
        return Object.entries(acc).map(([family, versions]) => ({ family, versions }));
    }, [topFamilies, versionMetrics]);

    const chartData: Data[] | null = useMemo(() => {
        if (!familyMetric.length) return null;
        const families = familyMetric.map(s => s.labels.software_family || 'unknown');
        const values = familyMetric.map(s => s.value);
        return [
            {
                type: 'bar',
                x: families,
                y: values,
                marker: { color: families.map((_, i) => PALETTE[i % PALETTE.length]) }
            }
        ];
    }, [familyMetric]);

    if (isLoading) {
        return <LoadingBox loading>{t('federation.loading')}</LoadingBox>;
    }

    if (error) {
        return <ErrorSummary heading={t('common.error')} description={String(error)} />;
    }

    return (
        <div>
            <H1>{t('federation.statistics.title')}</H1>
            <Paragraph>{t('federation.statistics.description')}</Paragraph>
            <SectionBreak level="SMALL" visible />
            {!chartData && (
                <Paragraph>{t('federation.statistics.noData')}</Paragraph>
            )}
            {chartData && (
                <Plot
                    data={chartData}
                    layout={{
                        title: t('federation.statistics.familyChartTitle'),
                        xaxis: { title: t('federation.statistics.family'), automargin: true },
                        yaxis: { title: t('federation.statistics.count'), dtick: 1, tickformat: 'd', automargin: true },
                        margin: { t: 50, l: 60, r: 10, b: 60 },
                        autosize: true,
                        bargap: 0.2,
                        hovermode: 'closest'
                    } as Partial<Layout>}
                    style={{ width: '100%', height: '420px' }}
                    useResizeHandler
                    config={{ displaylogo: false, responsive: true }}
                />
            )}
            <SectionBreak level="SMALL" visible />
            {versionDistributions.length > 0 && (
                <>
                    <H2 style={{ fontWeight: 'bold', marginTop: '1rem' }}>{t('federation.statistics.versionShareTitle')}</H2>
                    {versionDistributions.map(dist => {
                        const versions = Object.keys(dist.versions).sort((a, b) => dist.versions[b] - dist.versions[a]);
                        const values = versions.map(v => dist.versions[v]);
                        const barColors = versions.map((_, i) => PALETTE[i % PALETTE.length]);
                        const dataTrace: Data = {
                            type: 'bar',
                            x: versions,
                            y: values,
                            marker: { color: barColors },
                        };
                        return (
                            <div key={dist.family} style={{ marginBottom: '40px' }}>
                                <H3 style={{ fontSize: '1.25rem' }}>{t('federation.statistics.versionFamilyHeading', { family: dist.family })}</H3>
                                {versions.length === 0 && (
                                    <Paragraph>{t('federation.statistics.versionNoData')}</Paragraph>
                                )}
                                {versions.length > 0 && (
                                    <Plot
                                        data={[dataTrace]}
                                        layout={{
                                            title: undefined,
                                            xaxis: { title: 'Version', automargin: true },
                                            yaxis: { title: t('federation.statistics.count'), dtick: 1, tickformat: 'd', automargin: true },
                                            margin: { t: 20, l: 60, r: 10, b: 80 },
                                            autosize: true,
                                            bargap: 0.15,
                                            hovermode: 'closest'
                                        } as Partial<Layout>}
                                        style={{ width: '100%', height: '360px' }}
                                        useResizeHandler
                                        config={{ displaylogo: false, responsive: true }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
}

export default React.memo(StatsPage);
