
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle

RUN chmod +x gradlew \
    && sed -i 's/\r$//' gradlew

RUN ./gradlew --no-daemon dependencies

COPY src src

RUN ./gradlew --no-daemon bootJar -x test

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
