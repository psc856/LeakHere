// src/components/ReportModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Flag, Send, Loader, ChevronDown, Check } from 'lucide-react';
import { reportAPI } from '../services/api';
import { toast } from 'react-toastify';

// --- Reusable Custom Select Component ---
// We build this to have full control over styling
const CustomSelect = ({ label, options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const selectedOption = options.find(option => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectRef]);

  const handleSelectOption = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="custom-select-wrapper" ref={selectRef}>
      <label htmlFor="custom-select-button">{label}</label>
      <button
        type="button"
        id="custom-select-button"
        className={`custom-select-trigger ${value ? 'has-value' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={18} className={`chevron-icon ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <ul className="custom-options" role="listbox" aria-activedescendant={selectedOption ? `option-${selectedOption.value}` : undefined}>
          {options.map((option) => (
            <li
              key={option.value}
              id={`option-${option.value}`}
              className={`custom-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleSelectOption(option.value)}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
              {option.value === value && <Check size={16} />}
            </li>
          ))}
        </ul>
      )}
      <style jsx>{`
        .custom-select-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .custom-select-wrapper label {
          font-weight: 600; color: var(--text-primary); font-size: 0.85rem;
          padding-left: 0.25rem;
        }
        .custom-select-trigger {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--bg-primary); border: 1px solid var(--border-color);
          border-radius: 8px; color: var(--text-primary);
          font-family: inherit; font-size: 0.9rem;
          transition: all 0.2s;
          display: flex; justify-content: space-between; align-items: center;
          cursor: pointer; text-align: left;
        }
        .custom-select-trigger:focus, .custom-select-trigger:focus-visible {
          outline: none; border-color: var(--accent);
          background-color: var(--bg-secondary);
          box-shadow: 0 0 0 3px var(--accent-light);
        }
        .custom-select-trigger span {
          color: var(--text-primary);
        }
        .custom-select-trigger:not(.has-value) span { /* Placeholder text style */
            color: var(--text-tertiary);
        }
        .chevron-icon {
            color: var(--text-tertiary);
            transition: transform 0.2s ease;
        }
        .chevron-icon.open {
            transform: rotate(180deg);
        }

        .custom-options {
          position: absolute;
          top: calc(100% + 4px); /* Position below the button with a small gap */
          left: 0;
          right: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: var(--shadow-lg);
          padding: 0.5rem;
          list-style: none;
          z-index: 10;
          max-height: 200px; /* Prevent huge lists */
          overflow-y: auto;
          animation: fadeIn 0.1s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

        .custom-option {
          padding: 0.75rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .custom-option:hover {
          background: var(--bg-hover);
        }
        .custom-option.selected {
          background: var(--accent-light);
          color: var(--accent);
          font-weight: 600;
        }
        .custom-option.selected svg {
            color: var(--accent);
        }
      `}</style>
    </div>
  );
};
// --- End Custom Select Component ---


// --- Main Report Modal Component ---
const ReportModal = ({ fileId, onClose }) => {
  const [reason, setReason] = useState(''); // This will now store the 'value' (e.g., 'copyright')
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      toast.error('Please select a reason for reporting.');
      return;
    }
    if (!details.trim()) {
      toast.error('Please provide some details for your report.');
      return;
    }

    setSubmitting(true);
    try {
      // Find the full label for the selected reason value
      const reasonLabel = reasons.find(r => r.value === reason)?.label || reason;
      const reportReason = `Category: ${reasonLabel}\n\nDetails: ${details.trim()}`;

      await reportAPI.sendReport({
        file_id: fileId,
        reason: reportReason,
        reported_at: new Date().toISOString(),
      });

      toast.success('Report submitted successfully. Thank you.');
      onClose(); // Close the modal on success
    } catch (error) {
      console.error("Report failed:", error);
      toast.error(error.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const reasons = [
    { value: 'copyright', label: 'Copyright Infringement' },
    { value: 'inappropriate', label: 'Inappropriate Content' },
    { value: 'spam', label: 'Spam or Misleading' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="report-modal-title"><Flag size={18} /> Report Content</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close modal"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <p className="report-info">
            Why are you reporting this content? Your report is anonymous.
          </p>

          {/* Use the new CustomSelect component */}
          <CustomSelect
            label="Reason"
            options={reasons}
            value={reason}
            onChange={(newValue) => setReason(newValue)}
            placeholder="Select a reason..."
          />

          <div className="form-group">
            <label htmlFor="report-details">Details</label>
            <textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide additional details to help us review this content."
              className="report-textarea"
              rows="4"
              required
            />
          </div>

          <div className="report-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={submitting}>
              {submitting ? <Loader size={16} className="spinner" /> : <Send size={16} />}
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 1rem; animation: fadeIn 0.2s ease;
        }
        .report-modal {
          background: var(--bg-secondary); border-radius: 16px; max-width: 500px;
          width: 100%; border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg); animation: scaleIn 0.3s ease;
          display: flex; flex-direction: column;
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
        }
        .modal-header h2 {
          font-size: 1.25rem; font-weight: 600; margin: 0;
          display: flex; align-items: center; gap: 0.5rem;
          color: var(--error); /* Highlight title in red */
        }
        .close-btn {
          background: none; border: none; width: 32px; height: 32px;
          border-radius: 50%; cursor: pointer; color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .close-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

        .report-form {
          padding: 1.5rem; display: flex; flex-direction: column;
          gap: 1rem; overflow-y: auto;
        }
        .report-info {
          font-size: 0.9rem; color: var(--text-secondary);
          margin-bottom: 0.5rem; line-height: 1.5;
        }

        /* Styles for the InputGroup's textarea */
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group label {
          font-weight: 600; color: var(--text-primary); font-size: 0.85rem;
          padding-left: 0.25rem;
        }
        .form-group textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 0.75rem 1rem;
          background: var(--bg-primary); border: 1px solid var(--border-color);
          border-radius: 8px; color: var(--text-primary);
          font-family: inherit; font-size: 0.9rem;
          transition: all 0.2s;
        }
        .form-group textarea { resize: vertical; min-height: 80px; }
        .form-group textarea:focus {
          outline: none; border-color: var(--accent);
          background-color: var(--bg-secondary);
          box-shadow: 0 0 0 3px var(--accent-light);
        }
        /* End textarea styles */

        .report-actions {
          display: flex; gap: 0.75rem; justify-content: flex-end;
          margin-top: 0.5rem;
        }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ReportModal;