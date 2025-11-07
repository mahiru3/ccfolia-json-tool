function addRow() {
  const tbody = document.querySelector('#inputTable tbody');
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input type="text" class="before"></td>
    <td><input type="text" class="after"></td>
    <td><input type="checkbox" class="break" checked></td>
    <td><input type="number" class="start" value="1" min="1" max="16"></td>
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
    const start = parseInt(row.querySelector('.start').value || '1', 10);
    if (before) {
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

  const lineHeight = fontSize * 1.4;
  const underlineY = fontSize * 0.6;
  const charsPerLine = 16;
  const charWidth = fontSize * 0.6;
  const lineCenter = 336;

  const lines = [];
  const styles = `
    .dash { stroke-dasharray: 4 2; stroke: ${fontColor}; stroke-width: 1; }
    .undashed { stroke: ${fontColor}; stroke-width: 1; }
    .cursor { fill: ${fontColor}; animation: blink 1s step-start infinite; }
    @keyframes blink { 50% { opacity: 0; } }
    text { font-family: 'Noto Sans JP', sans-serif; font-size: ${fontSize}px; fill: ${fontColor}; dominant-baseline: middle; text-anchor: middle; }
  `;

  let y = fontSize;

  inputData.forEach((item, i) => {
    // 中央を基準に開始位置を計算（1文字=charWidth）
    const x = lineCenter - (charsPerLine / 2 - (item.start - 1)) * charWidth;
    lines.push(`
      <g id="line${i}" transform="translate(${x}, ${y})">
        <text id="text${i}"></text>
        <line id="underline${i}" y1="${underlineY}" y2="${underlineY}" x1="-100" x2="100" class="dash"/>
      </g>`);
    if (item.break) y += lineHeight;
  });

  const svgScript = `
    const inputData = ${JSON.stringify(inputData)};
    const speed = ${speed};
    const fontSize = ${fontSize};
    const cursor = document.getElementById('cursor');

    async function typeLine(i) {
      const textEl = document.getElementById('text'+i);
      const underline = document.getElementById('underline'+i);
      const kana = inputData[i].before;
      const kanji = inputData[i].after;
      let str = '';
      for (let j = 0; j < kana.length; j++) {
        str += kana[j];
        textEl.textContent = str;
        await new Promise(r => setTimeout(r, speed));
        const len = textEl.getComputedTextLength();
        textEl.setAttribute('x', 0);
        cursor.setAttribute('x', parseFloat(textEl.parentNode.getAttribute('transform').split(',')[0].replace('translate(', '')) + len / 2);
        cursor.setAttribute('y', parseFloat(textEl.parentNode.getAttribute('transform').split(',')[1]) - fontSize/2);
        underline.setAttribute('x1', -len/2);
        underline.setAttribute('x2', len/2);
      }
      await new Promise(r => setTimeout(r, 400));
      textEl.textContent = kanji;
      const len = textEl.getComputedTextLength();
      textEl.setAttribute('x', 0);
      underline.setAttribute('x1', -len/2);
      underline.setAttribute('x2', len/2);
      underline.setAttribute('class', 'undashed');
    }

    async function animate() {
      for (let i = 0; i < inputData.length; i++) {
        await typeLine(i);
      }
      cursor.remove();
    }

    animate();
  `.replace(/<\/script>/gi, '<\\/script>');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="672" height="288" viewBox="0 0 672 288">
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
  object.width = 672;
  object.height = 288;

  preview.appendChild(object);
  document.getElementById('svgCode').value = svg;
}

function copyCode() {
  const code = document.getElementById('svgCode').value;
  navigator.clipboard.writeText(code);
  alert('SVGコードをコピーしました！');
}

function downloadSVG() {
  const svg = document.getElementById('svgCode').value;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'typing.svg';
  a.click();
  URL.revokeObjectURL(url);
}
