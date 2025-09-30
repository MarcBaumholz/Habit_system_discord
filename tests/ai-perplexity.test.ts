import { PerplexityClient } from '../src/ai/perplexity-client';

// Mock fetch
global.fetch = jest.fn();

describe('PerplexityClient', () => {
  let client: PerplexityClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    client = new PerplexityClient(mockApiKey);
    jest.clearAllMocks();
  });

  describe('generateResponse', () => {
    it('should generate response successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Test AI response'
            }
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const result = await client.generateResponse('Test question');

      expect(result).toBe('Test AI response');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.perplexity.ai/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      await expect(client.generateResponse('Test question')).rejects.toThrow('Perplexity API error: 401 Unauthorized');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        choices: []
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      await expect(client.generateResponse('Test question')).rejects.toThrow('No response from Perplexity API');
    });
  });

  describe('generateContextualResponse', () => {
    it('should generate contextual response with user data', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Based on your habits, I recommend...'
            }
          }
        ]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const userContext = {
        habits: [
          { name: 'Meditation', frequency: 7, why: 'Stress relief' }
        ],
        recentProofs: [],
        learnings: [],
        hurdles: [],
        summary: { completionRate: 85 }
      };

      const result = await client.generateContextualResponse('How can I improve?', userContext);

      expect(result).toBe('Based on your habits, I recommend...');
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('buildUserContext', () => {
    it('should build context string from user data', () => {
      const userData = {
        habits: [
          {
            name: 'Meditation',
            frequency: 7,
            why: 'Stress relief',
            smartGoal: 'Meditate 10 minutes daily',
            minimalDose: '5 minutes'
          }
        ],
        recentProofs: [
          {
            habitName: 'Meditation',
            unit: '10 min',
            date: '2025-09-30',
            note: 'Great session today'
          }
        ],
        learnings: [
          {
            text: 'Meditation helps with focus'
          }
        ],
        hurdles: [
          {
            description: 'Lack of time in morning'
          }
        ],
        summary: {
          completionRate: 85,
          currentStreak: 5,
          bestStreak: 10,
          weekProofs: 5,
          weekDays: 7,
          totalHabits: 2
        }
      };

      const context = (client as any).buildUserContext(userData);

      expect(context).toContain('Current Habits:');
      expect(context).toContain('Meditation (7 times/week)');
      expect(context).toContain('Why: Stress relief');
      expect(context).toContain('Goal: Meditate 10 minutes daily');
      expect(context).toContain('Minimal Dose: 5 minutes');
      expect(context).toContain('Recent Activity (Last 7 days):');
      expect(context).toContain('Meditation - 10 min on 2025-09-30');
      expect(context).toContain('Current Progress Summary:');
      expect(context).toContain('Completion Rate: 85%');
      expect(context).toContain('Current Streak: 5 days');
      expect(context).toContain('Recent Insights/Learnings:');
      expect(context).toContain('Recent Challenges:');
    });
  });

  describe('isAvailable', () => {
    it('should return true when API key is available', () => {
      const originalEnv = process.env.PERPLEXITY_API_KEY;
      process.env.PERPLEXITY_API_KEY = 'test-key';
      
      expect(PerplexityClient.isAvailable()).toBe(true);
      
      process.env.PERPLEXITY_API_KEY = originalEnv;
    });

    it('should return false when API key is not available', () => {
      const originalEnv = process.env.PERPLEXITY_API_KEY;
      delete process.env.PERPLEXITY_API_KEY;
      
      expect(PerplexityClient.isAvailable()).toBe(false);
      
      process.env.PERPLEXITY_API_KEY = originalEnv;
    });
  });
});
