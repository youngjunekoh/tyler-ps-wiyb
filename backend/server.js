require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const { gatherForumData } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a knowledgeable golf equipment and technique expert who helps golfers find answers from the GolfWRX community forums.

You have been provided with real posts from forums.golfwrx.com related to the user's question. Your job is to:

1. Synthesize the community knowledge into a clear, helpful answer
2. ALWAYS cite specific forum posts by mentioning the username who said it
3. Include the thread URL as a reference for each piece of information
4. Be conversational and use golf terminology appropriately
5. If the forum posts don't fully answer the question, say so and share what the community has discussed

Format your response with:
- A direct answer at the top
- Supporting details with citations like: "According to [username] on GolfWRX: ..." or "As [username] mentioned in the thread..."
- A Sources section at the end listing the threads you referenced

Keep responses focused and under 400 words unless the topic requires more depth.`;

app.post('/api/ask', async (req, res) => {
  const { query, conversationHistory = [] } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send status update
    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Searching GolfWRX forums...' })}\n\n`);

    // Gather forum data
    const forumData = await gatherForumData(query);

    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Analyzing community responses...' })}\n\n`);

    // Build messages for Claude
    const messages = [];

    // Add conversation history (without the forum context to keep tokens manageable)
    for (const turn of conversationHistory) {
      messages.push({ role: turn.role, content: turn.content });
    }

    // Add current query with forum context
    let userContent = query;
    if (forumData.content) {
      userContent = `Question: ${query}\n\nHere are relevant posts from GolfWRX forums to help answer this question:\n${forumData.content}\n\nPlease answer the question using this community knowledge, citing specific users and threads.`;
    }

    messages.push({ role: 'user', content: userContent });

    // Stream response from Claude
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    let fullText = '';

    stream.on('text', (text) => {
      fullText += text;
      res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI response error' })}\n\n`);
      res.end();
    });

    stream.on('finalMessage', () => {
      // Send sources
      const sources = forumData.rawThreads
        ? forumData.rawThreads.map(thread => ({
            title: thread.title,
            url: thread.url,
            authors: thread.posts.map(p => p.author).filter((a, i, arr) => arr.indexOf(a) === i && a !== 'Unknown'),
          })).filter(s => s.url)
        : [];

      res.write(`data: ${JSON.stringify({ type: 'done', sources, assistantMessage: fullText })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('API error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`GolfWRX QA backend running on port ${PORT}`);
});
