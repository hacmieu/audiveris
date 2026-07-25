# Audiveris Player (alphaTab)

Frontend kiểu Guitar Pro: render + phát MusicXML / Guitar Pro bằng [`@coderline/alphatab`](https://alphatab.net/).

## Chạy

```bash
cd web
npm install
npm run dev
```

Mở http://localhost:5173 — mặc định nạp `public/scores/yeu-xa-sheet-nhac.mxl` (OMR từ Audiveris).

## Tính năng MVP

- Play / Pause / Stop + cursor theo nhịp
- Tempo (25%–200%)
- Loop, Metronome, Count-in
- **Tab** — bật tablature guitar chuẩn (EADGBE); MusicXML OMR không có string/fret nên app tự tính fret tối ưu ≤24
- Track list + Mute / Solo
- Mở file `.mxl` / `.musicxml` / `.gp*`

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

App tự nâng cấp lên MuseScore General khi file có mặt; nếu không thì giữ SONiVOX.

Nguồn SoundFont khác đáng thử: [FluidR3](https://member.keymusician.com/Member/FluidR3_GM/index.html), [GeneralUser GS](https://schristiancollins.com/generaluser.php) — copy `.sf2`/`.sf3` vào `public/soundfont/` rồi đổi `SOUNDFONT_HQ` trong `src/App.tsx`.

## Ghi chú

- SoundFont mặc định & font Bravura được Vite plugin `@coderline/alphatab-vite` phục vụ tại `/soundfont/` và `/font/`.
- License alphaTab: **MPL-2.0** (ghi attribution trên UI).
- Dùng `@coderline/alphatab-vite` thay vì subpath `@coderline/alphatab/vite` (package 1.8.4 thiếu file nội bộ).
- Tab từ OMR là **ước lượng guitar** (không phải fingerings gốc trên bản nhạc).
