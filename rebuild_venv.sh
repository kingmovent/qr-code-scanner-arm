#!/bin/bash

# 完全重建虚拟环境（解决依赖冲突）
# 使用系统包 + 虚拟环境补充模式

set -e

INSTALL_DIR="/opt/qr-scanner"

echo "===== 重建虚拟环境 ====="
echo ""

cd $INSTALL_DIR

# 1. 删除旧虚拟环境
if [ -d "venv" ]; then
    echo "1. 删除旧虚拟环境..."
    rm -rf venv
    echo "   ✓ 已删除"
fi

# 2. 检查系统包
echo "2. 检查系统Python包..."
echo "   必需系统包:"
for pkg in python3-flask python3-pil python3-pyzbar python3-numpy; do
    if dpkg -l | grep -q "^ii  $pkg"; then
        echo "   ✓ $pkg"
    else
        echo "   ✗ $pkg (缺失)"
        echo "      请先安装: sudo apt-get install -y $pkg"
        exit 1
    fi
done
echo ""

# 3. 创建虚拟环境（允许访问系统包）
echo "3. 创建虚拟环境（--system-site-packages）..."
python3 -m venv --system-site-packages venv
echo "   ✓ 虚拟环境已创建"
echo ""

# 4. 激活并安装额外依赖
echo "4. 安装虚拟环境专属包..."
source venv/bin/activate

# 验证虚拟环境激活
if [[ "$VIRTUAL_ENV" != *"venv"* ]]; then
    echo "警告: 虚拟环境未正确激活，手动设置..."
    export VIRTUAL_ENV="$INSTALL_DIR/venv"
    export PATH="$VIRTUAL_ENV/bin:$PATH"
fi

echo "   Python路径: $(which python)"
echo "   Pip路径: $(which pip)"
echo ""

# 5. 升级pip（虚拟环境内）
echo "5. 升级pip..."
pip install --upgrade pip setuptools wheel -q

# 6. 从requirements-venv.txt安装
echo "6. 安装requirements-venv.txt..."
if [ -f "requirements-venv.txt" ]; then
    pip install --no-cache-dir -r requirements-venv.txt -q
else
    echo "   未找到requirements-venv.txt，安装默认包..."
    pip install --no-cache-dir "Flask-CORS>=3.0.0" -q
fi

# 7. 验证所有模块
echo "7. 验证模块导入..."
python -c "
import sys
print('Python:', sys.version)
print('虚拟环境:', sys.prefix)
print()

modules = {
    'flask': 'Flask',
    'flask_cors': 'Flask-CORS',
    'PIL': 'Pillow',
    'pyzbar': 'pyzbar',
    'numpy': 'numpy'
}

all_ok = True
for module, name in modules.items():
    try:
        __import__(module)
        print(f'✓ {name} ({module})')
    except Exception as e:
        print(f'✗ {name} ({module}): {e}')
        all_ok = False

if not all_ok:
    print('\n错误: 部分模块缺失！')
    sys.exit(1)

print('\n✓ 所有模块正常！')
"

# 8. 更新启动脚本
echo "8. 更新启动脚本..."
cat > start.sh << 'EOF'
#!/bin/bash
cd /opt/qr-scanner
source venv/bin/activate
exec python3 app.py
EOF
chmod +x start.sh
echo "   ✓ start.sh 已更新"
echo ""

# 9. 重启服务
if [ -f "/etc/systemd/system/qr-scanner.service" ]; then
    echo "9. 重启系统服务..."
    sudo systemctl restart qr-scanner 2>/dev/null || true
    sleep 2
    sudo systemctl status qr-scanner --no-pager -l 2>/dev/null || true
fi

echo ""
echo "=========================================="
echo "✓ 虚拟环境重建完成！"
echo "=========================================="
echo "启动方式:"
echo "  cd /opt/qr-scanner && ./start.sh"
echo "或:"
echo "  cd /opt/qr-scanner && source venv/bin/activate && python app.py"
echo ""
echo "查看日志:"
echo "  sudo journalctl -u qr-scanner -f"
echo "=========================================="
