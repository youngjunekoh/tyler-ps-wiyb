const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://forums.golfwrx.com';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
};

async function searchGolfWRX(query, maxResults = 6) {
  try {
    const searchUrl = `${BASE_URL}/search/`;
    const response = await axios.get(searchUrl, {
      params: {
        q: query,
        search_and_or: 'or',
        sortby: 'relevancy',
        type: 'forums_topic',
      },
      headers: HEADERS,
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // IPS forum search results
    $('li.ipsStreamItem, .ipsSearchResult, [data-role="activityItem"]').each((i, el) => {
      if (results.length >= maxResults) return false;

      const $el = $(el);
      const titleEl = $el.find('h2 a, h3 a, .ipsStreamItem_title a, .ipsSearchResult_title a').first();
      const title = titleEl.text().trim();
      let url = titleEl.attr('href') || '';

      // Make URL absolute
      if (url && !url.startsWith('http')) {
        url = BASE_URL + url;
      }

      const snippet = $el.find('.ipsStreamItem_snippet, .ipsSearchResult_snippet, .ipsSpoiler_content').first().text().trim().slice(0, 300);
      const author = $el.find('.ipsType_break a, .ipsComment_author a, [data-role="author"] a').first().text().trim();

      if (title && url && url.includes('golfwrx.com')) {
        results.push({ title, url, snippet, author });
      }
    });

    return results;
  } catch (error) {
    console.error('Search error:', error.message);
    return [];
  }
}

async function getThreadContent(url, maxPosts = 5) {
  try {
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const posts = [];

    // Get thread title
    const title = $('h1.ipsType_pageTitle, .ipsPageHeader__title h1, [data-role="mainContent"] h1').first().text().trim()
      || $('title').text().replace(' - GolfWRX Forums', '').trim();

    // Parse posts - IPS forum structure
    $('article[data-role="comment"], .cPost, [data-commentid]').each((i, el) => {
      if (i >= maxPosts) return false;

      const $el = $(el);

      // Get post content - remove quotes and signatures
      const $content = $el.find('[data-role="commentContent"], .cPost_content, .ipsType_richText').first().clone();
      $content.find('blockquote, .ipsQuote, .ipsSpoiler_header, .ipsSignature').remove();
      const content = $content.text().replace(/\s+/g, ' ').trim().slice(0, 600);

      // Get author
      const author = $el.attr('data-author')
        || $el.find('.cAuthorPane_author a, [itemprop="name"], .ipsComment_author a').first().text().trim()
        || 'Unknown';

      // Get date
      const dateEl = $el.find('time[datetime]').first();
      const date = dateEl.attr('datetime') || dateEl.text().trim() || '';

      if (content && content.length > 20) {
        posts.push({
          content,
          author,
          date,
          url,
        });
      }
    });

    return { title, url, posts };
  } catch (error) {
    console.error('Thread fetch error for', url, ':', error.message);
    return null;
  }
}

async function gatherForumData(query) {
  try {
    // Search for relevant threads
    const searchResults = await searchGolfWRX(query, 5);

    if (searchResults.length === 0) {
      return { sources: [], content: '' };
    }

    // Fetch content from top results (limit to 3 to avoid rate limiting)
    const threadPromises = searchResults.slice(0, 3).map(result =>
      getThreadContent(result.url, 4)
    );

    const threads = await Promise.all(threadPromises);
    const validThreads = threads.filter(t => t && t.posts.length > 0);

    // Also include search result snippets from results we didn't fully fetch
    const remainingResults = searchResults.slice(3).map(r => ({
      title: r.title,
      url: r.url,
      posts: r.snippet ? [{ content: r.snippet, author: r.author || 'GolfWRX Member', date: '', url: r.url }] : [],
    }));

    const allSources = [...validThreads, ...remainingResults.filter(r => r.posts.length > 0)];

    // Build context string for Claude
    let contextText = '';
    const sourceSummaries = [];

    allSources.forEach((thread, idx) => {
      if (!thread || !thread.posts.length) return;

      contextText += `\n\n--- Thread ${idx + 1}: "${thread.title}" ---\nURL: ${thread.url}\n`;
      sourceSummaries.push({ title: thread.title, url: thread.url });

      thread.posts.forEach(post => {
        contextText += `\nUser "${post.author}" posted:\n${post.content}\n`;
      });
    });

    return {
      sources: sourceSummaries,
      content: contextText,
      rawThreads: allSources,
    };
  } catch (error) {
    console.error('Forum data gathering error:', error.message);
    return { sources: [], content: '', rawThreads: [] };
  }
}

module.exports = { searchGolfWRX, getThreadContent, gatherForumData };
