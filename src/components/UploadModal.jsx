import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { X, Upload, Check, Image, Video, FileImage, Copy, Share2, AlertCircle, File } from 'lucide-react';
import { filesAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';

const FileTypeBtn = memo(({ icon, label, active, onClick }) => (
  <button type="button" className={`file-type-btn ${active ? 'active' : ''}`} onClick={onClick} aria-pressed={active}>
    {icon} {label}
    <style jsx>{`
      .file-type-btn { padding: 0.75rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--text-secondary); font-weight: 600; font-size: 0.9375rem; transition: all 0.2s; }
      .file-type-btn:hover { border-color: var(--accent); color: var(--text-primary); }
      .file-type-btn.active { border-color: var(--accent); background: var(--accent-light); color: var(--accent); }
    `}</style>
  </button>
));

FileTypeBtn.displayName = 'FileTypeBtn';

const UploadModal = ({ onClose }) => {
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileType, setFileType] = useState('');
  const [formData, setFormData] = useState({ title: '', description: '', tags: '', uploaderName: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedFileResults, setUploadedFileResults] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const ALLOWED_EXTENSIONS = {
    images: 'image/png, image/jpeg, image/webp',
    videos: 'video/mp4, video/webm, video/quicktime',
    gifs: 'image/gif',
    documents: 'application/pdf, text/plain, text/csv, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };

  const MAX_FILE_SIZES_MB = { images: 10, videos: 100, gifs: 10, documents: 10 };

  useEffect(() => {
    if (user && !formData.uploaderName) {
      setFormData(prev => ({ ...prev, uploaderName: user.username }));
    }
  }, [user, formData.uploaderName]);

  const handleFilesSelect = useCallback((e) => {
    const files = e.target.files || e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    
    if (!fileType) {
      toast.info('Please select a file type first.');
      if (e.target?.value) e.target.value = null;
      return;
    }

    const allowedMimeTypes = ALLOWED_EXTENSIONS[fileType].split(',').map(t => t.trim());
    const maxSizeMB = MAX_FILE_SIZES_MB[fileType] || 10;
    const validFiles = [];

    Array.from(files).forEach(file => {
      const isValidType = allowedMimeTypes.some(mime => mime.endsWith('/*') ? file.type.startsWith(mime.slice(0, -1)) : file.type === mime);
      const isValidSize = file.size <= maxSizeMB * 1024 * 1024;
      if (isValidType && isValidSize) validFiles.push(file);
      else toast.error(`${file.name}: ${!isValidType ? 'Invalid type' : `Too large (Max ${maxSizeMB}MB)`}`);
    });

    setSelectedFiles(prev => {
      const existingSignatures = new Set(prev.map(f => `${f.name}-${f.size}`));
      return [...prev, ...validFiles.filter(vf => !existingSignatures.has(`${vf.name}-${vf.size}`))];
    });

    if (!formData.title && validFiles.length === 1 && selectedFiles.length === 0) {
      setFormData(prev => ({ ...prev, title: validFiles[0].name.split('.').slice(0, -1).join('.') || validFiles[0].name }));
    }

    if (e.target?.value) e.target.value = null;
  }, [fileType, formData.title, selectedFiles.length, ALLOWED_EXTENSIONS, MAX_FILE_SIZES_MB]);

  const removeFile = useCallback((indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !fileType || uploading) return;

    setUploading(true);
    setOverallProgress(0);
    const isBatchUpload = selectedFiles.length > 1;

    const filesMetadata = selectedFiles.map((file, index) => {
      const baseTitle = formData.title.trim() || file.name.split('.').slice(0, -1).join('.') || file.name;
      return {
        originalIndex: index,
        file_name: file.name,
        file_type: fileType,
        file_extension: file.name.split('.').pop()?.toLowerCase() || '',
        file_size: file.size,
        title: isBatchUpload ? `${baseTitle} (${index + 1})` : baseTitle,
        description: formData.description.trim(),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        uploaded_by: formData.uploaderName.trim() || user?.username || 'Anonymous',
      };
    });

    try {
      setOverallProgress(10);
      const uploadPayload = isBatchUpload ? { files: filesMetadata } : filesMetadata[0];
      const urlResponse = await filesAPI.upload(uploadPayload);

      if (!urlResponse.data?.success) throw new Error(urlResponse.data?.error || "Failed to initiate upload(s).");

      let batchResultsData = [];
      if (urlResponse.data.isBatch && Array.isArray(urlResponse.data.results)) {
        batchResultsData = urlResponse.data.results;
      } else if (urlResponse.data.results) {
        batchResultsData = Array.isArray(urlResponse.data.results) ? urlResponse.data.results : [urlResponse.data.results];
      } else {
        throw new Error("Invalid response format");
      }

      const preliminaryResults = filesMetadata.map((meta) => {
        const backendResult = isBatchUpload 
          ? batchResultsData.find(r => r.originalIndex === meta.originalIndex)
          : batchResultsData.find(r => r.originalIndex === null || r.originalIndex === undefined || r.originalIndex === meta.originalIndex) || batchResultsData[0];
        return {
          originalIndex: meta.originalIndex,
          name: meta.file_name,
          title: meta.title,
          success: !backendResult?.error && !!backendResult?.upload_url,
          link: backendResult?.share_link || null,
          file_id: backendResult?.file_id || null,
          upload_url: backendResult?.upload_url || null,
          error: backendResult?.error || null
        };
      });

      setOverallProgress(20);

      const filesToUpload = preliminaryResults.filter(r => r.success);
      let individualProgress = {};
      filesToUpload.forEach(result => { individualProgress[result.originalIndex] = 0; });

      const updateBatchProgress = () => {
        const currentTotalProgress = Object.values(individualProgress).reduce((sum, p) => sum + p, 0);
        const scaledProgress = 20 + Math.round((currentTotalProgress / (filesToUpload.length * 100)) * 70);
        setOverallProgress(Math.min(90, scaledProgress));
      };

      const uploadPromises = filesToUpload.map(result => {
        const originalFile = selectedFiles[result.originalIndex];
        return filesAPI.uploadToS3(result.upload_url, originalFile, (percent) => {
          individualProgress[result.originalIndex] = percent;
          updateBatchProgress();
        }).catch(() => {
          result.success = false;
          result.error = "S3 upload failed";
        });
      });

      await Promise.allSettled(uploadPromises);
      setOverallProgress(90);

      const successfulUploadIds = preliminaryResults.filter(r => r.success && r.file_id).map(r => r.file_id);
      if (successfulUploadIds.length > 0) {
        const confirmPayload = isBatchUpload ? { file_ids: successfulUploadIds } : { file_id: successfulUploadIds[0] };
        await filesAPI.confirmUpload(confirmPayload);
      }

      setOverallProgress(100);
      setUploadedFileResults(preliminaryResults);
      setUploadComplete(true);
      setSelectedFiles([]);
      toast.success('Upload completed successfully!');
      
      // Refresh page after 2 seconds to show new uploads
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Upload Error:', error);
      toast.error(error.response?.data?.message || error.message || 'Upload failed.');
      setUploadedFileResults(selectedFiles.map(f => ({ name: f.name, success: false, error: 'Upload failed' })));
      setUploadComplete(true);
    } finally {
      setUploading(false);
    }
  }, [selectedFiles, fileType, uploading, formData, user]);

  const handleCopyLink = useCallback((link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast.success('Link copied!');
  }, []);

  const handleShare = useCallback(async (title, link) => {
    if (!link) return;
    if (!navigator.share) {
      handleCopyLink(link);
      return;
    }
    try {
      await navigator.share({ title: title || 'Shared File', url: link });
    } catch (error) {
      if (error.name !== 'AbortError') handleCopyLink(link);
    }
  }, [handleCopyLink]);

  const resetForm = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{uploadComplete ? 'Upload Summary' : 'Upload Files'}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close modal"><X size={20} /></button>
        </div>

        {!uploadComplete ? (
          <form onSubmit={handleSubmit} className="upload-form">
            {!selectedFiles.length && (
              <fieldset className="form-group">
                <legend>1. Select File Type</legend>
                <div className="file-type-grid">
                  <FileTypeBtn icon={<Image size={20} />} label="Image" active={fileType === 'images'} onClick={() => setFileType('images')} />
                  <FileTypeBtn icon={<Video size={20} />} label="Video" active={fileType === 'videos'} onClick={() => setFileType('videos')} />
                  <FileTypeBtn icon={<FileImage size={20} />} label="GIF" active={fileType === 'gifs'} onClick={() => setFileType('gifs')} />
                  <FileTypeBtn icon={<File size={20} />} label="Document" active={fileType === 'documents'} onClick={() => setFileType('documents')} />
                </div>
              </fieldset>
            )}

            {selectedFiles.length > 0 && <div className="selected-type-display">Selected Type: <strong>{fileType}</strong></div>}

            <div className="form-group">
              <label>{selectedFiles.length === 0 ? '2. Choose File(s)' : 'Add More Files'}</label>
              <div className={`file-drop-zone ${dragOver ? 'drag-over' : ''} ${!fileType ? 'disabled' : ''}`} onClick={() => fileType && fileInputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }} onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFilesSelect(e); }}>
                <Upload size={32} />
                <p>Click to browse or drag & drop</p>
                <small>{fileType ? `Accepted: ${ALLOWED_EXTENSIONS[fileType]}` : 'Select a type first'}</small>
              </div>
              <input ref={fileInputRef} type="file" accept={fileType ? ALLOWED_EXTENSIONS[fileType] : ''} onChange={handleFilesSelect} style={{ display: 'none' }} disabled={!fileType} multiple />

              {selectedFiles.length > 0 && (
                <div className="file-list-preview">
                  <p>{selectedFiles.length} file(s) selected:</p>
                  <ul>
                    {selectedFiles.map((file, index) => (
                      <li key={`${file.name}-${file.lastModified}-${index}`}>
                        <File size={14} className="file-icon" />
                        <span className="file-name" title={file.name}>{file.name}</span>
                        <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        <button type="button" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}><X size={14} /></button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {selectedFiles.length > 0 && (
              <>
                <div className="form-group">
                  <label>Title {selectedFiles.length > 1 && '(Optional Prefix)'}</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Title (e.g., Vacation Photos)" required={selectedFiles.length === 1 && !formData.title.trim()} />
                  {selectedFiles.length > 1 && <small className="info-text">Index (1), (2)... will be added automatically.</small>}
                </div>
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Add a description..." />
                </div>
                <div className="form-group">
                  <label>Tags (Optional, comma separated)</label>
                  <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="nature, trip, friends..." />
                </div>
                <div className="form-group">
                  <label>Your Name (Optional)</label>
                  <input type="text" value={formData.uploaderName} onChange={(e) => setFormData({ ...formData, uploaderName: e.target.value })} placeholder={user?.username || "Your name..."} />
                  <small className="info-text">Leave blank for Anonymous.</small>
                </div>
              </>
            )}

            {uploading && (
              <div className="upload-progress-section">
                <p className="progress-label">Uploading {selectedFiles.length > 1 ? `${selectedFiles.length} files` : 'file'}... {overallProgress}%</p>
                <div className="progress-bar" role="progressbar" aria-valuenow={overallProgress} aria-valuemin="0" aria-valuemax="100">
                  <div className="progress-fill" style={{ width: `${overallProgress}%` }}></div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={uploading || selectedFiles.length === 0 || !fileType} style={{ width: '100%', marginTop: '0.5rem' }}>
              {uploading ? `Uploading... ${overallProgress}%` : `Upload ${selectedFiles.length} File(s)`}
            </button>
          </form>
        ) : (
          <div className="success-screen">
            <div className={`summary-icon ${uploadedFileResults.every(r => r.success) ? 'all-success' : 'has-errors'}`}>
              {uploadedFileResults.every(r => r.success) ? <Check size={32} /> : <AlertCircle size={32} />}
            </div>
            <h3>Upload Summary</h3>
            <p className="summary-message">{uploadedFileResults.filter(r => r.success).length} of {uploadedFileResults.length} file(s) uploaded successfully.</p>
            {uploadedFileResults.length > 0 && (
              <div className="results-list">
                {uploadedFileResults.map((result, index) => (
                  <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                    <span className="result-icon">{result.success ? <Check size={16} /> : <X size={16} />}</span>
                    <span className="result-name" title={result.name}>{result.name}</span>
                    {result.success ? (
                      <div className="result-actions">
                        <button onClick={() => handleCopyLink(result.link)} title="Copy link"><Copy size={16} /></button>
                        {!!navigator.share && <button onClick={() => handleShare(result.title, result.link)} title="Share link"><Share2 size={16} /></button>}
                      </div>
                    ) : (
                      <span className="result-error" title={result.error || 'Unknown error'}>Failed</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-secondary" onClick={onClose} style={{ width: '100%', marginTop: '1rem' }}>Close</button>
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; animation: fadeIn 0.2s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .upload-modal { background: var(--bg-secondary); border-radius: var(--radius-lg); max-width: 550px; width: 100%; max-height: 90vh; border: 1px solid var(--border-color); box-shadow: var(--shadow-xl); animation: scaleIn 0.3s; display: flex; flex-direction: column; }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); flex-shrink: 0; }
        .modal-header h2 { font-size: 1.25rem; font-weight: 600; margin: 0; color: var(--text-primary); }
        .close-btn { background: none; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .close-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .upload-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; overflow-y: auto; flex-grow: 1; }
        fieldset.form-group { border: none; padding: 0; margin: 0; }
        fieldset.form-group legend { font-weight: 600; color: var(--text-primary); font-size: 0.875rem; margin-bottom: 0.5rem; }
        .selected-type-display { font-size: 0.9375rem; color: var(--text-secondary); padding: 0.75rem; background: var(--bg-hover); border-radius: var(--radius-md); text-align: center; font-weight: 500; }
        .file-type-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
        .file-drop-zone { border: 2px dashed var(--border-color); border-radius: var(--radius-md); padding: 1.5rem 1rem; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--bg-primary); }
        .file-drop-zone.disabled { cursor: not-allowed; opacity: 0.6; pointer-events: none; }
        .file-drop-zone:not(.disabled):hover, .file-drop-zone.drag-over { border-color: var(--accent); background: var(--accent-light); }
        .file-drop-zone svg { color: var(--text-tertiary); margin-bottom: 0.5rem; }
        .file-drop-zone p { font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; font-size: 0.9375rem; }
        .file-drop-zone small { color: var(--text-secondary); font-size: 0.8125rem; }
        .file-list-preview { margin-top: 0.75rem; padding: 0.75rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); max-height: 150px; overflow-y: auto; }
        .file-list-preview p { font-size: 0.8125rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }
        .file-list-preview ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
        .file-list-preview li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-secondary); }
        .file-list-preview .file-icon { color: var(--text-tertiary); flex-shrink: 0; }
        .file-list-preview .file-name { flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary); }
        .file-list-preview .file-size { flex-shrink: 0; font-size: 0.75rem; }
        .file-list-preview button { background: none; border: none; cursor: pointer; color: var(--error); padding: 0.25rem; display: flex; align-items: center; margin-left: auto; flex-shrink: 0; border-radius: 50%; }
        .file-list-preview button:hover { background-color: var(--bg-hover); }
        .upload-progress-section { margin-top: 0.5rem; }
        .progress-label { font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 0.5rem; text-align: center; }
        .progress-bar { width: 100%; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--accent); transition: width 0.3s; }
        .success-screen { padding: 1.5rem; text-align: center; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; flex-grow: 1; }
        .summary-icon { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; color: white; animation: scaleIn 0.5s; flex-shrink: 0; }
        .summary-icon.all-success { background: var(--success); }
        .summary-icon.has-errors { background: var(--error); }
        .success-screen h3 { font-size: 1.3rem; font-weight: 600; margin-bottom: 0.25rem; flex-shrink: 0; color: var(--text-primary); }
        .summary-message { color: var(--text-secondary); margin-bottom: 1rem; font-size: 0.9375rem; flex-shrink: 0; }
        .results-list { max-height: 250px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-primary); padding: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem; text-align: left; flex-shrink: 1; }
        .result-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: var(--radius-sm); font-size: 0.875rem; }
        .result-item.success { background-color: rgba(16, 185, 129, 0.1); }
        .result-item.error { background-color: rgba(239, 68, 68, 0.1); }
        .result-icon { flex-shrink: 0; display: flex; align-items: center; }
        .result-item.success .result-icon { color: var(--success); }
        .result-item.error .result-icon { color: var(--error); }
        .result-name { flex-grow: 1; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .result-actions { display: flex; gap: 0.5rem; margin-left: auto; flex-shrink: 0; }
        .result-actions button { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0.25rem; display: flex; border-radius: var(--radius-sm); transition: all 0.2s; }
        .result-actions button:hover { color: var(--accent); background-color: var(--accent-light); }
        .result-error { font-size: 0.8125rem; color: var(--error); margin-left: auto; font-weight: 500; flex-shrink: 0; }
        @media (max-width: 480px) { .upload-form { padding: 1rem; gap: 1rem; } .file-type-grid { grid-template-columns: repeat(2, 1fr); } .modal-header { padding: 0.75rem 1rem; } .modal-header h2 { font-size: 1.1rem; } }
      `}</style>
    </div>
  );
};

export default memo(UploadModal);
