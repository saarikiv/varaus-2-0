#!/bin/bash

# Varaus Full-Stack Coordination System Setup Script
# This script automates the setup of the development environment

set -e  # Exit on error

echo "=== Varaus Full-Stack Coordination System Setup ==="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo "  $1"
}

# Check Node.js version
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    echo ""
    echo "Please install Node.js 20.x LTS from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js version 20.x or higher is required (found: $(node -v))"
    echo ""
    echo "Please upgrade Node.js to version 20.x LTS"
    exit 1
fi

print_success "Node.js version $(node -v) detected"
echo ""

# Check npm
echo "Checking npm..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

print_success "npm version $(npm -v) detected"
echo ""

# Install coordination system dependencies
echo "Installing coordination system dependencies..."
if [ -d "coordination" ]; then
    cd coordination
    npm install
    if [ $? -eq 0 ]; then
        print_success "Coordination system dependencies installed"
    else
        print_error "Failed to install coordination system dependencies"
        exit 1
    fi
    cd ..
else
    print_error "coordination directory not found"
    exit 1
fi
echo ""

# Install backend dependencies
echo "Installing backend (varausserver) dependencies..."
if [ -d "varausserver" ]; then
    cd varausserver
    npm install
    if [ $? -eq 0 ]; then
        print_success "Backend dependencies installed"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    cd ..
else
    print_error "varausserver directory not found"
    exit 1
fi
echo ""

# Install frontend dependencies
echo "Installing frontend (varaus) dependencies..."
if [ -d "varaus" ]; then
    cd varaus
    npm install --legacy-peer-deps
    if [ $? -eq 0 ]; then
        print_success "Frontend dependencies installed"
    else
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    cd ..
else
    print_error "varaus directory not found"
    exit 1
fi
echo ""

# Check for environment configuration
echo "Checking environment configuration..."
ENV_FILE_EXISTS=false

if [ -f ".env" ]; then
    ENV_FILE_EXISTS=true
    print_success "Environment file (.env) found"
else
    print_warning "No .env file found"
fi
echo ""

# Create environment template if needed
if [ "$ENV_FILE_EXISTS" = false ]; then
    echo "Creating environment configuration template..."
    
    cat > .env.template << 'EOF'
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
EOF

    print_success "Environment template created (.env.template)"
    print_info "Copy .env.template to .env and fill in your Firebase credentials"
    echo ""
fi

# Build coordination system
echo "Building coordination system..."
cd coordination
npm run build
if [ $? -eq 0 ]; then
    print_success "Coordination system built successfully"
else
    print_error "Failed to build coordination system"
    exit 1
fi
cd ..
echo ""

# Final instructions
echo "=== Setup Complete ==="
echo ""
print_success "All dependencies installed successfully"
echo ""
echo "Next steps:"
echo "  1. Configure your environment variables:"
if [ "$ENV_FILE_EXISTS" = false ]; then
    print_info "cp .env.template .env"
    print_info "Edit .env with your Firebase credentials"
else
    print_info "Review and update your .env file if needed"
fi
echo ""
echo "  2. Start the development environment:"
print_info "cd coordination && npm start"
echo ""
echo "  3. Or use individual commands:"
print_info "npm run coordination start    # Start both applications"
print_info "npm run coordination build    # Build both applications"
print_info "npm run coordination test     # Run all tests"
print_info "npm run coordination status   # Check system status"
echo ""
