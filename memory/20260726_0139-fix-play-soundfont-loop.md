# Fix Play — vòng lặp SoundFont

**Thời điểm**: 2026-07-26 01:39

## Nguyên nhân

Sau `playerReady` (sonivox) app gọi `loadSoundFont(MuseScore_General)`. Mỗi lần nạp xong lại fire `playerReady` → nạp lại SF 38MB **vòng lặp** → synthesizer hỏng → bấm Play không chạy.

## Sửa

- Chọn SoundFont **một lần trước** khi tạo `AlphaTabApi` (HQ nếu có, không thì sonivox).
- Không gọi `loadSoundFont` sau `playerReady`.
- Tắt React StrictMode (tránh double-mount nạp SF hai lần).
- `playPause` kiểm tra `isReadyForPlayback`.

## Xác minh

Browser: Play → ⏸, thời gian chạy (vd. `00:15 / 01:00`), cursor di chuyển.
