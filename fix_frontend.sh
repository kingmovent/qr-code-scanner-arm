#!/bin/bash

# 前端问题快速修复脚本
# 修复: 按钮无响应、页面卡死、粘贴功能失效

set -e

echo "===== 前端问题修复 ======"
echo ""

INSTALL_DIR="/opt/qr-scanner"

# 检查安装目录
if [ ! -d "$INSTALL_DIR" ]; then
    echo "错误: 未找到安装目录 $INSTALL_DIR"
    echo "请先运行安装脚本"
    exit 1
fi

cd $INSTALL_DIR

# 1. 备份现有文件
echo "[1/5] 备份现有文件..."
if [ ! -d "backup" ]; then
    mkdir -p backup
fi
cp static/script.js backup/script.js.backup 2>/dev/null || true
cp templates/index.html backup/index.html.backup 2>/dev/null || true
echo "   ✓ 备份完成"
echo ""

# 2. 复制修复后的文件
echo "[2/5] 复制修复后的前端文件..."
# 假设脚本运行在项目源码目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/static/script.js" ]; then
    cp "$SCRIPT_DIR/static/script.js" static/
    echo "   ✓ script.js 已更新"
else
    echo "   ⚠ 未找到修复后的 script.js"
fi

if [ -f "$SCRIPT_DIR/templates/index.html" ]; then
    cp "$SCRIPT_DIR/templates/index.html" templates/
    echo "   ✓ index.html 已更新"
else
    echo "   ⚠ 未找到修复后的 index.html"
fi

if [ -f "$SCRIPT_DIR/templates/debug.html" ]; then
    cp "$SCRIPT_DIR/templates/debug.html" templates/
    echo "   ✓ debug.html 已复制"
fi
echo ""

# 3. 设置权限
echo "[3/5] 设置文件权限..."
chmod 644 static/script.js static/style.css templates/*.html
echo "    ✓ 权限已设置"
echo ""

# 4. 重启服务
echo "[4/5] 重启Web服务..."
if [ -f "/etc/systemd/system/qr-scanner.service" ]; then
    sudo systemctl restart qr-scanner
    echo "    ✓ systemd服务已重启"
else
    echo "    ⚠ 未找到systemd服务，请手动重启"
fi
echo ""

# 5. 验证
echo "[5/5] 验证..."
sleep 2
if sudo systemctl is-active --quiet qr-scanner 2>/dev/null; then
    echo "    ✓ 服务运行正常"
else
    echo "    ⚠ 服务可能未启动，请检查: sudo systemctl status qr-scanner"
fi
echo ""

echo "========================================"
echo "✓ 前端修复完成！"
echo "========================================"
echo ""
echo "下一步:"
echo "1. 在浏览器中打开: http://localhost:5000"
echo "2. 按 Ctrl+F5 强制刷新"
echo "3. 打开F12控制台查看有无错误"
echo "4. 测试按钮功能"
echo ""
echo "如仍有问题，访问调试页面:"
echo "  http://localhost:5000/debug"
echo ""
echo "查看日志:"
echo "  sudo journalctl -u qr-scanner -f"
echo "========================================"
