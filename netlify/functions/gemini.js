// This is the code for your serverless function (netlify/functions/gemini.js)

exports.handler = async function (event) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
  
    // Get the prompt from the user's request
    const { prompt, conversationHistory } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY; // Get the secret key from Netlify's server
  
    if (!apiKey) {
      return { statusCode: 500, body: 'API key not found.' };
    }
  
    const systemPrompt = `${prompt}\n\nConversation History:\n${conversationHistory.map(m => `${m.role}: ${m.parts[0].text}`).join('\n')}\n\nNew user query:`;
    const payload = { contents: [{ role: "user", parts: [{ text: systemPrompt }] }] };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
          const errorBody = await response.text();
          return { statusCode: response.status, body: `API request failed: ${errorBody}` };
      }
  
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to respond to that.";
  
      return {
        statusCode: 200,
        body: JSON.stringify({ text }),
      };
    } catch (error) {
      return { statusCode: 500, body: error.toString() };
    }
  };
