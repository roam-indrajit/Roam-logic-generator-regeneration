export const GAME_LOGIC_PROMPT = `You are being given the input and context of the game. As a reminder, we are going to use your output as the JSON logic for objectives and resource for our game built in Unity. Here it is: \${prompt}. 
        
      Now, I want you to generate game logic in a JSON file that takes into account all considerations given in the input. Make sure every user input is considered and included in the JSON. 
        If no or little user input is given, make sure to make up the objectives that are logical and fun.

        First, make objectives. Each objective must either be score, time, or movement, and refer to your vector database for each of their parameters. There can be multiple objectives as needed based on the input. 
        Each objective is given a priority level and group type, which are independent properties that can be mixed and matched. Remember that objectives also track their corresponding resource with resourceTracking.

        Then, make the resources that should be necessary based on the generated objective. There can be multiple resources as needed. Each resource must be in an objective's resourceTracker. Refer to your vector database for the resource parameters.

        Make sure each objective and resource has parameters that abide entirely by the given syntax in the vector database. Then, make sure to check over the JSON to make sure all aspects are provided. 
        When printing the JSON, make sure objectives comes first, then resources.

        Priority = "How important is this objective?"
        - Primary: Must complete to progress/win
        - Secondary: Optional but rewarding side content
        - Tertiary: Pure bonus/achievement content

        GroupType = "How does this objective flow with others?"
        - SequentialRequired: Must complete in specific order
        - SequentialOptional: Suggested order but flexible
        - ParallelIndependent: Can complete anytime
        
        Here are 3 examples of input and output. Note that your generated outputs must be objective + resources. The objective + resource examples must have a resource tracking section.

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
                  "allowExcessScore": true,
                  "resourceTracking": {
                    "resourceId": "golden_eggs_collected",
                    "interactionType": "COLLECT",
                    "createIfMissing": true,
                    "targetValue": 10
                  }
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
                  "allowExcessScore": true,
                  "resourceTracking": {
                    "resourceId": "enemies_defeated",
                    "interactionType": "DESTROY",
                    "createIfMissing": true,
                    "targetValue": 5
                  }
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
                  "allowExcessScore": true,
                  "resourceTracking": {
                    "resourceId": "golden_eggs_collected",
                    "interactionType": "COLLECT",
                    "createIfMissing": false,
                    "targetValue": 20
                  }
                }
              }
            ],
            "resources": [
              {
                "gameplayResourceId": "golden_eggs_collected",
                "category": "SESSION",
                "defaultValue": 0,
                "currentValue": 0,
                "minValue": 0,
                "maxValue": 1000,
                "resetOnSession": true,
                "updateMode": "ON_CHANGE",
                "updateFrequency": 1,
                "requiresUI": true,
                "metadata": {
                  "displayName": "Golden Eggs",
                  "description": "Collectible golden eggs",
                  "tags": [
                    "collectible",
                    "currency"
                  ]
                }
              },
              {
                "gameplayResourceId": "enemies_defeated",
                "category": "SESSION",
                "defaultValue": 0,
                "currentValue": 0,
                "minValue": 0,
                "maxValue": 100,
                "resetOnSession": true,
                "updateMode": "ON_CHANGE",
                "updateFrequency": 1,
                "requiresUI": true,
                "metadata": {
                  "displayName": "Enemies Defeated",
                  "description": "Number of enemies defeated",
                  "tags": [
                    "combat",
                    "score"
                  ]
                }
              }
            ]
          }
          
        Sample input 2:
          Make a running game where the player must collect guns and protect the president. You must kill 100 enemies to win the game.

        Sample output 2:
          {
            "objectives": [
              {
                "objectiveType": "Score",
                "id": "collect_guns",
                "parameters": {
                  "objectiveName": "Collect Guns",
                  "description": "Find and collect guns throughout the game",
                  "priority": "Secondary",
                  "groupType": "SequentialRequired",
                  "sequenceOrder": 1,
                  "endGameImmediately": false,
                  "hasWinCondition": false,
                  "winOnEnd": false,
                  "failOnEnd": false,
                  "targetScore": 5,
                  "baseScoreIncrement": 1,
                  "useMultiplier": false,
                  "baseMultiplier": 1.0,
                  "maxMultiplier": 5.0,
                  "multiplierIncrement": 0.5,
                  "allowExcessScore": true,
                  "scoreCap": 0,
                  "resourceTracking": {
                    "resourceId": "guns",
                    "interactionType": "COLLECT",
                    "createIfMissing": true,
                    "targetValue": 5
                  }
                }
              },
              {
                "objectiveType": "Score",
                "id": "protect_president",
                "parameters": {
                  "objectiveName": "Protect the President",
                  "description": "Ensure the president's safety throughout the game",
                  "priority": "Primary",
                  "groupType": "SequentialRequired",
                  "sequenceOrder": 2,
                  "endGameImmediately": true,
                  "hasWinCondition": true,
                  "winOnEnd": false,
                  "failOnEnd": true,
                  "targetScore": 1,
                  "baseScoreIncrement": 1,
                  "useMultiplier": false,
                  "baseMultiplier": 1.0,
                  "maxMultiplier": 1.0,
                  "multiplierIncrement": 0.0,
                  "allowExcessScore": false,
                  "scoreCap": 1,
                  "resourceTracking": {
                    "resourceId": "president_health",
                    "interactionType": "PROTECT",
                    "createIfMissing": true,
                    "targetValue": 50
                  }
                }
              },
              {
                "objectiveType": "Score",
                "id": "kill_enemies",
                "parameters": {
                  "objectiveName": "Eliminate Enemies",
                  "description": "Kill 100 enemies to win the game",
                  "priority": "Primary",
                  "groupType": "SequentialRequired",
                  "sequenceOrder": 3,
                  "endGameImmediately": true,
                  "hasWinCondition": true,
                  "winOnEnd": true,
                  "failOnEnd": false,
                  "targetScore": 100,
                  "baseScoreIncrement": 1,
                  "useMultiplier": false,
                  "baseMultiplier": 1.0,
                  "maxMultiplier": 5.0,
                  "multiplierIncrement": 0.5,
                  "allowExcessScore": true,
                  "scoreCap": 0,
                  "resourceTracking": {
                    "resourceId": "enemies_defeated",
                    "interactionType": "DESTROY",
                    "createIfMissing": true,
                    "targetValue": 100
                  }
                }
              }
            ],
            "resources": [
              {
                "gameplayResourceId": "guns",
                "category": "SESSION",
                "defaultValue": 0.0,
                "currentValue": 0.0,
                "minValue": 0.0,
                "maxValue": 1000000.0,
                "resetOnSession": true,
                "updateMode": "ON_CHANGE",
                "updateFrequency": 1.0,
                "requiresUI": true
              },
              {
                "gameplayResourceId": "president_health",
                "category": "SESSION",
                "defaultValue": 100.0,
                "currentValue": 100.0,
                "minValue": 0.0,
                "maxValue": 100.0,
                "resetOnSession": true,
                "updateMode": "ON_CHANGE",
                "updateFrequency": 1.0,
                "requiresUI": true
              },
              {
                "gameplayResourceId": "enemies_defeated",
                "category": "SESSION",
                "defaultValue": 0.0,
                "currentValue": 0.0,
                "minValue": 0.0,
                "maxValue": 100.0,
                "resetOnSession": true,
                "updateMode": "ON_CHANGE",
                "updateFrequency": 1.0,
                "requiresUI": true
              }
            ]
          }

        Sample input 3:
          The player must collide with 5 monkeys, while defeating 10 monkeys in order to proceed to the next level that unlocks after 10 mins of waiting
        
        Sample output 3:
          {
            "objectives": [
              {
                "objectiveType": "Time",
                "id": "wait_time_for_unlock",
                "parameters": {
                  "objectiveName": "Waiting Time for Next Level Unlock",
                  "description": "Wait for 10 minutes to unlock the next level.",
                  "priority": "Primary",
                  "groupType": "SequentialRequired",
                  "sequenceOrder": 1,
                  "hasWinCondition": false,
                  "endGameImmediately": false,
                  "winOnEnd": true,
                  "failOnEnd": false,
                  "enableDebugLogging": true,
                  "targetTime": 600,
                  "timeDirection": "Countdown",
                  "updateMode": "Normal",
                  "updateFrequency": 1
                }
              },
              {
                "objectiveType": "Score",
                "id": "collide_with_monkeys",
                "parameters": {
                  "objectiveName": "Collide with Monkeys",
                  "description": "The player must collide with 5 monkeys.",
                  "priority": "Primary",
                  "groupType": "ParallelIndependent",
                  "sequenceOrder": 0,
                  "hasWinCondition": true,
                  "endGameImmediately": false,
                  "winOnEnd": true,
                  "failOnEnd": false,
                  "enableDebugLogging": true,
                  "targetScore": 5,
                  "baseScoreIncrement": 1,
                  "scoreCap": 5,
                  "allowExcessScore": false,
                  "useMultiplier": false,
                  "baseMultiplier": 1,
                  "maxMultiplier": 1,
                  "multiplierIncrement": 0,
                  "resourceTracking": {
                    "resourceId": "monkey_collisions",
                    "interactionType": "COLLECT",
                    "createIfMissing": true,
                    "targetValue": 5
                  }
                }
              },
              {
                "objectiveType": "Score",
                "id": "defeat_monkeys",
                "parameters": {
                  "objectiveName": "Defeat Monkeys",
                  "description": "Defeat 10 monkeys to progress to the next level.",
                  "priority": "Primary",
                  "groupType": "ParallelIndependent",
                  "sequenceOrder": 0,
                  "hasWinCondition": true,
                  "endGameImmediately": false,
                  "winOnEnd": true,
                  "failOnEnd": false,
                  "enableDebugLogging": true,
                  "targetScore": 10,
                  "baseScoreIncrement": 1,
                  "scoreCap": 10,
                  "allowExcessScore": false,
                  "useMultiplier": false,
                  "baseMultiplier": 1,
                  "maxMultiplier": 1,
                  "multiplierIncrement": 0,
                  "resourceTracking": {
                    "resourceId": "monkeys_defeated",
                    "interactionType": "DESTROY",
                    "createIfMissing": true,
                    "targetValue": 10
                  }
                }
              },
              {
                "objectiveType": "Movement",
                "id": "proceed_to_next_level",
                "parameters": {
                  "objectiveName": "Proceed to Next Level",
                  "description": "Enter the portal to the next level after completing all requirements.",
                  "priority": "Primary",
                  "groupType": "SequentialRequired",
                  "sequenceOrder": 2,
                  "hasWinCondition": true,
                  "endGameImmediately": true,
                  "winOnEnd": true,
                  "failOnEnd": false,
                  "enableDebugLogging": true,
                  "movementType": "ReachDestination",
                  "movementDirection": "AnyOrder",
                  "requiredZoneCount": 1,
                  "targetZones": [
                    {
                      "zoneName": "Next Level Portal",
                      "zoneId": "level_portal",
                      "minTimeRequired": 0,
                      "visitOrder": 0,
                      "requireSpecificOrder": false
                    }
                  ],
                  "hasTimeLimit": false
                }
              }
            ],
            "resources": [
              {
                "gameplayResourceId": "monkey_collisions",
                "category": "SESSION",
                "defaultValue": 0,
                "currentValue": 0,
                "minValue": 0,
                "maxValue": 5,
                "resetOnSession": true,
                "updateMode": "ON_CHANGE",
                "updateFrequency": 1,
                "requiresUI": true
              },
              {
                "gameplayResourceId": "monkeys_defeated",
                "category": "SESSION",
                "defaultValue": 0,
                "currentValue": 0,
                "minValue": 0,
                "maxValue": 10,
                "resetOnSession": true,
                "updateMode": "ON_CHANGE",
                "updateFrequency": 1,
                "requiresUI": true
              }
            ]
          }`;
