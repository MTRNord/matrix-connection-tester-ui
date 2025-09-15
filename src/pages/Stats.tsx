import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Data, Layout } from 'plotly.js';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { getMetrics } from '../api';
import { parsePrometheusText, getMetricSamples } from '../utils/prometheus';
import { ErrorSummary, LoadingBox, H1, Paragraph, SectionBreak, H2, H3 } from 'govuk-react';
import unstableFeatures from '../data/unstableFeatures.json';

const fetcher = async () => {
    const text = await getMetrics();
    return parsePrometheusText(text);
};

// Accessible colour palette (WCAG friendly high contrast) – sourced from GOV.UK and ColorBrewer-like sets
const PALETTE = ['#1d70b8', '#00703c', '#d4351c', '#6f72af', '#ffdd00', '#b58840', '#912b88'];

// Type for unstable feature info
type UnstableFeatureInfo = {
    msc?: string;
    title?: string;
    description?: string;
};

// Unstable features lookup table loaded from JSON
const UNSTABLE_FEATURES: Record<string, UnstableFeatureInfo> = unstableFeatures;

// Helper function to get display name for unstable features
function getFeatureDisplayName(feature: string): string {
    const featureInfo = UNSTABLE_FEATURES[feature];
    return featureInfo?.title || feature;
}

