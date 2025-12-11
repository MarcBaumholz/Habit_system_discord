# Multi-Agent System Standards

## Agent Architecture

- Each agent has a single, clear responsibility
- Agents communicate through the orchestrator
- Use base agent class for common functionality
- Implement agent interfaces consistently

```typescript
// ✅ Good
import { BaseAgent } from '../base/agent';
import { AgentRequest, AgentResponse } from '../base/types';

export class MentorAgent extends BaseAgent {
  constructor(
    private notion: NotionClient,
    private aiClient: PerplexityClient
  ) {
    super('mentor');
  }
  
  async process(request: AgentRequest): Promise<AgentResponse> {
    // Validate request
    if (!this.canHandle(request)) {
      throw new Error('Mentor agent cannot handle this request');
    }
    
    // Process request
    const result = await this.provideCoaching(request.userId);
    
    return {
      agent: this.name,
      success: true,
      data: result,
    };
  }
  
  private canHandle(request: AgentRequest): boolean {
    return request.type === 'coaching' || request.type === 'feedback';
  }
  
  private async provideCoaching(userId: string): Promise<CoachingResult> {
    // Implementation
  }
}

// ❌ Bad
export class MentorAgent {
  async process(request: any): Promise<any> {
    // Handle everything
    if (request.type === 'coaching') {
      // ...
    } else if (request.type === 'identity') {
      // ...
    } else if (request.type === 'accountability') {
      // ...
    }
  }
}
```

## Orchestrator Pattern

- Route requests to appropriate agents
- Handle agent coordination
- Aggregate responses from multiple agents
- Provide error handling and fallbacks

```typescript
// ✅ Good
export class Orchestrator {
  constructor(
    private agents: Map<string, BaseAgent>
  ) {}
  
  async route(request: AgentRequest): Promise<AgentResponse> {
    // Determine which agents to use
    const agentNames = this.selectAgents(request);
    
    if (agentNames.length === 0) {
      throw new Error(`No agent can handle request type: ${request.type}`);
    }
    
    // Execute agents (parallel or sequential)
    const responses = await Promise.all(
      agentNames.map(name => this.executeAgent(name, request))
    );
    
    // Aggregate responses
    return this.aggregateResponses(responses);
  }
  
  private selectAgents(request: AgentRequest): string[] {
    const agents: string[] = [];
    
    if (request.type === 'coaching' || request.type === 'feedback') {
      agents.push('mentor');
    }
    if (request.type === 'personality' || request.type === 'recommendation') {
      agents.push('identity');
    }
    if (request.type === 'reminder' || request.type === 'motivation') {
      agents.push('accountability');
    }
    
    return agents;
  }
  
  private async executeAgent(name: string, request: AgentRequest): Promise<AgentResponse> {
    const agent = this.agents.get(name);
    if (!agent) {
      throw new Error(`Agent ${name} not found`);
    }
    
    try {
      return await agent.process(request);
    } catch (error) {
      console.error(`Agent ${name} failed:`, error);
      throw new Error(`Agent ${name} processing failed: ${error.message}`);
    }
  }
}

// ❌ Bad
export class Orchestrator {
  async route(request: any): Promise<any> {
    // Directly call agents without routing logic
    return await this.mentorAgent.process(request);
  }
}
```

## Agent Communication

- Use structured request/response types
- Validate request data
- Handle agent errors gracefully
- Provide context in responses

```typescript
// ✅ Good
export interface AgentRequest {
  type: 'coaching' | 'feedback' | 'personality' | 'reminder' | 'motivation';
  userId: string;
  context?: Record<string, any>;
  metadata?: {
    timestamp: Date;
    source: string;
  };
}

export interface AgentResponse {
  agent: string;
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    processingTime: number;
    tokensUsed?: number;
  };
}

// ❌ Bad
export interface AgentRequest {
  type: string;
  data: any;
}
```

## AI Client Integration

- Abstract AI client behind interface
- Handle API errors properly
- Implement retry logic for transient failures
- Track token usage

```typescript
// ✅ Good
interface AIClient {
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
}

class PerplexityClient implements AIClient {
  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new Error('Perplexity API key is required');
    }
  }
  
  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'sonar',
          messages: [{ role: 'user', content: prompt }],
          ...options,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid API key');
      }
      console.error('Perplexity API error:', error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }
}

// ❌ Bad
class PerplexityClient {
  async generate(prompt: string): Promise<string> {
    return await axios.post('https://api.perplexity.ai/...', { prompt });
  }
}
```

## Error Handling

- Each agent should handle its own errors
- Orchestrator should handle agent failures
- Provide meaningful error messages
- Never use mock responses

```typescript
// ✅ Good
async function processWithAgent(agent: BaseAgent, request: AgentRequest): Promise<AgentResponse> {
  try {
    return await agent.process(request);
  } catch (error) {
    console.error(`Agent ${agent.name} failed:`, {
      request,
      error: error.message,
      stack: error.stack,
    });
    
    return {
      agent: agent.name,
      success: false,
      error: `Agent processing failed: ${error.message}`,
    };
  }
}

// ❌ Bad
async function processWithAgent(agent: BaseAgent, request: AgentRequest): Promise<AgentResponse> {
  try {
    return await agent.process(request);
  } catch (error) {
    return {
      agent: agent.name,
      success: true,
      data: { message: 'Default response' },
    };
  }
}
```

