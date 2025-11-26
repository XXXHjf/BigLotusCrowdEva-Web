# 部署指南 - Linux 服务器部署

本文档说明如何将 BigLotusCrowdEva 项目部署到 Linux 服务器。

## 📋 前置要求

- Linux 服务器（Ubuntu/CentOS/Debian 等）
- Node.js >= 18.0.0（用于构建）
- Nginx 或其他 Web 服务器（用于服务静态文件）
- 服务器有公网 IP 或域名

## 🚀 部署步骤

### 方法一：本地构建后上传（推荐）

#### 1. 本地构建生产版本

```bash
# 在本地项目目录执行
npm install
npm run build
```

构建完成后，会在项目根目录生成 `dist` 文件夹，包含所有静态文件。

#### 2. 上传文件到服务器

使用 `scp` 或 `rsync` 将 `dist` 目录上传到服务器：

```bash
# 使用 scp
scp -r dist/ user@your-server-ip:/var/www/biglotuscrowdeva/

# 或使用 rsync（推荐，支持断点续传）
rsync -avz --progress dist/ user@your-server-ip:/var/www/biglotuscrowdeva/
```

#### 3. 在服务器上配置 Nginx

SSH 登录到服务器后，创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/biglotuscrowdeva
```

配置内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或IP

    root /var/www/biglotuscrowdeva;
    index index.html;

    # 启用 gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # SPA 路由支持 - 所有路由都返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

启用站点：

```bash
sudo ln -s /etc/nginx/sites-available/biglotuscrowdeva /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl reload nginx  # 重新加载配置
```

#### 4. 配置 HTTPS（可选但推荐）

使用 Let's Encrypt 免费 SSL 证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 方法二：在服务器上直接构建

#### 1. 在服务器上安装 Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

#### 2. 上传项目代码

```bash
# 在本地执行
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
  ./ user@your-server-ip:/opt/biglotuscrowdeva/
```

#### 3. 在服务器上构建

```bash
# SSH 登录服务器
ssh user@your-server-ip

# 进入项目目录
cd /opt/biglotuscrowdeva

# 安装依赖
npm install --production=false

# 构建
npm run build

# 复制构建文件到 web 目录
sudo mkdir -p /var/www/biglotuscrowdeva
sudo cp -r dist/* /var/www/biglotuscrowdeva/
sudo chown -R www-data:www-data /var/www/biglotuscrowdeva
```

#### 4. 配置 Nginx（同上）

## 🔧 服务器配置

### 创建部署脚本

创建 `deploy.sh` 脚本简化部署流程：

```bash
#!/bin/bash
# deploy.sh

echo "开始构建..."
npm run build

echo "上传文件到服务器..."
rsync -avz --delete --progress dist/ user@your-server-ip:/var/www/biglotuscrowdeva/

echo "重新加载 Nginx..."
ssh user@your-server-ip "sudo systemctl reload nginx"

echo "部署完成！"
```

使用：

```bash
chmod +x deploy.sh
./deploy.sh
```

### 环境变量配置

如果需要在生产环境配置不同的 API 地址，创建 `.env.production` 文件：

```bash
VITE_API_BASE_URL=https://your-api-domain.com/api
```

然后构建：

```bash
npm run build
```

## 📦 PM2 部署（如果需要 Node.js 服务）

如果后续需要 Node.js 后端服务，可以使用 PM2 管理：

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start npm --name "biglotuscrowdeva" -- start

# 设置开机自启
pm2 startup
pm2 save
```

## 🔍 验证部署

部署完成后，访问：

- HTTP: `http://your-server-ip` 或 `http://your-domain.com`
- HTTPS: `https://your-domain.com`（如果配置了 SSL）

## 🛠️ 常见问题

### 1. 路由 404 错误

确保 Nginx 配置中有 `try_files $uri $uri/ /index.html;`，这是 SPA 应用必需的。

### 2. 静态资源加载失败

检查文件路径和权限：

```bash
sudo ls -la /var/www/biglotuscrowdeva
sudo chown -R www-data:www-data /var/www/biglotuscrowdeva
```

### 3. API 请求跨域问题

如果前端和后端不在同一域名，需要在 Nginx 配置 CORS 或使用反向代理。

### 4. 构建文件过大

如果构建后的文件过大，可以考虑：

```bash
# 启用代码分割
# 在 vite.config.ts 中配置
```

## 📝 快速部署命令总结

```bash
# 1. 本地构建
npm run build

# 2. 上传到服务器
rsync -avz --delete dist/ user@server:/var/www/biglotuscrowdeva/

# 3. 重新加载 Nginx
ssh user@server "sudo systemctl reload nginx"
```

## 🔐 安全建议

1. **使用 HTTPS**：配置 SSL 证书
2. **防火墙**：只开放必要端口（80, 443）
3. **定期更新**：保持系统和软件更新
4. **备份**：定期备份配置文件

---

**部署完成后，访问你的服务器 IP 或域名即可查看应用！**
