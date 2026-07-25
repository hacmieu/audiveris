# Khảo sát FE kiểu Guitar Pro — khuyến nghị bộ thư viện

**Thời điểm**: 2026-07-26 01:03  
**Câu hỏi**: FE nào đủ công cụ chơi/luyện bài như Guitar Pro, và bộ nào xuất sắc nhất?

## Kết luận ngắn

| Hạng mục | Lựa chọn |
|---|---|
| **Khuyến nghị chính (self-host, OSS)** | **[alphaTab](https://alphatab.net/)** (`@coderline/alphatab`) — **MPL-2.0** |
| **Khuyến nghị thương mại (UX học guitar “pro” sẵn)** | **[Soundslice Player](https://www.soundslice.com/licensing/)** (embed + license) |
| **Không chọn làm “Guitar Pro web”** | OSMD + `@isamu/osmd-audio-player` (chỉ render + phát MIDI cơ bản) |
| **Editor web đầy đủ (có phí)** | Flat.io Embed — mạnh về sửa MusicXML, kém “tab/luyện guitar” hơn alphaTab/Soundslice |

**Với pipeline Audiveris (xuất `.mxl`)**: dùng **alphaTab** — đọc MusicXML native + player tích hợp (tempo, loop, transpose, cursor, mixer track).

---

## Tiêu chí “như Guitar Pro”

| Năng lực | Guitar Pro desktop | alphaTab | Soundslice | OSMD + audio player | Flat.io Embed |
|---|---|---|---|---|---|
| Notation + **guitar tab** | ✅ | ✅ mạnh | ✅ mạnh | ⚠️ tab hạn chế | ⚠️ thiên staff |
| Load **Guitar Pro** `.gp*` | ✅ | ✅ GP3–8 | ✅ upload | ❌ | ⚠️ qua convert |
| Load **MusicXML** (Audiveris) | ✅ | ✅ | ✅ | ✅ native | ✅ |
| Playback + **cursor** | ✅ | ✅ built-in synth | ✅ | ⚠️ fork cộng đồng / sponsor | ✅ |
| Tempo / loop / metronome | ✅ | ✅ | ✅ | một phần | một phần |
| Mixer track (mute/solo/volume) | ✅ | ✅ | ✅ | ❌ | hạn chế |
| Sync audio/video thật | ✅ (GP8) | ✅ (v1.6+) | ✅ (điểm mạnh) | ❌ | hạn chế |
| **Sửa** nốt/tab online | ✅ | ❌ SDK render+play (tự build UI) | ✅ editor của họ | ❌ renderer | ✅ mạnh |
| Self-host / không phụ thuộc SaaS | ✅ | ✅ | ❌ SaaS | ✅ | ❌ SaaS |
| License | thương mại | **MPL-2.0** miễn phí | thương mại | BSD + fork | thương mại |
| Cập nhật gần đây | — | **v1.8.4** (2026-07) | liên tục | OSMD active; audio OSS yếu | liên tục |

---

## Chi tiết ứng viên

### 1. alphaTab — **xuất sắc nhất cho mục tiêu này**

- Site: https://alphatab.net/ · GitHub: https://github.com/CoderLine/alphaTab (~1.7k★)
- NPM: `@coderline/alphatab` · Player demo: https://alphatab.net/docs/tutorial-web/player
- **Đúng DNA Guitar Pro**: importer GP3–8, tab + staff + drum, alphaSynth (SoundFont), count-in, metronome, loop, transpose, track list/mixer, scroll cursor, sync media/YouTube.
- **Khớp Audiveris**: importer MusicXML → nạp thẳng `.mxl`/`.xml` từ OMR.
- **Không phải drop-in app**: là **SDK** — bạn tự dựng UI (Next.js + controls). Có playground/tutorial đầy đủ.
- Giới hạn: **không phải editor** đầy đủ; muốn sửa nốt phải tự viết lớp chỉnh sửa hoặc dùng Flat/Soundslice editor.
- Attribution theo MPL-2.0 (giữ notice license).

### 2. Soundslice — UX học guitar “đỉnh” nhưng SaaS

- Embed player + sync YouTube/Vimeo rất mượt; có scanner PDF; editor sẵn.
- Phù hợp sản phẩm thương mại muốn UX sẵn, chấp nhận phí license + phụ thuộc cloud.
- Không phù hợp nếu muốn tự host 100% kết quả OMR.

### 3. OSMD (+ audio player) — tốt cho sheet cổ điển, kém “Guitar Pro”

- Đã kiểm chứng trong dự án `oemer` (render nhanh, nghe được).
- OSMD tự nhận: **renderer, không phải editor**; playback OSS phụ thuộc fork/`@isamu`; PlaybackManager chính thức = sponsor.
- Thiếu tab workflow, mixer GP, sync video, load `.gp` → **không đủ** nếu mục tiêu là “như Guitar Pro”.

### 4. Flat.io Embed — editor MusicXML web

- Mạnh khi cần **sửa** bản nhạc trên web.
- Kém hơn alphaTab/Soundslice về tab/guitar practice; phí theo user.

### 5. Loại sớm

| Tên | Lý do |
|---|---|
| VexFlow thuần | Quá thấp tầng — tự layout từng measure |
| Verovio | Thiên MEI, không phải UX Guitar Pro |
| RiffScore | MusicXML import còn “Coming Soon” (đã ghi ở khảo sát oemer) |
| Songsterr / UG | Sản phẩm, không phải toolkit embed OSS |

---

## Kiến trúc đề xuất (Audiveris → FE)

```
PDF/ảnh → Audiveris → .mxl
                         │
                         ▼
              Next.js (UI kiểu GP)
                         │
              @coderline/alphatab
                 ├─ render staff/tab
                 ├─ alphaSynth + SoundFont
                 └─ controls: play, tempo, loop, tracks
```

Tuỳ chọn sau: convert `.mxl` → `.gp` (MuseScore/CLI) nếu muốn tận dụng hết hiệu ứng guitar GP; hoặc upload `.gp` người dùng có sẵn.

---

## Khuyến nghị hành động

1. **Chốt stack FE player = alphaTab** (không dùng OSMD làm lõi “Guitar Pro”).
2. SPIKE ½ ngày: trang Next.js tối thiểu nạp `output/yeu-xa-sheet-nhac.mxl` → play + tempo + loop + cursor.
3. Nếu sau SPIKE MusicXML từ Audiveris thiếu tab/string → bổ sung bước convert hoặc UI “lead sheet only” trước, tab khi có dữ liệu guitar.
4. Editor đầy đủ → Chu kỳ sau (Flat Embed hoặc tự build trên data model alphaTab) — không chặn MVP nghe + luyện.

## Tham chiếu

- alphaTab intro: https://alphatab.net/docs/introduction  
- Player tutorial: https://alphatab.net/docs/tutorial-web/player  
- So sánh browser libs (OSMD blog): https://opensheetmusicdisplay.org/blog/sheet-music-display-libraries-browsers/  
- Khảo sát OSMD trước đó (oemer): liên quan cùng HADE, không thay thế khuyến nghị này cho use case Guitar Pro.
