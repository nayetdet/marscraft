# MineMars: estado atual × requisitos do desafio

> Snapshot de 2026-11-14 (base: `main` em `8ac347f`). Atualize quando mecânicas mudarem.

## O que o jogo já é

Jogo voxel em primeira pessoa **no navegador** (Three.js + Vite, sem backend, deploy no GitHub Pages). O jogador sobrevive numa cratera de Marte ao redor de uma base/nave.

| Sistema | Onde | O que faz hoje |
|---|---|---|
| Mundo voxel | `src/world/VoxelWorld.js`, `terrainGenerator.js` | Mundo 112×48×112 com cratera, chunks e meshing. Dá para quebrar e colocar blocos. |
| Base e nave | `src/world/nasaSpaceshipBuilder.js`, `nasaModelsBuilder.js` | Habitat principal, túnel pressurizado, estufa (domo), painéis solares (só visual), antena, rover e console, com colisão nos objetos |
| Sobrevivência | `src/player/SurvivalSystem.js`, `SURVIVAL_CONFIG` | 4 barras de 0–20: **O2, Vida, Água, Comida**. O O2 cai fora e recarrega dentro da área pressurizada. Água e comida caem sempre. Zerar qualquer uma tira vida, e vida zerada mata. |
| Consumíveis | `src/config/blockTypes.js` | Martian Ice (+água) e Mars Potato (+comida, +vida), usados com o botão direito |
| Céu astronômico | `src/sky/*` | Sol, Terra e Lua vistos de Marte, Fobos e Deimos, ciclo dia/noite em "sols", luneta (tecla Z), avanço de tempo (tecla T) |
| HUD | `src/ui/HudManager.js`, `index.html` | Barras estilo Minecraft, hotbar de 9 slots, inventário (tecla E, 36 slots), toasts, tela de morte e rótulos no céu. **UI em inglês.** |

## Organização da base (`src/base/`)

A base é dividida em zonas com placa, cor no piso e função: `CMD-1` comando, `LSS-1` suporte de vida, `HAB-1` beliches, `SHL-1` abrigo de tempestade, `MED-1` enfermaria, `GAL-1` cozinha, `GRN-1` estufa, `GYM-1` academia e `AL-1` airlock.

- **Telas vivas** (`baseDisplayText.js` + `baseCanvas.js`): status da base no comando, mapa de energia e banco de baterias (1 luz = 10 %), medidor de radiação no abrigo e painel da estufa. Redesenham só quando o conteúdo muda.
- **Abrigo de tempestade** (`baseZones.js`): ficar parado sob as bolsas de água reduz a dose (`RADIATION_CONFIG.SHELTER_FACTOR`). Não gasta energia, mas o jogador não trabalha dali; a alternativa é a blindagem [R], que gasta bateria.
- **Pôsteres educativos** (`basePosters.js`): 8 pôsteres com um quadro "REAL DATA" e a fonte. Mirar e apertar [F] mostra o dado.
- **Menu**: "NASA Data" (fontes e aviso de que o dado é embutido, não ao vivo) e "Demo Controls" (adiantar a próxima tempestade real, noite, meio-dia e bateria a 10 %), pensado para jurados e para gravar o vídeo.

## Comparação com o que o desafio pede

