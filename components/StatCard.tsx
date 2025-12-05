import type { ComponentChildren } from "preact";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    period: string;
  };
  suffix?: string;
  highlight?: boolean;
  children?: ComponentChildren;
}

export default function StatCard({
  title,
  value,
  description,
  trend,
  suffix,
  highlight = false,
  children,
}: StatCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === "number") {
      // Format large numbers with commas
      return val.toLocaleString("en-GB");
    }
    return val;
  };

  const getTrendClass = (trendValue: number): string => {
    if (trendValue > 0) return "stat-card__trend--positive";
    if (trendValue < 0) return "stat-card__trend--negative";
    return "stat-card__trend--neutral";
  };

  const getTrendSymbol = (trendValue: number): string => {
    if (trendValue > 0) return "↑";
    if (trendValue < 0) return "↓";
    return "→";
  };

  const cardClass = highlight ? "stat-card stat-card--highlight" : "stat-card";

  return (
    <div class={cardClass}>
      <div class="stat-card__content">
        <h3 class="stat-card__title">{title}</h3>
        <p class="stat-card__value">
          <span class="stat-card__number">{formatValue(value)}</span>
          {suffix && <span class="stat-card__suffix">{suffix}</span>}
        </p>
        {description && (
          <p class="govuk-body-s stat-card__description">{description}</p>
        )}
        {trend && (
          <p class={`stat-card__trend ${getTrendClass(trend.value)}`}>
            <span class="stat-card__trend-symbol">
              {getTrendSymbol(trend.value)}
            </span>
            <span class="stat-card__trend-value">
              {Math.abs(trend.value).toFixed(1)}%
            </span>
            <span class="stat-card__trend-period">{trend.period}</span>
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
