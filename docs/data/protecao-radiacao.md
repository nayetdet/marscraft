# Proteção contra radiação: o que a NASA faz de verdade

> Pesquisa feita em 2026-11-14 para o escudo do jogo (tecla `R`). Fontes no fim.
> Números de dose (RadLab, DONKI) ficam em [`numeros-reais.md`](numeros-reais.md).

## Resumo

Existem três jeitos de proteger astronautas, e só o primeiro é usado hoje:

| Tipo | Como funciona | Situação real |
|---|---|---|
| **Passiva (massa)** | Colocar matéria entre a pessoa e as partículas: água, polietileno, regolito, até a bagagem | **É o que se usa hoje** (Orion, ISS) e o plano para bases |
| **Ativa (campo magnético)** | Bobinas supercondutoras em volta do habitat criam um campo que **desvia partículas carregadas** | **Só pesquisa** (estudos NASA NIAC); nunca voou |
| **Planetária** | Um ímã gigante no ponto L1 de Marte cria uma "magnetosfera artificial" para o planeta todo | **Ideia conceitual** (2017), para proteger a atmosfera, não uma base |

## 1. Proteção passiva: o que existe de fato

- **Abrigo de tempestade na Orion (Artemis):** quando o alarme do sensor HERA dispara num evento de partículas solares (SEP), a tripulação tira as bolsas de carga dos compartimentos e empilha tudo contra a parede menos protegida, no centro da cápsula. O abrigo é montado **em até 1 hora**, e a tripulação pode precisar ficar nele **por até 24 horas**. A ideia é aumentar a massa em volta das pessoas sem acrescentar massa à nave.
- **Materiais:** materiais ricos em hidrogênio (água, polietileno) seguram melhor as partículas e geram menos radiação secundária que o metal. Estudos de habitat em Marte acharam que uma mistura com **50% de água protege muito mais que regolito seco**, e sugerem paredes com uma camada grossa rica em água.
- **Regolito:** cobrir o habitat com solo local é uma opção barata, porque não precisa ser trazido da Terra. Na Lua, estudos mostram que a camada de regolito reduz bastante a dose de SEP e de raios cósmicos em missões curtas.

## 2. Proteção ativa: o escudo magnético (o que o jogo mostra)

- **Como seria:** bobinas **supercondutoras de alta temperatura (HTS)** em volta do habitat. No estudo da NASA (NIAC 2012, Johnson Space Center), a melhor configuração foi **"6 em volta de 1"**: seis bobinas expansíveis de **4 a 8 m de diâmetro e 15 a 20 m de comprimento** em volta do módulo, mais uma bobina compensadora perto do habitat. Ela segura o campo do lado de fora, para não entrar campo magnético onde a tripulação vive.
- **Força do campo:** o estudo seguinte (MAARSS, NIAC Fase II) usou como base bobinas de **8 m com 1 tesla** e depois uma versão de **16 m com 1,5 tesla**.
- **O que ele bloqueia:** só **partículas carregadas** (prótons das tempestades solares e raios cósmicos galácticos), que o campo desvia. Como usa pouca matéria, gera pouca radiação secundária.
- **Limites:** é **pesado, caro e gasta muita energia** (resfriar e alimentar as bobinas). O estudo CREW HaT (NIAC 2022, Univ. de Wisconsin) concluiu que **uma camada passiva extra protege o mesmo que o sistema ativo** estudado, e o problema é o custo de massa. O caminho mais promissor é **combinar ativa e passiva**.
- **O campo é invisível.** Não existe bolha brilhante de verdade.

## 3. Magnetosfera artificial para Marte (só conceito)

Em 2017, Jim Green (então diretor de Ciência Planetária da NASA) apresentou no workshop *Planetary Science Vision 2050* a ideia de um dipolo magnético no **ponto L1 de Marte** (~320 raios de Marte de distância) para criar uma magnetosfera artificial e frear a perda da atmosfera para o vento solar. O próprio autor chamou a ideia de "fantasiosa"; não há projeto de engenharia.

## Como o jogo usa isso (e o que simplifica)

- **Tecla `R` = escudo magnético ativo** (seção 2): gasta energia da bateria enquanto está ligado, como as bobinas reais, que precisam de muita energia.
- **Só protege dentro das bolhas** em volta da base (`src/mission/shieldZone.js`): uma por grupo de módulos (habitat, estufa, ala norte com os painéis, dormitório e plataforma do foguete). A cratera de gelo fica de fora. Fora dela, a dose não muda e o HUD avisa "outside the bubble!". Um campo de bobinas só desvia partículas na região perto delas.
- **A bolha é uma visualização:** o campo real é invisível. As linhas mostram o campo arqueando sobre a base e, durante a tempestade solar, as faíscas mostram partículas sendo desviadas (`src/graphics/shieldBubble.js`).
- **Simplificações (escala de jogo):**
  - O jogo reduz a dose em 80% (`RADIATION_CONFIG.SHIELD_FACTOR = 0.2`). Os estudos reais não dão um número único, e o ativo sozinho ainda não supera o passivo.
  - Não há bobinas modeladas em volta da base.
- **O habitat é a proteção passiva** (`HABITAT_FACTOR = 0.25`): ficar dentro, atrás das paredes, já corta parte da dose.
- **Abrigo de tempestade com parede de água** (issue #56): cabine no canto sudeste do habitat (`HABITAT_LAYOUT.SHELTER_*`). No painel o jogador move água do tanque da base para a parede (`MissionSystem.fillShelterWall`). Dentro da cabine a dose é multiplicada pela curva do PREDICCS (`shelterDoseFactor`): parede vazia não protege nada a mais; 40 L (10 g/cm² na escala do jogo) cortam ~83 %. O custo: água na parede não serve para beber nem para a estufa.

## Fontes

- NASA NIAC: [Radiation Protection and Architecture Utilizing High Temperature Superconducting Magnets](https://www.nasa.gov/directorates/stmd/niac/niac-studies/radiation-protection-and-architecture-utilizing-high-temperature-superconducting-magnets/) (Westover, JSC, 2012).
- NASA NTRS: [Magnet Architectures and Active Radiation Shielding Study (MAARSS)](https://ntrs.nasa.gov/citations/20190002579).
- NASA NTRS: [NIAC 2022 Phase I, CREW HaT (D'Onghia)](https://ntrs.nasa.gov/citations/20250002403), [relatório final em PDF](https://ntrs.nasa.gov/api/citations/20250002403/downloads/NIAC_2022_PhI_DOnghia_CREWHat.pdf).
- NASA: [Scientists and Engineers Evaluate Orion Radiation Protection Plan](https://www.nasa.gov/missions/artemis/orion/scientists-and-engineers-evaluate-orion-radiation-protection-plan/).
- NASA Science: [How NASA Will Protect Astronauts From Space Radiation at the Moon](https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon).
- Space.com: [What will happen if Artemis 2 astronauts get hit by a solar storm](https://www.space.com/space-exploration/artemis/how-the-artemis-2-astronauts-could-weather-a-solar-storm-during-their-moon-mission) (abrigo em 1 h, até 24 h).
- Phys.org: [Shielding on the surface of Mars (2022)](https://phys.org/news/2022-06-shielding-surface-mars.pdf) (água × regolito).
- NASA Astrobiology: [How to Give Mars an Atmosphere, Maybe](https://astrobiology.nasa.gov/news/how-to-give-mars-an-atmosphere-maybe/) (dipolo em L1, 2017).
