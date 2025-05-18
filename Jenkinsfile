pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = 'dockerhub_id'
        IMAGE_NAME = 'dakshkhungla/mysql_to_nosql'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build with Docker Compose') {
            steps {
                // Build all images defined in docker-compose.yml
                sh 'docker compose build'
            }
        }

        stage('Tag Docker Image') {
            steps {
                // Tag the image built by docker-compose (adjust service name if needed)
                sh "docker tag mysql_to_nosql:latest ${IMAGE_NAME}:${BUILD_NUMBER}"
            }
        }

        stage('Login to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDENTIALS}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh "docker push ${IMAGE_NAME}:${BUILD_NUMBER}"
            }
        }
    }

    post {
        always {
            sh 'docker logout'
        }
    }
}
