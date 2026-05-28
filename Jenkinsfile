pipeline {
  agent any

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '20'))
    disableConcurrentBuilds()
  }

  environment {
    NAMESPACE = 'opspulse'
    API_IMAGE = 'opspulse-api:jenkins'
    FRONTEND_IMAGE = 'opspulse-frontend:jenkins'
  }

  stages {
    stage('Clone Repository') {
      steps {
        checkout scm
      }
    }

    stage('Build Spring Boot Services') {
      steps {
        echo 'This project uses Node.js services, so this stage installs, tests, audits, and builds the backend and frontend.'
        sh 'npm install --prefix backend'
        sh 'npm install --prefix frontend'
        sh 'npm test'
        sh 'npm audit --prefix backend --omit=dev'
        sh 'npm audit --prefix frontend --omit=dev'
        sh 'npm run build'
      }
    }

    stage('Docker Compose Test') {
      steps {
        sh 'docker compose up -d --build'
        sh 'sleep 20'
        sh 'curl --fail http://localhost:3000/healthz'
        sh 'curl --fail http://localhost:3000/readyz'
        sh 'curl --fail http://localhost:8080'
      }
      post {
        always {
          sh 'docker compose down '
        }
      }
    }

    stage('Start Minikube') {
      steps {
        sh 'minikube status || minikube start --driver=docker'
        sh 'kubectl config use-context minikube'
      }
    }

    stage('Build Images in Minikube') {
      steps {
        sh 'eval $(minikube docker-env) && docker build -t ${API_IMAGE} ./backend'
        sh 'eval $(minikube docker-env) && docker build -t ${FRONTEND_IMAGE} ./frontend'
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        sh 'kubectl apply -f k8s/namespace.yaml'
        sh 'kubectl apply -f k8s/postgres.yaml'
        sh 'kubectl apply -f k8s/api.yaml'
        sh 'kubectl apply -f k8s/frontend.yaml'
        sh 'kubectl apply -f k8s/prometheus.yaml'
        sh 'kubectl apply -f k8s/grafana.yaml'
        sh 'kubectl -n ${NAMESPACE} set image deployment/api api=${API_IMAGE}'
        sh 'kubectl -n ${NAMESPACE} set image deployment/frontend frontend=${FRONTEND_IMAGE}'
      }
    }

    stage('Verify Deployment') {
      steps {
        sh 'kubectl -n ${NAMESPACE} rollout status deployment/postgres --timeout=180s'
        sh 'kubectl -n ${NAMESPACE} rollout status deployment/api --timeout=180s'
        sh 'kubectl -n ${NAMESPACE} rollout status deployment/frontend --timeout=180s'
        sh 'kubectl -n ${NAMESPACE} get pods,svc'
      }
    }
  }

  post {
    always {
      sh 'kubectl -n ${NAMESPACE} get pods || true'
      deleteDir()
    }
  }
}

