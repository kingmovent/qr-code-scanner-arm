// ============================================
// 全局状态
// ============================================
let currentImage = null;
let currentResults = [];

// ============================================
// DOM 元素缓存（延迟获取）
// ============================================
const getEl = (id) => document.getElementById(id);

// ============================================
// 工具函数
// ============================================
function showToast(msg, type = 'info') {
    const toast = getEl('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.className = 'toast', 3000);
}

function showLoading(show) {
    const loading = getEl('loading');
    if (loading) loading.style.display = show ? 'block' : 'none';
}

// ============================================
// 初始化（主入口）
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready');
    initAll();
});

function initAll() {
    // 延迟初始化，确保DOM完全就绪
    setTimeout(() => {
        try {
            initTabs();
            initFileUpload();
            initScreenshot();
            initPaste();
            initClear();
            console.log('All handlers initialized');
        } catch (e) {
            console.error('Init error:', e);
        }
    }, 100);
}

// ============================================
// Tab切换
// ============================================
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            const tabEl = document.getElementById(`${tabId}-tab`);
            if (tabEl) tabEl.classList.add('active');
        });
    });
}

// ============================================
// 文件上传（按钮 + 拖拽）
// ============================================
function initFileUpload() {
    const dropZone = getEl('drop-zone');
    const fileInput = getEl('file-input');
    const selectBtn = getEl('select-file-btn');
    
    if (!dropZone || !fileInput) {
        console.warn('Missing elements for file upload');
        return;
    }
    
    // 点击选择文件
    if (selectBtn) {
        selectBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });
    }
    
    // 文件选择变化
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
        fileInput.value = ''; // 重置
    });
    
    // 拖拽
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });
}

// ============================================
// 截图功能
// ============================================
function initScreenshot() {
    const captureBtn = getEl('capture-btn');
    const fullscreenCheckbox = getEl('capture-fullscreen');
    
    if (captureBtn) {
        captureBtn.addEventListener('click', async () => {
            if (!confirm('即将截取屏幕。继续？')) return;
            showLoading(true);
            try {
                const region = fullscreenCheckbox?.checked ? null : {
                    x: parseInt(getEl('region-x')?.value) || 0,
                    y: parseInt(getEl('region-y')?.value) || 0,
                    width: parseInt(getEl('region-width')?.value) || 800,
                    height: parseInt(getEl('region-height')?.value) || 600
                };
                
                const response = await fetch('/capture', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ region })
                });
                const result = await response.json();
                handleResult(result);
            } catch (error) {
                showToast('截图失败: ' + error.message, 'error');
            } finally {
                showLoading(false);
            }
        });
    }
    
    // 区域输入框切换
    if (fullscreenCheckbox) {
        fullscreenCheckbox.addEventListener('change', (e) => {
            const regionInputs = getEl('region-inputs');
            if (regionInputs) {
                regionInputs.style.display = e.target.checked ? 'none' : 'block';
            }
        });
    }
}

// ============================================
// 粘贴功能（Windows兼容 - 修复版）
// ============================================
function initPaste() {
    const pasteBtn = getEl('paste-btn');
    const dropZone = getEl('drop-zone');
    
    if (pasteBtn) {
        pasteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.focus();
            showToast('请按 Ctrl+V 粘贴截图', 'info');
        });
    }
    
    // 方案1: 使用paste事件（传统，最兼容）
    document.addEventListener('paste', async (e) => {
        try {
            const clipboard = e.clipboardData;
            if (!clipboard) return;
            
            // 快速检查
            const types = clipboard.types;
            let hasImage = false;
            for (let i = 0; i < types.length; i++) {
                if (types[i].startsWith('image/')) {
                    hasImage = true;
                    break;
                }
            }
            
            if (!hasImage) return;
            
            e.preventDefault();
            showLoading(true);
            if (dropZone) dropZone.classList.add('paste-active');
            
            // 处理粘贴数据
            await handlePasteEvent(clipboard);
            
        } catch (err) {
            console.error('Paste error:', err);
        } finally {
            showLoading(false);
            if (dropZone) {
                setTimeout(() => dropZone.classList.remove('paste-active'), 300);
            }
        }
    }, { passive: false });
}

