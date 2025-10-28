"use client";

import * as React from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

type HistoricalRate = {
  platform: string;
  exchange_rate: number;
  retrieved_at?: string;
  created_at?: string;
};

type ChartLineInteractiveProps = {
  data: HistoricalRate[];
};

type PlatformMeta = {
  key: string;
  platform: string;
  label: string;
};

const PLATFORM_LABELS: Record<string, string> = {
  WISE: "Wise",
  CIMB: "CIMB",
  WESTERNUNION: "Western Union",
};

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

const DISPLAY_TIME_ZONE = "Asia/Singapore";

const getPlatformKey = (platform: string) =>
  platform.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const getPlatformLabel = (platform: string) => {
  const lookup = PLATFORM_LABELS[platform.toUpperCase()];
  if (lookup) {
    return lookup;
  }

  const normalized = platform
    .toLowerCase()
    .replace(/[_\s]+/g, " ")
    .trim();

  if (!normalized) {
    return platform;
  }

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
};

const sanitizeTimestamp = (timestamp?: string) => {
  if (!timestamp) {
    return null;
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
};

const formatInDisplayTimeZone = (
  value: string,
  options: Intl.DateTimeFormatOptions
) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-SG", {
    timeZone: DISPLAY_TIME_ZONE,
    ...options,
  }).format(date);
};

const buildPlatformMeta = (data: HistoricalRate[]): PlatformMeta[] => {
  const byPlatform = new Map<string, PlatformMeta>();

  data.forEach(({ platform }) => {
    if (!platform) {
      return;
    }

    const key = getPlatformKey(platform);
    if (byPlatform.has(key)) {
      return;
    }

    byPlatform.set(key, {
      key,
      platform,
      label: getPlatformLabel(platform),
    });
  });

  return Array.from(byPlatform.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
};

const buildChartData = (data: HistoricalRate[], platforms: PlatformMeta[]) => {
  if (data.length === 0 || platforms.length === 0) {
    return [];
  }

  const buckets = new Map<string, Record<string, number | string>>();
  const platformKeys = new Set(platforms.map((platform) => platform.key));

  for (const rate of data) {
    const iso = sanitizeTimestamp(rate.created_at || rate.retrieved_at);
    if (!iso) {
      continue;
    }

    const key = getPlatformKey(rate.platform);
    if (!platformKeys.has(key)) {
      continue;
    }

    const bucket = buckets.get(iso) ?? { date: iso };
    bucket[key] = rate.exchange_rate;
    buckets.set(iso, bucket);
  }

  return Array.from(buckets.entries())
    .sort(
      ([timestampA], [timestampB]) =>
        new Date(timestampA).getTime() - new Date(timestampB).getTime()
    )
    .map(([, value]) => value);
};

type TimeRange = "daily" | "weekly" | "monthly";

const RANGE_DEFINITIONS: Record<
  TimeRange,
  { label: string; durationMs: number; description: string }
> = {
  daily: {
    label: "Daily",
    durationMs: 24 * 60 * 60 * 1000,
    description: "24 hours",
  },
  weekly: {
    label: "Weekly",
    durationMs: 7 * 24 * 60 * 60 * 1000,
    description: "7 days",
  },
  monthly: {
    label: "Monthly",
    durationMs: 31 * 24 * 60 * 60 * 1000,
    description: "31 days",
  },
};

export function ChartLineInteractive({ data }: ChartLineInteractiveProps) {
  const platforms = React.useMemo(() => buildPlatformMeta(data), [data]);
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      views: {
        label: "Exchange Rate",
      },
    };

    platforms.forEach((platform, index) => {
      config[platform.key] = {
        label: platform.label,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });

    return config;
  }, [platforms]);

  const chartData = React.useMemo(
    () => buildChartData(data, platforms),
    [data, platforms]
  );

  const [activeRange, setActiveRange] = React.useState<TimeRange>("daily");

  const filteredChartData = React.useMemo(() => {
    if (chartData.length === 0) {
      return [];
    }

    const latestValidEntry = [...chartData].reverse().find((entry) => {
      const timestamp = new Date(entry.date as string).getTime();
      return !Number.isNaN(timestamp);
    });

    if (!latestValidEntry) {
      return [];
    }

    const latestTimestamp = new Date(latestValidEntry.date as string).getTime();

    const range = RANGE_DEFINITIONS[activeRange];
    if (!range) {
      return chartData;
    }

    return chartData.filter((entry) => {
      const entryTimestamp = new Date(entry.date as string).getTime();
      if (Number.isNaN(entryTimestamp)) {
        return false;
      }

      return latestTimestamp - entryTimestamp <= range.durationMs;
    });
  }, [activeRange, chartData]);

  const yDomain = React.useMemo<[number | "auto", number | "auto"]>(() => {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    filteredChartData.forEach((entry) => {
      platforms.forEach(({ key }) => {
        const value = entry[key as keyof typeof entry];
        if (typeof value === "number" && Number.isFinite(value)) {
          if (value < min) {
            min = value;
          }
          if (value > max) {
            max = value;
          }
        }
      });
    });

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return ["auto", "auto"];
    }

    if (min === max) {
      const padding = Math.max(min * 0.001, 0.001);
      return [min - padding, max + padding];
    }

    const padding = Math.max((max - min) * 0.1, 0.001);
    return [min - padding, max + padding];
  }, [filteredChartData, platforms]);

  if (platforms.length === 0 || chartData.length === 0) {
    return (
      <Card className="py-4 sm:py-0">
        <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
            <CardTitle>Exchange Rate Trend</CardTitle>
            <CardDescription>
              Historical SGD to MYR exchange rates by platform.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-12 text-center text-sm text-muted-foreground">
          Not enough data to display the chart yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
          <CardTitle>Historical Exchange Rates</CardTitle>
          <CardDescription>
            Working hard to track exchange rates
          </CardDescription>
        </div>
        <div className="flex">
          {(
            Object.entries(RANGE_DEFINITIONS) as [
              TimeRange,
              { label: string; description: string }
            ][]
          ).map(([key, { label, description }]) => (
            <button
              key={key}
              type="button"
              data-active={activeRange === key}
              className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
              onClick={() => setActiveRange(key)}
              aria-pressed={activeRange === key}
            >
              <span className="text-muted-foreground text-xs">{label}</span>
              <span className="text-sm font-medium text-foreground">
                {description}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {filteredChartData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <LineChart
              accessibilityLayer
              data={filteredChartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value: string) => {
                  return formatInDisplayTimeZone(value, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={false}
                width={0}
                domain={yDomain}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[240px]"
                    labelFormatter={(value) => {
                      return formatInDisplayTimeZone(value as string, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });
                    }}
                  />
                }
              />
              <ChartLegend
                verticalAlign="top"
                align="right"
                content={<ChartLegendContent className="justify-end" />}
              />
              {platforms.map(({ key }) => (
                <Line
                  key={key}
                  dataKey={key}
                  type="monotone"
                  stroke={`var(--color-${key})`}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No readings for the selected time range yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
