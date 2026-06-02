
# STC-V3 Ultra: Hybrid Real-Host Core Architecture Spec

## 1. TỔNG QUAN KIẾN TRÚC (ARCHITECTURAL OVERVIEW)
Để giải quyết triệt để vấn đề Google WAF/Cloud Armor quét Fingerprint thiết bị ảo hóa (Canvas/WebGL/Lack of GPU) trong môi trường Docker GUI (Xvfb), hệ thống STC-V3 chuyển dịch toàn diện sang mô hình Hybrid Co-located (Mỗi PC một cụm Key khép kín).

- Phân hệ API/Gateway/n8n: Đóng gói cô lập chạy trong Docker Container.
- Phân hệ Trình duyệt sinh Token Captcha: Chạy trực tiếp trên Hệ điều hành thật (Real-Host OS) của khách hàng (Windows/Mac/Linux).
- Cổng giao tiếp: Local Loopback Network (127.0.0.1) nhằm triệt tiêu tối đa Latency (< 0.2s) và chống rớt gói tin mạng.
## 2. SƠ ĐỒ PHÂN RÃ HỆ THỐNG (SYSTEM COMPONENT BREAKDOWN)
┌────────────────────────────────────────────────────────────────────────┐
│                        REAL-HOST OS (WINDOWS / MAC)                    │
│                                                                        │
│   ┌────────────────────────┐              ┌────────────────────────┐   │
│   │   Chrome Profile 1     │              │   Chrome Profile N     │   │
│   │  (--window-position)   │              │  (--window-position)   │   │
│   │  ┌──────────────────┐  │              │  ┌──────────────────┐  │   │
│   │  │ STC-Extension    │  │              │  │ STC-Extension    │  │   │
│   │  └────────┬─────────┘  │              │  └────────┬─────────┘  │   │
│   └───────────┼────────────┘              └───────────┼────────────┘   │
│               │                                       │                │
│               └───────────────┐       ┌───────────────┘                │
│                               ▼       ▼                                │
│                         Local Port: 9223, 9224...                      │
│                               ▲                                        │
│                               │ (CDP / Socket.IO)                      │
│  ┌────────────────────────────┼─────────────────────────────────────┐  │
│  │ DOCKER CONTAINER (stc-v3)  │ [network_mode: "host"]              │  │
│  │                            ▼                                     │  │
│  │                  ┌──────────────────┐                            │  │
│  │                  │   pipeline.py    │                            │  │
│  │                  │ (Backend Engine) │                            │  │
│  │                  └────────┬─────────┘                            │  │
│  │                           ▼                                      │  │
│  │                 Google Veo API (POST)                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
## 3. THÔNG SỐ CẤU HÌNH KIỂM SOÁT ĐA LUỒNG (MULTI-WORKER CONTROL)
Để chạy được số lượng lớn Worker (Mass Accounts) trên máy thật mà không gây sập CPU/RAM hoặc rác màn hình của khách, hệ thống áp dụng các tham số dòng lệnh (Flags) tối ưu:

- `--user-data-dir="C:\STC_Profiles\account_id"`: Tách biệt hoàn toàn cookie, session và cache giữa các worker.
- `--window-position=-2000,-2000`: Đẩy toàn bộ cửa sổ Chrome ra ngoài vùng hiển thị của màn hình thật. Chrome vẫn ăn GPU/Canvas thật để bypass WAF nhưng tàng hình đối với người dùng.
- `--window-size=10,10`: Thu nhỏ tối đa kích thước bề mặt render đồ họa để giải phóng dung lượng RAM RAM thừa.

## 4. CHIẾN THUẬT BẢO MẬT & CHỐNG ĂN CẮP CORE EXTENSION (ANTI-THEFT SPEC)
Nghiêm cấm xuất thô Token Captcha ra cổng kết nối. Extension phải được biến thành một "Xác không hồn" thông qua cơ chế Mã hóa 2 chiều:

1. Obfuscation: Toàn bộ file JavaScript (`injected.js`, `background.js`) phải được nén xáo trộn mã qua `javascript-obfuscator` cấp độ cao nhất dính kèm cờ `selfDefending` và `domainLock` cứng tại `labs.google`.
2. Khóa mã Token (Challenge-Response Handshake):
   - Bước 1: Extension trên máy thật gọi `grecaptcha.enterprise.execute` bốc Token sạch.
   - Bước 2: Extension lấy mã `License_Key` (được cấu hình riêng theo thiết bị) để làm mã muối (Salt), mã hóa đối xứng AES biến Token Captcha thành một chuỗi ký tự rác.
   - Bước 3: File `pipeline.py` (nằm trong Docker đã khóa bằng PyArmor) bốc chuỗi rác này về, dùng thuật toán giải mã nội bộ để khôi phục lại Token gốc mang đi gọi Google API.
   - Kết quả: Khách hàng trộm file Extension sang ứng dụng khác gọi sẽ chỉ thu được chuỗi rác vô dụng, khóa chặt rủi ro thất thoát chất xám.
