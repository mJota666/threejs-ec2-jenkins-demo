# Three.js EC2 Jenkins Demo

Static Three.js site built with Vite, then deployed to an EC2 instance running Nginx by Jenkins.

## Local Development

```bash
npm install
npm run dev
```

Build locally:

```bash
npm run build
npm run preview
```

## EC2 Setup

Use an Ubuntu EC2 instance. Open these inbound ports in the security group:

- `22` for SSH from your IP
- `80` for HTTP
- `443` later if you add SSL

Copy this repo to the EC2 instance once, then run:

```bash
chmod +x deploy/setup-ec2-nginx.sh
./deploy/setup-ec2-nginx.sh
```

The Nginx web root is:

```text
/var/www/threejs-demo
```

## Jenkins Setup

Install these Jenkins plugins:

- NodeJS Plugin, or install Node.js directly on the Jenkins machine
- SSH Agent Plugin

Create a Jenkins credential:

- Kind: SSH Username with private key
- ID: `ec2-ssh-key`
- Username: `ubuntu`
- Private key: your EC2 key

Create a Pipeline job pointing at this repository and use the included `Jenkinsfile`.

When you run the job, set:

```text
DEPLOY_HOST = your EC2 public IP or DNS
DEPLOY_USER = ubuntu
DEPLOY_PATH = /var/www/threejs-demo
```

## Deployment Flow

```text
Git push
-> Jenkins pipeline starts
-> npm ci
-> npm run lint
-> npm run build
-> rsync dist/ to EC2
-> reload Nginx
```

## SSL Later

After your domain points to EC2, install Certbot on EC2:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```
