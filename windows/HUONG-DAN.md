# Dựng Video – tạo tệp cài đặt Windows (.exe)

## Cách A – Build trên máy của bạn
1. Cài Node.js (bản LTS): https://nodejs.org (nếu đã dùng `npm` cho Firebase thì bỏ qua).
2. Giải nén thư mục `DungVideo-Windows`, mở **Command Prompt** tại thư mục đó
   (gõ `cmd` vào thanh địa chỉ của File Explorer rồi Enter).
3. Gõ lần lượt:

       npm install
       npm run dist

4. Trong thư mục `dist` sẽ có 2 tệp:
   - `DungVideo-1.0.0-nsis.exe` – bộ cài đặt (tạo biểu tượng ngoài màn hình).
   - `DungVideo-1.0.0-portable.exe` – bản chạy luôn, không cần cài.

Chạy thử không cần build: `npm install` rồi `npm start`.

Nếu Windows hiện "Windows protected your PC": bấm **More info → Run anyway**
(do app tự làm chưa có chữ ký số).

## Cách B – GitHub tự build
Tải thư mục này lên một kho GitHub mới (có cả thư mục ẩn `.github`) → tab **Actions**
→ đợi "Build Windows app" xong → tải `DungVideo-windows` trong mục **Artifacts**.

## Trong app
- Bấm **Lưu** sẽ hiện hộp thoại chọn nơi lưu tệp.
- **🎙 Thu âm** dùng được ngay (lần đầu Windows có thể hỏi quyền micro).
