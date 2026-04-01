import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartTooltip from './ChartTooltip';

const axisStyle = { fontSize: 12, fill: 'rgba(255,255,255,0.4)' };
const gridStroke = 'rgba(255,255,255,0.06)';

const defaultColors = ['#8b5cf6', '#6366f1', '#22c55e', '#06b6d4', '#f59e0b'];

export default function AnimatedAreaChart({
  data = [],
  dataKeys = [],
  xKey = 'name',
  height = 250,
  stacked = false,
  showLegend = false,
  colors = defaultColors,
  emptyText = 'No data',
}) {
  if (!data.length) {
    return <p className="text-center py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>{emptyText}</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          {dataKeys.map((key, i) => (
            <linearGradient key={key} id={`area-grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity={0.25} />
              <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey={xKey} tick={axisStyle} stroke={gridStroke} />
        <YAxis tick={axisStyle} stroke={gridStroke} />
        <Tooltip content={<ChartTooltip />} />
        {showLegend && <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} />}
        {dataKeys.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[i % colors.length]}
            fill={`url(#area-grad-${key})`}
            strokeWidth={2}
            stackId={stacked ? 'stack' : undefined}
            animationDuration={1000}
            animationBegin={i * 200}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
