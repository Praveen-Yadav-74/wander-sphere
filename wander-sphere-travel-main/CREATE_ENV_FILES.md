# How to Create .env.example Files

The `.env.example` files are protected by the system, so I've created template files that you can rename.

## Quick Steps

### Frontend .env.example

1. **Rename the template file:**
   ```bash
   # In the root directory
   mv ENV_EXAMPLE_TEMPLATE.txt .env.example
   ```

   Or manually:
   - Copy content from `ENV_EXAMPLE_TEMPLATE.txt`
   - Create new file: `.env.example`
   - Paste the content
   - Save

### Backend .env.example

1. **Rename the template file:**
   ```bash
   # In the backend directory
   cd backend
   mv ENV_EXAMPLE_TEMPLATE.txt .env.example
   ```

   Or manually:
   - Copy content from `backend/ENV_EXAMPLE_TEMPLATE.txt`
   - Create new file: `backend/.env.example`
   - Paste the content
   - Save

## What's Updated

Both template files now contain:

✅ **Production URLs:**
- Frontend API: `https://wander-sphere-ue7e.onrender.com`
- Backend Frontend URL: `https://wander-sphere-zpml.vercel.app`

✅ **All required environment variables**
✅ **Clear instructions for local development**
✅ **Notes about production deployment**

## After Creating .env.example Files

1. **Commit them to Git:**
   ```bash
   git add .env.example backend/.env.example
   git commit -m "Add .env.example files with production URLs"
   ```

2. **For local development:**
   - Copy `.env.example` to `.env.local` (frontend)
   - Copy `backend/.env.example` to `backend/.env` (backend)
   - Update URLs to `localhost` for local development
   - Add your actual Supabase credentials

## Important Notes

- ⚠️ **Never commit `.env` or `.env.local`** - they're in `.gitignore`
- ✅ **`.env.example` files are safe to commit** - they're templates with no secrets
- 🔄 **Production uses Vercel/Render environment variables**, not `.env` files

