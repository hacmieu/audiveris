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
- Track list + Mute / Solo
- Mở file `.mxl` / `.musicxml` / `.gp*`

## Ghi chú

- SoundFont & font Bravura được Vite plugin `@coderline/alphatab-vite` phục vụ tại `/soundfont/` và `/font/`.
- License alphaTab: **MPL-2.0** (ghi attribution trên UI).
- Dùng `@coderline/alphatab-vite` thay vì subpath `@coderline/alphatab/vite` (package 1.8.4 thiếu file nội bộ).
