#!/bin/bash

# ========================================
# CampusCode Backend - Docker Quick Deploy
# ========================================
# This script automates the deployment process
# Run: bash deploy.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CampusCode Backend Deployment${NC}"
echo -e "${BLUE}========================================${NC}\n"

# ========================================
# Step 1: Check Prerequisites
# ========================================
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo -e "${YELLOW}Please install Docker first:${NC}"
    echo "sudo apt update && sudo apt install -y docker.io"
    exit 1
fi
echo -e "${GREEN}✅ Docker found: $(docker --version)${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo -e "${YELLOW}Please install Docker Compose first${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose found: $(docker-compose --version)${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo -e "${YELLOW}Please create .env file with required variables${NC}"
    exit 1
fi
echo -e "${GREEN}✅ .env file found${NC}"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ docker-compose.yml found${NC}\n"

# ========================================
# Step 2: Stop Existing Containers
# ========================================
echo -e "${YELLOW}[2/6] Stopping existing containers...${NC}"
if docker-compose ps | grep -q "Up"; then
    docker-compose down
    echo -e "${GREEN}✅ Existing containers stopped${NC}\n"
else
    echo -e "${BLUE}ℹ️  No running containers found${NC}\n"
fi

# ========================================
# Step 3: Build Docker Images
# ========================================
echo -e "${YELLOW}[3/6] Building Docker images...${NC}"
docker-compose build --no-cache
echo -e "${GREEN}✅ Docker images built successfully${NC}\n"

# ========================================
# Step 4: Start Services
# ========================================
echo -e "${YELLOW}[4/6] Starting services...${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Services started${NC}\n"

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready (30 seconds)...${NC}"
sleep 30

# ========================================
# Step 5: Verify Services
# ========================================
echo -e "${YELLOW}[5/6] Verifying services...${NC}"

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Containers are running${NC}"
    docker-compose ps
else
    echo -e "${RED}❌ Some containers failed to start${NC}"
    docker-compose logs
    exit 1
fi

# Test Redis
echo -e "\n${YELLOW}Testing Redis connection...${NC}"
if docker exec campuscode-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is responding${NC}"
else
    echo -e "${RED}❌ Redis is not responding${NC}"
    docker-compose logs redis
    exit 1
fi

# Test Backend
echo -e "\n${YELLOW}Testing Backend API...${NC}"
sleep 5  # Give backend more time to start
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "000")
if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Backend is responding (HTTP $BACKEND_RESPONSE)${NC}"
else
    echo -e "${RED}❌ Backend is not responding (HTTP $BACKEND_RESPONSE)${NC}"
    echo -e "${YELLOW}Checking logs:${NC}"
    docker-compose logs backend | tail -20
fi

# ========================================
# Step 6: Display Summary
# ========================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}📊 Service Status:${NC}"
docker-compose ps

echo -e "\n${YELLOW}🔗 Access URLs:${NC}"
echo -e "Backend API:     ${GREEN}http://localhost:3000${NC}"
echo -e "Redis UI:        ${GREEN}http://localhost:8081${NC}"

echo -e "\n${YELLOW}📝 Useful Commands:${NC}"
echo -e "View logs:       ${BLUE}docker-compose logs -f${NC}"
echo -e "Stop services:   ${BLUE}docker-compose down${NC}"
echo -e "Restart:         ${BLUE}docker-compose restart${NC}"
echo -e "Redis CLI:       ${BLUE}docker exec -it campuscode-redis redis-cli${NC}"

echo -e "\n${YELLOW}📚 Documentation:${NC}"
echo -e "Full guide:      ${BLUE}DOCKER_DEPLOYMENT_GUIDE.md${NC}"
echo -e "Auto-save docs:  ${BLUE}CODE_DRAFT_AUTOSAVE_DOCUMENTATION.md${NC}"

echo -e "\n${GREEN}✅ Your backend is ready for testing!${NC}\n"

# Optional: Show recent logs
echo -e "${YELLOW}Recent logs (last 20 lines):${NC}"
docker-compose logs --tail=20

echo -e "\n${BLUE}========================================${NC}\n"