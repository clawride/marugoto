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
  // xoay vòng 7 nguyên tố mỗi 60 giây khi đang thu thành quả cầu
  setInterval(() => { if (document.body.classList.contains("orb") && (cfg.orbEl || "cycle") === "cycle" && !document.hidden) setOrbEl(true); }, 60000);
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
  card.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest("button, input, select, label, a, .panel, .word, .rank, .tabs, form, .cornerpick")) return;
    if (e.pointerType !== "mouse" && !e.target.closest(".hd")) return; // điện thoại: giữ thanh tiêu đề để kéo
    downAt = { x: e.screenX, y: e.screenY, id: e.pointerId };
  });
  let orbDown = false;
  $("#orb").addEventListener("pointerdown", (e) => { if (e.button !== 0) return; downAt = { x: e.screenX, y: e.screenY, id: e.pointerId }; orbDown = true; });
  const dragEl = () => (document.body.classList.contains("orb") ? $("#orb") : card);
  document.addEventListener("pointermove", (e) => {
    if (!downAt || dragging || e.pointerId !== downAt.id) return;
    if (Math.hypot(e.screenX - downAt.x, e.screenY - downAt.y) < (e.pointerType === "mouse" ? 4 : 8)) return;
    if (e.pointerType !== "mouse") navigator.vibrate?.(12);
    dragging = true; card.classList.add("dragging"); G.dragStart();
    const [x, y] = center(card); FX.ring(x, y, { vr: 4, max: 30 }); FX.burst(x, y, 24, { speed: 4 });
    dragLoop();
  });
  const endDrag = () => {
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
  };
  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);
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
  // điện thoại: rung nhẹ + tia sáng khi chạm nút
  card.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch" && e.target.closest("button")) navigator.vibrate?.(8); });
  card.addEventListener("mouseenter", () => { card.style.setProperty("--glow", 0.25); });
  card.addEventListener("mouseleave", () => { if (!dragging) card.style.setProperty("--glow", 0); });

  // ——— TỪ VỰNG ———
  const wordEl = $("#word");
  wordEl.addEventListener("mouseenter", () => (hoverWord = true));
  wordEl.addEventListener("mouseleave", () => (hoverWord = false));
  let sw = null, swallow = false;
  wordEl.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    sw = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
    clearTimeout(sw.hold);
    sw.hold = setTimeout(() => { if (!sw) return; swallow = true; navigator.vibrate?.(20); say(); const [x, y] = center($(".w-pic")); FX.ring(x, y, { vr: 4, max: 30 }); sw = null; }, 550); // chạm giữ → đọc
  });
  wordEl.addEventListener("pointermove", (e) => { if (sw && Math.hypot(e.clientX - sw.x, e.clientY - sw.y) > 10) clearTimeout(sw.hold); });
  const swEnd = (e) => {
    if (!sw || e.pointerId !== sw.id) return;
    clearTimeout(sw.hold);
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
    if (Math.abs(dx) > 45 && Math.abs(dy) < Math.abs(dx) * 0.7) { // vuốt ngang → từ khác, hạt bay theo hướng vuốt
      swallow = true; navigator.vibrate?.(10);
      const r = wordEl.getBoundingClientRect(); FX.burst(dx < 0 ? r.left + 10 : r.right - 10, r.top + r.height / 2, 30, { speed: 6 });
      nextWord();
    }
  };
  wordEl.addEventListener("pointerup", swEnd);
  wordEl.addEventListener("pointercancel", () => { if (sw) clearTimeout(sw.hold); sw = null; });
  wordEl.addEventListener("click", (e) => { if (swallow) { swallow = false; return; } if (!e.target.closest("button")) nextWord(); });
  $("#wNext").addEventListener("click", () => nextWord());
  $("#wSay").addEventListener("click", () => say());
  // lọc theo trình độ / bài đã chọn (cfg.level: a1 | a21 | a22 | ab1 | b11 | b12 | all; cfg.lesson: số bài | all)
  // bộ từ của Sổ Tay: L = [[id, tên, biểu tượng, tên đầy đủ, số từ]], T = [[bộ, số Topic, tiêu đề, nghĩa]], W = [[jp, kana, vi, romaji, topic, ảnh, emoji]]
  let allWords = [], LEVELS = [], TOPICS = [];
  const LV = {};
  function loadWords(d) {
    if (Array.isArray(d)) { allWords = d; return; } // dữ liệu kiểu cũ
    LEVELS = d.L || []; TOPICS = d.T || [];
    for (const [id, name] of LEVELS) LV[id] = name;
    allWords = (d.W || []).map(([jp, kana, vi, ro, t, ii, em]) => {
      const T = TOPICS[t] || [];
      return { jp, kana, vi, ro, em, img: ii >= 0 ? d.I[ii] : "", lv: T[0], t, l: T[1], src: T[0] === "gi" ? `Genshin · ${T[2]}` : `${LV[T[0]] || T[0]} · Topic ${T[1]}` };
    });
    $("#level").innerHTML = `<option value="all">Tất cả (${allWords.length.toLocaleString("vi-VN")} từ)</option>` + LEVELS.map(([id, name, ico, , n]) => `<option value="${id}">${ico} ${name} · ${n.toLocaleString("vi-VN")} từ</option>`).join("");
  }
  const topicName = (i) => { const T = TOPICS[i]; if (!T) return ""; return T[0] === "gi" ? T[2] : `Topic ${T[1]}${T[3] ? " · " + T[3] : T[2] ? " · " + T[2] : ""}`; };
  function filterWords() {
    const lv = cfg.level || "all", ls = cfg.lesson || "all";
    const inLv = allWords.filter((w) => lv === "all" || w.lv === lv);
    const tids = [...new Set(inLv.map((w) => w.t))];
    const sel = $("#lesson");
    $("#level").value = lv === "all" || LV[lv] ? lv : "all";
    sel.innerHTML = `<option value="all">${lv === "gi" ? "Tất cả nhân vật" : "Tất cả Topic"}</option>` + (lv === "all" ? "" : tids.map((t) => `<option value="${t}">${topicName(t)}</option>`).join(""));
    sel.disabled = lv === "all";
    const lsOk = lv !== "all" && ls !== "all" && tids.includes(+ls);
    sel.value = lsOk ? String(ls) : "all";
    // "Tất cả Topic": bỏ từ trùng giữa các Topic (số từ khớp Sổ Tay của trang)
    if (lsOk) words = inLv.filter((w) => w.t === +ls);
    else { const seen = new Set(); words = inLv.filter((w) => !seen.has(w.lv + w.jp) && seen.add(w.lv + w.jp)); }
    if (!words.length) words = allWords;
    wordIdx = -1;
    $("#lvCount").textContent = `${words.length.toLocaleString("vi-VN")} từ · ${lv === "all" ? "mọi bộ" : LV[lv] + (lsOk ? ` · ${topicName(+ls)}` : "")}`;
    if (document.body.classList.contains("quiz")) updateQuizScope();
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
  let switching = false, pendingNext = false;
  async function nextWord(first) {
    if (switching) { pendingNext = true; return; } const w = pick(); if (!w) return; // đang đổi dở → đổi tiếp ngay sau đó (vd. vừa chọn bộ/Topic khác)
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
    else { img.hidden = true; img.removeAttribute("src"); const em = $("#wEm"); em.textContent = w.em || [...w.jp.replace(/[〜~（）()]/g, "")].slice(0, 2).join("") || "🌸"; em.classList.toggle("glyph", !w.em); pic.classList.add("noimg"); }
    wordEl.classList.remove("out"); void wordEl.offsetWidth; wordEl.classList.add("in");
    if (!first && cfg.fx !== "off") {
      const holo = $(".holo"); holo.classList.remove("sweep"); void holo.offsetWidth; holo.classList.add("sweep");
      const [x, y] = center(pic); setTimeout(() => { FX.ring(x, y, { vr: 5, max: 34 }); FX.burst(x, y, 34, { speed: 5 }); }, 160);
    }
    switching = false; wordT0 = Date.now();
    if (pendingNext) { pendingNext = false; nextWord(); }
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
    if (hoverWord || switching || document.body.classList.contains("quiz")) { wordT0 += 100; return; }
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
    const from = parseInt(el.textContent.replace(/\D/g, "")) || 0;
    // trang đang ẩn (tab nền / gadget bị che) thì requestAnimationFrame tạm dừng → đặt số luôn, không đếm
    if (from === to || document.hidden || cfg.fx === "off") { el.textContent = to.toLocaleString("vi-VN"); return; }
    setTimeout(() => { el.textContent = to.toLocaleString("vi-VN"); }, 1100); // chốt số cuối dù khung hình bị dừng giữa chừng
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

  // ——— KIỂM TRA NHANH: 10 câu từ bộ/Topic đang chọn; ẩn từ vựng + thông số máy trong lúc làm ———
  // Dạng câu: nhìn chữ Nhật → chọn nghĩa · nhìn nghĩa → chọn chữ Nhật · nghe → chọn nghĩa. Phím 1–4 để chọn (máy tính).
  const QN = 10, QTIME = 12000;
  let qz = null;
  const shuffleArr = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let actx = null;
  function tone(ok) { // tiếng "ting" khi đúng, "bụp" khi sai
    if (cfg.fx === "off") return;
    try {
      actx ||= new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime, notes = ok ? [880, 1320] : [220, 160];
      notes.forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = ok ? "triangle" : "sawtooth"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t + i * 0.09); g.gain.exponentialRampToValueAtTime(ok ? 0.12 : 0.06, t + i * 0.09 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.25); o.connect(g).connect(actx.destination); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.3); });
    } catch {}
  }
  function updateQuizScope() { $("#qzScope").textContent = `Bộ câu hỏi: ${$("#lvCount").textContent}`; }
  function startQuiz(e) {
    if (words.length < 4) { toast("Cần ít nhất 4 từ để kiểm tra"); return; }
    if (document.body.classList.contains("orb")) setMode(cfg.lastMode || "full");
    closePanels();
    const pool = shuffleArr(words.slice()).slice(0, QN);
    qz = { list: pool, i: 0, score: 0, streak: 0, best: 0, miss: [], t0: 0, timer: 0 };
    document.body.classList.add("quiz"); $("#sQuiz").classList.remove("done");
    updateQuizScope();
    if (e) { FX.ring(e.clientX, e.clientY, { vr: 7, max: 40 }); FX.burst(e.clientX, e.clientY, 40, { speed: 6 }); }
    askQuiz();
  }
  function stopQuiz() {
    clearInterval(qz?.timer); qz = null;
    document.body.classList.remove("quiz"); $("#sQuiz").classList.remove("done");
    const [x, y] = center(card); FX.burst(x, y, 30, { speed: 5 });
    restartWordTimer();
  }
  function distractors(w, field) {
    // nghĩa/chữ gây nhiễu: cùng Topic trước, rồi cùng bộ, rồi bất kỳ — không trùng đáp án
    const out = new Set(), bad = new Set([w[field]]);
    for (const pool of [words.filter((x) => x.t === w.t), words, allWords]) {
      for (const x of shuffleArr(pool.slice(0, 4000))) { if (out.size >= 3) break; if (x[field] && !bad.has(x[field]) && !out.has(x[field])) out.add(x[field]); }
      if (out.size >= 3) break;
    }
    return [...out];
  }
  function askQuiz() {
    clearInterval(qz.timer);
    const w = qz.list[qz.i];
    const kinds = ["jp2vi", "jp2vi", "vi2jp", "listen"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const field = kind === "vi2jp" ? "jp" : "vi";
    const opts = shuffleArr([w[field], ...distractors(w, field)]);
    qz.cur = { w, kind, field, answer: w[field], locked: false };
    $("#qzProg").textContent = `${qz.i + 1}/${QN}`;
    const q = $("#qzQ"); q.className = "qz-q";
    const pic = w.img ? `<div class="qz-pic"><img src="${esc(w.img)}" referrerpolicy="no-referrer" alt=""></div>` : "";
    if (!pic || kind === "vi2jp") q.classList.add("nopic");
    if (kind === "jp2vi") q.innerHTML = `${pic}<div><div class="qz-ask">Từ này nghĩa là gì?</div><div class="qz-main jp">${esc(w.jp)}</div>${w.kana ? `<div class="qz-sub jp">${esc(w.kana)}</div>` : ""}</div>`;
    else if (kind === "vi2jp") q.innerHTML = `<div><div class="qz-ask">Tiếng Nhật của từ này là?</div><div class="qz-main vi">${esc(w.vi)}</div></div>`;
    else q.innerHTML = `${pic}<div><div class="qz-ask">Nghe và chọn nghĩa đúng</div><button class="qz-listen" id="qzSay" title="Nghe lại">🔊</button></div>`;
    if (pic && kind === "vi2jp") q.classList.add("nopic");
    $("#qzOpts").innerHTML = opts.map((o, i) => `<button style="--i:${i}" data-k="${i + 1}" class="${field === "jp" ? "jp" : ""}">${esc(o)}</button>`).join("") + "";
    $("#qzOpts").querySelectorAll("button").forEach((b, i) => b.addEventListener("click", (e) => answer(opts[i], b, e)));
    let fb = $("#qzFb"); if (!fb) { fb = document.createElement("div"); fb.id = "qzFb"; fb.className = "qz-fb"; $("#qzBody").appendChild(fb); }
    fb.innerHTML = "";
    if (kind === "listen") { const sayW = () => speak(w); $("#qzSay").addEventListener("click", sayW); setTimeout(sayW, 250); }
    // đồng hồ
    qz.t0 = Date.now(); const bar = $("#qzTime");
    qz.timer = setInterval(() => {
      const p = 1 - (Date.now() - qz.t0) / QTIME; bar.style.transform = `scaleX(${Math.max(0, p)})`;
      if (p <= 0) answer(null, null);
    }, 50);
  }
  function speak(w) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(w.kana || w.jp); u.lang = "ja-JP"; u.rate = 0.9;
    const v = speechSynthesis.getVoices().filter((x) => /^ja/i.test(x.lang)); if (v.length) u.voice = v.find((x) => /Nanami|Natural|Online/i.test(x.name)) || v[0];
    speechSynthesis.speak(u);
  }
  function answer(choice, btn, e) {
    if (!qz || qz.cur.locked) return;
    qz.cur.locked = true; clearInterval(qz.timer);
    const { w, answer: ans } = qz.cur, ok = choice === ans, q = $("#qzQ");
    $("#qzOpts").querySelectorAll("button").forEach((b) => { b.disabled = true; if (b.textContent === ans) b.classList.add("ok"); });
    const fb = $("#qzFb");
    if (ok) {
      qz.score++; qz.streak++; qz.best = Math.max(qz.best, qz.streak);
      q.classList.add("okq"); tone(true); navigator.vibrate?.(15);
      const [x, y] = btn ? center(btn) : center(q);
      FX.ring(x, y, { vr: 6, max: 34, h: 150 }); FX.burst(x, y, 26 + Math.min(40, qz.streak * 6), { speed: 5 + Math.min(4, qz.streak) });
      if (qz.streak >= 3) { FX.confetti(x, y, 20 + qz.streak * 5); }
      fb.innerHTML = qz.streak >= 3 ? `🔥 Chuỗi ${qz.streak} câu đúng!` : ["Chính xác!", "Tuyệt!", "Giỏi lắm!", "Đúng rồi!"][Math.floor(Math.random() * 4)];
      for (const id of ["#qzScore", "#qzStreak"]) { const el = $(id); el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
    } else {
      qz.streak = 0; qz.miss.push(w);
      q.classList.add("badq"); tone(false); navigator.vibrate?.([30, 40, 30]);
      if (btn) btn.classList.add("bad");
      fb.innerHTML = `${choice == null ? "⏰ Hết giờ · " : ""}Đáp án: <b>${esc(w.jp)}</b>${w.kana ? ` (${esc(w.kana)})` : ""} — ${esc(w.vi)}`;
    }
    $("#qzScore").textContent = `⭐ ${qz.score}`; $("#qzStreak").textContent = `🔥 ${qz.streak}`;
    setTimeout(() => { if (!qz) return; qz.i++; qz.i >= QN ? finishQuiz() : askQuiz(); }, ok ? 900 : 2200);
  }
  function finishQuiz() {
    const { score, best, miss } = qz, stars = score >= 9 ? 3 : score >= 7 ? 2 : score >= 5 ? 1 : 0;
    const key = `${cfg.level || "all"}:${cfg.lesson || "all"}`, prev = (cfg.quizBest || {})[key] || 0;
    if (score > prev) setCfg({ quizBest: { ...(cfg.quizBest || {}), [key]: score } });
    $("#qzRes").innerHTML = `<div class="qz-big">${score}/${QN}</div>
      <div class="qz-stars">${[0, 1, 2].map((i) => `<span style="animation-delay:${i * 0.15}s">${i < stars ? "⭐" : "☆"}</span>`).join("")}</div>
      <p>Chuỗi dài nhất ${best} câu${score > prev ? " · 🏆 Kỷ lục mới!" : prev ? ` · kỷ lục ${prev}/${QN}` : ""}</p>
      ${miss.length ? `<div class="qz-miss">${miss.map((w) => `<div><b>${esc(w.jp)}</b>${w.kana ? ` · ${esc(w.kana)}` : ""} — ${esc(w.vi)}</div>`).join("")}</div>` : ""}
      <div class="row2"><button class="btn" id="qzAgain">↻ Làm lượt mới</button><button class="btn ghost" id="qzBack">Xong</button></div>`;
    $("#sQuiz").classList.add("done");
    $("#qzAgain").addEventListener("click", (e) => startQuiz(e));
    $("#qzBack").addEventListener("click", () => stopQuiz());
    const [x, y] = center(card);
    if (stars) { FX.confetti(x, y - 60, 40 + stars * 40); FX.ring(x, y, { vr: 9, max: 50, w: 6 }); FX.burst(x, y, 60 + stars * 30, { speed: 9, big: true }); }
    toast(stars === 3 ? "🏆 Xuất sắc!" : stars ? "👏 Làm tốt lắm!" : "💪 Luyện thêm nhé!");
    clearInterval(qz.timer);
  }
  document.addEventListener("keydown", (e) => {
    if (!qz || qz.cur?.locked || e.target.closest?.("input, select, textarea")) return;
    const n = +e.key; if (n >= 1 && n <= 4) $("#qzOpts").querySelectorAll("button")[n - 1]?.click();
    if (e.key === "Escape") stopQuiz();
  });

  // ——— TRA CỨU 🔍 ———
  // 📖 Từ & chữ Hán: tìm trong toàn bộ Sổ Tay (chữ / kana / romaji / tiếng Việt) + thẻ chữ Hán (On/Kun, nghĩa, số nét, JLPT…), chạy ngay trên máy
  // 🧩 Phân tích câu: gửi lên /api/analyze của trang → phiên Latinh, dịch, tách từ, ngữ pháp
  let KJ = null, lkTab = "dict";
  const HAN = /[㐀-鿿々]/g, JPCH = /[぀-ヿ㐀-鿿々ー]/;
  async function openLook(e) {
    if (document.body.classList.contains("quiz")) stopQuiz();
    if (document.body.classList.contains("orb")) await setMode(cfg.lastMode || "full");
    closePanels();
    document.body.classList.add("look");
    if (e) { FX.ring(e.clientX, e.clientY, { vr: 7, max: 40 }); FX.burst(e.clientX, e.clientY, 36, { speed: 6 }); }
    renderHist();
    if (!KJ) G.kanji?.().then((k) => (KJ = k || {})).catch(() => (KJ = {}));
    setTimeout(() => $("#lkIn").focus(), 120);
  }
  function closeLook() { document.body.classList.remove("look"); const [x, y] = center(card); FX.burst(x, y, 24, { speed: 4 }); restartWordTimer(); }
  document.querySelectorAll(".lk-tabs button").forEach((b) => b.addEventListener("click", (e) => {
    lkTab = b.dataset.t; document.querySelectorAll(".lk-tabs button").forEach((x) => x.classList.toggle("on", x === b));
    $("#lkIn").placeholder = lkTab === "dict" ? "Gõ từ: 勉強 · べんきょう · benkyou · học tập" : "Dán câu tiếng Nhật (tối đa 600 ký tự) — ví dụ: 日本語を勉強しています。";
    $("#lkIn").rows = lkTab === "dict" ? 1 : 3; $("#lkGo").textContent = lkTab === "dict" ? "Tra" : "Phân tích";
    FX.burst(e.clientX, e.clientY, 12, { speed: 3 }); $("#lkOut").innerHTML = ""; $("#lkIn").focus();
  }));
  $("#lkIn").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#lkForm").requestSubmit(); } });
  $("#lkIn").addEventListener("input", () => { if (lkTab === "dict") { clearTimeout(lkT); lkT = setTimeout(() => doLook(true), 280); } });
  let lkT = 0;
  $("#lkForm").addEventListener("submit", (e) => { e.preventDefault(); doLook(false); });
  function renderHist() {
    const h = cfg.lookHist || [];
    $("#lkHist").innerHTML = h.map((x) => `<button type="button">${esc(x.length > 14 ? x.slice(0, 14) + "…" : x)}</button>`).join("");
    $("#lkHist").querySelectorAll("button").forEach((b, i) => b.addEventListener("click", () => { $("#lkIn").value = h[i]; if (!JPCH.test(h[i]) || h[i].length <= 12) switchTab("dict"); doLook(false); }));
  }
  function switchTab(t) { document.querySelector(`.lk-tabs button[data-t="${t}"]`)?.click(); }
  function remember(q) { const h = [q, ...(cfg.lookHist || []).filter((x) => x !== q)].slice(0, 8); cfg.lookHist = h; G.setCfg({ lookHist: h }); renderHist(); }
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[\s\-'’.]/g, "");
  const kata2hira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  function searchWords(q) {
    const qj = kata2hira(q.trim()), qn = norm(q), jp = JPCH.test(q);
    const seen = new Map(), hits = [];
    for (const w of allWords) {
      let sc = 0;
      if (jp) {
        const a = w.jp, k = kata2hira(w.kana || ""), j2 = kata2hira(a);
        if (a === q || j2 === qj || k === qj) sc = 100; else if (a.startsWith(q) || k.startsWith(qj)) sc = 70; else if (a.includes(q) || k.includes(qj)) sc = 40;
      } else if (qn.length >= 2) {
        const r = norm(w.ro), v = norm(w.vi);
        if (r === qn) sc = 95; else if (r.startsWith(qn)) sc = 65;
        else if (v === qn || v.split(/[,;()/]/).some((p) => p === qn)) sc = 90; else if (v.includes(qn)) sc = 35;
      }
      if (!sc) continue;
      const prev = seen.get(w.jp);
      if (prev) { prev.more = (prev.more || 0) + (prev.w.vi === w.vi && prev.w.lv === w.lv ? 0 : 1); if (sc > prev.sc) prev.sc = sc; continue; }
      const h = { sc, w, more: 0 }; seen.set(w.jp, h); hits.push(h);
    }
    return hits.sort((a, b) => b.sc + (b.w.img ? 2 : 0) - Math.min(20, b.w.jp.length) - (a.sc + (a.w.img ? 2 : 0) - Math.min(20, a.w.jp.length))).slice(0, 40).map((h) => ({ ...h.w, more: h.more }));
  }
  function kanjiCard(k, i) {
    const x = KJ?.[k];
    if (!x) {
      const ex = allWords.filter((w) => w.jp.includes(k)).slice(0, 6);
      return `<div class="lk-k" style="--i:${i}"><div class="lk-kc">${esc(k)}</div><div><b class="vi">Chưa có thẻ chữ này</b><div class="meta">Chữ ngoài 1.303 chữ Hán của lộ trình A1–B1-2</div></div>${ex.length ? `<div class="kw">${ex.map((w) => `<span><b>${esc(w.jp)}</b> ${esc(w.vi)}</span>`).join("")}</div>` : ""}</div>`;
    }
    return `<div class="lk-k" style="--i:${i}"><div class="lk-kc">${esc(k)}</div><div>
      <b class="vi">${esc(x.vi)}</b>
      ${x.on.length ? `<div class="rd"><i>On</i>${esc(x.on.join("・"))}</div>` : ""}${x.kun.length ? `<div class="rd"><i>Kun</i>${esc(x.kun.join("・"))}</div>` : ""}
      <div class="meta">${x.sc ? `${x.sc} nét · ` : ""}${x.jlpt ? `JLPT N${x.jlpt} · ` : ""}học ở ${esc(x.lv)}${x.rad && x.rad !== k ? ` · bộ ${esc(x.rad)}` : ""}</div></div>
      ${x.ex ? `<div class="ex">💡 ${esc(x.ex)}</div>` : ""}${x.mn ? `<div class="ex">🧠 ${esc(x.mn)}</div>` : ""}
      ${x.w.length ? `<div class="kw">${x.w.map(([w, r, v]) => `<span><b>${esc(w)}</b>${r && r !== w ? ` ${esc(r)}` : ""} · ${esc(v)}</span>`).join("")}</div>` : ""}
      ${x.f ? `<button type="button" class="wbtn" data-write="${esc(k)}">✍️ Cách viết · thứ tự nét · luyện viết</button>` : ""}</div>`;
  }
  function wordRow(w, i) {
    return `<div class="lk-w" style="--i:${i}" data-say="${esc(w.kana || w.jp)}"><span class="j">${esc(w.jp)}${w.kana ? `<small>${esc(w.kana)}</small>` : ""}</span><span class="s">${esc(w.src)}${w.more ? ` +${w.more}` : ""}</span>${w.ro ? `<span class="r">${esc(w.ro)}</span>` : ""}<span class="v">${esc(w.vi)}</span></div>`;
  }
  const sayText = (t) => { if (!window.speechSynthesis || !t) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = "ja-JP"; u.rate = 0.9; const v = speechSynthesis.getVoices().filter((x) => /^ja/i.test(x.lang)); if (v.length) u.voice = v.find((x) => /Nanami|Natural|Online/i.test(x.name)) || v[0]; speechSynthesis.speak(u); };
  function bindSay(root) { root.querySelectorAll("[data-say]").forEach((el) => el.addEventListener("click", (e) => { sayText(el.dataset.say); FX.burst(e.clientX, e.clientY, 10, { speed: 3 }); })); }
  async function doLook(live) {
    const q = $("#lkIn").value.trim(), out = $("#lkOut");
    if (!q) { out.innerHTML = ""; return; }
    // câu dài (có dấu câu / nhiều chữ) ở thẻ Từ → gợi ý chuyển sang Phân tích câu
    if (lkTab === "dict") {
      if (!KJ) KJ = (await G.kanji?.().catch(() => ({}))) || {};
      const ks = [...new Set(q.match(HAN) || [])].slice(0, 8);
      const ws = searchWords(q);
      const longJp = JPCH.test(q) && (/[。、！？!?]/.test(q) || q.length > 12);
      out.innerHTML = (longJp ? `<div class="lk-empty">Đây giống một câu — <a id="lkToSent" style="color:hsl(var(--hue) 100% 82%);cursor:pointer;text-decoration:underline">bấm để phân tích câu</a></div>` : "")
        + (ks.length ? `<div class="lk-h">CHỮ HÁN (${ks.length})</div>` + ks.map(kanjiCard).join("") : "")
        + `<div class="lk-h">TỪ VỰNG TRONG SỔ TAY (${ws.length >= 40 ? "40+" : ws.length})</div>`
        + (ws.length ? ws.map(wordRow).join("") : `<div class="lk-empty">Không thấy từ nào khớp. Thử gõ kana, romaji (benkyou) hoặc nghĩa tiếng Việt.</div>`);
      $("#lkToSent")?.addEventListener("click", () => { switchTab("sent"); $("#lkIn").value = q; doLook(false); });
      out.querySelectorAll("[data-write]").forEach((b) => b.addEventListener("click", (e) => openWriter(b.dataset.write, e)));
      bindSay(out);
      if (!live) { remember(q); const [x, y] = center($("#lkGo")); FX.ring(x, y, { vr: 5, max: 28 }); }
      return;
    }
    // Phân tích câu
    if (!JPCH.test(q)) { out.innerHTML = `<div class="lk-empty">Hãy dán một câu có chữ tiếng Nhật.</div>`; return; }
    if (!G.analyze) { out.innerHTML = `<div class="lk-empty">Bản này chưa hỗ trợ phân tích câu.</div>`; return; }
    remember(q);
    out.innerHTML = `<div class="lk-load"><i></i><i></i><i></i><br>Đang phân tích trên tiengnhat.online…</div>`;
    $("#lkGo").disabled = true;
    const r = await G.analyze(q);
    $("#lkGo").disabled = false;
    if (!r?.ok) { out.innerHTML = `<div class="lk-empty">⚠ ${esc(r?.error || "Không phân tích được")}<br>Dưới đây là <b>phân tích sơ bộ ngay trên máy</b> (theo từ điển Sổ Tay, chưa có bản dịch cả câu).</div>` + localAnalyze(q); bindSay(out); return; }
    out.innerHTML = r.sentences.map((s) => `<div class="lk-sent">
      <div class="jp" data-say="${esc(s.jp)}" title="Bấm để nghe">${esc(s.jp)} 🔊</div>
      ${s.ro ? `<div class="ro">${esc(s.ro)}</div>` : ""}${s.vi ? `<div class="vi">🇻🇳 ${esc(s.vi)}</div>` : ""}
      ${s.words?.length ? `<div class="lk-h">TÁCH TỪ</div><div class="lk-seg">${s.words.map((w, i) => `<div style="--i:${i}" data-say="${esc(w.r || w.w)}" title="${esc([w.base && w.base !== w.w ? "Thể gốc: " + w.base : "", w.pos].filter(Boolean).join(" · "))}"><small>${esc(w.r && w.r !== w.w ? w.r : "")}</small><b>${esc(w.w)}</b><small>${esc(w.ro || "")}</small>${w.pos ? `<small class="pos">${esc(w.pos)}</small>` : ""}${w.vi ? `<small>${esc(w.vi)}</small>` : ""}</div>`).join("")}</div>` : ""}
      ${s.grammar?.length ? `<div class="lk-h">NGỮ PHÁP</div><div class="lk-gram">${s.grammar.map((g) => `<div><b>${esc(g.p)}</b> — ${esc(g.vi)}</div>`).join("")}</div>` : ""}
    </div>`).join("");
    bindSay(out);
    const [x, y] = center(out); FX.ring(x, y - 80, { vr: 6, max: 34 }); FX.burst(x, y - 80, 40, { speed: 6 });
  }

  // ——— ✍️ CÁCH VIẾT & LUYỆN VIẾT CHỮ HÁN (nét KanjiVG, chấm nét như trang) ———
  const SVGNS = "http://www.w3.org/2000/svg";
  let wr = null; // { k, paths, tpl, tab, anim, mode, k_, done, scores, user, free, ghost }
  const grid = `<line x1="54.5" y1="2" x2="54.5" y2="107"/><line x1="2" y1="54.5" x2="107" y2="54.5"/><rect x="1" y="1" width="107" height="107" rx="6"/>`;
  async function openWriter(k, ev) {
    const paths = await G.strokes?.(k).catch(() => null);
    if (!paths?.length) { toast("Chưa có dữ liệu nét viết cho chữ này"); return; }
    wr = { k, paths, tpl: paths.map((d) => Stroke.samplePath(d)), tab: "order", mode: "guided", ghost: true, kk: 0, done: [], scores: [], user: [], free: [] };
    $("#lkOut").hidden = true; $("#lkForm").hidden = true; $("#lkHist").hidden = true; document.querySelector(".lk-tabs").hidden = true;
    const box = $("#lkWriter"); box.hidden = false;
    const x = KJ?.[k];
    box.innerHTML = `<div class="wr-head"><div class="wr-k">${esc(k)}</div><div><b>${esc(x?.vi || "")}</b><div class="meta">${paths.length} nét${x?.on?.length ? ` · On ${esc(x.on.join("・"))}` : ""}${x?.kun?.length ? ` · Kun ${esc(x.kun.join("・"))}` : ""}</div></div><button class="ib sm" id="wrBack" title="Quay lại">↩</button></div>
      <div class="tabs wr-tabs"><button data-t="order" class="on">🎬 Thứ tự nét</button><button data-t="practice">✍️ Luyện viết</button></div>
      <div id="wrBody"></div>
      <p class="wr-lic">Nét chữ: KanjiVG © Ulrich Apel · CC BY-SA 3.0</p>`;
    $("#wrBack").addEventListener("click", closeWriter);
    box.querySelectorAll(".wr-tabs button").forEach((b) => b.addEventListener("click", (e) => { wr.tab = b.dataset.t; box.querySelectorAll(".wr-tabs button").forEach((y) => y.classList.toggle("on", y === b)); FX.burst(e.clientX, e.clientY, 12, { speed: 3 }); renderWriter(); }));
    if (ev) { FX.ring(ev.clientX, ev.clientY, { vr: 6, max: 34 }); FX.burst(ev.clientX, ev.clientY, 30, { speed: 5 }); }
    renderWriter();
  }
  function closeWriter() {
    cancelAnim(); wr = null;
    $("#lkWriter").hidden = true; $("#lkWriter").innerHTML = "";
    $("#lkOut").hidden = false; $("#lkForm").hidden = false; $("#lkHist").hidden = false; document.querySelector(".lk-tabs").hidden = false;
  }
  function cancelAnim() { if (wr?.anim) { wr.anim.forEach((a) => a.cancel?.()); wr.anim = null; } clearTimeout(wr?.animT); }
  function svgEl(tag, attrs) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function renderWriter() {
    cancelAnim();
    const body = $("#wrBody");
    if (wr.tab === "order") {
      body.innerHTML = `<div class="wr-stage"><svg viewBox="0 0 109 109" class="wr-svg" id="wrSvg"><g class="wr-grid">${grid}</g><g class="wr-ghost">${wr.paths.map((d) => `<path d="${d}"/>`).join("")}</g><g class="wr-ink" id="wrInk"></g><g class="wr-num" id="wrNum"></g></svg></div>
        <div class="row2 wr-ctl"><button class="btn" id="wrPlay">▶ Xem viết</button><button class="btn ghost" id="wrPrev">◀ Nét</button><button class="btn ghost" id="wrNext">Nét ▶</button></div>
        <p class="hint" id="wrStep">Bấm ▶ để xem cách viết, hoặc xem từng nét.</p>
        <div class="lk-h">TỪNG NÉT (${wr.paths.length})</div>
        <div class="wr-steps">${wr.paths.map((_, i) => `<div style="--i:${i}"><svg viewBox="0 0 109 109"><g class="wr-grid">${grid}</g>${wr.paths.map((d, j) => j <= i ? `<path d="${d}" class="${j === i ? "cur" : "old"}"/>` : "").join("")}${(() => { const p = wr.tpl[i][0]; return `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" class="st"/>`; })()}</svg><small>${i + 1}</small></div>`).join("")}</div>`;
      $("#wrPlay").addEventListener("click", () => playOrder());
      $("#wrPrev").addEventListener("click", () => showStep(Math.max(0, (wr.step ?? wr.paths.length) - 1)));
      $("#wrNext").addEventListener("click", () => showStep(Math.min(wr.paths.length, (wr.step ?? 0) + 1)));
      body.querySelectorAll(".wr-steps > div").forEach((d, i) => d.addEventListener("click", () => showStep(i + 1)));
      setTimeout(playOrder, 250);
      return;
    }
    // luyện viết
    body.innerHTML = `<div class="chips wr-mode"><label class="${wr.mode === "guided" ? "on" : ""}"><input type="radio" name="wrm" value="guided">Theo từng nét (chấm ngay)</label><label class="${wr.mode === "free" ? "on" : ""}"><input type="radio" name="wrm" value="free">Viết tự do</label><label class="${wr.ghost ? "on" : ""}"><input type="checkbox" id="wrGhost" ${wr.ghost ? "checked" : ""}>Hiện chữ mờ</label></div>
      <div class="wr-stage pad"><svg viewBox="0 0 109 109" class="wr-svg" id="wrPadSvg"><g class="wr-grid">${grid}</g><g class="wr-ghost ${wr.ghost ? "" : "off"}">${wr.paths.map((d) => `<path d="${d}"/>`).join("")}</g><g class="wr-okink" id="wrOk"></g><g class="wr-hint" id="wrHintG"></g></svg><canvas id="wrCv"></canvas></div>
      <div class="wr-dots" id="wrDots">${wr.paths.map((_, i) => `<i class="${i < wr.kk && wr.mode === "guided" ? "ok" : ""}"></i>`).join("")}</div>
      <p class="wr-msg" id="wrMsg">${wr.mode === "guided" ? `Viết nét 1 / ${wr.paths.length} vào ô — giữ chuột (hoặc ngón tay) rồi kéo.` : "Viết cả chữ rồi bấm Chấm điểm."}</p>
      <div class="row2"><button class="btn ghost" id="wrClear">🧽 Xóa</button><button class="btn ghost" id="wrHint">💡 Gợi ý nét</button>${wr.mode === "free" ? `<button class="btn" id="wrGrade">✅ Chấm điểm</button>` : ""}</div>`;
    body.querySelectorAll('input[name="wrm"]').forEach((r) => r.addEventListener("change", () => { wr.mode = r.value; resetPractice(); renderWriter(); }));
    $("#wrGhost").addEventListener("change", (e) => { wr.ghost = e.target.checked; renderWriter(); });
    $("#wrClear").addEventListener("click", () => { resetPractice(); renderWriter(); });
    $("#wrHint").addEventListener("click", () => hintStroke(wr.mode === "guided" ? wr.kk : Math.min(wr.free.length, wr.paths.length - 1)));
    $("#wrGrade")?.addEventListener("click", gradeFree);
    if (wr.mode === "guided") wr.done.forEach((i) => $("#wrOk").appendChild(svgEl("path", { d: wr.paths[i] })));
    setupPad();
  }
  function resetPractice() { wr.kk = 0; wr.done = []; wr.scores = []; wr.free = []; }
  // hoạt hình thứ tự nét: từng nét vẽ dần (stroke-dashoffset), số thứ tự hiện ở điểm bắt đầu
  function playOrder() {
    if (!wr) return; cancelAnim();
    const ink = $("#wrInk"), num = $("#wrNum"); if (!ink) return;
    ink.innerHTML = ""; num.innerHTML = ""; wr.anim = []; wr.step = 0;
    let t = 0;
    wr.paths.forEach((d, i) => {
      const p = svgEl("path", { d }); ink.appendChild(p);
      const L = p.getTotalLength(), dur = Math.max(260, L * 9);
      p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
      const a = p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: dur, delay: t, fill: "forwards", easing: "ease-in-out" });
      wr.anim.push(a);
      const s = wr.tpl[i][0], n = svgEl("text", { x: s[0] - 3, y: s[1] - 3 }); n.textContent = i + 1; n.style.opacity = 0; num.appendChild(n);
      wr.anim.push(n.animate([{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: "scale(1)" }], { duration: 250, delay: t, fill: "forwards" }));
      t += dur + 120;
    });
    $("#wrStep").textContent = `Đang viết ${wr.paths.length} nét…`;
    wr.animT = setTimeout(() => { if (!wr) return; $("#wrStep") && ($("#wrStep").textContent = `Xong ${wr.paths.length} nét. Chuyển sang "Luyện viết" để tập.`); const r = $("#wrSvg")?.getBoundingClientRect(); if (r) { FX.ring(r.left + r.width / 2, r.top + r.height / 2, { vr: 5, max: 30 }); FX.burst(r.left + r.width / 2, r.top + r.height / 2, 26, { speed: 4 }); } wr.step = wr.paths.length; }, t);
  }
  function showStep(n) {
    if (!wr) return; cancelAnim(); wr.step = n;
    const ink = $("#wrInk"), num = $("#wrNum"); ink.innerHTML = ""; num.innerHTML = "";
    wr.paths.slice(0, n).forEach((d, i) => {
      const p = svgEl("path", { d, class: i === n - 1 ? "cur" : "" }); ink.appendChild(p);
      if (i === n - 1) { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: Math.max(260, L * 9), fill: "forwards" }); }
      const s = wr.tpl[i][0], t = svgEl("text", { x: s[0] - 3, y: s[1] - 3 }); t.textContent = i + 1; num.appendChild(t);
    });
    $("#wrStep").textContent = n ? `Nét ${n} / ${wr.paths.length}` : "Chưa có nét nào";
  }
  function hintStroke(i) {
    const g = $("#wrHintG"); if (!g || i == null || i >= wr.paths.length) return;
    g.innerHTML = ""; const p = svgEl("path", { d: wr.paths[i] }); g.appendChild(p);
    const L = p.getTotalLength(); p.style.strokeDasharray = L;
    p.animate([{ strokeDashoffset: L, opacity: 1 }, { strokeDashoffset: 0, opacity: 1, offset: .7 }, { strokeDashoffset: 0, opacity: 0 }], { duration: 1500, fill: "forwards" });
    const s = wr.tpl[i][0], t = svgEl("text", { x: s[0] - 3, y: s[1] - 3, class: "hn" }); t.textContent = i + 1; g.appendChild(t);
    t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1500, fill: "forwards" });
  }
  function setupPad() {
    const cv = $("#wrCv"), stage = cv.parentElement, dpr = devicePixelRatio || 1;
    const size = stage.clientWidth; cv.width = size * dpr; cv.height = size * dpr; cv.style.width = cv.style.height = size + "px";
    const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr); ctx.lineCap = ctx.lineJoin = "round";
    const sc = 109 / size; let cur = null;
    const drawAll = () => { ctx.clearRect(0, 0, size, size); ctx.strokeStyle = "#fff"; ctx.lineWidth = size / 109 * 4.2; ctx.shadowColor = `hsl(${cfg.hue} 100% 70%)`; ctx.shadowBlur = 8; for (const st of (wr.mode === "free" ? wr.free : []).concat(cur ? [cur] : [])) { ctx.beginPath(); st.forEach(([x, y], i) => (i ? ctx.lineTo(x / sc, y / sc) : ctx.moveTo(x / sc, y / sc))); ctx.stroke(); } };
    drawAll();
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * sc, (e.clientY - r.top) * sc]; };
    cv.addEventListener("pointerdown", (e) => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch {} cur = [pos(e)]; drawAll(); });
    cv.addEventListener("pointermove", (e) => { if (!cur) return; cur.push(pos(e)); drawAll(); if (Math.random() < 0.25 && cfg.fx !== "off") FX.burst(e.clientX, e.clientY, 1, { speed: 1.2 }); });
    const up = (e) => {
      if (!cur) return; const st = cur; cur = null;
      if (st.length < 2) { drawAll(); return; }
      if (wr.mode === "free") { wr.free.push(st); drawAll(); $("#wrMsg").textContent = `Đã viết ${wr.free.length} / ${wr.paths.length} nét. Viết xong bấm Chấm điểm.`; return; }
      // theo từng nét: chấm ngay
      const user = Stroke.resample(st), r = Stroke.checkStroke(user, wr.tpl, wr.kk, wr.done);
      const msg = $("#wrMsg"); drawAll();
      if (r.ok) {
        wr.done.push(wr.kk); wr.scores.push(r.score || 70);
        const p = svgEl("path", { d: wr.paths[wr.kk], class: r.level }); $("#wrOk").appendChild(p);
        const L = p.getTotalLength(); p.style.strokeDasharray = L; p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 260, fill: "forwards" });
        $("#wrDots").children[wr.kk]?.classList.add(r.level === "good" ? "ok" : "meh");
        tone(true); navigator.vibrate?.(10);
        const end = st.at(-1), cr = cv.getBoundingClientRect(); FX.burst(cr.left + end[0] / sc, cr.top + end[1] / sc, r.level === "good" ? 18 : 8, { speed: 3 });
        wr.kk++;
        msg.className = "wr-msg " + r.level;
        if (wr.kk >= wr.paths.length) return finishGuided();
        msg.textContent = `${r.msg} Tiếp: nét ${wr.kk + 1} / ${wr.paths.length}.`;
      } else {
        tone(false); navigator.vibrate?.([25, 30, 25]);
        msg.className = "wr-msg bad"; msg.textContent = r.msg;
        stage.classList.remove("shake"); void stage.offsetWidth; stage.classList.add("shake");
        hintStroke(r.matchIndex != null ? wr.kk : wr.kk);
      }
    };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  }
  function stars(score) { return score >= 85 ? 3 : score >= 65 ? 2 : score >= 40 ? 1 : 0; }
  function celebrate(st) { const r = $("#wrCv").getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; if (st) { FX.confetti(x, y, 30 + st * 30); FX.ring(x, y, { vr: 8, max: 44, w: 5 }); FX.burst(x, y, 40 + st * 20, { speed: 7 }); } }
  function finishGuided() {
    const sc = Math.round(wr.scores.reduce((a, b) => a + b, 0) / wr.scores.length), st = stars(sc);
    $("#wrMsg").className = "wr-msg good";
    $("#wrMsg").innerHTML = `🎉 Viết xong <b>${esc(wr.k)}</b>! Điểm ${sc}/100 · ${"⭐".repeat(st)}${"☆".repeat(3 - st)} — bấm Xóa để viết lại, hoặc thử "Viết tự do".`;
    celebrate(st);
  }
  function gradeFree() {
    if (!wr.free.length) { $("#wrMsg").textContent = "Hãy viết chữ trước đã."; return; }
    const res = Stroke.checkWhole(wr.free.map((s) => Stroke.resample(s)), wr.tpl), st = stars(res.score);
    const bad = res.strokes.map((s, i) => ({ ...s, i })).filter((s) => s.level !== "good").slice(0, 4);
    $("#wrMsg").className = "wr-msg " + (st >= 2 ? "good" : st ? "ok" : "bad");
    $("#wrMsg").innerHTML = `<b>${res.score}/100</b> ${"⭐".repeat(st)}${"☆".repeat(3 - st)} · hình dạng ${res.shape} · cân đối ${res.balance}<br>${[...res.notes, ...bad.map((s) => s.msg)].map(esc).join("<br>") || "Chữ rất đẹp!"}`;
    celebrate(st);
  }
  // ——— PHÂN TÍCH SƠ BỘ trên máy (khi máy chủ phân tích bận): tách từ dài nhất theo từ điển Sổ Tay + trợ từ/đuôi câu thông dụng ———
  const PARTS = [
    ["しています", "shite imasu", "đang làm (する → している)"], ["していました", "shite imashita", "đã đang làm"], ["しました", "shimashita", "đã làm (する)"], ["します", "shimasu", "làm (する, lịch sự)"], ["して", "shite", "làm rồi… (thể て của する)"],
    ["ています", "te imasu", "đang / trạng thái (V-ている)"], ["ていません", "te imasen", "chưa / không đang (V-ていない)"], ["てください", "te kudasai", "hãy làm ~ (yêu cầu lịch sự)"],
    ["ませんでした", "masen deshita", "đã không (quá khứ phủ định lịch sự)"], ["ました", "mashita", "đã ~ (quá khứ lịch sự)"], ["ません", "masen", "không ~ (phủ định lịch sự)"],
    ["ましょう", "mashou", "cùng ~ nào (rủ rê)"], ["たいです", "tai desu", "muốn ~"], ["たい", "tai", "muốn ~"], ["でした", "deshita", "đã là (quá khứ của です)"],
    ["ではありません", "dewa arimasen", "không phải là"], ["じゃありません", "ja arimasen", "không phải là"], ["です", "desu", "là (lịch sự)"], ["ます", "masu", "đuôi động từ lịch sự"],
    ["から", "kara", "từ ~ / vì ~"], ["まで", "made", "đến ~"], ["より", "yori", "hơn ~ / từ ~"], ["けど", "kedo", "nhưng"], ["が", "ga", "trợ từ chủ ngữ / nhưng"],
    ["は", "wa", "trợ từ chủ đề"], ["を", "o", "trợ từ tân ngữ"], ["に", "ni", "chỉ nơi chốn / thời điểm / đối tượng"], ["へ", "e", "chỉ hướng"], ["で", "de", "nơi diễn ra / phương tiện"],
    ["と", "to", "và / cùng với / trích dẫn"], ["も", "mo", "cũng"], ["の", "no", "của / bổ nghĩa danh từ"], ["か", "ka", "câu hỏi"], ["ね", "ne", "nhỉ (tìm đồng tình)"], ["よ", "yo", "đấy (nhấn mạnh)"], ["や", "ya", "và (liệt kê chưa hết)"],
  ];
  function localAnalyze(text) {
    const dict = new Map(); for (const w of allWords) { if (!dict.has(w.jp)) dict.set(w.jp, w); if (w.kana && !dict.has(w.kana)) dict.set(w.kana, w); }
    const out = []; let i = 0; const s = text.replace(/\s+/g, "");
    while (i < s.length) {
      // từ điển: khớp dài nhất · ngữ pháp: đuôi/trợ từ dài nhất — từ chỉ có kana không được "ăn" mất đuôi ngữ pháp (vd. してい ≠ 師弟, ます ≠ 増す)
      let dw = null, dl = 0, pp = null, pl = 0;
      for (let L = Math.min(12, s.length - i); L >= 1; L--) {
        const sub = s.slice(i, i + L);
        if (!dw && dict.has(sub)) { dw = dict.get(sub); dl = L; }
        if (!pp) { const p = PARTS.find((x) => x[0] === sub); if (p) { pp = p; pl = L; } }
      }
      const kanaOnly = dw && !/[㐀-鿿゠-ヿ々]/.test(s.slice(i, i + dl));
      let hit = null;
      if (dw && (!pp || dl > pl && (!kanaOnly || dl >= pl + 2))) hit = { w: s.slice(i, i + dl), r: dw.kana || "", ro: dw.ro, vi: dw.vi, pos: "" };
      else if (pp) hit = { w: pp[0], r: "", ro: pp[1], vi: pp[2], pos: "ngữ pháp" };
      if (!hit) { const ch = s[i]; hit = { w: ch, r: "", ro: /[぀-ヿ]/.test(ch) ? "" : "", vi: /[。、！？]/.test(ch) ? "" : "?", pos: "" }; }
      const last = out[out.length - 1];
      if (hit.vi === "?" && last?.vi === "?") last.w += hit.w; else out.push(hit);
      i += hit.w.length;
    }
    const gram = out.filter((x) => x.pos === "ngữ pháp");
    const ro = out.map((x) => x.ro || "").filter(Boolean).join(" ");
    return `<div class="lk-sent"><div class="jp" data-say="${esc(text)}">${esc(text)} 🔊</div>${ro ? `<div class="ro">${esc(ro)}</div>` : ""}
      <div class="lk-h">TÁCH TỪ (SƠ BỘ)</div><div class="lk-seg">${out.filter((x) => x.vi !== "").map((x, i) => `<div style="--i:${i}" data-say="${esc(x.r || x.w)}"><small>${esc(x.r)}</small><b>${esc(x.w)}</b><small>${esc(x.ro || "")}</small>${x.pos ? `<small class="pos">${x.pos}</small>` : ""}<small>${esc(x.vi === "?" ? "(chưa có trong Sổ Tay)" : x.vi)}</small></div>`).join("")}</div>
      ${gram.length ? `<div class="lk-h">NGỮ PHÁP NHẬN RA</div><div class="lk-gram">${[...new Map(gram.map((g) => [g.w, g])).values()].map((g) => `<div><b>${esc(g.w)}</b> — ${esc(g.vi)}</div>`).join("")}</div>` : ""}</div>`;
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
  $("#btnQuiz").addEventListener("click", (e) => (document.body.classList.contains("quiz") ? stopQuiz() : startQuiz(e)));
  $("#qzExit").addEventListener("click", () => stopQuiz());
  $("#btnLook").addEventListener("click", (e) => (document.body.classList.contains("look") ? closeLook() : openLook(e)));
  $("#lkExit").addEventListener("click", () => closeLook());
  $("#actLook").addEventListener("click", (e) => (document.body.classList.contains("look") ? closeLook() : openLook(e)));
  $("#actQuiz").addEventListener("click", (e) => (document.body.classList.contains("quiz") ? stopQuiz() : (closeLookIfOpen(), startQuiz(e))));
  const closeLookIfOpen = () => { if (document.body.classList.contains("look")) document.body.classList.remove("look"); };
  new MutationObserver(() => { $("#actLook").classList.toggle("on", document.body.classList.contains("look")); $("#actQuiz").classList.toggle("on", document.body.classList.contains("quiz")); }).observe(document.body, { attributes: true, attributeFilter: ["class"] });

  // ——— thông báo tên miền + ủng hộ (bản web; quản trị bật/tắt và đổi mã QR ở trang quản trị) ———
  let DM = null;
  const VN = 7 * 3600e3, two = (n) => String(n).padStart(2, "0");
  function nextExpiry(mmdd, now) { const [m, d] = mmdd.split("-").map(Number), y = new Date(now + VN).getUTCFullYear(); let t = Date.UTC(y, m - 1, d) - VN; if (t <= now) t = Date.UTC(y + 1, m - 1, d) - VN; return t; }
  function tickDomain() {
    if (!DM) return;
    const now = Date.now(), end = nextExpiry(DM.expire || "09-01", now), left = Math.max(0, end - now);
    const days = Math.floor(left / 864e5), h = Math.floor((left % 864e5) / 36e5), mi = Math.floor((left % 36e5) / 6e4), s = Math.floor((left % 6e4) / 1e3);
    const ed = new Date(end + VN), lvl = days <= 30 ? "danger" : days <= 90 ? "warn" : "";
    $(".dm").className = "dm " + lvl;
    $("#dmTitle").textContent = `Tên miền tiengnhat.online hết hạn ${two(ed.getUTCDate())}/${two(ed.getUTCMonth() + 1)}/${ed.getUTCFullYear()}`;
    $("#dmSub").textContent = lvl === "danger" ? "⏰ Sắp hết hạn — cần gia hạn gấp!" : lvl === "warn" ? "⚠️ Sắp đến hạn gia hạn" : "Gia hạn mỗi năm vào ngày này";
    $("#dmCount").innerHTML = [[days, "ngày"], [h, "giờ"], [mi, "phút"], [s, "giây"]].map(([v, l]) => `<div><b>${l === "ngày" ? v : two(v)}</b><small>${l}</small></div>`).join("");
  }
  async function loadDomain() {
    if (!G.site) return;
    const s = await G.site().catch(() => null), d = s?.donate;
    if (!d?.on) { $("#sDomain").hidden = true; return; }
    DM = d; $("#sDomain").hidden = false;
    $("#dmMsg").innerHTML = `Phí duy trì tên miền <b>${esc(d.cost ?? 35)}$ mỗi năm</b>. Trang học miễn phí cho mọi người — mong một trong số các bạn ủng hộ <b>1$ hoặc dưới 1$</b> để duy trì tên miền. Cảm ơn bạn! 💖${d.note ? `<br><small>${esc(d.note)}</small>` : ""}`;
    tickDomain();
  }
  setInterval(tickDomain, 1000);
  $("#dmBtn").addEventListener("click", (e) => {
    const q = $("#dmQr");
    if (!q.hidden) { q.hidden = true; $("#dmBtn").textContent = "💖 Đồng ý ủng hộ"; return; }
    q.innerHTML = DM?.qrSrc ? `<img src="${esc(DM.qrSrc)}" alt="Mã QR ủng hộ"><p>Quét bằng ứng dụng ngân hàng / ví điện tử. Cảm ơn tấm lòng của bạn!</p>` : `<p>Quản trị chưa cài mã QR — bạn quay lại sau nhé. Cảm ơn bạn!</p>`;
    q.hidden = false; $("#dmBtn").textContent = "Ẩn mã QR";
    FX.confetti(e.clientX, e.clientY, 50); FX.ring(e.clientX, e.clientY, { vr: 6, max: 34, h: 330 });
  });
  $("#btnMode").addEventListener("click", () => setMode(cfg.mode === "compact" ? "full" : "compact"));
  $("#btnCorner").addEventListener("click", (e) => { $("#cornerPick").classList.toggle("open"); FX.burst(e.clientX, e.clientY, 12, { speed: 3 }); });
  document.querySelectorAll(".cp-grid button").forEach((b) => b.addEventListener("click", async (e) => {
    const c = b.dataset.c, act = b.parentElement.dataset.act;
    if (act === "orb") return setMode("orb", c);
    $("#cornerPick").classList.remove("open");
    cfg = { ...cfg, ...(await G.snap(c)) }; applyMode();
    setTimeout(() => { const [x, y] = cornerXY(c); FX.ring(x, y, { vr: 8, max: 44, w: 5 }); FX.burst(x, y, 70, { speed: 8 }); }, 80);
  }));
  document.addEventListener("pointerdown", (e) => { if (!e.target.closest("#cornerPick, #btnCorner")) $("#cornerPick").classList.remove("open"); });
  $("#modeSel").addEventListener("change", (e) => setMode(e.target.value));
  $("#orbElSel").addEventListener("change", async (e) => { await setCfg({ orbEl: e.target.value }); curEl = ""; setOrbEl(true); toast(e.target.value === "cycle" ? "🔄 Xoay vòng 7 nguyên tố mỗi 60 giây" : e.target.value === "random" ? "🎲 Nguyên tố ngẫu nhiên mỗi lần thu" : `✨ Quả cầu ${e.target.selectedOptions[0].text}`); });
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
    // cài làm ứng dụng: có lời mời cài của trình duyệt → nút; đã cài / trình duyệt không hỗ trợ → hướng dẫn
    const inst = G.canInstall?.(), standalone = matchMedia("(display-mode: standalone), (display-mode: window-controls-overlay)").matches || navigator.standalone;
    $("#btnInstall").parentElement.style.display = inst ? "" : "none";
    $("#instHint").innerHTML = standalone ? "✓ Đang chạy như ứng dụng." : inst ? "Có biểu tượng riêng, mở trong cửa sổ riêng như phần mềm."
      : /iPhone|iPad|iPod/.test(navigator.userAgent) ? "Trên iPhone/iPad: mở bằng <b>Safari</b> → nút <b>Chia sẻ</b> → <b>Thêm vào MH chính</b>."
      : "Chrome / Edge: bấm biểu tượng cài đặt (⊕) ở cuối thanh địa chỉ, hoặc menu <b>⋮</b> → <b>Cài đặt ứng dụng</b>. Android: menu ⋮ → <b>Thêm vào màn hình chính</b>.";
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
  // ——— dải mời cài ứng dụng (bản web) ———
  const INST_KEY = "tng_inst_hide";
  function updateInstBar() {
    if (G.platform !== "web") return;
    const standalone = matchMedia("(display-mode: standalone), (display-mode: window-controls-overlay)").matches || navigator.standalone;
    let hidden = false; try { hidden = Date.now() - (+localStorage.getItem(INST_KEY) || 0) < 7 * 864e5; } catch {}
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const can = !!G.canInstall?.();
    $("#instBar").hidden = standalone || hidden || (!can && !ios && !document.body.classList.contains("phone") && !matchMedia("(pointer: coarse)").matches && !/Chrome|Edg/.test(navigator.userAgent));
    $("#instBarGo").hidden = !can;
    $("#instBarHint").innerHTML = can ? "Mở nhanh như một ứng dụng, dùng được cả khi mất mạng"
      : ios ? "Trong <b>Safari</b>: bấm <b>Chia sẻ</b> ⬆️ → <b>Thêm vào MH chính</b>"
      : /Android/.test(navigator.userAgent) ? "Menu <b>⋮</b> của trình duyệt → <b>Thêm vào màn hình chính</b> / <b>Cài đặt ứng dụng</b>"
      : "Bấm biểu tượng cài đặt ⊕ ở cuối thanh địa chỉ, hoặc menu <b>⋮</b> → <b>Cài đặt ứng dụng</b>";
  }
  $("#instBarGo").addEventListener("click", async (e) => { const ok = await G.install?.(); if (ok) { FX.confetti(e.clientX, e.clientY, 80); toast("Đã cài — mở từ màn hình chính / menu Start"); } updateInstBar(); });
  $("#instBarX").addEventListener("click", () => { try { localStorage.setItem(INST_KEY, String(Date.now())); } catch {} $("#instBar").hidden = true; });
  G.on("cfg", () => updateInstBar());
  setTimeout(updateInstBar, 400);
  // lối tắt của ứng dụng đã cài (nhấn giữ biểu tượng): /gadget?tab=look | quiz
  setTimeout(() => { const t = new URLSearchParams(location.search).get("tab"); if (t === "look") openLook(); else if (t === "quiz") startQuiz(); }, 1500);

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
    loadWords(await G.words());
    loadDomain();
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
