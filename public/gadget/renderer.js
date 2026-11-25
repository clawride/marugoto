// Giao diện gadget: hạng + số người (tiengnhat.online), từ vựng ngẫu nhiên kèm ảnh, phần cứng, top 5, tùy chỉnh, hiệu ứng
(function () {
  const $ = (s) => document.querySelector(s);
  const card = $("#card");
  // Xem thử trong trình duyệt thường (không có Electron): dữ liệu giả
  const G = window.gadget || mockGadget();

  const SHOW = [
    ["rank", "Hạng & người dùng"], ["word", "Từ vựng"], ["cpu", "CPU"], ["gpu", "GPU"], ["vram", "VRAM"], ["ram", "RAM"],
    ["disk", "Ổ HDD/SSD"], ["net", "Mạng / Wi-Fi"], ["topCpu", "Top CPU"], ["topGpu", "Top GPU"], ["topNet", "Top mạng"],
  ];
  let cfg = {}, words = [], wordIdx = -1, wordTimer = 0, wordT0 = 0, hoverWord = false, sys = null, topTab = "cpu", lastRank = null;

  // ——— tiện ích ———
  const fmtB = (b, d = 1) => { if (!b && b !== 0) return "—"; const u = ["B", "KB", "MB", "GB", "TB"]; let i = 0; while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; } return b.toFixed(i >= 3 ? d : 0) + " " + u[i]; };
  const fmtRate = (b) => fmtB(b, 1) + "/s";
  const pct = (a, b) => (b ? Math.max(0, Math.min(100, (a / b) * 100)) : 0);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const center = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2600); }

  // ——— áp dụng cấu hình ———
  function applyCfg() {
    const r = document.documentElement.style;
    r.setProperty("--hue", cfg.hue); r.setProperty("--bg-alpha", cfg.bgAlpha); r.setProperty("--img-alpha", cfg.bg ? cfg.imgAlpha : 0); r.setProperty("--blur", cfg.blur + "px");
    r.setProperty("--m", (cfg.margin || 44) + "px");
    // ảnh nền: đường dẫn trên máy (bản desktop) hoặc blob:/data:/https: (bản web)
    $(".bgimg").style.backgroundImage = !cfg.bg ? "none" : /^(blob|data):/.test(cfg.bg) ? `url("${cfg.bg}")` : /^https?:/.test(cfg.bg) ? `url("${cfg.bg}?v=${cfg._bgv || 0}")` : `url("file:///${cfg.bg.replace(/\\/g, "/")}?v=${cfg._bgv || 0}")`;
    document.body.classList.toggle("web", G.platform === "web");
    applyMode();
    FX.level = cfg.fx; FX.setHue(cfg.hue); FX.ambient(cfg.fx === "max");
    document.body.classList.toggle("fx-off", cfg.fx === "off");
    $("#sRank").classList.toggle("hidden", !cfg.show.rank);
    $("#sWord").classList.toggle("hidden", !cfg.show.word);
    const anySys = ["cpu", "gpu", "vram", "ram", "disk", "net"].some((k) => cfg.show[k]);
    $("#sSys").classList.toggle("hidden", !anySys);
    const tabs = { cpu: cfg.show.topCpu, gpu: cfg.show.topGpu, net: cfg.show.topNet };
    $("#sTop").classList.toggle("hidden", !Object.values(tabs).some(Boolean));
    document.querySelectorAll("#topTabs button").forEach((b) => (b.style.display = tabs[b.dataset.t] ? "" : "none"));
    if (!tabs[topTab]) topTab = Object.keys(tabs).find((k) => tabs[k]) || "cpu";
    document.querySelectorAll("#topTabs button").forEach((b) => b.classList.toggle("on", b.dataset.t === topTab));
    fillMenu();
    renderSys(); renderUser();
    restartWordTimer();
  }
  // ——— CHẾ ĐỘ HIỂN THỊ (bản máy tính): đầy đủ / rút gọn / thu thành quả cầu ở góc ———
  function applyMode() {
    const m = G.platform === "web" ? "full" : cfg.mode || "full";
    document.body.classList.toggle("compact", m === "compact");
    document.body.classList.toggle("orb", m === "orb");
    const bm = $("#btnMode"); if (bm) { bm.textContent = m === "compact" ? "▣" : "▭"; bm.title = m === "compact" ? "Mở đầy đủ" : "Rút gọn"; }
    if ($("#modeSel")) $("#modeSel").value = m;
    if ($("#zoomSel")) $("#zoomSel").value = String(cfg.zoom ?? "auto");
    if ($("#orbElSel")) $("#orbElSel").value = cfg.orbEl || "cycle";
    if (m === "orb" && !curEl) setOrbEl();
    if ($("#zoomInfo")) $("#zoomInfo").textContent = cfg.zoomNow ? `Đang hiển thị ${Math.round(cfg.zoomNow * 100)}%${(cfg.zoom ?? "auto") === "auto" ? " · tự tính theo độ phân giải màn hình" : ""}` : "";
    document.querySelectorAll(".cp-grid button").forEach((b) => b.classList.toggle("on", b.dataset.c === cfg.corner));
  }
  // quả cầu mang 1 trong 7 nguyên tố (cfg.orbEl, "random" = đổi mỗi lần thu)
  const ELEMS = { anemo: ["#4fd1b0", "Wind", "風"], pyro: ["#ff8a5c", "Fire", "火"], electro: ["#c79cff", "Electric", "雷"], hydro: ["#4fa8ff", "Water", "水"], dendro: ["#8fd14f", "Grass", "草"], cryo: ["#9fe6ff", "Ice", "氷"], geo: ["#f0b93c", "Rock", "岩"] };
  let curEl = "";
  function setOrbEl(reroll) {
    const K = Object.keys(ELEMS), mode = cfg.orbEl || "cycle";
    const pick = ELEMS[mode] ? mode : mode === "cycle" ? (reroll || !curEl ? K[(K.indexOf(curEl) + 1) % K.length] : curEl) : (reroll || !curEl ? K.filter((k) => k !== curEl)[Math.floor(Math.random() * 6)] : curEl);
    if (pick === curEl && !reroll) return;
    curEl = pick; const [c, asset, glyph] = ELEMS[pick];
    $("#orb").style.setProperty("--el", c);
    $("#orbGlyph").textContent = glyph;
    const img = $("#orbImg"); img.hidden = false; img.onerror = () => (img.hidden = true);
    img.src = `https://gi.yatta.moe/assets/UI/UI_Buff_Element_${asset}.png`;
    const o = $("#orb"); o.classList.remove("swap"); void o.offsetWidth; o.classList.add("swap");
    if (document.body.classList.contains("orb") && cfg.fx !== "off") {
      const old = cfg.hue, [x, y] = center(o); FX.setHue(Math.round(hueOf(c)));
      FX.ring(x, y, { vr: 2.4, max: 22, w: 3 }); FX.burst(x, y, 18, { speed: 2.6 });
      setTimeout(() => FX.setHue(old), 900);
    }
  }
  // xoay vòng 7 nguyên tố mỗi 3 giây khi đang thu thành quả cầu
  setInterval(() => { if (document.body.classList.contains("orb") && (cfg.orbEl || "cycle") === "cycle" && !document.hidden) setOrbEl(true); }, 3000);
  const cornerXY = (c, el = card) => { const r = el.getBoundingClientRect(); return [c?.[1] === "l" ? r.left : r.right, c?.[0] === "t" ? r.top : r.bottom]; };
  async function setMode(mode, corner) {
    if (!G.setMode) return;
    const was = cfg.mode || "full";
    $("#cornerPick").classList.remove("open"); closePanels();
    if (mode === "orb" && was !== "orb") {
      setOrbEl(true);
      // co vào góc: hạt bị hút về góc, thẻ xoay nhỏ lại
      const [x, y] = cornerXY(corner || cfg.corner);
      const r = card.getBoundingClientRect();
      FX.shatter(r, 70); FX.ring(x, y, { vr: 5, max: 30 });
      card.classList.add("shrink");
      await new Promise((res) => setTimeout(res, 430));
      card.classList.remove("shrink");
    }
    cfg = { ...cfg, ...(await G.setMode(mode, corner)) };
    applyMode();
    if (was === "orb" && mode !== "orb") {
      // bung ra từ góc
      card.style.transformOrigin = `${cfg.corner?.[1] === "l" ? "0" : "100%"} ${cfg.corner?.[0] === "t" ? "0" : "100%"}`;
      card.classList.remove("grow"); void card.offsetWidth; card.classList.add("grow");
      setTimeout(() => { card.classList.remove("grow"); card.style.transformOrigin = ""; const [x, y] = cornerXY(cfg.corner); FX.ring(x, y, { vr: 10, max: 50, w: 6 }); FX.burst(x, y, 90, { speed: 9, big: true }); }, 380);
    } else if (mode === "orb") {
      const oldHue = cfg.hue; FX.setHue(Math.round(hueOf(ELEMS[curEl][0]))); // hạt mang màu nguyên tố
      setTimeout(() => { const [x, y] = center($("#orb")); FX.ring(x, y, { vr: 3, max: 24 }); FX.burst(x, y, 26, { speed: 3 }); setTimeout(() => FX.setHue(oldHue), 1500); }, 120);
    } else {
      const [x, y] = center(card); FX.ring(x, y, { vr: 8, max: 40 }); FX.burst(x, y, 50, { speed: 7 });
    }
  }
  async function setCfg(patch) { cfg = { ...cfg, ...(await G.setCfg(patch)) }; applyCfg(); }

  // ——— kích thước cửa sổ bám theo thẻ ———
  new ResizeObserver(() => { if (!document.body.classList.contains("orb") && card.offsetHeight) G.resize(card.offsetHeight); }).observe(card);

  // ——— chuột xuyên qua phần viền trong suốt ———
  let ignoring = true;
  document.addEventListener("mousemove", (e) => {
    const inCard = !!e.target.closest?.("#card, #orb");
    if (inCard === ignoring) { ignoring = !inCard; G.ignoreMouse(ignoring); }
  });

  // ——— KÉO THẢ + hiệu ứng ———
  let dragging = false, downAt = null, vel = { vx: 0, vy: 0 }, tilt = { x: 0, y: 0 }, glow = 0, dragRaf = 0;
  card.addEventListener("mousedown", (e) => {
    if (e.button !== 0 || e.target.closest("button, input, select, label, a, .panel, .word, .rank, .tabs, form, .cornerpick")) return;
    downAt = { x: e.screenX, y: e.screenY };
  });
  let orbDown = false;
  $("#orb").addEventListener("mousedown", (e) => { if (e.button !== 0) return; downAt = { x: e.screenX, y: e.screenY }; orbDown = true; });
  const dragEl = () => (document.body.classList.contains("orb") ? $("#orb") : card);
  document.addEventListener("mousemove", (e) => {
    if (!downAt || dragging) return;
    if (Math.hypot(e.screenX - downAt.x, e.screenY - downAt.y) < 4) return;
    dragging = true; card.classList.add("dragging"); G.dragStart();
    const [x, y] = center(card); FX.ring(x, y, { vr: 4, max: 30 }); FX.burst(x, y, 24, { speed: 4 });
    dragLoop();
  });
  document.addEventListener("mouseup", () => {
    downAt = null;
    if (orbDown && !dragging) { orbDown = false; setMode(cfg.lastMode && cfg.lastMode !== "orb" ? cfg.lastMode : "full"); return; } // bấm quả cầu → mở lại
    orbDown = false;
    if (!dragging) return;
    card.classList.remove("magnet");
    dragging = false; G.dragEnd();
    cancelAnimationFrame(dragRaf);
    card.classList.remove("dragging");
    card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); card.style.setProperty("--glow", 0);
    // thả: sóng xung kích + bùng nổ hạt + nảy
    if (document.body.classList.contains("orb")) { const [ox, oy] = center($("#orb")); FX.ring(ox, oy, { vr: 4, max: 28 }); FX.burst(ox, oy, 30, { speed: 4 }); return; }
    const [x, y] = center(card), r = card.getBoundingClientRect();
    FX.ring(x, y, { vr: 9, max: 46, w: 6 }); setTimeout(() => FX.ring(x, y, { vr: 6, max: 40, h: cfg.hue + 120 }), 90); setTimeout(() => FX.ring(x, y, { vr: 4, max: 36, h: cfg.hue + 200 }), 180);
    FX.burst(x, y, 90, { speed: 9, big: true });
    for (const [cx, cy] of [[r.left, r.top], [r.right, r.top], [r.left, r.bottom], [r.right, r.bottom]]) FX.burst(cx, cy, 16, { speed: 5 });
    card.classList.remove("drop", "boom"); void card.offsetWidth; card.classList.add("drop", "boom");
    setTimeout(() => card.classList.remove("drop", "boom"), 800);
  });
  G.on("drag:vel", (v) => { vel = v; card.classList.toggle("magnet", !!v.corner); });
  G.on("snapped", (c) => {
    if (document.body.classList.contains("orb")) return;
    cfg.corner = cfg.anchor = c; applyMode();
    setTimeout(() => { const [x, y] = cornerXY(c); FX.ring(x, y, { vr: 7, max: 40, w: 5 }); FX.burst(x, y, 60, { speed: 7 }); }, 60);
    toast(`🧲 Đã hít vào góc ${{ tl: "↖ trên trái", tr: "↗ trên phải", bl: "↙ dưới trái", br: "↘ dưới phải" }[c]}`);
  });
  G.on("layout", (d) => { const m = cfg.mode; cfg = { ...cfg, mode: d.mode, corner: d.corner, anchor: d.anchor, zoomNow: d.zoom }; if (m !== d.mode) applyMode(); else applyMode(); });
  function dragLoop() {
    // nghiêng 3D theo vận tốc (có giảm chấn), vầng sáng mạnh dần theo tốc độ, vệt hạt phía sau
    tilt.x += (Math.max(-18, Math.min(18, -vel.vy * 1.6)) - tilt.x) * 0.18;
    tilt.y += (Math.max(-18, Math.min(18, vel.vx * 1.6)) - tilt.y) * 0.18;
    const sp = Math.hypot(vel.vx, vel.vy); glow += (Math.min(1, 0.45 + sp / 14) - glow) * 0.15;
    card.style.setProperty("--rx", tilt.x.toFixed(2) + "deg"); card.style.setProperty("--ry", tilt.y.toFixed(2) + "deg"); card.style.setProperty("--glow", glow.toFixed(3));
    FX.trail(dragEl().getBoundingClientRect(), vel.vx, vel.vy);
    vel.vx *= 0.9; vel.vy *= 0.9;
    if (dragging) dragRaf = requestAnimationFrame(dragLoop);
  }
  // bấm vào thẻ: tia lấp lánh nhỏ
  card.addEventListener("click", (e) => { if (!dragging && cfg.fx !== "off") FX.burst(e.clientX, e.clientY, 10, { speed: 3 }); });
  card.addEventListener("mouseenter", () => { card.style.setProperty("--glow", 0.25); });
  card.addEventListener("mouseleave", () => { if (!dragging) card.style.setProperty("--glow", 0); });

  // ——— TỪ VỰNG ———
  const wordEl = $("#word");
  wordEl.addEventListener("mouseenter", () => (hoverWord = true));
  wordEl.addEventListener("mouseleave", () => (hoverWord = false));
  wordEl.addEventListener("click", (e) => { if (!e.target.closest("button")) nextWord(); });
  $("#wNext").addEventListener("click", () => nextWord());
  $("#wSay").addEventListener("click", () => say());
  // lọc theo trình độ / bài đã chọn (cfg.level: a1 | a21 | a22 | ab1 | b11 | b12 | all; cfg.lesson: số bài | all)
  let allWords = [];
  const LV = { a1: "A1", a21: "A2-1", a22: "A2-2", ab1: "A2/B1", b11: "B1-1", b12: "B1-2" };
  function filterWords() {
    const lv = cfg.level || "all", ls = cfg.lesson || "all";
    const inLv = allWords.filter((w) => lv === "all" || w.lv === lv);
    const lessons = [...new Set(inLv.map((w) => w.l))].sort((a, b) => a - b);
    const sel = $("#lesson");
    sel.innerHTML = `<option value="all">Tất cả bài</option>` + (lv === "all" ? "" : lessons.map((l) => `<option value="${l}">Bài ${l}</option>`).join(""));
    sel.disabled = lv === "all";
    const lsOk = lv !== "all" && ls !== "all" && lessons.includes(+ls);
    sel.value = lsOk ? String(ls) : "all";
    words = lsOk ? inLv.filter((w) => w.l === +ls) : inLv;
    if (!words.length) words = allWords;
    wordIdx = -1;
    $("#lvCount").textContent = `${words.length} từ · ${lv === "all" ? "mọi trình độ" : LV[lv] + (lsOk ? ` · bài ${ls}` : "")}`;
  }
  function pick() {
    if (!words.length) return null;
    // ưu tiên từ có ảnh, không lặp lại liền
    for (let k = 0; k < 8; k++) { const i = Math.floor(Math.random() * words.length); if (i !== wordIdx && (words[i].img || k > 4)) { wordIdx = i; return words[i]; } }
    wordIdx = (wordIdx + 1) % words.length; return words[wordIdx];
  }
  function loadImg(src) {
    return new Promise((res) => {
      if (!src) return res(false);
      const im = new Image(); im.referrerPolicy = "no-referrer";
      const t = setTimeout(() => res(false), 2500);
      im.onload = () => { clearTimeout(t); res(true); }; im.onerror = () => { clearTimeout(t); res(false); };
      im.src = src;
    });
  }
  let switching = false;
  async function nextWord(first) {
    if (switching) return; const w = pick(); if (!w) return;
    switching = true;
    const okImg = await loadImg(w.img);
    if (!first && cfg.fx !== "off") {
      // thẻ cũ vỡ thành hạt
      FX.shatter($("#wJp").getBoundingClientRect(), 50); FX.shatter($(".w-pic").getBoundingClientRect(), 30);
      wordEl.classList.remove("in"); wordEl.classList.add("out");
      await new Promise((r) => setTimeout(r, 360));
    }
    $("#wJp").innerHTML = [...w.jp].map((c, i) => `<span class="ch" style="--i:${i}">${esc(c)}</span>`).join("");
    $("#wKana").textContent = w.kana || "";
    $("#wRo").textContent = w.ro || "";
    $("#wVi").textContent = w.vi;
    $("#wSrc").textContent = w.src || "";
    const img = $("#wImg"), pic = $(".w-pic");
    if (okImg) { img.src = w.img; img.hidden = false; $("#wEm").textContent = ""; pic.classList.remove("noimg"); }
    else { img.hidden = true; img.removeAttribute("src"); $("#wEm").textContent = w.em || "🌸"; pic.classList.add("noimg"); }
    wordEl.classList.remove("out"); void wordEl.offsetWidth; wordEl.classList.add("in");
    if (!first && cfg.fx !== "off") {
      const holo = $(".holo"); holo.classList.remove("sweep"); void holo.offsetWidth; holo.classList.add("sweep");
      const [x, y] = center(pic); setTimeout(() => { FX.ring(x, y, { vr: 5, max: 34 }); FX.burst(x, y, 34, { speed: 5 }); }, 160);
    }
    switching = false; wordT0 = Date.now();
  }
  function say() {
    const w = words[wordIdx]; if (!w || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(w.kana || w.jp); u.lang = "ja-JP"; u.rate = 0.9;
    const v = speechSynthesis.getVoices().filter((x) => /^ja/i.test(x.lang)); if (v.length) u.voice = v.find((x) => /Nanami|Natural|Online/i.test(x.name)) || v[0];
    speechSynthesis.speak(u);
    const [x, y] = center($("#wSay")); FX.ring(x, y, { vr: 3, max: 26 });
  }
  function restartWordTimer() { wordT0 = Date.now(); }
  setInterval(() => {
    const ms = (+cfg.wordEvery || 0) * 1000, bar = $("#wBar");
    if (!ms || !cfg.show?.word) { bar.style.width = "0"; return; }
    if (hoverWord || switching) { wordT0 += 100; return; }
    const p = (Date.now() - wordT0) / ms; bar.style.width = Math.min(100, p * 100) + "%";
    if (p >= 1) nextWord();
  }, 100);

  // ——— HẠNG ———
  $(".rank").addEventListener("click", () => (cfg.user ? G.openSite("/") : openPanel("login")));
  function renderUser() {
    const u = cfg.user;
    $("#rkAv").textContent = u ? (u.name || "?").trim().charAt(0).toUpperCase() : "?";
    $("#rkName").textContent = u ? u.name || u.username : "Chưa đăng nhập";
    $("#btnAcc").textContent = u ? "Đăng xuất" : "Đăng nhập";
  }
  function countUp(el, to) {
    const from = parseInt(el.textContent.replace(/\D/g, "")) || 0; if (from === to) { el.textContent = to.toLocaleString("vi-VN"); return; }
    const t0 = performance.now(), d = 900;
    const step = (t) => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e).toLocaleString("vi-VN"); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  async function refreshRank() {
    if (!cfg.show?.rank) return;
    const r = await G.rank();
    if (!r?.ok) { $("#rkSub").textContent = "⚠ " + (r?.error || "Không kết nối được trang"); return; }
    countUp($("#rkCount"), r.count || 0);
    if (r.me) {
      const rk = $("#rkRank"); countUp(rk, r.me.rank);
      $("#rkSub").textContent = `${(r.me.score || 0).toLocaleString("vi-VN")} điểm Mạo Hiểm · cập nhật ${new Date(r.at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
      if (lastRank && r.me.rank < lastRank) { const [x, y] = center(rk); FX.confetti(x, y, 90); FX.ring(x, y, { vr: 6 }); toast(`🎉 Lên hạng ${r.me.rank}!`); }
      lastRank = r.me.rank; $("#orbBadge").textContent = "#" + r.me.rank;
    } else {
      $("#rkRank").textContent = "—";
      $("#rkSub").textContent = cfg.user ? "Chưa có điểm trên bảng Tổng" : "Bấm để đăng nhập và xem hạng";
    }
    $("#rkTop").innerHTML = (r.top || []).map((x, i) => `<span>${["🥇", "🥈", "🥉"][i]} <b>${esc(x.name)}</b></span>`).join("");
  }
  setInterval(refreshRank, 5 * 60 * 1000);

  // ——— PHẦN CỨNG ———
  G.on("sys", (d) => { sys = d; renderSys(); });
  function row(k, val, p, sub, warnAt = 90) {
    return `<div class="srow"><div class="k">${k}</div><div class="bar ${p >= warnAt ? "warn" : ""}"><i style="width:${p.toFixed(1)}%"></i></div><div class="v">${val}</div>${sub ? `<div class="sub">${sub}</div>` : ""}</div>`;
  }
  // giữ nguyên phần tử thanh (để thanh trượt mượt): chỉ thay khi số dòng đổi
  function patchRows(html) {
    const box = $("#sysRows"), tmp = document.createElement("div"); tmp.innerHTML = html;
    const a = box.children, b = tmp.children;
    // số dòng đổi, hoặc có dòng không phải thanh thông số (ghi chú) → vẽ lại cả khối
    if (a.length !== b.length || [...a, ...b].some((x) => !x.querySelector(".k"))) { box.innerHTML = html; return; }
    for (let i = 0; i < b.length; i++) {
      const o = a[i], n = b[i];
      o.querySelector(".k").innerHTML = n.querySelector(".k").innerHTML;
      o.querySelector(".v").innerHTML = n.querySelector(".v").innerHTML;
      const ob = o.querySelector(".bar"), nb = n.querySelector(".bar"); ob.className = nb.className; ob.firstChild.style.width = nb.firstChild.style.width;
      const os = o.querySelector(".sub"), ns = n.querySelector(".sub"); if (os && ns) os.innerHTML = ns.innerHTML; else if (!!os !== !!ns) { box.innerHTML = html; return; }
    }
  }
  function updateOrb() {
    if (!sys?.cpu) return;
    const core = $(".orb-core"); core.style.setProperty("--cpu", Math.round(sys.cpu.pct || 0));
    const hot = (sys.cpu.pct || 0) >= 90 || pct(sys.gpu?.vramUsed, sys.gpu?.vramTotal) >= 92 || pct(sys.ram?.used, sys.ram?.total) >= 90;
    $("#orb").classList.toggle("pulse", hot);
    $("#orb").title = `CPU ${(sys.cpu.pct || 0).toFixed(0)}% · GPU ${(+sys.gpu?.pct || 0).toFixed(0)}% · RAM ${pct(sys.ram?.used, sys.ram?.total).toFixed(0)}%${lastRank ? ` · hạng ${lastRank}` : ""}\nBấm để mở lại · kéo sang góc khác`;
  }
  function renderSys() {
    if (!sys || !cfg.show) { if (!sys) $("#sysRows").innerHTML = `<div class="hint">Đang đọc thông số máy…</div>`; return; }
    const s = cfg.show; let h = "";
    updateOrb();
    if (cfg.mode === "compact" && G.platform !== "web" && !sys.rows) {
      const chip = (k, v, p) => `<div><b>${k}</b><span>${v}</span><div class="bar ${p >= 90 ? "warn" : ""}"><i style="width:${(p || 0).toFixed(1)}%"></i></div></div>`;
      const tot = (sys.net?.rx || 0) + (sys.net?.tx || 0);
      h = `<div class="mini">${chip("CPU", sys.cpu.pct.toFixed(0) + "%", sys.cpu.pct)}${chip("GPU", (+sys.gpu?.pct || 0).toFixed(0) + "%", +sys.gpu?.pct || 0)}${chip("RAM", pct(sys.ram?.used, sys.ram?.total).toFixed(0) + "%", pct(sys.ram?.used, sys.ram?.total))}${chip(sys.wifi ? "WI-FI" : "MẠNG", "↓" + fmtRate(sys.net?.rx || 0), Math.min(100, tot / (12.5 * 1048576) * 100))}</div>`;
      $("#sysRows").innerHTML = h; return;
    }
    // bản web không có gadget desktop: các dòng trình duyệt đo được (sys.rows), không có top 5
    if (sys.rows) {
      for (const r of sys.rows) if (s[r.show || "cpu"] !== false) h += row(esc(r.k), esc(r.val), r.p ?? 0, esc(r.sub || ""), r.warn ?? 90);
      if (sys.note) h += `<div class="hint">${sys.note}</div>`;
      patchRows(h); renderTop(); return;
    }
    if (s.cpu) h += row("CPU", `${sys.cpu.pct.toFixed(0)}%`, sys.cpu.pct, esc(`${sys.cpu.name} · ${sys.cpu.cores} luồng`));
    if (s.gpu && sys.gpu) h += row("GPU", `${(+sys.gpu.pct).toFixed(0)}%${sys.gpu.temp != null ? ` · ${(+sys.gpu.temp).toFixed(0)}°C` : ""}`, +sys.gpu.pct, esc(sys.gpu.name), 95);
    if (s.vram && sys.gpu?.vramTotal) h += row("VRAM", `${fmtB(sys.gpu.vramUsed)} / ${fmtB(sys.gpu.vramTotal, 0)}`, pct(sys.gpu.vramUsed, sys.gpu.vramTotal));
    if (s.ram && sys.ram) h += row("RAM", `${fmtB(sys.ram.used)} / ${fmtB(sys.ram.total, 0)}`, pct(sys.ram.used, sys.ram.total), "", 88);
    if (s.disk) for (const d of sys.disks || []) {
      const used = d.total - d.free;
      h += row(`${d.d} ${d.type === "?" ? "" : d.type}`, `${fmtB(d.free, 0)} trống`, pct(used, d.total), esc(`${d.model || d.label || "Ổ đĩa"} · bận ${d.active.toFixed(0)}% · đọc ${fmtRate(d.r)} · ghi ${fmtRate(d.w)}`), 92);
    }
    if (s.net) {
      const w = sys.wifi;
      const bars = w ? `<span class="wifi">${[20, 40, 60, 80].map((t, i) => `<i class="${w.signal >= t ? "on" : ""}" style="height:${3 + i * 2.3}px"></i>`).join("")}</span>` : "";
      const tot = (sys.net?.rx || 0) + (sys.net?.tx || 0);
      h += row(w ? "Wi-Fi" : "Mạng", `↓${fmtRate(sys.net?.rx || 0)}`, Math.min(100, (tot / (12.5 * 1024 * 1024)) * 100), // thang 100 Mbps
        w ? `${bars}${esc(w.ssid)} · ${w.signal}% · ${(w.rx / 1000).toFixed(0)}/${(w.tx / 1000).toFixed(0)} Mbps · ↑${fmtRate(sys.net?.tx || 0)}` : `↑${fmtRate(sys.net?.tx || 0)} · có dây`, 101);
    }
    patchRows(h);
    renderTop();
  }
  document.querySelectorAll("#topTabs button").forEach((b) => b.addEventListener("click", (e) => {
    topTab = b.dataset.t; document.querySelectorAll("#topTabs button").forEach((x) => x.classList.toggle("on", x === b));
    FX.burst(e.clientX, e.clientY, 12, { speed: 3 }); renderTop(true);
  }));
  let lastTopKey = "";
  function renderTop(force) {
    if (sys && !sys.top) { $("#topList").innerHTML = ""; lastTopKey = ""; $("#topHint").innerHTML = sys.topNote || "Mở TiengNhat Gadget trên máy tính để xem top 5 phần mềm ngốn CPU / GPU / mạng."; return; }
    if (!sys?.top) return;
    const L = sys.top[topTab] || []; let max = 1, items;
    if (topTab === "cpu") items = L.map((x) => ({ n: x.n, v: x.v, x: `${x.v.toFixed(1)}%` }));
    else if (topTab === "gpu") items = L.map((x) => ({ n: x.n, v: x.v, x: `${x.v.toFixed(1)}%${x.mem ? ` · ${fmtB(x.mem)}` : ""}` }));
    else if (sys.top.netMode === "etw") items = L.map((x) => ({ n: x.n, v: x.rx + x.tx, x: `↓${fmtRate(x.rx)} ↑${fmtRate(x.tx)}` }));
    else items = L.map((x) => ({ n: x.n, v: x.conn, x: `${x.conn} kết nối` }));
    max = Math.max(1, ...items.map((i) => i.v));
    const key = topTab + items.map((i) => i.n).join("|");
    const html = items.length ? items.map((it, i) => `<li style="--i:${i}"><span class="fill" style="width:${(it.v / max) * 100}%"></span><span class="n">${esc(it.n)}</span><span class="x">${it.x}</span></li>`).join("") : `<li style="--i:0"><span class="n">Chưa có dữ liệu</span><span class="x"></span></li>`;
    const ol = $("#topList");
    if (force || key !== lastTopKey) { ol.innerHTML = html; lastTopKey = key; }
    else { const tmp = document.createElement("ol"); tmp.innerHTML = html; [...ol.children].forEach((li, i) => { const n = tmp.children[i]; if (!n) return; li.querySelector(".x").innerHTML = n.querySelector(".x").innerHTML; li.querySelector(".fill").style.width = n.querySelector(".fill").style.width; }); }
    $("#topHint").innerHTML = topTab === "net" && sys.top.netMode !== "etw" ? `Đang xếp theo số kết nối. <a id="netAdm">Bật đo lưu lượng thật (Admin)</a>` : topTab === "net" ? "Lưu lượng mạng thật theo từng phần mềm (quyền Admin)" : "";
    $("#netAdm")?.addEventListener("click", () => setCfg({ netAdmin: true }).then(() => toast("Xác nhận quyền Admin ở hộp thoại Windows…")));
  }

  // ——— BẢNG TÙY CHỈNH ———
  function openPanel(id, ev) {
    const p = $("#" + id), r = card.getBoundingClientRect();
    if (ev) { p.style.setProperty("--ox", ev.clientX - r.left + "px"); p.style.setProperty("--oy", ev.clientY - r.top + "px"); }
    document.querySelectorAll(".panel.open").forEach((x) => x !== p && x.classList.remove("open"));
    p.classList.add("open");
    card.style.minHeight = "520px";
    if (ev) { FX.ring(ev.clientX, ev.clientY, { vr: 8, max: 40 }); FX.burst(ev.clientX, ev.clientY, 30, { speed: 6 }); }
    if (id === "login") setTimeout(() => $("#lgUser").focus(), 300);
  }
  function closePanels(ev) {
    document.querySelectorAll(".panel.open").forEach((p) => p.classList.remove("open"));
    setTimeout(() => (card.style.minHeight = ""), 500);
    if (ev) FX.burst(ev.clientX, ev.clientY, 16, { speed: 4 });
  }
  $("#btnMenu").addEventListener("click", (e) => ($("#menu").classList.contains("open") ? closePanels(e) : openPanel("menu", e)));
  $("#btnHide").addEventListener("click", () => G.hide());
  $("#btnMode").addEventListener("click", () => setMode(cfg.mode === "compact" ? "full" : "compact"));
  $("#btnCorner").addEventListener("click", (e) => { $("#cornerPick").classList.toggle("open"); FX.burst(e.clientX, e.clientY, 12, { speed: 3 }); });
  document.querySelectorAll(".cp-grid button").forEach((b) => b.addEventListener("click", async (e) => {
    const c = b.dataset.c, act = b.parentElement.dataset.act;
    if (act === "orb") return setMode("orb", c);
    $("#cornerPick").classList.remove("open");
    cfg = { ...cfg, ...(await G.snap(c)) }; applyMode();
    setTimeout(() => { const [x, y] = cornerXY(c); FX.ring(x, y, { vr: 8, max: 44, w: 5 }); FX.burst(x, y, 70, { speed: 8 }); }, 80);
  }));
  document.addEventListener("mousedown", (e) => { if (!e.target.closest("#cornerPick, #btnCorner")) $("#cornerPick").classList.remove("open"); });
  $("#modeSel").addEventListener("change", (e) => setMode(e.target.value));
  $("#orbElSel").addEventListener("change", async (e) => { await setCfg({ orbEl: e.target.value }); curEl = ""; setOrbEl(true); toast(e.target.value === "cycle" ? "🔄 Xoay vòng 7 nguyên tố mỗi 3 giây" : e.target.value === "random" ? "🎲 Nguyên tố ngẫu nhiên mỗi lần thu" : `✨ Quả cầu ${e.target.selectedOptions[0].text}`); });
  function hueOf(hex) { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; }
  $("#zoomSel").addEventListener("change", async (e) => {
    const v = e.target.value; cfg = { ...cfg, ...(await G.setZoom(v === "auto" ? "auto" : +v)) }; applyMode();
    const [x, y] = center(card); FX.ring(x, y, { vr: 8, max: 40 }); toast(`📐 Kích cỡ ${Math.round(cfg.zoomNow * 100)}%`);
  });
  document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closePanels));
  function fillMenu() {
    for (const k of ["bgAlpha", "imgAlpha", "blur", "hue"]) { $("#" + k).value = cfg[k]; $("#" + k + "V").textContent = k === "blur" ? cfg[k] : k === "hue" ? "" : Math.round(cfg[k] * 100) + "%"; }
    $("#fxSel").value = cfg.fx; $("#wordEvery").value = String(cfg.wordEvery); $("#level").value = cfg.level || "all";
    if (allWords.length) filterWords();
    $("#onTop").checked = !!cfg.onTop; $("#autostart").checked = !!cfg.autostart; $("#netAdmin").checked = !!cfg.netAdmin; $("#bridge").checked = cfg.bridge !== false;
    $("#btnInstall").parentElement.style.display = G.canInstall?.() ? "" : "none";
    $("#showChips").innerHTML = SHOW.map(([k, n]) => `<label class="${cfg.show[k] ? "on" : ""}"><input type="checkbox" data-k="${k}" ${cfg.show[k] ? "checked" : ""}>${n}</label>`).join("");
    document.querySelectorAll("#showChips input").forEach((i) => i.addEventListener("change", (e) => {
      const r = e.target.parentElement.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 2, 14, { speed: 3 });
      setCfg({ show: { [i.dataset.k]: i.checked } });
    }));
    $("#ver").textContent = `TiengNhat Gadget v${cfg.version || "1.0.0"}`;
  }
  for (const k of ["bgAlpha", "imgAlpha", "blur", "hue"]) {
    $("#" + k).addEventListener("input", (e) => {
      const v = +e.target.value; cfg[k] = v;
      const r = document.documentElement.style;
      if (k === "bgAlpha") r.setProperty("--bg-alpha", v); if (k === "imgAlpha") r.setProperty("--img-alpha", cfg.bg ? v : 0);
      if (k === "blur") r.setProperty("--blur", v + "px"); if (k === "hue") { r.setProperty("--hue", v); FX.setHue(v); }
      $("#" + k + "V").textContent = k === "blur" ? v : k === "hue" ? "" : Math.round(v * 100) + "%";
    });
    $("#" + k).addEventListener("change", (e) => G.setCfg({ [k]: +e.target.value }));
  }
  $("#fxSel").addEventListener("change", (e) => setCfg({ fx: e.target.value }).then(() => { const [x, y] = center(card); FX.burst(x, y, 60, { speed: 8 }); FX.ring(x, y); }));
  $("#wordEvery").addEventListener("change", (e) => setCfg({ wordEvery: +e.target.value }));
  const lvChange = async (patch, el) => {
    await setCfg(patch); filterWords(); await nextWord();
    const [x, y] = center(el); FX.ring(x, y, { vr: 5, max: 30 }); FX.burst(x, y, 24, { speed: 4 });
    toast(`📚 ${$("#lvCount").textContent}`);
  };
  $("#level").addEventListener("change", (e) => lvChange({ level: e.target.value, lesson: "all" }, e.target));
  $("#lesson").addEventListener("change", (e) => lvChange({ lesson: e.target.value }, e.target));
  $("#onTop").addEventListener("change", (e) => setCfg({ onTop: e.target.checked }));
  $("#autostart").addEventListener("change", (e) => setCfg({ autostart: e.target.checked }));
  $("#netAdmin").addEventListener("change", (e) => setCfg({ netAdmin: e.target.checked }).then(() => e.target.checked && toast("Xác nhận quyền Admin ở hộp thoại Windows…")));
  $("#bridge").addEventListener("change", (e) => setCfg({ bridge: e.target.checked }));
  $("#btnInstall").addEventListener("click", async (e) => {
    const ok = await G.install?.();
    if (ok) { const [x, y] = center(e.target); FX.confetti(x, y, 80); toast("Đã cài — mở từ menu Start hoặc màn hình chính"); }
  });
  $("#bgPick").addEventListener("click", async (e) => {
    const bg = await G.pickBg(); if (!bg) return;
    cfg.bg = bg; cfg._bgv = Date.now(); applyCfg();
    const [x, y] = center(card); FX.ring(x, y, { vr: 10, max: 50, w: 7 }); FX.burst(x, y, 80, { speed: 9, big: true });
  });
  $("#bgClear").addEventListener("click", async () => { cfg.bg = await G.clearBg(); applyCfg(); });
  $("#btnSite").addEventListener("click", () => G.openSite("/"));
  $("#btnQuit").addEventListener("click", () => G.quit());
  $("#btnAcc").addEventListener("click", async (e) => {
    if (cfg.user) { await G.logout(); cfg.user = null; lastRank = null; renderUser(); refreshRank(); toast("Đã đăng xuất"); }
    else openPanel("login", e);
  });
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const u = $("#lgUser").value.trim(), p = $("#lgPass").value;
    if (!u || !p) { $("#lgErr").textContent = "Nhập tên đăng nhập và mật khẩu"; return; }
    $("#lgBtn").disabled = true; $("#lgBtn").textContent = "Đang kết nối…"; $("#lgErr").textContent = "";
    const r = await G.login(u, p);
    $("#lgBtn").disabled = false; $("#lgBtn").textContent = "Đăng nhập"; $("#lgPass").value = "";
    if (!r.ok) { $("#lgErr").textContent = r.error; card.animate([{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }], { duration: 300 }); return; }
    cfg.user = r.user; renderUser(); closePanels();
    const [x, y] = center($("#rkAv")); FX.confetti(x, y, 100); FX.ring(x, y, { vr: 7 }); toast(`Xin chào ${r.user.name}!`);
    refreshRank();
  });
  G.on("toast", toast);
  G.on("cfg", (c) => { cfg = { ...cfg, ...c }; applyCfg(); });

  // ——— khởi động ———
  (async () => {
    cfg = await G.getCfg();
    applyCfg();
    allWords = await G.words();
    filterWords();
    await nextWord(true);
    // mở màn: thẻ bừng sáng
    const [x, y] = center(card); setTimeout(() => { FX.ring(x, y, { vr: 9, max: 50, w: 6 }); FX.burst(x, y, 70, { speed: 8, big: true }); card.classList.add("boom"); setTimeout(() => card.classList.remove("boom"), 700); }, 350);
    refreshRank();
  })();

  // ——— dữ liệu giả để xem thử trong trình duyệt ———
  function mockGadget() {
    let c = { x: 0, y: 0, onTop: false, autostart: false, bg: "", bgAlpha: 0.72, imgAlpha: 0.55, blur: 10, hue: 330, fx: "max", wordEvery: 15, margin: 44, version: "preview",
      show: { rank: true, word: true, cpu: true, gpu: true, vram: true, ram: true, disk: true, net: true, topCpu: true, topGpu: true, topNet: true }, user: { id: "x", name: "Theo", username: "theo" }, netAdmin: false };
    const hs = {};
    const fake = () => ({ cpu: { pct: 20 + Math.random() * 40, name: "Intel(R) Core(TM) i9-14900HX", cores: 32 }, ram: { total: 102e9, used: 38e9 + Math.random() * 4e9 },
      gpu: { name: "NVIDIA GeForce RTX 4090 Laptop GPU", pct: 30 + Math.random() * 60, vramUsed: 14.9e9, vramTotal: 17.1e9, temp: 61 },
      disks: [{ d: "C:", type: "SSD", model: "WD_BLACK SN850X 8000GB", total: 8e12, free: 5.7e12, active: 3, r: 2e6, w: 5e5 }, { d: "H:", type: "USB", model: "Seagate Expansion HDD", total: 28e12, free: 27.7e12, active: 0, r: 0, w: 0 }],
      net: { rx: 2.4e6 * Math.random(), tx: 3e5 }, wifi: { ssid: "Nha_5GHz", signal: 91, rx: 585000, tx: 866700 },
      top: { cpu: [{ n: "chrome", v: 12.4 }, { n: "Code", v: 6.1 }, { n: "ollama", v: 4.2 }, { n: "dwm", v: 2.1 }, { n: "explorer", v: 0.8 }], gpu: [{ n: "ollama", v: 71, mem: 13.1e9 }, { n: "dwm", v: 12, mem: 8e8 }, { n: "chrome", v: 3, mem: 4e8 }], net: [{ n: "chrome", conn: 24 }, { n: "Discord", conn: 6 }, { n: "steam", conn: 4 }], netMode: "conn" } });
    setInterval(() => hs.sys?.(fake()), 2000); setTimeout(() => hs.sys?.(fake()), 300);
    return {
      getCfg: async () => c, setCfg: async (p) => (c = { ...c, ...p, show: { ...c.show, ...(p.show || {}) } }),
      pickBg: async () => "", clearBg: async () => "",
      words: async () => fetch("data/words.json").then((r) => r.json()).catch(() => []),
      rank: async () => ({ ok: true, count: 1287, me: { rank: 42, score: 18350 }, top: [{ name: "Lumine" }, { name: "Aether" }, { name: "Paimon" }], at: Date.now() }),
      login: async () => ({ ok: false, error: "Bản xem thử" }), logout: async () => true,
      openSite() {}, dragStart() {}, dragEnd() {}, ignoreMouse() {}, resize() {}, hide() {}, quit() {},
      on: (ch, f) => { hs[ch === "sys" ? "sys" : ch] = f; },
    };
  }
})();
