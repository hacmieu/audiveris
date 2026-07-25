# Audiveris GUI + tích hợp web

**Thời điểm**: 2026-07-26 01:48

## Đã làm

- Launch GUI: `./gradlew :app:run -PcmdLineArgs="<ABS>/output/yeu-xa-sheet-nhac.omr"` (không `-batch`).
- Web player riêng: `cd web && npm run dev` → :5173.

## Quyết định

**Không** nhúng Audiveris Swing GUI vào React. Tích hợp = chia vai trò:

1. **Audiveris GUI** — sửa OMR (Inter/Relation), re-run step, train sample.
2. **Web alphaTab** — phát / luyện / tab sau khi có `.mxl`.

Chi tiết: [../reports/20260726_0148-gui-va-tich-hop-web.md](../reports/20260726_0148-gui-va-tich-hop-web.md)
