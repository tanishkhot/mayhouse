#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Progress bar function (tqdm-like)
show_progress() {
    local current=$1
    local total=$2
    local step_name=$3
    local width=50
    local filled=$((current * width / total))
    local empty=$((width - filled))
    
    printf "\r${BLUE}[${NC}"
    printf "%${filled}s" | tr ' ' '='
    printf "%${empty}s" | tr ' ' ' '
    printf "${BLUE}]${NC} ${GREEN}%3d%%${NC} - ${YELLOW}%s${NC}" $((current * 100 / total)) "$step_name"
    
    if [ $current -eq $total ]; then
        echo ""
    fi
}

# Function to check and kill process on a port
kill_port() {
    local port=$1
    local process=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$process" ]; then
        echo -e "${YELLOW}[WARN] Found process on port $port (PID: $process), killing...${NC}"
        kill -9 $process 2>/dev/null
        sleep 1
        # Verify it's killed
        if lsof -ti:$port >/dev/null 2>&1; then
            echo -e "${RED}[FAIL] Failed to kill process on port $port${NC}"
            return 1
        else
            echo -e "${GREEN}[OK] Port $port is now free${NC}"
            return 0
        fi
    else
        echo -e "${GREEN}[OK] Port $port is already free${NC}"
        return 0
    fi
}

# Function to test endpoint
test_endpoint() {
    local url=$1
    local name=$2
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}[OK] $name is responding${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo -e "${RED}[FAIL] $name is not responding after $max_attempts attempts${NC}"
    return 1
}

# Main script
echo -e "${BLUE}[START] Starting Mayhouse Development Environment${NC}"
echo -e "${BLUE}==============================================${NC}"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

total_steps=8
current_step=0

# Step 1: Check port 3000
current_step=$((current_step + 1))
show_progress $current_step $total_steps "Checking port 3000"
if kill_port 3000; then
    echo ""
else
    echo ""
    exit 1
fi

# Step 2: Check port 8000
current_step=$((current_step + 1))
show_progress $current_step $total_steps "Checking port 8000"
if kill_port 8000; then
    echo ""
else
    echo ""
    exit 1
fi

# Step 3: Start frontend
current_step=$((current_step + 1))
show_progress $current_step $total_steps "Starting frontend (npm run dev)"
echo ""
cd frontend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[WARN] node_modules not found, installing dependencies...${NC}"
    npm install
fi
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}[OK] Frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

# Step 4: Start backend
current_step=$((current_step + 1))
show_progress $current_step $total_steps "Starting backend (uv run main.py)"
echo ""
cd backend
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[WARN] Warning: .env file not found in backend directory${NC}"
fi
uv run main.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}[OK] Backend started (PID: $BACKEND_PID)${NC}"
echo ""

# Step 5: Wait 60 seconds
current_step=$((current_step + 1))
echo -e "${YELLOW}[WAIT] Waiting 60 seconds for services to initialize...${NC}"
for i in {1..60}; do
    show_progress $i 60 "Waiting for services to start"
    sleep 1
done
echo ""

# Step 6: Test frontend
current_step=$((current_step + 1))
show_progress $current_step $total_steps "Testing frontend (http://localhost:3000)"
echo ""
test_endpoint "http://localhost:3000" "Frontend"
echo ""

# Step 7: Test backend
current_step=$((current_step + 1))
show_progress $current_step $total_steps "Testing backend (http://localhost:8000)"
echo ""
test_endpoint "http://localhost:8000/health/" "Backend health endpoint"
if [ $? -eq 0 ]; then
    # Also test root endpoint
    echo -e "${BLUE}[INFO] Testing root endpoint...${NC}"
    curl -s http://localhost:8000/ | head -20
    echo ""
fi
echo ""

# Step 8: Final verification
current_step=$((current_step + 1))
show_progress $current_step $total_steps "Final verification"
echo ""

# Check if both services are running
FRONTEND_RUNNING=false
BACKEND_RUNNING=false

if lsof -ti:3000 > /dev/null 2>&1; then
    FRONTEND_RUNNING=true
fi

if lsof -ti:8000 > /dev/null 2>&1; then
    BACKEND_RUNNING=true
fi

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}[STATUS] Final Status${NC}"
echo -e "${BLUE}==============================================${NC}"

if [ "$FRONTEND_RUNNING" = true ]; then
    echo -e "${GREEN}[OK] Frontend: Running on http://localhost:3000${NC}"
    echo -e "   Logs: tail -f /tmp/frontend.log"
else
    echo -e "${RED}[FAIL] Frontend: Not running${NC}"
    echo -e "   Check logs: cat /tmp/frontend.log"
fi

if [ "$BACKEND_RUNNING" = true ]; then
    echo -e "${GREEN}[OK] Backend: Running on http://localhost:8000${NC}"
    echo -e "   Logs: tail -f /tmp/backend.log"
    echo -e "   API Docs: http://localhost:8000/docs"
else
    echo -e "${RED}[FAIL] Backend: Not running${NC}"
    echo -e "   Check logs: cat /tmp/backend.log"
fi

echo ""
echo -e "${BLUE}[TIP] Useful Commands:${NC}"
echo -e "   Stop frontend: kill $FRONTEND_PID"
echo -e "   Stop backend: kill $BACKEND_PID"
echo -e "   View frontend logs: tail -f /tmp/frontend.log"
echo -e "   View backend logs: tail -f /tmp/backend.log"
echo ""

if [ "$FRONTEND_RUNNING" = true ] && [ "$BACKEND_RUNNING" = true ]; then
    echo -e "${GREEN}[SUCCESS] All services are running successfully!${NC}"
    exit 0
else
    echo -e "${RED}[WARN] Some services failed to start. Check logs above.${NC}"
    exit 1
fi

