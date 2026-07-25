# FE kiểu Guitar Pro — kế hoạch chốt alphaTab

**Trạng thái**: 🟡 ĐỀ XUẤT (chờ SPIKE)  
**Thời điểm**: 2026-07-26 01:03

## Mục tiêu

Giao diện web đủ công cụ **chơi / luyện** bản nhạc sau OMR (Audiveris), gần trải nghiệm Guitar Pro: hiển thị staff (+ tab nếu có), phát nhạc, cursor, tempo, loop, metronome, mixer track.

## Quyết định đề xuất

| Lớp | Công nghệ |
|---|---|
| Player / engraving | **`@coderline/alphatab`** (MPL-2.0) |
| UI shell | Next.js + TypeScript (có thể tái dùng pattern từ kế hoạch oemer web) |
| Nguồn dữ liệu MVP | MusicXML `.mxl` từ Audiveris |
| Dự phòng SaaS | Soundslice Embed nếu cần UX học guitar sẵn + video sync |

**Không** lấy OSMD làm lõi cho use case này (đã đủ cho “xem + nghe sheet”, thiếu tab/mixer/GP).

## Các bước

| # | Bước | Verify |
|---|---|---|
| 1 | SPIKE: alphaTab load `testdata`/output `yeu-xa-sheet-nhac.mxl` | Cursor + play nghe được |
| 2 | Controls: play/pause, tempo, loop, metronome | Đủ 4 nút hoạt động |
| 3 | Track mixer (nếu score đa track) | Mute/solo/volume |
| 4 | Quyết định editor (Flat vs tự build) sau MVP | Báo cáo riêng |

## Rủi ro

- MusicXML từ OMR có thể thiếu guitar tab/string → UI vẫn play được staff; tab cần dữ liệu GP hoặc annotate sau.
- alphaTab là SDK → phải tự viết chrome UI (không phải app GP clone sẵn).
- MPL-2.0: giữ license files / attribution.

## Báo cáo liên quan

- [Khảo sát đầy đủ](../reports/20260726_0103-khao-sat-fe-kieu-guitar-pro.md)
