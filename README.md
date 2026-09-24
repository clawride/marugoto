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

Dùng Upstash Redis (miễn phí) qua Vercel Marketplace:

1. Vercel → Project → **Storage** → **Create Database** → **Upstash for Redis** → Free → Connect vào project
2. Vercel tự thêm `KV_REST_API_URL` và `KV_REST_API_TOKEN` → **Redeploy**

Chạy thử trên máy không cần Redis: `npm run dev` (dùng bộ nhớ tạm), hoặc `LB_MEMORY=1 npm start` với bản build.

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
