// para.js（完全版：元のSVG生成仕様＋ホイール色選択＋スポイト＋リアルタイムプレビュー＋確実に閉じる）

const meas = document.createElement("canvas").getContext("2d");

function widthOf(ch, size, family) {
  meas.font = `${size}px ${family}`;
  return meas.measureText(ch).width;
}
function esc(s) {
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function normalizeHex(v){
  const s = String(v ?? "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(s)) return ("#" + s).toLowerCase();
  return null;
}

/* ---------------------------
   ①②リアルタイム文字プレビュー
--------------------------- */
function updateTextPreviews(){
  // ①
  const t1 = document.getElementById("text1")?.value || "";
  const c1 = normalizeHex(document.getElementById("color1")?.value) || "#000000";
  const s1 = Math.max(8, Number(document.getElementById("size1")?.value || 72));
  const f1 = (document.getElementById("font1free")?.value || "").trim()
          || document.getElementById("font1sel")?.value
          || "serif";
  const ls1 = Number(document.getElementById("letter1")?.value || 0);

  const pv1 = document.getElementById("pv1");
  if (pv1) {
    pv1.textContent = t1 || " ";
    pv1.style.color = c1;
    pv1.style.fontFamily = f1;
    pv1.style.fontSize = Math.min(64, s1) + "px";
    pv1.style.letterSpacing = ls1 + "px";
  }

  // ②
  const t2 = document.getElementById("text2")?.value || "";
  const c2 = normalizeHex(document.getElementById("color2")?.value) || "#000000";
  const s2 = Math.max(8, Number(document.getElementById("size2")?.value || 56));
  const f2 = (document.getElementById("font2free")?.value || "").trim()
          || document.getElementById("font2sel")?.value
          || "serif";
  const ls2 = Number(document.getElementById("letter2")?.value || 0);

  const pv2 = document.getElementById("pv2");
  if (pv2) {
    pv2.textContent = t2 || " ";
    pv2.style.color = c2;
    pv2.style.fontFamily = f2;
    pv2.style.fontSize = Math.min(56, s2) + "px";
    pv2.style.letterSpacing = ls2 + "px";
  }
}

/* ---------------------------
   フォント候補を「そのフォント」で表示
--------------------------- */
function applyFontPreviewToSelect(selectId){
  const sel = document.getElementById(selectId);
  if (!sel) return;

  // option自体にfont-family（効かない環境もあるが、効く環境では見やすい）
  [...sel.options].forEach(opt => { opt.style.fontFamily = opt.value; });

  // selectの表示文字も現在選択フォントで描画
  const sync = () => { sel.style.fontFamily = sel.value; };
  sel.addEventListener("change", sync);
  sync();
}

/* ---------------------------
   SVG生成（元仕様そのまま）
--------------------------- */
function buildSVG(){
  // ①
  const t1 = document.getElementById("text1").value || "";
  const c1 = normalizeHex(document.getElementById("color1").value) || "#000000";
  const s1 = Math.max(8, Number(document.getElementById("size1").value || 72));
  const f1 = (document.getElementById("font1free").value || "").trim()
          || document.getElementById("font1sel").value;
  const ls1 = Number(document.getElementById("letter1").value || 0);
  const bd1 = Math.max(0.05, Number(document.getElementById("baseDur1").value || 0.75));
  const spD = Math.max(0.1, Number(document.getElementById("splitDur").value || 1.2));

  // ②
  const t2 = document.getElementById("text2").value || "";
  const c2 = normalizeHex(document.getElementById("color2").value) || "#000000";
  const s2 = Math.max(8, Number(document.getElementById("size2").value || 56));
  const f2 = (document.getElementById("font2free").value || "").trim()
          || document.getElementById("font2sel").value;
  const ls2 = Number(document.getElementById("letter2").value || 0);
  const rD = Math.max(0.1, Number(document.getElementById("riseDur").value || 0.9));
  const aD = Math.max(0, Number(document.getElementById("afterDelay").value || 0.2));
  const hold2 = Math.max(0, Number(document.getElementById("hold2").value || 1.5));
  const fade2 = Math.max(0.05, Number(document.getElementById("fade2").value || 0.8));

  // キャンバス
  const W = 768, H = 432;
  const baseY1 = Math.round(H/2) + Math.round(s1*0.35);
  const baseY2 = Math.round(H/2) + Math.round(s2*0.35);

  // ①配置
  const ch1 = [...t1], w1 = ch1.map(ch => widthOf(ch, s1, f1));
  const tot1 = w1.reduce((a,b)=>a+b,0) + Math.max(0, ch1.length-1)*ls1;
  let x1 = (W - tot1)/2;

  // ②配置
  const ch2 = [...t2], w2 = ch2.map(ch => widthOf(ch, s2, f2));
  const tot2 = w2.reduce((a,b)=>a+b,0) + Math.max(0, ch2.length-1)*ls2;
  let x2 = (W - tot2)/2;

  // ①手書きパラメータ
  const strokeW = Math.max(8, s1*0.38);
  const dashFor = w => Math.max(300, w*12);
  const durFor  = w => (bd1 * Math.max(0.5, Math.min(1.6, w/(s1*0.6)))).toFixed(3) + "s";

  // ① 構築
  let begin = "0s", id = 0;
  const maskDefs = [], traceTexts = [], fillTextsA = [];

  ch1.forEach((ch,i)=>{
    const w = w1[i];
    if (ch === " ") { x1 += w + ls1; return; }

    const aid = `a${++id}`;
    const dash = Math.round(dashFor(w));
    const dur = durFor(w);
    const mx = Math.round(x1);

    maskDefs.push(
      `<mask id="m${id}">`+
        `<text x="${mx}" y="${baseY1}" font-family="${f1}" font-size="${s1}" fill="none" stroke="#fff" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${dash}" stroke-dashoffset="${dash}">`+
          `${esc(ch)}<animate attributeName="stroke-dashoffset" from="${dash}" to="0" dur="${dur}" begin="${begin}" fill="freeze"/>`+
        `</text>`+
      `</mask>`
    );

    traceTexts.push(
      `<text x="${mx}" y="${baseY1}" font-family="${f1}" font-size="${s1}" fill="none" stroke="${c1}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${dash}" stroke-dashoffset="${dash}">`+
        `${esc(ch)}<animate id="${aid}" attributeName="stroke-dashoffset" from="${dash}" to="0" dur="${dur}" begin="${begin}" fill="freeze"/>`+
      `</text>`
    );

    fillTextsA.push(
      `<text x="${mx}" y="${baseY1}" font-family="${f1}" font-size="${s1}" fill="${c1}" mask="url(#m${id})">${esc(ch)}</text>`
    );

    begin = `${aid}.end+0.08s`;
    x1 += w + ls1;
  });

  const lastId = id ? `a${id}` : null;
  const overlap = 0.05; // 下レイヤーを短時間だけ残す
  const gap = 0.01;     // display:none 切替後の安全マージン
  const beginBottom = lastId ? `${lastId}.end+${overlap}s` : "0s";
  const beginTop    = lastId ? `${lastId}.end+${(overlap+gap).toFixed(2)}s` : "0s";
  const halfY = H/2;

  // ②（塗り文字）
  const fillTextsB = [];
  ch2.forEach((ch,i)=>{
    const mx = Math.round(x2);
    fillTextsB.push(
      `<text x="${mx}" y="${baseY2}" font-family="${f2}" font-size="${s2}" fill="${c2}">${esc(ch)}</text>`
    );
    x2 += w2[i] + ls2;
  });

  // SVG
  const svg =
`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${maskDefs.join("\n    ")}
    <mask id="maskTop"><rect x="0" y="0" width="${W}" height="${halfY}" fill="#fff"/></mask>
    <mask id="maskBottom"><rect x="0" y="${halfY}" width="${W}" height="${halfY}" fill="#fff"/></mask>

    <symbol id="glyphsA" viewBox="0 0 ${W} ${H}">
      ${fillTextsA.join("\n      ")}
    </symbol>
    <symbol id="glyphsB" viewBox="0 0 ${W} ${H}">
      ${fillTextsB.join("\n      ")}
    </symbol>
  </defs>

  <!-- ① 手書き線：描画直後に透明化（残像防止） -->
  <g id="traceA">
    ${traceTexts.join("\n    ")}
    ${lastId ? `<animate attributeName="opacity" from="1" to="0" dur="0.1s" begin="${lastId}.end+0.01s" fill="freeze"/>` : ""}
  </g>

  <!-- ① 下レイヤー：短時間の重ね → 完全除外 -->
  <use id="layerBottomA" href="#glyphsA" xlink:href="#glyphsA">
    ${lastId ? `<set attributeName="display" to="none" begin="${beginBottom}" />` : ""}
  </use>

  <!-- ① 上レイヤー（上下分割→左右移動＋フェード） -->
  <use id="layerTopA_Up" href="#glyphsA" xlink:href="#glyphsA" mask="url(#maskTop)">
    ${lastId ? `<animateTransform id="splitMove" attributeName="transform" type="translate" from="0 0" to="200 0" dur="${spD}s" begin="${beginTop}" fill="freeze"/>` : ""}
    ${lastId ? `<animate attributeName="opacity" from="1" to="0" dur="${spD}s" begin="${beginTop}" fill="freeze"/>` : ""}
  </use>
  <use id="layerTopA_Down" href="#glyphsA" xlink:href="#glyphsA" mask="url(#maskBottom)">
    ${lastId ? `<animateTransform attributeName="transform" type="translate" from="0 0" to="-200 0" dur="${spD}s" begin="${beginTop}" fill="freeze"/>` : ""}
    ${lastId ? `<animate attributeName="opacity" from="1" to="0" dur="${spD}s" begin="${beginTop}" fill="freeze"/>` : ""}
  </use>

  <!-- ② 浮かび上がる → 指定秒後に透明化 -->
  <use id="textB" href="#glyphsB" xlink:href="#glyphsB" opacity="0">
    <animate id="appearB" attributeName="opacity" from="0" to="1" dur="${rD}s" begin="splitMove.end+${aD}s" fill="freeze"/>
    <animateTransform attributeName="transform" type="translate" from="0 12" to="0 0" dur="${rD}s" begin="splitMove.end+${aD}s" fill="freeze"/>
    <animate attributeName="opacity" from="1" to="0" dur="${fade2}s" begin="appearB.end+${hold2}s" fill="freeze"/>
  </use>
</svg>`;

  document.getElementById("code").value = svg;
  document.getElementById("previewArea").innerHTML = svg;
}

/* ---------------------------
   クリップボード／DL
--------------------------- */
function copySVG(){
  const t = document.getElementById("code");
  t.focus();
  t.select();
  t.setSelectionRange(0, 999999);
  document.execCommand("copy");
}
function downloadSVG(){
  const svg = document.getElementById("code").value || "";
  const blob = new Blob([svg], {type:"image/svg+xml;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "handwrite_two_stage_autohide.svg";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------------------------
   ホイール型カラーピッカー（モーダル）
   - 必ず閉じる（×/背景/Esc）
   - iro未読込でも閉じるだけは可能
--------------------------- */
let colorPicker = null;
let activeColorTextId = null;
let activeColorBtnId = null;

function setBtnColor(btnId, hex){
  const b = document.getElementById(btnId);
  if (b) b.style.background = hex;
}

function closeColorPanel(){
  const panel = document.getElementById("colorPanel");
  if (panel) panel.hidden = true;
  activeColorTextId = null;
  activeColorBtnId = null;
}

function openColorPanel(title, textId, btnId){
  const panel = document.getElementById("colorPanel");
  const titleEl = document.getElementById("colorPanelTitle");
  const hintEl = document.getElementById("iroHint");
  const textEl = document.getElementById(textId);

  if (!panel || !titleEl || !textEl) return;

  // 1. まず現在の色を確定させる
  const current = normalizeHex(textEl.value) || "#000000";
  
  activeColorTextId = textId;
  activeColorBtnId  = btnId;

  titleEl.textContent = title;
  textEl.value = current;
  setBtnColor(btnId, current);

  // パネルを表示
  panel.hidden = false;

  // iro.js のチェック
  if (!window.iro){
    if (hintEl) hintEl.textContent = "iro.min.js が読み込めていません（同階層配置を確認してください）。";
    return;
  } else {
    if (hintEl) hintEl.textContent = "";
  }

  // 2. 初回だけ生成
  if (!colorPicker){
    try {
      colorPicker = new iro.ColorPicker("#iroMount", {
        width: 260,
        layout: [
          { component: iro.ui.Wheel },
          { component: iro.ui.Slider, options: { sliderType: "value" } }
        ]
      });

      colorPicker.on("color:change", (c) => {
        const hex = c.hexString.toLowerCase();
        const t = document.getElementById(activeColorTextId);
        if (t) t.value = hex;
        if (activeColorBtnId) setBtnColor(activeColorBtnId, hex);

        updateTextPreviews();
        buildSVG();
      });
    } catch(e){
      if (hintEl) hintEl.textContent = "カラーピッカー初期化に失敗しました。";
      console.error(e);
      return;
    }
  }

  // 3. 開くたびに現在色へ同期
  try {
    colorPicker.color.hexString = current;
  } catch(e) {
    console.error(e);
  }
}

async function pickWithEyedropper(textId, btnId){
  if (!("EyeDropper" in window)) return;
  try {
    const eye = new EyeDropper();
    const res = await eye.open();
    const hex = normalizeHex(res.sRGBHex) || "#000000";
    const t = document.getElementById(textId);
    if (t) t.value = hex;
    setBtnColor(btnId, hex);
    updateTextPreviews();
    buildSVG();
  } catch(_) {}
}

/* ---------------------------
   初期化
--------------------------- */
function init(){
  // 初期状態：モーダルは必ず閉じる
  closeColorPanel();

  // フォント候補の見た目
  applyFontPreviewToSelect("font1sel");
  applyFontPreviewToSelect("font2sel");

  // 色ボタンの初期色
  setBtnColor("color1btn", normalizeHex(document.getElementById("color1")?.value) || "#000000");
  setBtnColor("color2btn", normalizeHex(document.getElementById("color2")?.value) || "#000000");

  // モーダル閉じる（×/背景/Esc）
  document.getElementById("colorPanelClose")?.addEventListener("click", (e)=>{ e.preventDefault(); closeColorPanel(); });
  const panel = document.getElementById("colorPanel");
  panel?.addEventListener("click", (e)=>{ if (e.target === panel) closeColorPanel(); });
  document.addEventListener("keydown", (e)=>{ if (e.key === "Escape") closeColorPanel(); });

  // 色ボタンで開く
  document.getElementById("color1btn")?.addEventListener("click", ()=> openColorPanel("色①", "color1", "color1btn"));
  document.getElementById("color2btn")?.addEventListener("click", ()=> openColorPanel("色②", "color2", "color2btn"));

  // スポイト
  document.getElementById("color1eye")?.addEventListener("click", ()=> pickWithEyedropper("color1", "color1btn"));
  document.getElementById("color2eye")?.addEventListener("click", ()=> pickWithEyedropper("color2", "color2btn"));

  // 色コード直打ち → ボタン色同期
  ["color1","color2"].forEach((id)=>{
    const el = document.getElementById(id);
    const btnId = id + "btn";
    el?.addEventListener("input", ()=>{
      const n = normalizeHex(el.value);
      if (n) setBtnColor(btnId, n);
      updateTextPreviews();
      buildSVG();
    });
  });

  // 入力が変わったらプレビュー更新
  [
    "text1","size1","font1sel","font1free","letter1","baseDur1","splitDur",
    "text2","size2","font2sel","font2free","letter2","riseDur","afterDelay","hold2","fade2"
  ].forEach((id)=>{
    const el = document.getElementById(id);
    el?.addEventListener("input", ()=>{ updateTextPreviews(); buildSVG(); });
    el?.addEventListener("change",()=>{ updateTextPreviews(); buildSVG(); });
  });

  // 各種ボタン
  document.getElementById("build")?.addEventListener("click",(e)=>{ e.preventDefault(); buildSVG(); });
  document.getElementById("copy")?.addEventListener("click",(e)=>{ e.preventDefault(); copySVG(); });
  document.getElementById("download")?.addEventListener("click",(e)=>{ e.preventDefault(); downloadSVG(); });

  // 初期生成
  updateTextPreviews();
  buildSVG();
}
if (!colorPicker){
  ...
  colorPicker.on("color:change", ...);
  colorPicker.color.hexString = current; // ★追加：初期黒を潰す
}


window.addEventListener("DOMContentLoaded", init);
