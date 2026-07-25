# Tab + SoundFont HQ

**Thời điểm**: 2026-07-26 01:30

## Tab

- Nút **Tab** trên transport: bật/tắt tablature.
- MusicXML từ Audiveris **không có** string/fret → `generateTabData()` gán tuning guitar chuẩn EADGBE và chọn fret ≤24 sao cho pitch MIDI không đổi.
- Đã xác minh: hiện "Guitar Standard Tuning" + số ngăn dưới staff.

## Âm thanh

- Mặc định: `sonivox.sf2` (alphaTab).
- Nâng cấp tự động nếu có: `MuseScore_General.sf3` (~38 MB, gitignore) — tải từ ftp.osuosl.org (MuseScore).
- Footer hiện tên SoundFont đang dùng (`· MuseScore General`).

Chi tiết lệnh tải: `web/README.md`.