async function handlePasteEvent(clipboard) {
    // 方法1: 使用items (标准)
    try {
        if (clipboard.items && clipboard.items.length > 0) {
            const item = clipboard.items[0];
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file && file.size > 0) {
                    console.log('Paste via items:', file.name, file.size);
                    await processImageFile(file);
                    return;
                }
            }
        }
    } catch (err) {
        console.warn('items method failed:', err);
    }
    
    // 方法2: 使用getData (Windows兼容)
    try {
        const formats = ['image/png', 'image/jpeg', 'image/jpg'];
        for (const format of formats) {
            try {
                const data = clipboard.getData(format);
                if (data) {
                    console.log('Paste via getData:', format, data.length, 'bytes');
                    const blob = new Blob([data], { type: format });
                    const file = new File([blob], 'paste.png', { type: format });
                    await processImageFile(file);
                    return;
                }
            } catch (e) {
                // 继续下一格式
            }
        }
    } catch (err) {
        console.warn('getData method failed:', err);
    }
    
    showToast('无法读取剪贴板图片，请使用文件上传', 'error');
}
    
    // 使用 paste 事件，但采用安全策略
    document.addEventListener('paste', async (e) => {
        try {
            const clipboard = e.clipboardData;
            if (!clipboard) {
                console.log('No clipboard data');
                return;
            }
            
            console.log('Paste event detected');
            console.log('Clipboard types:', clipboard.types);
            
            // 安全检查：立即返回，不阻塞UI
            setTimeout(async () => {
                try {
                    await handlePaste(clipboard);
                } catch (err) {
                    console.error('Paste handler error:', err);
                }
            }, 10);
            
        } catch (err) {
            console.error('Paste event error:', err);
        }
    }, { passive: true });  // 使用passive避免阻塞
}

async function handlePaste(clipboard) {
    const dropZone = getEl('drop-zone');
    
    // 方法1: 检查types数组（标准）
    const types = clipboard.types;
    let imageFound = false;
    
    for (let i = 0; i < types.length; i++) {
        const type = types[i];
        console.log('Checking type:', type);
        if (type.startsWith('image/')) {
            imageFound = true;
            break;
        }
    }
    
    if (!imageFound) {
        console.log('No image in clipboard');
        return;
    }
    
    console.log('Image found in clipboard');
    
    // 尝试获取图片
    let file = null;
    
    // 方法A: 使用items（标准API）
    try {
        if (clipboard.items && clipboard.items.length > 0) {
            const item = clipboard.items[0];
            if (item.type.startsWith('image/')) {
                file = item.getAsFile();
                console.log('Got file from items:', file?.name, file?.size);
            }
        }
    } catch (err) {
        console.warn('items method failed:', err);
    }
    
    // 方法B: 使用getData（Windows IE/Edge legacy）
    if (!file) {
        try {
            // 尝试常见图片格式
            const formats = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp'];
            for (const format of formats) {
                try {
                    const data = clipboard.getData(format);
                    if (data) {
                        console.log('Got data via getData:', format, data.length, 'bytes');
                        // 转换为File对象
                        const blob = new Blob([data], { type: format });
                        file = new File([blob], 'paste.png', { type: format });
                        break;
                    }
                } catch (e) {
                    // 继续尝试下一种格式
                }
            }
        } catch (err) {
            console.warn('getData method failed:', err);
        }
    }
    
    if (!file) {
        showToast('无法读取剪贴板图片，请使用截图工具后按Ctrl+V', 'error');
        return;
    }
    
    // 处理文件
    showLoading(true);
    if (dropZone) dropZone.classList.add('paste-active');
    
    try {
        // 预览
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewImg = getEl('preview-image');
            const previewSection = getEl('preview-section');
            if (previewImg && previewSection) {
                previewImg.src = e.target.result;
                previewSection.style.display = 'block';
                currentImage = e.target.result;
            }
        };
        reader.readAsDataURL(file);
        
        // 上传
        const formData = new FormData();
        formData.append('image', file);
        
        console.log('Uploading pasted image...');
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        console.log('Upload result:', result);
        handleResult(result);
        
        if (result.success) {
            showToast(`识别完成，发现${result.data.length}个二维码`, 'success');
        } else {
            showToast(result.message, 'error');
        }
        
    } catch (error) {
        console.error('Paste processing error:', error);
        showToast('处理失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
        if (dropZone) {
            setTimeout(() => dropZone.classList.remove('paste-active'), 300);
        }
    }
}
    
    // 全局粘贴监听（使用一次性检测，避免卡死）
    document.addEventListener('paste', async (e) => {
        try {
            // 快速检查剪贴板类型（不遍历items）
            const clipboard = e.clipboardData;
            if (!clipboard) return;
            
            // 检查是否有图片类型
            const types = clipboard.types;
            let hasImage = false;
            
            // 安全遍历：限制次数
            let count = 0;
            for (let i = 0; i < types.length && count < 10; i++) {
                const type = types[i];
                if (type.startsWith('image/')) {
                    hasImage = true;
                    break;
                }
                count++;
            }
            
            if (!hasImage) return;
            
            e.preventDefault();
            showLoading(true);
            if (dropZone) dropZone.classList.add('paste-active');
            
            // 获取图片（Windows下items可能无法直接迭代，使用getData）
            try {
                // 方法1: 使用items（标准）
                const item = clipboard.items[0];
                if (item && item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) await processImageFile(file);
                }
            } catch (err) {
                console.warn('Method 1 failed, trying method 2:', err);
                // 方法2: 使用getData（Windows兼容）
                try {
                    const blob = clipboard.getData('image/png') || clipboard.getData('image/jpeg');
                    if (blob) {
                        const file = new File([blob], 'paste.png', { type: 'image/png' });
                        await processImageFile(file);
                    }
                } catch (err2) {
                    console.error('Paste failed:', err2);
                    showToast('剪贴板图片读取失败', 'error');
                }
            }
        } catch (error) {
            console.error('Paste error:', error);
            showToast('粘贴出错: ' + error.message, 'error');
        } finally {
            showLoading(false);
            if (dropZone) {
                setTimeout(() => dropZone.classList.remove('paste-active'), 300);
            }
        }
    }, { passive: false });  // 明确设置non-passive
}

