import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { filesAPI, commentsAPI, likesAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Loader, Download, Eye, Heart, MessageCircle, Share2, Send, Copy, Calendar, FileText, ChevronLeft, User, Flag, ZoomIn, ZoomOut, Maximize2, AlertCircle, ExternalLink, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Comment from '../components/Comment';
import Header from '../components/Header';
import ReportModal from '../components/ReportModal';
import VideoPlayer from '../components/VideoPlayer';





// DocumentViewer component (unchanged as it's already well-optimized)
const DocumentViewer = memo(({ file }) => {
  const [zoom, setZoom] = useState(100);
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const viewerRef = useRef(null);

  const ext = (file.file_extension || '').toLowerCase();
  const isText = ['txt', 'csv', 'log', 'json', 'xml', 'md'].includes(ext);
  const isPDF = ext === 'pdf';
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);

  useEffect(() => {
    if (!isText || !file.file_url) return;
    setLoading(true);
    fetch(`/api/proxy-text?url=${encodeURIComponent(file.file_url)}`)
      .then(res => res.ok ? res.text() : Promise.reject())
      .then(setTextContent)
      .catch(() => { setError(true); toast.error('Failed to load text'); })
      .finally(() => setLoading(false));
  }, [file.file_url, isText]);

  const handleZoom = useCallback((delta) => setZoom(prev => Math.max(50, Math.min(250, prev + delta))), []);

  if (isText) {
    return (
      <div ref={viewerRef} className="doc-viewer">
        <div className="viewer-controls">
          <button onClick={() => handleZoom(-15)} className="control-btn"><ZoomOut size={18} /></button>
          <span className="zoom-display">{zoom}%</span>
          <button onClick={() => handleZoom(15)} className="control-btn"><ZoomIn size={18} /></button>
          <button onClick={() => setZoom(100)} className="control-btn">Reset</button>
        </div>
        <div className="text-content" style={{ fontSize: `${zoom}%` }}>
          {loading ? <div className="state"><Loader size={24} className="spinner" />Loading...</div> : error ? <div className="state"><AlertCircle size={24} />Failed to load</div> : <pre>{textContent || 'No content'}</pre>}
        </div>
      </div>
    );
  }

  if (isPDF) {
    return (
      <div className="doc-viewer">
        <div className="viewer-controls">
          <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="external-link">
            <ExternalLink size={16} />Open in New Tab
          </a>
        </div>
        <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(file.file_url)}&embedded=true`} className="doc-iframe" title="PDF Viewer" />
      </div>
    );
  }

  if (isOffice) {
    return (
      <div className="doc-viewer">
        <div className="viewer-controls">
          <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="external-link">
            <ExternalLink size={16} />Open in New Tab
          </a>
        </div>
        <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.file_url)}`} className="doc-iframe" title="Office Document" />
      </div>
    );
  }

  return (
    <div className="doc-viewer unsupported">
      <FileText size={64} />
      <h3>Preview Not Available</h3>
      <p>This format cannot be previewed in-browser.</p>
      <button className="btn btn-primary" onClick={() => window.open(file.download_url || file.file_url, '_blank')}>
        <Download size={16} />Download File
      </button>
    </div>
  );
});

DocumentViewer.displayName = 'DocumentViewer';



