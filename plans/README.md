# Plans — Single Source of Truth

Thư mục chứa các kế hoạch công việc (đề xuất / đang làm / đã xong). Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Kế hoạch đang hoạt động

| Ngày giờ | Kế hoạch | Trạng thái | Tóm tắt |
|---|---|---|---|
| 2026-07-26 01:03 | [**FE kiểu Guitar Pro — alphaTab**](20260726_0103-fe-kieu-guitar-pro-alphatab.md) | 🟡 ĐỀ XUẤT | Chốt alphaTab; bước tiếp = SPIKE nạp `.mxl` Yêu Xa trên Next.js. |
| 2026-07-26 00:35 | [Bootstrap Audiveris + thử PDF Yêu Xa](20260726_0035-bootstrap-va-thu-pdf-yeu-xa.md) | ✅ **XONG** | Fork + JDK 25 + batch OMR PDF Drive đã hoàn tất ([báo cáo](../reports/20260726_0043-ket-qua-batch-omr-yeu-xa.md)). |

## Tiến độ phiên bootstrap (đã xong)

| Hạng mục | Trạng thái |
|---|---|
| Fork GitHub `hacmieu/audiveris` | ✅ |
| Remote `hacmieu` trỏ fork | ✅ |
| Tải PDF test từ Drive | ✅ |
| Cài OpenJDK 25 + tessdata | ✅ |
| Batch transcribe/export + nghe WAV | ✅ |
| Khảo sát FE kiểu Guitar Pro | ✅ → alphaTab |

## Việc tiếp theo

1. **SPIKE alphaTab** với `output/yeu-xa-sheet-nhac.mxl` (play + tempo + loop + cursor).
2. Post-edit MusicXML / cải thiện OCR lời Việt (song song nếu cần).
3. Editor đầy đủ (Flat / tự build) — sau MVP player.
