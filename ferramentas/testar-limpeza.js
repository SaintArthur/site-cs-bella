#!/usr/bin/env node
'use strict';

/* Testes do limpador de comentários.
 *
 * O que importa aqui não é o caso fácil (um /* nota *​/ solto), e sim os que enganam uma limpeza
 * feita com expressão regular: "//" dentro de string, regex com barra escapada, template literal
 * com chave dentro de string. Um erro nesses casos publica JavaScript quebrado.
 */

const { semComentariosJs, limpar, ehSubsequencia } = require('./limpar-comentarios.js');

let passou = 0;
let falhou = 0;

function teste(nome, entrada, esperado) {
  let obtido;
  try {
    obtido = semComentariosJs(entrada).trim();
  } catch (erro) {
    obtido = `ERRO: ${erro.message}`;
  }
  const ok = obtido === esperado.trim();
  if (ok) { passou++; console.log(`  ok   ${nome}`); }
  else {
    falhou++;
    console.log(`  FALHA ${nome}`);
    console.log(`        esperado: ${JSON.stringify(esperado.trim())}`);
    console.log(`        obtido:   ${JSON.stringify(obtido)}`);
  }
}

console.log('\nremoção básica');
teste('comentário de bloco', 'const a=1;/* nota interna */const b=2;', 'const a=1;const b=2;');
teste('comentário de linha', 'const a=1; // pendência\nconst b=2;', 'const a=1; \nconst b=2;');
teste('bloco de várias linhas', 'a();\n/* nota\n   em duas linhas */\nb();', 'a();\n\nb();');
teste('licença /*! preservada', '/*! (c) fulano */\na();', '/*! (c) fulano */\na();');

console.log('\nstrings — onde a regex ingênua estraga tudo');
teste('URL em string dupla', 'const u="https://csbella.ia.br/agenda";', 'const u="https://csbella.ia.br/agenda";');
teste('URL em string simples', "const u='https://x.com//y';", "const u='https://x.com//y';");
teste('bloco falso dentro de string', 'const s="/* isto não é comentário */";', 'const s="/* isto não é comentário */";');
teste('aspas escapadas', 'const s="ele disse \\"oi//tchau\\"";', 'const s="ele disse \\"oi//tchau\\"";');
teste('comentário depois de string', 'const u="http://a"; // nota\nb();', 'const u="http://a"; \nb();');

console.log('\ntemplate literal');
teste('template com URL', 'const t=`https://x/${a}//b`;', 'const t=`https://x/${a}//b`;');
teste('template com chave em string', 'const t=`${ f("}") }fim`;', 'const t=`${ f("}") }fim`;');
teste('template aninhado', 'const t=`a${`b${c}d`}e`;', 'const t=`a${`b${c}d`}e`;');
teste('comentário após template', 'const t=`x`; /* nota */ y();', 'const t=`x`;  y();');

console.log('\nregex versus divisão');
teste('regex com barra escapada', 'const r=/https:\\/\\//g;', 'const r=/https:\\/\\//g;');
teste('regex em argumento', "s.split(/\\//).length;", "s.split(/\\//).length;");
teste('regex com classe contendo barra', 'const r=/[/*]/;', 'const r=/[/*]/;');
teste('divisão simples', 'const m=a/b/c;', 'const m=a/b/c;');
teste('divisão após parêntese', 'const m=(a+b)/2;', 'const m=(a+b)/2;');
teste('divisão após colchete', 'const m=v[0]/2;', 'const m=v[0]/2;');
teste('regex após return', 'function f(){return /ab\\/cd/.test(s)}', 'function f(){return /ab\\/cd/.test(s)}');
teste('comentário após regex', 'const r=/a/; // nota\nb();', 'const r=/a/; \nb();');

console.log('\nsegurança: entrada ambígua deve parar, não adivinhar');
teste('bloco sem fechamento', 'a(); /* nota que ninguém fechou', 'ERRO: comentário de bloco sem fechamento');
teste('string que acaba com o arquivo', 'const s="aberta;', 'ERRO: string sem fechamento');
teste('string cortada por quebra de linha', 'const s="aberta;\nb();', 'ERRO: quebra de linha dentro de string');
teste('template sem fechamento', 'const t=`aberto;', 'ERRO: template literal sem fechamento');
teste('regex sem fechamento', 'const r=/aberta;\nb();', 'ERRO: quebra de linha dentro de regex');

console.log('\ndocumento inteiro');
{
  const html = [
    '<!-- nota de HTML -->',
    '<style>/* nota de CSS */ .a{color:red}</style>',
    '<script type="application/ld+json">{"@type":"FAQPage","url":"https://x/y"}</script>',
    '<script src="externo.js"></script>',
    '<script>/* nota de JS */ const u="https://x//y"; // outra nota\n</script>',
  ].join('\n');
  const saida = limpar(html, []);
  const checa = (nome, cond) => {
    if (cond) { passou++; console.log(`  ok   ${nome}`); }
    else { falhou++; console.log(`  FALHA ${nome}`); }
  };
  checa('nota de HTML removida', !saida.includes('nota de HTML'));
  checa('nota de CSS removida', !saida.includes('nota de CSS'));
  checa('nota de JS removida', !saida.includes('nota de JS'));
  checa('nota de linha removida', !saida.includes('outra nota'));
  checa('JSON-LD intacto', saida.includes('{"@type":"FAQPage","url":"https://x/y"}'));
  checa('script externo intacto', saida.includes('<script src="externo.js">'));
  checa('URL preservada', saida.includes('const u="https://x//y";'));
  checa('só removeu caracteres', ehSubsequencia(saida.replace(/\r\n/g, '\n'), html.replace(/\r\n/g, '\n')));
}

console.log(`\n${passou} passaram, ${falhou} falharam\n`);
process.exit(falhou ? 1 : 0);
