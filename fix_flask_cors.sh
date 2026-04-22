#!/bin/bash

# 快速修复脚本 - 解决 "ModuleNotFoundError: No module named 'flask_cors'"
# 适用于已在 /opt/qr-scanner 安装但缺少依赖的情况

set -e

INSTALL_DIR="/opt/qr-scanner"

echo "===== 修复 Flask-CORS 依赖 ====="
echo ""

if [ ! -d "$INSTALL_DIR" ]; then
    echo "错误: 未找到安装目录 $INSTALL_DIR"
    exit 1
fi

cd $INSTALL_DIR

# 1. 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv --system-site-packages venv
fi

# 2. 激活并安装Flask-CORS
echo "安装 Flask-CORS..."
# 使用虚拟环境的绝对路径pip，避免系统pip冲突
source venv/bin/activate

# 验证确实在虚拟环境中
VIRTUAL_ENV_CHECK=$(which python)
if [[ "$VIRTUAL_ENV_CHECK" != *"venv"* ]]; then
    echo "警告: 未激活虚拟环境，尝试手动设置..."
    # 手动设置路径
    export VIRTUAL_ENV="$INSTALL_DIR/venv"
    export PATH="$VIRTUAL_ENV/bin:$PATH"
fi

echo "Python路径: $(which python)"
echo "Pip路径: $(which pip)"

# 升级pip
pip install --upgrade pip -q

# 安装Flask-CORS到虚拟环境
echo "正在安装 Flask-CORS 到虚拟环境..."
pip install --no-cache-dir "Flask-CORS>=3.0.0" -q

# 3. 验证
echo ""
echo "验证安装..."
python -c "from flask_cors import CORS; print('✓ Flask-CORS 导入成功')" 2>/dev/null || {
    echo "✗ Flask-CORS 仍不可用"
    echo "尝试使用 --break-system-packages 强制安装（不推荐）..."
    pip install --break-system-packages "Flask-CORS>=3.0.0" -q 2>/dev/null || true
}

# 4. 测试所有依赖
echo ""
echo "测试所有模块..."
python -c "
import sys
mods = ['flask', 'flask_cors', 'PIL', 'pyzbar', 'numpy']
for m in mods:
    try:
        __import__(m)
        print(f'✓ {m}')
    except Exception as e:
        print(f'✗ {m}: {e}')
        sys.exit(1)
print('')
print('所有模块正常！')
"

# 5. 重启服务（如果存在）
if [ -f "/etc/systemd/system/qr-scanner.service" ]; then
    echo ""
    echo "重启系统服务..."
    sudo systemctl restart qr-scanner
    echo "服务已重启"
fi

echo ""
echo "=========================================="
echo "✓ 修复完成！"
echo "=========================================="
echo "启动服务: cd $INSTALL_DIR && ./start.sh"
echo "或: sudo systemctl start qr-scanner"
echo "=========================================="
