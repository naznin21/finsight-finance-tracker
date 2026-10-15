# ---------------------------------------------------
# Stage 1: Build Frontend + Backend together
# (Vite outDir = ../backend/src/main/resources/static)
# ---------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy both projects so Vite can output to backend static folder
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Build frontend → outputs to /app/backend/src/main/resources/static
RUN cd frontend && npm run build

# ---------------------------------------------------
# Stage 2: Build Spring Boot (static files already present)
# ---------------------------------------------------
FROM maven:3.9.6-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /app/backend

COPY --from=frontend-builder /app/backend ./

RUN mvn clean package -DskipTests

# ---------------------------------------------------
# Stage 3: Lightweight Production Runtime
# ---------------------------------------------------
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=backend-builder /app/backend/target/*.jar app.jar

ENV PORT=8082
EXPOSE 8082

# Pass PORT so Spring Boot binds to Render's assigned port
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-Dserver.port=${PORT}", "-jar", "app.jar"]
