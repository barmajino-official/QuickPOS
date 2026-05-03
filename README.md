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

### Local Development

1. Navigate to the `app` directory:
   ```bash
   cd app
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Run the development server:
   ```bash
   bun run dev
   ```

### Docker Setup

To run the entire stack using Docker:
```bash
docker compose up -d
```

## License

MIT
