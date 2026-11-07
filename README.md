# Protótipos — Engenharia de Software 2026.2

Dez protótipos estáticos, disponíveis nas pastas `grupo01/` a `grupo10/`.

Site: https://rodrigorgs.github.io/prototipos-es20262/

## Executar localmente

Na raiz deste repositório:

```sh
python3 -m http.server 8000
```

Abra http://localhost:8000/.

## Publicação

O workflow `.github/workflows/pages.yml` publica automaticamente a cada push
na branch `main` e também pode ser executado manualmente pelo GitHub Actions.
Nas configurações do repositório, Pages deve usar a fonte **GitHub Actions**.
Somente a página inicial e os arquivos HTML, CSS, JS e PNG dos grupos são
incluídos no artefato; testes e arquivos do Git não são publicados.

Alguns protótipos referenciam relatórios em `../../relatorio/`, fora desta
pasta. Esses relatórios não integram este repositório nem a publicação.
