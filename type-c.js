document.getElementById("convertSmil").onclick = async () => {
  const file = document.getElementById("svgFile").files[0];
  if (!file) return alert("SVGファイルを選択してください。");
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");

  // scriptタグ削除
  doc.querySelectorAll("script").forEach(s => s.remove());

  // カーソルの点滅をSMIL化
  const cursor = doc.getElementById("cursor");
  if (cursor) {
    const anim = doc.createElementNS("http://www.w3.org/2000/svg", "animate");
    anim.setAttribute("attributeName", "opacity");
    anim.setAttribute("values", "1;0;1");
    anim.setAttribute("dur", "1s");
    anim.setAttribute("repeatCount", "indefinite");
    cursor.appendChild(anim);
  }

  // ここに type.js 由来の文字出現などの再現ロジック追加予定

  // 出力
  const serializer = new XMLSerializer();
  const smilSvg = serializer.serializeToString(doc);
  download("typing_smil.svg", smilSvg);
};

document.getElementById("convertApng").onclick = async () => {
  const file = document.getElementById("svgFile").files[0];
  if (!file) return alert("SVGファイルを選択してください。");
  const text = await file.text();

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

  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 400;
  const ctx = canvas.getContext("2d");

  const frames = [];
  for (let i = 0; i < 40; i++) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const b = await new Promise(r => canvas.toBlob(r, "image/png"));
    const arr = new Uint8Array(await b.arrayBuffer());
    frames.push(arr);
  }

  const apng = UPNG.encode(frames, canvas.width, canvas.height, 0, new Array(frames.length).fill(100));
  const blobOut = new Blob([apng], { type: "image/png" });
  download("typing.apng", blobOut);
};

function download(filename, content) {
  const blob = content instanceof Blob ? content : new Blob([content]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
