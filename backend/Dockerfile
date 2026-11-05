# ============================================================
# QuickStay Backend – Multi-stage Dockerfile
# Stage 1: Build JAR bang Gradle wrapper (khong can cai Gradle tren host)
# Stage 2: Runtime image toi thieu voi JRE 17
# ============================================================

# ---------- Stage 1: Build ----------
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /workspace

# Copy Gradle wrapper va cac file cau hinh truoc de cache layer dependency
COPY gradlew gradlew.bat ./
COPY gradle ./gradle
COPY build.gradle settings.gradle ./

# Download dependency (cache layer nay chi bi invalidate khi build.gradle doi)
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon --quiet || true

# Copy source code va build JAR
COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# ---------- Stage 2: Runtime ----------
FROM eclipse-temurin:17-jre-alpine

# Tao user khong co quyen root de chay ung dung (best practice bao mat)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy JAR tu stage build
COPY --from=builder /workspace/build/libs/app.jar app.jar

# Doi sang user khong co quyen root
USER appuser

EXPOSE 8080

# Toi uu startup time voi Spring Boot layered JARs
ENTRYPOINT ["java", "-jar", "app.jar"]
