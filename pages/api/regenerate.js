import OpenAI from 'openai';
import { storeResult } from '../../lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Force the key from .env.local if env is alr set
// const apiKeyFromEnvFile = [key];

// // Initialize OpenAI client
// const openai = new OpenAI({
//   apiKey: apiKeyFromEnvFile, 
// });

const ASSISTANT_ID = process.env.ASSISTANT_ID;
const IS_VERCEL = process.env.VERCEL === '1';
const MAX_ATTEMPTS = IS_VERCEL ? 55 : 30;
const POLLING_INTERVAL = 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { threadId, editPrompt } = req.body;
    
    if (!threadId || !editPrompt) {
      return res.status(400).json({ error: 'Thread ID and edit prompt are required' });
    }

    // Add the edit prompt to the existing thread
    await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: `Based on the previous JSON generation, please modify it according to these changes: ${editPrompt}. 
      Return the complete modified JSON that includes all previous requirements plus these new changes.`
    });
    
    // Run the assistant with the updated thread
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
      instructions: "Respond quickly. Focus only on generating the modified JSON structure."
    });

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    let attempts = 0;
    
    while (runStatus.status !== 'completed' && attempts < MAX_ATTEMPTS) {
      if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
        throw new Error(`Assistant run failed with status: ${runStatus.status}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      attempts++;
    }

    if (attempts >= MAX_ATTEMPTS) {
      if (IS_VERCEL) {
        return res.status(202).json({ 
          status: 'processing',
          message: 'Request is still processing. Try again in a few seconds.',
          threadId: threadId,
          runId: run.id
        });
      } else {
        throw new Error('Request timed out');
      }
    }
    
    // Get messages
    const messages = await openai.beta.threads.messages.list(threadId);
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
      
      // Store result in database
      let resultId;
      try {
        resultId = await storeResult(editPrompt, JSON.stringify(jsonSchema));
      } catch (dbError) {
        console.warn('Failed to store result in database:', dbError);
      }
      
      return res.status(200).json({ 
        schema: jsonSchema,
        ...(resultId && { resultId })
      });
      
    } catch (err) {
      throw new Error(`Failed to parse JSON from assistant response: ${err.message}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
    
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