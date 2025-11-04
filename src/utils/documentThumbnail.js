// ============================================
// 1. UTILITY FILE: utils/documentThumbnail.js
// ============================================

/**
 * Get appropriate thumbnail or preview for different document types
 * Handles PDF, Word, PowerPoint, Excel, and other document formats
 */
export const getDocumentThumbnail = (file) => {
  // If file already has a thumbnail_url from backend, use it
  if (file.thumbnail_url) {
    return file.thumbnail_url;
  }

  // If file is not a document, return original URL
  if (file.file_type !== 'documents') {
    return file.file_url || '/placeholder-image.jpg';
  }

  const fileUrl = file.file_url || '';
  const fileName = file.file_name || '';
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  // Strategy for different document types:
  
  // 1. PDF Files - Try to get first page preview
  if (extension === 'pdf') {
    // Option A: If you have a backend thumbnail generator
    // return `/api/thumbnail/pdf/${file.file_id}`;
    
    // Option B: Use PDF.js or external service
    // return `https://your-cdn.com/pdf-preview/${file.file_id}`;
    
    // Option C: Use Google Docs Viewer (works for public URLs)
    if (fileUrl.startsWith('http')) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    }
    
    // Fallback: Return PDF icon/placeholder
    return getPdfPlaceholder();
  }

  // 2. Microsoft Word (.doc, .docx)
  if (['doc', 'docx'].includes(extension)) {
    // Option A: Backend thumbnail generator
    // return `/api/thumbnail/word/${file.file_id}`;
    
    // Option B: Microsoft Office Online preview (for public URLs)
    if (fileUrl.startsWith('http')) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    }
    
    // Fallback: Return Word icon
    return getWordPlaceholder();
  }

  // 3. Microsoft PowerPoint (.ppt, .pptx)
  if (['ppt', 'pptx'].includes(extension)) {
    // Backend thumbnail or Office preview
    if (fileUrl.startsWith('http')) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    }
    return getPowerPointPlaceholder();
  }

  // 4. Microsoft Excel (.xls, .xlsx)
  if (['xls', 'xlsx', 'csv'].includes(extension)) {
    // Backend thumbnail or Office preview
    if (fileUrl.startsWith('http')) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    }
    return getExcelPlaceholder();
  }

  // 5. Text files (.txt, .md, .json, etc.)
  if (['txt', 'md', 'json', 'xml', 'log'].includes(extension)) {
    return getTextPlaceholder();
  }

  // 6. Other documents - Return generic document placeholder
  return getGenericDocPlaceholder();
};

/**
 * Generate SVG placeholder icons for different document types
 */

export const getPdfPlaceholder = () => {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260">
      <rect width="200" height="260" fill="#e74c3c" rx="8"/>
      <text x="100" y="140" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="white" text-anchor="middle">PDF</text>
      <path d="M40 40 L120 40 L160 80 L160 220 L40 220 Z" fill="none" stroke="white" stroke-width="3"/>
      <path d="M120 40 L120 80 L160 80" fill="none" stroke="white" stroke-width="3"/>
    </svg>
  `)}`;
};

export const getWordPlaceholder = () => {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260">
      <rect width="200" height="260" fill="#2b579a" rx="8"/>
      <text x="100" y="150" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">Word</text>
      <path d="M40 40 L120 40 L160 80 L160 220 L40 220 Z" fill="none" stroke="white" stroke-width="3"/>
      <path d="M120 40 L120 80 L160 80" fill="none" stroke="white" stroke-width="3"/>
      <text x="100" y="90" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="white" text-anchor="middle">W</text>
    </svg>
  `)}`;
};

export const getPowerPointPlaceholder = () => {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260">
      <rect width="200" height="260" fill="#d24726" rx="8"/>
      <text x="100" y="150" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">PowerPoint</text>
      <path d="M40 40 L120 40 L160 80 L160 220 L40 220 Z" fill="none" stroke="white" stroke-width="3"/>
      <path d="M120 40 L120 80 L160 80" fill="none" stroke="white" stroke-width="3"/>
      <text x="100" y="95" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="white" text-anchor="middle">P</text>
    </svg>
  `)}`;
};

export const getExcelPlaceholder = () => {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260">
      <rect width="200" height="260" fill="#1d6f42" rx="8"/>
      <text x="100" y="150" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">Excel</text>
      <path d="M40 40 L120 40 L160 80 L160 220 L40 220 Z" fill="none" stroke="white" stroke-width="3"/>
      <path d="M120 40 L120 80 L160 80" fill="none" stroke="white" stroke-width="3"/>
      <text x="100" y="95" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="white" text-anchor="middle">X</text>
    </svg>
  `)}`;
};

