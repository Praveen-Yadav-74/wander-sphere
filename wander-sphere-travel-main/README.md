# WanderSphere Travel App

A modern travel social platform built with React, TypeScript, and Node.js, featuring a comprehensive backend API and beautiful frontend interface.

## Features

- **Social Features**: Stories, posts, and travel communities
- **Trip Management**: Create, share, and discover travel experiences
- **Interactive Maps**: Explore destinations with Leaflet integration
- **Budget Planning**: Track expenses and plan travel budgets
- **User Profiles**: Customizable profiles with travel statistics
- **Real-time Features**: Live updates and notifications
- **Booking Integration**: Partner integrations for travel bookings
- **Authentication**: Secure user authentication with Supabase

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express API
- **Database**: Supabase (PostgreSQL)
- **Deployment**: 
  - Backend: Render (https://wander-sphere-ue7e.onrender.com)
  - Frontend: Vercel (https://wander-sphere-zpml.vercel.app)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wander-sphere-travel
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

4. Set up environment variables:
   - Copy `.env.example` to `.env` in the root directory
   - Copy `backend/.env.example` to `backend/.env`
   - Configure your Supabase credentials and other settings

### Development

#### Frontend Development
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`

#### Backend Development
```bash
cd backend
npm run dev
```
The backend API will be available at `http://localhost:5000`

### Building for Production

#### Frontend Build
```bash
npm run build
```
This creates an optimized build in the `dist` directory.

#### Backend Deployment
The backend is configured for Render deployment with `render.yaml`.

## Project Structure

```
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/             # Application pages
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service functions
│   ├── contexts/          # React contexts
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── config/            # Configuration files
├── backend/               # Backend API
│   ├── routes/            # API route handlers
│   ├── models/            # Data models
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   ├── config/            # Backend configuration
│   └── scripts/           # Database scripts
├── public/                # Static assets
└── docs/                  # Documentation
```

## API Documentation

The backend provides a comprehensive REST API with the following endpoints:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Trips**: `/api/trips/*`
- **Stories**: `/api/stories/*`
- **Clubs**: `/api/clubs/*`
- **Bookings**: `/api/booking/*`
- **Budget**: `/api/budget/*`

API Base URL: `https://wander-sphere-ue7e.onrender.com/api`

## Technologies Used

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui
- React Router
- TanStack Query
- Leaflet Maps
- Framer Motion

### Backend
- Node.js
- Express.js
- Supabase (PostgreSQL)
- JWT Authentication
- Multer (File uploads)
- CORS

### Development Tools
- ESLint
- TypeScript
- Vite
- PostCSS

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=https://wander-sphere-ue7e.onrender.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (backend/.env)
```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://wander-sphere-zpml.vercel.app
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

## Deployment

### Backend (Render)
The backend is deployed on Render and configured via `render.yaml`.

### Frontend (Vercel)
The frontend is ready for Vercel deployment with `vercel.json` configuration.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details
