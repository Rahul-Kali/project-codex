pipeline {
  agent any

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '20'))
    disableConcurrentBuilds()
  }

  parameters {
    string(name: 'REGISTRY', defaultValue: 'ghcr.io/your-org', description: 'Container registry and owner or namespace.')
    string(name: 'IMAGE_NAMESPACE', defaultValue: 'opspulse', description: 'Image namespace or project name inside the registry.')
    booleanParam(name: 'DEPLOY_TO_K8S', defaultValue: false, description: 'Deploy Kubernetes manifests after image build and push.')
  }

  environment {
    REGISTRY = "${params.REGISTRY}"
    IMAGE_NAMESPACE = "${params.IMAGE_NAMESPACE}"
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

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Audit Production Dependencies') {
      steps {
        sh 'npm audit --prefix backend --omit=dev'
        sh 'npm audit --prefix frontend --omit=dev'
      }
    }

    stage('Build Docker Images') {
      when {
        anyOf {
          branch 'main'
          branch 'main'
        }
      }
      steps {
        sh 'docker build -t ${API_IMAGE}:${IMAGE_TAG} -t ${API_IMAGE}:latest ./backend'
        sh 'docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ./frontend'
      }
    }

    stage('Push Docker Images') {
      when {
        anyOf {
          branch 'main'
          branch 'main'
        }
      }
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
      when {
        allOf {
          anyOf {
            branch 'main'
            branch 'main'
          }
          expression { return params.DEPLOY_TO_K8S == true }
        }
      }
      steps {
        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
          sh 'kubectl apply -f k8s/namespace.yaml'
          sh 'kubectl apply -f k8s/postgres.yaml'
          sh 'kubectl apply -f k8s/api.yaml'
          sh 'kubectl apply -f k8s/frontend.yaml'
          sh 'kubectl apply -f k8s/prometheus.yaml'
          sh 'kubectl apply -f k8s/grafana.yaml'
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
