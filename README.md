# Sổ Tay Từ Vựng Teyvat · Marugoto 中級1 (B1-1)

Trang kiểm tra từ vựng tiếng Nhật Marugoto 中級1 theo từng Topic / Part 1–5, phong cách Genshin Impact.

## Chạy trên máy

```bash
npm install
npm run dev
```

Mở http://localhost:3000

## Biến môi trường (ảnh/meme khớp nghĩa)

Sao chép `.env.example` thành `.env.local` và điền:

- `GIPHY_API_KEY` — https://developers.giphy.com/dashboard/
- `PEXELS_API_KEY` — https://www.pexels.com/api/

Thiếu key thì trang tự dùng nguồn dự phòng (Wikimedia, Openverse, nekos.best).

## Bảng xếp hạng (hồ sơ nickname)

Dùng Supabase (Postgres, miễn phí):

1. Supabase → **SQL Editor** → dán và chạy `supabase/migrations/20261001000000_leaderboard.sql` (tạo bảng `profiles`, `scores` và 2 hàm)
2. Vercel → Settings → Environment Variables: thêm `NEXT_PUBLIC_SUPABASE_URL` và `SUPABASE_SECRET_KEY` (Supabase → Project Settings → API Keys) → **Redeploy**

Chỉ server đọc/ghi dữ liệu bằng secret key (RLS bật, không có policy cho anon). Dữ liệu cũ từ Upstash Redis đã chép sang Supabase ngày 2026-10-01.

Tài khoản (tên đăng nhập + mật khẩu băm scrypt, khóa tạm sau 8 lần sai) và tiến độ học lưu theo tài khoản: chạy thêm `supabase/migrations/20261001120000_accounts.sql` (hoặc `supabase db query --linked -f ...`). API: `/api/auth/signup|login|link`, `/api/save`.

Chạy thử trên máy không cần Supabase: `npm run dev` khi chưa có biến môi trường (dùng bộ nhớ tạm), hoặc `LB_MEMORY=1` để luôn dùng bộ nhớ tạm.

## Bài nghe tạo sẵn

Kịch bản đọc (hội thoại bài nghe, đề thi, danh sách từ…) được tạo sẵn bằng VOICEVOX để máy nào cũng nghe được, không phụ thuộc giọng tiếng Nhật của trình duyệt:

```bash
node --no-warnings scripts/gen-listen.mjs --dry                      # đếm kịch bản
node --no-warnings scripts/gen-listen.mjs --out D:/listen --max-lines 350   # cần VOICEVOX Engine đang chạy; chạy lại sẽ tiếp tục
```

- Mỗi kịch bản một file mp3, mục lục `public/listen/index.json` (mã tính bằng `lib/listenKey.js`, dùng chung với trình duyệt).
- File mp3 đưa lên GitHub Releases `voice-listen-1..n` (mỗi release ≤ 900 file); trang phát qua `/vv/<tag>/<file>` để được cache trên CDN.
- Kịch bản nào chưa có file thì trang tự dùng giọng của trình duyệt (hoặc VOICEVOX online nếu máy không có giọng Nhật).
- Đổi nội dung kịch bản hoặc cách phân giọng → chạy lại script để tạo phần mới (file cũ không dùng nữa).

## Trang quản trị (ẩn)

Đường dẫn `/quan-tri` — không có trong menu/sitemap, không được lập chỉ mục. Người không phải quản trị (kể cả khi đoán đúng đường dẫn) thấy trang 404; API `/api/admin` trả 404 cho mọi người khác.

- Ai là quản trị: biến môi trường **`ADMIN_IDS`** (id hồ sơ, nên dùng) và/hoặc **`ADMIN_USERNAMES`** (tên đăng nhập), cách nhau bằng dấu phẩy. Đổi biến xong phải deploy lại.
- Chức năng: thống kê; người dùng (tìm, đổi tên, khóa/mở khóa, mở khóa đăng nhập tạm, đặt lại mật khẩu, đăng xuất mọi thiết bị, xóa điểm, xóa tài khoản); bảng xếp hạng (xóa điểm, xóa cả bảng); phòng chat (xóa tin); cấu hình trang (banner, bảo trì, hệ số Nguyên Thạch ở Luyện đề thi, ẩn đề, đóng chat/đăng ký); nhật ký mọi thao tác.
- Dữ liệu: `supabase/migrations/20261004000000_admin.sql` (cột profiles.banned, bảng site_settings, admin_log). Cấu hình công khai đọc qua `/api/site`.

## Deploy lên Vercel

`vercel.json` đã khai báo framework là Next.js.

### Cách A — Vercel tự deploy khi push (đơn giản)

1. https://vercel.com/new → Import repo `clawride/marugoto`
2. Project → Settings → Build and Deployment → **Framework Preset: Next.js**
3. Settings → Environment Variables: thêm `GIPHY_API_KEY`, `PEXELS_API_KEY`
4. Deployments → Redeploy

### Cách B — GitHub Actions (`.github/workflows/vercel.yml`)

Thêm 3 secret vào GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Lấy ở đâu |
| --- | --- |
| `VERCEL_TOKEN` | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Vercel → Settings (tài khoản/team) → General → ID |
| `VERCEL_PROJECT_ID` | Vercel → Project → Settings → General → Project ID |

Push lên `main` → deploy Production; mở Pull Request → deploy Preview.
Nếu dùng cách B, tắt Git auto-deploy của Vercel để không deploy 2 lần
(Project → Settings → Git → Ignored Build Step: `exit 0`).

## Cập nhật danh sách nhân vật/vũ khí Genshin

```bash
node scripts/fetch-genshin.mjs
```

---

Trang học tập cá nhân, phi thương mại. Ảnh nhân vật/vũ khí Genshin Impact © HoYoverse (lấy qua gi.yatta.moe).
