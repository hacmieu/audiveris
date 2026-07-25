# P1 — OMR Overlay Viewer (read-only) · HOÀN THÀNH

**Thời điểm**: 2026-07-26 02:10
**Trạng thái**: ✅ ĐẠT toàn bộ tiêu chí Check
**Phase**: 1/7 của [kế hoạch port GUI → web](../plans/20260726_0156-port-gui-web.md)

## Mục tiêu P1

Chứng minh dữ liệu OMR trong `.omr` đủ để dựng lại giao diện xem trên web: ảnh sheet + hộp bao từng Inter, toạ độ khớp, click ra thông tin. **Không** sửa, **không** server.

## Đã làm (Do)

### 1. `tools/omr_extract.py` — trích dữ liệu từ `.omr`

Python stdlib (zipfile + ElementTree + struct), không thêm dependency.

```bash
python3 tools/omr_extract.py output/yeu-xa-sheet-nhac.omr web/public/omr
# sheet 1: 2480x3506px, 857 inters, 831 relations
```

Sinh ra `web/public/omr/<book>/`:

| File | Nội dung |
|---|---|
| `sheet-1.png` | `sheet#1/BINARY.png` lấy nguyên từ `.omr` |
| `sheet-1.json` | `{book, sheet, image, width, height, inters[], relations[]}` |
| `index.json` | manifest các sheet |

Schema một Inter (toạ độ = pixel ảnh, không cần quy đổi):

```json
{"id":2,"type":"barline","shape":"THIN_BARLINE","grade":0.79,"ctxGrade":0.79,
 "staff":1,"system":1,"x":1118,"y":378,"w":3,"h":93}
```

Relation: `{"source":199,"target":201,"type":"time-top-bottom"}` — **type là tên thẻ con** của `<relation>` trong XML, không phải attribute.

Đường đi trong `sheet#N.xml`: `system[@id] → sig → inters/* → bounds` và `sig → relations/relation`.

### 2. `web/src/OmrViewer.tsx` + `.css` — giao diện xem

- Ảnh nền + 857 hộp `position:absolute` scale theo zoom (nhân toạ độ gốc với `zoom`, không dùng `transform`, nên click chính xác).
- Màu theo `grade`: đỏ <0.5 · cam <0.7 · xanh ≥0.7.
- Zoom −/+ / Vừa khung / 100%; bật-tắt overlay.
- Lọc theo **loại** Inter (26 loại) và theo **grade ≤ ngưỡng**.
- Panel phải: shape, grade, ctx-grade, system/staff, bounds, danh sách relation (bấm để nhảy sang Inter kia).

### 3. Nối vào app

`src/App.tsx` thêm state `mode: 'player' | 'omr'` + 2 nút trên topbar. Player **không bị unmount** khi sang OMR Viewer (chỉ `hidden`) → không phải nạp lại SoundFont 38 MB.

## Kiểm chứng (Check)

| Tiêu chí | Kết quả |
|---|---|
| Overlay khớp ký hiệu ở mức "vừa khung" | ✅ hộp bám đúng nốt / lời / hợp âm |
| Overlay khớp ở zoom 100% | ✅ **pixel-perfect** — khoá Sol, đầu nốt, chữ "Ballade", "Sương đã ngủ" |
| Số hộp = số Inter có bounds | ✅ **857 / 857**, 831 relation |
| Click ra đúng dữ liệu | ✅ `word #3133`, TEXT, grade 0.63, bounds x1243 y181 152×65, relation ← `sentence #3132` (containment) |
| Lọc grade | ✅ `grade ≤ 0.60` → còn **90 / 857** |
| `npm run lint` + `npm run build` | ✅ sạch (chỉ còn cảnh báo alphaTab có sẵn) |

Kiểm tra bằng browser thật trên http://localhost:5173/ (Vite dev).

## Phát hiện đáng giá

**Lỗi OMR tập trung ở lời tiếng Việt có dấu.** Lọc `grade ≤ 0.6` cho 90 Inter, phần lớn là `word`/`lyric-item`: *đã, ngủ, Đọng, lại, trên, rất, chưa, nhói, Giữa, mùa, lẽ, trôi, nghĩ, về, Từng, đêm, hình, đôi, Bàn, khẽ, mãi, ngời, chất, chứa, yêu, Thời, nắng, Khoảng, cách, giết, phút, giây*.

Ngoài ra có các Inter gần chắc chắn là **false positive** trên một bản ballad lead sheet:

| Inter | Grade | Nhận xét |
|---|---|---|
| `head NOTEHEAD_BLACK` | **0.179** | thấp bất thường |
| `dynamics DYNAMICS_SF` | 0.232 | bản này không có ký hiệu sf |
| `dynamics DYNAMICS_P` | 0.268 | — |
| `articulation STACCATO` | 0.347 | — |
| `dynamics DYNAMICS_PPP` | 0.366 | — |
| `ornament TR` | 0.464 | — |

→ Đây chính là danh sách việc cần sửa cho các phase sau, và cũng xác nhận cách tiếp cận "dùng grade để chỉ ra chỗ máy đoán bừa" là đúng hướng (giống thao tác soát lỗi trong Capella Scan).

## Giới hạn hiện tại

- Chỉ đọc. Sửa Inter phải làm ở P3 (cần JVM service).
- Dữ liệu là snapshot tĩnh — sửa trong Audiveris GUI xong phải chạy lại `omr_extract.py`.
- Hard-code 1 book / sheet 1 (`BOOK_DIR` trong `OmrViewer.tsx`).
- Chưa vẽ đường relation trên ảnh (mới liệt kê ở panel).

Bước tiếp: [P2 — JVM edit-service](../plans/20260726_0210-p2-jvm-edit-service.md)
