# Quyết định FE: alphaTab cho trải nghiệm kiểu Guitar Pro

**Thời điểm**: 2026-07-26 01:03

## Quyết định

Sau khảo sát so sánh alphaTab / Soundslice / OSMD / Flat.io:

- **Bộ xuất sắc nhất (self-host, OSS) cho “FE như Guitar Pro”** = **alphaTab** (`@coderline/alphatab`, MPL-2.0, v1.8.x, cập nhật 2026-07).
- Lý do: GP3–8 + MusicXML, tab + staff, synth + tempo/loop/transpose/cursor/mixer, sync audio/video — gần bộ công cụ luyện của Guitar Pro nhất trong các toolkit web.
- **Soundslice** = lựa chọn thương mại nếu muốn UX sẵn + sync YouTube, chấp nhận SaaS.
- **OSMD** giữ vai trò “xem sheet cổ điển”; **không** đủ thay Guitar Pro.

## Hệ quả cho Audiveris

Pipeline hiện tại (`.mxl`) **khớp** alphaTab. Bước tiếp: SPIKE nạp `yeu-xa-sheet-nhac.mxl` trên trang web tối thiểu.

Chi tiết bảng so sánh: [../reports/20260726_0103-khao-sat-fe-kieu-guitar-pro.md](../reports/20260726_0103-khao-sat-fe-kieu-guitar-pro.md)  
Kế hoạch: [../plans/20260726_0103-fe-kieu-guitar-pro-alphatab.md](../plans/20260726_0103-fe-kieu-guitar-pro-alphatab.md)
