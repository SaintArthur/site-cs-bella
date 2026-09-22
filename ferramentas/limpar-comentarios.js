#!/usr/bin/env node
'use strict';

/* Remove comentários do HTML publicado, mantendo-os no repositório.
 *
 * Por que existe: as anotações de trabalho desta página (pendências, fases de lançamento, nomes de
 * parceiros, tamanho da base de clientes) vivem em comentários de HTML, de CSS e de JavaScript.
 * Elas são úteis a quem dá manutenção e não têm por que viajar até o navegador de um visitante —
 * ainda mais num site que existe para vender o produto.
 *
 * Só o arquivo publicado é limpo. O repositório continua com tudo.
 *
 * O JavaScript não dá para limpar com expressão regular: "https://" dentro de uma string e regex
 * como /\/\// enganam qualquer busca por "//". Por isso o arquivo é percorrido caractere a
 * caractere, reconhecendo string, template literal e regex antes de decidir o que é comentário.
 *
 * Se em algum ponto a leitura ficar ambígua, a ferramenta para e a publicação é abortada. Publicar
 * um comentário vazado é ruim; publicar JavaScript corrompido é pior.
 */

const fs = require('fs');
const path = require('path');

/* ---------- CSS, dentro de <style> ---------- */

function semComentariosCss(html) {
  return html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, abre, corpo, fecha) =>
    abre + corpo.replace(/\/\*[\s\S]*?\*\//g, '') + fecha);
}

/* ---------- HTML ---------- */

function semComentariosHtml(html) {
  // Preserva os condicionais do IE (<!--[if ...]>), que são instrução e não anotação.
  return html.replace(/<!--(?!\[if)(?:(?!-->)[\s\S])*?-->/g, '');
}

/* ---------- JavaScript ---------- */

// Depois destas palavras, uma "/" começa uma regex e não uma divisão.
const PALAVRAS_ANTES_DE_REGEX = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
  'throw', 'case', 'do', 'else', 'yield', 'await',
]);

const ehIdent = (c) => c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || c === '_' || c === '$';

function podeSerRegex(anterior, tipo) {
  if (tipo === null) return true;              // começo do script
  if (tipo === 'valor') return false;          // string, número, regex ou template: "/" é divisão
  if (tipo === 'ident') return PALAVRAS_ANTES_DE_REGEX.has(anterior);
  // Depois de ")" ou "]" quase sempre é divisão — (a+b)/2 é muito mais comum que if(x) /re/.test(y).
  return anterior !== ')' && anterior !== ']';
}

function semComentariosJs(code) {
  let saida = '';
  let anterior = '';
  let tipo = null;
  let i = 0;
  const n = code.length;

  const emitir = (txt, t) => { saida += txt; anterior = txt; tipo = t; };

  while (i < n) {
    const c = code[i];
    const d = code[i + 1];

    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { saida += c; i++; continue; }

    if (c === '/' && d === '/') {                       // comentário de linha
      while (i < n && code[i] !== '\n') i++;
      continue;
    }

    if (c === '/' && d === '*') {                       // comentário de bloco
      const fim = code.indexOf('*/', i + 2);
      if (fim === -1) throw new Error('comentário de bloco sem fechamento');
      if (code[i + 2] === '!') saida += code.slice(i, fim + 2);   // /*! ... */ é licença: preserva
      i = fim + 2;
      continue;
    }

    if (c === '"' || c === "'") {                       // string
      let j = i + 1;
      for (;;) {
        if (j >= n) throw new Error('string sem fechamento');
        if (code[j] === '\\') { j += 2; continue; }
        if (code[j] === c) { j++; break; }
        if (code[j] === '\n') throw new Error('quebra de linha dentro de string');
        j++;
      }
      emitir(code.slice(i, j), 'valor'); i = j; continue;
    }

    if (c === '`') {                                    // template literal, com ${ } aninhado
      let j = i + 1;
      let prof = 0;
      for (;;) {
        if (j >= n) throw new Error('template literal sem fechamento');
        const k = code[j];
        if (k === '\\') { j += 2; continue; }
        if (prof === 0) {
          if (k === '`') { j++; break; }
          if (k === '$' && code[j + 1] === '{') { prof++; j += 2; continue; }
          j++; continue;
        }
        // dentro de ${ }: strings podem conter chaves, então precisam ser puladas
        if (k === '"' || k === "'" || k === '`') {
          const aspas = k;
          j++;
          for (;;) {
            if (j >= n) throw new Error('string sem fechamento dentro de template');
            if (code[j] === '\\') { j += 2; continue; }
            if (code[j] === aspas) { j++; break; }
            j++;
          }
          continue;
        }
        if (k === '{') prof++;
        else if (k === '}') prof--;
        j++;
      }
      emitir(code.slice(i, j), 'valor'); i = j; continue;
    }

    if (c === '/') {                                    // regex ou divisão
      if (podeSerRegex(anterior, tipo)) {
        let j = i + 1;
        let classe = false;
        for (;;) {
          if (j >= n) throw new Error('regex sem fechamento');
          const k = code[j];
          if (k === '\\') { j += 2; continue; }
          if (k === '\n') throw new Error('quebra de linha dentro de regex');
          if (k === '[') classe = true;
          else if (k === ']') classe = false;
          else if (k === '/' && !classe) { j++; break; }
          j++;
        }
        while (j < n && code[j] >= 'a' && code[j] <= 'z') j++;   // flags
        emitir(code.slice(i, j), 'valor'); i = j; continue;
      }
      emitir('/', 'pont'); i++; continue;
    }

    if (ehIdent(c)) {                                   // identificador, palavra-chave ou número
      let j = i;
      while (j < n && ehIdent(code[j])) j++;
      const txt = code.slice(i, j);
      emitir(txt, txt[0] >= '0' && txt[0] <= '9' ? 'valor' : 'ident');
      i = j; continue;
    }

    emitir(c, 'pont'); i++;
  }

  return saida;
}

