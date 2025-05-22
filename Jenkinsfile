pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = 'dockerhub_id'          // Jenkins credentials ID for Docker Hub
        SONARQUBE_ENV = 'SonarQube'                     // Name of SonarQube server in Jenkins config
        FRONTEND_IMAGE = 'dakshkhungla/mysql_to_nosql_frontend'
        BACKEND_IMAGE  = 'dakshkhungla/mysql_to_nosql_backend'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv("${SONARQUBE_ENV}") {
                    bat 'sonar-scanner'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                bat 'docker compose build'
            }
        }

        stage('Trivy Scan') {
            steps {
                bat "trivy image ${env.FRONTEND_IMAGE}:${env.BUILD_NUMBER}"
                bat "trivy image ${env.BACKEND_IMAGE}:${env.BUILD_NUMBER}"
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDENTIALS}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    bat 'docker login -u %DOCKER_USER% -p %DOCKER_PASS%'
                    bat "docker push ${env.FRONTEND_IMAGE}:${env.BUILD_NUMBER}"
                    bat "docker push ${env.BACKEND_IMAGE}:${env.BUILD_NUMBER}"
                    bat 'docker logout'
                }
            }
        }
    }

    post {
        success {
            mail to: 'dakshahir481@gmail.com',
                 subject: "SUCCESS: Build #${env.BUILD_NUMBER} - ${env.JOB_NAME}",
                 body: """Good news! The build succeeded.

Project: ${env.JOB_NAME}
Build Number: ${env.BUILD_NUMBER}
Build URL: ${env.BUILD_URL}
"""
        }
        failure {
            mail to: 'dakshahir481@gmail.com',
                 subject: "FAILURE: Build #${env.BUILD_NUMBER} - ${env.JOB_NAME}",
                 body: """Oops! The build failed.

Project: ${env.JOB_NAME}
Build Number: ${env.BUILD_NUMBER}
Build URL: ${env.BUILD_URL}
"""
        }
        unstable {
            mail to: 'dakshahir481@gmail.com',
                 subject: "UNSTABLE: Build #${env.BUILD_NUMBER} - ${env.JOB_NAME}",
                 body: """Heads up! The build is unstable.

Project: ${env.JOB_NAME}
Build Number: ${env.BUILD_NUMBER}
Build URL: ${env.BUILD_URL}
"""
        }
    }
}
