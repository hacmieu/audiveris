# ✅ OMR Viewer multi-book — nối catalog ↔ sửa OMR

**Ngày giờ:** 2026-07-26 23:08

## Vấn đề
OMR Viewer cứng vào 1 `.omr` (Yêu Xa). Thư viện/`catalog.db` đã có nhiều bài nhưng không đổi được trong viewer.

## Do
1. **API** (`OmrApiServer`):
   - `GET /api/books` — liệt kê `library/works/<slug>/<slug>.omr`
   - `POST /api/book/open` `{"slug":"…","force":true}` — `Book.loadBook`, clear undo, preload sheets
   - Dirty book: từ chối trừ khi `force:true` (boolean parser mới)
2. **export-index**: thêm `omr: true/false`
3. **Library**: cột + nút **Sửa OMR** → `onEditOmr(slug)`
4. **OmrViewer**: dropdown **Bài** + **Trang** (multi-sheet); nhận `requestedSlug` từ App

## Check
| Test | Kết quả |
|---|---|
| `GET /api/books` | 2 books (Yêu Em, Yêu Xa) |
| open Yêu Em (force) | sheets 1+2, inters 614 / 226 |
| open Yêu Xa | sheet 1, inters 856 |
| Thư viện → Sửa OMR Yêu Em | Bài=Yêu Em, Trang 1/2, 614 |
| Dropdown → Yêu Xa | 856, không còn Trang |

## Cách chạy
```bash
OMR=…/library/works/yeu-xa-sheet-nhac/yeu-xa-sheet-nhac.omr
./gradlew :app:run --no-daemon \
  -PcmdLineArgs="-batch,-run,org.audiveris.omr.web.OmrApiServer,${OMR}"
# worksDir tự suy từ path hoặc ../library/works
```
