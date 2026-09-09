"""Empacota o sistema em spacedragon.zip.

O Foundry exige que o `system.json` esteja na RAIZ do zip. Neste repositório
ele mora em `system/`, para o repo poder ter README, licença e ferramentas sem
sujar o que o Foundry carrega. O zip desfaz essa pasta.

Verifica também que todo caminho declarado no manifesto existe dentro do zip —
um `esmodules` apontando para um arquivo ausente dá tela branca no Foundry, sem
mensagem de erro que ajude.

    python tools/empacotar.py
"""

import io
import json
import os
import zipfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEM = os.path.join(RAIZ, "system")
SAIDA = os.path.join(RAIZ, "spacedragon.zip")

EXCLUIR = {".DS_Store", "Thumbs.db", "desktop.ini"}


def arquivos():
    for pasta, _, nomes in os.walk(ORIGEM):
        for nome in sorted(nomes):
            if nome in EXCLUIR:
                continue
            caminho = os.path.join(pasta, nome)
            # o caminho DENTRO do zip perde a pasta "system/"
            yield caminho, os.path.relpath(caminho, ORIGEM).replace("\\", "/")


def main():
    manifesto = json.load(io.open(os.path.join(ORIGEM, "system.json"), encoding="utf-8"))

    dentro = {}
    with zipfile.ZipFile(SAIDA, "w", zipfile.ZIP_DEFLATED) as z:
        for caminho, interno in arquivos():
            z.write(caminho, interno)
            dentro[interno] = os.path.getsize(caminho)

    # ── verificação: o manifesto não pode prometer o que o zip não tem ──────
    declarados = list(manifesto.get("esmodules", [])) + list(manifesto.get("styles", []))
    declarados += [l["path"] for l in manifesto.get("languages", [])]
    faltando = [d for d in declarados if d not in dentro]

    print("spacedragon.zip: %d arquivos, %.1f KB" % (len(dentro), os.path.getsize(SAIDA) / 1024))
    print("  system.json na raiz: %s" % ("sim" if "system.json" in dentro else "NÃO — o Foundry vai recusar"))

    if faltando:
        print("\n  ERRO — o manifesto declara caminhos que não estão no zip:")
        for f in faltando:
            print("    " + f)
        raise SystemExit(1)

    print("  os %d caminhos declarados no manifesto existem" % len(declarados))

    # os templates não são declarados no manifesto, mas o código os carrega
    hbs = [k for k in dentro if k.endswith(".hbs")]
    print("  templates: %s" % (", ".join(hbs) or "nenhum"))


if __name__ == "__main__":
    main()
