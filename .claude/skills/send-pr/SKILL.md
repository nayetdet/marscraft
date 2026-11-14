---
name: send-pr
description: Sobe o trabalho atual como Pull Request no nasa-space-apps seguindo o fluxo do projeto — rebase em cima da main, checagem de erros (lockfile, build, testes), criação de testes para o que mudou, vínculo com uma issue (usa uma existente ou cria) que é fechada pelo PR. Use quando o usuário chamar /send-pr ou pedir para "subir o PR" / "mandar o PR" neste projeto.
disable-model-invocation: true
---

# /send-pr

Fluxo único para levar a branch atual até um PR aberto no `nayetdet/nasa-space-apps`. Siga as etapas **na ordem**; se uma etapa falhar e a correção não for óbvia, pare e reporte ao usuário em vez de seguir adiante.

Argumento opcional (`$ARGUMENTS`): descrição curta do que foi feito / número de issue (`#12`). Use para nomear branch, issue e PR.

## Regra de conta do GitHub (obrigatória)

O repo é **privado** e só a conta pessoal `DerickBessa` tem acesso. A conta ativa da máquina é a da empresa e **não deve ser trocada** (nada de `gh auth switch`).

- Todo comando `gh` roda com o token pessoal, no mesmo comando (estado do shell não persiste entre chamadas):
  ```bash
  export GH_TOKEN=$(gh auth token --user DerickBessa) && gh ... -R nayetdet/nasa-space-apps
  ```
- `git fetch/pull/push` já usam a conta pessoal via credential helper local do repo (`git config --local credential.https://github.com.helper`). Se der erro de autenticação, verifique se esse helper ainda existe antes de qualquer outra coisa.

## 1. Preparar a branch

1. `git status` e `git branch --show-current`.
2. Se estiver na `main`: crie uma branch `feat/<slug>` (ou `fix/<slug>`) a partir do trabalho atual. **Nunca** abra PR da `main` nem faça push direto nela.
3. Se houver alterações não commitadas: revise o que é (não inclua lixo — `dist/`, `node_modules/`, arquivos temporários) e commite com mensagem no padrão Conventional Commits (`feat: ...`, `fix: ...`).

## 2. Rebase na main

```bash
git fetch origin
git rebase origin/main
```

- Conflito trivial e inequívoco → resolva, `git add`, `git rebase --continue`.
- Conflito que envolve decisão de comportamento (duas lógicas diferentes no mesmo trecho) → `git rebase --abort`, mostre o conflito ao usuário e pare.
- Depois do rebase, se a branch já existia no remoto, o push será com `--force-with-lease` (nunca `--force` puro, e nunca na `main`).

## 3. Verificar erros no código

Rode tudo e só siga com tudo verde:

1. **Lockfile em sincronia** — o deploy do Pages roda `npm ci`, que quebra se `package-lock.json` divergir do `package.json`:
   ```bash
   npm ci
   ```
   Se falhar com `EUSAGE` / "not in sync": rode `npm install`, confira que o diff do lock é coerente com o `package.json` e commite (`chore: sync package-lock`).
2. **Build de produção** (mesmo do CI): `npm run build`. Qualquer erro ou import quebrado bloqueia o PR.
3. **Testes**: `npm test` (após a etapa 4 existir).
4. **Revisão do diff** (`git diff origin/main...HEAD`): procure erros que o build não pega — variável indefinida, `console.log` de debug esquecido, código morto, caminhos de asset sem respeitar o `base: '/nasa-space-apps/'` do Vite.

Erro encontrado → corrija, commite e rode as checagens de novo.

## 4. Criar testes

O projeto é Vite + Three.js (jogo voxel). Testes com **Vitest** (integra com a config do Vite).

**Se ainda não houver setup de testes** (sem script `test` no `package.json`):
```bash
npm install -D vitest
```
e adicione ao `package.json`: `"test": "vitest run"`. Commite junto com o lock atualizado (`chore: add vitest`).

**Para cada arquivo com lógica alterada/criada no diff**, escreva testes ao lado do arquivo (`src/**/<nome>.test.js`):

- Foque em **lógica pura e determinística**: geração de terreno (`world/terrainGenerator.js`), raycast de voxel (`world/voxelRaycaster.js`), física (`player/PlayerPhysics.js`), sobrevivência (`player/SurvivalSystem.js`), configs de blocos, cálculos de corpos celestes (`sky/celestialBodies.js`).
- Não tente renderizar WebGL. Código que precisa de `document`/canvas/WebGL: teste só a parte de lógica extraível; não monte mocks gigantes de Three.js só para ter cobertura.
- Cubra caso normal + bordas reais (limites do mundo, valores zero/negativos, colisão no limite do bloco).
- Se um teste revelar **bug real**, corrija o código — não ajuste o teste para passar.
- Mudança só de CSS/HUD visual sem lógica → não force teste; registre no PR que não se aplica.

Rode `npm test` até ficar verde e commite (`test: ...`).

## 5. Issue vinculada

```bash
export GH_TOKEN=$(gh auth token --user DerickBessa) && gh issue list -R nayetdet/nasa-space-apps --state open --limit 50
```

- **Branch com número da issue** (padrão do `/start-issue`: `feat/N-<slug>`) ou usuário passou `#N` → use essa issue.
- **Existe issue que corresponde ao trabalho** → use ela. Comente nela resumindo o que foi feito e o link do PR (após criá-lo).
- **Não existe** → crie uma descrevendo o problema/feature (título curto, corpo com contexto e critério de pronto):
  ```bash
  gh issue create -R nayetdet/nasa-space-apps --title "..." --body "..."
  ```
- O PR leva `Closes #N` no corpo → a issue é **fechada automaticamente quando o PR for mergeado** (é assim que ela fica marcada como feita, sem fechar antes do código entrar na `main`).
- Se o usuário pedir explicitamente para fechar a issue já (sem esperar o merge): `gh issue close N -R nayetdet/nasa-space-apps --comment "Feito em #<PR>"`.

## 6. Push e PR

```bash
git push -u origin <branch>            # ou --force-with-lease se reescreveu após rebase
export GH_TOKEN=$(gh auth token --user DerickBessa) && gh pr create -R nayetdet/nasa-space-apps --base main --head <branch> --title "<tipo>: <resumo>" --body "..."
```

Corpo do PR:

```markdown
## O que muda
- ...

## Como foi verificado
- `npm ci` ✅
- `npm run build` ✅
- `npm test` ✅ (N testes; arquivos novos: ...)

Closes #N
```

Se já existir PR aberto para a branch (`gh pr view`), não crie outro — só faça o push e atualize o corpo se necessário.

## 7. Relatório final

Responda ao usuário em poucas linhas: link do PR, issue vinculada (criada ou reaproveitada), resultado do rebase (limpo / conflitos resolvidos), checagens e testes criados. Se algo foi pulado, diga o quê e por quê.
