pipeline {
    agent any

    environment {
        DOCKER_IMAGE_MQTT = 'mqtt-service:latest'
        DOCKER_IMAGE_FRONT = 'front-service:latest'
        CONTAINER_NAME_MQTT = 'mqtt-service'
        CONTAINER_NAME_FRONT = 'front-service'
        POSTGRES_USER = credentials('POSTGRES_USER')
        POSTGRES_PASSWORD = credentials('POSTGRES_PASSWORD')
        POSTGRES_DB = credentials('POSTGRES_DB')
        POSTGRES_URL = credentials('POSTGRES_URL')
        MQTT_BROKER_URL = credentials('MQTT_BROKER_URL')
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Validate Configuration') {
            steps {
                script {
                    echo 'Validating project configuration...'
                    sh '''
                    echo "=== Checking required files ==="
                    
                    # Check if docker-compose.yml exists
                    if [ ! -f docker-compose.yml ]; then
                        echo "ERROR: docker-compose.yml not found!"
                        exit 1
                    fi
                    echo "✅ docker-compose.yml found"
                    
                    # Check if mqtt-service directory exists
                    if [ ! -d mqtt-service ]; then
                        echo "ERROR: mqtt-service directory not found!"
                        exit 1
                    fi
                    echo "✅ mqtt-service directory found"
                    
                    # Check if front-service directory exists
                    if [ ! -d front-service ]; then
                        echo "ERROR: front-service directory not found!"
                        exit 1
                    fi
                    echo "✅ front-service directory found"
                    
                    # Check if pom.xml exists in mqtt-service
                    if [ ! -f mqtt-service/pom.xml ]; then
                        echo "ERROR: mqtt-service/pom.xml not found!"
                        exit 1
                    fi
                    echo "✅ mqtt-service/pom.xml found"
                    
                    # Check if package.json exists in front-service
                    if [ ! -f front-service/package.json ]; then
                        echo "ERROR: front-service/package.json not found!"
                        exit 1
                    fi
                    echo "✅ front-service/package.json found"
                    
                    echo "=== Configuration validation passed ==="
                    '''
                }
            }
        }

        stage('Clean Old Containers') {
            steps {
                script {
                    echo 'Stopping and removing old containers...'
                    sh '''
                        docker-compose down || true
                        docker container prune -f || true
                        docker image prune -f || true
                    '''
                }
            }
        }

        stage('Build MQTT Service') {
            steps {
                script {
                    echo 'Building MQTT service...'
                    dir('mqtt-service') {
                        sh '''
                        echo "=== Building MQTT Service ==="
                        
                        # Make mvnw executable
                        chmod +x ./mvnw
                        
                        # Clean and package
                        echo "Running Maven clean and package..."
                        ./mvnw clean package -DskipTests
                        
                        # Verify JAR file exists
                        if [ ! -f target/mqtt-service.jar ]; then
                            echo "❌ mqtt-service.jar not found! Build failed."
                            echo "Checking target directory contents:"
                            ls -la target/ || echo "Target directory not found"
                            exit 1
                        fi
                        
                        echo "✅ MQTT service built successfully"
                        echo "JAR file size: $(du -h target/mqtt-service.jar | cut -f1)"
                        '''
                    }
                }
            }
        }

        stage('Build and Deploy with Docker') {
            steps {
                script {
                    echo 'Building and deploying Docker containers...'
                    sh '''
                    echo "=== Building and Deploying Docker Containers ==="
                    
                    # Stop existing containers
                    echo "Stopping existing containers..."
                    docker-compose down || true
                    
                    # Build images
                    echo "Building Docker images..."
                    docker-compose build --no-cache
                    
                    # Check if build was successful
                    if [ $? -ne 0 ]; then
                        echo "❌ Docker build failed!"
                        exit 1
                    fi
                    
                    # Start containers
                    echo "Starting containers..."
                    docker-compose up -d
                    
                    # Check if containers started successfully
                    if [ $? -ne 0 ]; then
                        echo "❌ Failed to start containers!"
                        exit 1
                    fi
                    
                    echo "✅ Docker containers started successfully"
                    echo "Container status:"
                    docker-compose ps
                    '''
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo 'Checking service health...'
                    sh '''
                    echo "Waiting for services to start..."
                    sleep 30
                    
                    echo "=== Container Status ==="
                    docker ps
                    
                    echo "=== Checking MQTT Service ==="
                    # Check if MQTT service is running
                    if docker ps | grep -q mqtt-service; then
                        echo "MQTT service container is running"
                        # Check health endpoint
                        curl -f http://localhost:8084/mqtt/actuator/health || echo "MQTT service health check failed"
                    else
                        echo "MQTT service container is not running"
                        exit 1
                    fi
                    
                    echo "=== Checking Front Service ==="
                    # Check if Front service is running
                    if docker ps | grep -q front-service; then
                        echo "Front service container is running"
                        # Check if frontend is responding
                        curl -f http://localhost:4000 || echo "Front service health check failed"
                    else
                        echo "Front service container is not running"
                        exit 1
                    fi
                    
                    echo "=== Checking Database ==="
                    # Check if PostgreSQL is running
                    if docker ps | grep -q postgres; then
                        echo "PostgreSQL container is running"
                    else
                        echo "PostgreSQL container is not running"
                        exit 1
                    fi
                    
                    echo "=== All services are healthy ==="
                    '''
                }
            }
        }
    }

    post {
        failure {
            echo 'Pipeline failed.'
            script {
                sh '''
                echo "=== Debug Information ==="
                echo "Container status:"
                docker ps -a
                echo "=== Recent logs ==="
                docker logs mqtt-service --tail=20 || echo "MQTT service logs not available"
                docker logs front-service --tail=20 || echo "Front service logs not available"
                docker logs postgres --tail=10 || echo "PostgreSQL logs not available"
                echo "=== System resources ==="
                docker system df
                '''
            }
        }
        always {
            echo 'Cleaning up workspace and Docker resources...'
            sh 'docker system prune -f'
            cleanWs()
        }
        success {
            echo 'Pipeline executed successfully!'
            script {
                sh '''
                echo "=== Deployment Summary ==="
                echo "MQTT Service: http://localhost:8084"
                echo "Front Service: http://localhost:4000"
                echo "PostgreSQL: localhost:5432"
                docker ps
                '''
            }
        }
    }
}
