import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

export default function GlassCard({ children, className = '', tilt = false, hover = true, glow = false, delay = 0, onClick }) {
  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={`
        rounded-2xl p-6
        bg-white/70 dark:bg-white/5
        backdrop-blur-xl
        border border-white/20 dark:border-white/10
        shadow-lg shadow-black/5 dark:shadow-black/20
        ${glow ? 'animate-glow-pulse' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </motion.div>
  );

  if (tilt) {
    return (
      <Tilt tiltMaxAngleX={8} tiltMaxAngleY={8} glareEnable glareMaxOpacity={0.1} glarePosition="all" scale={1.02}>
        {card}
      </Tilt>
    );
  }

  return card;
}
