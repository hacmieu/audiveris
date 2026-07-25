# Capella + P2 xong

**Thời điểm**: 2026-07-26 02:21

## Capella
**Có** — Audiveris tách nhạc/text qua Inter type + `TextRole`. Viewer có lớp Nhạc/Text/Lời/Hợp âm/Tiêu đề. Trên Yêu Xa: 660 nhạc, 197 text; lời Việt hay bị gán `Direction` thay vì `Lyrics`.

## P2
`OmrApiServer` (RunClass + JDK HttpServer) phục vụ Book live. Check: 857/831, PNG OK, viewer hiện `· api`. Không dùng Javalin/module mới.

## Kế tiếp
[P3 — sửa Inter](../plans/20260726_0221-p3-sua-inter.md): remove + đổi TextRole (+ save/undo).

Chi tiết: [report](../reports/20260726_0221-p2-omr-api-va-lop-capella.md) · [memory Capella](20260726_0221-capella-phan-lop-nhac-text.md)
