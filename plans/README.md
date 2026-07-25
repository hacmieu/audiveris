# Plans — Single Source of Truth

Thư mục chứa các kế hoạch công việc (đề xuất / đang làm / đã xong). Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Kế hoạch đang hoạt động

| Ngày giờ | Kế hoạch | Trạng thái | Tóm tắt |
|---|---|---|---|
| 2026-07-26 01:48 | [**GUI + tích hợp web**](20260726_0148-gui-va-tich-hop-web.md) | 🟢 ĐANG CHẠY | GUI đã mở trên `.omr`. Chốt: GUI sửa / web nghe — không nhúng Swing. |
| 2026-07-26 01:03 | [FE kiểu Guitar Pro — alphaTab](20260726_0103-fe-kieu-guitar-pro-alphatab.md) | 🟢 SPIKE 1–3 **XONG** | Player `web/` đã chạy. Editor đầy đủ = sau MVP. |
| 2026-07-26 00:35 | [Bootstrap Audiveris + thử PDF Yêu Xa](20260726_0035-bootstrap-va-thu-pdf-yeu-xa.md) | ✅ **XONG** | Fork + JDK 25 + batch OMR PDF Drive đã hoàn tất. |

## Tiến độ FE alphaTab

| Hạng mục | Trạng thái |
|---|---|
| SPIKE load `.mxl` + cursor + play | ✅ |
| Controls: tempo / loop / metronome / count-in | ✅ |
| Track mixer Mute/Solo | ✅ |
| Tab (tablature) | ✅ (ước lượng EADGBE từ MIDI) |
| SoundFont HQ | ✅ MuseScore General (optional) |
| Quyết định editor (Flat vs tự build) | ⬜ sau MVP |

## Việc tiếp theo

1. (Tuỳ chọn) Polish UI / seek bar / zoom / horizontal layout.
2. Editor đầy đủ — sau MVP player.
3. Post-edit MusicXML / OCR lời Việt.
