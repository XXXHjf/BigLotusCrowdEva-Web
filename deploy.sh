#!/bin/bash

# BigLotusCrowdEva 部署脚本
# 使用方法: ./deploy.sh [服务器用户] [服务器IP] [部署路径]

set -e  # 遇到错误立即退出

# 配置（可以通过参数覆盖）
SERVER_USER=${1:-"root"}
SERVER_IP=${2:-"your-server-ip"}
DEPLOY_PATH=${3:-"/var/www/biglotuscrowdeva"}

echo "=========================================="
echo "开始部署 BigLotusCrowdEva"
echo "=========================================="

# 1. 检查 Node.js 和 npm
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "错误: 未找到 npm，请先安装 npm"
    exit 1
fi

echo "✓ Node.js 版本: $(node -v)"
echo "✓ npm 版本: $(npm -v)"

# 2. 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    npm install
fi

# 3. 构建项目
echo ""
echo "开始构建项目..."
npm run build

if [ ! -d "dist" ]; then
    echo "错误: 构建失败，未找到 dist 目录"
    exit 1
fi

echo "✓ 构建完成"

# 4. 检查服务器连接
echo ""
echo "检查服务器连接..."
if ! ssh -o ConnectTimeout=5 "${SERVER_USER}@${SERVER_IP}" "echo '连接成功'" &> /dev/null; then
    echo "错误: 无法连接到服务器 ${SERVER_USER}@${SERVER_IP}"
    echo "请确保:"
    echo "  1. 服务器IP地址正确"
    echo "  2. SSH密钥已配置或使用密码认证"
    echo "  3. 服务器防火墙允许SSH连接"
    exit 1
fi

echo "✓ 服务器连接正常"

# 5. 创建部署目录
echo ""
echo "在服务器上创建部署目录..."
ssh "${SERVER_USER}@${SERVER_IP}" "mkdir -p ${DEPLOY_PATH}"

# 6. 上传文件
echo ""
echo "上传文件到服务器..."
rsync -avz --delete --progress \
  --exclude '*.map' \
  dist/ \
  "${SERVER_USER}@${SERVER_IP}:${DEPLOY_PATH}/"

echo "✓ 文件上传完成"

# 7. 设置权限
echo ""
echo "设置文件权限..."
ssh "${SERVER_USER}@${SERVER_IP}" "chown -R www-data:www-data ${DEPLOY_PATH} || chown -R nginx:nginx ${DEPLOY_PATH} || true"

# 8. 重新加载 Nginx（如果存在）
echo ""
echo "重新加载 Nginx..."
ssh "${SERVER_USER}@${SERVER_IP}" "sudo systemctl reload nginx 2>/dev/null || echo 'Nginx 未安装或未配置'"

echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo "访问地址: http://${SERVER_IP}"
echo "部署路径: ${DEPLOY_PATH}"
echo ""

