import React, { useState, useCallback, memo } from 'react';
import { MessageCircle, Send } from 'lucide-react';

const getAvatarColor = (username = '') => {
  const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const Comment = memo(({ comment, onReply, isAuthenticated, currentUser, timeAgo = () => '' }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReplySubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onReply(comment.comment_id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    } catch (error) {
      console.error("Reply failed:", error);
    } finally {
      setSubmitting(false);
    }
  }, [replyText, submitting, onReply, comment.comment_id]);

  return (
    <div className="comment-wrapper">
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
            {isAuthenticated && !showReplyForm && (
              <button className="reply-btn" onClick={() => setShowReplyForm(true)}>
                <MessageCircle size={14} /> Reply
              </button>
            )}
          </div>
        </div>

        {showReplyForm && (
          <form onSubmit={handleReplySubmit} className="reply-form">
            <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={`Replying to ${comment.username}...`} className="reply-input" rows="2" required autoFocus />
            <div className="reply-actions">
              <button type="button" onClick={() => setShowReplyForm(false)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !replyText.trim()} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                <Send size={14} />{submitting ? 'Posting...' : 'Reply'}
              </button>
            </div>
          </form>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-container">
          {comment.replies.map((reply) => (
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .comment-wrapper { position: relative; }
        .comment { display: flex; flex-direction: column; gap: 0.5rem; }
        .comment-main { display: flex; align-items: flex-start; gap: 0.75rem; }
        .comment-avatar { width: 36px; height: 36px; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem; flex-shrink: 0; }
        .reply-avatar { width: 32px; height: 32px; font-size: 0.8125rem; }
        .comment-content { flex: 1; }
        .comment-meta { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.25rem; }
        .comment-author { font-weight: 600; color: var(--text-primary); font-size: 0.9375rem; }
        .comment-time { font-size: 0.8125rem; color: var(--text-secondary); }
        .comment-text { color: var(--text-secondary); font-size: 0.9375rem; line-height: 1.6; margin: 0.25rem 0 0.5rem; white-space: pre-wrap; word-break: break-word; }
        .reply-btn { background: none; border: none; color: var(--text-secondary); font-size: 0.8125rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.375rem; font-weight: 600; padding: 0.25rem 0; transition: color 0.2s; }
        .reply-btn:hover { color: var(--accent); }
        .reply-form { margin-top: 0.75rem; padding-left: calc(36px + 0.75rem); }
        .reply-input { width: 100%; padding: 0.75rem 1rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-primary); font-family: inherit; font-size: 0.9375rem; resize: vertical; margin-bottom: 0.5rem; transition: all 0.2s; }
        .reply-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-light); }
        .reply-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
        .replies-container { position: relative; margin-top: 1rem; margin-left: calc(36px / 2); padding-left: calc(0.75rem + (36px / 2)); display: flex; flex-direction: column; gap: 1rem; }
        .replies-container::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background-color: var(--border-color); border-radius: 1px; }
        @media (max-width: 480px) { .replies-container { margin-left: calc(36px / 2); padding-left: calc(0.5rem + (36px / 2)); } .reply-form { padding-left: 0; } }
      `}</style>
    </div>
  );
});

Comment.displayName = 'Comment';

export default Comment;
