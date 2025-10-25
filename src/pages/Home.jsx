import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import Header from '../components/Header';
import MediaCard from '../components/MediaCard';
import { filesAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Loader, Image, Video, FileImage, Check, ChevronDown, BarChart, Download, Heart, Clock } from 'lucide-react';

// --- Custom Select Dropdown Component ---
const CustomSelect = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  // Find the full option object (icon + label) for the selected value
  const selectedOption = useMemo(() => {
    return options.find(option => option.value === value) || options[0]; // Fallback to first option
  }, [options, value]);

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
    onChange('sort', optionValue); // Pass 'sort' key directly
    setIsOpen(false);
  };

  return (
    <div className="sort-container" ref={selectRef}>
      <label id="sort-label" className="sr-only">{label}</label>
      <button
        type="button"
        className="filter-select" // This is the button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-labelledby="sort-label"
        aria-expanded={isOpen}
      >
        {/* Selected Option Display */}
        <div className="selected-option-label">
          {selectedOption.icon}
          <span>{selectedOption.label}</span>
        </div>
        <ChevronDown size={16} className={`chevron-icon ${isOpen ? 'open' : ''}`} />
      </button>

      {/* Dropdown Options List */}
      {isOpen && (
        <ul className="custom-options" role="listbox" aria-labelledby="sort-label">
          {options.map((option) => (
            <li
              key={option.value}
              id={`option-${option.value}`}
              className={`custom-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => handleSelectOption(option.value)}
              role="option"
              aria-selected={option.value === value}
            >
              <div className="option-label">
                {option.icon}
                <span>{option.label}</span>
              </div>
              {option.value === value && <Check size={16} className="check-icon" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
// --- End Custom Select Component ---


// --- Main Home Component ---
const Home = ({ theme, toggleTheme, openUploadModal, openAuthModal }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [files, setFiles] = useState([]); // This will store ALL files fetched from the API
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    sort: 'recent',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const breakpointColumns = {
    default: 4, 1400: 4, 1100: 3, 768: 2, 500: 1,
  };

  // --- Data Loading Function ---
  // Fetches based on 'search' and 'page'. Filtering/sorting is done on the frontend.
  const loadFiles = useCallback(async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    console.log(`Loading files - Page: ${currentPage}, Search: "${filters.search}", Reset: ${reset}`);

    try {
      const params = {
        page: currentPage,
        limit: 20,
        search: filters.search.trim() || undefined,
        // 'type' and 'sort' are NOT sent to the backend
      };

      const response = await filesAPI.getAll(params);
      const newFiles = response.data.files || [];
      const pagination = response.data.pagination;
      console.log('API Response:', response.data);

      setFiles((prevFiles) => {
        if (reset) {
          return newFiles; // Replace files
        } else {
          // Append new files, preventing duplicates
          const existingIds = new Set(prevFiles.map(f => f.file_id));
          const uniqueNewFiles = newFiles.filter(nf => !existingIds.has(nf.file_id));
          return [...prevFiles, ...uniqueNewFiles];
        }
      });

      setPage(currentPage + 1);
      setHasMore(pagination?.has_next ?? newFiles.length === params.limit);

    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
      setHasMore(false);
    } finally {
      setLoading(false);
      if (reset) setIsInitialLoad(false);
    }
  }, [page, filters.search]);

  // --- Frontend Filtering & Sorting ---
  const filteredAndSortedFiles = useMemo(() => {
    // FIXED: Changed console.log to only use dependencies listed in the array
    console.log("Applying frontend filters/sort:", { type: filters.type, sort: filters.sort });
    let result = [...files]; // Start with all fetched files

    // 1. Filter by Type
    if (filters.type !== 'all') {
      result = result.filter(file => file.file_type === filters.type);
    }

    // 2. Sort
    switch (filters.sort) {
      case 'views': result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0)); break;
      case 'downloads': result.sort((a, b) => (b.download_count || 0) - (a.download_count || 0)); break;
      case 'likes': result.sort((a, b) => (b.like_count || 0) - (a.like_count || 0)); break;
      case 'recent': default: result.sort((a, b) => new Date(b.uploaded_at || b.created_at) - new Date(a.uploaded_at || a.created_at)); break;
    }
    console.log(`Filtered/Sorted Result: ${result.length} items`);
    return result;
  }, [files, filters.type, filters.sort]);


  // --- Initial Load & Search Query Sync ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search') || '';
    if (search !== filters.search || isInitialLoad) {
      console.log(`Search query changed or initial load. New search: "${search}"`);
      setFilters({ type: 'all', sort: 'recent', search: search });
      setPage(1);
      loadFiles(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, isInitialLoad]);


  // --- Infinite Scroll ---
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000 &&
        !loading && hasMore
      ) {
        console.log("Triggering loadFiles (reset=false) due to infinite scroll");
        loadFiles(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore, loadFiles]);


  // --- Event Handlers ---
  const handleFilterChange = (key, value) => {
    if (filters[key] !== value) {
      console.log(`Filter changed - ${key}: ${value}`);
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  // --- Sort Options (for CustomSelect) ---
  const sortOptions = [
    { value: 'recent', label: 'Recent', icon: <Clock size={16} /> },
    { value: 'views', label: 'Most Viewed', icon: <BarChart size={16} /> },
    { value: 'downloads', label: 'Downloads', icon: <Download size={16} /> },
    { value: 'likes', label: 'Most Liked', icon: <Heart size={16} /> },
  ];

  // --- Render ---
  const FilterButton = ({ value, label, current }) => (
    <button
      className={`filter-btn ${current === value ? 'active' : ''}`}
      onClick={() => handleFilterChange('type', value)}
      aria-pressed={current === value}
    >
      {label}
    </button>
  );

  return (
    <main className="home-page">
      <div className="container">
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          openUploadModal={openUploadModal}
          openAuthModal={openAuthModal}
        />

        {/* Filters */}
        <div className="filters-bar">
          <div className="filter-group" role="group" aria-label="Filter by type">
            <FilterButton value="all" label="All" current={filters.type} />
            <FilterButton value="images" label={<Image size={16} aria-hidden="true" />} current={filters.type} />
            <FilterButton value="videos" label={<Video size={16} aria-hidden="true" />} current={filters.type} />
            <FilterButton value="gifs" label={<FileImage size={16} aria-hidden="true" />} current={filters.type} />
          </div>

          {/* --- Render Custom Select --- */}
          <CustomSelect
            label="Sort by:"
            options={sortOptions}
            value={filters.sort}
            onChange={handleFilterChange}
          />
        </div>

        {/* Masonry Grid - Renders the filtered and sorted files */}
        {(filteredAndSortedFiles.length > 0 || (loading && isInitialLoad)) && (
          <Masonry
            breakpointCols={breakpointColumns}
            className="masonry-grid"
            columnClassName="masonry-grid-column"
          >
            {filteredAndSortedFiles.map((file) => (
              <MediaCard
                key={file.file_id}
                file={file}
                onClick={() => navigate(`/media/${file.file_id}`)}
              />
            ))}
          </Masonry>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="page-state loading-state">
            <Loader className="spinner" size={isInitialLoad ? 48 : 32} />
            {isInitialLoad && <p>Loading files...</p>}
          </div>
        )}

        {/* Empty State - Now checks filtered list */}
        {!loading && filteredAndSortedFiles.length === 0 && (
          <div className="page-state empty-state">
            <div className="empty-icon">📭</div>
            <h2>No files found</h2>
            <p>
              {filters.search
                ? 'Your search returned no results.'
                : (filters.type !== 'all' ? `No ${filters.type} found.` : 'Upload something to get started!')}
            </p>
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <footer className="home-footer">
            <p>© {new Date().getFullYear()} LeakHere</p>
          </footer>
        )}
      </div>

      {/* --- STYLES --- */}
      <style jsx>{`
        .home-page { flex: 1; display: flex; flex-direction: column; }
        .container { flex: 1; display: flex; flex-direction: column; width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

        .filters-bar { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; align-items: center; }
        .filter-group { display: flex; gap: 0.5rem; background: var(--bg-secondary); padding: 0.5rem; border-radius: 12px; border: 1px solid var(--border-color); overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .filter-group::-webkit-scrollbar { display: none; }

        .filter-btn {
          background: transparent; border: none; color: var(--text-secondary);
          padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;
          font-weight: 600; font-size: 0.9rem; display: flex; gap: 0.4rem;
          align-items: center; transition: all 0.2s ease-out;
          white-space: nowrap;
        }
        .filter-btn:hover:not(.active) {
          color: var(--text-primary);
          transform: scale(1.03); /* Polished lift */
          box-shadow: var(--shadow-sm);
          background: var(--bg-secondary);
        }
        .filter-btn.active { background: var(--accent); color: white; }
        .filter-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

        /* --- Polished Custom Select Dropdown Styles --- */
        .sort-container { 
          position: relative; 
          flex-shrink: 0;
          min-width: 170px;
        }
        
        :global(button.filter-select) { /* Target the button */
          width: 100%;
          padding: 0.6rem 1rem; /* Slightly reduced padding */
          background: var(--bg-hover); /* Not-whitish background */
          border: 1px solid var(--border-color);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 0.9rem;
          font-weight: 500; /* Lighter weight */
          cursor: pointer;
          transition: all 0.2s ease-out;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          text-align: left;
        }
        :global(button.filter-select:hover) { 
          border-color: var(--text-tertiary); 
          background: var(--bg-secondary); /* Pop to white */
          transform: translateY(-1px); /* Add lift */
          box-shadow: var(--shadow-md); /* Add shadow */
        }
        :global(button.filter-select:focus-visible),
        :global(button.filter-select[aria-expanded="true"]) {
          outline: none; 
          border-color: var(--accent);
          background: var(--bg-secondary); /* Pop to white */
          box-shadow: 0 0 0 3px var(--accent-light), var(--shadow-md); /* Keep shadow */
        }
        
        :global(.selected-option-label) {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-grow: 1;
          overflow: hidden;
        }
        :global(.selected-option-label span) {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--text-primary); /* Ensure text is primary */
          font-weight: 500; /* Match button font weight */
        }
        :global(.selected-option-label svg) {
          color: var(--text-secondary); /* Softer icon color */
          flex-shrink: 0;
        }

        :global(.filter-select .chevron-icon) {
          color: var(--text-tertiary);
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          opacity: 0.7;
        }
        :global(button.filter-select:hover .chevron-icon) {
          opacity: 1;
        }
        :global(.filter-select .chevron-icon.open) {
          transform: rotate(180deg);
          color: var(--accent);
          opacity: 1;
        }

        :global(.custom-options) {
          position: absolute;
          top: calc(100% + 6px); /* More space */
          left: 0;
          width: 100%; /* Match button width */
          min-width: 200px; /* Ensure it's wide enough for options */
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          box-shadow: var(--shadow-lg); /* Heavier shadow */
          padding: 0.5rem;
          list-style: none;
          z-index: 101;
          max-height: 250px;
          overflow-y: auto;
          /* New Animation */
          animation: scaleIn 0.15s cubic-bezier(0.165, 0.84, 0.44, 1) both;
          transform-origin: top;
        }
        /* Animation for the dropdown */
        @keyframes scaleIn { 
          from { opacity: 0; transform: scaleY(0.95) translateY(-5px); } 
          to { opacity: 1; transform: scaleY(1) translateY(0); } 
        }

        :global(.custom-option) {
          padding: 0.65rem 0.75rem; /* Tweaked padding */
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
          display: flex; /* This is the fix */
          align-items: center; /* Vertically center */
          justify-content: space-between; /* Push check to the end */
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        :global(.custom-option:hover) { background: var(--bg-hover); }
        :global(.custom-option.selected) {
          background: var(--accent-light);
          color: var(--accent);
          font-weight: 600;
        }
        :global(.custom-option .option-label) {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          /* No flex-grow or margin needed with space-between on parent */
        }
        :global(.custom-option .option-label svg) {
            color: var(--text-secondary); /* Default icon color */
            flex-shrink: 0;
        }
        :global(.custom-option.selected .option-label svg) {
            color: var(--accent); /* Selected icon color */
        }
        :global(.custom-option .check-icon) {
            color: var(--accent);
            flex-shrink: 0;
            /* No margin-left: auto needed */
        }
        /* --- End Custom Select Styles --- */

        .masonry-grid { display: flex; margin-left: -1rem; width: auto; }
        .masonry-grid-column { padding-left: 1rem; background-clip: padding-box; }

        .page-state { text-align: center; padding: 4rem 1rem; color: var(--text-secondary); flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .loading-state { padding: 2rem 1rem; }
        .page-state .spinner { margin-bottom: 1rem; }
        .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
        .page-state h2 { font-size: 1.25rem; color: var(--text-primary); margin-bottom: 0.5rem; }

        .home-footer { text-align: center; padding: 2rem 0; color: var(--text-tertiary); font-size: 0.85rem; font-weight: 500; margin-top: auto; }
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }

        @media (max-width: 768px) {
            .container { padding: 0 1rem; }
            .masonry-grid { margin-left: -0.75rem; }
            .masonry-grid-column { padding-left: 0.75rem; }
        }
        @media (max-width: 550px) {
            .filters-bar { flex-direction: column; align-items: stretch; gap: 0.75rem; }
            .filter-group { justify-content: space-between; }
            .filter-btn { padding: 0.5rem 0.75rem; font-size: 0.85rem; flex-grow: 1; text-align: center; }
            .sort-container { width: 100%; }
            :global(button.filter-select) { width: 100%; } /* Ensure button is full-width on mobile */
            .masonry-grid { margin-left: -0.5rem; }
            .masonry-grid-column { padding-left: 0.5rem; }
        }
      `}</style>
    </main>
  );
};

export default Home;