| Requisito do desafio | Situação | Gap |
|---|---|---|
| Posto avançado na Lua/Marte | ✅ Marte | — |
| **Suporte de vida** | ✅ | O O2 do habitat só recarrega com energia da bateria (issue #30). |
| **Blindagem contra radiação** | ✅ | Tempestades solares a partir de CMEs reais do DONKI, dose em mSv (RadLab), abrigo no habitat e blindagem [R] que gasta energia (issue #30). |
| **Orçamento de energia** | ✅ | Bateria carregada pelo Sol (43 % da Terra, zero à noite); gastam O2, blindagem, fábrica de combustível e rádio (issue #30). |
| **Condição de vitória** | ✅ | Abastecer o MAV (gelo + energia), sobreviver a 3 tempestades e enviar os dados científicos (issue #30). |
| **Produção de comida** | 🟡 | Batatas são um estoque finito; não há cultivo, nem custo de água/energia na estufa. |
| **Atraso de comunicação** | ❌ | Não existe. |
| **Toda escolha tem custo (trade-off)** | ❌ | **Este é o gap principal.** Hoje não há nenhuma decisão com custo: a estratégia ótima é ficar dentro da nave. |
| **Dados reais da NASA** | ❌ | Nenhum dado real. O céu é "inspirado", não alimentado por dados. |
| **Atribuição de fontes no jogo** | ✅ | Tela "NASA Data" no menu e fonte em cada pôster e tela da base. |
| Público de 7 a 12 anos, linguagem simples | 🟡 | O texto é simples, mas o jogo **não ensina** nenhuma restrição real. Vale explicar termos como "sol" e "dose". |
| Navegador, sem conta | ✅ | — |
| Rejogabilidade | 🟡 | Mundo fixo e sem eventos aleatórios. |
| 2 ou 3 recursos centrais | ⚠️ | Hoje são 4 barras (O2, vida, água, comida) e nenhuma é de energia ou radiação. Considere **trocar** e não somar: Energia + O2 + Radiação, com água e comida abstraídas ou ligadas à estufa. |
| UI em inglês para submissão | ✅ | A UI já está em inglês (PR #8). Falta escrever em inglês a página de submissão e a demo. |

## Proposta de núcleo de trade-off (mínimo viável para a entrega)

Três recursos ligados entre si, todos alimentados por dados reais:

1. **⚡ Energia** (painéis solares → bateria)
   - Gera de dia e zera à noite (o ciclo de sol já existe). Em Marte gera menos que na Terra: [Ref] ~43 %.
   - Consome com: reciclagem de O2 dentro do habitat, luz e água da estufa, blindagem e rádio.
2. **🫁 Suporte de vida (O2)**
   - Dentro do habitat, o O2 **só recarrega se houver energia**. Isso cria o trade-off central.
3. **☢️ Radiação (dose acumulada)**
   - Taxa base = **RadLab Curiosity MSL-RAD real** (~6,9 por hora de jogo, normalizada).
   - **Evento de tempestade solar vindo do DONKI:** a CME real mais recente (velocidade e data) dispara um aviso: "Tempestade solar chega em X horas!". O jogador escolhe **ligar a blindagem (gasta energia)** ou **ir para o abrigo e parar de trabalhar/coletar** (perde produção).
   - Mostrar a origem: "Baseado na CME real de 01/11/2026, 894 km/s (NASA DONKI)".

Extras, se der tempo:
- **📡 Atraso de comunicação:** pedidos de ajuda ou dicas ao "Controle da Missão" chegam com X minutos de atraso. Usar o atraso real Terra–Marte do dia, calculado pela distância.
- **🌱 Estufa:** plantar custa água e energia e devolve comida depois de N sols (tema do toolkit da CSA).
- **📚 Fatos reais (OSDR):** cartões curtos ao morrer ou ao fim de cada sol, ligados à causa ("Na Estação Espacial, a NASA viu ossos enfraquecerem… OSD-342").
- **🗺️ Escolha do local de pouso (Mars Trek):** Gale × Jezero × polo sul da Lua, cada um com parâmetros diferentes (dose, frio, gelo).

## Regras de dados no jogo (vindas do desafio)

- Use dados **embutidos** (JSON em `src/data/` gerado por script) como base e faça fetch ao vivo do DONKI só como bônus, com fallback.
- Rotule sempre: **"ao vivo"** só se o fetch funcionou; caso contrário, **"dados reais de DD/MM/AAAA"**.
- Tenha uma tela de **"Fontes / Dados da NASA"** acessível pelo menu, listando DONKI, RadLab, InSight, OSDR e Mars Trek com links.
- Não use o logo da NASA em texturas ou na UI geradas.
