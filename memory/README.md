# Memory — Single Source of Truth

Thư mục lưu trữ "trí nhớ" bền vững của dự án: các sự thật, trạng thái, quyết định cần ghi nhớ giữa các phiên làm việc. Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Chỉ mục trí nhớ

| Ngày giờ | Mục | Tóm tắt |
|---|---|---|
| 2026-07-26 01:48 | [**GUI + tích hợp web**](20260726_0148-gui-va-tich-hop-web.md) | **MỚI NHẤT.** Đã mở Audiveris GUI trên `.omr` Yêu Xa. Tích hợp = chia vai trò (GUI sửa / web nghe), không nhúng Swing vào browser. |
| 2026-07-26 01:39 | [Fix Play — vòng lặp SoundFont](20260726_0139-fix-play-soundfont-loop.md) | Nạp SF sau playerReady gây loop; chọn SF một lần lúc init. Play OK. |
| 2026-07-26 01:30 | [**Tab + SoundFont HQ**](20260726_0130-tab-va-soundfont-hq.md) |  Nút Tab (tuning EADGBE ước lượng từ MIDI). Âm thanh: MuseScore General.sf3 nếu có, không thì sonivox. |
| 2026-07-26 01:16 | [alphaTab player đã triển khai](20260726_0116-alphatab-player-da-trien-khai.md) | `web/` Vite+React+alphaTab; play Yêu Xa OK. `cd web && npm run dev` → :5173 |
| 2026-07-26 01:03 | [Quyết định FE = alphaTab](20260726_0103-quyet-dinh-fe-alphatab.md) | FE kiểu Guitar Pro → chốt **alphaTab** (OSS). Soundslice = SaaS dự phòng. OSMD không đủ. |
| 2026-07-26 00:43 | [Fork + bootstrap + batch OMR OK](20260726_0043-fork-bootstrap-batch-omr-ok.md) | Fork `hacmieu/audiveris`; JDK 25; tessdata eng+vie; batch PDF Yêu Xa → `.mxl` trong ~22s. |
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

**Nghe thử (playback CLI)**
- Chuỗi: `.mxl` → `music21` → `.mid` → `fluidsynth` + `~/Library/Audio/Sounds/Banks/MuseScore_General.sf3` → `.wav` → `afplay`.
- Đã phát thành công 63s ([báo cáo](../reports/20260726_0050-nghe-thu-audio-yeu-xa.md)).

**Audiveris GUI (sửa OMR)**
- Mở: `./gradlew :app:run -PcmdLineArgs="/ABS/output/yeu-xa-sheet-nhac.omr"` (không `-batch`).
- Vai trò: sửa Inter/Relation, re-run step, export `.mxl`.
- **Không** nhúng vào web — tích hợp qua file `.omr`/`.mxl` ([báo cáo](../reports/20260726_0148-gui-va-tich-hop-web.md)).

**FE player (kiểu Guitar Pro)** 🎸
- **Stack**: `web/` = Vite + React + `@coderline/alphatab`.
- **Chạy**: `cd web && npm run dev` → http://localhost:5173/
- **Tab** / **SoundFont HQ**: xem [reports/20260726_0130-…](../reports/20260726_0130-tab-va-soundfont-hq.md).
