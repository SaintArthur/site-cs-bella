#!/usr/bin/env bash
# Publica o site: limpa os comentários e envia para o S3, invalidando o cache do CloudFront.
#
# A limpeza não é economia de bytes — é o que impede que anotação de trabalho chegue ao navegador
# de quem visita. As notas deste site falavam de pendências, fases de lançamento, nome de parceiro
# e tamanho da base de clientes. Nada disso aparecia na tela, mas qualquer pessoa lia em "exibir
# código-fonte", e o repositório é público.
#
# Os comentários continuam no repositório: quem dá manutenção precisa deles. Só o arquivo
# publicado sai limpo, e sai limpo SEMPRE — inclusive das anotações que ainda nem foram escritas.
set -euo pipefail
BUCKET=csbella-site-359334423263
DIST=DISTRIBUICAO_A_DEFINIR
REGIAO=sa-east-1

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
python3 ferramentas/limpar-comentarios.py index.html "$TMP/index.html"

aws s3 cp "$TMP/index.html" "s3://$BUCKET/index.html" --region "$REGIAO" \
  --content-type "text/html; charset=utf-8"
aws s3 sync assets "s3://$BUCKET/assets" --region "$REGIAO" --delete
aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/*" \
  --query 'Invalidation.{Id:Id,Status:Status}' --output text
echo "publicado."
