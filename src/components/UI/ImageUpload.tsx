import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Camera, AlertCircle } from 'lucide-react';
import Button from './Button';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  className?: string;
  maxSize?: number; // in MB
  accept?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  label = "Upload Image",
  className = "",
  maxSize = 5,
  accept = "image/*"
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError('');
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);

    try {
      // Convert to base64 for demo purposes
      // In production, you would upload to a cloud storage service
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange(result);
        setUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload image');
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    } else {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {value ? (
        // Image Preview
        <div className="relative group">
          <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/90 text-gray-900 border-white/90"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Change
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRemove}
                  className="bg-red-500/90 text-white border-red-500/90 hover:bg-red-600/90"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Upload Area
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : uploading
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="space-y-4">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
              uploading ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {uploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              ) : (
                <ImageIcon className="h-6 w-6 text-gray-400" />
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {uploading ? 'Uploading...' : 'Drop image here or click to browse'}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to {maxSize}MB
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mx-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;