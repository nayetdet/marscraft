# Ato 2 da história: tempestade de poeira, painéis, vazamento, luneta e diário

> Spec de 15/11/2026. Issue [#408](https://github.com/nayetdet/marscraft/issues/408), com a ideia da [#418](https://github.com/nayetdet/marscraft/issues/418) (o scanner acha o vazamento). Base: `origin/main` em `b38873f`.
> Depende do ato 1 (`2026-11-15-act1-story-design.md`).

## Objetivo

O ato 2 ensina: poeira corta a energia, limpar tem custo, a base pode perder ar, o scanner serve para achar problemas e para fazer ciência, e o diário guarda o que foi descoberto.

## Decisões tomadas com o Derick

- Entra só o fluxo, com o scanner achando o vazamento (#418). Ficam para depois, nas issues próprias: quem sai do posto (#415), traje ou Terra (#417) e fichas só da tempestade (#419).
- O NPC que entrega a luneta e o vidro é fixo (o engenheiro de voo). A criança não escolhe quem chamar.
- A criança **não começa com a luneta**.
- O redemoinho limpa **parte** dos painéis. Os outros a criança limpa à mão, **um por um**.

## Como a criança joga

| # | Passo | O que ela faz | O que aprende |
|---|---|---|---|
| 1 | (evento) DUST STORM | A tempestade chega e suja os 5 painéis; o redemoinho passa e limpa 2 | Poeira corta a energia |
| 2 | CLEAN THE PANELS | Limpa os 3 que sobraram, um por um, agora ou depois da tempestade | Agora: segura a energia, o traje desgasta e o painel suja de novo. Esperar: traje inteiro, bateria cai |
| 3 | (evento) AIR LEAK | O engenheiro avisa pelo rádio que a base perde ar | A tempestade rachou um vidro |
| 4 | GET THE SCOPE | Fala com o engenheiro [F] e recebe a luneta | Ferramenta nova, na hora de usar |
| 5 | FIND THE LEAK | Escaneia as janelas até achar a rachada | O scanner acha problemas |
| 6 | FIX THE WINDOW | Recebe o vidro do engenheiro [F] e troca a janela [F] | O ar para de vazar |
| 7 | SCAN 3 THINGS | Escaneia algo de Marte, a Terra e algo da base | Scans viram ciência |
| 8 | OPEN THE JOURNAL | Abre o diário e vê a aula com círculos e setas | Onde ficam as descobertas |

## Peças

### 1. Poeira por painel

Hoje a poeira é um número só (`DustWeather.panelDust`) para os 5 painéis (`SOLAR_FIELD.count`).

- `DustWeather` passa a guardar a poeira de cada painel (`panels: number[]`). `panelDust` vira a média, então quem lê esse número (telas da base, alertas, geração solar) não muda.
- A tempestade e a poeira do dia a dia sujam todos por igual.
- `cleanPanel(index)` limpa só aquele painel, `CLEAN_STEP` por escovada, com o custo de ar de hoje (`CLEAN_O2_COST`). O painel é o mais perto da mira (`_nearestSolarPanelPos` já acha).
- O vento forte do sol (`windCleaning`) continua limpando todos por igual.
- Redemoinho: limpa por inteiro `DUST_DEVIL_PANELS_CLEANED` painéis (novo, valor 2), os mais perto do caminho dele. Sai `DUST_DEVIL_PANEL_CLEAN`.
- Visual: cada painel mostra a própria poeira. Os 5 painéis hoje dividem um material; passam a ter um material cada. Conferir os draw calls no F3.

### 2. Tempestade roteirizada

- No começo do ato 2 a primeira tempestade de poeira é marcada com aviso curto (`STORY_DUST_STORM_LEAD_HOURS`, novo, valor 0,5 h de jogo = 25 s reais). As seguintes continuam sorteadas.
- No meio dela o `GameEngine` dispara o redemoinho passando pelo campo solar.
- A cena de trade-off DUST STORM, que já existe, abre aqui.

### 3. Limpar agora ou esperar

- Balão com as duas opções lado a lado (formato `choices` de `storyChapters.ts`), só informativo: a criança escolhe agindo.
- Limpar durante a tempestade: os painéis continuam sujando (`PANEL_DUST_STORM_PER_HOUR`, já existe) e o traje desgasta mais rápido lá fora (`STORM_SUIT_WEAR_MULTIPLIER`, novo, valor 2).
- Esperar: nada desgasta, mas a bateria cai durante a tempestade inteira (6 a 9 h de jogo).
- O passo termina quando os 5 painéis estão com menos de 10 % de poeira.
- Dado real: desgaste de traje por poeira precisa de fonte da NASA em `docs/data/numeros-reais.md`; sem fonte, o texto do jogo marca como regra de jogo.

### 4. Vazamento escondido

- Quando o passo 2 termina, uma janela da base racha. O lugar sai de uma lista fixa de janelas (`STORY_LEAK_WINDOWS`), por semente.
- A janela rachada continua sendo vidro, com o desenho de rachadura que o jogo já usa ao quebrar blocos. Não vira buraco.
- O ar da base cai devagar (`STORY_LEAK_RATE`, novo, valor 0,15 % por segundo, cerca de 11 min até esvaziar). O vazamento de bloco quebrado pelo jogador continua em 5 % por segundo, com o alerta e o marcador de hoje.
- O alerta do vazamento roteirizado diz que há um vazamento e **não mostra o marcador** até a rachadura ser achada.

### 5. Luneta entregue pelo NPC

- `HOTBAR_BLOCKS`: a luneta passa a `initialCount: 0`. Partida salva mantém a luneta que já tem. O atalho da luneta não funciona sem o item.
- Passo `get-scope`: a seta aponta para o engenheiro. Falar com ele [F] (o jogo já tem o raio de conversa, `TALK_RADIUS`) coloca a luneta na hotbar.

### 6. Achar e consertar

- Mirar a luneta num vidro da base e escanear responde `WINDOW OK` ou `CRACKED WINDOW`. Achar a rachada acende o marcador e conclui `find-leak`.
- O engenheiro avisa pelo rádio que está trazendo vidro; depois de `STORY_REPAIR_FETCH_SECONDS` (novo, valor 10 s) a seta aponta para ele. Falar com ele [F] entrega 1 vidro.
- [F] na janela rachada com o vidro na mochila troca a janela. O vazamento para e `fix-window` termina.
- O caminho "fechar sala por sala" da #418 fica fora: não existe mecânica de isolar salas.
- Dado real: o detector de vazamento por ultrassom da Estação Espacial precisa de fonte registrada em `numeros-reais.md` antes de entrar no card.

### 7. Três scans

- Passo `scan-three`: um alvo de Marte (categoria `terrain` ou `landscape`), a Terra (`earth`) e um alvo da base (categoria `base`).
- Se a Terra não estiver no céu quando o passo começa, qualquer alvo do céu vale, e o balão diz isso.
- O painel do objetivo mostra os 3 alvos e marca cada um.

### 8. Aula do diário

- Passo `journal-lesson`: a criança abre o diário e vê 3 vinhetas, uma por vez, cada uma com um círculo e uma seta sobre uma parte da tela: o progresso, as abas e uma ficha descoberta. Avança com OK, Enter ou toque.
- Aparece uma vez por partida. O passo termina na última vinheta.

### 9. Diretor da história

Os atos passam a ser listas de passos, uma por ato, no formato de `tutorialSteps.ts`. Quando a lista de um ato acaba, o `StoryDirector` começa a do próximo. Os eventos roteirizados (tempestade, redemoinho, rachadura) são disparados pelo `GameEngine` ao receber `step-done` ou o começo do ato, como o meteoro do ato 1.

## Testes e validação

- Vitest: `dustWeather.test.ts` (poeira por painel, média, redemoinho limpa 2), `tutorialSteps.test.ts`, `StoryDirector.test.ts` (troca de ato), `scanCatalog.test.ts`, `missionCards.test.ts` (alerta sem marcador).
- `npm run typecheck` e `npm run build`.
- Visual, com Shaders ligado e desligado, em desktop e touch 844×390: tempestade, limpeza painel a painel, rachadura, entrega da luneta e do vidro, aula do diário.

## Fora deste spec

- #415 (quem sai do posto), #417 (traje ou Terra) e #419 (fichas só da tempestade).
- Fechar sala por sala.
