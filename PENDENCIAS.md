# Pendências — landing page do CS Bella

Levantado em 23/09/2026 e atualizado no mesmo dia, depois das correções.

---

## Resolvido

- **Trial de 7 dias**: as 23 ocorrências de "15 dias" viraram 7 — meta
  description, og:description, CTAs, selos, dobra "como funciona", FAQ, FAQPage
  do JSON-LD, título da dobra do formulário, mensagem que o formulário monta e
  os comentários de briefing. O FAQPage continua idêntico ao FAQ visível (8
  perguntas, conferido por script).
- **WhatsApp**: os 6 links `wa.me` e o montado pelo JavaScript do formulário
  apontam para `5527999073651`, o comercial da Conecta — o mesmo do site
  institucional, por decisão do dono. O número pessoal do Matheus
  (`5527999941710`) saiu.
- **CNPJ** saiu do rodapé, por decisão do dono. A razão social ficou.
- **Aviso de privacidade (LGPD)** abaixo do botão do formulário, com o mesmo
  texto do CS Barber: o envio abre o WhatsApp (serviço da Meta) com a mensagem
  pronta, ela só chega à Conecta Soluções quando a pessoa toca em Enviar, o site
  não guarda os dados. Se entrar webhook, o aviso tem que mudar junto.
- **Formulário**, testado ao vivo com saídas interceptadas: mesmas correções do
  CS Barber (WhatsApp com +55/0/DDI estrangeiro, DDD 55 protegido, "Falta só
  enviar!" no lugar do "Recebido!" prematuro com link para reabrir, selects sem
  escolha fora da mensagem, "Outro" sem duplicar, campos com 16px, botão
  desabilitado sem JavaScript, foco e erros), mais: fallback quando o pop-up é
  bloqueado (o `window.open` com 'noopener' sempre devolvia null) e erros
  ligados aos campos por `aria-describedby`.
- **Responsividade**: a 320px a página ficava 8px mais larga que a tela por
  causa dos cartões de perfil (`.pain-grid .pc`); corrigido.

## Decidido pelo dono

- **"Grátis"**: o teste de 7 dias é grátis. Os botões continuam com "grátis" e,
  por decisão do dono, o FAQ ("As condições do período são combinadas na
  conversa com o comercial") fica como está.

## Publicação

Este site publica por **AWS** (`./publicar.sh` → S3 + CloudFront). O push para o
GitHub **não** coloca nada no ar: tudo acima só chega ao público depois de rodar
o `./publicar.sh` numa máquina com a credencial `aws` e Node. O script roda os 34
testes de `ferramentas/testar-limpeza.js` antes de enviar.
