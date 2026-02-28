import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, File as FileIcon, X, Check, Copy, Clock, Loader2 } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api/files';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setUploadProgress(percentCompleted);
        },
      });

      setUploadedFile(response.data.file);
      setUploading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to upload file. Please try again.');
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (uploadedFile) {
      navigator.clipboard.writeText(uploadedFile.cfUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setFile(null);
    setUploadedFile(null);
    setUploadProgress(0);
    setError(null);
  };

  return (
    <div className="container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl mb-4"><span className="gradient-text">Cloud Share</span></h1>
        <p className="text-secondary opacity-70">Secure, temporary file sharing. Files vanish after 10 minutes.</p>
      </motion.div>

      <div className="glass w-full max-w-xl p-8">
        <AnimatePresence mode="wait">
          {!uploadedFile ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div 
                className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <UploadIcon className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  {file ? file.name : 'Click or drag file to upload'}
                </p>
                <p className="text-sm opacity-50">Support any file type up to 100MB</p>
              </div>

              {file && !uploading && (
                <div className="flex justify-center gap-4">
                  <button className="btn" onClick={handleUpload}>
                    Upload File
                  </button>
                  <button className="btn" style={{ background: '#334155' }} onClick={() => setFile(null)}>
                    <X className="w-4 h-4" /> Clear
                  </button>
                </div>
              )}

              {uploading && (
                <div className="w-full">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Uploading...</span>
                    <span className="text-sm">{uploadProgress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-error text-sm mt-4 text-center">{error}</div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="file-preview"
            >
              <div className="mb-8">
                <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-success" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Upload Complete!</h2>
                <p className="opacity-60">Share this link with your recipient</p>
              </div>

              <div className="copy-box">
                <code className="text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                  {uploadedFile.cfUrl}
                </code>
                <button 
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <div className="expiry-timer">
                <Clock className="w-4 h-4" />
                <span>Expires in 10 minutes</span>
              </div>

              <button 
                className="btn mt-8 bg-transparent border border-border hover:bg-slate-700"
                onClick={reset}
              >
                Upload another file
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-12 flex gap-12 opacity-40 grayscale hover:grayscale-0 transition-all">
        <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" alt="AWS" className="h-8" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/MongoDB_Logo.svg" alt="MongoDB" className="h-8" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React" className="h-8" />
      </div>
    </div>
  );
};

export default App;
