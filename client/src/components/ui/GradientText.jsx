import { motion } from 'framer-motion';

export default function GradientText({ children, className = '', as: Tag = 'h1' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <Tag className={`bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 bg-clip-text text-transparent ${className}`}>
        {children}
      </Tag>
    </motion.div>
  );
}
