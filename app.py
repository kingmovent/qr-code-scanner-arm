from flask import Flask, request, jsonify, render_template, send_file, send_file
from flask_cors import CORS
from pyzbar import pyzbar
from PIL import Image
import numpy as np
import io
import os
import sys

app = Flask(__name__)
CORS(app)

# 配置
UPLOAD_FOLDER = "static/uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max


def decode_qr_code(pil_image):
    """
    解码图像中的二维码

    Args:
        pil_image: PIL Image对象

    Returns:
        list: 包含所有二维码信息的列表
    """
    results = []

    try:
        # 转换为灰度图提升性能
        if pil_image.mode not in ("L", "RGB"):
            pil_image = pil_image.convert("RGB")

        # 使用pyzbar解码
        decoded = pyzbar.decode(pil_image)

        for obj in decoded:
            qr_data = {
                "data": obj.data.decode("utf-8", errors="ignore"),
                "type": obj.type,
                "rect": {
                    "left": obj.rect.left,
                    "top": obj.rect.top,
                    "width": obj.rect.width,
                    "height": obj.rect.height,
                },
            }

            # 添加多边形顶点（如果存在）
            if obj.polygon:
                qr_data["polygon"] = [{"x": p.x, "y": p.y} for p in obj.polygon]

            results.append(qr_data)

    except Exception as e:
        print(f"解码错误: {e}", file=sys.stderr)

    return results


@app.route("/")
def index():
    """主页 - 简洁版"""
    return render_template("clean.html")


@app.route("/upload", methods=["POST"])
def upload_image():
    """
    上传图片并识别二维码

    接收: multipart/form-data, 字段名: 'image'
    返回: JSON {success: bool, data: list, message: str}
    """
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "message": "没有找到图片文件"}), 400

        file = request.files["image"]

        if file.filename == "":
            return jsonify({"success": False, "message": "未选择文件"}), 400

        # 读取图像
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))

        # 验证图像有效性
        image.verify()
        image = Image.open(io.BytesIO(image_bytes))  # 重新打开，verify后会关闭

        # 解码二维码
        results = decode_qr_code(image)

        # 保存上传的图片
        safe_filename = file.filename.replace("/", "_").replace("\\", "_")
        save_path = os.path.join(app.config["UPLOAD_FOLDER"], safe_filename)
        image.save(save_path)

        return jsonify(
            {
                "success": True,
                "data": results,
                "message": f"发现 {len(results)} 个二维码",
                "filename": safe_filename,
            }
        )

    except Exception as e:
        return jsonify({"success": False, "message": f"处理失败: {str(e)}"}), 500


@app.route("/capture", methods=["POST"])
def capture_screen():
    """
    截图并识别二维码 (需要X11显示环境)

    接收: JSON {region: {x, y, width, height}} (可选)
    返回: JSON {success: bool, data: list, message: str}
    """
    try:
        # 检查是否在X11环境中
        if not os.environ.get("DISPLAY"):
            return jsonify(
                {
                    "success": False,
                    "message": "截图功能需要X11显示环境。在无头模式下请使用图片上传功能。",
                }
            ), 400

        # 尝试导入截图库
        try:
            import mss
        except ImportError:
            return jsonify(
                {
                    "success": False,
                    "message": "截图功能未启用。请安装 mss 库: pip install mss",
                }
            ), 400

        data = request.get_json() or {}
        region = data.get("region")

        with mss.mss() as sct:
            if region and all(k in region for k in ["x", "y", "width", "height"]):
                monitor = {
                    "left": region["x"],
                    "top": region["y"],
                    "width": region["width"],
                    "height": region["height"],
                }
            else:
                monitor = sct.monitors[1]  # 主屏幕

            screenshot = sct.grab(monitor)

            # 转换为PIL Image
            img_array = np.array(screenshot)
            # mss返回BGRA格式，需要转RGB
            if screenshot.bgra:
                img_array = img_array[:, :, :3]  # 移除alpha通道
            image = Image.fromarray(img_array)

        # 解码二维码
        results = decode_qr_code(image)

        # 保存截图
        image.save(f"{app.config['UPLOAD_FOLDER']}/screenshot.jpg")

        return jsonify(
            {
                "success": True,
                "data": results,
                "message": f"发现 {len(results)} 个二维码",
            }
        )

    except Exception as e:
        return jsonify({"success": False, "message": f"截图失败: {str(e)}"}), 500


@app.route("/health")
def health_check():
    """健康检查"""
    return jsonify({"status": "healthy", "service": "qr-scanner"})


@app.route("/debug")
def debug_page():
    """调试页面"""
    return render_template("debug.html")


@app.route("/minimal")
def minimal_test():
    """超简化测试页面（用于诊断卡死问题）"""
    return send_file("templates/minimal_test.html")


@app.route("/simple")
def simple_test():
    """简单测试页面（粘贴功能优先）"""
    return send_file("templates/simple_test.html")


@app.route("/clean")
def clean_test():
    """简洁版主页面"""
    return send_file("templates/clean.html")


@app.route("/clipboard-debug")
def clipboard_debug():
    """剪贴板调试页面"""
    return send_file("templates/clipboard_debug.html")


if __name__ == "__main__":
    # 确保上传目录存在
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    print("=" * 60)
    print("二维码识别器启动")
    print("=" * 60)
    print(f"主页面: http://0.0.0.0:5000")
    print(f"调试页: http://0.0.0.0:5000/debug")
    print(f"健康检查: http://0.0.0.0:5000/health")
    print(f"上传目录: {os.path.abspath(UPLOAD_FOLDER)}")
    print("=" * 60)

    # 启动服务 - debug=True 以便看到错误
    app.run(debug=True, host="0.0.0.0", port=5000)
