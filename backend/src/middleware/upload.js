const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = [
    'uploads',
    'uploads/complaints',
    'uploads/before-after',
    'uploads/temp'
  ];

  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

// Initialize upload directories
ensureUploadDirs();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 1
  }
});

// Image processing and hash generation
const processImage = async (buffer, filename, directory = 'complaints') => {
  try {
    // Generate hash for duplicate detection
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    
    // Process image with sharp
    const processedBuffer = await sharp(buffer)
      .resize(1200, 1200, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: 85,
        progressive: true 
      })
      .toBuffer();

    // Generate unique filename
    const timestamp = Date.now();
    const extension = '.jpg';
    const uniqueFilename = `${filename}_${timestamp}_${hash.substring(0, 8)}${extension}`;
    const filepath = path.join('uploads', directory, uniqueFilename);

    // Save processed image
    await fs.writeFile(filepath, processedBuffer);

    return {
      filename: uniqueFilename,
      filepath,
      hash,
      size: processedBuffer.length,
      url: `/uploads/${directory}/${uniqueFilename}`
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error('Failed to process image');
  }
};

// Middleware for single image upload
const uploadSingle = (fieldName, directory = 'complaints') => {
  return async (req, res, next) => {
    upload.single(fieldName)(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ 
              error: 'File too large',
              message: 'Image must be smaller than 5MB'
            });
          }
        }
        return res.status(400).json({ 
          error: 'Upload failed',
          message: err.message 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          error: 'No image provided',
          message: 'Please select an image to upload'
        });
      }

      try {
        // Process the uploaded image
        const filename = `${fieldName}_${req.user?.id || 'anonymous'}`;
        const imageData = await processImage(req.file.buffer, filename, directory);
        
        // Attach processed image data to request
        req.processedImage = imageData;
        next();
      } catch (error) {
        console.error('Image processing error:', error);
        res.status(500).json({ 
          error: 'Image processing failed',
          message: error.message 
        });
      }
    });
  };
};

// Check for duplicate images
const checkDuplicateImage = async (hash) => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const existingComplaint = await prisma.complaint.findUnique({
      where: { imageHash: hash },
      select: { id: true, title: true, createdAt: true }
    });
    
    return existingComplaint;
  } catch (error) {
    console.error('Duplicate check error:', error);
    return null;
  }
};

module.exports = {
  uploadSingle,
  processImage,
  checkDuplicateImage
};