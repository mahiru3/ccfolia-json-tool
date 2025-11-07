function generateSVG() {
  // SVG生成ロジック
  const svg = `<svg>...</svg>`;
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
