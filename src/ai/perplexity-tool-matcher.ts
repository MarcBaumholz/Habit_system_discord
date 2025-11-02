import { PerplexityClient } from './perplexity-client';
import { HabitTool } from '../toolbox';

export interface ToolMatch {
  tool: HabitTool;
  score: number;
  reasoning: string;
}

export class PerplexityToolMatcher {
  private perplexityClient: PerplexityClient;

  constructor(apiKey: string) {
    this.perplexityClient = new PerplexityClient(apiKey);
  }

  /**
   * Uses Perplexity AI to semantically match user problem to the best tools
   * Returns maximum 2 tools with detailed reasoning
   */
  async matchToolsWithAI(
    problem: string,
    availableTools: HabitTool[]
  ): Promise<ToolMatch[]> {
    try {
      // Build prompt for Perplexity
      const toolsList = availableTools.map((tool, idx) =>
        `${idx + 1}. ${tool.name}: ${tool.summary}`
      ).join('\n');

      const prompt = `You are a habit formation expert. A user has this problem:

"${problem}"

Available habit tools:
${toolsList}

Analyze the user's problem and select the 1-2 MOST RELEVANT tools that would help them. If only one tool fits perfectly, only recommend that one.

Respond ONLY in this exact JSON format (no markdown, no explanation):
{
  "matches": [
    {
      "toolNumber": 1,
      "reasoning": "Brief 1-sentence explanation why this tool fits"
    }
  ]
}

Be precise. Only recommend tools that directly address the user's stated problem.`;

      console.log('🤖 Sending tool matching request to Perplexity...');
      const response = await this.perplexityClient.generateResponse(prompt);
      console.log('📥 Perplexity response:', response);

      // Parse the AI response
      const cleanedResponse = this.extractJSON(response);
      const aiResult = JSON.parse(cleanedResponse);

      // Map AI recommendations back to actual tools
      const matches: ToolMatch[] = [];

      if (aiResult.matches && Array.isArray(aiResult.matches)) {
        for (const match of aiResult.matches.slice(0, 2)) { // Maximum 2 tools
          const toolIndex = match.toolNumber - 1;
          if (toolIndex >= 0 && toolIndex < availableTools.length) {
            matches.push({
              tool: availableTools[toolIndex],
              score: 10, // AI-selected tools get high score
              reasoning: match.reasoning
            });
          }
        }
      }

      console.log(`✅ AI matched ${matches.length} tool(s)`);
      return matches;

    } catch (error) {
      console.error('❌ Perplexity tool matching failed:', error);
      throw error;
    }
  }

  /**
   * Extract JSON from response that might contain markdown code blocks
   */
  private extractJSON(response: string): string {
    // Remove markdown code blocks if present
    let cleaned = response.trim();

    // Remove ```json and ``` markers
    cleaned = cleaned.replace(/```json\s*/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');

    // Find JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    return cleaned;
  }

  /**
   * Fallback method: expand user query with synonyms using AI
   * This can be used to enhance keyword matching
   */
  async expandQuery(problem: string): Promise<string[]> {
    try {
      const prompt = `Extract the key concepts and their synonyms from this problem statement:

"${problem}"

Return ONLY a JSON array of related keywords and phrases. No explanation.

Example format: ["keyword1", "synonym1", "related phrase", ...]`;

      const response = await this.perplexityClient.generateResponse(prompt);
      const cleaned = this.extractJSON(response);
      const keywords = JSON.parse(cleaned);

      return Array.isArray(keywords) ? keywords : [];
    } catch (error) {
      console.error('Query expansion failed:', error);
      return [];
    }
  }
}
