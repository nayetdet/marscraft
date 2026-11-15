# Tutorial guiado e esperas curtas

Data: 15/11/2026. Origem: teste com jogadores no dia da submissão.

## Problema

- O balão `CADET TRAINING` mostrava 4 tarefas de uma vez, sem dizer onde ir nem o que apertar.
- "Call Earth" concluía só de chegar perto do console do rover, sem a criança enviar nada.
- As esperas paravam o jogo: resposta da Terra ~66 s, aviso de tempestade solar de 80 a 360 s,
  tempestade 50 s, intervalo entre tempestades 100 s, fábrica 30 s por bloco de gelo.

## Decisões

1. **Um passo por vez.** O ato 1 vira uma lista de 15 passos em dados
   (`src/story/tutorialSteps.ts`). Cada passo tem um balão próprio (`STEP n/15: ...`), uma linha
   fixa no painel do objetivo (onde ir e o que apertar) e a seta no lugar. O próximo só aparece
   quando o atual é concluído.
2. **Ordem, do básico ao avançado:** entrar na base, beber, comer, chamar a Terra, conferir a
   bateria, plantar, colher, treinar, lavar, encher a parede de água, dirigir o rover, perfurar
   gelo com o rover, pegar 1 gelo, carregar o foguete, escanear 1 coisa.
3. **Rádio separado do rover.** "Call Earth" passa a ser uma ação no terminal de ciência e rádio
   (`Call Earth (ask Mission Control)`). O console do rover fica só com o rover e tem o seu passo.
4. **Tentativa conta.** Beber, comer e lavar contam ao apertar o botão certo, mesmo sem sede ou
   fome, para ninguém ficar preso num passo.
5. **Certificados continuam** como prêmio de 4 passos (bateria, colheita, treino, parede de água).
6. **Tempestades só depois do tutorial.** O ato 2 começa quando o último passo termina.
7. **Pular:** "Skip the tutorial" (Demo Tools) vai direto ao ato 2; antes de a história começar,
   deixa só 3 passos (entrar, chamar a Terra, pegar gelo).

## Esperas (jogo inteiro, em `src/config/constants.ts`)

| Espera | Antes | Agora |
|---|---|---|
| Resposta da Terra (11 min-luz) | ~66 s | ~8 s (`GAME_SECONDS_PER_LIGHT_MINUTE: 0.35`) |
| Aviso de tempestade solar | 80 a 360 s | 7 a 17 s (`WARNING_REAL_HOURS_PER_GAME_HOUR: 500`, mínimo 0,15 h) |
| Tempestade solar | 50 s | 10 s (`DURATION_HOURS: 0.2`) |
| Calmaria entre tempestades | 100 s | 20 s |
| Fábrica, por bloco de gelo | 30 s | 7,5 s (`ISRU_HOURS_PER_ICE_BLOCK: 0.15`) |

O que anda junto, para nenhuma escolha ficar de graça:

- A dose total de cada tempestade não muda; `HARM_THRESHOLD` e `WARN` sobem x5.
- Blindagem: 110 %/h, ou 22 % da bateria por tempestade (eram 25 %).
- Fábrica: 50 %/h, ou 7,5 % da bateria por bloco de gelo (eram 15 %). O tanque cheio custa 75 %.
- O aviso continua proporcional à viagem real da CME prevista pelo DONKI: CME mais rápida, menos aviso.
- O card do rádio continua mostrando o atraso real em minutos; só a espera no jogo encolhe.

## Limites conhecidos

- Os textos dos passos falam em teclas (F, SPACE, WASD, right-click). No celular os botões
  equivalentes já existem, mas o texto não muda.
- O passo "scan 1 thing" não tem seta: a luneta funciona em qualquer lugar.
