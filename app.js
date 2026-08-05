// 生活词汇单词卡 —— 多章 · 图鉴+闪卡双模式 / 短语+对话分区块 / Web Speech TTS
const STATE = { data: { chapters: [] }, chapterIdx: 0, sceneIdx: 0, mode: "atlas" };

async function load() {
  const res = await fetch("data_all.json?v=20260805b");
  STATE.data = await res.json();
  if (!STATE.data.chapters || !STATE.data.chapters.length) return;
  document.getElementById("chapterTitle").textContent = "生活词汇单词卡";
  renderChapterNav();
  selectChapter(0);
}

function selectChapter(ci) {
  STATE.chapterIdx = ci;
  STATE.sceneIdx = 0;
  document.querySelectorAll("#chapterNav .chapter-tab").forEach((b, i) =>
    b.classList.toggle("active", i === ci));
  renderNav();
  renderScene();
  if (window.innerWidth <= 640) window.scrollTo({ top: 0, behavior: "smooth" });
}

function curChapter() { return STATE.data.chapters[STATE.chapterIdx]; }
function cur() { return curChapter().scenes[STATE.sceneIdx]; }

function renderChapterNav() {
  const nav = document.getElementById("chapterNav");
  nav.innerHTML = "";
  STATE.data.chapters.forEach((c, i) => {
    const b = document.createElement("button");
    b.className = "chapter-tab" + (i === STATE.chapterIdx ? " active" : "");
    b.textContent = c.chapter || ("Chapter " + (i + 1));
    b.onclick = () => selectChapter(i);
    nav.appendChild(b);
  });
}

function renderNav() {
  document.getElementById("chapterTitle").textContent = curChapter().chapter + " · 单词卡";
  const nav = document.getElementById("sceneNav");
  nav.innerHTML = "";
  curChapter().scenes.forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "scene-tab" + (i === STATE.sceneIdx ? " active" : "");
    // 只显示中文名部分，去掉英文副标题更紧凑
    const label = (s.scene || "").split(" ")[0];
    b.textContent = label;
    b.onclick = () => { STATE.sceneIdx = i; renderNav(); renderScene(); if (window.innerWidth <= 640) window.scrollTo({ top: 0, behavior: "smooth" }); };
    nav.appendChild(b);
  });
}

function renderScene() {
  const s = cur();
  document.getElementById("sceneImg").src = s.image || "";
  renderAtlas(s);
  renderFlash(s);
  renderPhrases(s);
  renderDialogues(s);
}

function renderAtlas(s) {
  const list = document.getElementById("atlasList");
  list.innerHTML = "";
  (s.vocab || []).forEach(v => {
    const d = document.createElement("div");
    d.className = "atlas-item";
    const no = document.createElement("span"); no.className = "no"; no.textContent = v.item_no;
    const en = document.createElement("span");
    const e = document.createElement("span"); e.className = "en"; e.textContent = v.english;
    const ph = document.createElement("span"); ph.className = "ph"; ph.textContent = " " + (v.phonetic || "");
    en.append(e, ph);
    const cn = document.createElement("span"); cn.className = "cn"; cn.textContent = v.chinese;
    d.append(no, en, cn);
    d.onclick = () => openModal(v);
    list.appendChild(d);
  });
}

function renderFlash(s) {
  const wrap = document.getElementById("flashCards");
  wrap.innerHTML = "";
  (s.vocab || []).forEach(v => {
    const f = document.createElement("div");
    f.className = "flip";
    const inner = document.createElement("div"); inner.className = "flip-inner";
    const front = document.createElement("div"); front.className = "flip-front";
    const no = document.createElement("span"); no.className = "no"; no.textContent = v.item_no;
    const en = document.createElement("div"); en.className = "en"; en.textContent = v.english;
    front.append(no, en);
    const back = document.createElement("div"); back.className = "flip-back";
    const ph = document.createElement("div"); ph.className = "ph"; ph.textContent = v.phonetic || "";
    const cn = document.createElement("div"); cn.className = "cn"; cn.textContent = v.chinese;
    back.append(ph, cn);
    if (v.notes) { const nt = document.createElement("div"); nt.className = "notes"; nt.textContent = v.notes; back.append(nt); }
    inner.append(front, back);
    f.append(inner);
    f.onclick = () => f.classList.toggle("flipped");
    wrap.appendChild(f);
  });
}

