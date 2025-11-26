import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({ 
  label, 
  error, 
  className,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || (props.value && props.value.toString().length > 0);

  return (
    <div className="relative mb-6">
      <motion.div 
        className={cn(
          "relative rounded-lg overflow-hidden",
          error ? "border-red-300" : "border-transparent",
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Input
          {...props}
          className={cn(
            "h-14 px-4 pt-4 pb-2 bg-white/10 backdrop-blur-md border-b-2 border-blue-500/30 focus:border-blue-500 transition-all duration-300 rounded-lg shadow-sm",
            error ? "border-red-500 focus:border-red-500" : "",
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus && props.onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur && props.onBlur(e);
          }}
        />
        <motion.label
          className={cn(
            "absolute left-4 pointer-events-none text-gray-500 transition-all duration-300",
            isActive ? "text-xs top-2" : "text-base top-1/2 -translate-y-1/2"
          )}
          animate={{
            top: isActive ? "0.5rem" : "50%",
            fontSize: isActive ? "0.75rem" : "1rem",
            y: isActive ? 0 : "-50%",
            color: isFocused ? "rgb(59, 130, 246)" : "rgb(107, 114, 128)"
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>
      </motion.div>
      
      {error && (
        <motion.p
          className="text-red-500 text-sm mt-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default AnimatedInput;