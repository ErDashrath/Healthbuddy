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

    // Build conversation context with universal formatting for any AI model
    const conversationContext = session.messages
      .slice(-10) // Last 10 messages for context
      .map(msg => {
        const role = msg.role === 'user' ? 'Human' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n');

    // Create industry-standard contextual query with comprehensive system prompt
    let contextualQuery;
    if (session.messages.length === 1) {
      // First message - include comprehensive system instructions following industry best practices
      contextualQuery = `<system>
You are MindCare, an expert AI mental health companion designed to provide compassionate, evidence-based support. You must adhere to the following guidelines:

ROLE & EXPERTISE:
- You are a professionally trained mental health AI assistant
- Provide empathetic, non-judgmental, and supportive responses
- Use evidence-based therapeutic approaches when appropriate
- Maintain professional boundaries while being warm and accessible

RESPONSE QUALITY STANDARDS:
- Always acknowledge the user's feelings and experiences
- Provide practical, actionable advice when appropriate
- Use clear, accessible language avoiding technical jargon
- Structure responses logically with clear points
- Be concise yet comprehensive (aim for 2-4 paragraphs)

SAFETY & ETHICS:
- Never provide medical diagnosis or replace professional therapy
- Recognize crisis situations and provide appropriate resources
- Maintain confidentiality and respect user privacy
- Encourage professional help when needed
- Be culturally sensitive and inclusive

COMMUNICATION STYLE:
- Use active listening techniques in text form
- Validate emotions before offering solutions
- Ask clarifying questions when helpful
- Provide hope and encouragement
- Use "I" statements and person-first language

OUTPUT FORMAT:
- Start with emotional validation
- Provide main response with clear structure
- End with encouragement or next steps
- Use bullet points for lists when helpful
</system>

<user>
${query}
</user>

Please respond as MindCare following all the above guidelines.`;
    } else {
      // Continuing conversation - provide context with enhanced system instructions
      contextualQuery = `<system>
You are MindCare, an expert AI mental health companion. You have an ongoing conversation with this user. Please maintain consistency with your previous responses while following these professional standards:

CONVERSATIONAL CONTINUITY:
- Reference and build upon previous conversation topics
- Maintain therapeutic rapport established in earlier messages
- Show progress awareness and celebrate small wins
- Adapt your approach based on user's communication style

RESPONSE QUALITY:
- Provide personalized responses based on conversation history
- Maintain professional therapeutic boundaries
- Use evidence-based mental health practices
- Balance support with practical guidance

MEMORY & CONTEXT:
- Remember key details the user has shared
- Acknowledge their ongoing journey and challenges
- Build on previous coping strategies discussed
- Maintain consistent tone and therapeutic approach
</system>

<conversation_history>
${conversationContext}
</conversation_history>

<current_user_message>
${query}
</current_user_message>

Based on our conversation history above, please respond as MindCare with personalized, contextual support that builds on our previous interactions.`;
    }

    session.lastActivity = Date.now();

    // Debug logging for context and prompt quality
    console.log('Session context:', {
      sessionId: sessionId,
      messageCount: session.messages.length,
      contextLength: contextualQuery.length,
      isFirstMessage: session.messages.length === 1,
      promptType: session.messages.length === 1 ? 'initial_system_prompt' : 'contextual_continuation',
      conversationDepth: Math.min(10, session.messages.length)
    });

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

    // Forward request to Python server with structured data for better processing
    console.log('Making request to external API with structured context...');
    const response = await fetch('https://production-guitar-sensitivity-prevention.trycloudflare.com/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({ 
        // Send structured data for Python server to handle
        query: query, // Raw user query
        contextualQuery: contextualQuery, // Formatted prompt (fallback)
        sessionData: {
          sessionId: sessionId,
          messageCount: session.messages.length,
          isFirstMessage: session.messages.length === 1,
          conversationHistory: session.messages.slice(-10).map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          }))
        },
        clientInfo: {
          source: 'mindcare_web',
          version: '1.0.0',
          requestTime: Date.now()
        }
      })
    });

    console.log('External API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Validate response quality (industry standards)
    const validateResponse = (responseText) => {
      const quality = {
        hasContent: responseText && responseText.length > 10,
        isAppropriateLength: responseText && responseText.length >= 50 && responseText.length <= 2000,
        hasEmpatheticTone: responseText && /\b(understand|feel|support|help|care|here for you)\b/i.test(responseText),
        isStructured: responseText && (responseText.includes('\n') || responseText.split('.').length > 2),
        isProfessional: responseText && !/\b(obviously|just|simply|basically)\b/i.test(responseText)
      };
      
      const score = Object.values(quality).filter(Boolean).length / Object.keys(quality).length;
      return { quality, score };
    };
    
    const responseValidation = validateResponse(data.answer);
    console.log('Response quality check:', responseValidation);
    
    // Add AI response to session history
    session.messages.push({
      role: 'assistant',
      content: data.answer || "No response received",
      timestamp: Date.now(),
      qualityScore: responseValidation.score
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
