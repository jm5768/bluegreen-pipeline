pipeline {
  agent any
  environment {
    DOCKERHUB_CREDS = credentials('dockerhub-creds')
    IMAGE_NAME = "jm8240/bluegreen-app"
    KUBECONFIG = "/var/lib/jenkins/.kube/config"
    SERVICE_NAME = "myapp-svc"
    NAMESPACE = "default"
  }

  stages {
    stage('Checkout') {
      steps { 
        checkout scm 
      }
    }

    stage('Build Docker Image') {
      steps {
        sh """
          docker build --pull --cache-from ${IMAGE_NAME}:latest \
          -t ${IMAGE_NAME}:latest -t ${IMAGE_NAME}:${BUILD_NUMBER} .
        """
      }
    }

    stage('Push to Docker Hub') {
      steps {
        sh """
          echo "${DOCKERHUB_CREDS_PSW}" | docker login -u "${DOCKERHUB_CREDS_USR}" --password-stdin
          docker push ${IMAGE_NAME}:${BUILD_NUMBER}
          docker push ${IMAGE_NAME}:latest
        """
      }
    }

    stage('Determine Active Color') {
      steps {
        script {
          def cur = sh(
            returnStdout: true, 
            script: "kubectl --kubeconfig=${KUBECONFIG} get svc ${SERVICE_NAME} -o jsonpath='{.spec.selector.color}' || echo none"
          ).trim()
          
          env.ACTIVE_COLOR = (cur == 'blue') ? 'blue' : (cur == 'green' ? 'green' : 'none')
          env.NEXT_COLOR = (env.ACTIVE_COLOR == 'blue') ? 'green' : 'blue'
          echo "Active: ${ACTIVE_COLOR}, Next: ${NEXT_COLOR}"
        }
      }
    }

    stage('Deploy Next Color') {
      steps {
        sh """
          kubectl --kubeconfig=${KUBECONFIG} apply -f k8s/deployment-${NEXT_COLOR}.yaml
          kubectl --kubeconfig=${KUBECONFIG} rollout status deployment/myapp-${NEXT_COLOR} --timeout=120s
        """
      }
    }

    stage('Switch Service to New Color') {
      steps {
        sh """
          kubectl --kubeconfig=${KUBECONFIG} patch svc ${SERVICE_NAME} --type=merge \
          -p '{"spec":{"selector":{"app":"myapp","color":"${NEXT_COLOR}"}}}'
        """
      }
    }

    stage('Delete Old Deployment') {
      steps {
        sh """
          if [ "${ACTIVE_COLOR}" != "none" ]; then
            kubectl --kubeconfig=${KUBECONFIG} delete deployment myapp-${ACTIVE_COLOR} || true
          fi
        """
      }
    }

    stage('Verify') {
      steps {
        sh "kubectl --kubeconfig=${KUBECONFIG} get pods,svc,deploy -o wide"
      }
    }
  }
}
