/**
 * Image handling utility functions
 */

import { toast } from "@/components/ui/use-toast";

/**
 * Default fallback image to use when image loading fails
 */
export const DEFAULT_FALLBACK_IMAGE = "/images/hero-beach.jpg";

/**
 * Handle image loading errors by setting a fallback image
 * @param event The error event from the image
 * @param fallbackSrc Optional custom fallback image source
 * @param errorMessage Optional custom error message for logging
 * @param showToast Whether to show a toast notification (default: false)
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackSrc: string = DEFAULT_FALLBACK_IMAGE,
  errorMessage: string = "Failed to load image",
  showToast: boolean = false
): void {
  // Get the image element
  const target = event.target as HTMLImageElement;
  
  // Prevent infinite error loop
  target.onerror = null;
  
  // Set the fallback image
  target.src = fallbackSrc;
  
  // Log the error
  console.error(errorMessage);
  
  // Show toast notification if enabled
  if (showToast) {
    toast({
      title: "Image Error",
      description: "Failed to load image. Using placeholder instead.",
      variant: "destructive"
    });
  }
}

/**
 * Create an image loading error handler with predefined settings
 * @param fallbackSrc Optional custom fallback image source
 * @param customErrorMessage Optional custom error message for logging
 * @param showToast Whether to show a toast notification
 * @returns A function to handle image loading errors
 */
export function createImageErrorHandler(
  fallbackSrc: string = DEFAULT_FALLBACK_IMAGE,
  customErrorMessage: string = "Failed to load image",
  showToast: boolean = false
): (event: React.SyntheticEvent<HTMLImageElement, Event>) => void {
  return (event) => handleImageError(event, fallbackSrc, customErrorMessage, showToast);
}