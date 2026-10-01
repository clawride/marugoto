// Băm mật khẩu bằng scrypt (có sẵn trong Node, không cần thư viện) — chỉ dùng phía server.
// Dạng lưu: scrypt$N$r$p$<salt base64>$<hash base64>
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";

const N = 16384, R = 8, P = 1, LEN = 32;
const derive = (pw, salt, n, r, p) => new Promise((res, rej) => scrypt(pw.normalize("NFKC"), salt, LEN, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(k))));

export async function hashPassword(pw) {
  const salt = randomBytes(16);
  const key = await derive(pw, salt, N, R, P);
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(pw, stored) {
  const [alg, n, r, p, salt, hash] = String(stored || "").split("$");
  if (alg !== "scrypt" || !hash) return false;
  const want = Buffer.from(hash, "base64");
  const got = await derive(pw, Buffer.from(salt, "base64"), +n, +r, +p);
  return got.length === want.length && timingSafeEqual(got, want);
}

// Luật tên đăng nhập / mật khẩu — dùng chung cho các API
export const USERNAME_RE = /^[A-Za-z0-9_.]{3,20}$/;
export const checkPassword = (pw) => (typeof pw === "string" && pw.length >= 6 && pw.length <= 72 ? "" : "Mật khẩu cần 6–72 ký tự");
export const USERNAME_MSG = "Tên đăng nhập cần 3–20 ký tự (chữ không dấu, số, _ hoặc .)";
