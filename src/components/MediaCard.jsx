import React, { useState, useCallback, memo, useRef } from 'react';
import { Play, Eye, Download, Heart, ImageIcon, Video as VideoIcon, FileText, FileImage, User, Calendar } from 'lucide-react';

const formatCount = (count) => {
  if (!count || count === 0) return '0';
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
};

const MediaCard = memo(({ file, onClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const isImage = ['images', 'gifs'].includes(file.file_type);
  const isVideo = file.file_type === 'videos';
  const isDocument = file.file_type === 'documents';
  const fileExtension = (file.file_extension || '').toLowerCase();

  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    setShowPlaceholder(false);
  }, []);

  const handleImageError = useCallback(() => {
    setShowPlaceholder(true);
    setIsLoaded(false);
  }, []);

  const handleClick = useCallback((e) => {
    e.preventDefault();
    onClick?.();
  }, [onClick]);

  const videoRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    if (videoRef.current && isVideo) {
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (videoRef.current && isVideo) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isVideo]);

  const getDocumentIcon = () => {
    const ext = fileExtension;
    if (['pdf'].includes(ext)) return <FileText size={48} />;
    if (['doc', 'docx'].includes(ext)) return <FileText size={48} />;
    if (['xls', 'xlsx'].includes(ext)) return <FileText size={48} />;
    if (['ppt', 'pptx'].includes(ext)) return <FileText size={48} />;
    return <FileText size={48} />;
  };

  return (
    <div
      className="media-card"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && handleClick(e)}
    >
      <div className="media-wrapper">
        {!showPlaceholder && (isImage || isVideo) && (
          <>
            {!isLoaded && (
              <div className="media-skeleton">
                <div className="skeleton-shimmer" />
              </div>
            )}
            {isVideo ? (
              <video
                ref={videoRef}
                src={file.file_url}
                onLoadedData={handleImageLoad}
                onError={handleImageError}
                className={`media-content ${isLoaded ? 'loaded' : ''}`}
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={file.file_url}
                alt={file.title || 'Media'}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
                className={`media-content ${isLoaded ? 'loaded' : ''}`}
              />
            )}
          </>
        )}

        {showPlaceholder && !isDocument && (
          <div className="media-placeholder">
            <ImageIcon size={48} />
            <span className="placeholder-ext">.{fileExtension.toUpperCase()}</span>
          </div>
        )}

        {isDocument && (
          <>
            {!isLoaded && (
              <div className="media-skeleton">
                <div className="skeleton-shimmer" />
              </div>
            )}
            {['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(fileExtension) ? (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(file.file_url)}&embedded=true`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                className={`media-content ${isLoaded ? 'loaded' : ''}`}
                title={file.title}
              />
            ) : (
              <div className="media-placeholder" style={{ opacity: 1 }}>
                {getDocumentIcon()}
                <span className="placeholder-ext">.{fileExtension.toUpperCase()}</span>
              </div>
            )}
          </>
        )}

        {isVideo && isLoaded && !showPlaceholder && (
          <div className="play-overlay">
            <div className="play-button">
              <Play size={24} fill="white" strokeWidth={0} />
            </div>
          </div>
        )}

        <div className="type-badge">
          {isImage && <ImageIcon size={12} />}
          {isVideo && <VideoIcon size={12} />}
          {file.file_type === 'gifs' && <FileImage size={12} />}
          {isDocument && <FileText size={12} />}
          <span>{isDocument ? `.${fileExtension.toUpperCase()}` : file.file_type?.slice(0, -1).toUpperCase()}</span>
        </div>
      </div>

      <div className="media-info">
        <h3 className="media-title" title={file.title}>
          {file.title || file.file_name || 'Untitled'}
        </h3>
        <div className="media-meta">
          <span className="meta-item" title={file.uploader_name || 'Unknown'}>
            <User size={12} /> {file.uploader_name || 'Anonymous'}
          </span>
          <span className="meta-separator">•</span>
          <span className="meta-item" title={file.uploaded_at}>
            <Calendar size={12} /> {formatDate(file.uploaded_at)}
          </span>
        </div>
        <div className="media-stats">
          <span className="stat">
            <Eye size={13} /> {formatCount(file.view_count)}
          </span>
          <span className="stat">
            <Download size={13} /> {formatCount(file.download_count)}
          </span>
          <span className="stat">
            <Heart size={13} /> {formatCount(file.like_count)}
          </span>
        </div>
      </div>

      <style jsx>{`
        .media-card {
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          position: relative;
          box-shadow: var(--shadow-md);
          will-change: transform;
        }
        
        .media-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-xl);
          border-color: var(--accent);
        }
        
        .media-card:active {
          transform: translateY(-3px);
        }

        .media-wrapper {
          position: relative;
          background: var(--bg-hover);
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .media-content {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 0.4s ease;
          border: none;
          pointer-events: none;
        }
        
        .media-content.loaded {
          opacity: 1;
        }

        .media-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          color: var(--text-tertiary);
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-secondary) 100%);
        }
        
        .placeholder-ext {
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
        }

        .media-skeleton {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--bg-hover);
          overflow: hidden;
        }
        
        .skeleton-shimmer {
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 50%,
            transparent 100%
          );
          animation: shimmer 2s infinite;
        }

        .type-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(10px);
          color: white;
          padding: 5px 9px;
          border-radius: var(--radius-sm);
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0;
          transition: opacity 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .media-card:hover .type-badge {
          opacity: 1;
        }

        .play-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
          pointer-events: none;
          opacity: 1;
          transition: opacity 0.3s ease;
        }
        
        .play-overlay.fade {
          opacity: 0;
        }
        
        .play-button {
          width: 56px;
          height: 56px;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .media-card:hover .play-button {
          transform: scale(1.15);
          background: rgba(0, 0, 0, 0.85);
        }

        .media-info {
          padding: 1rem 1.125rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .media-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.4;
        }
        
        .media-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 45%;
        }
        
        .meta-item svg {
          flex-shrink: 0;
        }
        
        .meta-separator {
          color: var(--text-tertiary);
          opacity: 0.5;
        }
        
        .media-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.8125rem;
          color: var(--text-secondary);
        }
        
        .stat {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        
        .stat:hover {
          color: var(--text-primary);
        }
        
        .stat svg {
          flex-shrink: 0;
          color: var(--text-tertiary);
          transition: color 0.2s ease;
        }
        
        .stat:hover svg {
          color: var(--accent);
        }

        @media (max-width: 768px) {
          .media-card {
            border-radius: var(--radius-md);
          }
          
          .media-info {
            padding: 0.875rem 1rem;
            gap: 0.5rem;
          }
          
          .media-title {
            font-size: 0.875rem;
          }
          
          .play-button {
            width: 48px;
            height: 48px;
          }
          
          .type-badge {
            top: 8px;
            left: 8px;
            padding: 4px 7px;
            font-size: 0.625rem;
          }
        }

        @media (max-width: 640px) {
          .media-card:hover {
            transform: none;
            box-shadow: var(--shadow-md);
          }
          
          .media-card:active {
            transform: scale(0.98);
          }
          
          .media-info {
            padding: 0.75rem 0.875rem;
          }
          
          .media-stats {
            gap: 0.875rem;
            font-size: 0.75rem;
          }
          
          .type-badge {
            opacity: 1;
          }
          
          .play-button {
            width: 44px;
            height: 44px;
          }
        }

        @media (hover: none) and (pointer: coarse) {
          .media-card:hover {
            transform: none;
          }
          
          .media-card:active {
            transform: scale(0.97);
          }
          
          .type-badge {
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .media-card,
          .media-content,
          .play-overlay,
          .type-badge {
            transition: none;
          }
          
          .skeleton-shimmer {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
});

MediaCard.displayName = 'MediaCard';

export default MediaCard;
