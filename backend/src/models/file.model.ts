import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  s3Url: string;
  cfUrl: string;
  expiresAt: Date;
  createdAt: Date;
}

const FileSchema: Schema = new Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  s3Key: { type: String, required: true, unique: true },
  s3Url: { type: String, required: true },
  cfUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// TTL Index: expire after 600 seconds (10 minutes)
FileSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

export default mongoose.model<IFile>('File', FileSchema);
