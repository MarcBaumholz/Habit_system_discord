/**
 * CrewAI Agent Client
 *
 * TypeScript client for calling the Python CrewAI agents REST API
 */

import axios, { AxiosInstance } from 'axios';

export interface AnalysisRequest {
  agent_type: 'midweek';
  parameters?: Record<string, any>;
}

export interface AnalysisResponse {
  status: 'success' | 'error';
  timestamp: string;
  analysis?: string;
  error?: string;
  metadata?: {
    day_of_week?: string;
    agent_type?: string;
    [key: string]: any;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  environment_check: {
    missing_variables: string[];
    all_configured: boolean;
  };
  agents: {
    midweek_analysis: string;
  };
}

export class CrewAIClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = process.env.CREWAI_API_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 300000, // 5 minutes timeout for agent analysis
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`🔌 CrewAI Client initialized with base URL: ${baseUrl}`);
  }

  /**
   * Check if the CrewAI service is healthy and properly configured
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await this.client.get<HealthCheckResponse>('/health');
      return response.data;
    } catch (error) {
      console.error('❌ CrewAI service health check failed:', error);
      throw new Error(`CrewAI service unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run mid-week habit analysis
   *
   * Triggers the Team Dynamics Agent to analyze all active users' progress
   * at mid-week and generate personalized feedback.
   *
   * @returns Analysis results with user-specific feedback
   */
  async runMidWeekAnalysis(): Promise<AnalysisResponse> {
    try {
      console.log('📊 Requesting mid-week analysis from CrewAI agent...');
      const startTime = Date.now();

      const response = await this.client.post<AnalysisResponse>('/analyze/midweek');

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Mid-week analysis completed in ${duration}s`);

      return response.data;
    } catch (error) {
      console.error('❌ Mid-week analysis failed:', error);

      if (axios.isAxiosError(error)) {
        throw new Error(
          `CrewAI mid-week analysis failed: ${error.response?.data?.detail || error.message}`
        );
      }

      throw new Error(`Failed to run mid-week analysis: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generic analysis method that can route to different agent types
   *
   * @param request Analysis request with agent type and parameters
   */
  async runAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      console.log(`📊 Requesting ${request.agent_type} analysis from CrewAI...`);

      const response = await this.client.post<AnalysisResponse>('/analyze', request);

      return response.data;
    } catch (error) {
      console.error('❌ Analysis failed:', error);

      if (axios.isAxiosError(error)) {
        throw new Error(
          `CrewAI analysis failed: ${error.response?.data?.detail || error.message}`
        );
      }

      throw new Error(`Failed to run analysis: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if the service is available (simple ping)
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.client.get('/');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the base URL of the CrewAI service
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Export a singleton instance
export const crewAIClient = new CrewAIClient();
