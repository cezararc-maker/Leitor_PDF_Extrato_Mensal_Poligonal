# Leitor de Extrato FGTS por Obra — Poligonal

Ferramenta validada pelo operador para ler extratos Mensal, Complementar e Consolidado e gerar a planilha usada pelo FGTS por Obra. O arquivo de execução é **`Leitor_FGTS.html`**; `ABRIR_LEITOR_FGTS.bat` abre esse arquivo no navegador padrão.

## Uso

1. Execute `ABRIR_LEITOR_FGTS.bat` ou abra `Leitor_FGTS.html` no Chrome/Edge.
2. Selecione o PDF do extrato, clique em **Processar PDF**, confira os serviços e baixe o XLSX.
3. Importe o XLSX no programa FGTS por Obra / Poligonal.

Requer internet para carregar PDF.js e SheetJS das respectivas CDNs. O PDF é processado no navegador; não é enviado ao repositório. Preserve os arquivos de entrada/saída fora do Git. O contrato da planilha está em `docs/INTEGRACAO_FGTS_POR_OBRA.md`.

Testado e validado pelo operador em 15/10/2026. Código-fonte da versão anterior continua recuperável no histórico Git.
