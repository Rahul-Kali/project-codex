pipeline {
  agent any

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '20'))
    disableConcurrentBuilds()
  }

  parameters {
    string(name: 'REGISTRY', defaultValue: 'ghcr.io/YOUR_GITHUB_USERNAME', description: 'Container registry path, for example ghcr.io/your-user or docker.io/your-user.')
    string(name: 'IMAGE_NAMESPACE', defaultValue: 'project-codex', description: 'Image namespace or project name.')
  }

  environment {
    API_IMAGE = "${params.REGISTRY}/${params.IMAGE_NAMESPACE}/opspulse-api"
    FRONTEND_IMAGE = "${params.REGISTRY}/${params.IMAGE_NAMESPACE}/opspulse-frontend"
    IMAGE_TAG = "${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'npm install --prefix backend'
        sh 'npm install --prefix frontend'
      }
    }

    stage('Test') {
      steps {
        sh 'npm test'
      }
    }

    stage('Audit Production Dependencies') {
      steps {
        sh 'npm audit --prefix backend --omit=dev'
        sh 'npm audit --prefix frontend --omit=dev'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Build Docker Images') {
      steps {
        sh 'docker build -t ${API_IMAGE}:${IMAGE_TAG} -t ${API_IMAGE}:latest ./backend'
        sh 'docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ./frontend'
      }
    }

    stage('Push Docker Images') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-registry-credentials', usernameVariable: 'REGISTRY_USER', passwordVariable: 'REGISTRY_PASSWORD')]) {
          sh 'echo "$REGISTRY_PASSWORD" | docker login ${REGISTRY} -u "$REGISTRY_USER" --password-stdin'
          sh 'docker push ${API_IMAGE}:${IMAGE_TAG}'
          sh 'docker push ${API_IMAGE}:latest'
          sh 'docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}'
          sh 'docker push ${FRONTEND_IMAGE}:latest'
        }
      }
    }

    stage('Deploy To Kubernetes') {
      steps {
        withCredentials([
          file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG'),
          usernamePassword(credentialsId: 'docker-registry-credentials', usernameVariable: 'REGISTRY_USER', passwordVariable: 'REGISTRY_PASSWORD')
        ]) {
          sh 'kubectl apply -f k8s/namespace.yaml'
          sh 'kubectl -n opspulse create secret docker-registry registry-pull-secret --docker-server=${REGISTRY} --docker-username="$REGISTRY_USER" --docker-password="$REGISTRY_PASSWORD" --dry-run=client -o yaml | kubectl apply -f -'
          sh 'kubectl apply -f k8s/postgres.yaml'
          sh 'kubectl apply -f k8s/api.yaml'
          sh 'kubectl apply -f k8s/frontend.yaml'
          sh 'kubectl apply -f k8s/prometheus.yaml'
          sh 'kubectl apply -f k8s/grafana.yaml'
          sh 'kubectl -n opspulse set image deployment/api api=${API_IMAGE}:${IMAGE_TAG}'
          sh 'kubectl -n opspulse set image deployment/frontend frontend=${FRONTEND_IMAGE}:${IMAGE_TAG}'
          sh 'kubectl -n opspulse rollout status deployment/api --timeout=180s'
          sh 'kubectl -n opspulse rollout status deployment/frontend --timeout=180s'
        }
      }
    }
  }

  post {
    always {
      deleteDir()
    }
  }
}
