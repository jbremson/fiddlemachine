FROM python:3.11-slim

WORKDIR /app

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install frontend dependencies and build
COPY frontend/package*.json frontend/
WORKDIR /app/frontend
RUN npm install

COPY frontend/ /app/frontend/
RUN npm run build

# Copy backend
WORKDIR /app
COPY backend/ backend/
COPY main.py .
COPY resources/ resources/
COPY data/ data/

# Railway sets PORT env variable
ENV PORT=8000
EXPOSE 8000

# Use shell form to expand $PORT
CMD ["sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port $PORT"]
