# Plans — Single Source of Truth

Thư mục chứa các kế hoạch công việc (đề xuất / đang làm / đã xong). Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Kế hoạch đang hoạt động

| Ngày giờ | Kế hoạch | Trạng thái | Tóm tắt |
|---|---|---|---|
| 2026-07-26 00:35 | [Bootstrap Audiveris + thử PDF Yêu Xa](20260726_0035-bootstrap-va-thu-pdf-yeu-xa.md) | ✅ **XONG** | Fork + JDK 25 + batch OMR PDF Drive đã hoàn tất ([báo cáo](../reports/20260726_0043-ket-qua-batch-omr-yeu-xa.md)). |

## Tiến độ phiên này

| Hạng mục | Trạng thái |
|---|---|
| Fork GitHub `hacmieu/audiveris` | ✅ Đã có sẵn |
| Remote `hacmieu` trỏ fork | ✅ |
| Tải PDF test từ Drive | ✅ `testdata/yeu-xa-sheet-nhac.pdf` |
| Cài OpenJDK 25 | ✅ 25.0.4 |
| Cài tessdata eng+vie | ✅ |
| Build Gradle + batch transcribe/export | ✅ ~22s → `.mxl` |
| Ghi memory/plans/reports + push | 🔄 |

## Việc tiếp theo (gợi ý)

- Post-edit MusicXML / cải thiện OCR lời Việt.
- (Tuỳ nhu cầu) So sánh với pipeline `oemer` trên cùng file.
- GUI interactive: `./gradlew :app:run` không `-batch`.
