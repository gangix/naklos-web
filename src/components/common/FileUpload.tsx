import { useRef, useState } from 'react';
import type { Document } from '../../types';
import { convertFileToDocument, MAX_FILE_SIZE, formatFileSize } from '../../utils/fileUpload';
import { DOCUMENTS } from '../../constants/text';

interface FileUploadProps {
  onFileSelect: (document: Document) => void;
  maxSize?: number;
  disabled?: boolean;
}

/**
 * Mobile-friendly file upload component with camera capture support
 * Validates file size and type, converts to base64, and provides user feedback
 */
const FileUpload = ({ onFileSelect, maxSize = MAX_FILE_SIZE, disabled = false }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleButtonClick = () => {
    if (disabled || isUploading) return;
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const result = await convertFileToDocument(file);

      if (result.success && result.document) {
        onFileSelect(result.document);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(DOCUMENTS.uploadError);
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Upload button - large and touch-friendly */}
      <button
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
        className={`w-full py-4 px-6 rounded-lg text-base font-medium transition-all ${
          disabled || isUploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
        }`}
      >
        {isUploading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Yükleniyor...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span className="text-2xl">📷</span>
            {DOCUMENTS.uploadPhoto}
          </span>
        )}
      </button>

      {/* Size limit hint */}
      <p className="text-xs text-center text-gray-500">
        {DOCUMENTS.maxSize}: {formatFileSize(maxSize)} • JPG, PNG, WebP
      </p>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800 text-center">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
