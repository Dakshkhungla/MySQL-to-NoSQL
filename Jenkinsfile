pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = 'dockerhub_id'
        FRONTEND_IMAGE = 'dakshkhungla/mysql_to_nosql_frontend'
        BACKEND_IMAGE  = 'dakshkhungla/mysql_to_nosql_backend'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build All Services (Docker Compose)') {
            steps {
                bat 'docker compose build'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDENTIALS}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    bat 'docker login -u %DOCKER_USER% -p %DOCKER_PASS%'
                    bat 'docker push %FRONTEND_IMAGE%:%BUILD_NUMBER%'
                    bat 'docker push %BACKEND_IMAGE%:%BUILD_NUMBER%'
                    bat 'docker logout'
                }
            }
        }
    }
}
