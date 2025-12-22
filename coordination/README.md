# Varaus Full-Stack Coordination System

A unified development, testing, and deployment system for the Varaus sauna reservation application, coordinating the React frontend and Express.js backend as a cohesive unit.

## Overview

The Varaus Full-Stack Coordination System simplifies the complexity of managing two separate applications (frontend and backend) by providing:

- **Unified Development Environment**: Start both applications with a single command
- **Coordinated Build Process**: Build applications in the correct dependency order
- **Integrated Testing**: Run tests across both applications with unified reporting
- **Environment Management**: Consistent configuration across development, staging, and production
- **Health Monitoring**: Continuous monitoring of both applications and their integration
- **Automated Deployment**: Deploy both applications with health verification

## Quick Start

### Prerequisites

- Node.js 20.x LTS or higher
- npm 9.x or higher
- Firebase account with project credentials

### Installation

1. Clone the repository and navigate to the project root

2. Run the setup script:

   **Linux/Mac:**
   ```bash
   bash coordination/scripts/setup.sh
   ```

   **Windows PowerShell:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File coordination/scripts/setup.ps1
   ```

3. Configure environment variables:
   ```bash
   cp .env.template .env
   # Edit .env with your Firebase credentials
   ```

4. Start the development environment:
   ```bash
   cd coordination
   npm start
   ```

The system will start both frontend and backend applications with proper configuration and connectivity verification.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Coordination CLI                            │
│  (Unified interface for managing both applications)         │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────────┐   ┌───▼────────┐
│  Config    │   │  Process   │
│  Manager   │   │  Manager   │
└───┬────────┘   └───┬────────┘
    │                │
    │    ┌───────────┴───────────┐
    │    │                       │
┌───▼────▼──────┐      ┌────────▼────────┐
│   Frontend    │      │    Backend      │
│   (varaus)    │◄────►│  (varausserver) │
└───────┬───────┘      └────────┬────────┘
        │                       │
        └───────────┬───────────┘
                    │
            ┌───────▼────────┐
            │    Firebase    │
            │    Database    │
            └────────────────┘
```

## Core Components

### Configuration Manager
Manages environment-specific settings and ensures compatibility between frontend and backend configurations.

### Process Manager
Handles application lifecycle management, including startup, shutdown, restart, and file watching for hot reload.

### Build Coordinator
Orchestrates the build process for both applications in the correct dependency order.

### Test Coordinator
Runs tests for both applications independently and provides unified reporting.

### Health Monitor
Continuously monitors application status, Firebase connectivity, and integration health.

## Usage

### Development Commands

Start the development environment:
```bash
cd coordination
npm start
# or
npm run start:dev  # Uses ts-node for faster iteration
```

Check system status:
```bash
cd coordination
npm run status
```

View logs:
```bash
cd coordination
npm run logs
```

### Build Commands

Build for development:
```bash
cd coordination
npm run coordination build development
```

Build for staging:
```bash
cd coordination
npm run coordination build staging
```

Build for production:
```bash
cd coordination
npm run coordination build production
```

### Testing Commands

Run all tests:
```bash
cd coordination
npm test
```

Run unit tests only:
```bash
cd coordination
npm run test:unit
```

Run property-based tests:
```bash
cd coordination
npm run test:property
```

Run integration tests:
```bash
cd coordination
npm run test:integration
```

### Deployment Commands

Deploy to staging:
```bash
cd coordination
npm run coordination deploy staging
```

Deploy to production:
```bash
cd coordination
npm run coordination deploy production
```

## Environment Configuration

The system uses environment-specific configuration files. Create a `.env` file in the project root with the following structure:

```env
# Development Environment
DEVELOPMENT_FRONTEND_PORT=8080
DEVELOPMENT_BACKEND_PORT=3000
DEVELOPMENT_FIREBASE_API_KEY=your-dev-api-key
DEVELOPMENT_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
DEVELOPMENT_FIREBASE_DATABASE_URL=https://your-dev-project.firebaseio.com
DEVELOPMENT_FIREBASE_PROJECT_ID=your-dev-project
DEVELOPMENT_FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
DEVELOPMENT_FIREBASE_MESSAGING_SENDER_ID=your-dev-sender-id
DEVELOPMENT_FIREBASE_APP_ID=your-dev-app-id

# Staging Environment
STAGING_FRONTEND_PORT=8080
STAGING_BACKEND_PORT=3000
STAGING_FIREBASE_API_KEY=your-staging-api-key
# ... (similar structure for staging)

# Production Environment
PRODUCTION_FRONTEND_PORT=8080
PRODUCTION_BACKEND_PORT=3000
PRODUCTION_FIREBASE_API_KEY=your-prod-api-key
# ... (similar structure for production)
```

