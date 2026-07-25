# Kế hoạch: GUI Audiveris + web player

**Trạng thái**: 🟢 ĐANG CHẠY (GUI đã launch)  
**Thời điểm**: 2026-07-26 01:48

## Mục tiêu

1. Người dùng biết mở và sửa bằng Audiveris GUI.
2. Chốt mô hình tích hợp với `web/` alphaTab — **không nhúng GUI vào browser**.

## Quyết định tích hợp

```
[PDF] → Audiveris (batch hoặc GUI sửa .omr)
              ↓ export
           [.mxl]
              ↓
     [web/ alphaTab player]  ← nghe / luyện / tab
```

- Sửa OMR sâu → **Audiveris GUI** (desktop).
- Nghe / luyện kiểu Guitar Pro → **web player**.
- Sau này (tuỳ chọn): FastAPI bọc `gradlew :app:run -batch` + upload, giống hướng oemer.

## Việc tiếp theo

| # | Việc | Verify |
|---|---|---|
| 1 | User thử sửa vài lỗi trên GUI rồi Export `.mxl` | File mới trong output/ |
| 2 | Copy `.mxl` sang `web/public/scores/` và reload player | Nghe bản đã sửa |
| 3 | (Sau) API upload→batch→player | Endpoint trả `.mxl` |
