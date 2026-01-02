import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import config from "./index";

// Configure cloudinary
cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

const removeExtension = (filename: string) => {
  return filename.split(".").slice(0, -1).join(".");
};

// Create CloudinaryStorage instance (following FoundX pattern)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    public_id: (_req: any, file: any) =>
      Math.random().toString(36).substring(2) +
      "-" +
      Date.now() +
      "-" +
      file.fieldname +
      "-" +
      removeExtension(file.originalname),
  } as any,
});

// Multer configuration with Cloudinary storage (based on FoundX)
export const multerUpload = multer({ storage: storage });

export { cloudinary as cloudinaryUpload };
