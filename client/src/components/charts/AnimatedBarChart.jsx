import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartTooltip from './ChartTooltip';

const axisStyle = { fontSize: 12, fill: 'rgba(255,255,255,0.4)' };
const gridStroke = 'rgba(255,255,255,0.06)';

const defaultColors = [
  { stroke: '#8b5cf6', fill: 'rgba(139,92,246,0.3)' },
  { stroke: '#6366f1', fill: 'rgba(99,102,241,0.3)' },
  { stroke: '#22c55e', fill: 'rgba(34,197,94,0.3)' },
  { stroke: '#06b6d4', fill: 'rgba(6,182,212,0.3)' },
];

export default function AnimatedBarChart({
  data = [],
  dataKeys = [],
  xKey = 'name',
  height = 250,
  layout = 'horizontal',
  showLegend = false,
  colors = defaultColors,
  emptyText = 'No data',
}) {
  if (!data.length) {
    return <p className="text-center py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>{emptyText}</p>;
  }

  const isVertical = layout === 'vertical';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={layout}>
        <defs>
          {dataKeys.map((key, i) => {
            const c = colors[i % colors.length];
            return (
              <linearGradient key={key} id={`bar-grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.stroke} stopOpacity={0.8} />
                <stop offset="100%" stopColor={c.stroke} stopOpacity={0.3} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        {isVertical ? (
          <>
            <XAxis type="number" tick={axisStyle} stroke={gridStroke} />
            <YAxis dataKey={xKey} type="category" tick={axisStyle} width={80} stroke={gridStroke} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={axisStyle} stroke={gridStroke} />
            <YAxis tick={axisStyle} stroke={gridStroke} />
          </>
        )}
        <Tooltip content={<ChartTooltip />} />
        {showLegend && <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} />}
        {dataKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={`url(#bar-grad-${key})`}
            radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            animationDuration={800}
            animationBegin={i * 150}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
