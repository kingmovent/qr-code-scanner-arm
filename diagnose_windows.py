#!/usr/bin/env python3
"""
Windows环境诊断脚本
检查Python依赖和Flask配置
"""

import sys
import os

print("=" * 60)
print("QR Code Scanner - Windows环境诊断")
print("=" * 60)
print()

# 1. Python版本
print("1. Python环境")
print(f"   版本: {sys.version}")
print(f"   可执行文件: {sys.executable}")
print()

# 2. 检查依赖
print("2. 检查Python依赖")
deps = {
    "flask": "Flask",
    "flask_cors": "Flask-CORS",
    "PIL": "Pillow",
    "pyzbar": "pyzbar",
    "numpy": "numpy",
    "mss": "mss (可选)",
}

for module, name in deps.items():
    try:
        mod = __import__(module)
        version = getattr(mod, "__version__", "unknown")
        print(f"   ✓ {name}: {version}")
    except ImportError as e:
        print(f"   ✗ {name}: 未安装 - {e}")
    except Exception as e:
        print(f"   ? {name}: 错误 - {e}")

print()

# 3. 检查ZBar（pyzbar依赖）
print("3. ZBar库检查")
try:
    from pyzbar import pyzbar

    print("   ✓ pyzbar模块可用")
    # 尝试解码空图像验证依赖链
    from PIL import Image

    test_img = Image.new("RGB", (10, 10))
    pyzbar.decode(test_img)
    print("   ✓ ZBar库加载正常")
except Exception as e:
    print(f"   ⚠ pyzbar可能有问题: {e}")
    print("   解决: pip uninstall pyzbar && pip install pyzbar")
print()

# 4. 检查文件结构
print("4. 项目文件检查")
base_dir = os.path.dirname(os.path.abspath(__file__))
required_files = [
    "app.py",
    "requirements.txt",
    "templates/index.html",
    "static/script.js",
    "static/style.css",
]

for f in required_files:
    path = os.path.join(base_dir, f)
    if os.path.exists(path):
        size = os.path.getsize(path)
        print(f"   ✓ {f} ({size} bytes)")
    else:
        print(f"   ✗ {f} 缺失!")
print()

# 5. 测试Flask应用
print("5. Flask应用导入测试")
try:
    from app import app

    print("   ✓ app.py 导入成功")
    print(f"   路由列表:")
    for rule in app.url_map.iter_rules():
        print(f"     - {rule.methods} {rule.rule}")
except Exception as e:
    print(f"   ✗ app.py 导入失败: {e}")
    import traceback

    traceback.print_exc()
print()

# 6. 上传目录
print("6. 上传目录检查")
upload_dir = os.path.join(base_dir, "static", "uploads")
if os.path.exists(upload_dir):
    print(f"   ✓ 上传目录存在: {upload_dir}")
else:
    print(f"   ⚠ 上传目录不存在，将在运行时创建")
print()

# 7. 可用端口检查
print("7. 端口检查（5000是否被占用）")
import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
result = sock.connect_ex(("localhost", 5000))
if result == 0:
    print("   ✗ 端口5000被占用")
    print("   解决: 关闭占用程序，或修改app.py使用其他端口")
else:
    print("   ✓ 端口5000可用")
sock.close()
print()

print("=" * 60)
print("诊断完成！")
print("=" * 60)
print()
print("下一步:")
print("1. 如果没有错误，启动服务:")
print("   python app.py")
print()
print("2. 浏览器访问:")
print("   http://localhost:5000")
print()
print("3. 打开F12控制台，查看是否有JS错误")
print()
print("如果依赖缺失，运行:")
print("   pip install -r requirements.txt")
print("=" * 60)

input("\n按Enter键退出...")
