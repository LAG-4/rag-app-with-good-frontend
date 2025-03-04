import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function FileUpload({ onUpload, isLoading, error }: FileUploadProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      await onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-[#02ece9] bg-[#02ece9]/10'
            : 'border-gray-700 hover:border-[#02ece9] hover:bg-[#02ece9]/5'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-400">
          {isDragActive
            ? 'Drop the PDF here'
            : isLoading
            ? 'Processing...'
            : 'Drag & drop a PDF file here, or click to select'}
        </p>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
} 