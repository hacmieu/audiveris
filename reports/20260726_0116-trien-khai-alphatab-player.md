# Triển khai alphaTab player

**Thời điểm**: 2026-07-26 01:16  
**Trạng thái**: ✅ SPIKE ĐẠT — render + play trên trình duyệt

## Đã làm

- App `web/` (Vite + React + TypeScript + `@coderline/alphatab` 1.8.4 + `@coderline/alphatab-vite`)
- Nạp mặc định `public/scores/yeu-xa-sheet-nhac.mxl` (OMR Audiveris)
- Controls: Play/Pause/Stop, Tempo, Loop, Metronome, Count-in, Mute/Solo track, mở file GP/MusicXML
- Xác minh trình duyệt: tiêu đề **Yéu Xa**, track **Voice**, playback `00:05 / 01:00`, cursor highlight measure

## Chạy

```bash
cd web && npm install && npm run dev
# http://localhost:5173/
```

## Ghi chú kỹ thuật

- Plugin Vite: import từ `@coderline/alphatab-vite` (subpath `@coderline/alphatab/vite` bị thiếu file trong package 1.8.4).
- SoundFont `/soundfont/sonivox.sf2` + font Bravura `/font/` do plugin copy.
- OCR lời Việt vẫn lỗi như bản OMR gốc — không liên quan player.

## Artifact / path

- Code: `web/src/App.tsx`, `web/README.md`
- Score: `web/public/scores/yeu-xa-sheet-nhac.mxl`
