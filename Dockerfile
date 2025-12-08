# Hugging Face Spaces Docker deployment
FROM node:20-slim

# Install system dependencies for puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set puppeteer to use installed chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create app directory
WORKDIR /app

# Create a non-root user for Hugging Face Spaces
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /home/user/app

# Copy package files
COPY --chown=user package*.json ./
COPY --chown=user galion-v2/package*.json ./galion-v2/

# Install backend dependencies
RUN npm ci --only=production

# Install frontend dependencies and build
COPY --chown=user galion-v2/ ./galion-v2/
WORKDIR /home/user/app/galion-v2
RUN npm ci && HF_SPACE=true npm run build

# Go back to app root
WORKDIR /home/user/app

# Copy the rest of the application
COPY --chown=user . .

# Move built frontend to be served
RUN mkdir -p public && cp -r galion-v2/dist/* public/

# Create downloads directory
RUN mkdir -p downloads

# Expose port 7860 (Hugging Face Spaces default)
EXPOSE 7860

# Set environment variables
ENV PORT=7860
ENV NODE_ENV=production
ENV DOWNLOADS_DIR=/home/user/app/downloads

# Start the server
CMD ["node", "server.js"]
