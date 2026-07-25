# P2 — JVM OmrApiServer + lớp Capella · HOÀN THÀNH

**Thời điểm**: 2026-07-26 02:21
**Trạng thái**: ✅ ĐẠT Check P2 (+ lộ TextRole ra viewer)

## Trả lời Capella (xem thêm memory)

Có thể tách nhạc vs text giống Capella. Audiveris dùng `Inter.type` + `TextRole` trên sentence; GUI desktop đã có combo gán lại role. Viewer web có dropdown **Lớp**.

## Đã làm (Do)

### Capella UX trên viewer
- `tools/omr_extract.py` thêm `role`, `value`.
- `OmrViewer`: lọc Lớp = all / music / text / lyrics / chords / title / direction; text box nét đứt; panel hiện Value + Role.
- Ưu tiên nạp từ `/api/sheet/1/data` (P2), fallback file tĩnh P1.

### JVM API (P2) — không thêm module Javalin
Dùng **`RunClass` + JDK `HttpServer`** (điểm móc CLI `-run` sẵn có):

`app/src/main/java/org/audiveris/omr/web/OmrApiServer.java`

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@25
export PATH="$JAVA_HOME/bin:$PATH"
export TESSDATA_PREFIX="$HOME/Library/Application Support/AudiverisLtd/audiveris/tessdata"
./gradlew :app:run --no-daemon \
  -PcmdLineArgs="-batch,-run,org.audiveris.omr.web.OmrApiServer,/ABS/output/yeu-xa-sheet-nhac.omr"
# Port: -Domr.api.port=8080 (mặc định 8080)
```

Endpoints: `/api/health`, `/api/book`, `/api/sheet/{n}/data|inters|relations|image`.
Vite proxy `/api` → `127.0.0.1:8080`.

## Check

| Tiêu chí | Kết quả |
|---|---|
| `GET /api/sheet/1/inters` length | ✅ **857** |
| relations | ✅ **831** |
| image PNG | ✅ 2480×3506, 129770 bytes |
| cùng id với extract tĩnh | ✅ 0 chỉ ở một phía |
| bounds/type khớp tuyệt đối | ⚠️ 69 stem lệch 1–2px (live `getBounds` vs JAXB) — chấp nhận được P2 |
| Viewer hiện `· api` | ✅ |
| Lớp Text = 197, Nhạc = 660 | ✅ |
| Không mở Swing | ✅ `-batch` + headless HttpServer |

## Phát hiện thêm (OCR / role)

- Title OCR: **"Yéu Xa"** (sai dấu).
- Composer: "Vũ Cát Tường" → **"Vﬁ Cat"**.
- Hầu hết lời Việt bị gán `TextRole.Direction` (36) thay vì `Lyrics` (chỉ 2 lyric-line). → Việc sửa role kiểu Capella sẽ rất hữu ích ở P3+.

## Giới hạn P2

- Chỉ đọc. Chưa remove / assign / undo.
- Server giữ process bằng `Thread.join()` — dừng bằng Ctrl+C / kill.
- Bounds live có thể lệch vài pixel so với XML.

## Bàn giao P3

Kế tiếp: mutate qua `UITask` / `InterController` (remove, assign shape, **đổi TextRole**). Xem [plans/20260726_0221-p3-sua-inter.md](../plans/20260726_0221-p3-sua-inter.md).
