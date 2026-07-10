pipeline {
    agent any

    parameters {
        string(
            name: 'AWS_REGION',
            defaultValue: 'ap-southeast-1',
            description: 'AWS Region, ví dụ ap-southeast-1'
        )

        string(
            name: 'AWS_ACCOUNT_ID',
            defaultValue: '992382372052',
            description: 'AWS Account ID gồm 12 chữ số'
        )

        string(
            name: 'ECR_REPOSITORY',
            defaultValue: 'threejs-demo',
            description: 'Tên ECR repository'
        )

        string(
            name: 'WEB_INSTANCE_ID',
            defaultValue: 'i-0d3ca84042a23d1c8',
            description: 'Instance ID của Web EC2'
        )

        string(
            name: 'VERIFY_URL',
            defaultValue: 'http://172.31.43.165',
            description: 'URL dùng để kiểm tra website sau deploy'
        )
    }

    triggers {
        githubPush()
    }

    options {
        timestamps()

        disableConcurrentBuilds()

        skipDefaultCheckout(true)

        buildDiscarder(
            logRotator(
                numToKeepStr: '10'
            )
        )

        timeout(
            time: 30,
            unit: 'MINUTES'
        )
    }

    environment {
        IMAGE_NAME = 'threejs-demo'

        CONTAINER_NAME = 'threejs-demo'

        TEST_CONTAINER = 'threejs-demo-test'

        TEST_PORT = '18080'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate Environment') {
            steps {
                script {
                    /*
                    * Jenkins cung cấp parameter qua đối tượng params.
                    * Ta kiểm tra rồi copy sang env để các lệnh shell bên dưới dùng được.
                    */

                    if (!params.AWS_REGION?.trim()) {
                        error('AWS_REGION chưa được khai báo.')
                    }

                    if (!params.AWS_ACCOUNT_ID?.trim()) {
                        error('AWS_ACCOUNT_ID chưa được khai báo.')
                    }

                    if (!params.ECR_REPOSITORY?.trim()) {
                        error('ECR_REPOSITORY chưa được khai báo.')
                    }

                    if (!params.WEB_INSTANCE_ID?.trim()) {
                        error('WEB_INSTANCE_ID chưa được khai báo.')
                    }

                    if (!params.VERIFY_URL?.trim()) {
                        error('VERIFY_URL chưa được khai báo.')
                    }

                    env.AWS_REGION = params.AWS_REGION.trim()
                    env.AWS_ACCOUNT_ID = params.AWS_ACCOUNT_ID.trim()
                    env.ECR_REPOSITORY = params.ECR_REPOSITORY.trim()
                    env.WEB_INSTANCE_ID = params.WEB_INSTANCE_ID.trim()
                    env.VERIFY_URL = params.VERIFY_URL.trim()
                }

                sh '''
                    set -eu

                    echo "Checking required tools..."

                    git --version
                    docker version
                    docker buildx version
                    aws --version
                    jq --version
                    curl --version

                    echo "Checking AWS identity..."

                    aws sts get-caller-identity

                    case "$AWS_ACCOUNT_ID" in
                        ''|*[!0-9]*)
                            echo "ERROR: AWS_ACCOUNT_ID phải gồm 12 chữ số."
                            exit 1
                            ;;
                    esac

                    if [ "${#AWS_ACCOUNT_ID}" -ne 12 ]; then
                        echo "ERROR: AWS_ACCOUNT_ID phải gồm đúng 12 chữ số."
                        exit 1
                    fi

                    case "$WEB_INSTANCE_ID" in
                        i-*)
                            ;;
                        *)
                            echo "ERROR: WEB_INSTANCE_ID không hợp lệ: $WEB_INSTANCE_ID"
                            exit 1
                            ;;
                    esac

                    echo "Checking that IAM account matches AWS_ACCOUNT_ID..."

                    ACTUAL_ACCOUNT_ID="$(
                        aws sts get-caller-identity \
                            --query Account \
                            --output text
                    )"

                    if [ "$ACTUAL_ACCOUNT_ID" != "$AWS_ACCOUNT_ID" ]; then
                        echo "ERROR: AWS Account ID không khớp."
                        echo "Configured: $AWS_ACCOUNT_ID"
                        echo "IAM role:   $ACTUAL_ACCOUNT_ID"
                        exit 1
                    fi

                    echo "Checking ECR repository..."

                    aws ecr describe-repositories \
                        --region "$AWS_REGION" \
                        --repository-names "$ECR_REPOSITORY" \
                        >/dev/null

                    echo "Environment validation passed."
                    echo "AWS region:      $AWS_REGION"
                    echo "AWS account:     $AWS_ACCOUNT_ID"
                    echo "ECR repository:  $ECR_REPOSITORY"
                    echo "Web instance:    $WEB_INSTANCE_ID"
                    echo "Verification URL: $VERIFY_URL"
                '''
            }
        }

        stage('Set Image Metadata') {
            steps {
                script {
                    env.SHORT_SHA = sh(
                        script: 'git rev-parse --short=12 HEAD',
                        returnStdout: true
                    ).trim()

                    env.ECR_REGISTRY =
                        "${env.AWS_ACCOUNT_ID}.dkr.ecr." +
                        "${env.AWS_REGION}.amazonaws.com"

                    env.IMAGE_URI =
                        "${env.ECR_REGISTRY}/" +
                        "${env.ECR_REPOSITORY}:" +
                        "${env.SHORT_SHA}"

                    env.LATEST_URI =
                        "${env.ECR_REGISTRY}/" +
                        "${env.ECR_REPOSITORY}:latest"
                }

                echo "Commit SHA: ${env.SHORT_SHA}"
                echo "ECR registry: ${env.ECR_REGISTRY}"
                echo "Image URI: ${env.IMAGE_URI}"
                echo "Latest URI: ${env.LATEST_URI}"
            }
        }

        stage('Build Container Image') {
            steps {
                sh '''
                    set -eu

                    docker build \
                        --pull \
                        --tag "$IMAGE_URI" \
                        --tag "$LATEST_URI" \
                        .
                '''
            }
        }

        stage('Run Test Container') {
            steps {
                sh '''
                    set -eu

                    docker rm \
                        --force \
                        "$TEST_CONTAINER" \
                        >/dev/null 2>&1 || true

                    docker run \
                        --detach \
                        --name "$TEST_CONTAINER" \
                        --publish "127.0.0.1:${TEST_PORT}:80" \
                        "$IMAGE_URI"

                    echo "Test container started."
                '''
            }
        }

        stage('Verify Test Container') {
            steps {
                sh '''
                    set -eu

                    for attempt in $(seq 1 30); do
                        if curl \
                            --fail \
                            --silent \
                            --show-error \
                            "http://127.0.0.1:${TEST_PORT}/" \
                            >/dev/null; then

                            echo "Container verification passed."
                            exit 0
                        fi

                        echo "Waiting for test container: ${attempt}/30"
                        sleep 2
                    done

                    echo "Test container did not become ready."

                    docker ps \
                        --all \
                        --filter "name=$TEST_CONTAINER"

                    docker logs "$TEST_CONTAINER" || true

                    exit 1
                '''
            }
        }

        stage('Push Image to ECR') {
            steps {
                sh '''
                    set -eu

                    echo "Logging in to ECR..."

                    aws ecr get-login-password \
                        --region "$AWS_REGION" |
                    docker login \
                        --username AWS \
                        --password-stdin \
                        "$ECR_REGISTRY"

                    echo "Pushing immutable image tag..."

                    docker push "$IMAGE_URI"

                    echo "Pushing latest tag..."

                    docker push "$LATEST_URI"

                    echo "Images pushed successfully."
                '''
            }
        }

        stage('Deploy to Web EC2') {
            steps {
                sh '''
                    set -eu

                    echo "Creating SSM command parameters..."

                    jq -n \
                        --arg region "$AWS_REGION" \
                        --arg registry "$ECR_REGISTRY" \
                        --arg image "$IMAGE_URI" \
                        --arg container "$CONTAINER_NAME" \
                        '{
                            commands: [
                                "set -Eeuo pipefail",

                                "echo Starting container deployment",

                                "systemctl disable --now nginx >/dev/null 2>&1 || true",

                                (
                                    "aws ecr get-login-password --region "
                                    + ($region | @sh)
                                    + " | docker login --username AWS --password-stdin "
                                    + ($registry | @sh)
                                ),

                                (
                                    "docker pull "
                                    + ($image | @sh)
                                ),

                                (
                                    "docker rm --force "
                                    + ($container | @sh)
                                    + " >/dev/null 2>&1 || true"
                                ),

                                (
                                    "docker run --detach"
                                    + " --name "
                                    + ($container | @sh)
                                    + " --restart unless-stopped"
                                    + " --publish 80:80 "
                                    + ($image | @sh)
                                ),

                                (
                                    "for attempt in $(seq 1 30); do "
                                    + "if docker exec "
                                    + ($container | @sh)
                                    + " wget -qO- http://127.0.0.1/ >/dev/null; "
                                    + "then echo Container health check passed; exit 0; "
                                    + "fi; "
                                    + "echo Waiting for container: $attempt/30; "
                                    + "sleep 2; "
                                    + "done; "
                                    + "docker logs "
                                    + ($container | @sh)
                                    + "; exit 1"
                                ),

                                "docker image prune --force",

                                "echo Container deployment completed"
                            ]
                        }' > ssm-parameters.json

                    echo "SSM parameters:"

                    jq . ssm-parameters.json

                    COMMAND_ID="$(
                        aws ssm send-command \
                            --region "$AWS_REGION" \
                            --instance-ids "$WEB_INSTANCE_ID" \
                            --document-name "AWS-RunShellScript" \
                            --comment "Deploy $IMAGE_URI" \
                            --parameters file://ssm-parameters.json \
                            --query 'Command.CommandId' \
                            --output text
                    )"

                    echo "SSM Command ID: $COMMAND_ID"

                    WAIT_RESULT=0

                    aws ssm wait command-executed \
                        --region "$AWS_REGION" \
                        --command-id "$COMMAND_ID" \
                        --instance-id "$WEB_INSTANCE_ID" \
                        || WAIT_RESULT=$?

                    echo "SSM command result:"

                    aws ssm get-command-invocation \
                        --region "$AWS_REGION" \
                        --command-id "$COMMAND_ID" \
                        --instance-id "$WEB_INSTANCE_ID" \
                        --query '{
                            Status: Status,
                            ResponseCode: ResponseCode,
                            StandardOutput: StandardOutputContent,
                            StandardError: StandardErrorContent
                        }' \
                        --output json

                    if [ "$WAIT_RESULT" -ne 0 ]; then
                        echo "Deployment through SSM failed."
                        exit 1
                    fi

                    STATUS="$(
                        aws ssm get-command-invocation \
                            --region "$AWS_REGION" \
                            --command-id "$COMMAND_ID" \
                            --instance-id "$WEB_INSTANCE_ID" \
                            --query 'Status' \
                            --output text
                    )"

                    if [ "$STATUS" != "Success" ]; then
                        echo "Unexpected SSM command status: $STATUS"
                        exit 1
                    fi

                    echo "SSM deployment completed successfully."
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -eu

                    if [ -z "${VERIFY_URL:-}" ]; then
                        echo "VERIFY_URL is empty. External verification skipped."
                        exit 0
                    fi

                    echo "Verifying deployment at: $VERIFY_URL"

                    for attempt in $(seq 1 30); do
                        if curl \
                            --fail \
                            --silent \
                            --show-error \
                            "$VERIFY_URL/" \
                            >/dev/null; then

                            echo "Deployment verification passed."
                            exit 0
                        fi

                        echo "Waiting for website: ${attempt}/30"
                        sleep 2
                    done

                    echo "Deployment verification failed."
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo "Deployment completed successfully."
            echo "Deployed image: ${env.IMAGE_URI}"
        }

        failure {
            echo "Pipeline failed. Check Console Output."
        }

        always {
            sh '''
                echo "Cleaning test container..."

                docker logs "$TEST_CONTAINER" \
                    2>/dev/null || true

                docker rm \
                    --force \
                    "$TEST_CONTAINER" \
                    >/dev/null 2>&1 || true

                if [ -n "${IMAGE_URI:-}" ]; then
                    echo "Removing local immutable image..."

                    docker image rm \
                        "$IMAGE_URI" \
                        >/dev/null 2>&1 || true
                fi

                if [ -n "${LATEST_URI:-}" ]; then
                    echo "Removing local latest image..."

                    docker image rm \
                        "$LATEST_URI" \
                        >/dev/null 2>&1 || true
                fi
            '''

            deleteDir()
        }
    }
}