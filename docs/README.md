# Docs: contexto do projeto

Contexto geral do **MarsCraft**, nossa resposta ao desafio *Build a Junior Astronaut Mission Trainer* do NASA Space Apps Challenge 2026.

Mobile é uma plataforma de primeira classe: considere toque, telas pequenas, orientação paisagem e áreas seguras em toda mudança de jogo ou interface. Consulte os [requisitos permanentes do projeto](../AGENTS.md) e o [estado da experiência mobile](game/estado-atual-e-gaps.md#mobile-como-requisito-permanente).

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
| [`superpowers/specs/2026-11-14-story-arc-design.md`](superpowers/specs/2026-11-14-story-arc-design.md) | História em 3 atos: objetivo central, objetivos de cada ato e atraso de comunicação |
| [`superpowers/plans/2026-11-14-story-arc.md`](superpowers/plans/2026-11-14-story-arc.md) | Plano de implementação e roteiro, plano a plano, das animações de pouso e de decolagem |

## Como atualizar

O conteúdo do desafio pode mudar ("more resources may be added"). Para reextrair:

1. Baixe o HTML de `https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/`. Nesta máquina o certificado TLS do site falha, então use `curl -k`.
2. Junte os pedaços `self.__next_f.push([1,"..."])` (payload RSC do Next.js) e procure o objeto `"__typename":"ChallengePage"`.
3. Os campos `detailsContent` e `resourcesTabContent` apontam para chunks de texto `NN:T<tamanho_hex>,<html>`. O tamanho é em **bytes** UTF-8.
4. Converta o HTML para markdown e substitua a seção "Texto original" dos arquivos em `challenge/`.

Ao atualizar `data/`, mantenha a data de coleta em cada amostra.

## Referências visuais

- Fundo espacial do menu inicial (`src/assets/images/mars-menu-space.webp`): ilustração original gerada com assistência de IA a partir da composição descrita para o projeto, exportada em 1920 × 1080. Não usa imagens ou marcas da NASA.

- Gelo fresco e ejecta da cratera de meteoro (`src/graphics/blockMaterials.ts`, `src/world/impactCrater.ts`): texturas e padrão de voxels procedurais escritos em código com assistência de IA. Não usam imagens nem marcas da NASA.

- [Monocraft](https://github.com/IdreesInc/Monocraft), fonte inspirada na tipografia da interface do Minecraft, usada na interface e nos textos desenhados da base. Licença SIL Open Font License 1.1; cópia incluída em `src/assets/fonts/OFL-1.1.txt`. É uma recriação de fã, não a fonte oficial Mojangles.

- [ISS SSP 57000, Revision R, Appendix O: Instructions for Labels and Decals](https://ntrs.nasa.gov/api/citations/20190001390/downloads/20190001390.pdf), seções O.3.4.5.2.2 e O.3.4.10.1: contraste, uso de cores e fonte das placas de identificação. As placas do jogo são adaptações que identificam os espaços pela função; não usam códigos de módulos fictícios nem alegam reproduzir placas reais específicas.

- [NASA: Quest Airlock](https://www.nasa.gov/international-space-station/quest-airlock/): a ISS usa o nome Quest para seu módulo de airlock; esse nome específico não é atribuído à base fictícia do jogo.
# Food system reference

NASA describes prepackaged, heat-stabilized meals and the use of fresh crops as a supplement in its [space food systems overview](https://www.nasa.gov/directorates/esdmd/hhp/space-food-systems/) and [plant research overview](https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/). The game's conversion of a harvested crop into a ration is a simplified model of a future Mars kitchen, not a claim about current ISS food production.
