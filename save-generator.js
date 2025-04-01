import OpenAI from 'openai';
import { storeResult } from '../../lib/db';

// Force the key from .env.local
const apiKeyFromEnvFile = process.env.OPENAI_API_KEY;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKeyFromEnvFile,
});

const ASSISTANT_ID = process.env.ASSISTANT_ID;
const IS_VERCEL = process.env.VERCEL === '1';
const MAX_ATTEMPTS = IS_VERCEL ? 8 : 30; // 8 seconds for Vercel, 30 for local
const POLLING_INTERVAL = 1000; // 1 second

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided' });
    }

    // Create a thread
    const thread = await openai.beta.threads.create();
    
    // Add a message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: `You are being given the input and context of the game. As a reminder, we are going to use this as the JSON logic for our game built in Unity. Here it is: ${prompt}. 
        
      Now, I want you to generate game logic in a JSON file that takes into account all considerations given in the input. Make sure every user input is considered and included in the JSON.
        If no or little user input is given, make sure to make up the objectives that are logical and fun.
        Each objective must either be score, time, or movement, and refer to your vector space for each of their parameters. There can be multiple objectives as needed based on the input. 
        Make sure each objective has parameters that abide entirely by the given parameters. Then, make sure to check over the JSON to make sure all aspects are provided. 
        Each objective is given a priority level and group type, which are independent properties that can be mixed and matched.

        Priority = "How important is this objective?"
        - PRIMARY: Must complete to progress/win
        - SECONDARY: Optional but rewarding side content
        - TERTIARY: Pure bonus/achievement content

        GroupType = "How does this objective flow with others?"
        - SEQUENTIAL REQUIRED: Must complete in specific order
        - SEQUENTIAL OPTIONAL: Suggested order but flexible
        - PARALLEL INDEPENDENT: Can complete anytime

        This system allows for flexible mission design where objectives can be:
        - Critical and sequence-dependent
        - Optional but ordered
        - Required but flexible in timing
        - Bonus content with suggested progression

        Here are 2 examples of input and output.

        Sample Input 1:
          Golden Eggs—Cumulative Collection
            "The player must collect 10 golden eggs, after they do defeat 5 enemies under 10 minutes, then collect 20 more golden eggs"
            Key Features:
            Same sequence as variant 1
            Second egg collection is cumulative (counts previous eggs)
            Uses score tracking to ensure proper progression
            Highlights importance of allowExcessScore flag

        Sample Output 1:
          {
            "objectives": [
              {
                "objectiveType": "Score",
                "id": "collect_eggs_phase1",
                "parameters": {
                  "objectiveName": "Collect Initial Golden Eggs",
                  "description": "Collect 10 golden eggs",
                  "priority": "Primary",
                  "groupType": "SequentialRequired",
                  "sequenceOrder": 1,
                  "hasWinCondition": true,
                  "endGameImmediately": false,
                  "winOnEnd": false,
                  "failOnEnd": false,
                  "enableDebugLogging": true,
                  "targetScore": 10,
                  "baseScoreIncrement": 1,
                  "allowExcessScore": true
                }
              },
              {
                "objectiveType": "Score",
                "id": "defeat_enemies",
                "parameters": {
                  "objectiveName": "Defeat Enemies",
                  "description": "Defeat 5 enemies within the time limit",
                  "priority": "Primary",
                  "groupType": "SequentialRequired",
                  "sequenceOrder": 2,
                  "hasWinCondition": true,
                  "endGameImmediately": false,
                  "winOnEnd": false,
                  "failOnEnd": false,
                  "enableDebugLogging": true,
                  "targetScore": 5,
                  "baseScoreIncrement": 1,
                  "allowExcessScore": true
                }
              },
              {
                "objectiveType": "Time",
                "id": "time_limit",
                "parameters": {
                  "objectiveName": "Enemy Defeat Time Limit",
                  "description": "Complete enemy defeat within 10 minutes",
                  "priority": "Primary",
                  "groupType": "SequentialRequired",
                  "sequenceOrder": 2,
                  "hasWinCondition": false,
                  "endGameImmediately": false,
                  "hasFailureTime": true,
                  "failureTime": 600,
                  "winOnEnd": false,
                  "failOnEnd": true,
                  "enableDebugLogging": true,
                  "targetTime": 600,
                  "timeDirection": "Countdown",
                  "updateMode": "Realtime",
                  "updateFrequency": 1
                }
              },
              {
                "objectiveType": "Score",
                "id": "collect_eggs_phase2",
                "parameters": {
                  "objectiveName": "Collect Final Golden Eggs",
                  "description": "Collect 20 golden eggs to complete the mission",
                  "priority": "Primary",
                  "groupType": "SequentialRequired",
                  "sequenceOrder": 3,
                  "hasWinCondition": true,
                  "endGameImmediately": true,
                  "winOnEnd": true,
                  "failOnEnd": false,
                  "enableDebugLogging": true,
                  "targetScore": 20,
                  "baseScoreIncrement": 1,
                  "allowExcessScore": true
                }
              }
            ]
          }
          
        Sample input 2:
          The player must collide with 5 monkeys, while defeating 10 monkeys in order to proceed to the next
          level that unlocks after 10 mins of waiting

        Sample Output 2:
          {
            "objectives": [
              {
                "objectiveType": "Time",
                "id": "wait_time_for_unlock",
                "parameters": {
                  "objectiveName": "Waiting Time for Next Level Unlock",
                  "description": "Wait for 10 minutes to unlock the next level.",
                  "priority": "Primary", // Primary since this is required
                  "groupType": "SequentialRequired", // Must be completed in sequence
                  "sequenceOrder": 1, // First in sequence
                  "hasWinCondition": false, // Not a win condition by itself
                  "endGameImmediately": false,
                  "hasFailureTime": false,
                  "winOnEnd": true, // Completes when timer ends
                  "failOnEnd": false,
                  "enableDebugLogging": true,
                  "targetTime": 600, // 10 minutes in seconds
                  "timeDirection": "Countdown", 
                  "updateMode": "Normal", // Update every frame
                  "updateFrequency": 1
                }
              },
              {
                "objectiveType": "Score",
                "id": "collide_with_monkeys",
                "parameters": {
                  "objectiveName": "Collide with Monkeys",
                  "description": "The player must collide with 5 monkeys.",
                  "priority": "Primary", // Primary importance
                  "groupType": "ParallelIndependent", // Can be done alongside other objectives
                  "sequenceOrder": 0, // No specific order (parallel)
                  "hasWinCondition": true, // Required for win
                  "endGameImmediately": false,
                  "winOnEnd": true, // Completes when score reached
                  "failOnEnd": false,
                  "enableDebugLogging": true,
                  "targetScore": 5, // Need 5 collisions
                  "baseScoreIncrement": 1, // +1 per collision
                  "scoreCap": 5, // Cap at exactly 5 collisions
                  "allowExcessScore": false, // Don't count beyond 5
                  "useMultiplier": false,
                  "baseMultiplier": 1.0,
                  "maxMultiplier": 1.0,
                  "multiplierIncrement": 0.0
                }
              },
              {
                "objectiveType": "Score",
                "id": "defeat_monkeys",
                "parameters": {
                  "objectiveName": "Defeat Monkeys",
                  "description": "Defeat 10 monkeys to progress to the next level.",
                  "priority": "Primary", // Primary importance
                  "groupType": "ParallelIndependent", // Can be done alongside other objectives
                  "sequenceOrder": 0, // No specific order (parallel)
                  "hasWinCondition": true, // Required for win
                  "endGameImmediately": false,
                  "winOnEnd": true, // Completes when score reached
                  "failOnEnd": false,
                  "enableDebugLogging": true,
                  "targetScore": 10, // Need 10 defeats
                  "baseScoreIncrement": 1, // +1 per defeat
                  "scoreCap": 10, // Cap at exactly 10 defeats
                  "allowExcessScore": false, // Don't count beyond 10
                  "useMultiplier": false,
                  "baseMultiplier": 1.0,
                  "maxMultiplier": 1.0,
                  "multiplierIncrement": 0.0
                }
              },
              {
                "objectiveType": "Movement",
                "id": "proceed_to_next_level",
                "parameters": {
                  "objectiveName": "Proceed to Next Level",
                  "description": "Enter the portal to the next level after completing all requirements.",
                  "priority": "Primary", // Primary importance
                  "groupType": "SequentialRequired", // Must be done in sequence
                  "sequenceOrder": 2, // Last in sequence, after time objective
                  "hasWinCondition": true, // Final win condition
                  "endGameImmediately": true, // End current level when complete
                  "winOnEnd": true, // Complete when destination reached
                  "failOnEnd": false,
                  "enableDebugLogging": true,
                  "movementType": "ReachDestination", // Player must reach a specific point
                  "movementDirection": "AnyOrder", // Only one destination
                  "requiredZoneCount": 1, // Just one zone to reach
                  "targetZones": [
                    {
                      "zoneName": "Next Level Portal",
                      "zoneId": "level_portal",
                      "minTimeRequired": 0, // No minimum time
                      "visitOrder": 0, // Not applicable for single destination
                      "requireSpecificOrder": false // Not applicable for single destination
                    }
                  ],
                  "hasTimeLimit": false // No time limit for reaching the portal
                }
              }
            ]
          }`,
    });
    
    // Run the assistant with specific instructions for quick response
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
      instructions: "Respond quickly and concisely. Focus only on generating the JSON structure. Avoid explanations."
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
      
      // Store result in database
      const resultId = await storeResult(prompt, JSON.stringify(jsonSchema));
      
      return res.status(200).json({ 
        schema: jsonSchema,
        resultId: resultId
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
      : 500;
    
    return res.status(statusCode).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 