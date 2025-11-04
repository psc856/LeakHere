import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import Header from '../components/Header';
import MediaCard from '../components/MediaCard';
import { filesAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Loader, Image, Video, FileImage, FileText, Check, ChevronDown, BarChart, Download, Heart, Clock, Grid, ChevronLeft, ChevronRight } from 'lucide-react';

const CustomSelect = memo(({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const selectedOption = useMemo(() => options.find(o => o.value === value) || options[0], [options, value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback((val) => {
    onChange('sort', val);
    setIsOpen(false);
  }, [onChange]);

  return (
    <div className="sort-container" ref={selectRef}>
      <label id="sort-label" className="sr-only">{label}</label>
      <button type="button" className="filter-select" onClick={() => setIsOpen(!isOpen)} aria-haspopup="listbox" aria-expanded={isOpen}>
        <div className="selected-option-label">
          {selectedOption.icon}
          <span>{selectedOption.label}</span>
        </div>
        <ChevronDown size={16} className={`chevron-icon ${isOpen ? 'open' : ''}`} />
      </button>
      {isOpen && (
        <ul className="custom-options" role="listbox">
          {options.map((opt) => (
            <li key={opt.value} className={`custom-option ${opt.value === value ? 'selected' : ''}`} onClick={() => handleSelect(opt.value)} role="option" aria-selected={opt.value === value}>
              <div className="option-label">{opt.icon}<span>{opt.label}</span></div>
              {opt.value === value && <Check size={16} className="check-icon" />}
            </li>
          ))}
        </ul>
      )}
      <style jsx>{`
        .sort-container { position: relative; flex-shrink: 0; min-width: 180px; }
        .filter-select { width: 100%; padding: 0.75rem 1.25rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); color: var(--text-primary); font-size: 0.9375rem; font-weight: 600; cursor: pointer; transition: all 0.25s; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; box-shadow: var(--shadow-md); font-family: inherit; }
        .filter-select:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .selected-option-label { display: flex; align-items: center; gap: 0.75rem; flex-grow: 1; }
        .selected-option-label span { color: var(--text-primary); font-weight: 600; }
        .selected-option-label :global(svg) { color: var(--accent); flex-shrink: 0; }
        .chevron-icon { color: var(--text-tertiary); transition: transform 0.3s; flex-shrink: 0; }
        .chevron-icon.open { transform: rotate(180deg); color: var(--accent); }
        .custom-options { position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); padding: 0.5rem; list-style: none; z-index: 101; max-height: 280px; overflow-y: auto; animation: dropdownSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes dropdownSlide { from { opacity: 0; transform: translateY(-8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .custom-option { padding: 0.75rem 1rem; border-radius: var(--radius-md); cursor: pointer; font-size: 0.9375rem; font-weight: 500; color: var(--text-primary); display: flex; align-items: center; justify-content: space-between; transition: all 0.2s; margin-bottom: 0.25rem; }
        .custom-option:hover { background: var(--bg-hover); transform: translateX(4px); }
        .custom-option.selected { background: var(--accent-light); color: var(--accent); font-weight: 600; }
        .option-label { display: flex; align-items: center; gap: 0.75rem; }
        .option-label :global(svg) { color: var(--text-secondary); flex-shrink: 0; }
        .custom-option.selected .option-label :global(svg) { color: var(--accent); }
        .check-icon { color: var(--accent); animation: checkPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        @keyframes checkPop { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        @media (max-width: 640px) { .sort-container { width: auto; min-width: 120px; } .filter-select { padding: 0.625rem 0.75rem; min-width: 120px; gap: 0.5rem; } .selected-option-label { display: flex; } .selected-option-label span { font-size: 0.8125rem; } .selected-option-label :global(svg) { width: 14px; height: 14px; } .custom-options { left: auto; right: 0; width: max-content; min-width: 180px; } }
      `}</style>
    </div>
  );
});

CustomSelect.displayName = 'CustomSelect';

const FilterButton = memo(({ value, label, icon: Icon, current, onClick }) => (
  <button className={`filter-btn ${current === value ? 'active' : ''}`} onClick={() => onClick('type', value)} aria-pressed={current === value}>
    {Icon && <Icon size={18} />}
    <span className="filter-label">{label}</span>
  </button>
));

FilterButton.displayName = 'FilterButton';

const Home = ({ theme, toggleTheme, openUploadModal, openAuthModal }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: 'all', sort: 'recent', search: '' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const scrollTimeoutRef = useRef(null);
  const filterGroupRef = useRef(null);
  const [showScrollIndicators, setShowScrollIndicators] = useState({ left: false, right: false });

  const breakpointColumns = { default: 4, 1400: 4, 1100: 3, 768: 2, 500: 1 };

  const loadFiles = useCallback(async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    try {
      const params = { page: currentPage, limit: 20, search: filters.search.trim() || undefined };
      const response = await filesAPI.getAll(params);
      const newFiles = response.data.files || [];
      const pagination = response.data.pagination;
      
      // Debug: Check what fields are available
      if (newFiles.length > 0) {
        console.log('File data structure:', newFiles[0]);
      }

      
      setFiles((prev) => {
        if (reset) return newFiles;
        const existingIds = new Set(prev.map(f => f.file_id));
        return [...prev, ...newFiles.filter(nf => !existingIds.has(nf.file_id))];
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

  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files];
    if (filters.type !== 'all') result = result.filter(f => f.file_type === filters.type);
    
    switch (filters.sort) {
      case 'views': result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0)); break;
      case 'downloads': result.sort((a, b) => (b.download_count || 0) - (a.download_count || 0)); break;
      case 'likes': result.sort((a, b) => (b.like_count || 0) - (a.like_count || 0)); break;
      default: result.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
    }
    return result;
  }, [files, filters.type, filters.sort]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search') || '';
    if (search !== filters.search || isInitialLoad) {
      setFilters(prev => ({ ...prev, search }));
      setPage(1);
      loadFiles(true);
    }
  }, [location.search, isInitialLoad, loadFiles]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 800 && !loading && hasMore) {
          loadFiles(false);
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [loading, hasMore, loadFiles]);

  const handleFilterChange = useCallback((key, value) => {
    if (filters[key] !== value) {
      setFilters(prev => ({ ...prev, [key]: value }));
      if (key === 'type' || key === 'sort') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [filters]);

  const checkScrollIndicators = useCallback(() => {
    const el = filterGroupRef.current;
    if (!el) return;
    const hasScroll = el.scrollWidth > el.clientWidth;
    setShowScrollIndicators({
      left: hasScroll && el.scrollLeft > 5,
      right: hasScroll && el.scrollLeft < el.scrollWidth - el.clientWidth - 5
    });
  }, []);

  useEffect(() => {
    checkScrollIndicators();
    const el = filterGroupRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollIndicators);
      window.addEventListener('resize', checkScrollIndicators);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScrollIndicators);
      window.removeEventListener('resize', checkScrollIndicators);
    };
  }, [checkScrollIndicators]);

  const sortOptions = [
    { value: 'recent', label: 'Recent', icon: <Clock size={16} /> },
    { value: 'views', label: 'Most Viewed', icon: <BarChart size={16} /> },
    { value: 'downloads', label: 'Downloads', icon: <Download size={16} /> },
    { value: 'likes', label: 'Most Liked', icon: <Heart size={16} /> },
  ];

  return (
    <main className="home-page">
      <div className="container">
        <Header theme={theme} toggleTheme={toggleTheme} openUploadModal={openUploadModal} openAuthModal={openAuthModal} />

        <div className="filters-bar">
          <div className="filter-group-wrapper">
            {showScrollIndicators.left && (
              <div className="scroll-indicator left">
                <ChevronLeft size={16} />
              </div>
            )}
            <div className="filter-group" ref={filterGroupRef} role="group" aria-label="Filter by type">
              <FilterButton value="all" label="All" icon={Grid} current={filters.type} onClick={handleFilterChange} />
              <FilterButton value="images" label="Images" icon={Image} current={filters.type} onClick={handleFilterChange} />
              <FilterButton value="videos" label="Videos" icon={Video} current={filters.type} onClick={handleFilterChange} />
              <FilterButton value="gifs" label="GIFs" icon={FileImage} current={filters.type} onClick={handleFilterChange} />
              <FilterButton value="documents" label="Docs" icon={FileText} current={filters.type} onClick={handleFilterChange} />
            </div>
            {showScrollIndicators.right && (
              <div className="scroll-indicator right">
                <ChevronRight size={16} />
              </div>
            )}
          </div>
          <CustomSelect label="Sort by:" options={sortOptions} value={filters.sort} onChange={handleFilterChange} />
        </div>

        {(filteredAndSortedFiles.length > 0 || (loading && isInitialLoad)) && (
          <Masonry breakpointCols={breakpointColumns} className="masonry-grid" columnClassName="masonry-grid-column">
            {filteredAndSortedFiles.map((file, idx) => (
              <div key={file.file_id} className="masonry-item" style={{ animationDelay: `${Math.min(idx * 0.03, 0.5)}s` }}>
                <MediaCard file={file} onClick={() => navigate(`/media/${file.file_id}`)} />
              </div>
            ))}
          </Masonry>
        )}

        {loading && (
          <div className="page-state loading-state">
            <Loader className="spinner" size={isInitialLoad ? 48 : 32} />
            {isInitialLoad && <p className="loading-text">Loading files...</p>}
          </div>
        )}

        {!loading && filteredAndSortedFiles.length === 0 && (
          <div className="page-state empty-state">
            <div className="empty-icon">📁</div>
            <h2>No files found</h2>
            <p>{filters.search ? 'Your search returned no results.' : filters.type !== 'all' ? `No ${filters.type} found.` : 'Upload something to get started!'}</p>
          </div>
        )}

        {!loading && filteredAndSortedFiles.length > 0 && (
          <footer className="home-footer">
            <p>© {new Date().getFullYear()} LeakHere</p>
          </footer>
        )}
      </div>

      <style jsx>{`
        .home-page { flex: 1; display: flex; flex-direction: column; min-height: 100vh; }
        .container { flex: 1; display: flex; flex-direction: column; width: 100%; max-width: 1400px; margin: 0 auto; padding: 0 2rem; }
        .filters-bar { display: flex; justify-content: space-between; gap: 1.25rem; margin-bottom: 2.5rem; flex-wrap: wrap; align-items: center; animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .filter-group-wrapper { position: relative; flex: 1; min-width: 0; }
        .filter-group { display: flex; gap: 0.625rem; background: var(--bg-secondary); padding: 0.625rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-md); overflow-x: auto; scrollbar-width: thin; }
        .scroll-indicator { position: absolute; top: 50%; transform: translateY(-50%); background: linear-gradient(90deg, var(--bg-secondary) 60%, transparent); width: 40px; height: 100%; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 10; animation: pulse 2s ease-in-out infinite; }
        .scroll-indicator.left { left: 0; border-radius: var(--radius-lg) 0 0 var(--radius-lg); }
        .scroll-indicator.right { right: 0; background: linear-gradient(270deg, var(--bg-secondary) 60%, transparent); border-radius: 0 var(--radius-lg) var(--radius-lg) 0; }
        .scroll-indicator svg { color: var(--accent); filter: drop-shadow(0 0 4px var(--accent)); }
        .filter-btn { background: transparent; border: none; color: var(--text-secondary); padding: 0.75rem 1.25rem; border-radius: var(--radius-md); cursor: pointer; font-weight: 600; font-size: 0.9375rem; display: flex; gap: 0.5rem; align-items: center; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); white-space: nowrap; }
        .filter-btn:hover:not(.active) { color: var(--text-primary); background: var(--bg-hover); transform: translateY(-2px); }
        .filter-btn.active { background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%); color: white; box-shadow: 0 4px 16px rgba(var(--accent-rgb), 0.4); }
        .masonry-grid { display: flex; margin-left: -1.25rem; width: auto; }
        .masonry-grid-column { padding-left: 1.25rem; background-clip: padding-box; }
        .masonry-item { margin-bottom: 1.25rem; animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .page-state { text-align: center; padding: 4rem 1rem; color: var(--text-secondary); flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; animation: fadeIn 0.4s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .loading-state { padding: 3rem 1rem; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { font-weight: 500; color: var(--text-secondary); animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .empty-icon { font-size: 4rem; margin-bottom: 1.5rem; animation: bounce 2s ease-in-out infinite; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .page-state h2 { font-size: 1.5rem; color: var(--text-primary); margin-bottom: 0.75rem; font-weight: 700; }
        .home-footer { text-align: center; padding: 3rem 0; color: var(--text-tertiary); font-size: 0.9375rem; font-weight: 500; margin-top: 4rem; border-top: 1px solid var(--border-color); }
        @media (max-width: 768px) { .container { padding: 0 1rem; } .filter-group { padding: 0.4rem; gap: 0.4rem; } .filter-btn { padding: 0.625rem 1rem; font-size: 0.875rem; } .masonry-grid { margin-left: -0.75rem; } .masonry-grid-column { padding-left: 0.75rem; } .masonry-item { margin-bottom: 0.75rem; } }
        @media (max-width: 640px) { .filters-bar { flex-direction: row; gap: 0.5rem; flex-wrap: nowrap; } .filter-group-wrapper { flex: 1; } .filter-group { overflow-x: auto; scrollbar-width: none; } .filter-group::-webkit-scrollbar { display: none; } .scroll-indicator { width: 32px; } .scroll-indicator svg { width: 14px; height: 14px; } .filter-btn { padding: 0.625rem 0.5rem; font-size: 0.75rem; gap: 0.3rem; min-width: 44px; justify-content: center; } .filter-btn svg { width: 18px; height: 18px; } .filter-label { display: none; } .masonry-grid { margin-left: -0.5rem; } .masonry-grid-column { padding-left: 0.5rem; } .masonry-item { margin-bottom: 0.5rem; } }
        @media (hover: none) and (pointer: coarse) { .filter-btn:hover { transform: none; } .filter-btn:active { transform: scale(0.95); } }
      `}</style>
    </main>
  );
};

export default Home;
