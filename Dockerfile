FROM eclipse-temurin:25-jdk
ADD target/helpdesk.jar /helpdesk.jar
ENTRYPOINT ["java", "-jar", "/helpdesk.jar"]