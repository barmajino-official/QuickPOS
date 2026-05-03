# QuickPOS Enterprise Management System

A modern, high-performance Point of Sale and Enterprise Management System built with React, Bun, and Supabase.

## Project Structure

- `/app`: The React frontend application (built with Bun).
- `database.sql`: Database schema and initial setup for Supabase.
- `docker-compose.yml`: Docker configuration for local development.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS, DaisyUI
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Docker, Traefik

## Getting Started

### 1. Docker Setup

First, initialize the development environment using Docker:
```bash
docker compose up -d
```

### 2. Enter the Container

To run development commands, you need to attach to the running container:
```bash
docker exec -it uni-app /bin/sh
```

### 3. Run Development Commands

Inside the container, navigate to the `/app` directory and run the following as needed:

- **Install dependencies**:
  ```bash
  bun install
  ```
- **Watch CSS changes**:
  ```bash
  bun run css:watch
  ```
- **Start development server**:
  ```bash
  bun run dev
  ```
- **Build for production**:
  ```bash
  bun run build
  ```
- **Start production server**:
  ```bash
  bun run start
  ```

## Supabase Configuration

### Important: Setup Required
You **must** configure your Supabase credentials before the application will function.

1. Open `app/src/lib/supabase.ts`.
2. Update the `supabaseUrl` and `supabaseAnonKey` with your actual project values.

### Self-Hosted Supabase
This project is designed to work with a self-hosted Supabase instance. If you haven't set up your backend yet, follow the official guide:
[Supabase Self-Hosting Guide (Docker)](https://supabase.com/docs/guides/self-hosting/docker)

## License

MIT
