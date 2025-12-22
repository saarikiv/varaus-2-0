# Troubleshooting Guide

This guide provides solutions to common issues you may encounter when setting up or running the Varaus Full-Stack Coordination System.

## Table of Contents

- [Setup Issues](#setup-issues)
- [Startup Issues](#startup-issues)
- [Build Issues](#build-issues)
- [Runtime Issues](#runtime-issues)
- [Firebase Issues](#firebase-issues)
- [Port Conflicts](#port-conflicts)
- [Dependency Issues](#dependency-issues)

## Setup Issues

### Node.js Version Mismatch

**Problem:** Error message indicates Node.js version is incompatible.

**Solution:**
1. Check your current Node.js version:
   ```bash
   node -v
   ```

2. Install Node.js 20.x LTS from [nodejs.org](https://nodejs.org/)

3. Verify the installation:
   ```bash
   node -v  # Should show v20.x.x
   ```

4. If using nvm (Node Version Manager):
   ```bash
   nvm install 20
   nvm use 20
   ```

### Missing Dependencies

**Problem:** Error messages about missing modules or packages.

**Solution:**
1. Run the setup script to install all dependencies:
   ```bash
   # Linux/Mac
   bash coordination/scripts/setup.sh
   
   # Windows PowerShell
   powershell -ExecutionPolicy Bypass -File coordination/scripts/setup.ps1
   ```

2. Or manually install dependencies in each directory:
   ```bash
   cd coordination && npm install
   cd ../varausserver && npm install
   cd ../varaus && npm install
   ```

3. If issues persist, try clearing npm cache:
   ```bash
   npm cache clean --force
   ```

### Permission Errors

**Problem:** Permission denied errors during setup.

**Solution:**

**Linux/Mac:**
```bash
# Make setup script executable
chmod +x coordination/scripts/setup.sh

# If npm permission issues, avoid using sudo
# Instead, configure npm to use a different directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**Windows:**
```powershell
# Run PowerShell as Administrator
# Or adjust execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Startup Issues

### Missing Environment Variables

**Problem:** Error: "Missing required environment variable: [VARIABLE_NAME]"

**Solution:**
1. Create a `.env` file in the project root if it doesn't exist:
   ```bash
   cp .env.template .env
   ```

2. Edit `.env` and fill in all required variables:
   ```
   DEVELOPMENT_FRONTEND_PORT=8080
   DEVELOPMENT_BACKEND_PORT=3000
   DEVELOPMENT_FIREBASE_API_KEY=your-api-key
   DEVELOPMENT_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   DEVELOPMENT_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   DEVELOPMENT_FIREBASE_PROJECT_ID=your-project-id
   DEVELOPMENT_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   DEVELOPMENT_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   DEVELOPMENT_FIREBASE_APP_ID=your-app-id
   ```

3. Ensure the environment prefix matches your target environment:
   - `DEVELOPMENT_*` for development
   - `STAGING_*` for staging
   - `PRODUCTION_*` for production

### Backend Fails to Start

**Problem:** Backend application fails to start or crashes immediately.

**Solution:**
1. Check if the backend port is already in use (see [Port Conflicts](#port-conflicts))

2. Verify Firebase configuration is correct:
   ```bash
   # Check Firebase credentials in .env file
   cat .env | grep FIREBASE
   ```

3. Check backend logs for specific errors:
   ```bash
   cd varausserver
   npm start
   # Review error messages
   ```

4. Ensure all backend dependencies are installed:
   ```bash
   cd varausserver
   npm install
   ```

### Frontend Fails to Start

**Problem:** Frontend application fails to start or shows connection errors.

**Solution:**
1. Verify the backend is running first:
   ```bash
   cd coordination
   npm run status
   ```

2. Check if the frontend port is available (see [Port Conflicts](#port-conflicts))

3. Verify the API endpoint configuration:
   - Check that `DEVELOPMENT_FRONTEND_API_ENDPOINT` points to the correct backend URL
   - Default should be `http://localhost:3000`

4. Check frontend logs:
   ```bash
   cd varaus
   npm start
   # Review error messages
   ```

## Build Issues

### Build Fails with Compilation Errors

**Problem:** Build process fails with TypeScript or JavaScript errors.

**Solution:**
1. Check the specific error message for the failing file and line number

2. Ensure all dependencies are up to date:
   ```bash
   cd coordination && npm install
   cd ../varausserver && npm install
   cd ../varaus && npm install
   ```

3. Clear build artifacts and rebuild:
   ```bash
   cd coordination
   npm run clean
   npm run build
   ```

4. Check for TypeScript version compatibility:
   ```bash
   cd coordination
   npm list typescript
   ```

### Webpack Build Errors

**Problem:** Frontend build fails with webpack errors.

**Solution:**
1. Clear webpack cache:
   ```bash
   cd varaus
   rm -rf node_modules/.cache
   ```

2. Verify webpack configuration:
   ```bash
   cd varaus
   cat webpack.config.js
   ```

3. Check for conflicting loaders or plugins

4. Try rebuilding with verbose output:
   ```bash
   cd varaus
   npm run build -- --verbose
   ```

## Runtime Issues

### Application Crashes or Restarts Frequently

**Problem:** Applications crash unexpectedly during development.

**Solution:**
1. Check system resources (memory, CPU):
   ```bash
   cd coordination
   npm run status
   ```

2. Review application logs for error patterns

3. Check for infinite loops or memory leaks in recent code changes

4. Increase Node.js memory limit if needed:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

### Hot Reload Not Working

**Problem:** Changes to code don't trigger automatic reload.

**Solution:**
1. Verify file watching is enabled in your development environment

2. Check if file system limits are reached (Linux):
   ```bash
   # Increase file watch limit
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

3. Restart the development environment:
   ```bash
   cd coordination
   npm start
   ```

## Firebase Issues

### Firebase Connection Failed

**Problem:** Error: "Firebase connectivity check failed"

**Solution:**
1. Verify Firebase credentials in `.env` file are correct

2. Check Firebase project status in [Firebase Console](https://console.firebase.google.com/)

3. Verify network connectivity:
   ```bash
   ping firebaseio.com
   ```

4. Check if Firebase services are operational:
   - Visit [Firebase Status Dashboard](https://status.firebase.google.com/)

5. Verify Firebase project permissions:
   - Ensure your Firebase account has access to the project
   - Check Firebase security rules

### Firebase Authentication Errors

**Problem:** Authentication fails or returns errors.

**Solution:**
1. Verify Firebase Auth is enabled in Firebase Console:
   - Go to Authentication > Sign-in method
   - Enable required authentication providers

2. Check Firebase API key is correct:
   ```bash
   cat .env | grep FIREBASE_API_KEY
   ```

3. Verify auth domain matches Firebase project:
   ```bash
   cat .env | grep FIREBASE_AUTH_DOMAIN
   ```

### Firebase Database Connection Issues

**Problem:** Cannot read or write to Firebase database.

**Solution:**
1. Check Firebase database rules:
   - Go to Firebase Console > Database > Rules
   - Ensure rules allow read/write for your use case

2. Verify database URL is correct:
   ```bash
   cat .env | grep FIREBASE_DATABASE_URL
   ```

3. Check if database exists and is active in Firebase Console

4. Test database connection manually:
   ```javascript
   // In browser console or Node.js
   firebase.database().ref('test').set({ value: 'test' })
   ```

## Port Conflicts

### Port Already in Use

**Problem:** Error: "EADDRINUSE: address already in use"

**Solution:**
1. Find the process using the port:

   **Linux/Mac:**
   ```bash
   # For backend (default port 3000)
   lsof -i :3000
   
   # For frontend (default port 8080)
   lsof -i :8080
   ```

   **Windows:**
   ```powershell
   # For backend (default port 3000)
   netstat -ano | findstr :3000
   
   # For frontend (default port 8080)
   netstat -ano | findstr :8080
   ```

2. Kill the process using the port:

   **Linux/Mac:**
   ```bash
   kill -9 <PID>
   ```

   **Windows:**
   ```powershell
   taskkill /PID <PID> /F
   ```

3. Or change the port in `.env` file:
   ```
   DEVELOPMENT_BACKEND_PORT=3001
   DEVELOPMENT_FRONTEND_PORT=8081
   ```

## Dependency Issues

### Conflicting Dependencies

**Problem:** npm reports dependency conflicts or peer dependency warnings.

**Solution:**
1. Try installing with legacy peer deps:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Check for duplicate dependencies:
   ```bash
   npm ls <package-name>
   ```

4. Update to compatible versions:
   ```bash
   npm update
   ```

### Package Vulnerabilities

**Problem:** npm audit reports security vulnerabilities.

**Solution:**
1. Review vulnerabilities:
   ```bash
   npm audit
   ```

2. Attempt automatic fix:
   ```bash
   npm audit fix
   ```

3. For breaking changes, use force (with caution):
   ```bash
   npm audit fix --force
   ```

4. Manually update specific packages:
   ```bash
   npm update <package-name>
   ```

## Getting More Help

If you continue to experience issues:

1. **Check the logs:**
   - Backend logs: `varausserver/logs/`
   - Frontend logs: Browser console
   - Coordination logs: Console output

2. **Enable debug mode:**
   ```bash
   export DEBUG=*
   cd coordination
   npm start
   ```

3. **Review system status:**
   ```bash
   cd coordination
   npm run status
   ```

4. **Check documentation:**
   - [README.md](../README.md)
   - [API Documentation](./API.md)
   - [Development Workflow](./DEVELOPMENT.md)

5. **Contact support:**
   - Create an issue in the project repository
   - Include error messages, logs, and system information
   - Describe steps to reproduce the issue
