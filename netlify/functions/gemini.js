// This is the complete and correct code for your serverless function.
// File location: netlify/functions/gemini.js

exports.handler = async function (event) {
  // We only want to handle POST requests from our website
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Get the data sent from the website's fetch request
    const { prompt, conversationHistory } = JSON.parse(event.body);
    
    // Securely get the API key from Netlify's environment variables
    const apiKey = process.env.GEMINI_API_KEY;

    // A safety check in case the API key isn't set in Netlify
    if (!apiKey) {
      console.error('API key not found.');
      return { statusCode: 500, body: 'API key not configured.' };
    }

    // Prepare the full prompt for the Gemini API
    const fullPrompt = `${prompt}\n\nConversation History:\n${(conversationHistory || []).map(m => `${m.role}: ${m.parts[0].text}`).join('\n')}\n\nNew user query:`;
    
    const payload = { 
      contents: [{ 
        role: "user", 
        parts: [{ text: fullPrompt }] 
      }] 
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // Make the request to the actual Gemini API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Handle errors from the Gemini API
    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Gemini API Error:', errorBody);
        return { statusCode: response.status, body: `API request failed: ${errorBody}` };
    }

    const result = await response.json();
    
    // Extract the text from the API's response
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to respond to that.";

    // Send the safe, clean text response back to the website
    return {
      statusCode: 200,
      body: JSON.stringify({ text }),
    };

  } catch (error) {
    console.error('Error in serverless function:', error);
    return { statusCode: 500, body: error.toString() };
  }
};
