// Função para formatar resposta da IA em HTML seguro
export default function formatResponseSafe(text) {
  if (!text) return '';

  const escapeHTML = (s) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  let src = escapeHTML(text);

  // Blocos de código ```...```
  const codeBlocks = [];
  src = src.replace(/```([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(code.trim());
    return `@@CODEBLOCK_${codeBlocks.length - 1}@@`;
  });

  // Código inline `code`
  const inlineCodes = [];
  src = src.replace(/`([^`]+)`/g, (_, code) => {
    inlineCodes.push(code.trim());
    return `@@INLINECODE_${inlineCodes.length - 1}@@`;
  });

  // Negrito e itálico simples
  src = src
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>');

  // Processa por linhas: listas e parágrafos
  const lines = src.split(/\r?\n/);
  const out = [];
  let ul = null;
  let ol = null;

  const flushUL = () => {
    if (ul && ul.length) out.push('<ul>' + ul.map((li) => `<li>${li}</li>`).join('') + '</ul>');
    ul = null;
  };
  const flushOL = () => {
    if (ol && ol.length) out.push('<ol>' + ol.map((li) => `<li>${li}</li>`).join('') + '</ol>');
    ol = null;
  };
  const flushAll = () => {
    flushUL();
    flushOL();
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    // Linha com apenas • e item na próxima linha
    if (raw.trim() === '•') {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      const item = j < lines.length ? lines[j].trim() : '';
      if (item) {
        flushOL();
        if (!ul) ul = [];
        ul.push(item);
        i = j;
        continue;
      }
    }

    // • texto
    const mBulletDot = raw.match(/^\s*•\s+(.*)$/);
    if (mBulletDot) {
      flushOL();
      if (!ul) ul = [];
      ul.push(mBulletDot[1]);
      continue;
    }

    // - texto | * texto
    const mBullet = raw.match(/^\s*[*-]\s+(.*)$/);
    if (mBullet) {
      flushOL();
      if (!ul) ul = [];
      ul.push(mBullet[1]);
      continue;
    }

    // 1. texto
    const mNum = raw.match(/^\s*\d+\.\s+(.*)$/);
    if (mNum) {
      flushUL();
      if (!ol) ol = [];
      ol.push(mNum[1]);
      continue;
    }

    // Linha vazia => quebra
    if (raw.trim() === '') {
      flushAll();
      out.push('<br />');
      continue;
    }

    // Parágrafo
    flushAll();
    out.push(`<p>${raw}</p>`);
  }
  flushAll();

  let html = out.join('');

  // Repor códigos
  html = html.replace(/@@INLINECODE_(\d+)@@/g, (_, idx) => `<code>${inlineCodes[Number(idx)]}</code>`);
  html = html.replace(
    /@@CODEBLOCK_(\d+)@@/g,
    (_, idx) => `<pre style="background:#222;color:#fff;padding:10px;border-radius:6px;overflow:auto"><code>${codeBlocks[Number(idx)]}</code></pre>`
  );

  return html;
}
