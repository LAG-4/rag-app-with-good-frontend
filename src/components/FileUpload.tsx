import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive 
          ? 'border-[#02ece9] bg-[#02ece9]/5' 
          : 'border-gray-700 hover:border-[#02ece9]'
        }`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-[#02ece9]" />
      <p className="mt-2 text-sm text-gray-300">
        {isDragActive
          ? "Drop the file here"
          : "Drag 'n' drop a file here, or click to select"}
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Supports PDF, TXT, DOC, DOCX
      </p>
    </div>
  );
} 