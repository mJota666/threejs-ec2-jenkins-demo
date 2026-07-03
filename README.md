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

## Release v2 Demo Script

Use this scenario when you want to show that a code change needs a redeploy.

1. Open the public EC2 URL before deploying:

```text
http://YOUR_EC2_PUBLIC_IP
```

2. Tell the viewer the new release adds:

```text
Interactive orbit camera
WASD/arrow-key movement
Shift boost
Launch / Scan / Storm station modes
Animated satellites and scan wave
```

3. Commit and push the updated code:

```bash
git add index.html src/main.ts src/styles.css README.md
git commit -m "Add interactive Three.js command scene"
git push
```

4. In Jenkins, run the pipeline with:

```text
DEPLOY_HOST = YOUR_EC2_PUBLIC_IP
DEPLOY_USER = ubuntu
DEPLOY_PATH = /var/www/threejs-demo
```

5. After Jenkins finishes, refresh the public EC2 URL. The site should now show
`Orbital Command` with the interactive control panel.

Quick smoke test after deployment:

```text
Drag the scene to orbit
Press W/A/S/D or arrow keys to move
Hold Shift to boost
Click Scan and Storm to change the scene mode
```

## SSL Later

After your domain points to EC2, install Certbot on EC2:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```
