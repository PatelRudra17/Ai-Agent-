import { motion } from 'framer-motion';

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function ActiveCall({ callerInfo, duration, isMuted, onToggleMute, onEndCall, minimized, onToggleMinimize }) {
  if (minimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onToggleMinimize}
        className="fixed bottom-6 right-6 z-50 rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
        style={{ background: 'rgba(99,102,241,0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(99,102,241,0.3)' }}
      >
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
          {callerInfo?.name?.[0] || '?'}
        </div>
        <div>
          <p className="text-xs font-semibold text-white">{callerInfo?.name || 'Call'}</p>
          <p className="text-[10px] text-white/60">{formatDuration(duration)}</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(8px)' }}
    >
      {/* Caller Info */}
      <div className="w-20 h-20 rounded-full mb-4 flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
        {callerInfo?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
      </div>
      <h2 className="text-lg font-semibold text-white mb-1">{callerInfo?.name || 'Unknown'}</h2>
      <p className="text-2xl font-mono mb-8" style={{ color: '#a5b4fc' }}>{formatDuration(duration)}</p>

      <div className="flex items-center gap-4">
        {/* Mute */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleMute}
          className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{
            background: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
            color: isMuted ? '#ef4444' : 'rgba(255,255,255,0.6)',
          }}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </motion.button>

        {/* End Call */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onEndCall}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 30px rgba(239,68,68,0.4)' }}
        >
          <span style={{ transform: 'rotate(135deg)', display: 'inline-block' }}>&#9742;</span>
        </motion.button>

        {/* Minimize */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onToggleMinimize}
          className="w-14 h-14 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
        >
          Mini
        </motion.button>
      </div>
    </motion.div>
  );
}
