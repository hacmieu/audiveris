# Audiveris Player (alphaTab)

Frontend kiểu Guitar Pro: render + phát MusicXML / Guitar Pro bằng [`@coderline/alphatab`](https://alphatab.net/).

## Chạy

```bash
cd web
npm install
npm run dev
```

Mở http://localhost:5173 — mặc định nạp `public/scores/yeu-xa-sheet-nhac.mxl` (OMR từ Audiveris).

App có 2 chế độ, chuyển bằng nút trên thanh tiêu đề:

- **Player** — phát bản nhạc kiểu Guitar Pro (alphaTab).
- **OMR Viewer** — xem ảnh sheet gốc + overlay những gì Audiveris đã nhận dạng.

## Tính năng MVP

- Play / Pause / Stop + cursor theo nhịp
- Tempo (25%–200%)
- Loop, Metronome, Count-in
- **Tab** — bật tablature guitar chuẩn (EADGBE); MusicXML OMR không có string/fret nên app tự tính fret tối ưu ≤24
- Track list + Mute / Solo
- Mở file `.mxl` / `.musicxml` / `.gp*`

## OMR Viewer (Phase 1–3)

Hiển thị ảnh sheet + overlay Inter. Dropdown **Lớp** (Capella). Khi API chạy: **đổi TextRole**, **xóa Inter**, Undo/Redo, Save `.omr`.

```bash
# Terminal 1 — API (đọc + sửa)
./gradlew :app:run --no-daemon \
  -PcmdLineArgs="-batch,-run,org.audiveris.omr.web.OmrApiServer,/ABS/output/yeu-xa-sheet-nhac.omr"

# Terminal 2 — Web
cd web && npm run dev   # OMR Viewer: · api + Undo/Redo/Save
```

Sinh lại snapshot tĩnh:

```bash
python3 tools/omr_extract.py output/<book>.omr web/public/omr
```

## Âm thanh (SoundFont)

| File | Chất lượng | Ghi chú |
|---|---|---|
| `public/soundfont/sonivox.sf2` | Cơ bản | Đi kèm alphaTab (~1.3 MB), luôn có sẵn |
| `public/soundfont/MuseScore_General.sf3` | **Hay hơn rõ** | MuseScore General (~38 MB). **Không commit** (gitignore). |

Lấy bản HQ (một lần):

```bash
mkdir -p web/public/soundfont
curl -L -o web/public/soundfont/MuseScore_General.sf3 \
  "https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/MuseScore_General.sf3"
```

App tự chọn MuseScore General làm SoundFont **ban đầu** nếu file có mặt; nếu không thì dùng SONiVOX. (Tránh nạp lại SF sau `playerReady` — sẽ lặp vô hạn và làm nút Play chết.)

Nguồn SoundFont khác đáng thử: [FluidR3](https://member.keymusician.com/Member/FluidR3_GM/index.html), [GeneralUser GS](https://schristiancollins.com/generaluser.php) — copy `.sf2`/`.sf3` vào `public/soundfont/` rồi đổi `SOUNDFONT_HQ` trong `src/App.tsx`.

## Ghi chú

- SoundFont mặc định & font Bravura được Vite plugin `@coderline/alphatab-vite` phục vụ tại `/soundfont/` và `/font/`.
- License alphaTab: **MPL-2.0** (ghi attribution trên UI).
- Dùng `@coderline/alphatab-vite` thay vì subpath `@coderline/alphatab/vite` (package 1.8.4 thiếu file nội bộ).
- Tab từ OMR là **ước lượng guitar** (không phải fingerings gốc trên bản nhạc).
