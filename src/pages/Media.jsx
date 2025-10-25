// src/pages/Media.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { filesAPI, commentsAPI, likesAPI, reportAPI } from '../services/api'; // Import all APIs
import { toast } from 'react-toastify';
import {
  Loader, Download, Eye, Heart, MessageCircle, Share2, Send, Copy, Calendar, FileText, ChevronLeft, User, Flag // Added User and Flag
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Comment from '../components/Comment';
import Header from '../components/Header';
import ReportModal from '../components/ReportModal'; // <-- 1. Import the new modal

// Accept props from App.jsx
const Media = ({ theme, toggleTheme, openUploadModal, openAuthModal }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [file, setFile] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false); // <-- 2. Add state for modal
  const fetchedIdRef = useRef(null);

  // --- Combined Data Fetching Effect ---
  useEffect(() => {
    if (fetchedIdRef.current === id) return;
    fetchedIdRef.current = id;
    setLoading(true); setFile(null); setComments([]); setIsLiked(false);

    const fetchAllData = async () => {
      try {
        const [fileResponse, commentsResponse] = await Promise.all([
          filesAPI.getById(id),
          commentsAPI.getByFileId(id).catch(err => {
            console.warn("Comments fetch failed:", err);
            return { data: { comments: [] } };
          })
        ]);

        const fetchedFile = fileResponse.data?.file;
        if (!fetchedFile) throw new Error("File not found");
        setFile(fetchedFile);

        const fetchedComments = commentsResponse.data?.comments;
        if (Array.isArray(fetchedComments)) setComments(fetchedComments);

        if (isAuthenticated() && user?.user_id) {
          try {
            const likeResponse = await likesAPI.check(id, user.user_id);
            setIsLiked(likeResponse.data.liked);
          } catch (likeError) { /* Non-critical */ }
        }
      } catch (error) {
        console.error("Error loading media page:", error);
        toast.error(error.message === "File not found" ? "Media not found." : "Failed to load media.");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [id, navigate, isAuthenticated, user]);


  // --- Action Handlers ---
  const handleLike = async () => {
    if (!isAuthenticated()) {
      toast.info('Please login to like');
      openAuthModal('login'); // Open auth modal
      return;
    }
    const originalLikedState = isLiked;
    const originalLikeCount = file.like_count || 0;
    const newLikedState = !isLiked;
    const newLikeCount = newLikedState ? originalLikeCount + 1 : Math.max(0, originalLikeCount - 1);
    setIsLiked(newLikedState);
    setFile(prev => ({ ...prev, like_count: newLikeCount }));
    try {
      await likesAPI.toggle(id, user.user_id);
    } catch (error) {
      toast.error('Failed to update like');
      setIsLiked(originalLikedState);
      setFile(prev => ({ ...prev, like_count: originalLikeCount }));
    }
  };

  const handleDownload = async () => {
    if (!file?.download_url) return;
    try {
      const a = document.createElement('a');
      a.href = file.download_url;
      a.download = `${file.title || 'download'}.${file.file_extension || ''}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      filesAPI.trackDownload(id).catch(err => console.warn("Download track failed:", err));
      setFile(prev => ({ ...prev, download_count: (prev.download_count || 0) + 1 }));
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to start download');
    }
  };

  const handleCopyLink = async () => {
    try {
      const link = file?.share_link || `${window.location.origin}/media/${id}`;
      await navigator.clipboard.writeText(link);
      toast.success('Link copied!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    const url = file?.share_link || `${window.location.origin}/media/${id}`;
    const title = file?.title || 'Shared media';
    const text = file?.description || file?.title || 'Check this out!';
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); }
      catch (error) { if (error.name !== 'AbortError') toast.error('Failed to share'); }
    } else {
      await handleCopyLink(); // Fallback
    }
  };

  // --- Comment Handlers ---
  const fetchLatestComments = async () => {
      try {
          const response = await commentsAPI.getByFileId(id);
          setComments(Array.isArray(response.data.comments) ? response.data.comments : []);
      } catch (error) {
          console.error('Failed to refresh comments:', error);
      }
  };

  const handleAddComment = async () => {
    if (!isAuthenticated()) {
      toast.info('Please login to comment');
      openAuthModal('login');
      return;
    }
    if (!commentText.trim()) return;
    const originalCommentText = commentText;
    setCommentText('');
    try {
      await commentsAPI.add({
        file_id: id, user_id: user.user_id,
        username: user.username, comment_text: originalCommentText.trim(),
      });
      await fetchLatestComments();
    } catch (error) {
      toast.error('Failed to add comment');
      setCommentText(originalCommentText);
    }
  };

  const handleReply = async (parentCommentId, replyText) => {
    if (!isAuthenticated()) {
      toast.info('Please login to reply');
      openAuthModal('login');
      return;
    }
    try {
        await commentsAPI.reply({
            file_id: id, user_id: user.user_id,
            username: user.username, comment_text: replyText.trim(),
            parent_comment_id: parentCommentId,
        });
        await fetchLatestComments();
    } catch (error) {
        toast.error('Failed to post reply');
    }
  };

  // --- Report Handler ---
  const handleReport = () => {
    // 3. Update handleReport to just open the modal
    if (!isAuthenticated()) {
        toast.info('Please login to report content.');
        openAuthModal('login');
        return;
    }
    setShowReportModal(true);
  };

  // --- Utility ---
  const timeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
    return `${Math.floor(seconds / 31536000)}y ago`;
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="media-page-wrapper">
        <Header theme={theme} toggleTheme={toggleTheme} openUploadModal={openUploadModal} openAuthModal={openAuthModal} />
        <div className="page-state-center">
          <Loader className="spinner" size={48} />
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="media-page-wrapper">
        <Header theme={theme} toggleTheme={toggleTheme} openUploadModal={openUploadModal} openAuthModal={openAuthModal} />
        <div className="page-state-center">
          <h2>Media Not Found</h2>
          <p>The link may be broken or the file may have been removed.</p>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isImage = file.file_type === 'images' || file.file_type === 'gifs';
  const isVideo = file.file_type === 'videos';

  return (
    <div className="media-page-wrapper">
      {/* Render the Header component */}
      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        openUploadModal={openUploadModal}
        openAuthModal={openAuthModal}
      />

      <div className="media-page">
        {/* Back button (relative to page) */}
        <button className="back-btn" onClick={() => navigate(-1)} title="Go back" aria-label="Go back">
          <ChevronLeft size={20} strokeWidth={3} />
        </button>

        <div className="media-layout-grid">
          {/* --- LEFT COLUMN (Media) --- */}
          <div className="media-column">
            <div className="media-wrapper">
              {isImage && (
                <img src={file.file_url} alt={file.title || 'Media'} className="media-content" />
              )}
              {isVideo && (
                <video controls autoPlay loop playsInline className="media-content" preload="metadata">
                  <source src={file.file_url} type={file.content_type || 'video/mp4'} />
                  Video playback not supported.
                </video>
              )}
            </div>
          </div>

          {/* --- RIGHT COLUMN (Details) --- */}
          <div className="details-column">
            <div className="media-header">
              <h1 className="media-title">{file.title || 'Untitled'}</h1>
              <div className="media-meta">
                <span className="meta-item" title={`Uploaded by ${file.uploaded_by || 'Anonymous'}`}>
                  <User size={14} />
                  {file.uploaded_by || 'Anonymous'}
                </span>
                <span className="meta-item" title="Upload date">
                  <Calendar size={14} />
                  {new Date(file.uploaded_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
                <span className="meta-item" title="Views">
                  <Eye size={14} />
                  {file.view_count || 0} views
                </span>
                <span className="meta-item" title="Downloads">
                  <Download size={14} />
                  {file.download_count || 0} downloads
                </span>
              </div>
            </div>

            <div className="media-actions">
               <button className="action-btn btn-primary" onClick={handleDownload}><Download size={16} /><span>Download</span></button>
               <button className={`action-btn btn-secondary ${isLiked ? 'liked' : ''}`} onClick={handleLike}><Heart size={16} fill={isLiked ? 'var(--error)' : 'none'} className={isLiked ? 'liked-icon' : ''} /><span>{file.like_count || 0}</span></button>
               <button className="action-btn btn-ghost" onClick={handleShare} title="Share"><Share2 size={16} /></button>
               <button className="action-btn btn-ghost" onClick={handleCopyLink} title="Copy Link"><Copy size={16} /></button>
            </div>

            {file.description && (
               <div className="details-card">
                   <div className="card-header"><FileText size={16} /><h2>Description</h2></div>
                   <div className="card-content"><p>{file.description}</p></div>
               </div>
            )}

            {/* --- Report Button --- */}
            <button className="report-btn" onClick={handleReport} title="Report this content">
                <Flag size={14} /> Report Content
            </button>

            <div className="comments-section">
               <div className="section-header"><h2>Comments ({comments.length})</h2></div>
               {isAuthenticated() ? (
                  <form className="comment-form" onSubmit={(e) => { e.preventDefault(); handleAddComment(); }}>
                     <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Share your thoughts..." className="comment-input" rows="3"/>
                     <button type="submit" className="btn btn-primary" disabled={!commentText.trim()}><Send size={16} /><span>Post</span></button>
                  </form>
               ) : (
                  <div className="login-prompt">
                    <MessageCircle size={32} className="prompt-icon" />
                    <h3>Join the conversation</h3>
                    <p>Login to comment and engage with the community</p>
                    <button className="btn btn-primary" onClick={() => openAuthModal('login')}>
                      Login / Register
                    </button>
                  </div>
               )}
               <div className="comments-list">
                   {comments.length > 0 ? (
                      comments.map(comment => (
                          <Comment
                            key={comment.comment_id}
                            comment={comment}
                            timeAgo={timeAgo}
                            onReply={handleReply}
                            isAuthenticated={isAuthenticated()}
                            currentUser={user}
                          />
                      ))
                   ) : (
                      <div className="no-comments">
                        <p>No comments yet</p>
                        <span>Be the first to share your thoughts!</span>
                      </div>
                   )}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- 4. Render the modal conditionally --- */}
      {showReportModal && (
        <ReportModal
          fileId={file.file_id}
          onClose={() => setShowReportModal(false)}
        />
      )}

      <style jsx>{`
        /* Wrapper to contain the header and page */
        .media-page-wrapper {
          min-height: 100vh;
          background: var(--bg-primary);
          display: flex;
          flex-direction: column;
        }
        /* .media-page contains the content below the sticky header */
        .media-page {
          color: var(--text-primary);
          padding-bottom: 3rem;
          position: relative; /* For back button positioning */
          width: 100%;
          max-width: 1600px; /* Match grid max-width */
          margin: 0 auto; /* Center page content */
          padding: 1.5rem; /* Base padding */
        }

        /* Back button (not fixed) */
        .back-btn {
          background: var(--bg-secondary); border: 1px solid var(--border-color);
          color: var(--text-secondary); cursor: pointer; width: 38px; height: 38px;
          border-radius: 50%; transition: all 0.2s ease;
          display: flex; align-items: center; justify-content: center;
          box-shadow: var(--shadow-md);
          margin-bottom: 1rem; /* Space below button */
        }
        .back-btn:hover { background: var(--bg-hover); color: var(--text-primary); transform: scale(1.05); }

        .media-layout-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); /* Flexible columns */
          gap: 2.5rem;
          margin: 0 auto;
        }
        
        .media-column { animation: slideIn 0.5s ease 0.1s both; }
        .details-column { display: flex; flex-direction: column; gap: 1.75rem; animation: slideIn 0.5s ease 0.2s both; }

        .media-wrapper {
          position: sticky; top: 100px; /* Stick below sticky header (adjust height as needed) */
          border-radius: 16px; overflow: hidden;
          background: var(--bg-secondary); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);
        }
        .media-content { width: 100%; height: auto; max-height: calc(100vh - 120px); /* Adjust max height */ object-fit: contain; display: block; background-color: var(--bg-hover); }

        .media-header { }
        .media-title { font-size: clamp(1.5rem, 4vw, 2.25rem); font-weight: 700; margin-bottom: 1rem; line-height: 1.2; color: var(--text-primary); word-break: break-word; }
        .media-meta { display: flex; align-items: center; gap: 0.5rem 1.25rem; color: var(--text-secondary); font-size: 0.9rem; flex-wrap: wrap; }
        .meta-item { display: flex; align-items: center; gap: 0.4rem; }
        .meta-divider { display: none; }
        .meta-item svg { flex-shrink: 0; }

        .media-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .action-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.6rem 1rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem; flex-grow: 1; text-align: center; }
        .action-btn.btn-primary { flex-grow: 2; }
        .action-btn.btn-ghost { flex-grow: 0; padding: 0.6rem; width: 38px; height: 38px; }
        .action-btn.liked { border-color: var(--error); color: var(--error); background: transparent; }
        .action-btn.liked:hover { background: rgba(239, 68, 68, 0.1); }
        .action-btn.liked .liked-icon { color: var(--error); }

        .details-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; }
        .card-header { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.625rem; background: var(--bg-hover); }
        .card-header h2 { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0; }
        .card-content { padding: 1.25rem; font-size: 0.95rem; color: var(--text-secondary); line-height: 1.7; }
        .card-content p { margin: 0; white-space: pre-wrap; word-break: break-word; }

        /* Report Button Style */
        .report-btn {
            background: none; border: none; color: var(--text-secondary);
            font-size: 0.8rem; cursor: pointer; display: inline-flex;
            align-items: center; gap: 0.35rem; font-weight: 500;
            padding: 0.25rem 0.5rem; margin-top: -1rem;
            transition: color 0.2s, background-color 0.2s; align-self: flex-start;
            border-radius: 6px;
        }
        .report-btn:hover { color: var(--error); background-color: var(--bg-hover); }

        .comments-section { border-top: 1px solid var(--border-color); padding-top: 1.75rem; }
        .section-header { margin-bottom: 1.5rem; }
        .section-header h2 { font-size: 1.2rem; font-weight: 600; color: var(--text-primary); }
        
        .comment-form { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem; }
        .comment-input {
          width: 100%; padding: 0.75rem 1rem; background: var(--bg-primary);
          border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary);
          font-family: inherit; font-size: 0.9rem; resize: vertical; transition: all 0.2s ease-out;
        }
        .comment-input:focus {
          outline: none; border-color: var(--accent); background: var(--bg-secondary);
          box-shadow: 0 0 0 3px var(--accent-light);
        }
        .comment-form .btn { align-self: flex-end; }

        .login-prompt {
          text-align: center; padding: 2rem; background: var(--bg-secondary);
          border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: 2rem;
        }
        .prompt-icon { color: var(--text-tertiary); margin-bottom: 1rem; }
        .login-prompt h3 { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; }
        .login-prompt p { color: var(--text-secondary); margin-bottom: 1.25rem; font-size: 0.9rem; }

        .comments-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .no-comments { text-align: center; padding: 2rem 0; color: var(--text-secondary); }
        .no-comments p { font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; }
        .no-comments span { font-size: 0.9rem; }

        .page-state-center {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 1rem; min-height: 80vh; /* Adjust height to be within page */
          color: var(--text-secondary); padding: 2rem; text-align: center;
        }
        .page-state-center h2 { font-size: 1.5rem; color: var(--text-primary); margin-bottom: 0.5rem;}

        @media (max-width: 1024px) {
          .media-layout-grid { grid-template-columns: 1fr; gap: 2rem; padding: 0; padding-top: 1rem; /* Remove padding */ }
          .media-wrapper { position: relative; top: 0; max-height: 70vh; }
          .back-btn { /* Make button relative inside page */
            position: relative; 
            left: 0; top: 0; 
            margin-bottom: 1rem;
          }
          .media-page { padding: 1.5rem; } /* Restore padding to page */
        }
        @media (max-width: 480px) {
          .media-layout-grid { padding-top: 0.5rem; }
          .media-page { padding: 1rem; }
          .back-btn { margin-bottom: 0.5rem; }
          .media-title { font-size: 1.75rem; }
          .media-meta { gap: 0.25rem 1rem; } /* Tighter gap */
          .action-btn { font-size: 0.85rem; }
          .comment-form .btn { width: 100%; }
          .details-card { border-radius: 12px;}
        }
      `}</style>
    </div>
  );
};

export default Media;