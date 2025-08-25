# WanderSphere Backend API

## Deployment Instructions

### Option 1: Deploy to Railway (Recommended)

1. Go to [Railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select this repository
5. Choose the `backend` folder as the root directory
6. Railway will automatically detect the Node.js app
7. Add the following environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g., https://your-app.vercel.app)
   - `JWT_SECRET`: A secure random string
   - `NODE_ENV`: production

### Option 2: Deploy to Render

1. Go to [Render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Set the following:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add the same environment variables as above

### Option 3: Deploy to Vercel (Current Setup)

1. Create a new Vercel project for the backend
2. Set the root directory to `backend`
3. Vercel will use the `vercel.json` configuration
4. Add environment variables in Vercel dashboard

## Environment Variables Required

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=https://your-frontend-url.vercel.app
JWT_SECRET=your_jwt_secret
NODE_ENV=production
PORT=5000
```

## After Deployment

1. Note the deployed backend URL (e.g., https://your-backend.railway.app)
2. Update the frontend's `VITE_API_BASE_URL` environment variable in Vercel
3. Set it to: `https://your-backend-url.com/api`

## API Endpoints

Once deployed, your API will be available at:
- Health check: `GET /health`
- Authentication: `POST /api/auth/login`, `POST /api/auth/register`
- Users: `GET /api/users/profile`
- Trips: `GET /api/trips`, `POST /api/trips`
- And more...