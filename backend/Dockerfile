# ---------- Etapa 1: compilación con Maven ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

# ---------- Etapa 2: imagen de ejecución mínima ----------
FROM eclipse-temurin:17-jre
WORKDIR /app
# Usuario sin privilegios (buena práctica de seguridad en contenedores)
RUN groupadd --system app && useradd --system --gid app --no-create-home app
COPY --from=build /app/target/mse-api.jar app.jar
USER app
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -Duser.timezone=America/Lima"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
