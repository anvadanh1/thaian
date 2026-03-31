// === CẤU HÌNH API === 
// ⚠️ Hãy tạo Key mới và dán vào dưới đây, không dùng Key cũ đã lộ
const API_KEY = '4b99488c88mshefd7ef81b6a62c0p15305bjsn049ebea5dd8d; 
const API_HOST = 'youtube-media-downloader.p.rapidapi.com';
const API_BASE = `https://${API_HOST}`;

async function fetchVideoData() {
    const url = document.getElementById('videoUrl').value.trim();
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const result = document.getElementById('result');

    // Reset UI
    result.classList.add('hidden');
    error.classList.add('hidden');
    
    if (!url) {
        showError("Vui lòng nhập link YouTube hợp lệ!");
        return;
    }

    loading.classList.remove('hidden');

    try {
        // Gọi API lấy thông tin video
        const response = await fetch(`${API_BASE}/video/details?url=${encodeURIComponent(url)}`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': API_HOST
            }
        });

        if (!response.ok) {
            throw new Error(`Lỗi API: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data); // Debug: Xem cấu trúc dữ liệu thực tế

        // Kiểm tra dữ liệu trả về
        if (!data || (!data.title && !data.videoId)) {
            throw new Error("Không tìm thấy thông tin video. Kiểm tra lại link hoặc API Key.");
        }

        // Hiển thị thông tin cơ bản (xử lý linh hoạt tên biến)
        const title = data.title || data.videoTitle || "Không rõ tiêu đề";
        const channel = data.author || data.channel || data.owner || "Unknown";
        const thumb = data.thumbnail || data.thumbnails?.[0]?.url || "";
        const duration = data.duration || data.lengthSeconds ? formatDuration(data.duration || data.lengthSeconds) : "";

        document.getElementById('title').innerText = title;
        document.getElementById('channel').innerText = "Kênh: " + channel;
        document.getElementById('duration').innerText = duration ? "⏱ " + duration : "";
        if (thumb) document.getElementById('thumb').src = thumb;

        // Tạo danh sách nút tải
        renderDownloadButtons(data);

        loading.classList.add('hidden');
        result.classList.remove('hidden');

    } catch (err) {
        loading.classList.add('hidden');
        showError(err.message);
        console.error("Error:", err);
    }
}

function renderDownloadButtons(data) {
    const list = document.getElementById('downloadList');
    list.innerHTML = '';

    // === XỬ LÝ CẤU TRÚC LINK TẢI ===
    // Mỗi API có cấu trúc JSON khác nhau. 
    // Code dưới đây cố gắng dò tìm các trường phổ biến.
    
    let formats = [];

    // Trường hợp 1: Dữ liệu nằm trong data.links
    if (data.links && Array.isArray(data.links)) {
        formats = data.links;
    } 
    // Trường hợp 2: Dữ liệu nằm trong data.formats
    else if (data.formats && Array.isArray(data.formats)) {
        formats = data.formats;
    }
    // Trường hợp 3: Dữ liệu nằm trong data.downloadUrls
    else if (data.downloadUrls && Array.isArray(data.downloadUrls)) {
        formats = data.downloadUrls;
    }

    if (formats.length === 0) {
        list.innerHTML = '<p style="color:#666;font-size:0.9rem">⚠️ Không tìm thấy link tải trực tiếp từ API này.</p>';
        return;
    }

    // Lọc và hiển thị các định dạng có link tải
    formats.forEach(item => {
        // Tìm url tải trong các tên biến phổ biến
        const downloadUrl = item.url || item.downloadUrl || item.link || item.href;
        if (!downloadUrl) return;

        const quality = item.quality || item.qualityLabel || item.formatNote || 'HD';
        const format = item.format || item.ext || item.mimeType?.split(';')[0] || '';
        const size = item.fileSize || item.contentLength ? formatBytes(item.fileSize || item.contentLength) : '';

        const btn = document.createElement('a');
        btn.className = 'download-btn';
        btn.href = downloadUrl;
        btn.target = '_blank';
        btn.innerHTML = `
            <span>
                <strong>${quality}</strong> 
                <span class="format-info">${format} ${size ? '• ' + size : ''}</span>
            </span>
            <span class="quality-badge">TẢI NGAY</span>
        `;
        list.appendChild(btn);
    });
}

// Hàm phụ trợ: Định dạng thời gian
function formatDuration(seconds) {
    if (typeof seconds === 'string' && seconds.includes(':')) return seconds;
    const s = parseInt(seconds);
    if (isNaN(s)) return "";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

// Hàm phụ trợ: Định dạng dung lượng
function formatBytes(bytes) {
    if (!bytes || bytes === 'N/A') return '';
    const b = parseInt(bytes);
    if (isNaN(b)) return '';
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function showError(msg) {
    const el = document.getElementById('error');
    el.innerText = "❌ " + msg;
    el.classList.remove('hidden');
}
