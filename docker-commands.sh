#!/bin/bash

# Discord Habit System - Docker Management Commands
# Convenient commands for managing the Docker container

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "🐳 Discord Habit System - Docker Commands"
    echo "=========================================="
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     - Start the container"
    echo "  stop      - Stop the container"
    echo "  restart   - Restart the container"
    echo "  logs      - Show container logs"
    echo "  logs-f    - Follow container logs (live)"
    echo "  status    - Show container status"
    echo "  build     - Build the Docker image"
    echo "  deploy    - Deploy with latest changes"
    echo "  update    - Pull changes and deploy"
    echo "  shell     - Open shell in container"
    echo "  clean     - Clean up containers and images"
    echo "  help      - Show this help message"
    echo ""
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running! Please start Docker first."
        exit 1
    fi
}

# Start container
start_container() {
    print_status "Starting Discord Habit System container..."
    docker-compose up -d
    print_success "Container started"
    show_status
}

# Stop container
stop_container() {
    print_status "Stopping Discord Habit System container..."
    docker-compose down
    print_success "Container stopped"
}

# Restart container
restart_container() {
    print_status "Restarting Discord Habit System container..."
    docker-compose restart
    print_success "Container restarted"
    show_status
}

# Show logs
show_logs() {
    print_status "Showing container logs..."
    docker logs discord-habit-system --tail 50
}

# Follow logs
follow_logs() {
    print_status "Following container logs (Ctrl+C to exit)..."
    docker logs -f discord-habit-system
}

# Show status
show_status() {
    print_status "Container status:"
    echo "=================="
    docker ps -f name=discord-habit-system --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    
    if docker ps -q -f name=discord-habit-system | grep -q .; then
        print_success "Container is running"
        
        # Show recent logs
        print_status "Recent logs (last 10 lines):"
        echo "----------------------------------------"
        docker logs discord-habit-system --tail 10
        echo "----------------------------------------"
    else
        print_warning "Container is not running"
    fi
}

# Build image
build_image() {
    print_status "Building Docker image..."
    docker build -t discord-habit-system:latest .
    print_success "Image built successfully"
}

# Deploy
deploy() {
    print_status "Deploying with latest changes..."
    ./deploy.sh
}

# Update and deploy
update_deploy() {
    print_status "Updating and deploying..."
    ./update-and-deploy.sh
}

# Open shell in container
open_shell() {
    if docker ps -q -f name=discord-habit-system | grep -q .; then
        print_status "Opening shell in container..."
        docker exec -it discord-habit-system /bin/sh
    else
        print_error "Container is not running"
    fi
}

# Clean up
clean_up() {
    print_warning "This will remove all containers and images. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_status "Cleaning up..."
        docker-compose down --volumes --remove-orphans
        docker system prune -f
        print_success "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Main script logic
case "${1:-help}" in
    start)
        check_docker
        start_container
        ;;
    stop)
        check_docker
        stop_container
        ;;
    restart)
        check_docker
        restart_container
        ;;
    logs)
        check_docker
        show_logs
        ;;
    logs-f)
        check_docker
        follow_logs
        ;;
    status)
        check_docker
        show_status
        ;;
    build)
        check_docker
        build_image
        ;;
    deploy)
        check_docker
        deploy
        ;;
    update)
        check_docker
        update_deploy
        ;;
    shell)
        check_docker
        open_shell
        ;;
    clean)
        check_docker
        clean_up
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac
