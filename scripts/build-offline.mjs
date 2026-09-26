// Đóng gói bản chạy OFFLINE trên máy (Windows): trang Next.js chạy độc lập + ảnh Genshin + phông chữ + lồng tiếng + VOICEVOX
//   node scripts/build-offline.mjs [--out C:/Users/<tên>/SoTayTeyvatOffline] [--chat-dir <thư mục mp3 trò chuyện>] [--engine <run.exe của VOICEVOX>]
// Kết quả: <out>/SoTayTeyvat-Offline.vbs (+ biểu tượng "Sổ Tay Teyvat (Offline)" trên Desktop). Chạy lại để cập nhật — ảnh/phông đã tải được giữ trong <out>/assets.
// File âm thanh dùng liên kết cứng (hard link) nên gần như không tốn thêm dung lượng ổ đĩa.
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const HOME = process.env.USERPROFILE || process.env.HOME;
const OUT = path.resolve(arg("out", path.join(HOME, "SoTayTeyvatOffline")));
const CHAT_DIR = arg("chat-dir", path.join(HOME, "voicevox_tools", "voice-chat"));
const ENGINE = arg("engine", path.join(HOME, "voicevox_tools", "engine", "run.exe"));
const GI = "https://gi.yatta.moe/assets/UI/";
const PORT = 39390;
const log = (...a) => console.log("•", ...a);

// ——— 1. build Next.js ở chế độ offline ———
log("Build trang (chế độ offline)…");
execFileSync(process.execPath, [path.join(ROOT, "scripts", "build-notebook.mjs")], { stdio: "inherit", cwd: ROOT });
execFileSync(process.execPath, [path.join(ROOT, "node_modules", "next", "dist", "bin", "next"), "build"], {
  stdio: "inherit", cwd: ROOT,
  env: { ...process.env, OFFLINE_BUILD: "1", NEXT_PUBLIC_OFFLINE: "1", NEXT_PUBLIC_GI_BASE: "/gi/", NEXT_PUBLIC_VOICE_CHAT_BASE: "/vn/voice-chat/", NEXT_TELEMETRY_DISABLED: "1" },
});

// ——— 2. lắp thư mục app: máy chủ độc lập + static + public ———
const APP = path.join(OUT, "app"), ASSETS = path.join(OUT, "assets");
log("Lắp thư mục chương trình:", APP);
fs.rmSync(APP, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, ".next-offline", "standalone"), APP, { recursive: true });
fs.cpSync(path.join(ROOT, ".next-offline", "static"), path.join(APP, ".next-offline", "static"), { recursive: true });
// public: file nhỏ chép thường, file âm thanh dùng liên kết cứng
function linkTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) linkTree(s, d);
    else if (!fs.existsSync(d)) { try { fs.linkSync(s, d); } catch { fs.copyFileSync(s, d); } }
  }
}
linkTree(path.join(ROOT, "public"), path.join(APP, "public"));

