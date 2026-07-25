# Reports — Single Source of Truth

Thư mục chứa các báo cáo phân tích/điều tra. Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Danh sách báo cáo

| Ngày giờ | Báo cáo | Tóm tắt |
|---|---|---|
| 2026-07-26 02:10 | [**✅ P1 — OMR Overlay Viewer**](20260726_0210-p1-omr-overlay-viewer.md) | **MỚI NHẤT.** 857/857 Inter overlay khớp pixel-perfect ở 100%. Lọc grade lộ 90 chỗ đáng ngờ — đa số là lời Việt có dấu + vài false positive rõ. |
| 2026-07-26 01:56 | [Khả thi Port GUI → Web](20260726_0156-port-gui-web.md) | ~289 file Swing, không REST → không compile/không rewrite JS. Chọn A: web mỏng + JVM service tái dùng model. Bằng chứng `.omr`/Inter/bounds. |
| 2026-07-26 01:48 | [GUI + tích hợp web](20260726_0148-gui-va-tich-hop-web.md) | Đã launch Audiveris GUI. Tích hợp với alphaTab = chia vai trò qua `.mxl`, không nhúng GUI vào browser. |
| 2026-07-26 01:39 | *(xem memory)* [Fix Play — vòng lặp SoundFont](../memory/20260726_0139-fix-play-soundfont-loop.md) | Play chết do reload MuseScore SF sau mỗi `playerReady` → đã sửa. |
| 2026-07-26 01:30 | [**✅ Tab + SoundFont HQ**](20260726_0130-tab-va-soundfont-hq.md) | Nút Tab (EADGBE ước lượng). Âm thanh nâng cấp MuseScore General. |
| 2026-07-26 01:16 | [**✅ Triển khai alphaTab player**](20260726_0116-trien-khai-alphatab-player.md) | `web/` Vite+React; play Yêu Xa đã xác minh trên browser. |
| 2026-07-26 01:03 | [🎸 Khảo sát FE kiểu Guitar Pro](20260726_0103-khao-sat-fe-kieu-guitar-pro.md) | So sánh alphaTab / Soundslice / OSMD / Flat → **chốt alphaTab**. |
| 2026-07-26 00:50 | [**✅ Nghe thử audio Yêu Xa**](20260726_0050-nghe-thu-audio-yeu-xa.md) | `.mxl` → MIDI → WAV 63s → `afplay`. |
| 2026-07-26 00:43 | [**✅ Kết quả batch OMR Yêu Xa**](20260726_0043-ket-qua-batch-omr-yeu-xa.md) | Audiveris 5.11.0 ~22s → `.omr` + `.mxl`. Artifact: [artifacts/yeu-xa-sheet-nhac.mxl](artifacts/yeu-xa-sheet-nhac.mxl). |

## Kết luận nổi bật

1. Fork: [hacmieu/audiveris](https://github.com/hacmieu/audiveris) · Java 25.
2. Batch OMR + playback CLI + **FE alphaTab** đều đã chạy được với file Yêu Xa.
3. FE: `cd web && npm run dev` → http://localhost:5173/ (2 chế độ: Player · OMR Viewer).
4. Port GUI → web: chiến lược A, 7 phase PDCA, **P1/7 xong**. Bàn giao: [plans/…-p2-jvm-edit-service.md](../plans/20260726_0210-p2-jvm-edit-service.md).
5. Chất lượng OMR: điểm yếu lớn nhất là **OCR lời tiếng Việt có dấu**.
