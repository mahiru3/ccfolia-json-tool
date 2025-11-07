// 共通ダウンロード関数
function download(filename, content) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- SMIL SVG 変換 ----------
document.getElementById("convertSmil").onclick = async () => {
  const file = document.getElementById("svgFile").files[0];
  if (!file) return alert("SVGファイルを選択してください。");

  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");

  // <script>を削除
  doc.querySelectorAll("script").forEach(s => s.remove());

  // カーソルの点滅をSMILアニメ化
  const cursor = doc.getElementById("cursor");
  if (cursor) {
    const anim = doc.createElementNS("http://www.w3.org/2000/svg", "animate");
    anim.setAttribute("attributeName", "opacity");
    anim.setAttribute("values", "1;0;1");
    anim.setAttribute("dur", "1s");
    anim.setAttribute("repeatCount", "indefinite");
    cursor.appendChild(anim);
  }

  // テキスト要素に出現アニメーションを付与（単純に順次フェードイン）
  const texts = doc.querySelectorAll("text");
  texts.forEach((t, i) => {
    const anim = doc.createElementNS("http://www.w3.org/2000/svg", "animate");
    anim.setAttribute("attributeName", "opacity");
    anim.setAttribute("from", "0");
    anim.setAttribute("to", "1");
    anim.setAttribute("dur", "0.3s");
    anim.setAttribute("begin", `${i * 0.3}s`);
    anim.setAttribute("fill", "freeze");
    t.setAttribute("opacity", "0");
    t.appendChild(anim);
  });

  // 出力
  const serializer = new XMLSerializer();
  const smilSvg = serializer.serializeToString(doc);
  download("typing_smil.svg", smilSvg);

  // プレビュー更新
  const preview = document.getElementById("preview");
  preview.innerHTML = "";
  const obj = document.createElement("object");
  obj.type = "image/svg+xml";
  obj.data = URL.createObjectURL(new Blob([smilSvg], { type: "image/svg+xml" }));
  obj.width = "800";
  obj.height = "400";
  preview.appendChild(obj);
};

// ---------- APNG 変換 ----------
document.getElementById("convertApng").onclick = async () => {
  const file = document.getElementById("svgFile").files[0];
  if (!file) return alert("SVGファイルを選択してください。");
  const text = await file.text();

  // UPNG.jsロード
  if (!window.UPNG) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/upng-js@2.1.0/UPNG.js";
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  const img = new Image();
  const blob = new Blob([text], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  img.src = url;
  await img.decode();

  // Canvasでフレームを生成
  const canvas = document.createElement("canvas");
  const width = 800;
  const height = 400;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const frames = [];
  const totalFrames = 30;
  const delay = 100;

  for (let i = 0; i < totalFrames; i++) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0);
    const pngBlob = await new Promise(r => canvas.toBlob(r, "image/png"));
    const arr = new Uint8Array(await pngBlob.arrayBuffer());
    frames.push(arr);
  }

  const apng = UPNG.encode(frames, width, height, 0, new Array(frames.length).fill(delay));
  const apngBlob = new Blob([apng], { type: "image/png" });
  download("typing.apng", apngBlob);

  // プレビュー
  const preview = document.getElementById("preview");
  preview.innerHTML = `<img src="${URL.createObjectURL(apngBlob)}" alt="APNG preview" width="400">`;
};