// ——— 3. ảnh Genshin (gi.yatta.moe) → assets/gi, dùng lại giữa các lần build ———
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, "data", f), "utf8"));
const src = (dir) => fs.readdirSync(dir, { recursive: true }).filter((f) => /\.js$/.test(f)).map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
const code = ["app", "components", "lib"].map((d) => src(path.join(ROOT, d))).join("\n");
const GIJ = read("genshin.json");
const names = new Set();
for (const c of GIJ.characters) { names.add(`UI_AvatarIcon_${c.icon}`); names.add(`UI_Gacha_AvatarImg_${c.icon}`); }
for (const w of GIJ.weapons) { names.add(`UI_EquipIcon_${w.icon}`); names.add(`UI_Gacha_EquipIcon_${w.icon}`); }
for (const e of ["Ice", "Wind", "Electric", "Water", "Fire", "Rock", "Grass"]) names.add(`UI_Buff_Element_${e}`);
for (const t of ["Sword", "Claymore", "Pole", "Bow", "Catalyst"]) names.add(`UI_GachaTypeIcon_${t}`);
for (const k of Object.values(read("constellations.json"))) for (const x of k.list || []) if (x.icon) names.add(x.icon);
for (const m of code.matchAll(/\bid:\s*(\d{3,6})\b/g)) names.add(`UI_ItemIcon_${m[1]}`); // biểu tượng vật phẩm (Icons.js)
for (const m of code.matchAll(/UI_ItemIcon_(\d+)/g)) names.add(`UI_ItemIcon_${m[1]}`);
for (const m of code.matchAll(/AV\("([A-Za-z0-9_]+)"\)/g)) names.add(`UI_AvatarIcon_${m[1]}`);
for (const m of code.matchAll(/["'`](UI_(?:AvatarIcon|Gacha_AvatarImg|EquipIcon|Gacha_EquipIcon)_[A-Za-z0-9_]+)["'`]/g)) names.add(m[1]);
const monsters = new Set([...code.matchAll(/UI_MonsterIcon_[A-Za-z0-9_]+/g)].map((m) => m[0]));
for (const f of fs.readdirSync(path.join(ROOT, "data")).filter((f) => f.endsWith(".json"))) {
  const t = fs.readFileSync(path.join(ROOT, "data", f), "utf8");
  for (const m of t.matchAll(/UI_MonsterIcon_[A-Za-z0-9_]+/g)) monsters.add(m[0]);
}
const want = [...[...names].map((n) => `${n}.png`), ...[...monsters].map((n) => `monster/${n}.png`)];
const GI_DIR = path.join(ASSETS, "gi");
fs.mkdirSync(path.join(GI_DIR, "monster"), { recursive: true });
let got = 0, miss = 0, fail = [];
const todo = want.filter((f) => !fs.existsSync(path.join(GI_DIR, f)) && !fs.existsSync(path.join(GI_DIR, f + ".404")));
log(`Ảnh Genshin: ${want.length} ảnh, cần tải ${todo.length}…`);
async function dl(f) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(GI + f);
      if (r.status === 404) { fs.writeFileSync(path.join(GI_DIR, f + ".404"), ""); miss++; return; }
      if (!r.ok) throw new Error(r.status);
      fs.writeFileSync(path.join(GI_DIR, f), Buffer.from(await r.arrayBuffer())); got++; return;
    } catch (e) { if (i === 2) fail.push(f); await new Promise((r) => setTimeout(r, 1000 * (i + 1))); }
  }
}
for (let i = 0; i < todo.length; i += 8) {
  await Promise.all(todo.slice(i, i + 8).map(dl));
  if (i % 200 === 0 && i) log(`  …${i}/${todo.length}`);
}
log(`  tải mới ${got}, không có trên máy chủ ${miss}${fail.length ? `, lỗi ${fail.length} (chạy lại để thử lại)` : ""}`);
linkTree(GI_DIR, path.join(APP, "public", "gi"));

// ——— 4. phông chữ Google (Noto Serif / Noto Serif JP) → assets/fonts ———
const FONT_DIR = path.join(ASSETS, "fonts");
if (!fs.existsSync(path.join(FONT_DIR, "fonts.css"))) {
  log("Tải phông chữ…");
  fs.mkdirSync(FONT_DIR, { recursive: true });
  const css = await (await fetch("https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Noto+Serif+JP:wght@400;600;700&display=swap", {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" },
  })).text();
  const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))];
  let out = css;
  for (let i = 0; i < urls.length; i += 8) {
    await Promise.all(urls.slice(i, i + 8).map(async (u, j) => {
      const name = `f${i + j}${path.extname(new URL(u).pathname) || ".woff2"}`;
      fs.writeFileSync(path.join(FONT_DIR, name), Buffer.from(await (await fetch(u)).arrayBuffer()));
      out = out.split(u).join(`/fonts/${name}`);
    }));
  }
  fs.writeFileSync(path.join(FONT_DIR, "fonts.css"), out);
  log(`  ${urls.length} file phông chữ`);
}
linkTree(FONT_DIR, path.join(APP, "public", "fonts"));

// ——— 5. lồng tiếng Trò chuyện (GitHub Releases) → public/vn/voice-chat ———
const VC = path.join(APP, "public", "vn", "voice-chat");
fs.mkdirSync(VC, { recursive: true });
const need = new Map();
for (const f of fs.readdirSync(path.join(ROOT, "public", "vn", "voice")).filter((f) => f.endsWith(".json"))) {
  for (const e of Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, "public", "vn", "voice", f), "utf8")))) if (/^https?:/.test(e.f)) need.set(e.f.split("/").pop(), e.f);
}
let vcLinked = 0, vcDl = 0;
for (const [name, url] of need) {
  const local = path.join(CHAT_DIR, name), d = path.join(VC, name);
  if (fs.existsSync(local)) { try { fs.linkSync(local, d); } catch { fs.copyFileSync(local, d); } vcLinked++; continue; }
  const cache = path.join(ASSETS, "voice-chat", name);
  if (!fs.existsSync(cache)) { fs.mkdirSync(path.dirname(cache), { recursive: true }); fs.writeFileSync(cache, Buffer.from(await (await fetch(url)).arrayBuffer())); vcDl++; }
  fs.linkSync(cache, d); vcLinked++;
}
log(`Lồng tiếng trò chuyện: ${vcLinked} file (tải mới ${vcDl})`);

// ——— 6. kèm Node.js và VOICEVOX vào thư mục → chép sang máy khác vẫn chạy (liên kết cứng: không tốn thêm ổ đĩa trên máy này) ———
fs.mkdirSync(path.join(OUT, "runtime"), { recursive: true });
const nodeDst = path.join(OUT, "runtime", "node.exe");
if (!fs.existsSync(nodeDst) || fs.statSync(nodeDst).size !== fs.statSync(process.execPath).size) {
  fs.rmSync(nodeDst, { force: true });
  try { fs.linkSync(process.execPath, nodeDst); } catch { fs.copyFileSync(process.execPath, nodeDst); }
}
log(`Node.js ${process.version} → runtime\\node.exe`);
if (fs.existsSync(ENGINE) && !process.argv.includes("--no-engine")) {
  linkTree(path.dirname(ENGINE), path.join(OUT, "voicevox"));
  log("VOICEVOX Engine → voicevox\\");
} else log("  (không kèm VOICEVOX — bài học sẽ dùng giọng của trình duyệt)");

// ——— 7. biểu tượng + file khởi động (chỉ dùng đường dẫn tương đối) ———
const ico = path.join(OUT, "icon.ico");
try {
  const ff = arg("ffmpeg", path.join(HOME, "voicevox_tools", "ffmpeg", "ffmpeg-9.0.2-essentials_build", "bin", "ffmpeg.exe"));
  execFileSync(ff, ["-y", "-loglevel", "error", "-i", path.join(GI_DIR, "UI_ItemIcon_201.png"), "-vf", "scale=256:256", ico]);
} catch { log("  (không tạo được icon.ico — dùng biểu tượng mặc định)"); }

