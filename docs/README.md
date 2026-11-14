# Docs: contexto do projeto

Contexto geral do **MineMars**, nossa resposta ao desafio *Build a Junior Astronaut Mission Trainer* do NASA Space Apps Challenge 2026.

| Arquivo | Para quê |
|---|---|
| [`challenge/desafio.md`](challenge/desafio.md) | Texto oficial do desafio (verbatim) e resumo em PT |
| [`challenge/recursos.md`](challenge/recursos.md) | Aba "Resources" oficial (verbatim) e status de cada recurso |
| [`challenge/julgamento-e-submissao.md`](challenge/julgamento-e-submissao.md) | **Prazo**, requisitos de submissão, regras de uso de IA e critérios de julgamento |
| [`data/apis-nasa.md`](data/apis-nasa.md) | Guia técnico de cada API (endpoint, sintaxe, CORS, o que está quebrado) |
| [`data/numeros-reais.md`](data/numeros-reais.md) | Valores reais para calibrar mecânicas (radiação, clima, constantes) |
| [`data/airlock-e-poeira.md`](data/airlock-e-poeira.md) | Como funciona um airlock real, o problema da poeira (Apollo, Marte), limpeza eletrostática e suitport, e como o ciclo do airlock do jogo usa isso |
| [`data/protecao-radiacao.md`](data/protecao-radiacao.md) | Como a NASA protege astronautas da radiação (passiva × escudo magnético ativo) e como o escudo `R` do jogo usa isso |
| [`data/samples/`](data/samples/) | Amostras JSON reais e reduzidas, coletadas em 2026-11-14 |
| [`game/estado-atual-e-gaps.md`](game/estado-atual-e-gaps.md) | O que o jogo já faz, o que falta para o desafio e a proposta de trade-off |

## Como atualizar

O conteúdo do desafio pode mudar ("more resources may be added"). Para reextrair:

1. Baixe o HTML de `https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/`. Nesta máquina o certificado TLS do site falha, então use `curl -k`.
2. Junte os pedaços `self.__next_f.push([1,"..."])` (payload RSC do Next.js) e procure o objeto `"__typename":"ChallengePage"`.
3. Os campos `detailsContent` e `resourcesTabContent` apontam para chunks de texto `NN:T<tamanho_hex>,<html>`. O tamanho é em **bytes** UTF-8.
4. Converta o HTML para markdown e substitua a seção "Texto original" dos arquivos em `challenge/`.

Ao atualizar `data/`, mantenha a data de coleta em cada amostra.
