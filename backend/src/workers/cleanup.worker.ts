import cron from 'node-cron';
import File from '../models/file.model';
import { deleteFromS3 } from '../services/s3.service';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Worker to cleanup S3 orphans.
 * MongoDB TTL deletes the record after 10 mins, but we need to delete the S3 object.
 * We can either use S3 Lifecycle policies OR a background worker.
 * A worker is more real-time for this requirement.
 */
export const startCleanupWorker = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    console.log('Running cleanup worker...');
    try {
      // 1. List all files in S3 uploads/ folder
      const command = new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Prefix: 'uploads/',
      });

      const response = await s3.send(command);
      
      if (!response.Contents) return;

      for (const item of response.Contents) {
        if (!item.Key) continue;

        // 2. Check if this key exists in DB
        const fileExists = await File.findOne({ s3Key: item.Key });

        if (!fileExists) {
          // 3. If not in DB, it was likely deleted by TTL index, so delete from S3
          console.log(`Oprhan detected in S3: ${item.Key}. Deleting...`);
          await deleteFromS3(item.Key);
        }
      }
    } catch (error) {
      console.error('Cleanup worker error:', error);
    }
  });
};
