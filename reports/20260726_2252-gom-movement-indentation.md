# ✅ Vì sao bản nhạc bị tách nhiều phần — và cách gom về 1 FULL

**Ngày giờ:** 2026-07-26 22:52

## Câu hỏi
"Tại sao không gom các bài này thành FULL mà tách riêng mvt1–mvt5?"

## Nguyên nhân (từ `book.xml`)
- Bài chỉ có **1 bè** (`logical-part id="1"`) xuyên suốt → thực chất **một bài liền mạch**.
- Nhưng Audiveris gắn **5** cờ `movement-start="true"` → mỗi movement = 1 `Score` MusicXML = 1 file `.mxl`.
- Cờ này do công tắc **`indentations`** (mặc định BẬT): Audiveris coi *hệ nhạc đầu bị thụt lề = bắt đầu bản nhạc mới*. Bản PDF này thụt lề không đều nên bị **hiểu nhầm** thành 5 bài.
- Bằng chứng log lần đầu: `Indentation detected for system #1/#3` → `Scores built: 5`.

## Cách xử lý (đã làm)
Chạy lại OMR với `-constant org.audiveris.omr.sheet.ProcessingSwitches.indentations=false`.
- Kết quả: `Exporting sheet(s): [#1#2]` → **1 score** → 1 file `yeu-em-bang-ca-trai-tim-sheet-nhac.mxl` (1 part, 20 ô nhịp).
- Thay vào thư viện (adopt + export-index): cả 2 bài giờ đều **1 nút "full"**.
- Browser test: mở "full" render OK, **không lỗi `beats`**.

## Bẫy đã tránh
- Tên hằng số đúng là `org.audiveris.omr.sheet.ProcessingSwitches.indentations` — **KHÔNG** có `$Constants` (vì `ConstantSet.unit = getDeclaringClass().getName()`). Ghi sai `$Constants` → option bị bỏ qua lặng lẽ (lần chạy đầu vẫn ra 5 scores).

## Đưa vào pipeline
`tools/library.py process` **mặc định** thêm `indentations=false` (né over-split cho toàn bộ 20k). Cờ `--split-movements` để giữ hành vi tách của Audiveris khi bài thật sự nhiều chương.

## Lưu ý
Nếu một bài THẬT có nhiều chương/bài con, tắt indentation sẽ gộp chung — khi đó dùng `--split-movements`, hoặc sửa cờ movement trong Audiveris GUI.
