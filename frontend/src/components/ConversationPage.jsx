import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './ConversationPage.css';

function SourceCard({ source }) {
  const authors = source.authors && source.authors.length > 0
    ? source.authors.slice(0, 3).join(', ')
    : 'GolfWRX Members';

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="source-card"
    >
      <div className="source-card-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div className="source-card-content">
        <div className="source-card-title">{source.title || 'GolfWRX Thread'}</div>
        <div className="source-card-meta">
          <span className="source-card-authors">{authors}</span>
          <span className="source-card-domain">forums.golfwrx.com</span>
        </div>
      </div>
      <svg className="source-card-external" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15,3 21,3 21,9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}

function AssistantMessage({ message }) {
  return (
    <div className="message assistant-message">
      <div className="message-avatar assistant-avatar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      </div>
      <div className="message-body">
        <div className="message-label">GolfWRX AI</div>
        <div className={`message-content ${message.streaming ? 'streaming' : ''} ${message.error ? 'error' : ''}`}>
          {message.content ? (
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <div className="typing-indicator">
              <span /><span /><span />
            </div>
          )}
          {message.streaming && message.content && <span className="cursor" />}
        </div>

        {!message.streaming && message.sources && message.sources.length > 0 && (
          <div className="sources-section">
            <div className="sources-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Sources from GolfWRX Forums
            </div>
            <div className="sources-list">
              {message.sources.map((source, i) => (
                <SourceCard key={i} source={source} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UserMessage({ message }) {
  return (
    <div className="message user-message">
      <div className="message-body user-body">
        <div className="message-label user-label">You</div>
        <div className="message-content user-content">
          {message.content}
        </div>
      </div>
      <div className="message-avatar user-avatar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
    </div>
  );
}

export default function ConversationPage({ conversation, onAsk, isLoading, statusMessage, onReset }) {
  const [followUp, setFollowUp] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  function handleSubmit(e) {
    e.preventDefault();
    if (followUp.trim() && !isLoading) {
      onAsk(followUp.trim());
      setFollowUp('');
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="conversation-page">
      <div className="conversation-toolbar">
        <button className="toolbar-back" onClick={onReset}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          New Question
        </button>
        <a
          href="https://forums.golfwrx.com"
          target="_blank"
          rel="noopener noreferrer"
          className="toolbar-forums-link"
        >
          Browse Forums
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15,3 21,3 21,9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>

      <div className="conversation-messages">
        {conversation.map((msg, i) =>
          msg.role === 'user' ? (
            <UserMessage key={i} message={msg} />
          ) : (
            <AssistantMessage key={i} message={msg} />
          )
        )}

        {isLoading && statusMessage && (
          <div className="status-message">
            <span className="status-spinner" />
            {statusMessage}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="followup-bar">
        <form onSubmit={handleSubmit} className="followup-form">
          <div className="followup-label">Ask a follow-up</div>
          <div className="followup-input-row">
            <textarea
              ref={inputRef}
              value={followUp}
              onChange={e => setFollowUp(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask another question about this topic..."
              className="followup-input"
              disabled={isLoading}
              rows={1}
            />
            <button
              type="submit"
              className="followup-button"
              disabled={!followUp.trim() || isLoading}
              aria-label="Send"
            >
              {isLoading ? (
                <span className="spinner small-spinner" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              )}
            </button>
          </div>
          <div className="followup-hint">Press Enter to send · Shift+Enter for new line</div>
        </form>
      </div>
    </div>
  );
}
