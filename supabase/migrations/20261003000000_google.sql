-- Đăng nhập bằng Google: gắn tài khoản Google (sub = mã định danh cố định của Google) vào hồ sơ.
-- Chạy lại cũng không sao. Tài khoản tạo bằng Google có username tự sinh, không có mật khẩu.

alter table public.profiles add column if not exists google_sub text;
alter table public.profiles add column if not exists google_email text;
create unique index if not exists profiles_google_sub_key on public.profiles (google_sub);
