# Pendências — landing page do CS Bella

Levantado em 23/09/2026. Números conferidos por contagem no `index.html` desta data.

---

## 1. O trial é de 7 dias — aqui ainda diz 15

**23 ocorrências** de "15 dias", em 16 contextos distintos. O CS Barber já foi
corrigido (commit `b848887`, 19 pontos); aqui não.

Onde costuma aparecer, pelo que o Barber mostrou: meta description, og:description,
CTA do cabeçalho, do menu mobile, do hero, da dobra 2 e do dock, os dois selos de
confiança, o passo da dobra "como funciona", respostas do FAQ, as mesmas respostas
no FAQPage do JSON-LD, o título da dobra do formulário e a mensagem que o
formulário monta para o WhatsApp.

**Duas armadilhas ao corrigir:**

1. **Os comentários de briefing dentro do arquivo também afirmam 15 dias** — há
   linhas como "O trial comunicado é o de 15 dias do sistema" e uma tabela com
   "Condições reais do trial de 15 dias". Trocar só o número visível deixa o
   comentário contradizendo a página, e o próximo a abrir o arquivo "corrige" de
   volta. Reescreva a regra junto.
2. **O FAQPage do JSON-LD precisa continuar idêntico palavra por palavra ao FAQ
   visível.** Dado estruturado divergente derruba o rich result. Confira com script,
   comparando pergunta a pergunta, depois de trocar.

## 2. A página afirma "grátis" e o FAQ nega

**5 ocorrências** de "grátis": "Testar 15 dias grátis", "Quero testar 15 dias
grátis", "Começar meu teste grátis". Mas o FAQ responde que as condições do
período são combinadas na conversa com o comercial, e os comentários do arquivo
registram que a condição do trial não está fechada — foi por isso que o "Sem
cartão" saiu dos selos.

A página afirma e nega na mesma tela. **Decidir:** é grátis ou não?

## 3. Sem aviso de privacidade (LGPD)

O formulário coleta nome, e-mail, WhatsApp e dados do negócio. Zero ocorrências de
"LGPD" ou "privacidade" no arquivo. Vale para os três sites.

## 4. WhatsApp pessoal em 7 links

São 7 links para `wa.me/5527999941710`, anotado no repositório do Barber como o
número pessoal do Matheus, a trocar pelo comercial antes de escalar verba.
Contar também a ocorrência montada no JavaScript do formulário.

---

## Publicação

Este site publica por **AWS** (`./publicar.sh` → S3 + CloudFront). O push para o
GitHub **não** coloca nada no ar.

A ferramenta de limpeza passou de Python para **Node** — confirme `node --version`
na máquina que tem o `aws` antes de rodar. O `publicar.sh` roda os 34 testes de
`ferramentas/testar-limpeza.js` antes de enviar; se a ferramenta regredir, a
publicação para sozinha.
