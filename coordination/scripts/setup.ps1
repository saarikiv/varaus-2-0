# Varaus Full-Stack Coordination System Setup Script (PowerShell)
# This script automates the setup of the development environment

$ErrorActionPreference = "Stop"

Write-Host "=== Varaus Full-Stack Coordination System Setup ===" -ForegroundColor Cyan
Write-Host ""

# Function to print colored output
function Print-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Print-Info {
    param([string]$Message)
    Write-Host "  $Message"
}

# Check Node.js version
Write-Host "Checking Node.js version..."
try {
    $nodeVersion = node -v
    $nodeMajorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($nodeMajorVersion -lt 20) {
        Print-Error "Node.js version 20.x or higher is required (found: $nodeVersion)"
        Write-Host ""
        Write-Host "Please upgrade Node.js to version 20.x LTS from https://nodejs.org/"
        exit 1
    }
    
    Print-Success "Node.js version $nodeVersion detected"
} catch {
    Print-Error "Node.js is not installed"
    Write-Host ""
    Write-Host "Please install Node.js 20.x LTS from https://nodejs.org/"
    exit 1
}
Write-Host ""

# Check npm
Write-Host "Checking npm..."
try {
    $npmVersion = npm -v
    Print-Success "npm version $npmVersion detected"
} catch {
    Print-Error "npm is not installed"
    exit 1
}
Write-Host ""

# Install coordination system dependencies
Write-Host "Installing coordination system dependencies..."
if (Test-Path "coordination") {
    Push-Location coordination
    try {
        npm install
        Print-Success "Coordination system dependencies installed"
    } catch {
        Print-Error "Failed to install coordination system dependencies"
        Pop-Location
        exit 1
    }
    Pop-Location
} else {
    Print-Error "coordination directory not found"
    exit 1
}
Write-Host ""

# Install backend dependencies
Write-Host "Installing backend (varausserver) dependencies..."
if (Test-Path "varausserver") {
    Push-Location varausserver
    try {
        npm install
        Print-Success "Backend dependencies installed"
    } catch {
        Print-Error "Failed to install backend dependencies"
        Pop-Location
        exit 1
    }
    Pop-Location
} else {
    Print-Error "varausserver directory not found"
    exit 1
}
Write-Host ""

# Install frontend dependencies
Write-Host "Installing frontend (varaus) dependencies..."
if (Test-Path "varaus") {
    Push-Location varaus
    try {
        npm install
        Print-Success "Frontend dependencies installed"
    } catch {
        Print-Error "Failed to install frontend dependencies"
        Pop-Location
        exit 1
    }
    Pop-Location
} else {
    Print-Error "varaus directory not found"
    exit 1
}
Write-Host ""

# Check for environment configuration
Write-Host "Checking environment configuration..."
$envFileExists = Test-Path ".env"

if ($envFileExists) {
    Print-Success "Environment file (.env) found"
} else {
    Print-Warning "No .env file found"
}
Write-Host ""

# Create environment template if needed
if (-not $envFileExists) {
    Write-Host "Creating environment configuration template..."
    
    $envTemplate = @"
# Varaus Full-Stack Coordination System
# Environment Configuration Template

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
STAGING_FIREBASE_AUTH_DOMAIN=your-staging-project.firebaseapp.com
STAGING_FIREBASE_DATABASE_URL=https://your-staging-project.firebaseio.com
STAGING_FIREBASE_PROJECT_ID=your-staging-project
STAGING_FIREBASE_STORAGE_BUCKET=your-staging-project.appspot.com
STAGING_FIREBASE_MESSAGING_SENDER_ID=your-staging-sender-id
STAGING_FIREBASE_APP_ID=your-staging-app-id

# Production Environment
PRODUCTION_FRONTEND_PORT=8080
PRODUCTION_BACKEND_PORT=3000
PRODUCTION_FIREBASE_API_KEY=your-prod-api-key
PRODUCTION_FIREBASE_AUTH_DOMAIN=your-prod-project.firebaseapp.com
PRODUCTION_FIREBASE_DATABASE_URL=https://your-prod-project.firebaseio.com
PRODUCTION_FIREBASE_PROJECT_ID=your-prod-project
PRODUCTION_FIREBASE_STORAGE_BUCKET=your-prod-project.appspot.com
PRODUCTION_FIREBASE_MESSAGING_SENDER_ID=your-prod-sender-id
PRODUCTION_FIREBASE_APP_ID=your-prod-app-id
"@

    Set-Content -Path ".env.template" -Value $envTemplate
    Print-Success "Environment template created (.env.template)"
    Print-Info "Copy .env.template to .env and fill in your Firebase credentials"
    Write-Host ""
}

# Build coordination system
Write-Host "Building coordination system..."
Push-Location coordination
try {
    npm run build
    Print-Success "Coordination system built successfully"
} catch {
    Print-Error "Failed to build coordination system"
    Pop-Location
    exit 1
}
Pop-Location
Write-Host ""

# Final instructions
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Print-Success "All dependencies installed successfully"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Configure your environment variables:"
if (-not $envFileExists) {
    Print-Info "Copy-Item .env.template .env"
    Print-Info "Edit .env with your Firebase credentials"
} else {
    Print-Info "Review and update your .env file if needed"
}
Write-Host ""
Write-Host "  2. Start the development environment:"
Print-Info "cd coordination; npm start"
Write-Host ""
Write-Host "  3. Or use individual commands:"
Print-Info "npm run coordination start    # Start both applications"
Print-Info "npm run coordination build    # Build both applications"
Print-Info "npm run coordination test     # Run all tests"
Print-Info "npm run coordination status   # Check system status"
Write-Host ""
