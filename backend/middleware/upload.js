import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'novachat/uploads',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp3', 'wav', 'webm', 'ogg'],
  },
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024,
    fieldSize: 5 * 1024 * 1024 // 5MB limit for text fields (like base64 wallpapers)
  },
});

export default upload;
