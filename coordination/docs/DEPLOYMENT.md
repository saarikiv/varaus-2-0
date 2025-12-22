# Deployment Guide

This guide covers deployment procedures and best practices for the Varaus Full-Stack Coordination System.

## Table of Contents

- [Overview](#overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Environments](#deployment-environments)
- [Deployment Process](#deployment-process)
- [Post-Deployment Verification](#post-deployment-verification)
- [Rollback Procedures](#rollback-procedures)
- [Best Practices](#best-practices)

## Overview

The Varaus Full-Stack Coordination System supports deployment to multiple environments:

- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

Each environment has its own configuration, Firebase project, and deployment target.

## Pre-Deployment Checklist

Before deploying to any environment, ensure:

### Code Quality
- [ ] All tests pass locally
- [ ] Code has been reviewed
- [ ] No console.log or debug statements in production code
- [ ] All linting warnings resolved
- [ ] Documentation is up to date

### Configuration
- [ ] Environment variables are set correctly
- [ ] Firebase configuration is valid for target environment
- [ ] API endpoints are configured correctly
- [ ] CORS settings allow required origins
- [ ] Security rules are properly configured

### Testing
- [ ] Unit tests pass
- [ ] Property-based tests pass
- [ ] Integration tests pass (if applicable)
- [ ] Manual testing completed for critical flows
- [ ] Performance testing completed (for production)

### Dependencies
- [ ] All dependencies are up to date
- [ ] No known security vulnerabilities
- [ ] Package-lock.json is committed
- [ ] Node.js version matches production environment

### Database
- [ ] Database migrations are ready (if applicable)
- [ ] Backup of current database exists
- [ ] Database security rules are reviewed
- [ ] Test data is removed from production database

## Deployment Environments

### Development Environment

**Purpose**: Local development and testing

**Configuration**:
```env
DEVELOPMENT_FRONTEND_PORT=8080
DEVELOPMENT_BACKEND_PORT=3000
DEVELOPMENT_FIREBASE_API_KEY=your-dev-api-key
DEVELOPMENT_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
DEVELOPMENT_FIREBASE_DATABASE_URL=https://your-dev-project.firebaseio.com
DEVELOPMENT_FIREBASE_PROJECT_ID=your-dev-project
DEVELOPMENT_FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
DEVELOPMENT_FIREBASE_MESSAGING_SENDER_ID=your-dev-sender-id
DEVELOPMENT_FIREBASE_APP_ID=your-dev-app-id
```

**Deployment**:
```bash
cd coordination
npm start
```

### Staging Environment

**Purpose**: Pre-production testing with production-like configuration

**Configuration**:
```env
STAGING_FRONTEND_PORT=8080
STAGING_BACKEND_PORT=3000
STAGING_FIREBASE_API_KEY=your-staging-api-key
STAGING_FIREBASE_AUTH_DOMAIN=your-staging-project.firebaseapp.com
STAGING_FIREBASE_DATABASE_URL=https://your-staging-project.firebaseio.com
STAGING_FIREBASE_PROJECT_ID=your-staging-project
STAGING_FIREBASE_STORAGE_BUCKET=your-staging-project.appspot.com
STAGING_FIREBASE_MESSAGING_SENDER_ID=your-staging-sender-id
STAGING_FIREBASE_APP_ID=your-staging-app-id
```

**Deployment**:
```bash
cd coordination
npm run coordination deploy staging
```

**Hosting**:
- Backend: Heroku staging app or similar
- Frontend: Firebase Hosting staging channel
- Database: Firebase staging project

### Production Environment

**Purpose**: Live environment serving end users

**Configuration**:
```env
PRODUCTION_FRONTEND_PORT=8080
PRODUCTION_BACKEND_PORT=3000
PRODUCTION_FIREBASE_API_KEY=your-prod-api-key
PRODUCTION_FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
PRODUCTION_FIREBASE_DATABASE_URL=https://your-prod-project.firebaseio.com
PRODUCTION_FIREBASE_PROJECT_ID=your-prod-project
PRODUCTION_FIREBASE_STORAGE_BUCKET=your-prod-project.appspot.com
PRODUCTION_FIREBASE_MESSAGING_SENDER_ID=your-prod-sender-id
PRODUCTION_FIREBASE_APP_ID=your-prod-app-id
```

**Deployment**:
```bash
cd coordination
npm run coordination deploy production
```

**Hosting**:
- Backend: Heroku production app or similar
- Frontend: Firebase Hosting production
- Database: Firebase production project

## Deployment Process

### Staging Deployment

1. **Prepare for deployment:**
   ```bash
   # Ensure you're on the main branch
   git checkout main
   git pull origin main
   
   # Install dependencies
   cd coordination && npm install
   cd ../varaus && npm install
   cd ../varausserver && npm install
   ```

2. **Run tests:**
   ```bash
   cd coordination
   npm test
   ```

3. **Build for staging:**
   ```bash
   npm run coordination build staging
   ```

4. **Deploy to staging:**
   ```bash
   npm run coordination deploy staging
   ```

5. **Verify deployment:**
   - Check staging URLs are accessible
   - Test critical user flows
   - Review logs for errors
   - Verify Firebase connectivity

6. **Monitor staging:**
   - Watch for errors in logs
   - Check performance metrics
   - Verify all features work as expected

### Production Deployment

**IMPORTANT**: Always deploy to staging first and verify before deploying to production.

1. **Verify staging deployment:**
   ```bash
   # Ensure staging is working correctly
   # Test all critical flows
   # Review staging logs
   ```

2. **Create a deployment tag:**
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

3. **Backup production database:**
   ```bash
   # In Firebase Console:
   # 1. Go to Database
   # 2. Click "Export"
   # 3. Save backup file
   ```

4. **Run final tests:**
   ```bash
   cd coordination
   npm test
   ```

5. **Build for production:**
   ```bash
   npm run coordination build production
   ```

6. **Deploy to production:**
   ```bash
   npm run coordination deploy production
   ```

7. **Verify deployment:**
   - Check production URLs are accessible
   - Test critical user flows
   - Review logs for errors
   - Verify Firebase connectivity
   - Check health endpoints

8. **Monitor production:**
   - Watch error rates
   - Monitor performance metrics
   - Check user traffic
   - Review logs continuously for first hour

### Manual Deployment Steps

If automated deployment is not available, follow these manual steps:

#### Backend Deployment (Heroku Example)

1. **Login to Heroku:**
   ```bash
   heroku login
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production -a your-app-name
   heroku config:set FIREBASE_API_KEY=your-api-key -a your-app-name
   # ... set all other environment variables
   ```

3. **Deploy backend:**
   ```bash
   cd varausserver
   git push heroku main
   ```

4. **Verify deployment:**
   ```bash
   heroku logs --tail -a your-app-name
   ```

#### Frontend Deployment (Firebase Hosting Example)

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase (first time only):**
   ```bash
   cd varaus
   firebase init hosting
   # Select your Firebase project
   # Set public directory to "public"
   # Configure as single-page app: Yes
   ```

4. **Deploy frontend:**
   ```bash
   firebase deploy --only hosting
   ```

5. **Verify deployment:**
   ```bash
   firebase hosting:channel:list
   ```

## Post-Deployment Verification

### Automated Health Checks

The coordination system runs automated health checks after deployment:

1. **Backend Health Check**:
   - Verifies backend is responding
   - Checks Firebase connectivity
   - Validates API endpoints

2. **Frontend Health Check**:
   - Verifies frontend is accessible
   - Checks API connectivity
   - Validates asset loading

3. **Integration Health Check**:
   - Verifies frontend-backend communication
   - Checks CORS configuration
   - Validates end-to-end flows

### Manual Verification

After deployment, manually verify:

1. **User Authentication**:
   - [ ] Login works
   - [ ] Registration works
   - [ ] Password reset works
   - [ ] Session persistence works

2. **Core Functionality**:
   - [ ] View available time slots
   - [ ] Make a reservation
   - [ ] Cancel a reservation
   - [ ] View reservation history
   - [ ] Admin functions (if applicable)

3. **Data Integrity**:
   - [ ] Data loads correctly
   - [ ] Data saves correctly
   - [ ] No data loss occurred
   - [ ] Database migrations applied correctly

4. **Performance**:
   - [ ] Page load times are acceptable
   - [ ] API response times are acceptable
   - [ ] No memory leaks
   - [ ] No excessive CPU usage

5. **Error Handling**:
   - [ ] Error messages display correctly
   - [ ] Errors are logged properly
   - [ ] Users can recover from errors
   - [ ] No sensitive information in error messages

### Monitoring

Set up monitoring for:

1. **Application Metrics**:
   - Request rate
   - Response time
   - Error rate
   - CPU usage
   - Memory usage

2. **Business Metrics**:
   - Active users
   - Reservations made
   - Cancellations
   - Revenue (if applicable)

3. **Alerts**:
   - High error rate
   - Slow response times
   - Application crashes
   - Database connectivity issues

## Rollback Procedures

If issues are detected after deployment, follow these rollback procedures:

### Quick Rollback (Heroku)

```bash
# Rollback to previous release
heroku rollback -a your-app-name

# Or rollback to specific version
heroku releases -a your-app-name
heroku rollback v123 -a your-app-name
```

### Quick Rollback (Firebase Hosting)

```bash
# List previous deployments
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback
```

### Database Rollback

If database changes need to be reverted:

1. **Stop the application** to prevent further writes

2. **Restore from backup**:
   ```bash
   # In Firebase Console:
   # 1. Go to Database
   # 2. Click "Import"
   # 3. Select backup file
   # 4. Confirm import
   ```

3. **Verify data integrity** after restore

4. **Restart the application** with previous version

### Complete Rollback Procedure

1. **Identify the issue**:
   - Review error logs
   - Check monitoring dashboards
   - Reproduce the issue if possible

2. **Assess impact**:
   - How many users are affected?
   - Is data at risk?
   - Can the issue be fixed quickly?

3. **Decide on action**:
   - If critical: Rollback immediately
   - If minor: Fix forward with hotfix
   - If isolated: Monitor and fix in next release

4. **Execute rollback**:
   ```bash
   # Rollback backend
   heroku rollback -a your-app-name
   
   # Rollback frontend
   firebase hosting:rollback
   
   # Restore database if needed
   # (Follow database rollback procedure)
   ```

5. **Verify rollback**:
   - Test critical flows
   - Check error rates
   - Monitor for issues

6. **Communicate**:
   - Notify team of rollback
   - Update status page (if applicable)
   - Document the issue

7. **Post-mortem**:
   - Analyze what went wrong
   - Document lessons learned
   - Update deployment procedures
   - Add tests to prevent recurrence

## Best Practices

### Deployment Timing

- **Avoid peak hours**: Deploy during low-traffic periods
- **Plan maintenance windows**: Schedule deployments in advance
- **Allow time for monitoring**: Don't deploy right before leaving for the day
- **Coordinate with team**: Ensure team members are available for support

### Deployment Frequency

- **Deploy often**: Smaller, frequent deployments are less risky
- **Automate**: Use CI/CD pipelines to reduce manual errors
- **Test thoroughly**: Every deployment should pass all tests
- **Monitor closely**: Watch metrics after each deployment

### Communication

- **Notify stakeholders**: Inform team and users of planned deployments
- **Document changes**: Maintain a changelog
- **Update status page**: Keep users informed of system status
- **Post-deployment report**: Share results with team

### Security

- **Use HTTPS**: Always use encrypted connections in production
- **Rotate secrets**: Regularly update API keys and passwords
- **Review permissions**: Ensure proper access controls
- **Audit logs**: Review security logs regularly

### Performance

- **Optimize builds**: Minimize bundle sizes
- **Use CDN**: Serve static assets from CDN
- **Enable caching**: Cache appropriate resources
- **Monitor performance**: Track and optimize slow endpoints

### Disaster Recovery

- **Regular backups**: Automate database backups
- **Test restores**: Verify backups can be restored
- **Document procedures**: Keep runbooks up to date
- **Practice drills**: Regularly test disaster recovery procedures

## Troubleshooting Deployments

### Deployment Fails

**Problem**: Deployment command fails with error

**Solutions**:
1. Check error message for specific issue
2. Verify environment variables are set
3. Ensure build completed successfully
4. Check deployment platform status
5. Review deployment logs

### Health Checks Fail

**Problem**: Deployment completes but health checks fail

**Solutions**:
1. Check application logs for errors
2. Verify Firebase connectivity
3. Test API endpoints manually
4. Check CORS configuration
5. Verify environment variables

### Application Not Accessible

**Problem**: Application deployed but not accessible

**Solutions**:
1. Check DNS configuration
2. Verify hosting platform status
3. Check firewall rules
4. Verify SSL certificates
5. Test from different networks

### Database Connection Issues

**Problem**: Application can't connect to database

**Solutions**:
1. Verify Firebase credentials
2. Check Firebase security rules
3. Test database connectivity manually
4. Review Firebase project status
5. Check network connectivity

## Additional Resources

- [Heroku Deployment Guide](https://devcenter.heroku.com/articles/deploying-nodejs)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Firebase Database Security Rules](https://firebase.google.com/docs/database/security)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Development Workflow](DEVELOPMENT.md)
