# Development Workflow Guide

This guide provides detailed information about developing with the Varaus Full-Stack Coordination System.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Building](#building)
- [Debugging](#debugging)
- [Best Practices](#best-practices)

## Getting Started

### Initial Setup

1. **Install Prerequisites**
   ```bash
   # Verify Node.js version
   node -v  # Should be 20.x or higher
   
   # Verify npm version
   npm -v   # Should be 9.x or higher
   ```

2. **Run Setup Script**
   ```bash
   # Linux/Mac
   bash coordination/scripts/setup.sh
   
   # Windows
   powershell -ExecutionPolicy Bypass -File coordination/scripts/setup.ps1
   ```

3. **Configure Environment**
   ```bash
   # Copy template
   cp .env.template .env
   
   # Edit with your Firebase credentials
   nano .env  # or use your preferred editor
   ```

4. **Verify Setup**
   ```bash
   cd coordination
   npm run build
   npm test
   ```

### Understanding the Project Structure

```
varaus-coordination/
├── coordination/              # Coordination system (TypeScript)
│   ├── src/
│   │   ├── cli/              # CLI commands and interface
│   │   │   ├── bin.ts        # CLI entry point
│   │   │   └── index.ts      # CLI implementation
│   │   ├── config/           # Configuration management
│   │   │   ├── index.ts      # Config manager
│   │   │   ├── dependency-checker.ts
│   │   │   └── version-checker.ts
│   │   ├── process/          # Process lifecycle management
│   │   │   ├── coordinator.ts
│   │   │   ├── monitor.ts
│   │   │   └── index.ts
│   │   ├── build/            # Build coordination
│   │   ├── test/             # Test coordination
│   │   ├── health/           # Health monitoring
│   │   ├── logging/          # Logging and tracing
│   │   ├── types.ts          # Shared type definitions
│   │   └── index.ts          # Main exports
│   ├── tests/
│   │   ├── unit/             # Unit tests
│   │   ├── property/         # Property-based tests
│   │   └── integration/      # Integration tests
│   ├── scripts/              # Automation scripts
│   ├── docs/                 # Documentation
│   └── package.json
├── varaus/                   # Frontend (React + Redux)
│   ├── src/
│   │   ├── dev/
│   │   │   ├── actions/      # Redux actions
│   │   │   ├── reducers/     # Redux reducers
│   │   │   ├── components/   # React components
│   │   │   ├── views/        # Page components
│   │   │   └── helpers/      # Utility functions
│   │   ├── styles/           # SCSS stylesheets
│   │   └── app.jsx           # Application entry
│   ├── public/               # Built assets
│   └── package.json
└── varausserver/             # Backend (Express.js)
    ├── src/
    │   ├── post/             # POST endpoint handlers
    │   ├── helpers/          # Utility functions
    │   ├── server.js         # Server setup
    │   └── setHeaders.js     # CORS configuration
    ├── public/               # Server configuration
    └── package.json
```

## Development Environment

### Starting the Development Environment

The coordination system provides a unified way to start both applications:

```bash
cd coordination
npm start
```

This command:
1. Loads environment configuration
2. Starts the backend application
3. Verifies Firebase connectivity
4. Starts the frontend application
5. Verifies API connectivity
6. Enables hot reload for both applications

### Development Mode Features

**Hot Reload:**
- Frontend: Webpack dev server automatically reloads on file changes
- Backend: Process monitor restarts the server on file changes

**Live Monitoring:**
- Health checks run continuously
- Process status is tracked
- Integration status is monitored

**Unified Logging:**
- Logs from both applications are correlated
- Request flows are traced across frontend and backend
- Timing information is captured

### Checking System Status

```bash
cd coordination
npm run status
```

Output includes:
- Application status (running, stopped, error)
- Port information
- Memory and CPU usage
- Integration health (API connectivity, database connectivity, CORS status)
- System uptime

### Stopping the Development Environment

Press `Ctrl+C` in the terminal where the coordination system is running. The system will:
1. Gracefully shut down both applications
2. Clean up resources
3. Exit

## Making Changes

### Frontend Development

1. **Navigate to the frontend directory:**
   ```bash
   cd varaus
   ```

2. **Make your changes** to files in `src/`

3. **Changes are automatically detected** and the browser reloads

4. **Common frontend tasks:**
   ```bash
   # Run frontend tests
   npm test
   
   # Build frontend manually
   npm run build
   
   # Lint code
   npm run lint
   ```

### Backend Development

1. **Navigate to the backend directory:**
   ```bash
   cd varausserver
   ```

2. **Make your changes** to files in `src/`

3. **The server automatically restarts** when files change

4. **Common backend tasks:**
   ```bash
   # Run backend tests
   npm test
   
   # Build backend manually
   npm run build
   
   # Start backend standalone
   npm start
   ```

### Coordination System Development

1. **Navigate to the coordination directory:**
   ```bash
   cd coordination
   ```

2. **Make your changes** to files in `src/`

3. **Rebuild the coordination system:**
   ```bash
   npm run build
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

5. **Test your changes:**
   ```bash
   npm run start:dev  # Uses ts-node for faster iteration
   ```

## Testing

### Running All Tests

```bash
cd coordination
npm test
```

This runs:
- Unit tests for the coordination system
- Property-based tests
- Integration tests
- Tests for both frontend and backend applications

### Running Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Property-based tests only
npm run test:property

# Integration tests only
npm run test:integration
```

### Writing Tests

**Unit Tests:**
```typescript
// tests/unit/example.test.ts
import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('Component Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).to.equal('expected');
  });
});
```

**Property-Based Tests:**
```typescript
// tests/property/example.property.test.ts
import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as fc from 'fast-check';

describe('Property Tests', () => {
  it('should satisfy property for all inputs', () => {
    /**
     * Feature: full-stack-coordination, Property 1: Example Property
     * Validates: Requirements 1.1
     */
    fc.assert(
      fc.property(
        fc.string(),  // Generator for test inputs
        (input) => {
          // Property that should hold for all inputs
          const result = functionUnderTest(input);
          return result.length >= 0;  // Example property
        }
      ),
      { numRuns: 100 }  // Run 100 iterations
    );
  });
});
```

### Test-Driven Development

1. **Write a failing test** that describes the desired behavior
2. **Run the test** to verify it fails
3. **Implement the minimum code** to make the test pass
4. **Run the test** to verify it passes
5. **Refactor** the code while keeping tests passing
6. **Repeat** for the next feature

## Building

### Building for Development

```bash
cd coordination
npm run coordination build development
```

This:
- Builds the backend with development configuration
- Builds the frontend with development configuration
- Generates source maps for debugging
- Skips minification for faster builds

### Building for Staging

```bash
cd coordination
npm run coordination build staging
```

This:
- Builds both applications with staging configuration
- Applies staging environment variables
- Enables some optimizations
- Generates build artifacts

### Building for Production

```bash
cd coordination
npm run coordination build production
```

This:
- Builds both applications with production configuration
- Applies production environment variables
- Enables full optimizations (minification, tree-shaking)
- Generates production-ready artifacts

### Build Output

**Backend:**
- Output directory: `varausserver/public/`
- Main file: `index.js`
- Configuration: `varaus-prod.json` or `varaus-stage.json`

**Frontend:**
- Output directory: `varaus/public/`
- Main files: `app.min.js`, `app.min.css`
- Assets: `assets/` directory

## Debugging

### Debugging the Frontend

1. **Open browser developer tools** (F12)

2. **Use React DevTools** extension for component inspection

3. **Check the Console** for errors and logs

4. **Use the Network tab** to inspect API requests

5. **Set breakpoints** in source files (source maps are enabled in development)

### Debugging the Backend

1. **Start backend with debugging enabled:**
   ```bash
   cd varausserver
   node --inspect src/server.js
   ```

2. **Attach debugger:**
   - Chrome: Navigate to `chrome://inspect`
   - VS Code: Use the built-in debugger with this configuration:
     ```json
     {
       "type": "node",
       "request": "attach",
       "name": "Attach to Backend",
       "port": 9229
     }
     ```

3. **Set breakpoints** in your code

4. **Inspect variables** and step through code

### Debugging the Coordination System

1. **Enable debug logging:**
   ```bash
   export DEBUG=*
   cd coordination
   npm run start:dev
   ```

2. **Use TypeScript debugging:**
   ```bash
   cd coordination
   node --inspect -r ts-node/register src/cli/bin.ts start
   ```

3. **Check logs** for detailed information about:
   - Configuration loading
   - Process startup
   - Health checks
   - Build processes

### Common Debugging Scenarios

**Frontend not connecting to backend:**
1. Check backend is running: `npm run status`
2. Verify API endpoint in `.env`
3. Check CORS configuration in backend
4. Inspect network requests in browser DevTools

**Backend not connecting to Firebase:**
1. Verify Firebase credentials in `.env`
2. Check Firebase project status in console
3. Review Firebase security rules
4. Test Firebase connection manually

**Build failures:**
1. Check error messages for specific file/line
2. Verify all dependencies are installed
3. Clear build cache and rebuild
4. Check for TypeScript/JavaScript syntax errors

## Best Practices

### Code Organization

- **Keep components small and focused** - Each component should have a single responsibility
- **Use meaningful names** - Variables, functions, and files should clearly indicate their purpose
- **Follow existing patterns** - Maintain consistency with the existing codebase
- **Separate concerns** - Keep business logic separate from UI logic

### Configuration Management

- **Never commit secrets** - Use environment variables for sensitive data
- **Use environment-specific configs** - Separate development, staging, and production settings
- **Validate configuration** - Check for required variables at startup
- **Document configuration** - Keep `.env.template` up to date

### Testing

- **Write tests first** - TDD helps design better APIs
- **Test behavior, not implementation** - Focus on what the code does, not how
- **Use property-based tests** - Verify properties hold for all inputs
- **Keep tests fast** - Fast tests encourage frequent running

### Version Control

- **Commit frequently** - Small, focused commits are easier to review
- **Write clear commit messages** - Explain what and why, not how
- **Use feature branches** - Keep main branch stable
- **Review before merging** - Have someone else review your changes

### Performance

- **Profile before optimizing** - Measure to find real bottlenecks
- **Optimize critical paths** - Focus on code that runs frequently
- **Use caching wisely** - Cache expensive operations
- **Monitor in production** - Track performance metrics

### Security

- **Validate all inputs** - Never trust user input
- **Use HTTPS in production** - Encrypt data in transit
- **Keep dependencies updated** - Patch security vulnerabilities
- **Follow Firebase security rules** - Restrict database access appropriately

## Workflow Examples

### Adding a New Feature

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Update requirements** (if needed):
   - Edit `.kiro/specs/full-stack-coordination/requirements.md`

3. **Update design** (if needed):
   - Edit `.kiro/specs/full-stack-coordination/design.md`

4. **Implement the feature:**
   - Make changes to frontend and/or backend
   - Update coordination system if needed

5. **Write tests:**
   ```bash
   cd coordination
   # Add tests in tests/unit/ or tests/property/
   npm test
   ```

6. **Build and verify:**
   ```bash
   npm run build
   npm run coordination build development
   ```

7. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add new feature: description"
   git push origin feature/new-feature
   ```

8. **Create pull request** for review

### Fixing a Bug

1. **Reproduce the bug** in development environment

2. **Write a failing test** that demonstrates the bug

3. **Fix the bug** in the code

4. **Verify the test passes:**
   ```bash
   npm test
   ```

5. **Check for regressions:**
   ```bash
   npm test  # Run all tests
   ```

6. **Commit the fix:**
   ```bash
   git add .
   git commit -m "Fix: description of bug"
   ```

### Updating Dependencies

1. **Check for outdated packages:**
   ```bash
   cd coordination && npm outdated
   cd ../varaus && npm outdated
   cd ../varausserver && npm outdated
   ```

2. **Update packages:**
   ```bash
   # Update coordination system
   cd coordination
   npm update
   
   # Update frontend
   cd ../varaus
   npm update
   
   # Update backend
   cd ../varausserver
   npm update
   ```

3. **Test thoroughly:**
   ```bash
   cd coordination
   npm test
   npm run coordination build development
   npm start
   ```

4. **Commit updates:**
   ```bash
   git add package.json package-lock.json
   git commit -m "Update dependencies"
   ```

## Additional Resources

- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [API Documentation](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Main README](../README.md)
