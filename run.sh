#!/bin/bash

# 本地直接运行脚本（无Docker，无systemd）

set -e

echo "二维码识别器 - 本地运行模式"

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 python3，请先安装 Python 3.7+"
    exit 1
fi

# 检查ZBar
if ! command -v zbarimg &> /dev/null; then
    echo "警告: 未找到 zbarimg 工具"
    echo "请安装: sudo apt-get install zbar-tools"
fi

# 创建虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

# 安装依赖
echo "安装Python依赖..."
pip install --upgrade pip
pip install --no-cache-dir -r requirements.txt

# 确保上传目录存在
mkdir -p static/uploads

echo ""
echo "=========================================="
echo "启动服务..."
echo "访问: http://0.0.0.0:5000"
echo "按 Ctrl+C 停止"
echo "=========================================="
echo ""

python app.py
