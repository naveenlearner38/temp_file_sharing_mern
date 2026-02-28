import express, { Request, Response } from 'express';
import File from '../models/file.model';
import { upload, deleteFromS3 } from '../services/s3.service';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Upload File
router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileData = req.file as any;
    const cfDomain = process.env.CLOUDFRONT_DOMAIN;
    
    // Construct CloudFront URL
    const cfUrl = `${cfDomain}/${fileData.key}`;

    const newFile = new File({
      filename: fileData.key,
      originalName: fileData.originalname,
      mimeType: fileData.mimetype,
      size: fileData.size,
      s3Key: fileData.key,
      s3Url: fileData.location,
      cfUrl: cfUrl,
    });

    await newFile.save();

    res.status(201).json({
      message: 'File uploaded successfully',
      file: newFile
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get File Info
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found or expired' });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
