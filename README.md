# Cloudinary Wedding Gallery (React + Vite)

Website React hiển thị toàn bộ ảnh từ Cloudinary **không cần server API riêng**.

## 1. Cấu hình Cloudinary

Để frontend gọi trực tiếp danh sách ảnh, bạn cần:

1. Bật **Resource list** trong Cloudinary Console (Security).
2. Dùng URL dạng:
   `https://res.cloudinary.com/<cloud_name>/image/list/<folder_or_tag>.json`

> Lưu ý: Nếu Cloudinary account của bạn chỉ hỗ trợ list theo tag, hãy gán cùng một tag cho toàn bộ ảnh trong folder rồi dùng tag đó ở `<folder_or_tag>`.

## 2. Cấu hình môi trường

Sao chép file mẫu:

```bash
cp .env.example .env.local
```

Sửa `.env.local`:

```env
VITE_GALLERY_TITLE=Duc Lam & Phuong Anh
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_LIST_URL=https://res.cloudinary.com/your_cloud_name/image/list/your_folder_or_tag.json
```

## 3. Chạy project

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`.
# my-wedding
