import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  variant?: 'default' | 'primary' | 'secondary' | 'social';
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  className,
  isLoading = false,
  variant = 'default',
  ...props 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white';
      case 'secondary':
        return 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white';
      case 'social':
        return 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50';
      default:
        return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <Button
        className={cn(
          "relative w-full h-12 rounded-lg font-medium shadow-lg transition-all duration-300",
          "overflow-hidden",
          getVariantClasses(),
          isLoading ? "opacity-80" : "",
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        <motion.div
          className="absolute inset-0 w-full h-full"
          initial={{ opacity: 0 }}
          whileHover={{ 
            opacity: 0.2,
            background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)"
          }}
        />
        
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
          </div>
        ) : (
          <span>{children}</span>
        )}
      </Button>
    </motion.div>
  );
};

export default AnimatedButton;