# Vercel Deployment Guide for MindCare

## Prerequisites
1. Vercel account
2. GitHub repository connected to Vercel
3. External AI API service (Python server)

## Environment Variables Setup

### Required Environment Variables in Vercel Dashboard:
1. `API_KEY` - Your AI service API key
2. `EXTERNAL_API_URL` - Your AI service endpoint URL (optional, falls back to VITE_API_BASE_URL)

### Setting Environment Variables in Vercel:
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables:
   - **Variable Name**: `API_KEY`
   - **Value**: Your actual API key
   - **Environment**: Production, Preview, Development

   - **Variable Name**: `EXTERNAL_API_URL` (optional)
   - **Value**: Your stable AI service URL
   - **Environment**: Production, Preview, Development

## Deployment Features

### 🚀 Automatic Fallback System
- If external AI service is unavailable, the app provides graceful fallback responses
- Users still get supportive mental health messaging even during service outages
- Session management continues to work offline

### 🔄 Multiple Endpoint Support
- Supports environment-based API URL configuration
- Falls back to hardcoded URL if environment variables not set
- Logs connection attempts for debugging

### 🛡️ Enhanced Security
- Proper CORS headers for API endpoints
- Security headers for XSS protection
- Environment-specific configuration

### 📊 Monitoring & Debugging
- Deployment type detection (Vercel vs local)
- Response quality validation
- Comprehensive error logging
- Session management analytics

## Deployment Steps

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: Vercel deployment optimization"
   git push origin main
   ```

2. **Configure Vercel**:
   - Import project from GitHub
   - Set environment variables in dashboard
   - Deploy

3. **Verify Deployment**:
   - Test chat functionality
   - Check browser console for errors
   - Verify API endpoint connections

## Troubleshooting

### Common Issues:
1. **API_KEY not found**: Set environment variable in Vercel dashboard
2. **CORS errors**: Check vercel.json configuration
3. **External API timeout**: Fallback system will activate automatically
4. **Session management**: Uses in-memory storage (suitable for demo)

### Production Considerations:
- Replace in-memory session storage with Redis for production
- Set up proper AI service with stable endpoints
- Configure proper monitoring and alerting
- Add rate limiting for API endpoints

## Environment Files Structure:
```
.env.example        # Template file (committed to git)
.env.local          # Local development (not committed)
.env.production     # Production variables (committed)
```

## Vercel Configuration Files:
```
vercel.json         # Vercel deployment configuration
api/query.js        # Serverless function with fallback logic
```

This setup ensures your MindCare application runs reliably on Vercel with proper fallback mechanisms for external dependencies.
