import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import ChartTooltip from './ChartTooltip';

const defaultColors = ['#8b5cf6', '#22c55e', '#eab308', '#ef4444', '#6366f1', '#06b6d4', '#f97316', '#ec4899'];

function ActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#fff" fontSize={14} fontWeight="bold">
        {value}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={11}>
        {payload.name}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 8} outerRadius={outerRadius + 12} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.3} />
    </g>
  );
}

export default function AnimatedPieChart({
  data = [],
  height = 280,
  colors = defaultColors,
  innerRadius = 50,
  outerRadius = 90,
  showLabels = false,
  emptyText = 'No data',
}) {
  const [activeIndex, setActiveIndex] = useState(-1);

  if (!data.length) {
    return <p className="text-center py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>{emptyText}</p>;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            activeIndex={activeIndex >= 0 ? activeIndex : undefined}
            activeShape={activeIndex >= 0 ? ActiveShape : undefined}
            onMouseEnter={(_, i) => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(-1)}
            animationDuration={800}
            label={showLabels ? ({ name, value }) => `${name}: ${value}` : false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors[i % colors.length] }} />
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