const ps1 = `# Khởi động Sổ Tay Teyvat (Offline): máy chủ trang + VOICEVOX + cửa sổ ứng dụng; đóng cửa sổ thì tự tắt hết
# Mọi đường dẫn tính từ thư mục chứa file này → chép cả thư mục sang máy/ổ khác vẫn chạy
$ErrorActionPreference = "SilentlyContinue"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Port = ${PORT}
$Url = "http://127.0.0.1:$Port"
function Up($p) { $c = New-Object Net.Sockets.TcpClient; try { $c.Connect("127.0.0.1", $p); $true } catch { $false } finally { $c.Close() } }
function Warn($m) { Add-Type -AssemblyName PresentationFramework; [Windows.MessageBox]::Show($m, "Sổ Tay Teyvat") | Out-Null }

# Node.js: bản kèm theo trong thư mục, không có thì dùng bản đã cài trên máy
$Node = "$Root\\runtime\\node.exe"
if (-not (Test-Path $Node)) { $Node = (Get-Command node).Source }
if (-not $Node -or -not (Test-Path $Node)) { Warn "Thiếu thư mục runtime (Node.js). Hãy chép lại đầy đủ thư mục chương trình."; exit 1 }
# VOICEVOX: bản kèm theo trong thư mục (đọc giọng cho bài học)
$Engine = "$Root\\voicevox\\run.exe"

$started = @()
if (-not (Up $Port)) {
  $env:PORT = "$Port"; $env:HOSTNAME = "127.0.0.1"; $env:NODE_ENV = "production"; $env:LB_MEMORY = "1"; $env:NEXT_TELEMETRY_DISABLED = "1"
  $started += Start-Process $Node -ArgumentList "server.js" -WorkingDirectory "$Root\\app" -WindowStyle Hidden -PassThru
}
$eng = $null; $engCpu = $false; $engAt = Get-Date
if ((Test-Path $Engine) -and -not (Up 50021)) {
  $eng = Start-Process $Engine -ArgumentList "--use_gpu --host 127.0.0.1 --port 50021" -WorkingDirectory "$Root\\voicevox" -WindowStyle Hidden -PassThru
}
for ($i = 0; $i -lt 60 -and -not (Up $Port); $i++) { Start-Sleep -Milliseconds 500 }
if (-not (Up $Port)) {
  Warn "Không khởi động được chương trình. Hãy chạy 'Tắt Sổ Tay Teyvat.bat' rồi mở lại."
  foreach ($p in $started) { Stop-Process -Id $p.Id -Force }; if ($eng) { Stop-Process -Id $eng.Id -Force }; exit 1
}

# cửa sổ ứng dụng riêng (Chrome, không có thì Edge) — hồ sơ trình duyệt riêng trong thư mục chương trình (tiến độ học nằm ở đây)
$Browser = @("$env:ProgramFiles\\Google\\Chrome\\Application\\chrome.exe", "\${env:ProgramFiles(x86)}\\Google\\Chrome\\Application\\chrome.exe", "$env:LocalAppData\\Google\\Chrome\\Application\\chrome.exe", "\${env:ProgramFiles(x86)}\\Microsoft\\Edge\\Application\\msedge.exe", "$env:ProgramFiles\\Microsoft\\Edge\\Application\\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $Browser) { Start-Process $Url; exit 0 }
$exe = Split-Path $Browser -Leaf
$Prof = if ($exe -eq "chrome.exe") { "$Root\\profile" } else { "$Root\\profile-edge" }
Start-Process $Browser -ArgumentList "--app=$Url", "--user-data-dir=\`"$Prof\`"", "--no-first-run", "--no-default-browser-check", "--window-size=1280,880", "--autoplay-policy=no-user-gesture-required"
Start-Sleep -Seconds 5

# chờ đến khi cửa sổ ứng dụng đóng → tắt máy chủ và VOICEVOX đã mở
$esc = [Regex]::Escape($Prof)
do {
  Start-Sleep -Seconds 3
  # máy không chạy được VOICEVOX bằng card đồ họa (thoát ngay hoặc 60 giây chưa lên) → chạy lại bằng CPU
  if ($eng -and -not $engCpu -and -not (Up 50021) -and ($eng.HasExited -or ((Get-Date) - $engAt).TotalSeconds -gt 60)) {
    if (-not $eng.HasExited) { Stop-Process -Id $eng.Id -Force }
    $eng = Start-Process $Engine -ArgumentList "--host 127.0.0.1 --port 50021" -WorkingDirectory "$Root\\voicevox" -WindowStyle Hidden -PassThru
    $engCpu = $true
  }
  $alive = Get-CimInstance Win32_Process -Filter "Name='$exe'" | Where-Object { $_.CommandLine -match $esc }
} while ($alive)
foreach ($p in $started) { Stop-Process -Id $p.Id -Force }
if ($eng) { Stop-Process -Id $eng.Id -Force }
`;
fs.writeFileSync(path.join(OUT, "start.ps1"), "\ufeff" + ps1.replace(/\n/g, "\r\n"));
const vbs = `' Mở Sổ Tay Teyvat (Offline) — không hiện cửa sổ đen\r\nSet sh = CreateObject("WScript.Shell")\r\ndir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)\r\nsh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & dir & "\\start.ps1""", 0, False\r\n`;
// tên file không dấu: lối tắt Windows (WScript.Shell) làm hỏng đường dẫn có chữ ngoài bảng mã ANSI như "ổ"
fs.rmSync(path.join(OUT, "Sổ Tay Teyvat (Offline).vbs"), { force: true }); // tên cũ của bản build trước
fs.writeFileSync(path.join(OUT, "SoTayTeyvat-Offline.vbs"), "\ufeff" + vbs, "utf16le");
fs.writeFileSync(path.join(OUT, "Tắt Sổ Tay Teyvat.bat"), `@echo off\r\nfor /f "tokens=5" %%p in ('netstat -ano ^| findstr "127.0.0.1:${PORT} " ^| findstr LISTENING') do taskkill /PID %%p /F >nul 2>&1\r\nfor /f "tokens=5" %%p in ('netstat -ano ^| findstr "127.0.0.1:50021 " ^| findstr LISTENING') do taskkill /PID %%p /F >nul 2>&1\r\necho Da tat may chu So Tay Teyvat va VOICEVOX.\r\ntimeout /t 2 >nul\r\n`);