## Project Structure

```
varaus-coordination/
├── coordination/              # Coordination system
│   ├── src/
│   │   ├── cli/              # Command-line interface
│   │   ├── config/           # Configuration management
│   │   ├── process/          # Process management
│   │   ├── build/            # Build coordination
│   │   ├── test/             # Test coordination
│   │   ├── health/           # Health monitoring
│   │   └── logging/          # Logging system
│   ├── tests/
│   │   ├── unit/             # Unit tests
│   │   ├── property/         # Property-based tests
│   │   └── integration/      # Integration tests
│   ├── scripts/              # Setup and utility scripts
│   └── docs/                 # Documentation
├── varaus/                   # Frontend application
│   ├── src/                  # React application source
│   └── public/               # Static assets
├── varausserver/             # Backend application
│   ├── src/                  # Express server source
│   └── public/               # Server configuration
└── .env                      # Environment configuration
```

## Development Workflow

### Starting Development

1. Ensure all dependencies are installed:
   ```bash
   bash coordination/scripts/setup.sh
   ```

2. Configure your environment variables in `.env`

3. Start the coordination system:
   ```bash
   cd coordination
   npm start
   ```

4. The system will:
   - Load and validate configuration
   - Start the backend application
   - Verify Firebase connectivity
   - Start the frontend application
   - Verify API connectivity
   - Enable hot reload for both applications

### Making Changes

1. Edit files in `varaus/` (frontend) or `varausserver/` (backend)

2. Changes are automatically detected:
   - Frontend: Hot reload via webpack dev server
   - Backend: Automatic restart via process monitor

3. Check system status:
   ```bash
   cd coordination
   npm run status
   ```

### Running Tests

1. Run tests before committing:
   ```bash
   cd coordination
   npm test
   ```

2. Fix any failing tests

3. Commit your changes

### Building for Deployment

1. Build for the target environment:
   ```bash
   cd coordination
   npm run coordination build production
   ```

2. Verify the build succeeded:
   - Check for build artifacts in `varaus/public/` and `varausserver/public/`
   - Review any build warnings or errors

3. Run tests on the built code:
   ```bash
   npm test
   ```

### Deploying

1. Deploy to staging first:
   ```bash
   cd coordination
   npm run coordination deploy staging
   ```

2. Verify staging deployment:
   - Check health endpoints
   - Test critical user flows
   - Review logs for errors

3. Deploy to production:
   ```bash
   cd coordination
   npm run coordination deploy production
   ```

4. Monitor production deployment:
   - Watch health metrics
   - Check error rates
   - Verify user traffic

## Troubleshooting

For common issues and solutions, see [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

Quick troubleshooting checklist:

- ✓ Node.js version 20.x or higher installed
- ✓ All dependencies installed (`npm install` in all directories)
- ✓ Environment variables configured in `.env`
- ✓ Firebase credentials are valid
- ✓ Required ports are available (default: 3000 for backend, 8080 for frontend)
- ✓ No other instances of the applications are running

## Documentation

- [API Documentation](docs/API.md) - Detailed API reference for the coordination system
- [Development Workflow](docs/DEVELOPMENT.md) - In-depth development guide
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Solutions to common issues
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment procedures and best practices

## Testing

The coordination system uses a comprehensive testing strategy:

### Unit Tests
Test individual components in isolation using Mocha and Chai.

### Property-Based Tests
Verify universal properties using fast-check with 100+ iterations per property.

### Integration Tests
Test the interaction between components and applications.

Run specific test suites:
```bash
npm run test:unit        # Unit tests only
npm run test:property    # Property-based tests only
npm run test:integration # Integration tests only
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Build the system: `npm run build`
5. Submit a pull request

## License

[Your License Here]

## Support

For issues, questions, or contributions:
- Create an issue in the repository
- Review the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
- Check existing documentation in the `docs/` directory
