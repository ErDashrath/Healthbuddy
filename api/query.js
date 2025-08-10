// In-memory session storage (in production, use Redis or a database)
const sessions = new Map();

// Clean up old sessions (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [sessionId, session] of sessions.entries()) {
    if (session.lastActivity < oneHourAgo) {
      sessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, sessionId } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Get or create session
    let session = sessions.get(sessionId);
    if (!session) {
      session = {
        id: sessionId,
        messages: [],
        createdAt: Date.now(),
        lastActivity: Date.now()
      };
      sessions.set(sessionId, session);
      console.log(`Created new session: ${sessionId}`);
    }

    // Add user message to session history
    session.messages.push({
      role: 'user',
      content: query,
      timestamp: Date.now()
    });

    // Keep only last 20 messages to prevent context from getting too long
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }

    // Build conversation context
    const conversationContext = session.messages
      .slice(-10) // Last 10 messages for context
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const contextualQuery = session.messages.length === 1 
      ? query // First message, no context needed
      : `Previous conversation:\n${conversationContext.slice(0, -query.length - 6)}\n\nCurrent question: ${query}`;

    session.lastActivity = Date.now();

    // Get API key from environment variables
    const apiKey = process.env.API_KEY;
    
    // Debug logging
    console.log('Environment variables check:');
    console.log('API_KEY exists:', !!apiKey);
    console.log('API_KEY length:', apiKey ? apiKey.length : 0);
    
    if (!apiKey) {
      console.error('API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'API key not configured',
        debug: 'Environment variable API_KEY is missing'
      });
    }

    // Forward request to your external API with conversation context
    console.log('Making request to external API with context...');
    const response = await fetch('https://production-guitar-sensitivity-prevention.trycloudflare.com/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({ query: contextualQuery })
    });

    console.log('External API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Add AI response to session history
    session.messages.push({
      role: 'assistant',
      content: data.answer || "No response received",
      timestamp: Date.now()
    });

    res.status(200).json({
      ...data,
      sessionId: sessionId,
      messageCount: session.messages.length
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Failed to process request',
      message: error.message 
    });
  }
}
