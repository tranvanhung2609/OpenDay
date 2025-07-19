# SmailKit - IoT Platform

Hệ thống IoT platform với MQTT service và React frontend.

## 🏗️ Kiến trúc hệ thống

- **MQTT Service**: Spring Boot service xử lý MQTT messages và quản lý thiết bị
- **Front Service**: React application giao diện người dùng
- **PostgreSQL**: Database lưu trữ dữ liệu

## 🚀 Deploy lên VPS

### Yêu cầu hệ thống

- Docker và Docker Compose
- Git
- Jenkins (nếu sử dụng CI/CD)

### Cách 1: Deploy thủ công

1. **Clone repository**

```bash
git clone <repository-url>
cd SmailKit
```

2. **Tạo file .env**

```bash
cp .env.example .env
# Chỉnh sửa các giá trị trong file .env
```

3. **Chạy script deploy**

```bash
chmod +x deploy.sh
./deploy.sh
```

### Cách 2: Sử dụng Docker Compose trực tiếp

```bash
# Build và start tất cả services
docker-compose up -d --build

# Xem logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Cách 3: Sử dụng Jenkins CI/CD

1. **Cấu hình Jenkins credentials**:

   - `POSTGRES_USER`: Username cho PostgreSQL
   - `POSTGRES_PASSWORD`: Password cho PostgreSQL

2. **Tạo Jenkins pipeline job**:
   - Sử dụng Jenkinsfile trong root directory
   - Pipeline sẽ tự động build và deploy

## 📋 Cấu hình biến môi trường

Tạo file `.env` với các biến sau:

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password123
POSTGRES_DB=small_kit

# Service Ports
MQTT_SERVICE_PORT=8084
FRONT_SERVICE_PORT=4000
POSTGRES_PORT=5432
```

## 🔧 Các lệnh hữu ích

```bash
# Xem status containers
docker ps

# Xem logs của service cụ thể
docker-compose logs mqtt-service
docker-compose logs front-service
docker-compose logs postgres

# Restart service
docker-compose restart mqtt-service

# Update và redeploy
git pull
docker-compose up -d --build

# Backup database
docker exec postgres pg_dump -U postgres small_kit > backup.sql

# Restore database
docker exec -i postgres psql -U postgres small_kit < backup.sql
```

## 🌐 Truy cập services

- **Frontend**: http://localhost:4000
- **MQTT Service API**: http://localhost:8084
- **PostgreSQL**: localhost:5432

## 🐛 Troubleshooting

### MQTT Service không start

```bash
# Kiểm tra logs
docker-compose logs mqtt-service

# Kiểm tra database connection
docker exec postgres psql -U postgres -d small_kit -c "SELECT 1;"
```

### Front Service không load

```bash
# Kiểm tra build
docker-compose logs front-service

# Rebuild front service
docker-compose build front-service
docker-compose up -d front-service
```

### Database connection issues

```bash
# Kiểm tra PostgreSQL
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

## 📝 Monitoring

```bash
# Xem resource usage
docker stats

# Xem disk usage
docker system df

# Cleanup unused resources
docker system prune -f
```

## 🔒 Security

- Thay đổi default passwords trong production
- Sử dụng HTTPS cho frontend
- Cấu hình firewall cho VPS
- Backup database thường xuyên