function StatsPage() {
    const { t } = useTranslation();
    const { data, error, isLoading } = useSWR('metrics', fetcher, { refreshInterval: 60_000 });

    // Stable sort: value desc, then family name asc
    const familyMetric = useMemo(() => {
        if (!data) return [];
        const arr = getMetricSamples(data, 'federation_request_family_total');
        return arr.slice().sort((a, b) => {
            const va = b.value - a.value;
            if (va !== 0) return va;
            const fa = (a.labels.software_family || 'unknown').localeCompare(b.labels.software_family || 'unknown');
            return fa;
        });
    }, [data]);

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
        // Sort versionDistributions by the same order as familyMetric (by count desc, then name asc)
        const distributions = Object.entries(acc).map(([family, versions]) => ({ family, versions }));
        // Build a map of family to its index in familyMetric for stable sorting
        const familyOrder: Record<string, number> = {};
        familyMetric.forEach((s, idx) => {
            familyOrder[s.labels.software_family || 'unknown'] = idx;
        });
        distributions.sort((a, b) => (familyOrder[a.family] ?? 999) - (familyOrder[b.family] ?? 999));
        return distributions;
    }, [topFamilies, versionMetrics, familyMetric]);

    // Unstable features metrics
    const unstableFeaturesEnabledTotal = useMemo(() => {
        if (!data) return 0;
        const samples = getMetricSamples(data, 'federation_unstable_features_enabled_total');
        return samples.length > 0 ? samples[0].value : 0;
    }, [data]);

    const unstableFeaturesAnnouncedTotal = useMemo(() => {
        if (!data) return 0;
        const samples = getMetricSamples(data, 'federation_unstable_features_announced_total');
        return samples.length > 0 ? samples[0].value : 0;
    }, [data]);

    // All enabled unstable features (stable sort: count desc, then feature name asc)
    const allEnabledFeatures = useMemo(() => {
        if (!data) return [];
        const samples = getMetricSamples(data, 'federation_unstable_feature_enabled_servers');
        return samples
            .map(s => ({
                feature: s.labels.feature || 'unknown',
                displayName: getFeatureDisplayName(s.labels.feature || 'unknown'),
                count: s.value
            }))
            .sort((a, b) => {
                const v = b.count - a.count;
                if (v !== 0) return v;
                return a.feature.localeCompare(b.feature);
            });
    }, [data]);

    // All announced unstable features (stable sort: count desc, then feature name asc)
    const allAnnouncedFeatures = useMemo(() => {
        if (!data) return [];
        const samples = getMetricSamples(data, 'federation_unstable_feature_announced_servers');
        return samples
            .map(s => ({
                feature: s.labels.feature || 'unknown',
                displayName: getFeatureDisplayName(s.labels.feature || 'unknown'),
                count: s.value
            }))
            .sort((a, b) => {
                const v = b.count - a.count;
                if (v !== 0) return v;
                return a.feature.localeCompare(b.feature);
            });
    }, [data]);

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
            <SectionBreak visible />
            <H2>{t('federation.statistics.description')}</H2>
            {!chartData && (
                <Paragraph>{t('federation.statistics.noData')}</Paragraph>
            )}
            {chartData && (
                <Plot
                    data={chartData}
                    layout={{
                        xaxis: { title: t('federation.statistics.family'), automargin: true },
                        yaxis: { title: t('federation.statistics.count'), dtick: 1, tickformat: 'd', automargin: true },
                        margin: { t: 50, l: 60, r: 10, b: 60 },
                        autosize: true,
                        bargap: 0.2,
                        hovermode: 'closest'
                    } as Partial<Layout>}
                    style={{ width: '100%', height: '420px' }}
                    useResizeHandler
                    config={{ displaylogo: true, responsive: true }}
                />
            )}
            <SectionBreak visible />

            {/* Unstable Features Section */}
            <H2 style={{ fontWeight: 'bold', marginTop: '1rem' }}>{t('federation.statistics.unstableFeaturesTitle')}</H2>

            {/* Summary: Total enabled vs announced */}
            <div style={{ marginBottom: '40px' }}>
                <H3 style={{ fontSize: '1.25rem' }}>{t('federation.statistics.unstableFeaturesSummary')}</H3>
                <Plot
                    data={[
                        {
                            type: 'bar',
                            x: [t('federation.statistics.featuresEnabled'), t('federation.statistics.featuresAnnounced')],
                            y: [unstableFeaturesEnabledTotal, unstableFeaturesAnnouncedTotal],
                            marker: { color: [PALETTE[0], PALETTE[1]] }
                        }
                    ]}
                    layout={{
                        xaxis: { title: t('federation.statistics.featureType'), automargin: true },
                        yaxis: { title: t('federation.statistics.count'), tickformat: 'd', automargin: true },
                        margin: { t: 20, l: 60, r: 10, b: 80 },
                        autosize: true,
                        bargap: 0.2,
                        hovermode: 'closest'
                    } as Partial<Layout>}
                    style={{ width: '100%', height: '360px' }}
                    useResizeHandler
                    config={{ displaylogo: true, responsive: true }}
                />
            </div>

            {/* All enabled features */}
            {allEnabledFeatures.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <H3 style={{ fontSize: '1.25rem' }}>{t('federation.statistics.allEnabledFeatures')}</H3>
                    <Plot
                        data={[
                            {
                                type: 'bar',
                                x: allEnabledFeatures.map(f => f.displayName),
                                y: allEnabledFeatures.map(f => f.count),
                                hovertemplate: allEnabledFeatures.map(f =>
                                    f.displayName !== f.feature
                                        ? `<b>${f.displayName}</b><br>${f.feature}<br>Servers: %{y}<extra></extra>`
                                        : `<b>${f.displayName}</b><br>Servers: %{y}<extra></extra>`
                                ),
                                marker: { color: allEnabledFeatures.map((_, i) => PALETTE[i % PALETTE.length]) }
                            }
                        ]}
                        layout={{
                            xaxis: { title: t('federation.statistics.featureName'), automargin: true, tickangle: -45 },
                            yaxis: {
                                title: t('federation.statistics.serverCount'),
                                tickformat: 'd',
                                automargin: true,
                                // Smart y-axis: no forced dtick, let Plotly decide optimal spacing
                            },
                            margin: { t: 30, l: 60, r: 20, b: 180 },
                            autosize: true,
                            bargap: 0.15,
                            hovermode: 'closest'
                        } as Partial<Layout>}
                        style={{ width: '100%', height: '600px' }}
                        useResizeHandler
                        config={{ displaylogo: true, responsive: true }}
                    />
                </div>
            )}

            {/* All announced features */}
            {allAnnouncedFeatures.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <H3 style={{ fontSize: '1.25rem' }}>{t('federation.statistics.allAnnouncedFeatures')}</H3>
                    <Plot
                        data={[
                            {
                                type: 'bar',
                                x: allAnnouncedFeatures.map(f => f.displayName),
                                y: allAnnouncedFeatures.map(f => f.count),
                                hovertemplate: allAnnouncedFeatures.map(f =>
                                    f.displayName !== f.feature
                                        ? `<b>${f.displayName}</b><br>${f.feature}<br>Servers: %{y}<extra></extra>`
                                        : `<b>${f.displayName}</b><br>Servers: %{y}<extra></extra>`
                                ),
                                marker: { color: allAnnouncedFeatures.map((_, i) => PALETTE[i % PALETTE.length]) }
                            }
                        ]}
                        layout={{
                            xaxis: { title: t('federation.statistics.featureName'), automargin: true, tickangle: -45 },
                            yaxis: {
                                title: t('federation.statistics.serverCount'),
                                tickformat: 'd',
                                automargin: true,
                                // Smart y-axis: no forced dtick, let Plotly decide optimal spacing
                            },
                            margin: { t: 30, l: 60, r: 20, b: 180 },
                            autosize: true,
                            bargap: 0.15,
                            hovermode: 'closest'
                        } as Partial<Layout>}
                        style={{ width: '100%', height: '600px' }}
                        useResizeHandler
                        config={{ displaylogo: true, responsive: true }}
                    />
                </div>
            )}

            <SectionBreak visible />
            {versionDistributions.length > 0 && (
                <>
                    <H2 style={{ fontWeight: 'bold', marginTop: '1rem' }}>{t('federation.statistics.versionShareTitle')}</H2>
                    {versionDistributions.map(dist => {
                        // Stable sort: count desc, then version asc
                        const versions = Object.keys(dist.versions).sort((a, b) => {
                            const v = dist.versions[b] - dist.versions[a];
                            if (v !== 0) return v;
                            return a.localeCompare(b);
                        });
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
                                        config={{ displaylogo: true, responsive: true }}
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
