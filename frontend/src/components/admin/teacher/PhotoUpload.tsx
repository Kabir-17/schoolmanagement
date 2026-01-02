import React, { useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface PhotoUploadProps {
  formData: {
    photo?: File | null;
    photoPreview?: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  formData,
  errors,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      onChange("photo", file);
      onChange("photoPreview", previewUrl);
    }
  };

  const removePhoto = () => {
    if (formData.photoPreview) {
      URL.revokeObjectURL(formData.photoPreview);
    }
    onChange("photo", null);
    onChange("photoPreview", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Teacher Photo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {/* Photo Preview */}
          <div className="relative">
            {formData.photoPreview ? (
              <div className="relative">
                <img
                  src={formData.photoPreview}
                  alt="Teacher preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  aria-label="Remove photo"
                  title="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
              aria-label="Upload teacher photo"
            />

            <Button
              type="button"
              onClick={triggerFileInput}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {formData.photoPreview ? "Change Photo" : "Upload Photo"}
            </Button>

            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Recommended: Square image, max 5MB
              </p>
              <p className="text-xs text-gray-400">
                Supported formats: JPG, PNG, GIF
              </p>
            </div>

            {errors.photo && (
              <p className="text-red-500 text-sm mt-2">{errors.photo}</p>
            )}
          </div>

          {/* Photo Guidelines */}
          <div className="bg-blue-50 p-3 rounded-lg w-full">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              Photo Guidelines:
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Use a professional headshot</li>
              <li>• Ensure good lighting and clear visibility</li>
              <li>• Face should be clearly visible</li>
              <li>• Avoid sunglasses or hats</li>
              <li>• Square aspect ratio works best</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhotoUpload;
