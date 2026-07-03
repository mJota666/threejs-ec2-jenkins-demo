pipeline {
    agent any

    tools {
        // Tên này phải trùng với:
        // Manage Jenkins → Tools → NodeJS installations
        nodejs 'nodejs'
    }

    parameters {
        string(
            name: 'DEPLOY_HOST',
            defaultValue: '172.31.35.125',
            description: 'Private IP của Web EC2'
        )

        string(
            name: 'DEPLOY_USER',
            defaultValue: 'ubuntu',
            description: 'SSH username của Web EC2'
        )

        string(
            name: 'DEPLOY_PATH',
            defaultValue: '/var/www/threejs-demo',
            description: 'Thư mục website trên Web EC2'
        )
    }

    triggers {
        githubPush()
    }

    options {
        timestamps()
        disableConcurrentBuilds()

        buildDiscarder(
            logRotator(
                numToKeepStr: '10'
            )
        )
    }

    environment {
        NODE_OPTIONS = '--max-old-space-size=1536'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    node --version
                    npm --version
                    npm ci
                '''
            }
        }

        stage('Lint') {
            steps {
                // Không báo lỗi nếu project chưa có script lint
                sh 'npm run lint --if-present'
            }
        }

        stage('Build') {
            steps {
                sh '''
                    npm run build

                    test -d dist
                    test -f dist/index.html

                    echo "Build output:"
                    find dist -maxdepth 2 -type f
                '''
            }
        }

        stage('Deploy to Web EC2') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    sh '''
                        set -e

                        mkdir -p "$HOME/.ssh"
                        chmod 700 "$HOME/.ssh"

                        ssh-keygen -R "$DEPLOY_HOST" 2>/dev/null || true
                        ssh-keyscan -T 10 -H "$DEPLOY_HOST" \
                            >> "$HOME/.ssh/known_hosts"

                        chmod 600 "$HOME/.ssh/known_hosts"

                        ssh "$DEPLOY_USER@$DEPLOY_HOST" \
                            "mkdir -p '$DEPLOY_PATH'"

                        rsync -az --delete \
                            dist/ \
                            "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/"
                    '''
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    echo "Checking deployed website..."
                    curl --fail --silent --show-error \
                        "http://$DEPLOY_HOST/" > /dev/null

                    echo "Deployment verified successfully."
                '''
            }
        }
    }

    post {
        success {
            echo 'Build and deployment completed successfully.'
        }

        failure {
            echo 'Build or deployment failed. Check Console Output.'
        }

        always {
            deleteDir()
        }
    }
}