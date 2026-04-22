#!/usr/bin/env python3
"""
Windows浏览器卡死问题诊断
"""

import subprocess
import sys

print("=" * 60)
print("浏览器卡死诊断工具")
print("=" * 60)
print()

# 1. 检查JavaScript语法
print("1. 检查JavaScript语法")
import os

js_file = r"D:\python_project\qr_code_scanner_arm\static\script.js"

if os.path.exists(js_file):
    print(f"   文件: {js_file}")
    print("   检查常见问题...")

    with open(js_file, "r", encoding="utf-8") as f:
        content = f.read()

    # 检查括号匹配
    opens = content.count("{")
    closes = content.count("}")
    print(f"   {{ 计数: {opens} 个开括号, {closes} 个闭括号", end="")
    if opens == closes:
        print(" ✓ 匹配")
    else:
        print(f" ✗ 不匹配 (差 {abs(opens - closes)} 个)")

    # 检查常见危险模式
    issues = []
    if "while(true)" in content or "for(;;)" in content:
        issues.append("发现无限循环")
    if content.count("function") != content.count("}"):  # 粗略检查
        issues.append("函数定义可能不完整")
    if ".addEventListener" in content and content.count("addEventListener") > 50:
        issues.append("事件监听器数量过多")

    if issues:
        print("   发现问题:")
        for issue in issues:
            print(f"   - {issue}")
    else:
        print("   未发现明显语法问题")
else:
    print("   ✗ 文件不存在")
print()

# 2. 建议的安全测试流程
print("2. 推荐的测试步骤")
print()
print("   第1步: 使用超简化测试页面（绝对不会卡死）")
print("   在浏览器访问: http://localhost:5000/minimal")
print()
print("   第2步: 如果简化版正常，再测试完整版")
print("   http://localhost:5000")
print()
print("   第3步: 使用调试页面检查")
print("   http://localhost:5000/debug")
print()

# 3. 创建minimal路由（如果还没有）
print("3. 检查Flask路由")
try:
    sys.path.insert(0, r"D:\python_project\qr_code_scanner_arm")
    from app import app

    print("   已注册的路由:")
    for rule in app.url_map.iter_rules():
        methods = ",".join(rule.methods)
        print(f"   {methods:20} {rule.rule}")

    # 检查是否有minimal路由
    has_minimal = any(rule.rule == "/minimal" for rule in app.url_map.iter_rules())
    if not has_minimal:
        print()
        print("   ⚠ 缺少 /minimal 路由")
        print("   需要在app.py中添加:")
        print("   @app.route('/minimal')")
        print("   def minimal(): return send_file('templates/minimal_test.html')")

except Exception as e:
    print(f"   ✗ 无法导入app.py: {e}")
print()

# 4. Windows特定问题
print("4. Windows常见问题清单")
print()
print("   问题A: 剪贴板API在IE/Edge旧版有Bug")
print("   解决: 使用最新版Chrome/Firefox")
print()
print("   问题B: 某些杀毒软件注入脚本导致循环")
print("   解决: 暂时禁用杀软测试")
print()
print("   问题C: 浏览器扩展冲突")
print("   解决: 无痕模式测试 (Ctrl+Shift+N)")
print()

# 5. 立即建议
print("=" * 60)
print("👉 立即操作:")
print()
print("   1. 停止当前Flask (Ctrl+C)")
print("   2. 确认已更新 static/script.js 为最新版本")
print("   3. 添加 /minimal 路由到 app.py:")
print()
print("   # 在app.py末尾添加:")
print("   from flask import send_file")
print("   @app.route('/minimal')")
print("   def minimal_test():")
print("       return send_file('templates/minimal_test.html')")
print()
print("   4. 重启Flask: python app.py")
print("   5. 浏览器访问: http://localhost:5000/minimal")
print("   6. 如果minimal页面可以工作，说明原页面有其他JS冲突")
print()
print("   7. 打开F12 → Console，检查是否有红色错误")
print("   8. 截图错误信息发给我")
print("=" * 60)

input("\n按Enter退出...")
