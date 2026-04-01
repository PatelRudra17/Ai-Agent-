import { useState } from 'react';

const LABELS = {
  automation: 'Automation',
  ai: 'AI Mode',
};

export default function ModeToggle({ mode = 'automation', onChange, size = 'default', label }) {
  const [current, setCurrent] = useState(mode);

  const handleSwitch = (newMode) => {
    if (newMode === current) return;
    setCurrent(newMode);
    onChange?.(newMode);
  };

  const isSmall = size === 'small';
  const py = isSmall ? 'py-1' : 'py-1.5';
  const px = isSmall ? 'px-3' : 'px-4';
  const text = isSmall ? 'text-[10px]' : 'text-xs';

  return (
    <div>
      {label && <p className="text-xs font-medium text-white/50 mb-2">{label}</p>}
      <div className="inline-flex rounded-xl p-0.5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => handleSwitch('automation')}
          className={`${px} ${py} rounded-lg ${text} font-semibold transition-all`}
          style={current === 'automation'
            ? { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }
            : { color: 'rgba(255,255,255,0.4)' }
          }
        >
          {LABELS.automation}
        </button>
        <button
          onClick={() => handleSwitch('ai')}
          className={`${px} ${py} rounded-lg ${text} font-semibold transition-all`}
          style={current === 'ai'
            ? { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }
            : { color: 'rgba(255,255,255,0.4)' }
          }
        >
          {LABELS.ai}
        </button>
      </div>
    </div>
  );
}
