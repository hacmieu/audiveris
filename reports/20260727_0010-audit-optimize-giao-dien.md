# Audit + optimize giao diện web (design-taste-frontend)

**Ngày:** 2026-07-27 00:10
**Phạm vi:** `web/src/` (Player, OMR Viewer, Thư viện)
**Kế hoạch:** [../plans/20260727_0005-audit-optimize-giao-dien.md](../plans/20260727_0005-audit-optimize-giao-dien.md)

## 0. Ghi chú phạm vi (quan trọng)

Skill `design-taste-frontend` **tự loại trừ** dashboard / data table / dense product UI
(mục 13 của skill). App này đúng là loại đó: workbench sửa OMR + player + bảng thư viện,
không phải landing page.

Vì vậy các luật landing-page **không áp dụng** và đã bỏ qua có chủ đích:
hero discipline, eyebrow count, marquee, logo wall, bento grid, section-layout-repetition.

Phần **có** áp dụng và đã dùng để audit: typography, color calibration, shape lock,
contrast/a11y, dark-mode protocol, motion discipline, icon policy, content density, AI tells.

**Design read:** product tool UI cho một người dùng chuyên sâu, ngôn ngữ workbench trung tính,
nền tảng = CSS thuần + CSS custom properties (không thêm design system, đúng luật "one system per project").

**Chế độ:** *Redesign - Preserve*. IA (3 chế độ) và API đang chạy tốt → tiến hóa có mục tiêu
(lever 1-4 của skill), không đập đi xây lại. Giữ nguyên teal thương hiệu, giữ nguyên nhãn nav, giữ nguyên mọi endpoint.

**Dials:** đọc được VARIANCE 2 / MOTION 1 / DENSITY 6-không-đều.
Override baseline 8/6/4 của skill (baseline đó dành cho landing page).
Chốt: **VARIANCE 2** (đối xứng là đúng cho công cụ) / **MOTION 3** (chỉ phản hồi thao tác) / **DENSITY 6** (đồng đều).

## 1. Kết quả audit: 11 lỗi có bằng chứng

| # | Lỗi | Bằng chứng trong code cũ | Luật |
|---|---|---|---|
| 1 | Serif display bị skill cấm đích danh | `--font-display: 'Fraunces'` | 4.1 |
| 2 | Palette beige+espresso nằm trong danh sách cấm | `#f5f0e8`, `#ebe4d8`, `#1c1917` | 4.2 |
| 3 | Bản nhạc trắng chìm trong nền kem, UI cạnh tranh với tài liệu | `.omr-canvas` trắng trên `--paper-deep` | 4.2 |
| 4 | Token chết | `--danger` khai báo, 0 lần dùng | DRY |
| 5 | 6 bán kính bo góc, không quy tắc | 999 / 12 / 10 / 8 / 6 / 4 / 2px | 4.4 |
| 6 | Không có `:focus-visible` nào trong toàn bộ `src/` | grep = 0 kết quả | 6 / a11y |
| 7 | Disabled `opacity: .45` trên nền tối trượt AA (~4.2:1); lúc mới tải **toàn bộ** transport ở trạng thái này | `.icon:disabled` | 4.5 |
| 8 | `transition: transform` khai báo nhưng không rule nào đổi transform | dead code, không có `:active` | 4.5 |
| 9 | Emoji làm icon UI | `♪ ⏹ ▶ ⏸` | 3.C / 3.D |
| 10 | Google Fonts qua `<link>`, chặn render | `index.html` | 3.A |
| 11 | Em-dash + `·` tràn lan trong chuỗi hiển thị | `— tắt —`, `A · B · C · dirty` | 9.F / 9.G |

Phụ: `min-height: 100vh` (phải là `100dvh`, luật 3.E); chuỗi tiếng Việt vỡ nghĩa
`"Sẵn sàng sắp xong"` (luật 4.9 copy self-audit); 7 mã màu hardcode trong thanh transport.

## 2. Đã sửa

### Typography
- Bỏ hẳn serif. Một họ chữ duy nhất: **Geist** + **Geist Mono** cho số liệu và slug.
- Self-host qua `@fontsource-variable/*`, bỏ `<link>` Google Fonts và 2 preconnect.
  Vite subset theo script: latin 29kB + vietnamese 8kB, không còn request chặn render.
- Phân cấp bằng weight + màu, không bằng đổi họ chữ.

### Màu
- Chuyển sang thang xám **achromatic** (zinc). Lý do cụ thể cho app này: giao diện bao quanh
  bản nhạc **quét**, chrome có ám màu sẽ làm lệch cách mắt đọc màu giấy của bản scan.
- Bản nhạc (`--score`) giữ trắng thật và trở thành bề mặt sáng nhất màn hình.
- Giữ nguyên teal `#0f766e` (brand fidelity, luật 11.C). Xóa `--danger` chết.
- Xóa 2 khối radial-gradient trang trí ở `body`.
- Thang màu grade (xanh/hổ phách/đỏ) giữ lại vì đó là **mã hóa dữ liệu độ tin cậy**,
  không phải trang trí; đây là ngoại lệ hợp lệ của luật 1-accent. Nền cảnh báo add-mode
  nay dùng lại đúng họ hổ phách đó thay vì màu thứ tư.

