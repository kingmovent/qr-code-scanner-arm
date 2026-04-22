# ARM 设备二维码识别器 - 快速安装指南

## 🚀 三种部署方式

### 方案1: Docker（最简单，推荐）
```bash
# 1. 复制项目到设备
scp -r . pi@raspberrypi:/opt/

# 2. 进入目录并启动
cd /opt/qr_code_scanner_arm
docker-compose up -d

# 3. 访问 http://设备IP:5000
```

### 方案2: 一键安装脚本
```bash
chmod +x install_arm.sh
sudo ./install_arm.sh
# 按提示操作，自动完成所有配置
```

### 方案3: 手动安装
```bash
# 1. 安装系统依赖（关键步骤！）
sudo apt-get update
sudo apt-get install -y \
    build-essential libjpeg-dev zlib1g-dev \
    libpng-dev libfreetype6-dev libzbar-dev \
    python3 python3-pip python3-venv

# 2. 创建虚拟环境并安装
python3 -m venv venv
source venv/bin/activate
pip install --no-cache-dir -r requirements.txt

# 3. 启动
python app.py
```

## ⚠️ Pillow编译失败？执行以下命令

**核心错误**: `The headers or library files could not be found for jpeg`

**完整修复**:
```bash
# Armbian/Debian/Ubuntu
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libfreetype6-dev

# 清理并重装
pip cache purge
pip install --no-cache-dir --force-reinstall Pillow
```

## 📋 依赖清单

### 必需系统包
| 包名 | 用途 |
|------|------|
| build-essential | C编译器 |
| libjpeg-dev | JPEG图像支持 |
| zlib1g-dev | 压缩库 |
| libpng-dev | PNG图像支持 |
| libfreetype6-dev | 字体渲染 |
| libzbar-dev | 二维码解码库 |
| python3-dev | Python头文件 |

### 可选系统包
| 包名 | 用途 |
|------|------|
| libgl1-mesa-glx | 截图功能 |
| libglib2.0-0 | 截图功能 |
| xvfb | 无头模式虚拟显示 |

## 📞 获取帮助

1. **查看完整文档**: `ARM_DEPLOY.md`
2. **检查环境**: `./check_env.sh`
3. **查看日志**:
   - systemd: `sudo journalctl -u qr-scanner -f`
   - Docker: `docker-compose logs -f`
   - 直接运行: 查看控制台输出

## 🎯 验证安装

```bash
# 测试Python导入
python3 -c "import PIL; import pyzbar; print('✓ 依赖正常')"

# 测试ZBar命令行工具
zbarimg --version

# 测试Web服务
curl http://localhost:5000/health
```

## 🔄 更新与维护

```bash
# Docker方式
docker-compose pull
docker-compose up -d

# 直接运行方式
source venv/bin/activate
pip install --upgrade -r requirements.txt
sudo systemctl restart qr-scanner  # 如果使用systemd
```

## 🆘 应急方案

如果编译仍然失败，使用系统包（功能相同，版本稍旧）:
```bash
sudo apt-get install -y python3-pil python3-pyzbar
# 然后在requirements.txt中注释掉Pillow和pyzbar
```

---

**项目位置**: `/opt/qr-code-scanner/`  
**配置文件**: `qr-scanner.service`  
**日志位置**: `journalctl -u qr-scanner`  
**上传目录**: `/opt/qr-code-scanner/static/uploads/`
