# Memory — Single Source of Truth

Thư mục lưu trữ "trí nhớ" bền vững của dự án: các sự thật, trạng thái, quyết định cần ghi nhớ giữa các phiên làm việc. Định dạng file: `YYYYMMDD_HHMM-[Nội dung].md`.

## Chỉ mục trí nhớ

| Ngày giờ | Mục | Tóm tắt |
|---|---|---|
| 2026-07-26 22:35 | [**Library MVP xong**](20260726_2235-library-20k-xong.md) | **MỚI NHẤT.** Catalog SQLite + `tools/library.py` + tab Thư viện trên web (hướng 20k bản). Fix crash `beats` (mxl gộp music21). Bài Yêu Em: OMR 5 mvt + WAV 42s. |
| 2026-07-26 06:19 | [P6 xong — thêm Inter](20260726_0619-p6-them-inter-xong.md) | Palette "+ Thêm" → click bản nhạc đặt ký hiệu/nốt. `POST /inter` + `AdditionTask`. Check: add NOTEHEAD/G_CLEF, undo về 856. |
| 2026-07-26 02:28 | [P3 xong — sửa Inter](20260726_0228-p3-sua-inter-xong.md) | Xóa/đổi role/undo/save từ web. Book: 856 inters, Ballade→Lyrics. |
| 2026-07-26 02:21 | [Capella: phân lớp nhạc/text](20260726_0221-capella-phan-lop-nhac-text.md) | Audiveris = Inter type + TextRole. Yêu Xa: 660 nhạc / 197 text; lời hay bị Direction. |
| 2026-07-26 01:56 | [Port GUI → Web (PDCA)](20260726_0156-port-gui-web.md) | Chốt chiến lược A: web mỏng + JVM edit-service bọc `Book`/`SIGraph`/`UITask`. `.omr`=ZIP(book.xml+sheet#N.xml+BINARY.png); Inter có shape/grade/bounds. 7 phase. |
| 2026-07-26 01:48 | [GUI + tích hợp web](20260726_0148-gui-va-tich-hop-web.md) | Đã mở Audiveris GUI trên `.omr` Yêu Xa. Tích hợp = chia vai trò (GUI sửa / web nghe), không nhúng Swing vào browser. |
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
- 3 chế độ: **Player** (phát) · **OMR Viewer** (xem/sửa nhận dạng) · **Thư viện** (catalog).
- ⚠️ **Không** gộp `.mxl` bằng music21 để phát trên alphaTab (crash `beats`) — dùng export chuẩn Audiveris.

**Thư viện bản nhạc (hướng ~20k)** 📚
- Catalog: `library/catalog.db` (SQLite) · PDF `library/pdfs/` · artifacts `library/works/<slug>/`.
- CLI: `python3 tools/library.py ingest|adopt|process|status|list|export-index`.
- Web đọc `web/public/library/index.json` (chạy `export-index` sau khi catalog đổi).
- Scale plan: [reports/20260726_2235-library-20k-mvp.md](../reports/20260726_2235-library-20k-mvp.md).

**Port GUI → Web** 🔬
- Chiến lược **A**: web mỏng + JVM edit-service. 7 phase PDCA, **P1–P3 + P6 xong**.
- **Capella**: tách nhạc/text + đổi `TextRole`; **xóa** Inter (P3) & **thêm** Inter (P6); Undo/Redo; Save `.omr`.
- API: `OmrApiServer` → `:8080/api/…` (GET + DELETE inter + **POST /inter** thêm + POST role/undo/redo/save)
- **Thêm (P6):** `POST /api/sheet/{n}/inter {shape,x,y}` → `createManual`+`searchLinks`+`AdditionTask`.
- Book Yêu Xa: **856** inters; `#3143` Lyrics; `#1269` đã xóa.
- **Bàn giao / bước kế**: [plans/20260726_0619-p6-them-inter.md](../plans/20260726_0619-p6-them-inter.md) (còn P4/P5/P7).
