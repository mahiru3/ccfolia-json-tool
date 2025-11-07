function generateSVG() {
  const before = document.getElementById('before').value.trim();
  if (!before) return alert('変化前を入力してください');
  const after = document.getElementById('after').value.trim();
  const fontSize = parseInt(document.getElementById('fontSize').value, 10);
  const fontColor = document.getElementById('fontColor').value;
  const bgColor = document.getElementById('bgColor').value;
  const speed = parseInt(document.getElementById('speed').value, 10);

  const beforeArr = before.split(',').map(s => s.trim());
  let afterArr = after ? after.split(',').map(s => s.trim()) : [];
  while (afterArr.length < beforeArr.length) afterArr.push(beforeArr[afterArr.length]);

  const lineHeight = fontSize * 1.4;
  const offsetY = (288 - lineHeight * beforeArr.length) / 2 + fontSize;

  const lines = [];
  const styles = `
    .dash { stroke-dasharray: 4 2; stroke: ${fontColor}; stroke-width: 1; }
    .undashed { stroke: ${fontColor}; stroke-width: 1; }
    .cursor { fill: ${fontColor}; animation: blink 1s step-start infinite; }
    @keyframes blink { 50% { opacity: 0; } }
    text { font-size: ${fontSize}px; fill: ${fontColor}; dominant-baseline: middle; text-anchor: middle; }
  `;

  beforeArr.forEach((kana, i) => {
    const y = offsetY + i * lineHeight;
    lines.push(`
      <g id="line${i}" transform="translate(336, ${y})">
        <text id="text${i}"></text>
        <line id="underline${i}" y1="0" y2="0" x1="-100" x2="100" class="dash"/>
      </g>`);
  });

  const svgScript = `
    const before = ${JSON.stringify(beforeArr)};
    const after = ${JSON.stringify(afterArr)};
    const speed = ${speed};
    const cursor = document.getElementById('cursor');

    async function typeLine(i) {
      const textEl = document.getElementById('text'+i);
      const underline = document.getElementById('underline'+i);
      const kana = before[i];
      const kanji = after[i];
      let str = '';
      for (let j = 0; j < kana.length; j++) {
        str += kana[j];
        textEl.textContent = str;
        await new Promise(r => setTimeout(r, speed));
        const len = textEl.getComputedTextLength();
        textEl.setAttribute('x', 0);
        cursor.setAttribute('x', 336 + len / 2);
        cursor.setAttribute('y', parseFloat(textEl.parentNode.getAttribute('transform').split(',')[1]) - ${fontSize}/2);
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
      for (let i = 0; i < before.length; i++) {
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

  document.getElementById('preview').innerHTML = svg;
  document.getElementById('svgCode').value = svg;
}

function copyCode() {
  const code = document.getElementById('svgCode').value;
  navigator.clipboard.writeText(code).then(() => alert('コピーしました'));
}

function downloadSVG() {
  const code = document.getElementById('svgCode').value;
  const blob = new Blob([code], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'typing.svg';
  a.click();
}
