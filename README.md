# Sarpongoy Website

A Next.js 14 boilerplate for the Sarpongoy website. The project is set up with the App Router, TypeScript, Tailwind CSS, shadcn-style UI components, NextAuth credentials authentication, React Query, and an Axios API client.

## Tech Stack

- Next.js 14 with App Router
- React 18 and TypeScript
- Tailwind CSS
- shadcn/ui-style reusable components
- NextAuth.js credentials provider
- TanStack React Query
- Axios
- Zustand, React Hook Form, Zod, Recharts, Motion, and Sonner

## Requirements

- Node.js 18.17 or newer
- npm

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

If `.env.example` is not available yet, create `.env.local` manually:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXTAUTH_SECRET=replace-with-a-secure-secret
NEXTAUTH_URL=http://localhost:3000
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
npm run dev
```

Starts the local development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run start
```

Runs the production server after a successful build.

```bash
npm run lint
```

Runs the Next.js lint command.

## Project Structure

```text
src/
  app/
    api/auth/[...nextauth]/route.ts  NextAuth API route
    globals.css                      Global styles and CSS variables
    layout.tsx                       Root layout and providers
    page.tsx                         Home page
  components/
    dashboard/                       Dashboard-specific components
    providers/                       Auth and React Query providers
    shared/                          Shared layout components
    ui/                              Reusable UI components
  lib/
    axios.ts                         Shared Axios instance
    utils.ts                         Utility helpers
middleware.ts                        Auth middleware for protected routes
```

## Authentication

Authentication is wired with NextAuth and a credentials provider in `src/app/api/auth/[...nextauth]/route.ts`.

The current credentials are for local development only:

```text
Email: admin@example.com
Password: password
```

Before production, replace the mock credential check with a real backend API call and move all sensitive values into environment variables.

The middleware protects `/dashboard/:path*` and redirects unauthenticated users to `/login`.

## API Configuration

The shared Axios client is available at `src/lib/axios.ts`.

By default it uses:

```text
http://localhost:8000/api/v1
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` to point the frontend to a different backend.

## UI Components

Reusable UI primitives live in `src/components/ui`. Shared layout components are in `src/components/shared`, and dashboard-specific components are in `src/components/dashboard`.

## Development Notes

- The home page currently presents the boilerplate landing content.
- The auth API and dashboard sidebar are scaffolded, but `/login` and `/dashboard` pages still need to be added.
- Keep new shared helpers in `src/lib` and reusable components in `src/components`.
- Use environment variables for deployment-specific configuration.

## Deployment

The project can be deployed to any platform that supports Next.js, including Vercel.

Typical production flow:

```bash
npm install
npm run build
npm run start
```

Make sure production environment variables are configured before deployment.
