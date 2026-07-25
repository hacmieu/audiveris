# Tab + SoundFont HQ — xác minh

**Thời điểm**: 2026-07-26 01:30  
**Trạng thái**: ✅

## Tab

| Hạng mục | Kết quả |
|---|---|
| Nguồn OMR có tab sẵn? | ❌ MusicXML không có string/fret |
| Cách làm | Tự gán tuning EADGBE + tính fret từ MIDI pitch |
| UI | Nút **Tab** trên thanh transport |
| Xác minh browser | Có dòng TAB, nhãn "Guitar Standard Tuning", số ngăn |

⚠️ Fingerings là **ước lượng guitar**, không phải fingerings gốc trên bản in.

## SoundFont

| File | Kết quả |
|---|---|
| `sonivox.sf2` | Luôn load trước (nhanh) |
| `MuseScore_General.sf3` | Nâng cấp sau khi player ready nếu file có trong `public/soundfont/` |
| Footer | Hiển thị `· MuseScore General` khi upgrade OK |

Nguồn HQ: https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/MuseScore_General.sf3  
(không commit — xem `web/README.md`)
