# Dockerfile for CrewAI Wednesday Agent Service
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Ensure config directory exists
RUN mkdir -p /app/config /app/tools /app/data /app/logs

# Expose the API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run the API server (disable reload in production)
CMD ["python", "-c", "import uvicorn; import os; uvicorn.run('api:app', host='0.0.0.0', port=int(os.getenv('AGENT_API_PORT', '8000')), reload=False, log_level='info')"]
