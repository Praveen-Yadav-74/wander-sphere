import { useState, useEffect } from 'react';
import { Compass, MapPin, Camera, Users, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  // No props needed - clean loading screen
}

const LoadingScreen = ({}: LoadingScreenProps = {}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { icon: Compass, text: 'Preparing your journey...', color: 'from-blue-500 to-cyan-500' },
    { icon: MapPin, text: 'Loading destinations...', color: 'from-purple-500 to-pink-500' },
    { icon: Camera, text: 'Setting up memories...', color: 'from-orange-500 to-red-500' },
    { icon: Users, text: 'Connecting travelers...', color: 'from-green-500 to-emerald-500' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 80);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, []);

  const CurrentIcon = steps[currentStep].icon;
  const currentColor = steps[currentStep].color;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Treasure Map / World Travel Animation Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated World Map Path */}
        <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid meet">
          {/* World Map Outline (Simplified) */}
          <g stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none">
            {/* Continents as simplified paths */}
            <path d="M200 200 Q250 180 300 200 T400 200 Q450 220 500 200 T600 200" />
            <path d="M600 200 Q650 180 700 200 T800 200 Q850 220 900 200 T1000 200" />
            <path d="M300 300 Q350 280 400 300 T500 300 Q550 320 600 300" />
            <path d="M700 350 Q750 330 800 350 T900 350 Q950 370 1000 350" />
          </g>
          
          {/* Animated Travel Path */}
          <motion.path
            d="M100 250 Q200 200 300 250 T500 250 T700 250 T900 250 T1100 250"
            fill="none"
            stroke="rgba(59, 130, 246, 0.6)"
            strokeWidth="3"
            strokeDasharray="10 5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 1],
              opacity: [0, 1, 0.5],
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          
          {/* Animated Traveler Icon Moving Along Path */}
          <motion.g
            initial={{ x: 100, y: 250 }}
            animate={{
              x: [100, 300, 500, 700, 900, 1100],
              y: [250, 250, 250, 250, 250, 250],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {/* Traveler with backpack */}
            <circle cx="0" cy="0" r="8" fill="rgba(59, 130, 246, 0.8)" />
            <circle cx="0" cy="-12" r="6" fill="rgba(255,255,255,0.9)" />
            <rect x="-4" y="-4" width="8" height="10" rx="2" fill="rgba(147, 51, 234, 0.8)" />
            {/* Pulsing effect */}
            <motion.circle
              cx="0"
              cy="0"
              r="12"
              fill="none"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeWidth="2"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.g>
          
          {/* Destination Pins */}
          {[
            { x: 300, y: 250, label: "Paris" },
            { x: 500, y: 250, label: "Tokyo" },
            { x: 700, y: 250, label: "New York" },
            { x: 900, y: 250, label: "Sydney" },
          ].map((pin, index) => (
            <motion.g
              key={index}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1],
                scale: [0, 1.2, 1],
              }}
              transition={{
                delay: index * 0.5,
                duration: 1,
                repeat: Infinity,
                repeatDelay: 2
              }}
            >
              <path
                d={`M${pin.x} ${pin.y} L${pin.x} ${pin.y - 20} M${pin.x - 8} ${pin.y - 20} L${pin.x + 8} ${pin.y - 20} L${pin.x} ${pin.y - 28} Z`}
                fill="rgba(234, 179, 8, 0.8)"
                stroke="rgba(234, 179, 8, 1)"
                strokeWidth="1.5"
              />
              <text
                x={pin.x}
                y={pin.y - 35}
                textAnchor="middle"
                fill="rgba(255,255,255,0.9)"
                fontSize="12"
                fontWeight="bold"
              >
                {pin.label}
              </text>
            </motion.g>
          ))}
        </svg>

        {/* Treasure Map Paper Texture Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-yellow-900/5 to-amber-800/10" 
             style={{
               backgroundImage: `
                 repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 69, 19, 0.03) 2px, rgba(139, 69, 19, 0.03) 4px),
                 repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139, 69, 19, 0.03) 2px, rgba(139, 69, 19, 0.03) 4px)
               `
             }}
        />
        
        {/* Compass Rose */}
        <motion.svg
          className="absolute top-10 right-10 w-24 h-24 text-white/20"
          viewBox="0 0 100 100"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M50 10 L55 50 L50 50 Z" fill="currentColor" />
          <path d="M50 50 L55 50 L50 90 Z" fill="currentColor" />
          <path d="M50 50 L10 50 L50 45 Z" fill="currentColor" />
          <path d="M50 50 L90 50 L50 45 Z" fill="currentColor" />
          <text x="50" y="30" textAnchor="middle" fontSize="12" fill="currentColor">N</text>
        </motion.svg>
      </div>

      {/* Travel Destination Sketch Background */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {/* Travel sketches - using SVG patterns and illustrations */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Map Pin Sketch */}
          <motion.svg
            className="absolute top-20 left-10 w-32 h-32 text-white/30"
            viewBox="0 0 100 100"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <path
              d="M50 10 C30 10, 15 25, 15 45 C15 60, 50 90, 50 90 C50 90, 85 60, 85 45 C85 25, 70 10, 50 10 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="50" cy="45" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          </motion.svg>

          {/* Compass Sketch */}
          <motion.svg
            className="absolute top-40 right-20 w-40 h-40 text-white/25"
            viewBox="0 0 100 100"
            initial={{ opacity: 0, rotate: -180 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ delay: 1, duration: 1.5 }}
          >
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="50" y1="10" x2="50" y2="50" stroke="currentColor" strokeWidth="2" />
            <line x1="50" y1="50" x2="50" y2="90" stroke="currentColor" strokeWidth="2" />
            <line x1="10" y1="50" x2="50" y2="50" stroke="currentColor" strokeWidth="2" />
            <line x1="50" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="2" />
            <path d="M50 50 L70 30 M50 50 L30 70" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="50" cy="50" r="5" fill="currentColor" />
          </motion.svg>

          {/* Mountain Range Sketch */}
          <motion.svg
            className="absolute bottom-32 left-1/4 w-48 h-32 text-white/20"
            viewBox="0 0 200 100"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <path
              d="M0 80 L40 40 L80 60 L120 20 L160 50 L200 30 L200 100 L0 100 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M40 40 L80 60 L120 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="3,3"
            />
          </motion.svg>

          {/* Traveler with Backpack Sketch */}
          <motion.svg
            className="absolute bottom-20 right-1/4 w-36 h-48 text-white/25"
            viewBox="0 0 100 150"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1 }}
          >
            {/* Person silhouette */}
            <circle cx="50" cy="30" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M50 42 L50 80 M50 50 L35 65 M50 50 L65 65"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Backpack */}
            <rect x="42" y="55" width="16" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M42 60 L58 60" stroke="currentColor" strokeWidth="1.5" />
            <path d="M42 70 L58 70" stroke="currentColor" strokeWidth="1.5" />
          </motion.svg>

          {/* Airplane Sketch */}
          <motion.svg
            className="absolute top-1/4 left-1/3 w-44 h-24 text-white/20"
            viewBox="0 0 200 100"
            initial={{ opacity: 0, x: -100 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              x: [-100, 100, 200, 300]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <path
              d="M20 50 L180 50 M50 30 L50 70 M150 30 L150 70 M20 50 L10 45 L10 55 Z M180 50 L190 45 L190 55 Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="150" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
          </motion.svg>

          {/* Camera Sketch */}
          <motion.svg
            className="absolute top-1/2 right-1/3 w-32 h-24 text-white/20"
            viewBox="0 0 100 80"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
          >
            <rect x="20" y="20" width="60" height="40" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="50" cy="40" r="12" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="50" cy="40" r="6" fill="currentColor" />
            <rect x="75" y="30" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M20 20 L15 15 L15 10 L25 10 L25 15 Z" stroke="currentColor" strokeWidth="2" fill="none" />
          </motion.svg>
        </div>

        {/* Subtle animated particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: Math.random() * 60 + 30,
              height: Math.random() * 60 + 30,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col items-center space-y-8 p-8 max-w-md mx-auto relative z-10">
        {/* Animated Logo with Gradient */}
        <motion.div 
          className="relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            duration: 1 
          }}
        >
          <motion.div
            className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${currentColor} shadow-2xl`}
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <div className="absolute inset-2 rounded-full bg-slate-900 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CurrentIcon className="w-10 h-10 text-white" />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
          
          {/* Pulsing Rings */}
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className={`absolute inset-0 rounded-full bg-gradient-to-br ${currentColor} opacity-20`}
              animate={{
                scale: [1, 1.5 + ring * 0.3, 1],
                opacity: [0.2, 0, 0.2],
              }}
              transition={{
                duration: 2 + ring * 0.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>
        
        {/* App Name with Animation */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <motion.h1 
            className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-3"
            animate={{
              backgroundPosition: ["0%", "100%", "0%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: "200% 200%",
            }}
          >
            WanderSphere
          </motion.h1>
          <motion.p 
            className="text-lg text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            Your Travel Companion
          </motion.p>
        </motion.div>

        {/* Animated Progress Bar */}
        <div className="w-full max-w-xs space-y-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-full h-3 overflow-hidden shadow-inner border border-white/20">
            <motion.div 
              className={`h-full bg-gradient-to-r ${currentColor} shadow-lg`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <motion.p 
            className="text-sm text-white/60 text-center font-medium"
            key={progress}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {progress}%
          </motion.p>
        </div>

        {/* Current Step with Fade Animation */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentStep}
            className="text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <motion.p 
              className={`text-base font-medium bg-gradient-to-r ${currentColor} bg-clip-text text-transparent`}
            >
              {steps[currentStep].text}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LoadingScreen;