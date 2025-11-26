import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  type: 'login' | 'register';
}

const messages = {
  login: [
    "Your Next Adventure Awaits.",
    "Welcome Back, Explorer.",
    "Continue Your Journey."
  ],
  register: [
    "Join a Community of Explorers.",
    "Your Journey Begins Here.",
    "Plan. Discover. Remember."
  ]
};

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, type }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  // Handle mouse movement for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Rotate through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex(prev => 
        prev === messages[type].length - 1 ? 0 : prev + 1
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, [type]);

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row overflow-hidden">
      {/* Visual Experience Side */}
      <motion.div 
        className="relative h-[30vh] md:h-screen md:w-1/2 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            muted 
            loop 
            className="object-cover h-full w-full"
            style={{
              transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px) scale(1.1)`
            }}
          >
            <source 
              src={type === 'login' 
                ? "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-beach-with-turquoise-water-4868-large.mp4" 
                : "https://assets.mixkit.co/videos/preview/mixkit-top-aerial-shot-of-seashore-with-rocks-1090-large.mp4"} 
              type="video/mp4" 
            />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 to-purple-900/60 backdrop-blur-[2px]"></div>
        </div>
        
        {/* Compelling Messaging */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center px-6">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-white mb-4"
              key={currentMessageIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              style={{
                transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px)`
              }}
            >
              {messages[type][currentMessageIndex]}
            </motion.h1>
            <motion.p 
              className="text-xl text-white/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              style={{
                transform: `translate(${mousePosition.x * 5}px, ${mousePosition.y * 5}px)`
              }}
            >
              {type === 'login' 
                ? 'Sign in to continue your travel story.' 
                : 'Create an account to start your travel journey.'}
            </motion.p>
          </div>
        </div>
      </motion.div>
      
      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <motion.div 
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;