# backend/Dockerfile
FROM python:3.12-slim

# 1. Install uv by copying the binary directly from the official uv Docker image.
# This is called a "multi-stage build" and keeps our final image clean and small.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# 2. Pro-tip: Environment variables to make uv even faster and cleaner in Docker
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

# 3. Copy requirements first (Docker caches this layer!)
COPY requirements.txt .

# 4. Install dependencies using uv.
# The --system flag tells uv to install directly into the container's Python (no venv needed in Docker)
RUN uv pip install --no-cache-dir -r requirements.txt --system

# 5. Copy the rest of the application code
COPY ./app ./app

# 6. Run the app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
