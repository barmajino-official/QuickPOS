FROM oven/bun:latest
WORKDIR /app

# Install dependencies using Bun
COPY package.json ./
RUN bun install

EXPOSE 5173

# Run Vite and bind to 0.0.0.0 so the host can access it
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]
