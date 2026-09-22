import re, sys, pathlib

# Remove comentários do HTML publicado, mantendo-os no repositório.
#
# Por que existe: as anotações de trabalho desta página (pendências, fases de lançamento, nomes de
# parceiros, tamanho da base de clientes) vivem em comentários de HTML e de CSS. Elas são úteis a
# quem dá manutenção e não têm por que viajar até o navegador de um visitante — ainda mais num site
# que existe para vender o produto.
#
# Só o arquivo publicado é limpo. O repositório continua com tudo.
def limpar(html):
    # CSS primeiro, e só dentro de <style>: fora dele, "/*" pode ser conteúdo legítimo.
    def sem_css(m):
        return m.group(1) + re.sub(r'/\*.*?\*/', '', m.group(2), flags=re.S) + m.group(3)
    html = re.sub(r'(<style[^>]*>)(.*?)(</style>)', sem_css, html, flags=re.S)
    # Comentários de HTML. Preserva os condicionais do IE (<!--[if ...]>), que são instrução.
    html = re.sub(r'<!--(?!\[if)(?:(?!-->).)*?-->', '', html, flags=re.S)
    # Linhas que ficaram só com espaço em branco.
    html = re.sub(r'\n[ \t]*\n(?:[ \t]*\n)+', '\n\n', html)
    return html

origem = pathlib.Path(sys.argv[1])
destino = pathlib.Path(sys.argv[2])
antes = origem.read_text()
depois = limpar(antes)
destino.write_text(depois)
print(f'  {origem.name}: {len(antes)} -> {len(depois)} caracteres ({len(antes)-len(depois)} removidos)')
