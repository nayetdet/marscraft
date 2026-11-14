---
name: setup-issue
description: Coloca a sessão em modo "só issues" no nasa-space-apps — a partir daí, cada mensagem do usuário (bug, ideia, ajuste) vira uma issue no GitHub, depois de checar duplicatas e confirmar o problema no código da main. Nada é implementado. Use quando o usuário chamar /setup-issue.
disable-model-invocation: true
---

# /setup-issue

A partir de agora, esta sessão serve **só para criar issues** no `nayetdet/nasa-space-apps`.

- Tudo o que o usuário mandar (bug, ideia, "fica estranho quando...", "precisamos de...") é pedido de **issue**, não de correção. **Não edite código, não crie branch, não abra PR**, mesmo que a correção pareça trivial.
- Exceção: pedidos que claramente não são issue (ex.: "comenta na #10", "fecha a #5", "edita a issue X", uma pergunta direta). Faça o que foi pedido.
- Se o usuário quiser sair do modo ("agora resolve", "pode implementar"), confirme e siga normalmente (`/start-issue` é o fluxo de implementação).

Ao ativar, responda só com uma linha: modo issue ligado, pode mandar.

Argumento opcional (`$ARGUMENTS`): se vier texto, trate-o como o primeiro pedido de issue.

## Regra de conta do GitHub (obrigatória)

O repo é **privado** e só a conta pessoal `DerickBessa` tem acesso. **Não** troque a conta ativa (`gh auth switch` proibido). Todo comando `gh` leva o token no mesmo comando:

```bash
export GH_TOKEN=$(gh auth token --user DerickBessa) && gh ... -R nayetdet/nasa-space-apps
```

## Para cada pedido

### 1. Procurar duplicata

```bash
export GH_TOKEN=$(gh auth token --user DerickBessa) && gh issue list -R nayetdet/nasa-space-apps --state all --limit 100 --json number,title,state,labels
```

- Leia os títulos (abertas **e** fechadas). Se algum for parecido, abra com `gh issue view N` para confirmar.
- **Já existe aberta sobre o mesmo assunto** → não crie. Mostre o link e ofereça comentar nela o detalhe novo.
- **Existe fechada** → confira se foi resolvida (PR mergeado/código atual). Se o problema voltou, crie uma nova citando a antiga.
- Issue relacionada, mas diferente → crie e cite a outra na seção "Relacionado".

### 2. Verificar se o problema existe

Sempre contra o código **atual da main**, não o da árvore local:

```bash
git fetch origin -q && git log --oneline -1 origin/main
git grep -n "<termo>" origin/main -- src
git show origin/main:src/caminho/arquivo.js
```

Mapa do projeto (Vite + Three.js, jogo voxel em Marte):
- `src/core/GameEngine.js`: loop e orquestração
- `src/world/`: `VoxelWorld`, `terrainGenerator`, `voxelRaycaster`, builders da base NASA
- `src/player/`: `InputController`, `PlayerPhysics`, `PlayerHand`, `SurvivalSystem`
- `src/sky/`, `src/graphics/`, `src/ui/` (`HudManager`, `DebugOverlay`), `src/config/` (`blockTypes`, `constants`)
- `docs/game/estado-atual-e-gaps.md`: estado atual e lacunas conhecidas

Resultado possível:
- **Bug com causa achada** → descreva a cadeia de causa com `arquivo:linha`.
- **Bug sem causa clara** → liste o que o código confirma e as suspeitas separadas, marcadas como não reproduzidas.
- **Feature** → confirme que ela ainda não existe (e o que existe hoje, que ela muda).
- **O código desmente o pedido** (já existe, já foi corrigido, funciona diferente) → **não crie**; explique ao usuário e pergunte se ainda quer a issue.

Não rode o jogo para reproduzir. A verificação é por leitura de código. Diga claramente o que não foi reproduzido.

### 3. Criar a issue

Título em Conventional Commits, em português: `bug: ...`, `feat: ...`, `fix: ...`, `perf: ...`, `docs: ...`. Label: `bug` para bug, `enhancement` para feature/melhoria.

Escreva o corpo num arquivo no scratchpad e use `--body-file` (evita problemas de aspas/acentos):

```bash
export GH_TOKEN=$(gh auth token --user DerickBessa) && gh issue create -R nayetdet/nasa-space-apps --title "<título>" --label <label> --body-file "<scratchpad>/issue.md"
```

Estrutura do corpo (seções sem conteúdo real ficam de fora):

```markdown
## O problema / Contexto
Como é hoje e por que incomoda, em 2–4 frases.

## Como reproduzir        (bugs)
1. ...

## O que precisamos       (features)
Itens numerados, com uma sugestão de valores (tecla, tempos), deixando claro que são sugestões.

## Causa (confirmada no código, origin/main @ <sha>)   (ou "Suspeitas (a investigar)")
- `arquivo.js`: o que acontece e por quê.

## Critérios de pronto
- [ ] Comportamento observável e verificável.

## Onde mexer (sugestão)
- `src/...`: o que muda.

## Relacionado
- #N: como se relaciona.
```

Seja concreto e curto. Não invente comportamento que não está no código nem no relato do usuário.

### 4. Responder ao usuário

Em poucas linhas, em português:
- Link e título da issue criada (ou da duplicata encontrada).
- **Já existia?** sim/não.
- **O problema existe?** O que foi confirmado no código e o que ficou como suspeita.
- Decisões que você tomou e o usuário pode querer ajustar (valores sugeridos, escopo opcional).