function renderPhrases(s) {
  const ul = document.getElementById("phraseList");
  ul.innerHTML = "";
  (s.phrases || []).forEach(p => {
    const li = document.createElement("li");
    const en = document.createElement("span"); en.className = "en"; en.textContent = p.english;
    const cn = document.createElement("span"); cn.className = "cn"; cn.textContent = p.chinese || "";
    const spk = document.createElement("button"); spk.className = "speak-btn"; spk.title = "朗读"; spk.textContent = "🔊";
    spk.onclick = () => speak(p.english);
    li.append(en, cn, spk);
    if (p.example) {
      const ex = document.createElement("div"); ex.className = "example";
      ex.textContent = "💡 " + p.example + (p.example_zh ? "（" + p.example_zh + "）" : "");
      li.appendChild(ex);
    }
    ul.appendChild(li);
  });
  if (!(s.phrases || []).length) ul.innerHTML = '<li style="color:#9aa3ad">（该场景暂无短语，待 OCR 填充）</li>';
}

function renderDialogues(s) {
  const box = document.getElementById("dialogueList");
  box.innerHTML = "";
  (s.dialogues || []).forEach(dlg => {
    const pair = document.createElement("div");
    pair.className = "dlg-pair";
    if (dlg.title) {
      const t = document.createElement("div");
      t.className = "dlg-title";
      t.textContent = dlg.title;
      if (dlg.source) {
        const tag = document.createElement("span");
        tag.className = "dlg-src " + (dlg.source.indexOf("AI") >= 0 ? "ai" : "orig");
        tag.textContent = dlg.source;
        t.appendChild(tag);
      }
      pair.appendChild(t);
    }
    (dlg.lines || []).forEach(line => {
      const role = (line.who || "A") === "A" ? "a" : "b";
      const row = document.createElement("div");
      row.className = "dlg-line " + role;
      const who = document.createElement("span"); who.className = "who"; who.textContent = line.who || "A";
      const wrap = document.createElement("div"); wrap.className = "bubble-wrap";
      const bub = document.createElement("span"); bub.className = "bubble"; bub.textContent = line.en || "";
      const zh = document.createElement("span"); zh.className = "zh"; zh.textContent = line.zh || "";
      wrap.append(bub, zh);
      const spk = document.createElement("button"); spk.className = "spk"; spk.textContent = "🔊"; spk.onclick = () => speak(line.en);
      row.append(who, wrap, spk);
      pair.appendChild(row);
    });
    box.appendChild(pair);
  });
  if (!(s.dialogues || []).length) box.innerHTML = '<div style="color:#9aa3ad">（该场景暂无对话，待 OCR 填充）</div>';
}

function openModal(v) {
  const m = document.getElementById("modal");
  const c = document.getElementById("modalCard");
  c.innerHTML = "";
  const no = document.createElement("div"); no.className = "no"; no.textContent = "#" + v.item_no;
  const en = document.createElement("div"); en.className = "en"; en.textContent = v.english;
  const ph = document.createElement("div"); ph.className = "ph"; ph.textContent = v.phonetic || "";
  const cn = document.createElement("div"); cn.className = "cn"; cn.textContent = v.chinese;
  const spk = document.createElement("button"); spk.className = "spk"; spk.textContent = "🔊 朗读";
  spk.onclick = () => speak(v.english);
  c.append(no, en, ph, cn, spk);
  if (v.notes) { const nt = document.createElement("div"); nt.className = "notes"; nt.textContent = v.notes; c.append(nt); }
  m.classList.remove("hidden");
}
document.getElementById("modalBackdrop").onclick = () =>
  document.getElementById("modal").classList.add("hidden");

function speak(text) {
  if (!text || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US"; u.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function setMode(m) {
  STATE.mode = m;
  document.getElementById("atlasView").classList.toggle("hidden", m !== "atlas");
  document.getElementById("flashView").classList.toggle("hidden", m !== "flash");
  document.getElementById("btnAtlas").classList.toggle("active", m === "atlas");
  document.getElementById("btnFlash").classList.toggle("active", m === "flash");
}
document.getElementById("btnAtlas").onclick = () => setMode("atlas");
document.getElementById("btnFlash").onclick = () => setMode("flash");

document.querySelectorAll(".speak-all").forEach(btn => {
  btn.onclick = () => {
    const s = cur();
    const t = btn.dataset.target;
    let texts = [];
    if (t === "phrase") texts = (s.phrases || []).map(p => p.english);
    if (t === "dialogue") texts = (s.dialogues || []).flatMap(d => (d.lines || []).map(l => l.en));
    texts.forEach((x, i) => setTimeout(() => speak(x), i * 1300));
  };
});

load();
