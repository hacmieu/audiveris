# Kế hoạch P2 — JVM service đọc Book (+ bàn giao)

**Trạng thái**: ⬜ CHƯA BẮT ĐẦU
**Thời điểm**: 2026-07-26 02:10
**Tiền đề**: [P1 đã xong](../reports/20260726_0210-p1-omr-overlay-viewer.md) · [kế hoạch tổng 7 phase](20260726_0156-port-gui-web.md)

---

## A. BÀN GIAO — đọc phần này trước nếu bạn là agent mới

### Đang ở đâu

Port Audiveris GUI (Java Swing) → web, chiến lược **A: web UI mỏng + JVM edit-service** (lý do & so sánh: [report khả thi](../reports/20260726_0156-port-gui-web.md)). Chia 7 phase, **P1 xong**, P2 là phase kế.

### Những gì đã có trong repo

| Đường dẫn | Vai trò |
|---|---|
| `tools/omr_extract.py` | `.omr` → `sheet-N.png` + `sheet-N.json` (inters/relations) |
| `web/src/OmrViewer.tsx` / `.css` | Giao diện xem overlay (read-only) |
| `web/src/App.tsx` | State `mode: 'player' \| 'omr'`, 2 nút chuyển trên topbar |
| `web/public/omr/yeu-xa-sheet-nhac/` | Dữ liệu đã sinh sẵn (đã commit, 308 KB) |
| `web/public/scores/yeu-xa-sheet-nhac.mxl` | MusicXML để player phát |

### Chạy lại môi trường

```bash
# Web
cd web && npm install && npm run dev          # http://localhost:5173

# Audiveris (JDK 25 bắt buộc)
export JAVA_HOME=/opt/homebrew/opt/openjdk@25
export PATH="$JAVA_HOME/bin:$PATH"
export TESSDATA_PREFIX="$HOME/Library/Application Support/AudiverisLtd/audiveris/tessdata"

# GUI desktop trên file đã transcribe
./gradlew :app:run --no-daemon -PcmdLineArgs="/ABS/output/yeu-xa-sheet-nhac.omr"

# Batch lại từ PDF
./gradlew :app:run --no-daemon \
  -PcmdLineArgs="-batch,-transcribe,-export,-output,/ABS/output,/ABS/testdata/yeu-xa-sheet-nhac.pdf"
```

⚠️ `:app:run` chạy với cwd = `app/` → **luôn dùng path tuyệt đối**.
⚠️ `output/` bị gitignore → `.omr` không có trong repo, phải batch lại nếu clone mới.

### Sự thật kỹ thuật đã xác minh

- `.omr` = ZIP: `book.xml` + `sheet#N/sheet#N.xml` (JAXB) + `sheet#N/BINARY.png`.
- XML: `system[@id] → sig → inters/* → bounds(x,y,w,h)`; `sig → relations/relation[@source,@target]` với **type = tên thẻ con**.
- Sheet 1 của Yêu Xa: 2480×3506 px, **857 inters**, **831 relations**. Mọi Inter đều có bounds.
- Toạ độ bounds = pixel ảnh BINARY → overlay không cần quy đổi (đã verify pixel-perfect ở zoom 100%).
- Engine chạy headless được; **không có REST API** trong cây Java.
- Class then chốt: `sheet/Book.java`, `sheet/BookManager.java` (impl `OmrEngine`), `sheet/Sheet.java`, `sig/SIGraph.java`, `sig/inter/Inter.java`, `sig/ui/InterController.java` (2690 dòng, `@UIThread`), `sig/ui/UITask*.java`, `sig/ui/TaskHistory.java`, `sheet/symbol/InterFactory.java`, `score/ScoreExporter.java`, `CLI.java` (có `-run <RunClass>`).

---

## B. PDCA cho P2

### PLAN

Dựng một JVM service **chỉ đọc**, thay thế đúng vai trò của `omr_extract.py`, để P3 có chỗ gắn thao tác sửa.

Vì sao cần: script Python đọc XML tĩnh, không thể chạy `UITask` hay `Book.export`. Muốn sửa thì phải có tiến trình JVM giữ `Book` trong bộ nhớ.

**Chọn kỹ thuật**: Javalin (nhúng gọn, ít cấu hình) trong module Gradle mới `server/`, phụ thuộc `:app` như thư viện. Cân nhắc thay thế: viết một `RunClass` cho `CLI -run` nếu không muốn thêm module.

### DO

| # | Việc |
|---|---|
| 1 | Tạo module `server/` (`build.gradle`, phụ thuộc `project(':app')` + Javalin) |
| 2 | Khởi động: `BookManager` load `.omr` theo path truyền vào, giữ trong bộ nhớ |
| 3 | `GET /api/book` → metadata + danh sách sheet |
| 4 | `GET /api/sheet/{n}/inters` → JSON **đúng schema P1** (`id,type,shape,grade,ctxGrade,staff,system,x,y,w,h`) |
| 5 | `GET /api/sheet/{n}/relations` → `{source,target,type}` |
| 6 | `GET /api/sheet/{n}/image` → PNG |
| 7 | Vite proxy `/api` → cổng server; `OmrViewer.tsx` đọc từ API thay vì file tĩnh (giữ fallback file tĩnh) |

### CHECK

- [ ] `curl localhost:<port>/api/sheet/1/inters | jq length` → **857**
- [ ] So khớp JSON từ API với `web/public/omr/yeu-xa-sheet-nhac/sheet-1.json` — cùng id, cùng bounds (diff rỗng sau khi sort theo id)
- [ ] OmrViewer chạy trên API cho hình y hệt P1
- [ ] Server khởi động không cần `DISPLAY`, không mở cửa sổ Swing nào

### ACT

- Nếu load `Book` kéo theo khởi tạo Swing → khoanh vùng chỗ nào chạm `OMR.gui`, dùng headless mode (`-Djava.awt.headless=true`) và ghi lại chỗ vướng cho P3.
- Nếu bounds từ API lệch so với XML → dừng, đối chiếu `Inter.getBounds()` với giá trị đã serialize trước khi đi tiếp.

---

## C. Không làm trong P2

Không sửa, không undo/redo, không export, không palette. Chỉ đọc — để chứng minh JVM service dựng lại được đúng dữ liệu P1 trước khi tin nó vào việc mutate.
