# Design system giao diện web

**Ngày:** 2026-07-27 00:10
**Nguồn:** audit bằng skill `design-taste-frontend`
**Report đầy đủ:** [../reports/20260727_0010-audit-optimize-giao-dien.md](../reports/20260727_0010-audit-optimize-giao-dien.md)

## Luật cho phiên sau

**Mọi token nằm ở `web/src/index.css`.** Component CSS chỉ được tham chiếu `var(--…)`,
không hardcode hex, không hardcode `px` bán kính. Trước khi thêm màu mới, kiểm tra
xem đã có token phù hợp chưa.

### Chữ
- `--font-ui` = Geist Variable · `--font-mono` = Geist Mono Variable (số liệu, slug, mã).
- Self-host qua `@fontsource-variable/geist` và `…/geist-mono`, import ở `main.tsx`.
- **Không serif.** Phân cấp bằng weight (550 / 600 / 650) và màu, không bằng đổi họ chữ.
- **Không** thêm `<link>` Google Fonts vào `index.html`.

### Màu
| Token | Dùng cho |
|---|---|
| `--score` | bản nhạc, trắng thật, là bề mặt sáng nhất màn hình |
| `--surface` | nền canvas sau bản nhạc |
| `--surface-panel` | chrome: topbar, toolbar, sidebar |
| `--surface-raised` | control đặt trên chrome |
| `--surface-sunken` | nền trang, khối code |
| `--ink` / `--ink-muted` / `--ink-faint` | chữ chính / phụ / mờ nhất (4.63:1) |
| `--accent` | teal `#0f766e`, accent **duy nhất** của UI |
| `--deck*` | thanh transport tối |
| `--grade-*` | thang độ tin cậy OMR, **là mã hóa dữ liệu** nên được phép tồn tại cạnh accent |

Thang xám cố ý **achromatic**: giao diện bao quanh bản nhạc quét, chrome ám màu
sẽ làm lệch cách mắt đọc màu giấy của bản scan.

### Hình khối
`--r-pill` toggle/badge · `--r-control` 8px cho control · `--r-panel` 12px cho panel ·
`--r-overlay` 2px cho khung vẽ đè lên bản nhạc (giữ nhỏ để không bo tròn mất glyph).
Bốn giá trị này là toàn bộ, không thêm.

### Icon
Chỉ `@phosphor-icons/react`, một họ duy nhất. Không emoji trong UI, không tự vẽ path SVG.
Nút chỉ có icon **bắt buộc** có `aria-label`.

### Motion
Toàn bộ motion trong app = `:active { translateY(1px) }` phản hồi bấm.
Luôn bọc trong `@media (prefers-reduced-motion: no-preference)`.
Đã có sẵn khối `reduce` cắt mọi transition. Không thêm animation trang trí.

### A11y
- `:focus-visible` toàn cục ở `index.css`. Vùng nền tối override `--focus-ring` sang teal sáng.
- Mọi chữ phải ≥ 4.5:1. Disabled dùng `opacity: .55` (đo được 5.36:1 trên nền deck),
  **không** dùng `.45` (trượt xuống ~4.2:1).

## Chưa làm

**Dark mode.** Token `--deck*` đã tách sẵn nên chỉ cần thêm một khối
`@media (prefers-color-scheme: dark)` đổi giá trị token, không phải sửa rải rác component.
Chưa làm vì đó là tính năng chứ không phải tối ưu, đang chờ người dùng xác nhận.

## Ngoại lệ có chủ đích

Thanh transport tối nằm giữa app sáng về kỹ thuật là vi phạm "Page Theme Lock" của skill.
Giữ lại vì đó là quy ước media player / DAW và nó neo vùng điều khiển phát tách khỏi
vùng tài liệu. Được đặt tên rõ là bề mặt `--deck`, không phải màu lạc.
