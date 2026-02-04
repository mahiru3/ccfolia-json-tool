body{
  font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Noto Sans JP",sans-serif;
  margin:24px;
  line-height:1.6
}
h1{font-size:18px;margin:0 0 12px}
fieldset{border:1px solid #ccc;border-radius:8px;padding:12px;margin:0 0 16px}
label{display:block;font-size:13px;margin:6px 0 2px}
input,select,button,textarea{font:inherit}
input[type="text"],input[type="number"],select{
  width:100%;
  box-sizing:border-box;
  padding:6px;
  border:1px solid #bbb;
  border-radius:6px
}
.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.preview{
  border:1px dashed #bbb;
  border-radius:8px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#fafafa;
  min-height:460px
}
textarea{
  width:100%;
  box-sizing:border-box;
  height:220px;
  padding:8px;
  border:1px solid #bbb;
  border-radius:8px;
  font-family:ui-monospace,Consolas,Menlo,monospace;
  font-size:12px;
  white-space:pre
}
.hint{font-size:12px;color:#555}
function applyFontPreviewToSelect(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;

  // option を自分の value のフォントで表示（確実）
  [...sel.options].forEach((opt) => {
    opt.style.fontFamily = opt.value;
  });

  // 選択中のフォントで select の表示も変える（確実）
  const update = () => {
    sel.style.fontFamily = sel.value;
  };
  sel.addEventListener("change", update);
  update();
}

applyFontPreviewToSelect("font1sel");
applyFontPreviewToSelect("font2sel");
function normalizeHex(v) {
  const s = String(v || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(s)) return ("#" + s).toLowerCase();
  return null;
}

function bindColorPair(textId, pickerId) {
  const t = document.getElementById(textId);
  const p = document.getElementById(pickerId);
  if (!t || !p) return;

  // 初期同期（テキスト優先）
  const n = normalizeHex(t.value) || normalizeHex(p.value) || "#000000";
  t.value = n;
  p.value = n;

  // ピッカー → テキスト
  p.addEventListener("input", () => {
    t.value = p.value;
    buildSVG();
  });

  // テキスト → ピッカー（入力中は邪魔しない：blur で確定）
  t.addEventListener("blur", () => {
    const n2 = normalizeHex(t.value);
    if (n2) {
      t.value = n2;
      p.value = n2;
      buildSVG();
    }
  });
}

bindColorPair("color1", "color1picker");
bindColorPair("color2", "color2picker");
