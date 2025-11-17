FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port (dynamic from environment variable)
EXPOSE ${PORT:-8000}

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8000}/health')"

# Start command with WebSocket support
# Use uvicorn with --ws-max-size and increased timeout for WebSocket connections
CMD sh -c "alembic upgrade head && \
    uvicorn app.main:app \
    --host 0.0.0.0 \
    --port ${PORT:-8000} \
    --ws-max-size 16777216 \
    --timeout-keep-alive 300 \
    --log-level info"
