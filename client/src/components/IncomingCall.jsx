import { motion, AnimatePresence } from 'framer-motion';

export default function IncomingCall({ callerInfo, onAccept, onReject }) {
  if (!callerInfo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center"
        >
          {/* Caller Avatar */}
          <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {callerInfo?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
          </div>

          <h2 className="text-xl font-semibold text-white mb-1">{callerInfo?.name || 'Unknown'}</h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Incoming call...</p>

          {/* Ringing animation */}
          <div className="flex justify-center gap-1 mb-8">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                className="w-2 h-2 rounded-full"
                style={{ background: '#6366f1' }}
              />
            ))}
          </div>

          {/* Accept / Reject */}
          <div className="flex items-center justify-center gap-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onReject}
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 30px rgba(239,68,68,0.4)' }}
            >
              <span style={{ transform: 'rotate(135deg)', display: 'inline-block' }}>&#9742;</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onAccept}
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 30px rgba(16,185,129,0.4)' }}
            >
              &#9742;
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
