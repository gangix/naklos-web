import type { Document } from '../types';

// File upload constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface FileUploadResult {
  success: boolean;
  document?: Document;
  error?: string;
}

/**
 * Convert a File object to a Document with base64 encoding
 * Validates file size and type before conversion
 *
 * @param file - The File object to convert
 * @returns Promise resolving to FileUploadResult with document or error
 */
export async function convertFileToDocument(file: File): Promise<FileUploadResult> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `Dosya boyutu çok büyük. Maksimum ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))}MB yüklenebilir.`,
    };
  }

  // Validate file type
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      success: false,
      error: 'Geçersiz dosya türü. Sadece JPG, PNG veya WebP formatları kabul edilir.',
    };
  }

  try {
    // Convert file to base64 data URL
    const dataUrl = await readFileAsDataURL(file);

    // Create document object
    const document: Document = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: 'delivery-confirmation',
      mimeType: file.type,
      dataUrl,
      uploadedAt: new Date().toISOString(),
      size: file.size,
    };

    return {
      success: true,
      document,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Dosya yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
    };
  }
}

/**
 * Read a file as a base64 data URL using FileReader
 *
 * @param file - The File object to read
 * @returns Promise resolving to base64 data URL string
 */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };

    reader.onerror = () => {
      reject(new Error('FileReader error'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format file size in human-readable format
 *
 * @param bytes - Size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