### Shape lock (có quy tắc ghi trong CSS)
`--r-pill` cho toggle/badge · `--r-control` 8px cho control · `--r-panel` 12px cho panel ·
`--r-overlay` 2px cho khung vẽ đè lên bản nhạc (giữ nhỏ để không bo tròn mất glyph).

### A11y
- Thêm `:focus-visible` toàn cục; thanh transport override `--focus-ring` sang teal sáng
  để còn nhìn thấy trên nền gần đen.
- Nút transport có `aria-label` tiếng Việt thay vì tên tính từ ký tự emoji.
- Disabled từ `opacity .45` lên `.55`.

### Motion
- Thêm `:active { translateY(1px) }` (phản hồi bấm), bọc trong `prefers-reduced-motion: no-preference`.
- Thêm khối `prefers-reduced-motion: reduce` cắt mọi transition.
- Đây là toàn bộ motion trong app: mỗi animation đều biện minh được là *phản hồi thao tác*.

### Icon
`@phosphor-icons/react`: `MusicNotes`, `Play`, `Pause`, `Stop`, `FolderOpen`, `CaretDown`.
Một họ icon duy nhất, không tự vẽ SVG.

### Layout
- Toolbar OMR trước đây là một hàng flex phẳng tự wrap thành 2 dòng **ngẫu nhiên**.
  Nay chia 2 hàng **có chủ đích**: hàng 1 = tài liệu + hành động sửa (Bài, Trang, zoom | Thêm, Undo, Redo, Lưu),
  hàng 2 = bộ lọc + số liệu (Overlay, Lớp, Loại, Grade, legend | counts).
- Cap `max-width` cho `<select>`: select không cap sẽ giãn theo `<option>` dài nhất
  và đẩy phần còn lại của toolbar xuống dòng.
- Nút "Lưu .omr" nay mang accent vì đó là hành động commit duy nhất trên toolbar.
- `100vh` → `100dvh`.
- Bảng thư viện: header sticky, một hairline mỗi dòng (không `border-t`+`border-b`), hover row.

### Copy
- Xóa toàn bộ em-dash trong chuỗi hiển thị (luật 9.G là ban tuyệt đối).
- `"Sẵn sàng sắp xong"` → `"Sắp xong"`, kèm thanh tiến trình thật cho SoundFont.
- Tách `·` chồng chất: `856 hiển thị · 828 relation · api · dirty` → các span rời,
  `dirty` → `chưa lưu` (tiếng Việt, có màu cảnh báo).
- Tên SoundFont chuyển từ dòng đồng hồ sang khối `Bộ tiếng / Engine` ở sidebar.

## 3. Check

| Hạng mục | Kết quả |
|---|---|
| `tsc -b --force` | ✅ pass |
| `oxlint` | ✅ 0 lỗi |
| `npm run build` | ✅ built in 1.07s |
| Font thực tế nạp | ✅ `"Geist Variable"` (đọc từ `getComputedStyle`) |
| `:focus-visible` live trong CSSOM | ✅ |
| `prefers-reduced-motion` live | ✅ 3 khối `no-preference` + 1 khối `reduce` |
| 3 chế độ render đúng | ✅ Player / OMR Viewer / Thư viện |

Tương phản WCAG đo trên DOM thật:

| Cặp màu | Tỷ lệ | Ngưỡng AA |
|---|---|---|
| Chip transport (bật) | 14.27:1 | 4.5 ✅ |
| Chip transport (**disabled**) | **5.36:1** | 4.5 ✅ (trước ~4.2 ❌) |
| Chữ mờ trên panel | 7.41:1 | 4.5 ✅ |
| Phụ đề brand trên panel | 4.63:1 | 4.5 ✅ |

## 4. Cố ý KHÔNG làm

- **Dark mode đầy đủ.** Skill bắt buộc dark mode cho *trang consumer-facing*; đây là công cụ nội bộ.
  Đó là *tính năng*, không phải *tối ưu*, nên không tự ý thêm. Nhưng đã **token hóa** 7 mã màu
  hardcode của thanh transport thành `--deck*`, nên khi cần thì chỉ còn thêm một khối
  `@media (prefers-color-scheme: dark)`, không phải đi sửa rải rác.
- **Thanh transport tối giữa app sáng** = về kỹ thuật là vi phạm Page Theme Lock (luật 4.11),
  nhưng giữ lại có chủ đích: đó là quy ước của media player / DAW và nó neo vùng điều khiển
  phát tách khỏi vùng tài liệu. Nay được đặt tên rõ là bề mặt `--deck`.
- **Không tách nhỏ bundle alphaTab** (cảnh báo 500kB có sẵn từ trước, ngoài phạm vi).

## 5. File đã đổi

`web/package.json` · `web/index.html` · `web/src/main.tsx` · `web/src/index.css` ·
`web/src/App.css` · `web/src/App.tsx` · `web/src/OmrViewer.css` · `web/src/OmrViewer.tsx` ·
`web/src/Library.css` · `web/src/Library.tsx` · `web/src/BookPicker.css` · `web/src/BookPicker.tsx`
