import React, { useState, useRef } from 'react';
import { Play, Heart, Eye, Download, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

const MediaCard = ({ file, onClick }) => {
  const [isLoaded, setIsLoaded] = useState(false); // Tracks if metadata/image is loaded
  const [imageError, setImageError] = useState(false);
  const [isHovering, setIsHovering] = useState(false); // Track hover state for video
  const videoRef = useRef(null); // Ref for video element

  const isVideo = file.file_type === 'videos';

  // --- Thumbnail/Display Logic ---
  // For IMAGES/GIFS: Use thumbnail or file_url.
  // For VIDEOS: Use file_url for the video element itself. The 'poster' attribute will use the thumbnail.
  const displayUrl = isVideo ? file.file_url : (file.thumbnail_url || file.file_url);
  const posterUrl = isVideo ? file.thumbnail_url : undefined; // Poster for video
  const showPlaceholder = (!displayUrl && !posterUrl) || imageError; // Placeholder if no URLs or error

  const formatCount = (num) => {
    if (!num || num < 0) return '0';
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(num % 1000 !== 0 ? 1 : 0).replace('.0', '') + 'k';
    return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
  };

  const handleMediaLoad = () => {
    setIsLoaded(true);
    setImageError(false);
  };

  const handleMediaError = (e) => {
    console.warn("Media load error:", e, displayUrl || posterUrl);
    setImageError(true);
    setIsLoaded(true); // Stop skeleton loader
  };

  // --- Video Hover Playback ---
  const handleMouseEnter = () => {
    if (isVideo && videoRef.current) {
      setIsHovering(true);
      videoRef.current.play().catch(error => {
        // Autoplay was prevented, ignore.
      });
    }
  };

  const handleMouseLeave = () => {
    if (isVideo && videoRef.current) {
      setIsHovering(false);
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // Reset video to start
    }
  };

  return (
    // Click listener is on the main card div
    <div
      className="media-card"
      role="button"
      tabIndex={0}
      title={file.title || 'View Media'}
      onMouseEnter={handleMouseEnter} // Add hover listeners to the card
      onMouseLeave={handleMouseLeave}
      onClick={onClick} // Click navigates
    >
      <div className="media-wrapper">
        {/* Placeholder: Shown if no URL or error */}
        {showPlaceholder && (
          <div className="media-placeholder">
            {isVideo ? <VideoIcon size={48} strokeWidth={1} /> : <ImageIcon size={48} strokeWidth={1} />}
          </div>
        )}

        {/* Skeleton Loader: Shown while loading */}
        {!showPlaceholder && !isLoaded && <div className="media-skeleton" />}

        {/* Image/GIF Display */}
        {!isVideo && !showPlaceholder && (
          <img
            src={displayUrl}
            alt={file.title || 'Media thumbnail'}
            loading="lazy"
            onLoad={handleMediaLoad}
            onError={handleMediaError}
            className={`media-content ${isLoaded ? 'loaded' : ''}`}
            style={{ display: imageError ? 'none' : 'block' }}
          />
        )}

        {/* Video Display */}
        {isVideo && !showPlaceholder && (
          <video
            ref={videoRef}
            // --- THIS IS THE CHANGE ---
            // We add #t=0.1 to the src.
            // This forces the browser to load the frame at 0.1 seconds, which acts as a thumbnail.
            src={displayUrl ? `${displayUrl}#t=0.1` : ''} 
            poster={posterUrl} // Poster is still preferred if it exists
            muted
            loop
            playsInline
            preload="metadata" // Essential for showing the first frame
            onLoadedMetadata={handleMediaLoad} // Fired when first frame is ready
            onError={handleMediaError}
            className={`media-content ${isLoaded ? 'loaded' : ''}`}
            style={{ display: imageError ? 'none' : 'block' }}
          />
        )}

        {/* Play Icon Overlay for Videos */}
        {/* Shows when it's a video, loaded, and NOT hovering */}
        {isVideo && !showPlaceholder && isLoaded && (
           <div className={`play-overlay ${isHovering ? 'hidden' : ''}`}>
             <Play size={24} fill="white" strokeWidth={0} />
           </div>
         )}
      </div>

      {/* Info Section */}
      <div className="media-info">
        <h3 className="media-title">{file.title || 'Untitled'}</h3>
        <div className="media-stats">
          <span className="stat" title={`${file.view_count || 0} views`}><Eye size={14} strokeWidth={2}/> {formatCount(file.view_count)}</span>
          <span className="stat" title={`${file.download_count || 0} downloads`}><Download size={14} strokeWidth={2}/> {formatCount(file.download_count)}</span>
          <span className="stat" title={`${file.like_count || 0} likes`}><Heart size={14} strokeWidth={2}/> {formatCount(file.like_count)}</span>
        </div>
      </div>

      <style jsx>{`
        .media-card {
          background: var(--bg-secondary); border-radius: 12px; overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out;
          margin-bottom: 1rem; border: 1px solid var(--border-color);
          display: flex; flex-direction: column;
          -webkit-tap-highlight-color: transparent;
        }
        .media-card:hover, .media-card:focus-visible {
          transform: translateY(-4px) scale(1.02);
          box-shadow: var(--shadow-md);
          border-color: var(--text-tertiary);
          outline: none;
        }

        .media-wrapper {
          position: relative; background: var(--bg-hover); overflow: hidden;
          width: 100%; aspect-ratio: 4 / 3; display: flex;
          align-items: center; justify-content: center;
        }
        .media-content { /* Applies to both <img> and <video> */
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block;
          object-fit: cover; opacity: 0; transition: opacity 0.3s ease;
        }
        .media-content.loaded { opacity: 1; }

        .media-placeholder { color: var(--text-tertiary); opacity: 0.3; }

        .media-skeleton {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1;
          background: linear-gradient( 90deg, var(--bg-hover) 25%, var(--bg-secondary) 50%, var(--bg-hover) 75% );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

        /* --- Polished Play Overlay --- */
        .play-overlay {
          position: absolute;
          top: 50%; /* Center vertically */
          left: 50%; /* Center horizontally */
          transform: translate(-50%, -50%); /* Precise centering */
          width: 44px; /* Slightly larger */
          height: 44px;
          background: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
          backdrop-filter: blur(4px); /* Frosted glass effect */
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          pointer-events: none; /* Don't block hover */
          z-index: 2;
          opacity: 1;
          transition: opacity 0.2s ease-in-out;
        }
        .play-overlay.hidden { /* Hide when hovering */
           opacity: 0;
        }
        /* End Play Overlay */

        .media-info { padding: 0.75rem 1rem; }
        .media-title { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .media-stats { display: flex; gap: 0.75rem; font-size: 0.8rem; color: var(--text-secondary); }
        .stat { display: flex; align-items: center; gap: 0.3rem; }
        .stat svg { flex-shrink: 0; }
      `}</style>
    </div>
  );
};

export default MediaCard;