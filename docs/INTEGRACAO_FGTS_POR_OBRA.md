# Contrato de integração — FGTS_por_obra_poligonal

Este projeto é o produtor da planilha consumida pelo repositório `FGTS_por_obra_poligonal`.

## Aba principal

Nome: `FGTS por Obra`

Linha 1:
- A1: `Competência`
- B1: valor `MM/AAAA`
- D1: `Vencimento`
- E1: valor `DD/MM/AAAA`

Linha 3 — cabeçalhos obrigatórios e estáveis:

1. `Codigo`
2. `Tipo Inscrição`
3. `Servico`
4. `TAG`
5. `Inscrição`
6. `FGTS`
7. `FGTS Aprendiz`

Dados iniciam na linha 4.

## Tipos

- `Codigo`: número inteiro.
- `Tipo Inscrição`: texto `CNPJ` ou `CNO`.
- `Servico`: texto.
- `TAG`: texto, máximo 40 caracteres, inscrição integral no final.
- `Inscrição`: TEXTO; 14 dígitos para CNPJ ou 12 para CNO. Nunca converter para número.
- `FGTS`: número decimal.
- `FGTS Aprendiz`: número decimal.

## TAG

Regra-base compatível com a planilha de referência:

`LEFT(Codigo & "-" & Servico, 27) & " " & Inscricao`

A função ainda garante que o resultado final não ultrapasse 40 caracteres sem cortar a inscrição.

## Origem do FGTS

O valor deve vir do bloco-resumo do serviço, após `Resumo por Rubricas do Serviço`/`Líquido Serviço`, e não do FGTS individual de empregados.

## Compatibilidade futura

Qualquer mudança de nome, ordem ou tipo das colunas obrigatórias deve ser tratada como alteração de contrato e validada também no projeto `FGTS_por_obra_poligonal` antes de ser incorporada.