export const getTextPlaceholder = () => {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260">
      <rect width="200" height="260" fill="#6c757d" rx="8"/>
      <text x="100" y="150" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="white" text-anchor="middle">Text</text>
      <path d="M40 40 L120 40 L160 80 L160 220 L40 220 Z" fill="none" stroke="white" stroke-width="3"/>
      <path d="M120 40 L120 80 L160 80" fill="none" stroke="white" stroke-width="3"/>
      <line x1="60" y1="100" x2="140" y2="100" stroke="white" stroke-width="2"/>
      <line x1="60" y1="120" x2="140" y2="120" stroke="white" stroke-width="2"/>
      <line x1="60" y1="140" x2="120" y2="140" stroke="white" stroke-width="2"/>
    </svg>
  `)}`;
};

export const getGenericDocPlaceholder = () => {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260">
      <rect width="200" height="260" fill="#6c757d" rx="8"/>
      <text x="100" y="150" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">Document</text>
      <path d="M40 40 L120 40 L160 80 L160 220 L40 220 Z" fill="none" stroke="white" stroke-width="3"/>
      <path d="M120 40 L120 80 L160 80" fill="none" stroke="white" stroke-width="3"/>
    </svg>
  `)}`;
};

/**
 * Check if document preview is supported
 */
export const isDocumentPreviewSupported = (file) => {
  const fileName = file.file_name || '';
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const supportedExtensions = [
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv'
  ];
  
  return supportedExtensions.includes(extension);
};

/**
 * Get file extension icon color
 */
export const getDocumentColor = (file) => {
  const fileName = file.file_name || '';
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const colorMap = {
    pdf: '#e74c3c',
    doc: '#2b579a',
    docx: '#2b579a',
    ppt: '#d24726',
    pptx: '#d24726',
    xls: '#1d6f42',
    xlsx: '#1d6f42',
    csv: '#1d6f42',
    txt: '#6c757d',
    md: '#6c757d',
    json: '#f39c12',
    xml: '#9b59b6',
  };
  
  return colorMap[extension] || '#95a5a6';
};


// ============================================
// 2. ENHANCED MediaCard COMPONENT
// ============================================

import React from 'react';
import { getDocumentThumbnail, isDocumentPreviewSupported } from '../utils/documentThumbnail';
import { Eye, Download, Heart, FileText } from 'lucide-react';

const MediaCard = ({ file, onClick }) => {
  const isDocument = file.file_type === 'documents';
  const thumbnailUrl = getDocumentThumbnail(file);
  const hasPreview = isDocumentPreviewSupported(file);

  return (
    <div className="media-card" onClick={onClick}>
      <div className="media-card-thumbnail">
        {isDocument && hasPreview ? (
          <div className="document-preview">
            <img 
              src={thumbnailUrl} 
              alt={file.file_name}
              loading="lazy"
              onError={(e) => {
                // Fallback if preview fails
                e.target.style.display = 'none';
                e.target.parentElement.classList.add('preview-error');
              }}
            />
          </div>
        ) : isDocument ? (
          <div className="document-icon-container">
            <FileText size={48} />
            <span className="document-extension">
              {file.file_name?.split('.').pop()?.toUpperCase() || 'DOC'}
            </span>
          </div>
        ) : (
          <img 
            src={file.thumbnail_url || file.file_url} 
            alt={file.file_name}
            loading="lazy"
          />
        )}
        
        {isDocument && (
          <div className="document-badge">
            <FileText size={14} />
            <span>Document</span>
          </div>
        )}
      </div>

      <div className="media-card-info">
        <h3 className="media-card-title">{file.file_name}</h3>
        
        <div className="media-card-stats">
          <span className="stat">
            <Eye size={14} />
            {file.view_count || 0}
          </span>
          <span className="stat">
            <Download size={14} />
            {file.download_count || 0}
          </span>
          <span className="stat">
            <Heart size={14} />
            {file.like_count || 0}
          </span>
        </div>
      </div>

      <style jsx>{`
        .media-card {
          background: var(--bg-secondary);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid var(--border-color);
          position: relative;
        }

        .media-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
          border-color: var(--accent);
        }

        .media-card-thumbnail {
          width: 100%;
          aspect-ratio: 16 / 9;
          background: var(--bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .media-card-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .document-preview {
          width: 100%;
          height: 100%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .document-preview img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .document-preview.preview-error::before {
          content: '📄';
          font-size: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .document-icon-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
        }

        .document-extension {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .document-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          color: white;
          padding: 0.35rem 0.6rem;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .media-card-info {
          padding: 1rem;
        }

        .media-card-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .media-card-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        @media (max-width: 640px) {
          .media-card-info {
            padding: 0.75rem;
          }

          .media-card-title {
            font-size: 0.85rem;
          }

          .document-badge {
            padding: 0.25rem 0.5rem;
            font-size: 0.65rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MediaCard;