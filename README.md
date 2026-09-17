# Leitor PDF Extrato Mensal - Poligonal

Portal local em HTML/JavaScript para leitura de Extratos de Folha (Mensal, Complementar e Consolidado), extração dos totais de FGTS por serviço/obra e geração de planilha XLSX compatível com o fluxo do projeto `FGTS_por_obra_poligonal`.

## Objetivo

Transformar o Extrato Mensal/Complementar/Consolidado emitido pelo sistema de folha em uma base estruturada por obra, contendo:

- Código do serviço
- Tipo de inscrição (CNPJ/CNO)
- Serviço
- TAG de integração com no máximo 40 caracteres
- Inscrição preservada como texto (CNPJ 14 dígitos / CNO 12 dígitos)
- FGTS
- FGTS Aprendiz
- Competência
- Vencimento

A planilha gerada é a entrada do projeto irmão `FGTS_por_obra_poligonal`, responsável pela automação da geração das guias mensais no FGTS Digital.

## Regra da TAG

A TAG segue o padrão da planilha de referência `FGTS_Extrator_Poligonal`:

`LEFT(Codigo & "-" & Servico, 27) & " " & Inscricao`

A implementação também valida o limite máximo de 40 caracteres e preserva a inscrição integral no final.

## Regra de vencimento

O vencimento-base é o dia 20 do mês subsequente à competência. Quando o dia 20 não for dia útil, o vencimento é antecipado para o dia útil anterior. A implementação contempla fins de semana e calendário de feriados configurável no projeto.

Exemplo: competência `08/2026` -> 20/09/2026 (domingo) -> vencimento `18/09/2026`.

## Arquitetura

O processamento ocorre localmente no navegador. O PDF não precisa ser enviado a servidor externo.

- `index.html`: interface principal
- `src/app.js`: coordenação da interface e processamento
- `src/pdf-extractor.js`: leitura e extração do PDF
- `src/rules.js`: TAG, inscrição, competência e vencimento
- `src/export-xlsx.js`: geração do XLSX
- `src/logger.js`: log e relatório de advertências
- `tests/`: testes das regras determinísticas
- `docs/`: documentação do layout e integração

## Desenvolvimento local

O projeto pode ser servido por um servidor HTTP simples. Consulte `INSTALACAO_DEPENDENCIAS.txt`.

## Integração

Contrato de saída e regras de compatibilidade com `FGTS_por_obra_poligonal` estão documentados em `docs/INTEGRACAO_FGTS_POR_OBRA.md`.
