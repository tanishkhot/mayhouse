import React, { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

interface Photo {
  id: string;
  photo_url: string;
  is_cover_photo: boolean;
  display_order: number;
  caption?: string;
  uploaded_at: string;
}

interface ExperiencePhotoUploadProps {
  experienceId: string;
  onPhotosUpdate?: (photos: Photo[]) => void;
  existingPhotos?: Photo[];
  maxPhotos?: number;  
}

export const ExperiencePhotoUpload: React.FC<ExperiencePhotoUploadProps> = ({
  experienceId,
  onPhotosUpdate,
  existingPhotos = [],
  maxPhotos = 10,
}) => {
  const [photos, setPhotos] = useState<Photo[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    setPhotos(existingPhotos);
  }, [existingPhotos]);

  const fetchPhotos = useCallback(async () => {
    try {
      const response = await api.get(`/experiences/${experienceId}/photos`);
      const fetchedPhotos = response.data;
      setPhotos(fetchedPhotos);
      if (onPhotosUpdate) {
        onPhotosUpdate(fetchedPhotos);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  }, [experienceId, onPhotosUpdate]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed max photos
    if (photos.length + files.length > maxPhotos) {
      setError(`You can upload a maximum of ${maxPhotos} photos`);
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    const token = localStorage.getItem('mayhouse_token');
    if (!token) {
      setError('Authentication required. Please log in again.');
      setUploading(false);
      return;
    }

    try {
      const totalFiles = files.length;
      let uploadedCount = 0;

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError(`${file.name} is not an image file`);
          continue;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name} is too large (max 5MB)`);
          continue;
        }

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('is_cover_photo', photos.length === 0 ? 'true' : 'false'); // First photo is cover
        formData.append('display_order', photos.length.toString());

        // Upload
        const response = await api.post(
          `/experiences/${experienceId}/photos`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        uploadedCount++;
        setUploadProgress((uploadedCount / totalFiles) * 100);
      }

      // Refresh photos list
      await fetchPhotos();
      setUploadProgress(100);
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      setError(
        error.response?.data?.detail || 'Failed to upload photos. Please try again.'
      );
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await api.delete(`/experiences/${experienceId}/photos/${photoId}`);
      await fetchPhotos();
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      setError(
        error.response?.data?.detail || 'Failed to delete photo. Please try again.'
      );
    }
  };

  const handleSetCoverPhoto = async (photoId: string) => {
    try {
      await api.patch(`/experiences/${experienceId}/photos/${photoId}`, {
        is_cover_photo: true,
      });
      await fetchPhotos();
    } catch (error: any) {
      console.error('Error setting cover photo:', error);
      setError(
        error.response?.data?.detail ||
          'Failed to set cover photo. Please try again.'
      );
    }
  };

  const handleUpdateCaption = async (
    photoId: string,
    caption: string
  ) => {
    try {
      await api.patch(`/experiences/${experienceId}/photos/${photoId}`, {
        caption,
      });
      await fetchPhotos();
    } catch (error: any) {
      console.error('Error updating caption:', error);
      setError(
        error.response?.data?.detail ||
          'Failed to update caption. Please try again.'
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-black">Experience Photos</h3>
        <span className="text-sm text-gray-500">
          {photos.length} / {maxPhotos} photos
        </span>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${photos.length >= maxPhotos ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (photos.length < maxPhotos) {
            document.getElementById('photo-upload-input')?.click();
          }
        }}
      >
        <input
          id="photo-upload-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading || photos.length >= maxPhotos}
        />

        <div className="space-y-2">
          <div className="flex justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          {uploading ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Uploading photos...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Drop photos here or click to upload
              </p>
              <p className="text-xs text-gray-500">
                JPEG, PNG, or WebP (max 5MB each)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Photos grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative group rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
            >
              {/* Photo */}
              <div className="aspect-square relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.photo_url}
                  alt={photo.caption || `Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Cover photo badge */}
                {photo.is_cover_photo && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                    Cover Photo
                  </div>
                )}

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2">
                  {!photo.is_cover_photo && (
                    <button
                      onClick={() => handleSetCoverPhoto(photo.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-xs px-3 py-1 rounded hover:bg-gray-100"
                      title="Set as cover photo"
                    >
                      Set as Cover
                    </button>
                  )}
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 text-white text-xs px-3 py-1 rounded hover:bg-red-600"
                    title="Delete photo"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Caption input */}
              <div className="p-2 bg-gray-50">
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={photo.caption || ''}
                  onChange={(e) => handleUpdateCaption(photo.id, e.target.value)}
                  className="w-full text-xs border-none bg-transparent focus:outline-none focus:ring-0 text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper text */}
      {photos.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            No photos uploaded yet. Add photos to make your experience stand out!
          </p>
        </div>
      )}
    </div>
  );
};

