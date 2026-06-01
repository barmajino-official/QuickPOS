/**
 * @file SalesTrendChart.tsx
 * @description Dual-metric dashboard chart: daily revenue (area, left axis) and daily
 *              order count (line, right axis) over the last 7 days.
 *
 * @receives data – array of { date, revenue, orderCount }, oldest → newest
 *
 * @notes Presentational only. Colors use CSS custom properties so the chart adapts to
 *        the light/dark M3 theme. CSS lives in ./SalesTrendChart.css.
 */
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import type { DailySales } from '~/types';

import './SalesTrendChart.css';

interface Props {
  data: DailySales[];
}

interface TooltipEntry {
  dataKey: string;
  value: number;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

const CHART_HEIGHT = 280;

const formatDay = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

const formatAxisMoney = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

export function SalesTrendChart({ data }: Props) {
  return (
    <div className="chart_wrap">
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -6 }}>
          <defs>
            <linearGradient id="revenue_fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-300)" vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--color-neutral)', fontSize: 12 }}
          />
          <YAxis
            yAxisId="revenue"
            tickFormatter={formatAxisMoney}
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: 'var(--color-neutral)', fontSize: 11 }}
          />
          <YAxis
            yAxisId="orders"
            orientation="right"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={28}
            tick={{ fill: 'var(--color-neutral)', fontSize: 11 }}
          />

          <Tooltip content={<ChartTooltip />} />

          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="var(--color-primary)"
            strokeWidth={2}
            fill="url(#revenue_fill)"
          />
          <Line
            yAxisId="orders"
            type="monotone"
            dataKey="orderCount"
            name="Orders"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="chart_legend">
        <span className="chart_legend_item">
          <span className="chart_dot chart_dot_revenue" />
          Revenue
        </span>
        <span className="chart_legend_item">
          <span className="chart_dot chart_dot_orders" />
          Orders
        </span>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const revenue = payload.find((p) => p.dataKey === 'revenue')?.value ?? 0;
  const orders = payload.find((p) => p.dataKey === 'orderCount')?.value ?? 0;
  const dateLabel = label
    ? new Date(label).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : '';

  return (
    <div className="chart_tooltip">
      <div className="chart_tooltip_date">{dateLabel}</div>
      <div className="chart_tooltip_row">
        <span className="chart_dot chart_dot_revenue" />
        Revenue: <strong>{formatCurrency(revenue)}</strong>
      </div>
      <div className="chart_tooltip_row">
        <span className="chart_dot chart_dot_orders" />
        Orders: <strong>{orders}</strong>
      </div>
    </div>
  );
}
