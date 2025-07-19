pipeline {
    agent any

    environment {
        DOCKER_IMAGE_MQTT = 'mqtt-service:latest'
        DOCKER_IMAGE_FRONT = 'front-service:latest'
        CONTAINER_NAME_MQTT = 'mqtt-service'
        CONTAINER_NAME_FRONT = 'front-service'
        POSTGRES_USER = credentials('POSTGRES_USER')
        POSTGRES_PASSWORD = credentials('POSTGRES_PASSWORD')
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
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
                        sh 'chmod +x ./mvnw'
                        sh './mvnw clean package -DskipTests'
                        
                        // Verify JAR file exists
                        sh '''
                        if [ ! -f target/mqtt-service.jar ]; then
                            echo "mqtt-service.jar not found! Exiting..."
                            exit 1
                        fi
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
                    docker-compose down || true
                    docker-compose build --no-cache
                    docker-compose up -d
                    '''
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo 'Checking service health...'
                    sh '''
                    sleep 30
                    
                    # Check if containers are running
                    docker ps
                    
                    # Check MQTT service health
                    curl -f http://localhost:8084/actuator/health || echo "MQTT service health check failed"
                    
                    # Check Front service health
                    curl -f http://localhost:4000 || echo "Front service health check failed"
                    '''
                }
            }
        }
    }

    post {
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
        failure {
            echo 'Pipeline failed.'
            script {
                sh '''
                echo "=== Debug Information ==="
                docker-compose logs --tail=50
                '''
            }
        }
    }
}
