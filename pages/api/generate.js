import OpenAI from 'openai';
import { storeResult } from '../../lib/db';
import { GAME_LOGIC_PROMPT } from '../../lib/prompts';

// // Force the key from .env.local
// const apiKeyFromEnvFile = [key];

// // Initialize OpenAI client
// const openai = new OpenAI({
//   apiKey: apiKeyFromEnvFile, 
// });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // replace with apiKeyFromEnvFile if override needed
});

const ASSISTANT_ID = process.env.ASSISTANT_ID;
const IS_VERCEL = process.env.VERCEL === '1';
const MAX_ATTEMPTS = IS_VERCEL ? 55 : 30; // 55 seconds for Vercel (allowing 5s buffer), 30 for local
const POLLING_INTERVAL = 1000; // 1 second

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    console.log(' the OpenAI Key (truncated):', process.env.OPENAI_API_KEY?.slice(0, 5));

    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    // Create a thread
    const thread = await openai.beta.threads.create();
    
    // Add a message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: GAME_LOGIC_PROMPT.replace('${prompt}', prompt)
    });
    
    // Run the assistant with specific instructions for quick response
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
      instructions: "Respond quickly. Focus only on generating the JSON structure."
    });
    
    // Poll for completion with timeout handling
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    
    while (runStatus.status !== 'completed' && attempts < MAX_ATTEMPTS) {
      if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
        throw new Error(`Assistant run failed with status: ${runStatus.status}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
    }

    if (attempts >= MAX_ATTEMPTS) {
      if (IS_VERCEL) {
        // For Vercel, return a 202 Accepted with the thread ID
        return res.status(202).json({ 
          status: 'processing',
          message: 'Request is still processing. Try again in a few seconds.',
          threadId: thread.id,
          runId: run.id
        });
      } else {
        throw new Error('Request timed out');
      }
    }
    
    // Get messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
    
    if (assistantMessages.length === 0) {
      throw new Error('No response from assistant');
    }
    
    const lastMessage = assistantMessages[0];
    let responseContent = '';
    
    for (const content of lastMessage.content) {
      if (content.type === 'text') {
        responseContent += content.text.value;
      }
    }
    
    // Try to parse JSON from response
    let jsonSchema;
    try {
      const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonSchema = JSON.parse(jsonMatch[1]);
      } else {
        jsonSchema = JSON.parse(responseContent);
      }
      
      // Try to store result in database
      let resultId;
      try {
        resultId = await storeResult(prompt, JSON.stringify(jsonSchema));
      } catch (dbError) {
        console.warn('Failed to store result in database:', dbError);
      }
      
      return res.status(200).json({ 
        schema: jsonSchema,
        threadId: thread.id,
        ...(resultId && { resultId })
      });
      
    } catch (err) {
      throw new Error(`Failed to parse JSON from assistant response: ${err.message}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    // Determine appropriate status code
    const statusCode = error.message.includes('timed out') ? 504 
      : error.message.includes('No response') ? 404
      : error.message.includes('Failed to parse') ? 422
      : error.message.includes('not configured') ? 503
      : 500;
    
    return res.status(statusCode).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 