// tạo biểu tượng trên Desktop — chạy lại được trên máy mới ("Tao bieu tuong Desktop.bat")
// WScript.Shell không lưu được lối tắt có chữ ngoài bảng mã ANSI (như "ổ") → tạo tên không dấu rồi đổi tên
const lnk = `$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Add-Type -AssemblyName PresentationFramework
if ($Root -match '[^\\x00-\\xFF]') { [Windows.MessageBox]::Show("Đường dẫn thư mục có chữ tiếng Việt có dấu:\`n$Root\`n\`nHãy đổi tên thư mục sang không dấu (ví dụ D:\\SoTayTeyvatOffline) rồi chạy lại.", "Sổ Tay Teyvat") | Out-Null; exit 1 }
$d = [Environment]::GetFolderPath('Desktop'); $tmp = Join-Path $d 'SoTayTeyvatOffline.lnk'; $dst = Join-Path $d 'Sổ Tay Teyvat (Offline).lnk'
$s = (New-Object -ComObject WScript.Shell).CreateShortcut($tmp)
$s.TargetPath = "$env:WINDIR\\System32\\wscript.exe"; $s.Arguments = "\`"$Root\\SoTayTeyvat-Offline.vbs\`""; $s.WorkingDirectory = $Root
if (Test-Path "$Root\\icon.ico") { $s.IconLocation = "$Root\\icon.ico" }
$s.Description = 'Sổ Tay Từ Vựng Teyvat — bản offline'; $s.Save()
if (Test-Path $dst) { Remove-Item $dst -Force }
Move-Item $tmp $dst
`;
const lnkPs1 = path.join(OUT, "tao-bieu-tuong.ps1");
fs.writeFileSync(lnkPs1, "\ufeff" + lnk.replace(/\n/g, "\r\n"));
fs.writeFileSync(path.join(OUT, "Tao bieu tuong Desktop.bat"), `@echo off\r\npowershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tao-bieu-tuong.ps1"\r\nif errorlevel 1 goto :eof\r\necho Da tao bieu tuong "So Tay Teyvat (Offline)" tren Desktop.\r\ntimeout /t 3 >nul\r\n`);
execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", lnkPs1], { stdio: "inherit" });

fs.writeFileSync(path.join(OUT, "HƯỚNG DẪN.txt"), "\ufeff" + [
  "SỔ TAY TEYVAT — BẢN OFFLINE (mang đi được)",
  "",
  "MỞ CHƯƠNG TRÌNH",
  "• Bấm đúp biểu tượng \"Sổ Tay Teyvat (Offline)\" trên Desktop (hoặc file SoTayTeyvat-Offline.vbs trong thư mục này).",
  "  Mất khoảng 5–20 giây để khởi động. Đóng cửa sổ là chương trình tự tắt.",
  "• Nếu chương trình bị treo: chạy \"Tắt Sổ Tay Teyvat.bat\" rồi mở lại.",
  "",
  "CHÉP SANG MÁY KHÁC",
  "1. Chép NGUYÊN thư mục này (khoảng 3,5 GB) sang máy kia, qua USB/ổ cứng ngoài.",
  "   Nên đặt ở đường dẫn KHÔNG có chữ tiếng Việt có dấu, ví dụ D:\\SoTayTeyvatOffline.",
  "2. Trên máy kia, bấm đúp \"Tao bieu tuong Desktop.bat\" một lần để tạo biểu tượng.",
  "3. Mở bằng biểu tượng như trên. Không cần cài gì thêm, không cần internet.",
  "   Cần: Windows 10/11 64-bit, có Google Chrome hoặc Microsoft Edge (Windows có sẵn Edge).",
  "   Lần đầu Windows có thể hỏi quyền cho node.exe / run.exe truy cập mạng: chọn Cho phép (chỉ dùng trong máy).",
  "• Tiến độ học nằm trong thư mục profile nên chép theo luôn. Nếu máy kia dùng Edge thay vì Chrome,",
  "  hãy dùng Menu ☰ → Sao lưu tiến độ / Khôi phục tiến độ để chuyển.",
  "",
  "CHUYỂN TIẾN ĐỘ VỚI TRANG ONLINE",
  "• Trang online: Menu ☰ → Sao lưu tiến độ (tải file .json) → bản offline: Menu ☰ → Khôi phục tiến độ, chọn file đó.",
  "  Làm ngược lại để mang tiến độ lên online.",
  "",
  "KHI OFFLINE KHÔNG CÓ: ảnh minh họa từ vựng (ảnh thật/meme từ internet) và bảng xếp hạng online.",
  "CẬP NHẬT: trong thư mục dự án chạy  node scripts/build-offline.mjs",
].join("\r\n"));

const du = (d) => fs.readdirSync(d, { recursive: true }).reduce((a, f) => { try { const s = fs.statSync(path.join(d, f)); return a + (s.isFile() ? s.size : 0); } catch { return a; } }, 0);
log(`Xong! Thư mục: ${OUT} (${(du(OUT) / 1073741824).toFixed(1)} GB khi chép sang máy khác; trên máy này phần lớn là liên kết cứng)`);
log(`Biểu tượng "Sổ Tay Teyvat (Offline)" đã được đặt trên Desktop.`);

