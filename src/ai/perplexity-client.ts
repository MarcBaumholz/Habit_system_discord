export interface PerplexityResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class PerplexityClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.perplexity.ai/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(
    prompt: string,
    context?: string,
    model: string = 'sonar'
  ): Promise<string> {
    // List of models to try in order (cheapest first)
    const modelsToTry = [
      'sonar',                    // Cheapest option
      'sonar-medium',             // Medium option
      'sonar-medium-online',      // Online version
      'sonar-pro',                // Pro version if needed
      'sonar-pro-online'          // Pro online version
    ];

    let lastError: Error | null = null;

    for (const currentModel of modelsToTry) {
      try {
        const fullPrompt = context 
          ? `${context}\n\nUser Question: ${prompt}`
          : prompt;

        console.log('🤖 Calling Perplexity API with model:', currentModel);
        console.log('📝 Prompt length:', fullPrompt.length);

        const requestBody = {
          model: currentModel,
          messages: [
            {
              role: 'system',
              content: `You are a precise AI coach for the Habit System. Use ONLY the structured context that is provided to you (sourced from Notion) and never hallucinate values. Respond in a Notion-style outline that uses sections (e.g., "## Focus", "## Insights", "## Next Actions") and bullet lists with bold keywords such as "**Habit:**", "**Frequency:**", "**Last Proof:**". Highlight real numbers, streaks, and dates from the context, and if data is missing explicitly state "Notion data unavailable". Provide actionable, data-backed advice that references the exact habits, proofs, or summaries that appear in context.`
            },
            {
              role: 'user',
              content: fullPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
          top_p: 0.9
        };

        console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📥 Response status:', response.status, response.statusText);

        if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = 'Could not read error response';
          }
          console.error(`❌ Model ${currentModel} failed:`, errorText);
          lastError = new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
          continue; // Try next model
        }

        const data: PerplexityResponse = await response.json();
        console.log('📥 Response data:', JSON.stringify(data, null, 2));
        
        // Log token usage
        if (data.usage) {
          console.log(`📊 Token usage - Prompt: ${data.usage.prompt_tokens}, Completion: ${data.usage.completion_tokens}, Total: ${data.usage.total_tokens}`);
        }
        
        if (data.choices && data.choices.length > 0) {
          const content = data.choices[0].message.content;
          console.log(`✅ AI Response with model ${currentModel}:`, content);
          return content;
        } else {
          lastError = new Error('No response from Perplexity API');
          continue; // Try next model
        }

      } catch (error) {
        console.error(`❌ Error with model ${currentModel}:`, error);
        lastError = error as Error;
        continue; // Try next model
      }
    }

    // If we get here, all models failed
    console.error('❌ All Perplexity models failed');
    throw lastError || new Error('All Perplexity models failed');
  }

  async generateContextualResponse(
    userQuestion: string,
    userContext: {
      habits: any[];
      recentProofs: any[];
      learnings: any[];
      hurdles: any[];
      summary: any;
    }
  ): Promise<string> {
    const context = this.buildUserContext(userContext);
    return this.generateResponse(userQuestion, context);
  }

  private buildUserContext(userData: {
    habits: any[];
    recentProofs: any[];
    learnings: any[];
    hurdles: any[];
    summary: any;
  }): string {
    let context = 'User Data Context:\n\n';

    // Add habits information
    if (userData.habits.length > 0) {
      context += 'Current Habits:\n';
      userData.habits.forEach((habit, index) => {
        context += `${index + 1}. ${habit.name} (${habit.frequency} times/week)\n`;
        if (habit.why) context += `   Why: ${habit.why}\n`;
        if (habit.smartGoal) context += `   Goal: ${habit.smartGoal}\n`;
        if (habit.minimalDose) context += `   Minimal Dose: ${habit.minimalDose}\n`;
      });
      context += '\n';
    }

    // Add current week proofs
    if (userData.recentProofs.length > 0) {
      // Group proofs by habit for better organization
      const proofsByHabit = new Map<string, any[]>();
      userData.recentProofs.forEach(proof => {
        const habitName = proof.habitName || 'Unknown Habit';
        if (!proofsByHabit.has(habitName)) {
          proofsByHabit.set(habitName, []);
        }
        proofsByHabit.get(habitName)!.push(proof);
      });
      
      context += 'This Week\'s Activity (Monday-Sunday):\n';
      
      // Show proofs grouped by habit
      proofsByHabit.forEach((proofs, habitName) => {
        context += `\n${habitName}:\n`;
        proofs.forEach((proof) => {
          const dateDisplay = proof.formattedDate || proof.date || 'Unknown date';
          context += `  - ${proof.unit || 'completed'} on ${dateDisplay}`;
          if (proof.isMinimalDose) context += ' (Minimal Dose)';
          if (proof.isCheatDay) context += ' (Cheat Day)';
          context += '\n';
          if (proof.note) {
            context += `    Note: ${proof.note.substring(0, 80)}${proof.note.length > 80 ? '...' : ''}\n`;
          }
        });
      });
      context += '\n';
    } else {
      context += 'This Week\'s Activity: No proofs recorded yet this week.\n\n';
    }

    // Add summary information
    if (userData.summary) {
      context += 'Current Progress Summary:\n';
      context += `- Completion Rate: ${userData.summary.completionRate}%\n`;
      context += `- Current Streak: ${userData.summary.currentStreak} days\n`;
      context += `- Best Streak: ${userData.summary.bestStreak} days\n`;
      context += `- This Week: ${userData.summary.weekProofs}/${userData.summary.weekDays} days\n`;
      context += `- Total Habits: ${userData.summary.totalHabits}\n\n`;
    }

    // Add recent learnings
    if (userData.learnings.length > 0) {
      context += 'Recent Insights/Learnings:\n';
      userData.learnings.slice(0, 3).forEach((learning, index) => {
        context += `${index + 1}. ${learning.text.substring(0, 150)}...\n`;
      });
      context += '\n';
    }

    // Add recent hurdles
    if (userData.hurdles.length > 0) {
      context += 'Recent Challenges:\n';
      userData.hurdles.slice(0, 3).forEach((hurdle, index) => {
        context += `${index + 1}. ${hurdle.description}\n`;
      });
      context += '\n';
    }

    return context;
  }

  // Check if API key is available
  static isAvailable(): boolean {
    return !!process.env.PERPLEXITY_API_KEY;
  }
}