// Media component (logic unchanged, JSX/CSS updated)
const Media = ({ theme, toggleTheme, openUploadModal, openAuthModal }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [file, setFile] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const fetchedIdRef = useRef(null);

  useEffect(() => {
    if (fetchedIdRef.current === id) return;
    fetchedIdRef.current = id;
    setLoading(true);

    const fetchAll = async () => {
      try {
        const [fileRes, commentsRes] = await Promise.all([
          filesAPI.getById(id),
          commentsAPI.getByFileId(id).catch(() => ({ data: { comments: [] } }))
        ]);

        const fetchedFile = fileRes.data?.file;
        if (!fetchedFile) throw new Error("File not found");
        setFile(fetchedFile);
        setComments(Array.isArray(commentsRes.data?.comments) ? commentsRes.data.comments : []);

        if (isAuthenticated() && user?.user_id) {
          const likeRes = await likesAPI.check(id, user.user_id).catch(() => ({ data: { liked: false } }));
          setIsLiked(likeRes.data.liked);
        }
      } catch (err) {
        toast.error(err.message === "File not found" ? "Media not found." : "Failed to load.");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, navigate, isAuthenticated, user]);

  const handleLike = useCallback(async () => {
    if (!isAuthenticated()) { toast.info('Login to like'); openAuthModal('login'); return; }
    const prev = isLiked;
    const prevCount = file.like_count || 0;
    setIsLiked(!prev);
    setFile(f => ({ ...f, like_count: prev ? prevCount - 1 : prevCount + 1 }));
    try { await likesAPI.toggle(id, user.user_id); }
    catch { setIsLiked(prev); setFile(f => ({ ...f, like_count: prevCount })); toast.error('Like failed'); }
  }, [isLiked, file, id, user, isAuthenticated, openAuthModal]);

  const handleDownload = useCallback(async () => {
    if (!file?.download_url) return;
    try {
      const a = document.createElement('a');
      a.href = file.download_url;
      a.download = `${file.title || 'file'}.${file.file_extension || ''}`;
      a.click();
      filesAPI.trackDownload(id);
      setFile(f => ({ ...f, download_count: (f.download_count || 0) + 1 }));
      toast.success('Download started');
    } catch { toast.error('Download failed'); }
  }, [file, id]);

  const handleCopyLink = useCallback(async () => {
    const link = file?.share_link || `${window.location.origin}/media/${id}`;
    try { await navigator.clipboard.writeText(link); toast.success('Link copied!'); }
    catch { toast.error('Copy failed'); }
  }, [file, id]);

  const handleShare = useCallback(async () => {
    const url = file?.share_link || `${window.location.origin}/media/${id}`;
    if (navigator.share) {
      try { await navigator.share({ title: file.title, url }); }
      catch (e) { if (e.name !== 'AbortError') handleCopyLink(); }
    } else handleCopyLink();
  }, [file, id, handleCopyLink]);

  const refreshComments = useCallback(async () => {
    try {
      const res = await commentsAPI.getByFileId(id);
      setComments(Array.isArray(res.data.comments) ? res.data.comments : []);
    } catch { }
  }, [id]);

  const handleAddComment = useCallback(async () => {
    if (!isAuthenticated()) { toast.info('Login to comment'); openAuthModal('login'); return; }
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText('');
    try {
      await commentsAPI.add({ file_id: id, user_id: user.user_id, username: user.username, comment_text: text });
      await refreshComments();
    } catch { toast.error('Comment failed'); setCommentText(text); }
  }, [commentText, id, user, isAuthenticated, openAuthModal, refreshComments]);

  const handleReply = useCallback(async (parentId, text) => {
    if (!isAuthenticated()) { toast.info('Login to reply'); openAuthModal('login'); return; }
    try {
      await commentsAPI.reply({ file_id: id, user_id: user.user_id, username: user.username, comment_text: text, parent_comment_id: parentId });
      await refreshComments();
    } catch { toast.error('Reply failed'); }
  }, [id, user, isAuthenticated, openAuthModal, refreshComments]);

  const handleReport = useCallback(() => {
    if (!isAuthenticated()) { toast.info('Login to report'); openAuthModal('login'); return; }
    setShowReportModal(true);
  }, [isAuthenticated, openAuthModal]);

  const timeAgo = useCallback((date) => {
    const sec = Math.floor((Date.now() - new Date(date)) / 1000);
    if (sec < 60) return 'Just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    if (sec < 2592000) return `${Math.floor(sec / 86400)}d ago`;
    return `${Math.floor(sec / 31536000)}y ago`;
  }, []);

  if (loading) return (
    <div className="page-wrapper">
      <Header theme={theme} toggleTheme={toggleTheme} openUploadModal={openUploadModal} openAuthModal={openAuthModal} />
      <div className="loading-state-centered">
        <Loader className="spinner" size={48} />
        <p>Loading content...</p>
      </div>
    </div>
  );

  if (!file) return null;

  const isImage = ['images', 'gifs'].includes(file.file_type);
  const isVideo = file.file_type === 'videos';
  const isDocument = file.file_type === 'documents';

  return (
    <div className="page-wrapper">
      <Header theme={theme} toggleTheme={toggleTheme} openUploadModal={openUploadModal} openAuthModal={openAuthModal} />

      <div className="content-container">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb">
          <button onClick={() => navigate(-1)} className="breadcrumb-back">
            <ChevronLeft size={18} />
            <span>Back</span>
          </button>
        </nav>

        {/* Main Content Grid */}
        <div className="content-grid">
          {/* Left: Media Viewer */}
          <div className="media-section">
            <div className="media-viewer">
              {isImage && <img src={file.file_url} alt={file.title} className="media-display" loading="lazy" />}
              {isVideo && <VideoPlayer src={file.file_url} type={file.content_type} />}
              {isDocument && <DocumentViewer file={file} />}
            </div>

            {/* Mobile: Title & Actions (shown only on mobile below media) */}
            <div className="mobile-header">
              <h1 className="media-title">{file.title || 'Untitled'}</h1>
              
              <div className="mobile-uploader">
                <div className="mobile-avatar">
                  {(file.uploaded_by || 'A')[0].toUpperCase()}
                </div>
                <div className="mobile-uploader-details">
                  <span className="mobile-uploader-name">{file.uploaded_by || 'Anonymous'}</span>
                  <span className="mobile-upload-time">
                    <Clock size={12} />
                    {timeAgo(file.uploaded_at)}
                  </span>
                </div>
              </div>

              <div className="mobile-stats">
                <div className="mobile-stat">
                  <Eye size={16} />
                  <span>{(file.view_count || 0).toLocaleString()}</span>
                </div>
                <div className="mobile-stat">
                  <Heart size={16} />
                  <span>{(file.like_count || 0).toLocaleString()}</span>
                </div>
                <div className="mobile-stat">
                  <Download size={16} />
                  <span>{(file.download_count || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="mobile-actions">
                <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
                  <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
                <button className="action-btn" onClick={handleShare}>
                  <Share2 size={18} />
                </button>
                <button className="action-btn" onClick={handleCopyLink}>
                  <Copy size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Info Sidebar */}
          <aside className="info-sidebar">
            {/* Header Card */}
            <div className="info-card header-card">
              <h1 className="title">{file.title || 'Untitled'}</h1>
              
              <div className="uploader-info">
                <div className="avatar">
                  {(file.uploaded_by || 'A')[0].toUpperCase()}
                </div>
                <div className="uploader-details">
                  <span className="uploader-name">{file.uploaded_by || 'Anonymous'}</span>
                  <span className="upload-time">
                    <Clock size={14} />
                    {timeAgo(file.uploaded_at)}
                  </span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="stats-grid">
                <div className="stat-item">
                  <Eye size={20} className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{(file.view_count || 0).toLocaleString()}</span>
                    <span className="stat-label">Views</span>
                  </div>
                </div>
                <div className="stat-item">
                  <Heart size={20} className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{(file.like_count || 0).toLocaleString()}</span>
                    <span className="stat-label">Likes</span>
                  </div>
                </div>
                <div className="stat-item">
                  <Download size={20} className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{(file.download_count || 0).toLocaleString()}</span>
                    <span className="stat-label">Downloads</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button className="btn btn-primary btn-large" onClick={handleDownload}>
                  <Download size={20} />
                  Download
                </button>
                <div className="secondary-actions">
                  <button className={`btn btn-icon ${isLiked ? 'liked' : ''}`} onClick={handleLike} title="Like">
                    <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                  </button>
                  <button className="btn btn-icon" onClick={handleShare} title="Share">
                    <Share2 size={20} />
                  </button>
                  <button className="btn btn-icon" onClick={handleCopyLink} title="Copy Link">
                    <Copy size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Description Card */}
            {file.description && (
              <div className="info-card">
                <h3 className="card-title">
                  <FileText size={18} />
                  Description
                </h3>
                <p className="description-text">{file.description}</p>
              </div>
            )}

            {/* File Details Card */}
            <div className="info-card details-card">
              <h3 className="card-title">File Details</h3>
              <dl className="details-list">
                <div className="detail-row">
                  <dt>Type</dt>
                  <dd><span className="badge">{file.file_type}</span></dd>
                </div>
                <div className="detail-row">
                  <dt>Extension</dt>
                  <dd>.{file.file_extension || 'N/A'}</dd>
                </div>
                <div className="detail-row">
                  <dt>Uploaded</dt>
                  <dd>{new Date(file.uploaded_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
                </div>
              </dl>
            </div>

            {/* Report Button */}
            <button className="report-btn" onClick={handleReport}>
              <Flag size={16} />
              Report Content
            </button>
          </aside>
        </div>

        {/* Comments Section (Full Width) */}
        <section className="comments-section">
          <div className="comments-header">
            <h2>
              <MessageCircle size={24} />
              Comments
              <span className="comment-count">{comments.length}</span>
            </h2>
          </div>

          <div className="comments-container">
            {isAuthenticated() ? (
              <form className="comment-form" onSubmit={(e) => { e.preventDefault(); handleAddComment(); }}>
                <div className="form-avatar">
                  {(user?.username || 'U')[0].toUpperCase()}
                </div>
                <div className="form-content">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="comment-input"
                    rows="3"
                  />
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={!commentText.trim()}>
                      <Send size={16} />
                      Post Comment
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="login-prompt">
                <MessageCircle size={48} />
                <h3>Join the conversation</h3>
                <p>Sign in to share your thoughts and connect with others</p>
                <button className="btn btn-primary btn-large" onClick={() => openAuthModal('login')}>
                  Sign In
                </button>
              </div>
            )}

            <div className="comments-list">
              {comments.length > 0 ? (
                comments.map(c => (
                  <Comment
                    key={c.comment_id}
                    comment={c}
                    timeAgo={timeAgo}
                    onReply={handleReply}
                    isAuthenticated={isAuthenticated()}
                    currentUser={user}
                  />
                ))
              ) : (
                <div className="no-comments">
                  <MessageCircle size={48} />
                  <h3>No comments yet</h3>
                  <p>Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {showReportModal && <ReportModal fileId={id} onClose={() => setShowReportModal(false)} />}

      {/* ===============================================================
      === OPTIMIZED CSS STYLES ======================================
      ===============================================================
      */}
      <style jsx>{`
        /* === BASE STYLES === */
        .page-wrapper {
          min-height: 100vh;
          background: var(--bg-primary);
          padding-bottom: 4rem;
        }

        .loading-state-centered {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 70vh;
          gap: 1.5rem;
        }

        .loading-state-centered p {
          color: var(--text-secondary);
          font-size: 1.125rem;
          font-weight: 500;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* === CONTAINER === */
        .content-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem 2rem 0;
        }

        /* === BREADCRUMB (OPTIMIZED) === */
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
          font-size: 0.875rem;
        }

        .breadcrumb-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem; /* Increased padding */
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          color: var(--text-primary);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease-out; /* Smoother transition */
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); /* Added shadow */
        }

        .breadcrumb-back:hover {
          background: var(--bg-hover);
          border-color: var(--accent);
          color: var(--accent);
          transform: translateX(-4px) scale(1.02); /* Enhanced hover */
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        }

        .breadcrumb-back:active {
          transform: translateX(-1px) scale(0.98); /* Click feedback */
          background: var(--accent-light);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        /* === CONTENT GRID === */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 2rem;
          margin-bottom: 3rem;
        }

        /* === MEDIA SECTION === */
        .media-section {
          min-width: 0;
        }

        .media-viewer {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          position: relative;
        }

        .media-display {
          width: 100%;
          height: auto;
          display: block;
          max-height: 75vh;
          object-fit: contain;
          background: #000;
        }

        /* Video.js Player Styles */
        .video-js {
          width: 100%;
          height: auto;
          font-family: inherit;
        }

        .video-js .vjs-big-play-button {
          border-radius: 50%;
          width: 80px;
          height: 80px;
          line-height: 80px;
          border: 3px solid #6d28d9;
          background: rgba(0, 0, 0, 0.7);
          font-size: 3rem;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }

        .video-js:hover .vjs-big-play-button,
        .video-js .vjs-big-play-button:focus {
          background: #6d28d9;
          border-color: #5b21b6;
        }
        
        .video-js .vjs-control-bar {
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
        }

        .video-js .vjs-play-progress,
        .video-js .vjs-volume-level {
          background: #6d28d9;
        }

        .video-js .vjs-slider {
          background: rgba(255, 255, 255, 0.3);
        }

        .video-js .vjs-load-progress {
          background: rgba(255, 255, 255, 0.2);
        }

        .video-js .vjs-menu-button-popup .vjs-menu {
          background: rgba(0, 0, 0, 0.9);
        }

        .video-js .vjs-menu li.vjs-selected {
          background: #6d28d9;
        }

        /* Mobile Header (hidden on desktop) */
        .mobile-header {
          display: none;
        }

        /* === DOCUMENT VIEWER === */
        .doc-viewer {
          display: flex;
          flex-direction: column;
          min-height: 600px;
          background: var(--bg-primary);
        }

        .viewer-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
        }

        .control-btn,
        .external-link {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.625rem 1rem;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s ease-out; /* Added transition */
          text-decoration: none;
        }

        .control-btn:hover,
        .external-link:hover {
          background: var(--bg-hover);
          border-color: var(--accent);
          color: var(--accent); /* Added color change */
        }
        
        .control-btn:active,
        .external-link:active {
           transform: scale(0.97); /* Added click feedback */
        }

        .zoom-display {
          font-weight: 600;
          color: var(--text-primary);
          padding: 0 0.5rem;
          min-width: 60px;
          text-align: center;
        }

        .external-link {
          margin-left: auto;
        }

        .text-content {
          flex: 1;
          overflow: auto;
          padding: 2rem;
        }

        .text-content pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          line-height: 1.7;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.875rem;
        }

        .state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          min-height: 400px;
          justify-content: center;
          color: var(--text-secondary);
        }

        .doc-iframe {
          flex: 1;
          border: none;
          background: #fff;
          min-height: 600px;
        }

        .doc-viewer.unsupported {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 500px;
          gap: 1.5rem;
          color: var(--text-secondary);
          text-align: center;
          padding: 3rem;
        }

        .doc-viewer.unsupported h3 {
          font-size: 1.5rem;
          color: var(--text-primary);
          margin: 0;
        }

        /* === INFO SIDEBAR === */
        .info-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .info-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        /* Header Card */
        .header-card {
          padding: 2rem 1.5rem;
        }

        .title {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
          margin: 0 0 1.5rem 0;
        }

        .uploader-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-bottom: 1.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent-hover));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .uploader-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .uploader-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 1rem;
        }

        .upload-time {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1rem 0.75rem;
          background: var(--bg-hover);
          border-radius: 12px;
          gap: 0.5rem;
        }

        .stat-icon {
          color: var(--accent);
          margin-bottom: 0.25rem;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Action Buttons (OPTIMIZED) */
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .btn-large {
          padding: 1rem 1.5rem;
          font-size: 1rem;
          transition: all 0.2s ease-out; /* Added transition */
          /* Assuming .btn-primary has a base bg color */
          box-shadow: 0 2px 6px rgba(var(--accent-rgb, 109, 40, 217), 0.3);
        }
        
        /* Added hover/active for primary button */
        .btn-large.btn-primary:hover {
           background: var(--accent-hover);
           transform: translateY(-2px);
           box-shadow: 0 6px 12px rgba(var(--accent-rgb, 109, 40, 217), 0.4);
        }
        
        .btn-large.btn-primary:active {
           transform: translateY(0);
           box-shadow: 0 2px 4px rgba(var(--accent-rgb, 109, 40, 217), 0.3);
        }

        .secondary-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .btn-icon {
          width: 100%;
          height: 48px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease-out; /* Added transition */
          background: var(--bg-primary); /* Explicitly set base */
          border: 1px solid var(--border-color); /* Explicitly set base */
          color: var(--text-primary); /* Explicitly set base */
        }
        
        /* Added hover/active for icon buttons */
        .btn-icon:hover {
           background: var(--bg-hover);
           border-color: var(--accent);
           color: var(--accent);
        }
        
        .btn-icon:active {
           transform: scale(0.95);
           background: var(--accent-light);
        }

        .btn-icon.liked {
          color: var(--error);
          border-color: var(--error);
          background: rgba(239, 68, 68, 0.1);
        }
        
        .btn-icon.liked:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: var(--error);
          color: var(--error);
        }

        /* Card Styles */
        .card-title {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 1rem 0;
        }

        .description-text {
          color: var(--text-primary);
          line-height: 1.7;
          font-size: 0.9375rem;
          margin: 0;
        }

        /* Details Card */
        .details-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin: 0;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border-color);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row dt {
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .detail-row dd {
          font-weight: 500;
          color: var(--text-primary);
          font-size: 0.875rem;
          margin: 0;
        }

        .badge {
          display: inline-flex;
          padding: 0.25rem 0.75rem;
          background: var(--accent-light);
          color: var(--accent);
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Report Button */
        .report-btn {
          width: 100%;
          padding: 1rem;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.2s ease-out; /* Changed transition */
        }

        .report-btn:hover {
          background: rgba(239, 68, 68, 0.1); /* Use error color */
          color: var(--error);
          border-color: var(--error);
        }
        
        .report-btn:active {
           transform: scale(0.98);
        }

        /* === COMMENTS SECTION === */
        .comments-section {
          max-width: 1400px;
          margin: 0 auto;
        }

        .comments-header {
          margin-bottom: 2rem;
        }

        .comments-header h2 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .comment-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          height: 32px;
          padding: 0 0.75rem;
          background: var(--accent-light);
          color: var(--accent);
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 700;
        }

        .comments-container {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        /* Comment Form */
        .comment-form {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--border-color);
        }

        .form-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent-hover));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .form-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .comment-input {
          width: 100%;
          padding: 1rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.9375rem;
          line-height: 1.6;
          resize: vertical;
          min-height: 100px;
          transition: all 0.2s ease-out; /* Changed transition */
        }

        .comment-input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-light);
          background: var(--bg-secondary);
        }

        .comment-input::placeholder {
          color: var(--text-tertiary);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
        }
        
        /* Added hover for comment submit button */
        .form-actions .btn-primary {
          transition: all 0.2s ease-out;
        }
        .form-actions .btn-primary:hover:not(:disabled) {
           background: var(--accent-hover);
           transform: translateY(-2px);
           box-shadow: 0 4px 8px rgba(var(--accent-rgb, 109, 40, 217), 0.3);
        }
        .form-actions .btn-primary:disabled {
           opacity: 0.6;
           cursor: not-allowed;
        }


        /* Login Prompt */
        .login-prompt {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }

        .login-prompt svg {
          color: var(--text-tertiary);
          margin-bottom: 1.5rem;
        }

        .login-prompt h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.75rem 0;
        }

        .login-prompt p {
          font-size: 1rem;
          margin: 0 0 2rem 0;
          line-height: 1.6;
        }

        /* Comments List */
        .comments-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .no-comments {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }

        .no-comments svg {
          color: var(--text-tertiary);
          margin-bottom: 1.5rem;
        }

        .no-comments h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.5rem 0;
        }

        .no-comments p {
          font-size: 0.9375rem;
          margin: 0;
        }

        /* === RESPONSIVE DESIGN === */

        /* Tablet (1024px and below) */
        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .info-sidebar {
            max-width: 100%;
          }
        }

        /* Mobile (768px and below) */
        @media (max-width: 768px) {
          .content-container {
            padding: 1.5rem 1rem 0;
          }

          .breadcrumb {
            margin-bottom: 1.5rem;
          }

          .breadcrumb-back {
            padding: 0.625rem 1rem; /* Revert to smaller on mobile */
            font-size: 0.875rem;
          }
          
          .breadcrumb-back:hover,
          .breadcrumb-back:active {
             transform: scale(0.97); /* Simpler mobile interaction */
             box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
          }


          .content-grid {
            gap: 0;
            margin-bottom: 1.5rem;
          }

          .media-viewer {
            border-radius: 12px 12px 0 0;
          }

          /* Show mobile header */
          .mobile-header {
            display: block;
            padding: 1.25rem;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 0 0 12px 12px;
            margin-top: -1px;
          }

          .mobile-header .media-title {
            font-size: 1.375rem;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0 0 0.875rem 0;
            line-height: 1.3;
          }

          .mobile-uploader {
            display: flex;
            align-items: center;
            gap: 0.625rem;
            margin-bottom: 0.875rem;
            padding-bottom: 0.875rem;
            border-bottom: 1px solid var(--border-color);
          }

          .mobile-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--accent), var(--accent-hover));
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            font-weight: 700;
            flex-shrink: 0;
          }

          .mobile-uploader-details {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }

          .mobile-uploader-name {
            font-weight: 600;
            color: var(--text-primary);
            font-size: 0.9375rem;
          }

          .mobile-upload-time {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.8125rem;
            color: var(--text-secondary);
          }

          .mobile-stats {
            display: flex;
            justify-content: space-around;
            gap: 1rem;
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: var(--bg-hover);
            border-radius: 8px;
          }

          .mobile-stat {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.375rem;
            color: var(--text-secondary);
            font-size: 0.8125rem;
            font-weight: 600;
          }

          .mobile-stat svg {
            color: var(--accent);
          }

          .mobile-actions {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.625rem;
          }

          .action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-primary);
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s ease-out;
            width: 100%;
          }
          
          /* Added hover for mobile icon buttons */
          .action-btn:not(.primary):hover {
             background: var(--bg-hover);
             color: var(--accent);
          }

          .action-btn.liked {
            color: var(--error);
            border-color: var(--error);
            background: rgba(239, 68, 68, 0.1);
          }
          
          .action-btn.liked:hover {
             background: rgba(239, 68, 68, 0.2);
          }

          /* Hide desktop title, stats, and actions in sidebar */
          .header-card .title,
          .header-card .uploader-info,
          .header-card .stats-grid,
          .header-card .action-buttons {
            display: none;
          }

          .header-card {
            padding: 0;
            background: transparent;
            border: none;
            box-shadow: none;
          }

          .comments-section {
            padding: 0 1rem;
            margin-top: 1.5rem;
          }

          .comments-header h2 {
            font-size: 1.5rem;
          }

          .comments-container {
            padding: 1.5rem;
          }

          .comment-form {
            flex-direction: column;
            gap: 1rem;
          }

          .form-avatar {
            display: none;
          }

          .form-actions {
            justify-content: stretch;
          }

          .form-actions .btn {
            width: 100%;
          }
        }

        /* Small Mobile (480px and below) */
        @media (max-width: 480px) {
          .content-container {
            padding: 1rem 0.75rem 0;
          }

          .breadcrumb-back {
            padding: 0.625rem 1rem;
          }

          .mobile-header {
            padding: 1rem;
          }

          .mobile-header .media-title {
            font-size: 1.125rem;
            margin-bottom: 0.75rem;
          }

          .mobile-uploader {
            margin-bottom: 0.75rem;
            padding-bottom: 0.75rem;
          }

          .mobile-avatar {
            width: 32px;
            height: 32px;
            font-size: 0.875rem;
          }

          .mobile-uploader-name {
            font-size: 0.8125rem;
          }

          .mobile-upload-time {
            font-size: 0.6875rem;
          }

          .mobile-stats {
            gap: 0.5rem;
            margin-bottom: 0.875rem;
            padding: 0.625rem;
          }

          .mobile-stat {
            font-size: 0.75rem;
            gap: 0.25rem;
          }

          .mobile-stat svg {
            width: 14px;
            height: 14px;
          }

          .mobile-actions {
            gap: 0.5rem;
          }

          .action-btn {
            padding: 0.625rem;
          }


          .header-card {
            padding: 1.25rem;
          }

          .action-buttons {
            gap: 0.5rem;
          }

          .btn-large {
            padding: 0.875rem 1.25rem;
            font-size: 0.9375rem;
          }

          .secondary-actions {
            gap: 0.5rem;
          }

          .btn-icon {
            height: 44px;
          }

          .info-card {
            padding: 1.25rem;
          }

          .card-title {
            font-size: 0.9375rem;
          }

          .description-text {
            font-size: 0.875rem;
          }

          .comments-section {
            padding: 0 0.75rem;
          }

          .comments-header {
            margin-bottom: 1.5rem;
          }

          .comments-header h2 {
            font-size: 1.25rem;
          }

          .comment-count {
            min-width: 28px;
            height: 28px;
            padding: 0 0.625rem;
            font-size: 0.8125rem;
          }

          .comments-container {
            padding: 1.25rem;
          }

          .comment-input {
            padding: 0.875rem;
            font-size: 0.875rem;
            min-height: 90px;
          }

          .login-prompt {
            padding: 3rem 1.5rem;
          }

          .login-prompt svg {
            width: 40px;
            height: 40px;
          }

          .login-prompt h3 {
            font-size: 1.25rem;
          }

          .login-prompt p {
            font-size: 0.9375rem;
          }

          .no-comments {
            padding: 3rem 1.5rem;
          }

          .no-comments svg {
            width: 40px;
            height: 40px;
          }

          .no-comments h3 {
            font-size: 1.125rem;
          }

          .no-comments p {
            font-size: 0.875rem;
          }
        }

        /* Touch device optimizations (No changes) */
        @media (hover: none) and (pointer: coarse) {
          .breadcrumb-back:hover {
            transform: none;
          }

          .breadcrumb-back:active {
            transform: scale(0.96);
          }

          .control-btn:hover,
          .external-link:hover {
            background: var(--bg-primary);
            border-color: var(--border-color);
          }

          .control-btn:active,
          .external-link:active {
            background: var(--bg-hover);
            transform: scale(0.96);
          }

          .report-btn:hover {
            background: transparent;
            color: var(--text-secondary);
            border-color: var(--border-color);
          }

          .report-btn:active {
            background: var(--bg-hover);
          }
          
          /* Disable sticky hover effects on touch */
          .btn-large.btn-primary:hover,
          .btn-icon:hover,
          .action-btn:hover {
             background: initial;
             transform: none;
             box-shadow: initial;
             color: initial;
             border-color: initial;
          }
        }

        /* Reduced motion preference (No changes) */
        @media (prefers-reduced-motion: reduce) {
          .breadcrumb-back,
          .control-btn,
          .external-link,
          .action-btn,
          .btn,
          .btn-icon,
          .report-btn,
          .comment-input {
            transition: none;
          }

          .spinner {
            animation: none;
          }
        }

        /* Dark mode specific adjustments (No changes) */
        @media (prefers-color-scheme: dark) {
          .media-display {
            box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
          }

          .badge {
            background: rgba(var(--accent-rgb, 109, 40, 217), 0.15);
          }
        }
      `}</style>
    </div>
  );
};

export default memo(Media);