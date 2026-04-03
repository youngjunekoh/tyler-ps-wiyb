import { useState, useEffect } from 'react';
import './SearchPage.css';

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const SUGGESTED_TOPICS = [
  { icon: '🏌️', text: 'Best drivers for high handicappers 2024', category: 'Equipment' },
  { icon: '⛳', text: 'How to stop coming over the top in the swing', category: 'Technique' },
  { icon: '🎯', text: 'Titleist vs Callaway irons comparison', category: 'Equipment' },
  { icon: '📐', text: 'Proper shaft flex selection for my swing speed', category: 'Fitting' },
  { icon: '🌿', text: 'Best wedge bounce for tight lies', category: 'Equipment' },
  { icon: '💪', text: 'How to increase swing speed without losing accuracy', category: 'Technique' },
  { icon: '🏆', text: 'Putter fitting tips and recommendations', category: 'Fitting' },
  { icon: '⚙️', text: 'When to regrip golf clubs and which grips to use', category: 'Maintenance' },
];

export default function SearchPage({ onAsk, isLoading, onResume }) {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      setHistory(JSON.parse(localStorage.getItem('golfwrx-history') || '[]'));
    } catch {
      setHistory([]);
    }
  }, []);

  function clearHistory() {
    localStorage.removeItem('golfwrx-history');
    setHistory([]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      onAsk(query.trim());
    }
  }

  function handleSuggestion(text) {
    onAsk(text);
  }

  return (
    <div className="search-page">
      <div className="search-hero">
        <div className="search-hero-badge">Powered by GolfWRX Forums</div>
        <h1 className="search-title">
          Ask the GolfWRX Community
        </h1>
        <p className="search-subtitle">
          Get AI-synthesized answers sourced directly from real GolfWRX forum discussions,
          with citations to the members who said it.
        </p>

        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask anything about golf equipment, technique, or gear..."
              className="search-input"
              disabled={isLoading}
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="search-button"
            disabled={!query.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Searching...
              </>
            ) : (
              <>
                Search Forums
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="suggestions-section">
        <h2 className="suggestions-title">Popular Topics</h2>
        <div className="suggestions-grid">
          {SUGGESTED_TOPICS.map((topic, i) => (
            <button
              key={i}
              className="suggestion-card"
              onClick={() => handleSuggestion(topic.text)}
              disabled={isLoading}
            >
              <span className="suggestion-icon">{topic.icon}</span>
              <div className="suggestion-content">
                <span className="suggestion-category">{topic.category}</span>
                <span className="suggestion-text">{topic.text}</span>
              </div>
              <svg className="suggestion-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {history.length > 0 && (
        <div className="recent-section">
          <div className="recent-header">
            <h2 className="suggestions-title">Recent</h2>
            <button className="recent-clear" onClick={clearHistory}>Clear</button>
          </div>
          <div className="recent-list">
            {history.map(entry => (
              <button
                key={entry.id}
                className="recent-card"
                onClick={() => onResume(entry.messages)}
                disabled={isLoading}
              >
                <div className="recent-card-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="recent-card-content">
                  <span className="recent-card-title">{entry.title}</span>
                  {entry.preview && (
                    <span className="recent-card-preview">{entry.preview}…</span>
                  )}
                </div>
                <span className="recent-card-time">{timeAgo(entry.timestamp)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="search-footer">
        <p>
          Answers are synthesized from{' '}
          <a href="https://forums.golfwrx.com" target="_blank" rel="noopener noreferrer">
            forums.golfwrx.com
          </a>{' '}
          · Always verify equipment decisions with a professional fitting
        </p>
      </footer>
    </div>
  );
}
