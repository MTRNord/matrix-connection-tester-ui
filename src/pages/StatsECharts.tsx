import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
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

// GOV.UK design system styling for ECharts
const GOV_UK_ECHARTS_STYLE = {
    textStyle: {
        fontFamily: '"GDS Transport", arial, sans-serif',
        color: '#0b0c0c'
    },
    backgroundColor: '#ffffff',
    grid: {
        borderColor: '#b1b4b6',
        borderWidth: 1
    },
    xAxis: {
        nameLocation: 'middle' as "middle",
        axisLine: { lineStyle: { color: '#b1b4b6' } },
        axisTick: { lineStyle: { color: '#b1b4b6' } },
        splitLine: { lineStyle: { color: '#b1b4b6', width: 1 } }
    },
    yAxis: {
        axisLine: { lineStyle: { color: '#b1b4b6' } },
        axisTick: { lineStyle: { color: '#b1b4b6' } },
        axisLabel: {
            formatter: (value: string) => value.length > 25 ? value.substring(0, 22) + '...' : value
        }
    }
};

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

function StatsEChartsPage() {
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

    // All enabled unstable features (stable sort: displayName asc)
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
                return a.displayName.localeCompare(b.displayName);
            });
    }, [data]);

    // All announced unstable features (stable sort: displayName asc)
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
                return a.displayName.localeCompare(b.displayName);
            });
    }, [data]);

    // ECharts options for main server family chart (horizontal bars)
    const familyChartOption: EChartsOption = useMemo(() => {
        if (!familyMetric.length) return {};
        const families = familyMetric.map(s => s.labels.software_family || 'unknown');
        const values = familyMetric.map(s => s.value);

        return {
            ...GOV_UK_ECHARTS_STYLE,
            xAxis: {
                ...GOV_UK_ECHARTS_STYLE.xAxis,
                type: 'value',
                name: t('federation.statistics.count'),
            },
            yAxis: {
                ...GOV_UK_ECHARTS_STYLE.yAxis,
                type: 'category',
                data: families.reverse(),
            },
            series: [{
                type: 'bar',
                data: values.reverse().map((value, index) => ({
                    value,
                    itemStyle: { color: PALETTE[index % PALETTE.length] }
                }))
            }],
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}'
            }
        };
    }, [familyMetric, t]);

    // ECharts options for unstable features summary (horizontal bars)
    const featuresSummaryChartOption: EChartsOption = useMemo(() => {
        return {
            ...GOV_UK_ECHARTS_STYLE,
            xAxis: {
                ...GOV_UK_ECHARTS_STYLE.xAxis,
                type: 'value',
                name: t('federation.statistics.count'),
            },
            yAxis: {
                ...GOV_UK_ECHARTS_STYLE.yAxis,
                type: 'category',
                data: [t('federation.statistics.featuresAnnounced'), t('federation.statistics.featuresEnabled')],
            },
            series: [{
                type: 'bar',
                data: [
                    { value: unstableFeaturesAnnouncedTotal, itemStyle: { color: PALETTE[1] } },
                    { value: unstableFeaturesEnabledTotal, itemStyle: { color: PALETTE[0] } }
                ]
            }],
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c}'
            }
        };
    }, [unstableFeaturesEnabledTotal, unstableFeaturesAnnouncedTotal, t]);

    // ECharts options for enabled features (horizontal bars)
    const enabledFeaturesChartOption: EChartsOption = useMemo(() => {
        if (!allEnabledFeatures.length) return {};

        return {
            ...GOV_UK_ECHARTS_STYLE,
            xAxis: {
                ...GOV_UK_ECHARTS_STYLE.xAxis,
                type: 'value',
                name: t('federation.statistics.serverCount'),
            },
            yAxis: {
                ...GOV_UK_ECHARTS_STYLE.yAxis,
                type: 'category',
                data: allEnabledFeatures.reverse().map(f => f.displayName),
            },
            series: [{
                type: 'bar',
                data: allEnabledFeatures.reverse().map((f, index) => ({
                    value: f.count,
                    itemStyle: { color: PALETTE[index % PALETTE.length] }
                }))
            }],
            tooltip: {
                trigger: 'item',
                formatter: (params: { dataIndex: number; value: number }) => {
                    const feature = allEnabledFeatures.reverse()[params.dataIndex];
                    return feature.displayName !== feature.feature
                        ? `<b>${feature.displayName}</b><br/>${feature.feature}<br/>Servers: ${params.value}`
                        : `<b>${feature.displayName}</b><br/>Servers: ${params.value}`;
                }
            }
        };
    }, [allEnabledFeatures, t]);

    // ECharts options for announced features (horizontal bars)
    const announcedFeaturesChartOption: EChartsOption = useMemo(() => {
        if (!allAnnouncedFeatures.length) return {};

        return {
            ...GOV_UK_ECHARTS_STYLE,
            xAxis: {
                ...GOV_UK_ECHARTS_STYLE.xAxis,
                type: 'value',
                name: t('federation.statistics.serverCount'),
            },
            yAxis: {
                ...GOV_UK_ECHARTS_STYLE.yAxis,
                type: 'category',
                data: allAnnouncedFeatures.reverse().map(f => f.displayName),
            },
            series: [{
                type: 'bar',
                data: allAnnouncedFeatures.reverse().map((f, index) => ({
                    value: f.count,
                    itemStyle: { color: PALETTE[index % PALETTE.length] }
                })),
            }],
            tooltip: {
                trigger: 'item',
                formatter: (params: { dataIndex: number; value: number }) => {
                    const feature = allAnnouncedFeatures.reverse()[params.dataIndex];
                    return feature.displayName !== feature.feature
                        ? `<b>${feature.displayName}</b><br/>${feature.feature}<br/>Servers: ${params.value}`
                        : `<b>${feature.displayName}</b><br/>Servers: ${params.value}`;
                }
            }
        };
    }, [allAnnouncedFeatures, t]);

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
            {!familyMetric.length && (
                <Paragraph>{t('federation.statistics.noData')}</Paragraph>
            )}
            {familyMetric.length > 0 && (
                <ReactECharts
                    option={familyChartOption}
                />
            )}
            <SectionBreak visible />

            {/* Unstable Features Section */}
            <H2>{t('federation.statistics.unstableFeaturesTitle')}</H2>

            {/* Summary: Total enabled vs announced */}
            <H3>{t('federation.statistics.unstableFeaturesSummary')}</H3>
            <ReactECharts
                option={featuresSummaryChartOption}

            />

            {/* All enabled features */}
            {allEnabledFeatures.length > 0 && (
                <>
                    <H3 >{t('federation.statistics.allEnabledFeatures')}</H3>
                    <ReactECharts
                        option={enabledFeaturesChartOption}
                        style={{ height: '600px' }}
                    />
                </>
            )}

            {/* All announced features */}
            {allAnnouncedFeatures.length > 0 && (
                <>
                    <H3>{t('federation.statistics.allAnnouncedFeatures')}</H3>
                    <ReactECharts
                        option={announcedFeaturesChartOption}
                        style={{ height: '600px' }}
                    />
                </>
            )}

            <SectionBreak visible />
            {versionDistributions.length > 0 && (
                <>
                    <H2 style={{ fontWeight: 'bold', marginTop: '1rem' }}>{t('federation.statistics.versionShareTitle')}</H2>
                    {versionDistributions.map((dist) => {
                        // Stable sort: count desc, then version asc
                        const versions = Object.keys(dist.versions).sort((a, b) => {
                            const v = dist.versions[b] - dist.versions[a];
                            if (v !== 0) return v;
                            return a.localeCompare(b);
                        });
                        const values = versions.map(v => dist.versions[v]);

                        const versionChartOption: EChartsOption = {
                            ...GOV_UK_ECHARTS_STYLE,
                            xAxis: {
                                ...GOV_UK_ECHARTS_STYLE.xAxis,
                                type: 'value',
                                name: t('federation.statistics.count'),
                            },
                            yAxis: {
                                ...GOV_UK_ECHARTS_STYLE.yAxis,
                                type: 'category',
                                data: versions,
                            },
                            series: [{
                                type: 'bar',
                                data: values.map((value, index) => ({
                                    value,
                                    itemStyle: { color: PALETTE[index % PALETTE.length] }
                                })),
                            }],
                            // @ts-expect-error -- Typescript confused
                            tooltip: {
                                trigger: 'item',
                                formatter: (params: { dataIndex: number; value: unknown }) => {
                                    const dataIndex = versions[params.dataIndex];
                                    const value = params.value;
                                    return `<b>${dataIndex}</b><br/>Servers: ${value}`;
                                }
                            }
                        };

                        return (
                            <React.Fragment key={dist.family}>
                                <H3>{t('federation.statistics.versionFamilyHeading', { family: dist.family })}</H3>
                                {versions.length === 0 && (
                                    <Paragraph>{t('federation.statistics.versionNoData')}</Paragraph>
                                )}
                                {versions.length > 0 && (
                                    <ReactECharts
                                        option={versionChartOption}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </>
            )}
        </div>
    );
}

export default React.memo(StatsEChartsPage);
