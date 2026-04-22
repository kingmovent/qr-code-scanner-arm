# Windows开发环境配置指南

## 🚀 快速启动（Windows）

### 1. 安装Python依赖

```bash
# 进入项目目录
cd D:\python_project\qr_code_scanner_arm

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# PowerShell:
venv\Scripts\Activate.ps1
# 或 CMD:
# venv\Scripts\activate.bat

# 升级pip
python -m pip install --upgrade pip

# 安装依赖（Windows有预编译wheel，不会编译）
pip install -r requirements.txt
```

**注意**: Windows版的Pillow有预编译的wheel，不需要libjpeg-dev，安装会很快。

---

### 2. 启动Flask服务

```bash
# 方式1: 直接运行（推荐开发）
python app.py

# 方式2: 设置环境变量
set FLASK_APP=app.py
set FLASK_ENV=development
flask run --host=0.0.0.0 --port=5000
```

输出应该显示:
```
===== 二维码识别器启动
访问地址: http://0.0.0.0:5000
========================================
```

---

### 3. 浏览器访问

打开浏览器访问:
- 主页: http://localhost:5000
- 调试页: http://localhost:5000/debug
- 健康检查: http://localhost:5000/health

---

## 🔧 Windows特定问题

### 问题1: `mss` 库在Windows的兼容性

`mss`在Windows上可能有问题。如果需要截图功能：

```bash
# 安装mss（Windows预编译版本可用）
pip install mss
```

如果mss安装失败或截图功能不可用，不影响核心功能（图片上传和粘贴）。

**当前代码已优化**：截图功能会检测环境，不可用时返回友好错误。

---

### 问题2: 防火墙阻止端口

Windows防火墙可能会阻止5000端口：

```powershell
# 允许端口通过防火墙（需要管理员权限）
New-NetFirewallRule -DisplayName "QR Scanner" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

或在Windows防火墙设置中手动添加入站规则。

---

### 问题3: pyzbar依赖ZBar DLL

Windows上pyzbar需要ZBar DLL文件。通常pip install会自动处理，但有时需要手动下载：

```bash
# 如果pyzbar导入失败
pip uninstall pyzbar
pip install pyzbar --no-binary pyzbar
```

或从官网下载zbar.dll放到系统目录。

---

## 🐛 Windows调试技巧

### 查看Flask日志

终端会显示所有请求：
```
127.0.0.1 - - [22/Apr/2026 20:15:30] "POST /upload HTTP/1.1" 200 -
```

如果有错误，会显示堆栈跟踪。

---

### 启用Flask Debug模式

修改 `app.py` 最后一行：
```python
app.run(debug=True, host='0.0.0.0', port=5000)
```

`debug=True` 会：
- 自动重载代码修改
- 显示详细错误页面
- 提供调试器

**注意**: 生产环境不要开启debug。

---

### 浏览器开发者工具

按 `F12`：
1. **Console**: 查看JS错误
2. **Network**: 查看API请求
   - 过滤 `XHR` 查看 `/upload` 请求
   - 状态码应为200
   - 查看Response内容
3. **Application**: 查看Cookies和Storage

---

## 📋 Windows测试清单

```powershell
# 1. 激活虚拟环境
venv\Scripts\Activate.ps1

# 2. 启动服务
python app.py

# 3. 测试健康检查（另一个终端）
curl http://localhost:5000/health
# 或浏览器直接访问

# 4. 测试上传（使用curl）
curl -F "image=@test.png" http://localhost:5000/upload

