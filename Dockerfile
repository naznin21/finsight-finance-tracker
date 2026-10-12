# ---------------------------------------------------
# Stage 1: Build React Frontend
# ---------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# ---------------------------------------------------
# Stage 2: Build Spring Boot Unified Executable
# ---------------------------------------------------
FROM maven:3.9.6-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/pom.xml ./
COPY backend/src ./src

# Incorporate compiled frontend static bundle into Spring Boot static classpath
COPY --from=frontend-builder /app/backend/src/main/resources/static ./src/main/resources/static

RUN mvn clean package -DskipTests

# ---------------------------------------------------
# Stage 3: High-Performance Production Runtime
# ---------------------------------------------------
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=backend-builder /app/backend/target/*.jar app.jar

ENV PORT=8082
EXPOSE 8082

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
