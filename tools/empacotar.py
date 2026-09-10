"""Empacota o módulo em spacedragon.zip.

O Foundry exige o `module.json` na RAIZ do zip. Neste repositório ele mora em
`spacedragon-module/`, para o repo poder ter README, licença e ferramentas sem
sujar o que o Foundry carrega. O zip desfaz essa pasta.

Verifica também que todo caminho declarado no manifesto existe dentro do zip —
um pack apontando para diretório ausente faz o compêndio sumir sem erro visível.

    python tools/empacotar.py
"""

import io
import json
import os
import zipfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEM = os.path.join(RAIZ, "spacedragon-module")
SAIDA = os.path.join(RAIZ, "spacedragon.zip")

EXCLUIR = {".DS_Store", "Thumbs.db", "desktop.ini"}


def main():
    manifesto = json.load(io.open(os.path.join(ORIGEM, "module.json"), encoding="utf-8"))

    dentro = {}
    with zipfile.ZipFile(SAIDA, "w", zipfile.ZIP_DEFLATED) as z:
        for pasta, _, nomes in os.walk(ORIGEM):
            for nome in sorted(nomes):
                if nome in EXCLUIR:
                    continue
                caminho = os.path.join(pasta, nome)
                interno = os.path.relpath(caminho, ORIGEM).replace("\\", "/")
                z.write(caminho, interno)
                dentro[interno] = True

    problemas = []
    if "module.json" not in dentro:
        problemas.append("o zip não tem module.json na raiz")

    for l in manifesto.get("languages", []):
        if l["path"] not in dentro:
            problemas.append("idioma declarado e ausente: " + l["path"])

    # Cada pack é um DIRETÓRIO LevelDB. Basta uma entrada sob ele existir.
    for p in manifesto.get("packs", []):
        if not any(k.startswith(p["path"] + "/") for k in dentro):
            problemas.append("pack vazio ou ausente: " + p["path"])

    print("spacedragon.zip: %d arquivos, %.1f KB" % (len(dentro), os.path.getsize(SAIDA) / 1024))
    print("  packs: %d" % len(manifesto.get("packs", [])))

    if problemas:
        print("\n  ERRO:")
        for p in problemas:
            print("    " + p)
        raise SystemExit(1)

    print("  module.json na raiz e os %d packs presentes" % len(manifesto.get("packs", [])))


if __name__ == "__main__":
    main()
