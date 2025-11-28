import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface ResultCardProps {
  title: string;
  value: string;
  subValue?: string;
  color?: 'default' | 'green' | 'primary';
  highlight?: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  value,
  subValue,
  color = 'default',
  highlight = false,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        "p-6 rounded-xl shadow-sm border transition-colors duration-200",
        highlight 
          ? "bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800" 
          : "bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700"
      )}
    >
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
      <motion.p 
        key={value} // Animate when value changes
        initial={{ scale: 0.95, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={clsx(
          "text-2xl font-bold tracking-tight",
          color === 'green' ? "text-green-600 dark:text-green-400" : 
          color === 'primary' ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"
        )}
      >
        {value}
      </motion.p>
      {subValue && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subValue}</p>
      )}
    </motion.div>
  );
};
