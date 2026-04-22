# 多阶段构建，支持AMD64和ARM64/ARM32架构
ARG PYTHON_VERSION=3.9-slim
ARG TARGETPLATFORM

# Builder阶段 - 编译Python依赖
FROM --platform=$TARGETPLATFORM python:${PYTHON_VERSION} AS builder

WORKDIR /app

# 安装编译依赖
# - build-essential: 编译工具链
# - libjpeg-dev: JPEG支持 (Pillow必需)
# - zlib1g-dev: 压缩支持 (Pillow必需)
# - libpng-dev: PNG支持 (Pillow推荐)
# - libfreetype6-dev: 字体渲染 (Pillow推荐)
# - libzbar-dev: pyzbar的ZBar开发库
# - libglib2.0-0, libgl1-mesa-glx: 截图功能依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libfreetype6-dev \
    libtiff5-dev \
    libwebp-dev \
    liblcms2-dev \
    zbar-tools \
    libzbar0 \
    libzbar-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 使用清华源加速pip安装
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple \
    && pip install --no-cache-dir -r requirements.txt


# 生产镜像
FROM --platform=$TARGETPLATFORM python:${PYTHON_VERSION} AS production

WORKDIR /app

# 仅安装运行时依赖
RUN apt-get update && apt-get install -y \
    libjpeg62-turbo \
    zbar-tools \
    libzbar0 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 从builder阶段复制已安装的Python包
COPY --from=builder /usr/local/lib/python${PYTHON_VERSION}/site-packages /usr/local/lib/python3.9/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# 复制应用代码
COPY . .

# 创建上传目录
RUN mkdir -p static/uploads

# 创建非root用户
RUN useradd -m -u 1000 qruser && chown -R qruser:qruser /app
USER qruser

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')"

# 启动命令
CMD ["python", "app.py"]
