import React, { useState, useRef, useEffect } from 'react'; // <--- FIX: Added useEffect
import { X, Upload, Check, Image, Video, FileImage, Copy, Share2, AlertCircle, File } from 'lucide-react';
import { filesAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';

// --- Reusable Input Component ---
const InputGroup = ({ label, as = 'input', rows, infoText, ...props }) => {
  const InputComponent = as;
  // **ESLint Fix:** Call useId unconditionally at the top level.
  const inputId = React.useId();
  // Use provided id/name if available, otherwise fallback to generated ID
  const elementId = props.id || props.name || inputId;

  return (
    <div className="form-group">
      <label htmlFor={elementId}>{label}</label> {/* Associate label */}
      <InputComponent rows={rows} {...props} id={elementId} />
      {infoText && <small className="info-text">{infoText}</small>}
      {/* Removed <style jsx> block */}
    </div>
  );
};

// --- Reusable FileType Button ---
const FileTypeBtn = ({ icon, label, active, onClick }) => (
    <button type="button" className={`file-type-btn ${active ? 'active' : ''}`} onClick={onClick} aria-pressed={active}>
        {icon} {label}
        <style jsx>{`
          .file-type-btn {
            padding: 0.75rem; background: var(--bg-primary);
            border: 1px solid var(--border-color); border-radius: 10px;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; gap: 0.5rem;
            color: var(--text-secondary); font-weight: 600; font-size: 0.9rem;
            transition: all 0.2s;
          }
          .file-type-btn:hover {
            border-color: var(--text-primary); color: var(--text-primary);
          }
          .file-type-btn.active {
            border-color: var(--accent); background: var(--accent-light);
            color: var(--accent);
          }
          .file-type-btn:focus-visible { /* Accessibility focus */
             outline: 2px solid var(--accent);
             outline-offset: 2px;
          }
        `}</style>
    </button>
);


// --- Main Upload Modal Component ---
const UploadModal = ({ onClose }) => {
  const { user } = useAuth(); // Get authenticated user info
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileType, setFileType] = useState('');
  const [formData, setFormData] = useState({ title: '', description: '', tags: '', uploaderName: '' }); // Added uploaderName
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedFileResults, setUploadedFileResults] = useState([]); // Array of { name, link, error, success, title }
  const [overallProgress, setOverallProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const ALLOWED_EXTENSIONS = {
    images: 'image/png, image/jpeg, image/webp',
    videos: 'video/mp4, video/webm',
    gifs: 'image/gif',
  };

  // Set initial uploader name if user is logged in
  useEffect(() => {
    if (user && !formData.uploaderName) {
      setFormData(prev => ({ ...prev, uploaderName: user.username }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Run only when user context changes


  const handleFilesSelect = (e) => {
    console.log("handleFilesSelect triggered");
    const files = e.target.files || e.dataTransfer?.files;
    if (!files || files.length === 0) {
        console.log("No files selected.");
        return;
    }
    const newFilesArray = Array.from(files); // Convert FileList to Array
    console.log("Files selected:", newFilesArray.length, newFilesArray.map(f => f.name));

    if (!fileType) {
      toast.info('Please select a file type first.');
      if (e.target?.value) e.target.value = null; // Clear input
      return;
    }

    const allowedMimeTypes = ALLOWED_EXTENSIONS[fileType].split(',').map(t => t.trim());
    const maxSizeMB = 100; // Example: 100MB limit
    const validFiles = [];
    const invalidFiles = [];

    newFilesArray.forEach(file => {
      // Robust name check before split
      const fileName = file.name || ''; // Default to empty string if name is undefined
      const isValidType = allowedMimeTypes.some(mime =>
        mime.endsWith('/*') ? file.type.startsWith(mime.slice(0, -1)) : file.type === mime
      );
      const isValidSize = file.size <= maxSizeMB * 1024 * 1024;

      if (isValidType && isValidSize) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ name: fileName, type: file.type, size: file.size, reason: !isValidType ? 'Type' : 'Size' });
      }
    });

    if (invalidFiles.length > 0) {
        invalidFiles.forEach(invalid => {
            const reasonMsg = invalid.reason === 'Type' ? `Invalid type (${invalid.type || 'unknown'}) for '${fileType}'` : `File too large (Max ${maxSizeMB}MB)`;
            toast.error(`${invalid.name || 'Unnamed file'}: ${reasonMsg}`, { autoClose: 5000 });
        });
    }

    // Append only new valid files, avoiding duplicates by name and size (basic check)
    setSelectedFiles(prev => {
        const existingSignatures = new Set(prev.map(f => `${f.name}-${f.size}`));
        const newlyAdded = validFiles.filter(vf => !existingSignatures.has(`${vf.name}-${vf.size}`));
        return [...prev, ...newlyAdded];
    });

    // Auto-fill title only if empty and only ONE new valid file added
    if (!formData.title && validFiles.length === 1 && selectedFiles.length === 0) {
      const firstFileName = validFiles[0].name || '';
      setFormData((prev) => ({
        ...prev,
        title: firstFileName.split('.').slice(0, -1).join('.') || firstFileName,
      }));
    }

    if (e.target?.value) e.target.value = null; // Clear input value
  };

  const removeFile = (indexToRemove) => {
    const removedFileName = selectedFiles[indexToRemove]?.name || '';
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
     // Clear title if removing the only file and title was potentially auto-filled from it
     if(selectedFiles.length === 1 && formData.title === (removedFileName.split('.').slice(0,-1).join('.') || removedFileName)){
         setFormData(prev => ({...prev, title: ''}));
     }
  };

  // --- MODIFIED handleSubmit for Batch Upload ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit triggered");
    if (selectedFiles.length === 0 || !fileType || uploading) {
      console.warn("Submit prevented:", { uploading, filesCount: selectedFiles.length, fileType });
      return;
    }

    setUploading(true);
    setOverallProgress(0);
    setUploadedFileResults([]);
    const isBatchUpload = selectedFiles.length > 1;
    console.log(`Starting upload process for ${selectedFiles.length} file(s)... Batch: ${isBatchUpload}`);

    // --- Step 1: Prepare Metadata Payload ---
    const filesMetadata = selectedFiles.map((file, index) => {
      const baseTitle = formData.title.trim() || file.name.split('.').slice(0, -1).join('.') || file.name;
      const fileTitle = isBatchUpload ? `${baseTitle} (${index + 1})` : baseTitle;
      return {
        originalIndex: index, file_name: file.name, file_type: fileType,
        file_extension: file.name.split('.').pop()?.toLowerCase() || '', file_size: file.size,
        title: fileTitle, description: formData.description.trim(),
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        uploaded_by: formData.uploaderName.trim() || user?.username || 'Anonymous',
      };
    });
    const uploadPayload = isBatchUpload ? { files: filesMetadata } : filesMetadata[0];

    try {
      // --- Step 2: Get Presigned URL(s) ---
      console.log("Requesting upload URL(s)...", uploadPayload);
      setOverallProgress(10);
      const urlResponse = await filesAPI.upload(uploadPayload); // Use the unified endpoint
      console.log("URL response:", urlResponse.data);
      if (!urlResponse.data?.success) throw new Error(urlResponse.data?.message || "Failed to initiate upload(s).");

      let batchResultsData = [];
      if (urlResponse.data?.isBatch && Array.isArray(urlResponse.data.results)) {
          batchResultsData = urlResponse.data.results;
      } else if (!urlResponse.data?.isBatch && urlResponse.data?.upload_url && urlResponse.data?.file_id) {
          batchResultsData = [{ originalIndex: 0, success: true, ...urlResponse.data }];
      } else {
          throw new Error("Invalid URL response format from upload endpoint.");
      }
      setOverallProgress(20);

      // --- Initialize Results ---
      const preliminaryResults = filesMetadata.map((meta) => {
          const backendResult = batchResultsData.find(r => r.originalIndex === meta.originalIndex);
          return {
              originalIndex: meta.originalIndex, name: meta.file_name, title: meta.title,
              success: !backendResult?.error && !!backendResult?.upload_url,
              link: backendResult?.share_link || null, error: backendResult?.error || null,
              file_id: backendResult?.file_id || null, upload_url: backendResult?.upload_url || null
          };
      });

      // --- Step 3: Upload to S3 ---
      console.log("Starting parallel S3 uploads...");
      let individualProgress = {};
      const filesToUpload = preliminaryResults.filter(r => r.success);
      const totalUploadFiles = filesToUpload.length;

      const updateBatchProgress = () => {
          if (totalUploadFiles === 0) { setOverallProgress(90); return; }
          const currentTotalProgress = Object.values(individualProgress).reduce((sum, p) => sum + p, 0);
          const scaledProgress = 20 + Math.round((currentTotalProgress / (totalUploadFiles * 100)) * 70);
          setOverallProgress(Math.min(90, scaledProgress));
      };

      filesToUpload.forEach(result => { individualProgress[result.originalIndex] = 0; });
      updateBatchProgress();

      const uploadPromises = filesToUpload.map(result => {
        const originalFile = selectedFiles[result.originalIndex];
        return filesAPI.uploadToS3(result.upload_url, originalFile, (percent) => {
          individualProgress[result.originalIndex] = percent; updateBatchProgress();
        }).then(() => {
          console.log(`S3 Upload success for: ${originalFile.name}`);
          individualProgress[result.originalIndex] = 100; updateBatchProgress();
        }).catch(s3Error => {
          console.error(`S3 Upload failed for ${originalFile.name}:`, s3Error);
          result.success = false; result.error = "S3 upload failed.";
          individualProgress[result.originalIndex] = 100; updateBatchProgress();
          return Promise.reject(s3Error); // Let allSettled know
        });
      });
      await Promise.allSettled(uploadPromises);
      console.log("All S3 uploads settled.");
      setOverallProgress(90);

      // --- Step 4: Confirm Upload ---
      const successfulUploadIds = preliminaryResults.filter(r => r.success && r.file_id).map(r => r.file_id);
      let finalResults = preliminaryResults;

      if (successfulUploadIds.length > 0) {
        console.log("Confirming uploads with backend:", successfulUploadIds);
        const confirmPayload = isBatchUpload ? { file_ids: successfulUploadIds } : { file_id: successfulUploadIds[0] };

        try {
          const confirmResponse = await filesAPI.confirmUpload(confirmPayload);
          console.log("Confirm response:", confirmResponse.data);

          if (confirmResponse.data?.isBatch && Array.isArray(confirmResponse.data.results)) {
              // Batch confirmation
              confirmResponse.data.results.forEach(confResult => {
                  const idx = finalResults.findIndex(r => r.file_id === confResult.file_id);
                  if (idx > -1) {
                      if (!confResult.success) {
                          if(finalResults[idx].success) finalResults[idx].error = confResult.error || "Confirmation failed.";
                      } else if (confResult.file) {
                          // **FIX**: Use the share_link from the *backend's* final confirmation
                          // (though it might be the same as the one from /upload)
                          // We primarily trust the 'link' from the preliminary results
                          // but can overwrite if the confirm response sends a new one
                          if(confResult.share_link) {
                              finalResults[idx].link = confResult.share_link;
                          }
                      }
                  }
              });
          } else if (!confirmResponse.data?.isBatch && confirmResponse.data?.success && confirmResponse.data?.file) {
              // Single confirmation
              const idx = finalResults.findIndex(r => r.file_id === confirmResponse.data.file_id);
              if (idx > -1) {
                  // **FIX**: Use the share_link from the backend's final confirmation
                  finalResults[idx].link = confirmResponse.data.share_link || finalResults[idx].link;
              }
          } else if (!confirmResponse.data?.success) {
              // General failure
              successfulUploadIds.forEach(id => { const idx = finalResults.findIndex(r => r.file_id === id); if(idx > -1 && finalResults[idx].success) { finalResults[idx].error = "Confirmation step failed."; }});
              console.warn("Confirmation step indicated potential issues.");
          }

        } catch (confirmError) {
          console.error("Confirmation API call failed:", confirmError);
          toast.error("Failed to finalize upload(s) on server.");
          successfulUploadIds.forEach(id => { const idx = finalResults.findIndex(r => r.file_id === id); if(idx > -1 && finalResults[idx].success) { finalResults[idx].error = "Confirmation API failed."; }});
        }
      } else {
        console.log("No successful S3 uploads to confirm.");
      }
      setOverallProgress(100);

      // --- Step 5: Set Final State ---
      console.log("Final upload results:", finalResults);
      setUploadedFileResults(finalResults);
      setUploadComplete(true);
      setSelectedFiles([]);
      toast.info('Upload process finished. Check summary.');

    } catch (error) {
      console.error('Upload Process Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed.';
      toast.error(errorMessage);
      setOverallProgress(0);
      setUploadedFileResults(selectedFiles.map(f => ({ name: f.name, success: false, error: errorMessage })));
      setUploadComplete(true);
    } finally {
      setUploading(false);
    }
  };


  const handleCopyLink = (link) => {
      if (!link) return;
      navigator.clipboard.writeText(link);
      toast.success('Link copied!');
  };

  const handleShare = async (title, link) => {
      if (!link) return;
      if (!navigator.share) {
          handleCopyLink(link); // Fallback
          return;
      }
      try {
          await navigator.share({ title: title || 'Shared File', url: link });
      } catch (error) {
          if (error.name !== 'AbortError') {
              console.error("Share failed:", error);
              toast.error("Could not share link.");
          }
      }
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setFileType('');
    setFormData({ title: '', description: '', tags: '', uploaderName: user?.username || '' }); // Reset uploader name
    setUploadComplete(false);
    setUploadedFileResults([]);
    setOverallProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="upload-modal-title">
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="upload-modal-title">{uploadComplete ? 'Upload Summary' : 'Upload Files'}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close modal"><X size={20} /></button>
        </div>

        {!uploadComplete ? (
          <form onSubmit={handleSubmit} className="upload-form">
            {/* --- File Type --- */}
            {!selectedFiles.length && (
                 <fieldset className="form-group">
                    <legend>1. Select File Type</legend>
                    <div className="file-type-grid">
                      <FileTypeBtn icon={<Image size={20} />} label="Image" active={fileType === 'images'} onClick={() => setFileType('images')} />
                      <FileTypeBtn icon={<Video size={20} />} label="Video" active={fileType === 'videos'} onClick={() => setFileType('videos')} />
                      <FileTypeBtn icon={<FileImage size={20} />} label="GIF" active={fileType === 'gifs'} onClick={() => setFileType('gifs')} />
                    </div>
                </fieldset>
             )}
             {selectedFiles.length > 0 && (
                <div className="selected-type-display">Selected Type: <strong>{fileType}</strong></div>
             )}

            {/* --- Drop Zone --- */}
            <div className="form-group">
              <label htmlFor="file-input-field">{selectedFiles.length === 0 ? '2. Choose File(s)' : 'Add More Files'}</label>
              <div
                className={`file-drop-zone ${dragOver ? 'drag-over' : ''} ${!fileType ? 'disabled' : ''}`}
                onClick={() => fileType && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); handleFilesSelect(e); }}
                role="button" tabIndex={fileType ? 0 : -1} aria-disabled={!fileType}
              >
                <Upload size={32} aria-hidden="true"/>
                <p>Click to browse or drag & drop</p>
                <small>{fileType ? `Accepted: ${ALLOWED_EXTENSIONS[fileType]}` : 'Select a type first'}</small>
              </div>
              <input id="file-input-field" ref={fileInputRef} type="file" accept={fileType ? ALLOWED_EXTENSIONS[fileType] : ''} onChange={handleFilesSelect} style={{ display: 'none' }} disabled={!fileType} multiple />

              {/* --- File List Preview --- */}
              {selectedFiles.length > 0 && (
                  <div className="file-list-preview">
                    <p>{selectedFiles.length} file(s) selected:</p>
                    <ul>
                      {selectedFiles.map((file, index) => (
                        <li key={`${file.name}-${file.lastModified}-${index}`}>
                          <File size={14} className="file-icon"/>
                          <span className="file-name" title={file.name}>{file.name}</span>
                          <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          <button type="button" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}>
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
              )}
            </div>

            {/* --- Details --- */}
            {selectedFiles.length > 0 && (
              <>
                <InputGroup id="file-title" label={`Title ${selectedFiles.length > 1 ? '(Optional Prefix)' : ''}`} type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Title (e.g., Vacation Photos)" infoText={selectedFiles.length > 1 ? 'Index (1), (2)... will be added automatically if needed.' : ''} required={selectedFiles.length === 1 && !formData.title.trim()} />
                <InputGroup id="file-description" label="Description (Optional, applies to all)" as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Add a description..." />
                <InputGroup id="file-tags" label="Tags (Optional, comma separated, applies to all)" type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="nature, trip, friends..." />
                {/* --- Optional Uploader Name --- */}
                <InputGroup id="uploader-name" label="Your Name (Optional)" type="text" value={formData.uploaderName} onChange={(e) => setFormData({ ...formData, uploaderName: e.target.value })} placeholder={user?.username || "Your name..."} infoText="Leave blank for Anonymous or use your username." />
              </>
            )}

            {/* --- Progress --- */}
            {uploading && (
              <div className="upload-progress-section">
                 <p className="progress-label">Uploading {selectedFiles.length > 1 ? `${selectedFiles.length} files` : 'file'}... {overallProgress}%</p>
                 <div className="progress-bar" role="progressbar" aria-valuenow={overallProgress} aria-valuemin="0" aria-valuemax="100" aria-label="Overall upload progress">
                   <div className="progress-fill" style={{ width: `${overallProgress}%` }}></div>
                 </div>
              </div>
            )}

            {/* --- Submit --- */}
            <button type="submit" className="btn btn-primary" disabled={uploading || selectedFiles.length === 0 || !fileType} style={{ width: '100%', marginTop: '0.5rem' }}>
              {uploading ? `Uploading... ${overallProgress}%` : `Upload ${selectedFiles.length} File(s)`}
            </button>
          </form>
        ) : (
           // --- Success/Summary Screen ---
          <div className="success-screen">
             <div className={`summary-icon ${uploadedFileResults.every(r => r.success) ? 'all-success' : 'has-errors'}`}>
               {uploadedFileResults.every(r => r.success) ? <Check size={32} /> : <AlertCircle size={32} />}
             </div>
             <h3>Upload Summary</h3>
             <p className="summary-message">
               {uploadedFileResults.filter(r => r.success).length} of {uploadedFileResults.length} file(s) processed.
             </p>
             {/* Results List */}
             {uploadedFileResults.length > 0 && (
                <div className="results-list">
                    {uploadedFileResults.map((result, index) => (
                      <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                        <span className="result-icon">{result.success ? <Check size={16} /> : <X size={16}/>}</span>
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
             <button className="btn btn-secondary" onClick={resetForm} style={{ width: '100%', marginTop: '1rem' }}>Upload More Files</button>
          </div>
        )}
      </div>

      <style jsx>{`
        /* --- Modal Base --- */
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 1rem; animation: fadeIn 0.2s ease;
        }
        .upload-modal {
          background: var(--bg-secondary); border-radius: 16px; max-width: 550px;
          width: 100%; max-height: 90vh; /* Use max-height */
          border: 1px solid var(--border-color); box-shadow: var(--shadow-lg);
          animation: scaleIn 0.3s ease; display: flex; flex-direction: column; /* Crucial for scrolling */
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color);
          flex-shrink: 0; /* Prevent header shrinking */
        }
        .modal-header h2 { font-size: 1.25rem; font-weight: 600; margin: 0; }
        .close-btn {
          background: none; border: none; width: 32px; height: 32px;
          border-radius: 50%; cursor: pointer; color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .close-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

        /* --- Form --- */
        /* Make form scrollable, not the whole modal */
        .upload-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; overflow-y: auto; flex-grow: 1; }
        fieldset.form-group { border: none; padding: 0; margin: 0; }
        fieldset.form-group legend { font-weight: 600; color: var(--text-primary); font-size: 0.85rem; padding-left: 0.25rem; margin-bottom: 0.5rem; width: auto; }
        /* InputGroup styles handle inputs/textareas via global CSS now */

        .selected-type-display {
           font-size: 0.9rem; color: var(--text-secondary); padding: 0.5rem;
           background: var(--bg-hover); border-radius: 8px; border: 1px solid var(--border-color);
           text-align: center; font-weight: 500;
        }

        /* --- File Type --- */
        .file-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
        /* FileTypeBtn styles in component */

        /* --- Drop Zone --- */
        .file-drop-zone {
           border: 2px dashed var(--border-color); border-radius: 12px;
           padding: 1.5rem 1rem; text-align: center;
           cursor: pointer; transition: all 0.2s; background: var(--bg-primary);
        }
        .file-drop-zone.disabled { cursor: not-allowed; opacity: 0.6; pointer-events: none; }
        .file-drop-zone:not(.disabled):hover,
        .file-drop-zone.drag-over { border-color: var(--accent); background: var(--accent-light); }
        .file-drop-zone svg { color: var(--text-tertiary); margin-bottom: 0.5rem; }
        .file-drop-zone p { font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; font-size: 0.95rem; }
        .file-drop-zone small { color: var(--text-secondary); font-size: 0.8rem; }

        /* --- File List Preview --- */
        .file-list-preview {
           margin-top: 0.75rem; padding: 0.75rem; background: var(--bg-primary);
           border: 1px solid var(--border-color); border-radius: 8px;
           max-height: 150px; overflow-y: auto;
        }
        .file-list-preview p { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }
        .file-list-preview ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
        .file-list-preview li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); }
        .file-list-preview .file-icon { color: var(--text-tertiary); flex-shrink: 0; }
        .file-list-preview .file-name { flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-primary); }
        .file-list-preview .file-size { flex-shrink: 0; font-size: 0.75rem; margin-left: 0.5rem; }
        .file-list-preview button { background: none; border: none; cursor: pointer; color: var(--error); padding: 0.25rem; display: flex; align-items: center; margin-left: auto; flex-shrink: 0; border-radius: 50%; }
        .file-list-preview button:hover { background-color: var(--bg-hover); }


        /* --- Progress Bar --- */
        .upload-progress-section { margin-top: 0.5rem; }
        .progress-label { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
        .progress-bar { width: 100%; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden; margin-top: 0.25rem; }
        .progress-fill { height: 100%; background: var(--accent); transition: width 0.3s ease-out; }

        /* --- Success Screen --- */
        /* Make success screen scrollable if results list is long */
        .success-screen { padding: 1.5rem; text-align: center; display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; flex-grow: 1; }
        .summary-icon {
          width: 50px; height: 50px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 0.75rem; color: white;
          animation: scaleIn 0.5s ease; flex-shrink: 0;
        }
        .summary-icon.all-success { background: var(--success); }
        .summary-icon.has-errors { background: var(--error); }
        .success-screen h3 { font-size: 1.3rem; font-weight: 600; margin-bottom: 0.25rem; flex-shrink: 0; }
        .summary-message { color: var(--text-secondary); margin-bottom: 1rem; font-size: 0.9rem; flex-shrink: 0; }
        .results-list {
           max-height: 250px; /* Increased max height */ overflow-y: auto; border: 1px solid var(--border-color);
           border-radius: 8px; background: var(--bg-primary); padding: 0.5rem;
           display: flex; flex-direction: column; gap: 0.5rem; text-align: left;
           flex-shrink: 1;
        }
        .result-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 6px; font-size: 0.85rem; }
        .result-item.success { background-color: var(--accent-light); }
        .result-item.error { background-color: rgba(239, 68, 68, 0.1); }
        .result-icon { flex-shrink: 0; display: flex; align-items: center; }
        .result-item.success .result-icon { color: var(--success); }
        .result-item.error .result-icon { color: var(--error); }
        .result-name { flex-grow: 1; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 0.5rem; }
        .result-actions { display: flex; gap: 0.5rem; margin-left: auto; flex-shrink: 0; }
        .result-actions button { background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 0.25rem; display: flex; border-radius: 4px; }
        .result-actions button:hover { color: var(--accent); background-color: rgba(0,0,0,0.05);}
        [data-theme="dark"] .result-actions button:hover { background-color: rgba(255,255,255,0.1);}
        .result-error { font-size: 0.8rem; color: var(--error); margin-left: auto; font-weight: 500; cursor: help; flex-shrink: 0; white-space: nowrap; }

        /* Media Query adjustments */
        @media (max-width: 480px) {
           .upload-form { padding: 1rem; gap: 1rem; }
           .file-type-grid { grid-template-columns: 1fr; }
           .file-drop-zone { padding: 1.5rem 1rem; }
           .success-actions { grid-template-columns: 1fr; }
           .modal-header { padding: 0.75rem 1rem; }
           .modal-header h2 { font-size: 1.1rem; }
           .results-list { max-height: 150px; }
        }
      `}</style>
    </div>
  );
};

export default UploadModal;