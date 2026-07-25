# Fork + bootstrap + thử OMR

**Thời điểm**: 2026-07-26 ~00:35  
**Ngữ cảnh**: Phiên đầu trên repo Audiveris trong workspace HADE.

## Việc đã làm

1. Đọc `memory/README.md` → **chưa tồn tại** (thư mục memory/plans/reports chưa có) → đã tạo SSOT.
2. `git diff`: working tree **clean**, không có thay đổi local trước phiên.
3. Fork GitHub: `hacmieu/audiveris` **đã tồn tại** (`isFork=true`, parent = Audiveris/audiveris).
4. Remote:
   - `origin` → `https://github.com/Audiveris/audiveris.git` (upstream)
   - `hacmieu` → `git@github.com:hacmieu/audiveris.git` (fork)
5. Tải file test từ Drive ID `13Ld-lqEXXRE6uyZFQd7nRbIJbNzCqKUd`:
   - Tên: `yeu-xa-sheet-nhac.pdf`
   - Local: `testdata/yeu-xa-sheet-nhac.pdf` (PDF 1.7, 1 trang, ~344 KB)
   - Nội dung: bản nhạc "Yêu Xa" — Vũ Cát Tường (Ballade, 4/4).

## Môi trường

- OS: macOS (darwin 25.5.0), Apple Silicon
- Java lúc đầu: OpenJDK **24.0.1** (Homebrew) — **không đủ** vì `theMinJavaVersion = 25`
- Đang cài `openjdk@25` qua Homebrew

## Lệnh chạy dự kiến

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@25
./gradlew :app:run --args='-batch -transcribe -export -output output testdata/yeu-xa-sheet-nhac.pdf'
```

(hoặc `-PcmdLineArgs=...` tùy wrapper Gradle)

## Ghi chú

- Diff ban đầu: không có.
- Mục tiêu phiên: bật hệ thống + thử OMR file Drive, ghi log SSOT, push fork nếu có commit.
