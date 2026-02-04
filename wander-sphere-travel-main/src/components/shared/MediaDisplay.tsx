import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface MediaDisplayProps {
  url: string;
  type: 'image' | 'video';
  className?: string;
  alt?: string;
  autoPlay?: boolean;
}

const MediaDisplay = ({ url, type, className, alt = "Media content", autoPlay = true }: MediaDisplayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (type === 'video' && videoRef.current && autoPlay) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              videoRef.current?.play().catch(() => {
                // Autoplay blocked or failed, usually due to interaction requirements
                // Muted playsinline usually works.
              });
            } else {
              videoRef.current?.pause();
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(videoRef.current);

      return () => {
        if (videoRef.current) {
          observer.unobserve(videoRef.current);
        }
      };
    }
  }, [type, autoPlay]);

  if (!url) return <div className={cn("bg-gray-200 animate-pulse w-full h-full", className)} />;

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
      setIsLoading(false);
      setHasError(true);
  };

  if (hasError) {
      return (
          <div className={cn("bg-gray-100 flex items-center justify-center text-gray-400 text-sm", className)}>
              Failed to load media
          </div>
      );
  }

  return (
    <div className={cn("relative overflow-hidden bg-black/5", className)}>
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        )}
        
      {type === 'video' ? (
        <video
          ref={videoRef}
          src={url}
          className={cn("w-full h-full object-cover", isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300')}
          muted
          loop
          playsInline
          onLoadedData={handleLoad}
          onError={handleError}
        />
      ) : (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          className={cn("w-full h-full object-cover", isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300')}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default MediaDisplay;
