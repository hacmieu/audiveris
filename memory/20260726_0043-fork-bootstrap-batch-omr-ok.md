# Fork + bootstrap + batch OMR OK

**Thời điểm**: 2026-07-26 00:43  
**Kết quả**: ✅ Hệ thống chạy; PDF Yêu Xa đã transcribe + export.

## Tóm tắt phiên

1. `memory/` ban đầu **không tồn tại** → đã tạo SSOT `memory/`, `plans/`, `reports/`.
2. `git diff` ban đầu: **clean**.
3. Fork GitHub sẵn có: https://github.com/hacmieu/audiveris
4. Cài `openjdk@25` (máy chỉ có 24 trước đó).
5. Cài tessdata `eng` + `vie`.
6. Batch OMR thành công ~22s → `.omr` + `.mxl` (30 measures, 140 notes).

## Lệnh tái chạy

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@25
export PATH="$JAVA_HOME/bin:$PATH"
ROOT=/Users/hacmieu/DevOps/HADE/audiveris
./gradlew :app:run --no-daemon --console=plain \
  -PcmdLineArgs="-batch,-transcribe,-export,-output,${ROOT}/output,${ROOT}/testdata/yeu-xa-sheet-nhac.pdf"
```

## Chi tiết

Xem báo cáo đầy đủ: [../reports/20260726_0043-ket-qua-batch-omr-yeu-xa.md](../reports/20260726_0043-ket-qua-batch-omr-yeu-xa.md)
