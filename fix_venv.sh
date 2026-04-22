#!/bin/bash

# Armbian 32位 修复脚本
# 用于修复虚拟环境中的模块导入问题

set -e

INSTALL_DIR="/opt/qr-scanner"

echo "===== 修复虚拟环境 ====="
echo ""

if [ ! -d "$INSTALL_DIR" ]; then
    echo "错误: 未找到安装目录 $INSTALL_DIR"
    exit 1
fi

cd $INSTALL_DIR

# 1. 删除旧的虚拟环境
echo "1. 删除旧的虚拟环境..."
rm -rf venv
echo "   ✓ 已删除"

# 2. 检查系统包
echo "2. 检查系统Python包..."
echo "   已安装的系统包:"
dpkg -l | grep -E "python3-flask|python3-pil|python3-pyzbar|python3-numpy" | awk '{print "   - "$2}' || true
echo ""

# 3. 创建新的虚拟环境（启用系统包访问）
echo "3. 创建新的虚拟环境（允许访问系统包）..."
python3 -m venv --system-site-packages venv
echo "   ✓ 虚拟环境已创建"
echo ""

# 4. 激活并测试
echo "4. 测试导入..."
source venv/bin/activate

# 测试各个模块
MODULES=("flask" "PIL" "pyzbar" "numpy")
for module in "${MODULES[@]}"; do
    if python -c "import $module" 2>/dev/null; then
        echo "   ✓ $module"
    else
        echo "   ✗ $module (缺失)"
    fi
done
echo ""

# 5. 检查Python路径
echo "5. Python路径检查:"
python -c "import sys; print('   sys.path:'); for p in sys.path: print('   ', p)" | head -10
echo ""

# 6. 验证flask位置
echo "6. Flask位置:"
python -c "import flask; print('   ', flask.__file__)" 2>/dev/null || echo "   Flask未找到"
echo ""

# 7. 创建一个简单的测试脚本
cat > test_app.py << 'EOF'
#!/usr/bin/env python3
import sys
print("Python:", sys.version)
print("")

modules = {
    'Flask': 'flask',
    'PIL': 'PIL',
    'pyzbar': 'pyzbar',
    'numpy': 'numpy'
}

for name, module in modules.items():
    try:
        __import__(module)
        print(f"✓ {name}")
    except ImportError as e:
        print(f"✗ {name}: {e}")

print("\n尝试导入app.py中的模块...")
try:
    from flask import Flask
    print("✓ Flask导入成功")
except Exception as e:
    print(f"✗ Flask导入失败: {e}")
EOF

echo "7. 运行测试脚本:"
python test_app.py
echo ""

# 8. 如果Flask仍不可用，强制使用系统Python
if ! python -c "import flask" 2>/dev/null; then
    echo "8. Flask仍不可用，创建系统Python启动脚本..."
    
    cat > start_system.sh << 'EOF'
#!/bin/bash
# 直接使用系统Python（不使用虚拟环境）
cd /opt/qr-scanner
exec python3 app.py
EOF
    chmod +x start_system.sh
    echo "   已创建 start_system.sh - 直接使用系统Python"
    echo "   建议: 使用 ./start_system.sh 启动"
else
    echo "8. ✓ Flask可用，虚拟环境工作正常"
fi

echo ""
echo "=========================================="
echo "修复完成！"
echo ""
echo "启动方式:"
echo "  方式1（虚拟环境）: cd /opt/qr-scanner && source venv/bin/activate && python app.py"
echo "  方式2（系统Python）: cd /opt/qr-scanner && ./start_system.sh"
echo ""
echo "如果仍有问题，请运行:"
echo "  ./check_arm32.sh"
echo "  或查看完整文档: ARM32_INSTALL.md"
echo "=========================================="
