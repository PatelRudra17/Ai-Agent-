import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlowButton from '../components/ui/GlowButton';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: '#0f0f1a' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <motion.h1
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-8xl font-black mb-4"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          404
        </motion.h1>
        <h2 className="text-xl font-semibold text-white mb-2">Page Not Found</h2>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <GlowButton onClick={() => navigate('/dashboard')}>Go to Dashboard</GlowButton>
      </motion.div>
    </div>
  );
}
