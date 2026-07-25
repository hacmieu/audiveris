# Nghe thử audio — Yêu Xa

**Thời điểm**: 2026-07-26 00:50  
**Trạng thái**: ✅ Đã phát trên loa (63 giây)

## Chuỗi chuyển đổi

```
yeu-xa-sheet-nhac.mxl  --music21-->  yeu-xa-sheet-nhac.mid  --fluidsynth-->  yeu-xa-sheet-nhac.wav  --afplay--> loa
```

| Bước | Công cụ | Kết quả |
|---|---|---|
| MusicXML → MIDI | `music21` 10.5.0 (pip) | `output/yeu-xa-sheet-nhac.mid` (1.7 KB, 120 quarter notes) |
| MIDI → WAV | `fluid-synth` (brew) + soundfont `MuseScore_General.sf3` | `output/yeu-xa-sheet-nhac.wav` (11 MB, 44.1 kHz stereo, 63s) |
| Phát | `afplay` (macOS) | Phát trọn 63s |

## Cài đặt đã thêm

- `brew install fluid-synth`
- `pip install music21`
- Soundfont: `~/Library/Audio/Sounds/Banks/MuseScore_General.sf3` (38 MB, mirror ftp.osuosl.org/pub/musescore)

## Lệnh tái chạy

```bash
cd output
python3 -c "from music21 import converter; converter.parse('yeu-xa-sheet-nhac.mxl').write('midi', fp='yeu-xa-sheet-nhac.mid')"
fluidsynth -ni -F yeu-xa-sheet-nhac.wav -r 44100 ~/Library/Audio/Sounds/Banks/MuseScore_General.sf3 yeu-xa-sheet-nhac.mid
afplay yeu-xa-sheet-nhac.wav
```

## Ghi chú chất lượng

- Giai điệu là kết quả OMR thô (chưa sửa tay) — cao độ/nhịp đúng theo những gì engine nhận dạng được; các lỗi nhận dạng (nếu có) sẽ nghe thấy trực tiếp.
- MIDI chỉ có 1 part (melody), nhạc cụ mặc định piano.
