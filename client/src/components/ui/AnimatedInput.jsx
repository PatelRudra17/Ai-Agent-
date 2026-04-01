import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedInput({ label, type = 'text', value, onChange, placeholder, required, error, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      {label && (
        <motion.label
          animate={{ color: focused ? '#6366f1' : '#6b7280' }}
          className="block text-sm font-medium mb-1.5"
        >
          {label}
        </motion.label>
      )}
      <motion.input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        animate={{
          borderColor: error ? '#ef4444' : focused ? '#6366f1' : 'rgba(229,231,235,1)',
          boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.1)' : '0 0 0 0px transparent',
        }}
        transition={{ duration: 0.2 }}
        className={`
          w-full px-4 py-3 rounded-xl
          bg-white/50 dark:bg-white/5
          border border-gray-200 dark:border-white/10
          text-gray-800 dark:text-white
          placeholder-gray-400 dark:placeholder-gray-500
          outline-none transition-colors
          ${error ? 'border-red-400' : ''}
        `}
        {...props}
      />
      {error && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 mt-1">
          {error}
        </motion.p>
      )}
    </div>
  );
}
