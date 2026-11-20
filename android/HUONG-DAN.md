# Dựng Video – tạo tệp cài đặt Android (.apk)

App chạy hoàn toàn trên máy (không cần mạng, trừ font chữ và chức năng lưu nhạc nhanh).
Yêu cầu: điện thoại Android 10 trở lên.

## Cách A – Dùng Android Studio (khuyên dùng)
1. Cài Android Studio: https://developer.android.com/studio
2. Giải nén thư mục `DungVideo-Android`, mở Android Studio → **Open** → chọn thư mục này.
3. Đợi Android Studio tải thư viện (lần đầu mất vài phút, cần mạng).
4. Menu **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
5. Bấm **locate** ở thông báo hiện ra → có tệp `app-debug.apk`.
6. Gửi tệp `.apk` sang điện thoại (Zalo, Drive, cáp USB…) → mở để cài.
   Nếu máy hỏi, cho phép **"Cài ứng dụng không rõ nguồn gốc"**.

Muốn chạy thử ngay: cắm điện thoại (bật Gỡ lỗi USB) rồi bấm nút ▶ Run.

## Cách B – Không cần cài gì (GitHub tự build)
1. Tạo kho (repository) mới trên https://github.com, tải toàn bộ thư mục này lên
   (có cả thư mục ẩn `.github`).
2. Vào tab **Actions** → đợi "Build APK" chạy xong (dấu ✓ xanh, khoảng 5 phút).
3. Bấm vào lần chạy đó → mục **Artifacts** → tải `DungVideo-apk` → giải nén ra tệp `.apk`.

## Trong app
- Ảnh/video/nhạc lưu vào thư viện máy: **Ảnh / Phim / Nhạc › DungVideo**.
- Lần đầu bấm **🎙 Thu âm**, app sẽ xin quyền micro → chọn **Cho phép**.
- Nút **Quay lại** của điện thoại: đóng hộp thoại / về màn hình video / thoát app.

## Cập nhật app sau này
Thay các tệp trong `app/src/main/assets/www/` bằng bản mới, tăng `versionCode`
trong `app/build.gradle.kts` (1 → 2…), rồi build lại.
