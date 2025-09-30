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
    model: string = 'llama-3.1-sonar-small-128k-online'
  ): Promise<string> {
    try {
      const fullPrompt = context 
        ? `${context}\n\nUser Question: ${prompt}`
        : prompt;

      console.log('🤖 Calling Perplexity API with model:', model);
      console.log('📝 Prompt length:', fullPrompt.length);

      const requestBody = {
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI assistant for a habit tracking system. You have access to the user's personal data including their habits, progress, and goals. Provide helpful, encouraging, and actionable advice based on their data. Be concise but informative.`
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        max_tokens: 500,
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
        console.error('❌ Perplexity API error response:', errorText);
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: PerplexityResponse = await response.json();
      console.log('📥 Response data:', JSON.stringify(data, null, 2));
      
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        console.log('✅ AI Response:', content);
        return content;
      } else {
        throw new Error('No response from Perplexity API');
      }

    } catch (error) {
      console.error('Error calling Perplexity API:', error);
      throw error;
    }
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

    // Add recent proofs
    if (userData.recentProofs.length > 0) {
      context += 'Recent Activity (Last 7 days):\n';
      userData.recentProofs.slice(0, 5).forEach((proof, index) => {
        context += `${index + 1}. ${proof.habitName} - ${proof.unit} on ${proof.date}\n`;
        if (proof.note) context += `   Note: ${proof.note.substring(0, 100)}...\n`;
      });
      context += '\n';
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
