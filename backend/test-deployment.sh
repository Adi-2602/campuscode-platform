#!/bin/bash

# ========================================
# CampusCode Backend - Deployment Test Script
# ========================================
# This script tests all components of your deployment
# Run: bash test-deployment.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing CampusCode Deployment${NC}"
echo -e "${BLUE}========================================${NC}\n"

TESTS_PASSED=0
TESTS_FAILED=0

# Helper function
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((TESTS_FAILED++))
    fi
}

# ========================================
# Test 1: Docker Services
# ========================================
echo -e "${YELLOW}[Test 1] Checking Docker services...${NC}"

# Test backend container
docker ps | grep -q campuscode-backend
test_result $? "Backend container is running"

# Test Redis container
docker ps | grep -q campuscode-redis
test_result $? "Redis container is running"

echo ""

# ========================================
# Test 2: Redis Connection
# ========================================
echo -e "${YELLOW}[Test 2] Testing Redis...${NC}"

# Ping Redis
REDIS_PING=$(docker exec campuscode-redis redis-cli ping 2>&1)
if [ "$REDIS_PING" = "PONG" ]; then
    test_result 0 "Redis responds to PING"
else
    test_result 1 "Redis does not respond to PING"
fi

# Test Redis SET/GET
docker exec campuscode-redis redis-cli SET test_key "test_value" > /dev/null 2>&1
REDIS_GET=$(docker exec campuscode-redis redis-cli GET test_key 2>&1)
if [ "$REDIS_GET" = "test_value" ]; then
    test_result 0 "Redis SET/GET operations work"
    docker exec campuscode-redis redis-cli DEL test_key > /dev/null 2>&1
else
    test_result 1 "Redis SET/GET operations failed"
fi

# Check Redis memory
REDIS_MEMORY=$(docker exec campuscode-redis redis-cli INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
echo -e "${BLUE}ℹ️  Redis memory usage: $REDIS_MEMORY${NC}"

echo ""

# ========================================
# Test 3: Backend API
# ========================================
echo -e "${YELLOW}[Test 3] Testing Backend API...${NC}"

# Test root endpoint
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>&1 || echo "000")
if [ "$BACKEND_STATUS" = "200" ]; then
    test_result 0 "Backend root endpoint responds (HTTP 200)"
else
    test_result 1 "Backend root endpoint failed (HTTP $BACKEND_STATUS)"
fi

# Test /compiler/languages endpoint
LANGUAGES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/compiler/languages 2>&1 || echo "000")
if [ "$LANGUAGES_STATUS" = "200" ]; then
    test_result 0 "Compiler languages endpoint responds (HTTP 200)"
else
    test_result 1 "Compiler languages endpoint failed (HTTP $LANGUAGES_STATUS)"
fi

echo ""

# ========================================
# Test 4: MongoDB Connection
# ========================================
echo -e "${YELLOW}[Test 4] Testing MongoDB connection...${NC}"

# Check backend logs for MongoDB connection
if docker-compose logs backend | grep -q "MongoDB connected successfully"; then
    test_result 0 "MongoDB connected successfully"
else
    if docker-compose logs backend | grep -q "MongoServerError"; then
        test_result 1 "MongoDB connection error found in logs"
        echo -e "${RED}   Error details:${NC}"
        docker-compose logs backend | grep "MongoServerError" | tail -3
    else
        echo -e "${YELLOW}⚠️  Cannot verify MongoDB connection from logs${NC}"
    fi
fi

echo ""

# ========================================
# Test 5: Environment Configuration
# ========================================
echo -e "${YELLOW}[Test 5] Checking environment configuration...${NC}"

# Check Redis host
REDIS_HOST=$(docker exec campuscode-backend printenv REDIS_HOST 2>&1)
if [ "$REDIS_HOST" = "redis" ]; then
    test_result 0 "REDIS_HOST is correctly set to 'redis'"
else
    test_result 1 "REDIS_HOST is not set correctly (found: $REDIS_HOST)"
fi

# Check NODE_ENV
NODE_ENV=$(docker exec campuscode-backend printenv NODE_ENV 2>&1)
if [ "$NODE_ENV" = "production" ]; then
    test_result 0 "NODE_ENV is set to 'production'"
else
    echo -e "${YELLOW}⚠️  NODE_ENV is '$NODE_ENV' (not 'production')${NC}"
fi

