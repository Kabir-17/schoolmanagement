#!/bin/bash

# ==============================================
# VPS SETUP SCRIPT FOR SCHOOL MANAGEMENT SYSTEM
# ==============================================
# Run this script on your VPS:
# chmod +x vps-setup.sh && sudo ./vps-setup.sh

set -e

echo "🚀 Starting VPS Setup for School Management System..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2

# Install Git
echo "📦 Installing Git..."
apt install -y git

# Install Nginx
echo "📦 Installing Nginx..."
apt install -y nginx

# Install MongoDB (optional - uncomment if you want local MongoDB)
# echo "📦 Installing MongoDB..."
# curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
# echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
# apt update
# apt install -y mongodb-org
# systemctl start mongod
# systemctl enable mongod

# Create project directory
echo "📁 Creating project directory..."
mkdir -p /var/www/sms
chown -R ubuntu:ubuntu /var/www/sms

# Setup firewall
echo "🔥 Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Setup PM2 to start on boot
echo "⚙️ Configuring PM2 startup..."
env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Copy Nginx config (you'll need to do this manually)
echo "📝 Nginx configuration template available at: /var/www/sms/scripts/nginx-config.conf"
echo "After cloning the repo, run:"
echo "  sudo cp /var/www/sms/scripts/nginx-config.conf /etc/nginx/sites-available/sms"
echo "  sudo ln -s /etc/nginx/sites-available/sms /etc/nginx/sites-enabled/"
echo "  sudo rm /etc/nginx/sites-enabled/default"
echo "  sudo nginx -t && sudo systemctl reload nginx"

echo ""
echo "=============================================="
echo "✅ VPS SETUP COMPLETE!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Clone your repository:"
echo "   cd /var/www/sms"
echo "   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git ."
echo ""
echo "2. Setup backend environment:"
echo "   cd backend"
echo "   cp .env.example .env"
echo "   nano .env  # Edit with your production values"
echo ""
echo "3. Configure Nginx:"
echo "   sudo cp scripts/nginx-config.conf /etc/nginx/sites-available/sms"
echo "   sudo ln -s /etc/nginx/sites-available/sms /etc/nginx/sites-enabled/"
echo "   sudo rm /etc/nginx/sites-enabled/default"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "4. First-time deployment (manual):"
echo "   cd /var/www/sms/backend"
echo "   npm ci"
echo "   npm run build"
echo "   pm2 start dist/server.js --name sms-backend"
echo ""
echo "   cd /var/www/sms/frontend"
echo "   npm ci"
echo "   npm run build"
echo "   pm2 serve build 3000 --name sms-frontend --spa"
echo ""
echo "   pm2 save"
echo ""
echo "5. Add GitHub Secrets to your repository:"
echo "   - VPS_HOST: 51.178.86.97"
echo "   - VPS_USERNAME: ubuntu"
echo "   - VPS_PASSWORD: your-password"
echo ""
echo "=============================================="
