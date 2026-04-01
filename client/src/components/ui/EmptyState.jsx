import { motion } from 'framer-motion';

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {icon && (
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(99,102,241,0.08)' }}>
          <span className="text-2xl" style={{ color: 'rgba(99,102,241,0.5)' }}>{icon}</span>
        </div>
      )}
      <h3 className="text-lg font-semibold text-white/70 mb-1">{title}</h3>
      {description && (
        <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>{description}</p>
      )}
      {actionLabel && onAction && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAction}
          className="mt-6 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
