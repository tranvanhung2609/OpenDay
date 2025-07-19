# Multi-stage build
FROM maven:3.8.4-openjdk-17 AS builder

WORKDIR /app

# Copy pom.xml and mvnw files
COPY pom.xml mvnw ./
COPY .mvn .mvn

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Production stage
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy JAR file from builder stage
COPY --from=builder /app/target/mqtt-service.jar app.jar

# Expose port
EXPOSE 8084

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
