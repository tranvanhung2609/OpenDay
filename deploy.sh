#!/bin/bash

# Deploy script for SmailKit project
echo "🚀 Starting deployment of SmailKit..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create .env file from .env.example"
    exit 1
fi

# Load environment variables
source .env

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove old images
echo "🧹 Cleaning up old images..."
docker image prune -f

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check if containers are running
echo "📊 Container status:"
docker ps

# Health checks
echo "🔍 Health checks:"
if curl -f http://localhost:8084/actuator/health 2>/dev/null; then
    echo "✅ MQTT Service is healthy"
else
    echo "❌ MQTT Service health check failed"
fi

if curl -f http://localhost:4000 2>/dev/null; then
    echo "✅ Front Service is healthy"
else
    echo "❌ Front Service health check failed"
fi

echo "🎉 Deployment completed!"
echo "📋 Service URLs:"
echo "   MQTT Service: http://localhost:8084"
echo "   Front Service: http://localhost:4000"
echo "   PostgreSQL: localhost:5432" 