import { useState } from 'react';

export default function CalendarWidget() {
  const [today] = useState(new Date());
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {monthName}
      </h3>
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((d) => (
          <div key={d} className="text-[9px] font-semibold text-center py-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{d}</div>
        ))}
        {cells.map((d, i) => (
          <div key={i}
            className={`text-[11px] text-center py-1 rounded-lg transition-colors ${d === today.getDate() ? 'font-bold' : ''}`}
            style={d === today.getDate()
              ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff' }
              : { color: d ? 'rgba(255,255,255,0.5)' : 'transparent' }
            }>
            {d || ''}
          </div>
        ))}
      </div>
    </div>
  );
}