# 5. 查看日志（同个终端，Flask会输出）
```

---

## 🎨 前端开发（Windows）

### 实时预览修改

修改 `templates/index.html` 或 `static/*.css/js` 后：

1. **如果debug=True**: Flask自动重载，刷新浏览器即可
2. **如果debug=False**: 重启Flask服务

---

### 使用VSCode调试

1. 安装 **Python** 和 **Live Server** 扩展
2. 右键 `index.html` → **Open with Live Server**
   - 这会启动一个独立Web服务器（端口5500）
   - 需要修改API地址为 `http://localhost:5000`
3. 或直接使用Flask serve

---

## 🔍 常见Windows错误

### 错误1: `ModuleNotFoundError: No module named 'flask_cors'`
```powershell
# 解决方案：安装
pip install flask-cors
```

### 错误2: `ImportError: DLL load failed` (pyzbar)
```powershell
# 解决方案：重装
pip uninstall pyzbar -y
pip install pyzbar

# 如果还不行，下载zbar二进制：
# https://github.com/NaturalHistoryMuseum/pyzbar/releases
# 将zbar.dll放到 C:\Windows\System32\
```

### 错误3: 端口5000被占用
```powershell
# 查看占用
netstat -ano | findstr :5000

# 结束进程
taskkill /PID <PID> /F

# 或修改app.py使用其他端口
app.run(port=8080)
```

---

## 📁 项目结构（Windows）

```
D:\python_project\qr_code_scanner_arm\
├── venv\                  # 虚拟环境（Git忽略）
├── app.py                 # Flask主应用
├── requirements.txt       # 依赖列表
├── README.md
├── templates\
│   ├── index.html        # 主页面
│   ├── debug.html        # 调试页面
│   └── test.html         # 测试页面
├── static\
│   ├── style.css
│   ├── script.js
│   └── uploads\          # 上传文件（自动创建）
└── logs\                 # 日志（可选）
```

---

## 🚀 完整工作流程（Windows开发）

```powershell
# 第1步: 打开PowerShell，进入项目
cd D:\python_project\qr_code_scanner_arm

# 第2步: 激活虚拟环境
venv\Scripts\Activate.ps1

# 第3步: 安装/更新依赖
pip install -r requirements.txt

# 第4步: 启动Flask
python app.py
# 看到 "Running on http://0.0.0.0:5000" 表示成功

# 第5步: 浏览器打开
# http://localhost:5000

# 第6步: 测试功能
# - 点击"选择文件"
# - 粘贴截图 (Ctrl+V)
# - 上传测试图片
```

---

## 🐛 Windows调试命令

```powershell
# 查看虚拟环境中的包
pip list

# 验证pyzbar
python -c "import pyzbar; print('pyzbar OK')"

# 验证Pillow
python -c "from PIL import Image; print('PIL OK')"

# 测试Flask
curl http://localhost:5000/health

# 查看Windows事件日志（如果有崩溃）
Get-WinEvent -LogName Application -MaxEvents 20 | Where-Object {$_.Message -like "*python*"}
```

---

## 💡 提示

1. **使用PowerShell** 而非CMD（更好的脚本支持）
2. **以管理员身份运行** VSCode，避免权限问题
3. **关闭防火墙** 临时测试（如果连接问题）
4. **使用Chrome/Edge** 开发者工具更好用
5. **清理浏览器缓存**: Ctrl+Shift+Delete

---

## 🔄 从Windows部署到Armbian

开发测试完成后：

```powershell
# 1. 打包代码（排除venv）
Compress-Archive -Path * -DestinationPath ..\qr_code_scanner_arm.zip -Exclude venv

# 2. 复制到Armbian
scp ..\qr_code_scanner_arm.zip pi@raspberrypi:/tmp/

# 3. 在Armbian解压安装
ssh pi@raspberrypi
unzip /tmp/qr_code_scanner_arm.zip -d /opt/
cd /opt/qr_code_scanner_arm
sudo ./install_quick.sh
```

---

## 📞 获取帮助

如果Windows上启动失败：

1. **截图错误信息**（终端和浏览器）
2. **运行诊断**:
   ```powershell
   python -c "import flask, PIL, pyzbar, numpy; print('All OK')"
   ```
3. **查看Flask日志**（终端输出）
4. **告诉我**:
   - Python版本: `python --version`
   - 错误信息完整内容
   - 哪个步骤失败

---

**现在请在Windows PowerShell中执行**:
```powershell
cd D:\python_project\qr_code_scanner_arm
venv\Scripts\Activate.ps1
python app.py
```

然后访问 http://localhost:5000 测试。如果遇到错误，把终端输出发给我。
