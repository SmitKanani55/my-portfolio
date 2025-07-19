// ADVANCED DEBUGGING VERSION of netlify/functions/gemini.js

exports.handler = async function (event) {
  console.log('[Function Start] Gemini function invoked.');

  if (event.httpMethod !== 'POST') {
    console.log('[Function Error] Incorrect HTTP method:', event.httpMethod);
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, conversationHistory } = JSON.parse(event.body);
    console.log('[Function Info] Received prompt:', prompt ? 'Yes' : 'No');
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[Function Error] CRITICAL: GEMINI_API_KEY is not set in Netlify environment variables!');
      return { statusCode: 500, body: 'API key not configured.' };
    }
    console.log('[Function Info] API Key found.');

    const fullPrompt = `${prompt}\n\nConversation History:\n${(conversationHistory || []).map(m => `${m.role}: ${m.parts[0].text}`).join('\n')}\n\nNew user query:`;
    
    const payload = { 
      contents: [{ 
        role: "user", 
        parts: [{ text: fullPrompt }] 
      }] 
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    console.log('[Function Info] Sending request to Google Gemini API...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('[Function Info] Received response from Google with status:', response.status);

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('[Function Error] Gemini API responded with an error:', errorBody);
        return { statusCode: response.status, body: `API request failed: ${errorBody}` };
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to respond to that.";
    console.log('[Function Success] Successfully got response text from Gemini.');

    return {
      statusCode: 200,
      body: JSON.stringify({ text }),
    };

  } catch (error) {
    console.error('[Function Error] An unexpected error occurred:', error);
    return { statusCode: 500, body: error.toString() };
  }
};
