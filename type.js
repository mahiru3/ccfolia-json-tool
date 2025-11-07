function addRow() {
  const tbody = document.querySelector('#inputTable tbody');
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="text" class="before"></td>
    <td><input type="text" class="after"></td>
    <td><input type="checkbox" class="break"></td>
    <td><input type="number" class="start" value="1" min="1"></td>
  `;
  tbody.appendChild(row);
}

function getInputData() {
  const rows = document.querySelectorAll('#inputTable tbody tr');
  const result = [];
  rows.forEach(row => {
    const before = row.querySelector('.before').value.trim();
    const after = row.querySelector('.after').value.trim();
    const breakLine = row.querySelector('.break').checked;
    const start = parseInt(row.querySelector('.start').value, 10) || 1;
    if (before || after) {
      result.push({ before, after: after || before, break: breakLine, start });
    }
  });
  return result;
}

function generateSVG() {
  const inputData = getInputData();
  const fontSize = parseInt(document.getElementById('fontSize').value, 10);
  const fontColor = document.getElementById('fontColor').value;
  const bgColor = document.getElementById('bgColor').value;
  const speed = parseInt(document.getElementById('speed').value, 10);

  const lineHeight = fontSize * 1.6;
  const underlineY = fontSize * 0.85;
  const charWidth = fontSize * 0.6;

  const styles = `
    .dash { stroke-dasharray: 4 2; stroke: ${fontColor}; stroke-width: 1; }
    .undashed { stroke: ${fontColor}; stroke-width: 1; }
    .cursor { fill: ${fontColor}; animation: blink 1s step-start infinite; }
    @keyframes blink { 50% { opacity: 0; } }
    text {
      font-family: 'Noto Sans JP', sans-serif;
      font-size: ${fontSize}px;
      fill: ${fontColor};
      text-anchor: start;
      dominant-baseline: alphabetic;
    }
  `;

  const lines = [];
  let y = fontSize * 1.5;

  inputData.forEach((item, i) => {
    const x = (item.start - 1) * charWidth + 20;
    lines.push(`
      <g id="line${i}" transform="translate(${x}, ${y})">
        <text id="text${i}" x="0" y="0"></text>
        <line id="underline${i}" y1="${underlineY}" y2="${underlineY}" x1="0" x2="0" class="dash"/>
      </g>`);
    if (item.break) y += lineHeight;
  });

  const svgScript = `
    const inputData = ${JSON.stringify(inputData)};
    const speed = ${speed};
    const fontSize = ${fontSize};
    const underlineY = ${underlineY};
    const cursor = document.getElementById('cursor');

    async function typeLine(i) {
      const textEl = document.getElementById('text' + i);
      const underline = document.getElementById('underline' + i);
      const kana = inputData[i].before;
      const kanji = inputData[i].after;
      let str = '';

      for (let j = 0; j < kana.length; j++) {
        str += kana[j];
        textEl.textContent = str;
        await new Promise(r => setTimeout(r, speed));

        const len = textEl.getComputedTextLength();
        cursor.setAttribute('x', parseFloat(textEl.parentNode.getAttribute('transform').split(',')[0]) + len);
        cursor.setAttribute('y', parseFloat(textEl.parentNode.getAttribute('transform').split(',')[1]) - fontSize);
        underline.setAttribute('x2', len);
      }

      await new Promise(r => setTimeout(r, 300));
      textEl.textContent = kanji;
      const len = textEl.getComputedTextLength();
      underline.setAttribute('x2', len);
      underline.setAttribute('class', 'undashed');
    }

    async function animate() {
      for (let i = 0; i < inputData.length; i++) {
        await typeLine(i);
        const underline = document.getElementById('underline' + i);
        await new Promise(r => setTimeout(r, 300));
        underline.setAttribute('visibility', 'hidden');
      }
      cursor.remove();
    }

    animate();
  `.replace(/<\/script>/gi, '<\\/script>');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
  <style>${styles}</style>
  <rect width="100%" height="100%" fill="${bgColor}"/>
  ${lines.join('\n')}
  <rect id="cursor" width="2" height="${fontSize}" class="cursor" x="0" y="0"/>
  <script><![CDATA[${svgScript}]]></script>
</svg>`;

  const preview = document.getElementById('preview');
  preview.innerHTML = '';

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const object = document.createElement('object');
  object.type = 'image/svg+xml';
  object.data = url;
  object.width = 800;
  object.height = 400;

  preview.appendChild(object);
  document.getElementById('svgCode').value = svg;
}

function copyCode() {
  const text = document.getElementById('svgCode').value;
  navigator.clipboard.writeText(text);
  alert('SVGコードをコピーしました');
}

function downloadSVG() {
  const text = document.getElementById('svgCode').value;
  const blob = new Blob([text], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'typing.svg';
  a.click();
}

async function generateAPNG() {
  const object = document.querySelector('#preview object');
  if (!object) {
    alert('まずSVG生成！');
    return;
  }

  // UPNGライブラリを動的ロード
  if (!window.UPNG) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/upng-js@2.1.0/UPNG.js";
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  // SVGドキュメントを取得（object内の中身）
  const svgDoc = object.contentDocument;
  if (!svgDoc) {
    alert("SVGが読み込まれていません。少し待ってから再試行してください。");
    return;
  }

  const svgEl = svgDoc.querySelector("svg");
  const width = svgEl.viewBox.baseVal.width || svgEl.width.baseVal.value || 800;
  const height = svgEl.viewBox.baseVal.height || svgEl.height.baseVal.value || 400;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const frames = [];
  const frameDelay = 100; // ms
  const totalFrames = 60; // 6秒分

  for (let i = 0; i < totalFrames; i++) {
    // SVG内部をそのまま画像として描画
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.src = url;
    await img.decode();

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0);

    const pngBlob = await new Promise(r => canvas.toBlob(r, "image/png"));
    const buffer = await pngBlob.arrayBuffer();
    frames.push(new Uint8Array(buffer));

    URL.revokeObjectURL(url);
    await new Promise(r => setTimeout(r, frameDelay));
  }

  const delays = new Array(frames.length).fill(frameDelay);
  const apng = UPNG.encode(frames, width, height, 0, delays);
  const apngBlob = new Blob([apng], { type: "image/png" });
  const apngUrl = URL.createObjectURL(apngBlob);

  const a = document.createElement("a");
  a.href = apngUrl;
  a.download = "typing.apng";
  a.click();
  URL.revokeObjectURL(apngUrl);
}
