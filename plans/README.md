# Plans — Single Source of Truth

Thư mục chứa các kế hoạch công việc (đề xuất / đang làm / đã xong). Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Kế hoạch đang hoạt động

| Ngày giờ | Kế hoạch | Trạng thái | Tóm tắt |
|---|---|---|---|
| 2026-07-26 02:21 | [**P3 — Sửa Inter** + BÀN GIAO](20260726_0221-p3-sua-inter.md) | ⬜ CHƯA BẮT ĐẦU | **Agent mới đọc file này.** Remove + đổi TextRole + save/undo qua API. |
| 2026-07-26 02:10 | [P2 — JVM edit-service](20260726_0210-p2-jvm-edit-service.md) | ✅ **XONG** | OmrApiServer (RunClass+HttpServer). Report: [../reports/20260726_0221-…](../reports/20260726_0221-p2-omr-api-va-lop-capella.md). |
| 2026-07-26 01:56 | [Port GUI → Web (kế hoạch tổng 7 phase)](20260726_0156-port-gui-web.md) | 🟢 P1/7 XONG | Chiến lược A (web mỏng + JVM edit-service). P1 overlay read-only đã đạt Check. |
| 2026-07-26 01:48 | [GUI + tích hợp web](20260726_0148-gui-va-tich-hop-web.md) | 🟢 ĐANG CHẠY | GUI đã mở trên `.omr`. Chốt: GUI sửa / web nghe — không nhúng Swing. |
| 2026-07-26 01:03 | [FE kiểu Guitar Pro — alphaTab](20260726_0103-fe-kieu-guitar-pro-alphatab.md) | 🟢 SPIKE 1–3 **XONG** | Player `web/` đã chạy. Editor đầy đủ = sau MVP. |
| 2026-07-26 00:35 | [Bootstrap Audiveris + thử PDF Yêu Xa](20260726_0035-bootstrap-va-thu-pdf-yeu-xa.md) | ✅ **XONG** | Fork + JDK 25 + batch OMR PDF Drive đã hoàn tất. |

## Tiến độ port GUI → Web (7 phase PDCA)

| Phase | Nội dung | Trạng thái |
|---|---|---|
| P1 | Overlay viewer read-only | ✅ **XONG** ([report](../reports/20260726_0210-p1-omr-overlay-viewer.md)) |
| P2 | JVM service (chỉ đọc) + lớp Capella | ✅ **XONG** ([report](../reports/20260726_0221-p2-omr-api-va-lop-capella.md)) |
| P3 | Ops sửa (remove / TextRole / assign) | ⬜ [kế hoạch](20260726_0221-p3-sua-inter.md) |
| P4 | Undo/redo + relation | ⬜ |
| P5 | Export `.mxl` → alphaTab | ⬜ |
| P6 | Palette + thêm Inter | ⬜ |
| P7 | Re-run step | ⬜ |

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

1. **P3** — remove Inter + đổi TextRole (Capella) qua API ([kế hoạch](20260726_0221-p3-sua-inter.md)).
2. Sửa false positive grade thấp + gán lại lời Việt từ Direction → Lyrics.
3. OCR lời Việt có dấu.
