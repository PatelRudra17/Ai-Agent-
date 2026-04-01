import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function StatSparkline({
  data = [],
  dataKey = 'value',
  color = '#8b5cf6',
  width = 80,
  height = 32,
  trend,
}) {
  const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : null;
  const displayColor = trendColor || color;

  return (
    <div className="flex items-center gap-2">
      <div style={{ width, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`spark-${dataKey}-${displayColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={displayColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={displayColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={displayColor}
              fill={`url(#spark-${dataKey}-${displayColor.replace('#', '')})`}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={true}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {trend && (
        <span className="text-[10px] font-bold" style={{ color: trendColor }}>
          {trend === 'up' ? '\u2191' : '\u2193'}
        </span>
      )}
    </div>
  );
}