async function processImageFile(file) {
    console.log('Processing pasted file:', file.name, file.size);
    
    // 预览
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewImg = getEl('preview-image');
        const previewSection = getEl('preview-section');
        if (previewImg && previewSection) {
            previewImg.src = e.target.result;
            previewSection.style.display = 'block';
            currentImage = e.target.result;
        }
    };
    reader.readAsDataURL(file);
    
    // 上传
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('/upload', {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    handleResult(result);
    showToast('识别完成', 'success');
}

// ============================================
// 清空结果
// ============================================
function initClear() {
    const clearBtn = getEl('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearResults);
    }
}

// ============================================
// 文件处理
// ============================================
async function handleFile(file) {
    console.log('Handling file:', file.name);
    
    if (!file.type.startsWith('image/')) {
        showToast('请选择图片文件', 'error');
        return;
    }
    
    showLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewImg = getEl('preview-image');
        const previewSection = getEl('preview-section');
        if (previewImg && previewSection) {
            previewImg.src = e.target.result;
            previewSection.style.display = 'block';
            currentImage = e.target.result;
        }
    };
    reader.readAsDataURL(file);
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        const result = await res.json();
        handleResult(result);
    } catch (error) {
        console.error('Upload error:', error);
        showToast('上传失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// 结果处理
// ============================================
function handleResult(result) {
    const resultsContainer = getEl('results-container');
    const emptyState = getEl('empty-state');
    const clearBtn = getEl('clear-btn');
    
    if (!result.success) {
        showToast(result.message, 'error');
        if (emptyState) emptyState.style.display = 'block';
        if (clearBtn) clearBtn.style.display = 'none';
        return;
    }
    
    currentResults = result.data;
    
    if (currentResults.length === 0) {
        if (emptyState) {
            emptyState.innerHTML = `
                <div class="empty-icon">🔍</div>
                <p>未发现二维码</p>
                <p class="hint">请尝试更清晰的图片</p>
            `;
            emptyState.style.display = 'block';
        }
        if (clearBtn) clearBtn.style.display = 'none';
    } else {
        if (emptyState) emptyState.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'block';
        renderResults(currentResults);
    }
    
    showToast(result.message, 'success');
    drawOverlay();
}

function renderResults(results) {
    const container = getEl('results-container');
    if (!container) return;
    
    container.innerHTML = '';
    results.forEach((qr, i) => {
        const card = document.createElement('div');
        card.className = 'result';
        card.innerHTML = `
            <strong>二维码 ${i + 1}</strong><br>
            类型: ${qr.type || 'QRCODE'}<br>
            内容: ${qr.data}
            ${qr.rect ? `<br><small>位置: (${qr.rect.left}, ${qr.rect.top})</small>` : ''}
        `;
        container.appendChild(card);
    });
}

function clearResults() {
    currentResults = [];
    const container = getEl('results-container');
    const emptyState = getEl('empty-state');
    const clearBtn = getEl('clear-btn');
    const previewSection = getEl('preview-section');
    const fileInput = getEl('file-input');
    const canvas = getEl('overlay-canvas');
    
    if (container && emptyState) {
        container.innerHTML = '';
        container.appendChild(emptyState);
        emptyState.style.display = 'block';
    }
    if (clearBtn) clearBtn.style.display = 'none';
    if (previewSection) previewSection.style.display = 'none';
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (fileInput) fileInput.value = '';
}

// ============================================
// 绘制识别框
// ============================================
function drawOverlay() {
    const previewImg = getEl('preview-image');
    const canvas = getEl('overlay-canvas');
    if (!previewImg || !canvas) return;
    
    previewImg.onload = () => {
        const rect = previewImg.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        
        currentResults.forEach(qr => {
            if (qr.rect) {
                const scaleX = rect.width / previewImg.naturalWidth;
                const scaleY = rect.height / previewImg.naturalHeight;
                ctx.strokeRect(
                    qr.rect.left * scaleX,
                    qr.rect.top * scaleY,
                    qr.rect.width * scaleX,
                    qr.rect.height * scaleY
                );
            }
        });
    };
}

// ============================================
// 全局错误处理
// ============================================
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled rejection:', e.reason);
    e.preventDefault();
});

// 安全快捷键
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const dropZone = getEl('drop-zone');
        if (dropZone && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            dropZone.classList.add('paste-active');
            setTimeout(() => dropZone.classList.remove('paste-active'), 500);
        }
    }
});

// 导出（调试用）
window.QRScanner = {
    handleFile,
    clearResults,
    get state() { return { currentImage, currentResults }; }
};
