import { useState, useRef } from 'react';
import Header from './components/Header.jsx';
import SearchPage from './components/SearchPage.jsx';
import ConversationPage from './components/ConversationPage.jsx';
import './App.css';

const HISTORY_KEY = 'golfwrx-history';
const MAX_HISTORY = 15;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToHistory(conversation) {
  const userMsg = conversation.find(m => m.role === 'user');
  const assistantMsg = conversation.find(m => m.role === 'assistant' && !m.error);
  if (!userMsg || !assistantMsg) return;

  const entry = {
    id: Date.now(),
    timestamp: Date.now(),
    title: userMsg.content,
    preview: assistantMsg.content.replace(/[#*`]/g, '').trim().slice(0, 120),
    messages: conversation.filter(m => !m.streaming),
  };

  const history = loadHistory().filter(h => h.title !== entry.title);
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

export default function App() {
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const abortRef = useRef(null);

  async function askQuestion(query) {
    if (!query.trim() || isLoading) return;

    const userMessage = { role: 'user', content: query, timestamp: Date.now() };
    const updatedConversation = [...conversation, userMessage];
    setConversation(updatedConversation);
    setIsLoading(true);
    setStatusMessage('Searching GolfWRX forums...');

    // Placeholder for streaming response
    const assistantPlaceholder = {
      role: 'assistant',
      content: '',
      sources: [],
      streaming: true,
      timestamp: Date.now(),
    };
    setConversation([...updatedConversation, assistantPlaceholder]);

    try {
      // Build history for context (exclude the current query)
      const history = conversation.map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : msg.content,
      }));

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, conversationHistory: history }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let sources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'status') {
              setStatusMessage(data.message);
            } else if (data.type === 'text') {
              fullText += data.content;
              setConversation(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: fullText,
                };
                return updated;
              });
            } else if (data.type === 'done') {
              sources = data.sources || [];
              setConversation(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: fullText,
                  sources,
                  streaming: false,
                };
                saveToHistory(updated);
                return updated;
              });
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          } catch (parseError) {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setConversation(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: 'Sorry, I encountered an error fetching GolfWRX data. Please check your API key and try again.',
          sources: [],
          streaming: false,
          error: true,
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  }

  function resetConversation() {
    setConversation([]);
    setIsLoading(false);
    setStatusMessage('');
  }

  function resumeConversation(messages) {
    setConversation(messages);
  }

  const hasConversation = conversation.length > 0;

  return (
    <div className="app">
      <Header onLogoClick={resetConversation} />
      <main className="main">
        {!hasConversation ? (
          <SearchPage onAsk={askQuestion} isLoading={isLoading} onResume={resumeConversation} />
        ) : (
          <ConversationPage
            conversation={conversation}
            onAsk={askQuestion}
            isLoading={isLoading}
            statusMessage={statusMessage}
            onReset={resetConversation}
          />
        )}
      </main>
    </div>
  );
}
