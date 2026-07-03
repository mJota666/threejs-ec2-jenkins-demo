#!/usr/bin/env bash
set -euo pipefail

SITE_PATH="/var/www/threejs-demo"
CONFIG_NAME="threejs-demo"

sudo apt-get update
sudo apt-get install -y nginx rsync

sudo mkdir -p "${SITE_PATH}"
sudo chown -R "${USER}:${USER}" "${SITE_PATH}"

sudo cp "deploy/nginx-threejs-demo.conf" "/etc/nginx/sites-available/${CONFIG_NAME}"
sudo ln -sf "/etc/nginx/sites-available/${CONFIG_NAME}" "/etc/nginx/sites-enabled/${CONFIG_NAME}"
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx
