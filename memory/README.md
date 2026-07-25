# Memory — Single Source of Truth

Thư mục lưu trữ "trí nhớ" bền vững của dự án: các sự thật, trạng thái, quyết định cần ghi nhớ giữa các phiên làm việc. Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Chỉ mục trí nhớ

| Ngày giờ | Mục | Tóm tắt |
|---|---|---|
| 2026-07-26 00:43 | [**Fork + bootstrap + batch OMR OK**](20260726_0043-fork-bootstrap-batch-omr-ok.md) | **MỚI NHẤT.** Fork `hacmieu/audiveris`; JDK 25; tessdata eng+vie; batch PDF Yêu Xa → `.mxl` trong ~22s. |
| 2026-07-26 00:35 | [Fork + bootstrap (khởi động)](20260726_0035-fork-bootstrap-va-thu-omr.md) | Phiên đầu: tạo SSOT, tải PDF, phát hiện cần Java 25. |

## Sự thật cốt lõi (tra nhanh)

**Dự án**
- **Loại**: OMR — PDF/ảnh bản nhạc → `.omr` + MusicXML (`.mxl`).
- **Phiên bản đã chạy**: Audiveris **5.11.0** (commit `9e1e55cd`).
- **CLI batch**: `./gradlew :app:run -PcmdLineArgs="-batch,-transcribe,-export,-output,<ABS>,<ABS.pdf>"`

**Git**
- `hacmieu` = `git@github.com:hacmieu/audiveris.git` ← **push fork vào đây**.
- `origin` = `https://github.com/Audiveris/audiveris.git` ← upstream (fetch).

**Môi trường (macOS Apple Silicon)**
- JDK: OpenJDK **25** (`/opt/homebrew/opt/openjdk@25`) — bắt buộc (`theMinJavaVersion=25`).
- OCR: tessdata `eng` + `vie` tại `~/Library/Application Support/AudiverisLtd/audiveris/tessdata/`.
- `:app:run` cwd = `app/` → luôn dùng path tuyệt đối.

**File test**
- Drive: https://drive.google.com/file/d/13Ld-lqEXXRE6uyZFQd7nRbIJbNzCqKUd/view
- Local: `testdata/yeu-xa-sheet-nhac.pdf`
- Kết quả: `output/yeu-xa-sheet-nhac.{omr,mxl,mid,wav}` — báo cáo: [reports/20260726_0043-ket-qua-batch-omr-yeu-xa.md](../reports/20260726_0043-ket-qua-batch-omr-yeu-xa.md)

**Nghe thử (playback)**
- Chuỗi: `.mxl` → `music21` → `.mid` → `fluidsynth` + `~/Library/Audio/Sounds/Banks/MuseScore_General.sf3` → `.wav` → `afplay`.
- Đã phát thành công 63s ([báo cáo](../reports/20260726_0050-nghe-thu-audio-yeu-xa.md)).
