"""
FastAPI REST Service for CrewAI Agents
Provides HTTP endpoints for the TypeScript bot to trigger agent analysis
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the v2 agent
from midweek_agent_v2 import SecondMeetAnalysisAgent

app = FastAPI(
    title="Habit System CrewAI Agents",
    description="REST API for CrewAI-powered habit analysis agents",
    version="1.0.0"
)

# Add CORS middleware to allow TypeScript bot to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your bot's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalysisRequest(BaseModel):
    """Request model for analysis endpoints"""
    agent_type: str = "midweek"
    parameters: Optional[Dict[str, Any]] = None


class AnalysisResponse(BaseModel):
    """Response model for analysis results"""
    status: str
    timestamp: str
    analysis: Optional[str] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Habit System CrewAI Agents",
        "status": "running",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    # Check if required environment variables are set
    required_env_vars = [
        'NOTION_TOKEN',
        'NOTION_DATABASE_USERS',
        'NOTION_DATABASE_HABITS',
        'NOTION_DATABASE_PROOFS',
        'PERPLEXITY_API_KEY'
    ]

    missing_vars = [var for var in required_env_vars if not os.getenv(var)]

    return {
        "status": "healthy" if not missing_vars else "degraded",
        "timestamp": datetime.now().isoformat(),
        "environment_check": {
            "missing_variables": missing_vars,
            "all_configured": len(missing_vars) == 0
        },
        "agents": {
            "midweek_analysis": "available"
        }
    }


@app.post("/analyze/midweek", response_model=AnalysisResponse)
async def run_midweek_analysis(request: Optional[AnalysisRequest] = None):
    """
    Trigger mid-week habit analysis

    This endpoint runs the Team Dynamics Agent to analyze all active users'
    habit progress at mid-week and provide personalized feedback.

    Returns:
        AnalysisResponse with detailed analysis and user-specific feedback
    """
    try:
        print(f"\n📞 Received mid-week analysis request at {datetime.now().isoformat()}")

        # Initialize and run the agent
        agent = SecondMeetAnalysisAgent()
        result = agent.run_second_meet_analysis()

        return AnalysisResponse(
            status=result['status'],
            timestamp=result['timestamp'],
            analysis=result.get('analysis'),
            metadata={
                'day_of_week': result.get('day_of_week'),
                'agent_type': 'team_dynamics_analyst_v2'
            }
        )

    except Exception as e:
        print(f"❌ Error in mid-week analysis: {str(e)}")
        import traceback
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )


@app.post("/analyze", response_model=AnalysisResponse)
async def run_analysis(request: AnalysisRequest):
    """
    Generic analysis endpoint that routes to different agents

    Currently supports:
    - agent_type: "midweek" - Mid-week team dynamics analysis
    """
    if request.agent_type == "midweek":
        return await run_midweek_analysis(request)
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown agent type: {request.agent_type}. Supported types: ['midweek']"
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv('AGENT_API_PORT', '8000'))

    print(f"""
    {'='*60}
    🚀 Starting Habit System CrewAI Agents API
    {'='*60}

    Server: http://localhost:{port}
    Docs: http://localhost:{port}/docs
    Health: http://localhost:{port}/health

    Available endpoints:
    - POST /analyze/midweek - Run mid-week analysis
    - GET /health - Health check

    {'='*60}
    """)

    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
