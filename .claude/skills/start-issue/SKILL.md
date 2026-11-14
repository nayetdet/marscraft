---
name: start-issue
description: Começa o trabalho em uma issue do nasa-space-apps — lista as issues abertas (ou usa o número passado), propõe um planejamento de execução, espera o usuário aprovar/ajustar e então implementa. Use quando o usuário chamar /start-issue ou pedir para "pegar uma issue" / "começar a issue #N" neste projeto.
disable-model-invocation: true
---

# /start-issue

Argumento opcional (`$ARGUMENTS`): número da issue (`12` ou `#12`). Sem argumento, o usuário escolhe na lista.

## Regra de conta do GitHub (obrigatória)

O repo é **privado** e só a conta pessoal `DerickBessa` tem acesso. **Não** troque a conta ativa da máquina (`gh auth switch` proibido). Todo comando `gh` leva o token pessoal no mesmo comando:

```bash
export GH_TOKEN=$(gh auth token --user DerickBessa) && gh ... -R nayetdet/nasa-space-apps
```

`git fetch/pull/push` já usam a conta pessoal pelo credential helper local do repo.

## 1. Escolher a issue

**Com número no argumento** → vá direto para a etapa 2.

**Sem argumento** → liste as abertas:

```bash
export GH_TOKEN=$(gh auth token --user DerickBessa) && gh issue list -R nayetdet/nasa-space-apps --state open --limit 50 --json number,title,labels,assignees,updatedAt
```

- Mostre uma tabela curta: `#`, título, labels, responsável (marque as que já têm alguém atribuído).
- Pergunte qual pegar com `AskUserQuestion` (até 4 opções — as mais relevantes/recentes sem responsável; o usuário pode digitar outro número em "Other").
- Nenhuma issue aberta → diga isso e pare (sugira criar uma ou rodar o trabalho direto e usar `/send-pr`, que cria a issue).

## 2. Entender a issue

```bash
export GH_TOKEN=$(gh auth token --user DerickBessa) && gh issue view N -R nayetdet/nasa-space-apps --comments
```

- Leia título, corpo, comentários e critérios de pronto.
- Issue fechada ou já com PR aberto vinculado → avise o usuário antes de continuar.
- Atualize a base: `git fetch origin` e confira se a `main` local está atrás de `origin/main`.
- Explore o código que a issue toca. Mapa do projeto (Vite + Three.js, jogo voxel em Marte):
  - `src/core/GameEngine.js` — loop e orquestração
  - `src/world/` — `VoxelWorld`, `terrainGenerator`, `voxelRaycaster`, `nasaSpaceshipBuilder`
  - `src/player/` — `InputController`, `PlayerPhysics`, `PlayerHand`, `SurvivalSystem`
  - `src/sky/` — `MarsSkySystem`, `celestialBodies`, `atmosphereShader`
  - `src/graphics/` — materiais e texturas de blocos
  - `src/ui/` — `HudManager` + CSS
  - `src/config/` — `blockTypes`, `constants`

## 3. Propor o planejamento — e PARAR

Apresente ao usuário, em português e conciso:

```markdown
## Issue #N — <título>

**Entendimento:** 1–2 frases do que precisa ser feito e por quê.

**Plano:**
1. <passo concreto> — `arquivo.js` (o que muda)
2. ...

**Testes:** o que será coberto (lógica pura com Vitest; nada de renderização WebGL).
**Fora do escopo:** o que NÃO será feito, se houver ambiguidade.
**Dúvidas / riscos:** só se existirem de verdade.
**Branch:** `feat/N-<slug>` (ou `fix/N-<slug>` para bug)
```

Depois de apresentar o plano, **encerre o turno e espere a resposta do usuário**. Não crie branch, não edite arquivo, não atribua a issue antes disso.

## 4. Ajustar conforme o feedback

- Aprovou ("ok", "manda", "pode ir"...) → etapa 5.
- Pediu mudanças → incorpore. Se a mudança for pequena e clara, siga direto para a execução dizendo em uma linha o que ajustou. Se mudar o plano de forma relevante, reapresente o plano revisado e espere de novo.
- Rejeitou / quer outra issue → volte para a etapa 1.

## 5. Executar

1. Branch a partir da `main` atualizada (o número da issue no nome é usado pelo `/send-pr` para vincular o PR):
   ```bash
   git checkout main && git pull --ff-only && git checkout -b feat/N-<slug>
   ```
   Se houver alterações não commitadas na árvore, pergunte o que fazer com elas antes de trocar de branch.
2. Atribua a issue à conta pessoal para sinalizar que está em andamento:
   ```bash
   export GH_TOKEN=$(gh auth token --user DerickBessa) && gh issue edit N -R nayetdet/nasa-space-apps --add-assignee @me
   ```
3. Implemente seguindo o plano aprovado, sem expandir escopo. Commits pequenos em Conventional Commits (`feat: ...`, `fix: ...`).
4. Verifique: `npm run build` sem erros; `npm test` se o projeto já tiver Vitest configurado. Se a mudança for visual/jogabilidade, suba `npm run dev` (http://localhost:5173/nasa-space-apps/) e peça para o usuário conferir no navegador o que não dá para validar por teste.
5. Algo do plano se mostrou inviável no meio do caminho → pare e explique antes de improvisar outra abordagem.

## 6. Encerrar

Resuma em poucas linhas: o que foi feito, arquivos tocados, como foi verificado, e o que ficou pendente. Sugira rodar `/send-pr` para rebase, testes e abertura do PR com `Closes #N`.
