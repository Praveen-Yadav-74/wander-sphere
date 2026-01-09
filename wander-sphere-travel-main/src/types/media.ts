/**
 * Media Upload Types for Bunny.net Integration
 */

export interface BunnyConfig {
  storageName: string;
  apiKey: string;
  pullZoneUrl: string;
  region: string;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export interface UploadOptions {
  folder?: string;
  customFileName?: string;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}

export interface MediaFile {
  file: File;
  preview?: string;
  compressed?: Blob;
}

export type MediaType = 'image' | 'video' | 'document';

export interface MediaMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy?: string;
}
