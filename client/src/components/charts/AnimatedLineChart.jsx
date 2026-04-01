import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ChartTooltip from './ChartTooltip';

const axisStyle = { fontSize: 12, fill: 'rgba(255,255,255,0.4)' };
const gridStroke = 'rgba(255,255,255,0.06)';

const defaultStrokes = ['#8b5cf6', '#6366f1', '#22c55e', '#06b6d4', '#f59e0b', '#ef4444'];

export default function AnimatedLineChart({
  data = [],
  dataKeys = [],
  xKey = 'name',
  height = 250,
  showLegend = false,
  strokes = defaultStrokes,
  emptyText = 'No data',
}) {
  if (!data.length) {
    return <p className="text-center py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>{emptyText}</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey={xKey} tick={axisStyle} stroke={gridStroke} />
        <YAxis tick={axisStyle} stroke={gridStroke} />
        <Tooltip content={<ChartTooltip />} />
        {showLegend && <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} />}
        {dataKeys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={strokes[i % strokes.length]}
            strokeWidth={2}
            dot={{ fill: strokes[i % strokes.length], r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
            animationDuration={1000}
            animationBegin={i * 200}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
