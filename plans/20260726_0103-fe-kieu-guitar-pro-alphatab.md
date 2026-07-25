# FE kiểu Guitar Pro — kế hoạch chốt alphaTab

**Trạng thái**: 🟢 SPIKE 1–3 XONG (player đã chạy) · bước 4 (editor) còn lại  
**Thời điểm**: 2026-07-26 01:03 → cập nhật 01:16

## Mục tiêu

Giao diện web đủ công cụ **chơi / luyện** bản nhạc sau OMR (Audiveris), gần trải nghiệm Guitar Pro: hiển thị staff (+ tab nếu có), phát nhạc, cursor, tempo, loop, metronome, mixer track.

## Quyết định đề xuất

| Lớp | Công nghệ |
|---|---|
| Player / engraving | **`@coderline/alphatab`** (MPL-2.0) + `@coderline/alphatab-vite` |
| UI shell | Vite + React + TypeScript (`web/`) |
| Nguồn dữ liệu MVP | MusicXML `.mxl` từ Audiveris |
| Dự phòng SaaS | Soundslice Embed nếu cần UX học guitar sẵn + video sync |

## Các bước

| # | Bước | Verify |
|---|---|---|
| 1 | SPIKE: alphaTab load `yeu-xa-sheet-nhac.mxl` | ✅ Cursor + play |
| 2 | Controls: play/pause, tempo, loop, metronome | ✅ (+ count-in) |
| 3 | Track mixer (mute/solo) | ✅ |
| 4 | Quyết định editor (Flat vs tự build) sau MVP | ⬜ |

## Báo cáo liên quan

- [Khảo sát](../reports/20260726_0103-khao-sat-fe-kieu-guitar-pro.md)
- [Triển khai](../reports/20260726_0116-trien-khai-alphatab-player.md)
