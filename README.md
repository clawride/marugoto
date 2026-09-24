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

## Deploy lên Vercel

1. Vào https://vercel.com/new → Import repo `clawride/marugoto`
2. Framework: Next.js (tự nhận)
3. Settings → Environment Variables: thêm `GIPHY_API_KEY`, `PEXELS_API_KEY`
4. Deploy

## Cập nhật danh sách nhân vật/vũ khí Genshin

```bash
node scripts/fetch-genshin.mjs
```

---

Trang học tập cá nhân, phi thương mại. Ảnh nhân vật/vũ khí Genshin Impact © HoYoverse (lấy qua gi.yatta.moe).