/* ---------- verificações ---------- */

function analisa(code) {
  try { new Function(code); return true; } catch (_) { return false; }
}

// Garante que a limpeza só apagou caracteres: nada foi inserido nem reordenado.
function ehSubsequencia(pedaco, inteiro) {
  let i = 0;
  for (let j = 0; j < inteiro.length && i < pedaco.length; j++) {
    if (pedaco[i] === inteiro[j]) i++;
  }
  return i === pedaco.length;
}

/* ---------- <script> ---------- */

const TIPOS_EXECUTAVEIS = new Set(['', 'text/javascript', 'application/javascript', 'module']);

function semComentariosScripts(html, notas) {
  return html.replace(/(<script\b([^>]*)>)([\s\S]*?)(<\/script>)/gi, (tudo, abre, attrs, corpo, fecha) => {
    if (/\bsrc\s*=/i.test(attrs)) return tudo;                        // arquivo externo, não é nosso
    const tipo = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]*)/i) || ['', ''])[1].toLowerCase();
    if (!TIPOS_EXECUTAVEIS.has(tipo)) return tudo;                    // JSON-LD e afins: não têm comentário

    const parseavel = analisa(corpo);

    let limpo;
    try {
      limpo = semComentariosJs(corpo);
    } catch (erro) {
      throw new Error(`não consegui ler um <script> com segurança: ${erro.message}`);
    }

    if (!ehSubsequencia(limpo, corpo)) {
      throw new Error('a limpeza de um <script> alterou o código em vez de só remover comentários');
    }
    if (parseavel && !analisa(limpo)) {
      throw new Error('um <script> ficaria inválido depois da limpeza');
    }
    if (!parseavel) {
      notas.push(`um <script>${tipo ? ` type="${tipo}"` : ''} não pôde ser conferido por análise sintática (só por subsequência)`);
    }

    return abre + limpo + fecha;
  });
}

/* ---------- ---------- */

function limpar(html, notas) {
  html = semComentariosCss(html);
  html = semComentariosScripts(html, notas);
  html = semComentariosHtml(html);
  html = html.replace(/\r\n/g, '\n');
  html = html.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n');
  return html;
}

function main() {
  const [origem, destino] = process.argv.slice(2);
  if (!origem || !destino) {
    console.error('uso: node ferramentas/limpar-comentarios.js <origem.html> <destino.html>');
    process.exit(2);
  }

  const antes = fs.readFileSync(origem, 'utf8');
  const notas = [];
  const depois = limpar(antes, notas);
  fs.writeFileSync(destino, depois);

  for (const nota of notas) console.log(`  aviso: ${nota}`);
  console.log(`  ${path.basename(origem)}: ${antes.length} -> ${depois.length} caracteres (${antes.length - depois.length} removidos)`);
}

if (require.main === module) {
  try {
    main();
  } catch (erro) {
    console.error(`  ERRO: ${erro.message}`);
    console.error('  nada foi escrito; a publicação deve ser abortada.');
    process.exit(1);
  }
}

module.exports = { limpar, semComentariosJs, ehSubsequencia };
