pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  parameters {
    string(name: 'DEPLOY_HOST', defaultValue: 'YOUR_EC2_PUBLIC_IP', description: 'EC2 public IP or DNS name')
    string(name: 'DEPLOY_USER', defaultValue: 'ubuntu', description: 'SSH user for the EC2 instance')
    string(name: 'DEPLOY_PATH', defaultValue: '/var/www/threejs-demo', description: 'Nginx web root on EC2')
  }

  environment {
    SSH_CREDENTIAL_ID = 'ec2-ssh-key'
  }

  stages {
    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Check') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Deploy') {
      when {
        expression { params.DEPLOY_HOST != 'YOUR_EC2_PUBLIC_IP' }
      }
      steps {
        sshagent(credentials: [env.SSH_CREDENTIAL_ID]) {
          sh '''
            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "sudo mkdir -p ${DEPLOY_PATH} && sudo chown -R ${DEPLOY_USER}:${DEPLOY_USER} ${DEPLOY_PATH}"
            rsync -az --delete -e "ssh -o StrictHostKeyChecking=no" dist/ ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/
            ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} "sudo nginx -t && sudo systemctl reload nginx"
          '''
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'dist/**', allowEmptyArchive: true
    }
  }
}
