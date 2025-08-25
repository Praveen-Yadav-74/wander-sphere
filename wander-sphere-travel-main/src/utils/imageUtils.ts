import heroBeach from "@/assets/hero-beach.jpg";

/**
 * Handles image loading errors by setting a fallback image
 * @param e - The error event
 * @param fallbackSrc - Optional fallback image source
 * @param logMessage - Optional message to log
 */
export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string = heroBeach,
  logMessage: string = "Failed to load image, using fallback"
) => {
  console.error(logMessage);
  e.currentTarget.src = fallbackSrc;
};

/**
 * Creates a placeholder image URL for development
 * @param width - Image width
 * @param height - Image height
 * @param text - Optional text to display
 * @returns Placeholder image URL
 */
export const createPlaceholderImage = (
  width: number = 400,
  height: number = 300,
  text: string = "Placeholder"
): string => {
  return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(text)}`;
};

/**
 * Validates if a URL is a valid image URL
 * @param url - The URL to validate
 * @returns Boolean indicating if URL is valid
 */
export const isValidImageUrl = (url: string): boolean => {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
  return imageExtensions.test(url) || url.startsWith('data:image/');
};