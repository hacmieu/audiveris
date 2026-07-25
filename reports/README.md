# Reports — Single Source of Truth

Thư mục chứa các báo cáo phân tích/điều tra. Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Danh sách báo cáo

| Ngày giờ | Báo cáo | Tóm tắt |
|---|---|---|
| 2026-07-26 01:03 | [**🎸 Khảo sát FE kiểu Guitar Pro**](20260726_0103-khao-sat-fe-kieu-guitar-pro.md) | **MỚI NHẤT.** So sánh alphaTab / Soundslice / OSMD / Flat → **chốt alphaTab** (OSS, gần GP nhất). Soundslice = SaaS. OSMD không đủ. |
| 2026-07-26 00:50 | [**✅ Nghe thử audio Yêu Xa**](20260726_0050-nghe-thu-audio-yeu-xa.md) | `.mxl` → MIDI (music21) → WAV 63s (fluidsynth) → `afplay`. |
| 2026-07-26 00:43 | [**✅ Kết quả batch OMR Yêu Xa**](20260726_0043-ket-qua-batch-omr-yeu-xa.md) | Audiveris 5.11.0 + JDK 25 ~22s → `.omr` + `.mxl` (30 measures, 140 notes). Artifact: [artifacts/yeu-xa-sheet-nhac.mxl](artifacts/yeu-xa-sheet-nhac.mxl). |

## Kết luận nổi bật

1. Fork: [hacmieu/audiveris](https://github.com/hacmieu/audiveris) · cần **Java 25**.
2. Batch OMR PDF "Yêu Xa" thành công; OCR lời Việt còn lỗi.
3. Playback CLI đã chứng minh (WAV 63s).
4. **FE kiểu Guitar Pro → alphaTab** (`@coderline/alphatab`, MPL-2.0): GP + MusicXML + player đầy đủ. OSMD chỉ phù hợp sheet xem/nghe cơ bản.