# Check if JWT_SECRET is set
JWT_SECRET=$(docker exec campuscode-backend printenv JWT_SECRET 2>&1)
if [ ! -z "$JWT_SECRET" ]; then
    test_result 0 "JWT_SECRET is set"
else
    test_result 1 "JWT_SECRET is not set"
fi

echo ""

# ========================================
# Test 6: Container Health
# ========================================
echo -e "${YELLOW}[Test 6] Checking container health...${NC}"

# Check backend health
BACKEND_HEALTH=$(docker inspect campuscode-backend --format='{{.State.Health.Status}}' 2>&1)
if [ "$BACKEND_HEALTH" = "healthy" ]; then
    test_result 0 "Backend container is healthy"
elif [ "$BACKEND_HEALTH" = "starting" ]; then
    echo -e "${YELLOW}⚠️  Backend container is still starting...${NC}"
else
    test_result 1 "Backend container health check failed (Status: $BACKEND_HEALTH)"
fi

# Check Redis health
REDIS_HEALTH=$(docker inspect campuscode-redis --format='{{.State.Health.Status}}' 2>&1)
if [ "$REDIS_HEALTH" = "healthy" ]; then
    test_result 0 "Redis container is healthy"
else
    test_result 1 "Redis container health check failed (Status: $REDIS_HEALTH)"
fi

echo ""

# ========================================
# Test 7: Logs for Errors
# ========================================
echo -e "${YELLOW}[Test 7] Checking logs for errors...${NC}"

# Check backend logs for errors
ERROR_COUNT=$(docker-compose logs backend | grep -i "error" | grep -v "errorHandler" | wc -l)
if [ "$ERROR_COUNT" -eq 0 ]; then
    test_result 0 "No errors found in backend logs"
else
    echo -e "${YELLOW}⚠️  Found $ERROR_COUNT error messages in logs${NC}"
    echo -e "${BLUE}   Recent errors:${NC}"
    docker-compose logs backend | grep -i "error" | grep -v "errorHandler" | tail -5
fi

echo ""

# ========================================
# Test 8: Network Connectivity
# ========================================
echo -e "${YELLOW}[Test 8] Testing network connectivity...${NC}"

# Test backend can reach Redis
PING_REDIS=$(docker exec campuscode-backend ping -c 1 redis 2>&1)
if echo "$PING_REDIS" | grep -q "1 packets transmitted, 1 received"; then
    test_result 0 "Backend can ping Redis container"
else
    test_result 1 "Backend cannot ping Redis container"
fi

echo ""

# ========================================
# Test 9: Auto-Save API (Mock Test)
# ========================================
echo -e "${YELLOW}[Test 9] Testing Auto-Save API structure...${NC}"

# Check if auto-save endpoint exists (without auth)
AUTOSAVE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/student/exams/test/questions/test/autosave 2>&1 || echo "000")
if [ "$AUTOSAVE_STATUS" = "401" ] || [ "$AUTOSAVE_STATUS" = "403" ]; then
    test_result 0 "Auto-save endpoint exists (returns auth error as expected)"
else
    echo -e "${YELLOW}⚠️  Auto-save endpoint returned HTTP $AUTOSAVE_STATUS (expected 401/403)${NC}"
fi

# Check if recover endpoint exists
RECOVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/student/exams/test/questions/test/recover 2>&1 || echo "000")
if [ "$RECOVER_STATUS" = "401" ] || [ "$RECOVER_STATUS" = "403" ]; then
    test_result 0 "Recover endpoint exists (returns auth error as expected)"
else
    echo -e "${YELLOW}⚠️  Recover endpoint returned HTTP $RECOVER_STATUS (expected 401/403)${NC}"
fi

echo ""

# ========================================
# Test 10: Resource Usage
# ========================================
echo -e "${YELLOW}[Test 10] Checking resource usage...${NC}"

# Get container stats
echo -e "${BLUE}ℹ️  Container resource usage:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep campuscode

echo ""

# ========================================
# Summary
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Your deployment is working correctly.${NC}\n"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Please check the output above.${NC}\n"
    echo -e "${YELLOW}Useful debugging commands:${NC}"
    echo -e "  View backend logs:  ${BLUE}docker-compose logs backend${NC}"
    echo -e "  View Redis logs:    ${BLUE}docker-compose logs redis${NC}"
    echo -e "  Check containers:   ${BLUE}docker-compose ps${NC}"
    echo -e "  Restart services:   ${BLUE}docker-compose restart${NC}\n"
    exit 1
fi