import { getMetricSamples } from '../utils/prometheus';
import type { PrometheusParseResult } from '../utils/prometheus';

export interface FamilyData {
    family: string;
    value: number;
}

export interface FeatureData {
    feature: string;
    count: number;
}

export interface VersionData {
    family: string;
    versions: Record<string, number>;
}

export function getFamilyData(data: PrometheusParseResult | null): FamilyData[] {
    if (!data || !data.metrics) return [];
    return getMetricSamples(data, 'federation_request_family_total')
        .map(s => ({ family: s.labels.software_family || 'unknown', value: s.value }))
        .sort((a, b) => b.value - a.value);
}

export function getEnabledFeatures(data: PrometheusParseResult | null): FeatureData[] {
    if (!data || !data.metrics) return [];
    return getMetricSamples(data, 'federation_unstable_feature_enabled_servers')
        .map(s => ({ feature: s.labels.feature || 'unknown', count: s.value }))
        .sort((a, b) => a.feature.localeCompare(b.feature));
}

export function getAnnouncedFeatures(data: PrometheusParseResult | null): FeatureData[] {
    if (!data || !data.metrics) return [];
    return getMetricSamples(data, 'federation_unstable_feature_announced_servers')
        .map(s => ({ feature: s.labels.feature || 'unknown', count: s.value }))
        .sort((a, b) => a.feature.localeCompare(b.feature));
}

export function getVersionDistributions(data: PrometheusParseResult | null, topFamilies: string[]): VersionData[] {
    if (!data || !data.metrics) return [];
    const versionMetrics = getMetricSamples(data, 'federation_request_total');
    return topFamilies.map(fam => {
        const versions: Record<string, number> = {};
        for (const s of versionMetrics) {
            if ((s.labels.software_family || 'unknown') === fam) {
                const v = s.labels.software_version || 'unknown';
                versions[v] = (versions[v] || 0) + s.value;
            }
        }
        return { family: fam, versions };
    });
}
