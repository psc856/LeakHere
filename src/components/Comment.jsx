// src/components/Comment.jsx
import React, { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';

const Comment = ({ comment, onReply, isAuthenticated, currentUser, timeAgo = () => '' }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      // Assuming onReply handles the API call and potential errors
      await onReply(comment.comment_id, replyText.trim());
      setReplyText(''); // Clear on success
      setShowReplyForm(false); // Hide on success
    } catch (error) {
      // Error handling might be done in the parent, or show a toast here
      console.error("Reply submission failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Consistent avatar color based on username hash
  const getAvatarColor = (username = '') => {
    const colors = [
      '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6',
      '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899'
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="comment-wrapper"> {/* Added wrapper for line */}
      <div className="comment">
        <div className="comment-main">
          <span className="comment-avatar" style={{ background: getAvatarColor(comment.username) }}>
            {comment.username ? comment.username.charAt(0).toUpperCase() : '?'}
          </span>
          <div className="comment-content">
            <div className="comment-meta">
              <span className="comment-author">{comment.username || 'User'}</span>
              <span className="comment-time">• {timeAgo(comment.created_at)}</span>
            </div>
            <p className="comment-text">{comment.comment_text}</p>
            {isAuthenticated && !showReplyForm && ( // Hide button when form is shown
              <button className="reply-btn" onClick={() => setShowReplyForm(true)}>
                <MessageCircle size={14} /> Reply
              </button>
            )}
          </div>
        </div>

        {/* Reply Form - Indented */}
        {showReplyForm && (
          <form onSubmit={handleReplySubmit} className="reply-form">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Replying to ${comment.username}...`}
              className="reply-input"
              rows="2"
              required
              autoFocus
            />
            <div className="reply-actions">
              <button
                type="button"
                onClick={() => setShowReplyForm(false)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !replyText.trim()}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                <Send size={14} />
                {submitting ? 'Posting...' : 'Reply'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Replies Section - Indented with line */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-container">
          {comment.replies.map((reply) => (
             // Using simpler div structure here for clarity.
             <div key={reply.comment_id} className="comment reply">
                 <div className="comment-main">
                    <span className="comment-avatar reply-avatar" style={{ background: getAvatarColor(reply.username) }}>
                        {reply.username ? reply.username.charAt(0).toUpperCase() : '?'}
                    </span>
                    <div className="comment-content">
                        <div className="comment-meta">
                            <span className="comment-author">{reply.username || 'User'}</span>
                            <span className="comment-time">• {timeAgo(reply.created_at)}</span>
                        </div>
                        <p className="comment-text">{reply.comment_text}</p>
                        {/* No nested reply button for simplicity */}
                    </div>
                </div>
             </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .comment-wrapper { position: relative; } /* Needed for absolute line */
        .comment { display: flex; flex-direction: column; gap: 0.5rem; } /* Reduced gap slightly */
        .comment-main { display: flex; align-items: flex-start; gap: 0.75rem; }
        .comment-avatar {
          width: 32px; height: 32px; color: white; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 600; font-size: 0.85rem; flex-shrink: 0; margin-top: 2px; /* Align better with text */
        }
        .reply-avatar { width: 28px; height: 28px; font-size: 0.75rem; }

        .comment-content { flex: 1; }
        .comment-meta { display: flex; align-items: baseline; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.1rem; }
        .comment-author { font-weight: 600; color: var(--text-primary); font-size: 0.9rem; line-height: 1.4; }
        .comment-time { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; }
        .comment-text { color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin: 0.1rem 0 0.5rem; white-space: pre-wrap; word-break: break-word; }

        .reply-btn {
          background: none; border: none; color: var(--text-secondary); font-size: 0.8rem;
          cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;
          font-weight: 600; padding: 0.25rem 0; /* Add small padding for easier clicking */ margin-top: 0.25rem;
          transition: color 0.2s;
        }
        .reply-btn:hover { color: var(--accent); }

        /* Reply form indented */
        .reply-form {
          margin-top: 0.75rem;
          padding-left: calc(32px + 0.75rem); /* Avatar width + gap */
        }
        .reply-input {
          width: 100%; padding: 0.6rem 0.8rem; background: var(--bg-secondary);
          border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary);
          font-family: inherit; font-size: 0.9rem; resize: vertical; margin-bottom: 0.5rem;
        }
        .reply-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
        .reply-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }

        /* Replies Container with Line */
        .replies-container {
          position: relative; /* For the line */
          margin-top: 1rem;
          margin-left: calc(32px / 2); /* Start line from center of avatar */
          padding-left: calc(0.75rem + (32px / 2)); /* Gap + half avatar */
          display: flex; flex-direction: column; gap: 1rem;
          /* The connecting line */
          &::before {
            content: ''; position: absolute; left: 0; top: 0; bottom: 0;
            width: 2px; background-color: var(--border-color);
            border-radius: 1px; /* Optional: slightly round the line */
          }
        }
        .reply { padding: 0; position: relative; } /* Needed if further nesting */

        @media (max-width: 480px) {
          .replies-container { margin-left: calc(32px / 2); padding-left: calc(0.5rem + (32px / 2)); }
          .reply-form { padding-left: 0; margin-top: 0.5rem;} /* Remove indent on mobile if desired */
        }
      `}</style>
    </div>
  );
};

export default Comment;