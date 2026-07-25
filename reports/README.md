# Reports — Single Source of Truth

Thư mục chứa các báo cáo phân tích/điều tra. Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Danh sách báo cáo

| Ngày giờ | Báo cáo | Tóm tắt |
|---|---|---|
| 2026-07-26 00:43 | [**✅ Kết quả batch OMR Yêu Xa**](20260726_0043-ket-qua-batch-omr-yeu-xa.md) | **MỚI NHẤT.** Audiveris 5.11.0 + JDK 25 batch OK trong ~22s → `.omr` + `.mxl` (30 measures, 140 notes). OCR lời Việt còn lỗi. Artifact: [artifacts/yeu-xa-sheet-nhac.mxl](artifacts/yeu-xa-sheet-nhac.mxl). |

## Kết luận nổi bật

1. Repo gốc: [Audiveris/audiveris](https://github.com/Audiveris/audiveris) — fork: [hacmieu/audiveris](https://github.com/hacmieu/audiveris).
2. Bản `master` yêu cầu **Java 25** (`theMinJavaVersion`).
3. `:app:run` cwd = `app/` → phải truyền **đường dẫn tuyệt đối** cho input/output.
4. Batch OMR PDF "Yêu Xa" **thành công**; MusicXML có 1 part / 30 measures / 140 notes.
5. OCR `vie` nhận lời kém → cần post-edit hoặc tinh chỉnh language/font nếu ưu tiên lời.
