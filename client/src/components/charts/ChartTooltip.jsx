export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-xl px-4 py-3 backdrop-blur-xl"
      style={{
        background: 'rgba(15,15,30,0.9)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {label && (
        <p className="text-[11px] font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {label}
        </p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color || '#8b5cf6' }} />
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{entry.name}:</span>
          <span className="font-semibold text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
