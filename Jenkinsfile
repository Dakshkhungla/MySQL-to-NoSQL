pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = 'dockerhub_id'          // Jenkins credentials ID for Docker Hub
        SONARQUBE_ENV = 'SonarQube'               
        FRONTEND_IMAGE = 'dakshkhungla/mysql_to_nosql_frontend'
        BACKEND_IMAGE  = 'dakshkhungla/mysql_to_nosql_backend'
        SONAR_PROJECT_KEY = 'mysql-to-nosql'        
        SONAR_URL = 'http://localhost:9000'             
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
                    // Save SonarQube scanner output to a file
                    bat 'sonar-scanner > sonar-report.txt'
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
                bat "trivy image ${env.FRONTEND_IMAGE}:${env.BUILD_NUMBER} > trivy-frontend.txt"
                bat "trivy image ${env.BACKEND_IMAGE}:${env.BUILD_NUMBER} > trivy-backend.txt"
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
    always {
        emailext (
            to: 'dakshahir481@gmail.com',
            subject: "Jenkins Build #${env.BUILD_NUMBER} Results",
            body: """Build Status: ${currentBuild.currentResult}

SonarQube Report: ${env.SONAR_URL}/dashboard?id=${env.SONAR_PROJECT_KEY}

See attached Trivy and SonarQube scan reports.

Build URL: ${env.BUILD_URL}
""",
            attachmentsPattern: 'trivy-*.txt,sonar-report.txt'
        )
    }
}

}
