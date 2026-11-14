# Recursos oficiais do desafio (aba "Resources")

> Fonte: <https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/?tab=resources> (extraído em 2026-11-14).
> Os detalhes técnicos de cada API (endpoints testados, formato de resposta, limites e o que está quebrado) estão em [`../data/apis-nasa.md`](../data/apis-nasa.md).

## Situação de cada recurso (testado em 2026-11-14)

| Recurso | Tipo | Situação | Uso sugerido no jogo |
|---|---|---|---|
| [NASA Open APIs](https://api.nasa.gov/) | Portal de APIs com chave | ✅ no ar (`DEMO_KEY` estoura rápido, então peça uma chave grátis). **Mars Rover Photos está fora do ar.** `DONKI/FLR` retorna 404. | Gateway para o DONKI, APOD, InSight e outros |
| [DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) | Clima espacial (CME, flares, SEP, tempestades) | ✅ via `api.nasa.gov/DONKI/*` (CME e notifications OK). O host direto `kauai.ccmc.gsfc.nasa.gov` deu timeout nesta rede. | Eventos de radiação do jogo: "tempestade solar chegando, reforçar blindagem?" |
| [OSDR](https://osdr.nasa.gov/bio/repo/) | Estudos de biologia espacial e saúde | ✅ API de busca sem chave | "Fato real da NASA" (perda óssea, músculo, sono, sistema imune) |
| [RadLab](https://visualization.osdr.nasa.gov/radlab/gui/data-api/) | Dosimetria de radiação (ISS, Orion/Artemis I, Curiosity, LRO…) | ✅ API `…/radlab/api/` no ar. A página de documentação (GUI) retorna 500. | Taxa de dose **real** por local (Marte, Lua, ISS, Artemis I) |
| [Mars Trek](https://trek.nasa.gov/mars/) | Imagens, elevação e terreno de Marte | ✅ tiles WMTS e busca no ar | Escolha do local da base, mapa/minimapa, textura real do terreno |
| [CSA: recursos para STEM e jovens](https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp) | Material educativo (bilíngue EN/FR) | página informativa | Tom pedagógico e ideias de atividades |
| [CSA: produção de comida na Lua](https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/) | Toolkit educativo | página informativa | Base para a mecânica da estufa/comida |

O desafio cita a CSA (Canadian Space Agency) como agência parceira. O guia de submissão incentiva usar dados das agências parceiras de 2026, e a lista inclui a **Agência Espacial Brasileira (AEB)**.

---

## Texto original (verbatim)

NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites. For non-U.S. Government websites, participants must comply with any data use parameters of that specific website.

## NASA Data & Resources

[NASA Open APIs](https://api.nasa.gov/): NASA's central public API portal, providing free programmatic access to datasets including the Astronomy Picture of the Day (APOD), Mars Rover Photos, and the Space Weather Database (DONKI). A free API key (higher rate limits than the shared demo key) can be requested instantly and is a good starting point for any challenge team building a data-connected prototype.

[Space Weather Database Of Notifications, Knowledge, Information (DONKI)](https://ccmc.gsfc.nasa.gov/tools/DONKI/): Real, regularly updated data on solar flares, coronal mass ejections, and other space weather events that drive radiation risk for astronauts and spacecraft. Useful for grounding any radiation-shielding, communications-disruption, or mission-risk mechanic in actual current conditions rather than invented numbers.

[NASA Open Science Data Repository (OSDR)](https://osdr.nasa.gov/bio/repo/): ([search API](https://osdr.nasa.gov/osdr/data/search?term=KEYWORD)) NASA's public archive of space biology and astronaut health research, including studies on how spaceflight affects bone density, muscle mass, immune response, sleep, and more across many organisms. Searchable by keyword, making it well suited for tools that want to surface real published NASA science relevant to human health trade-offs in space.

[RadLab (OSDR Radiation Dosimetry Database)](https://visualization.osdr.nasa.gov/radlab/gui/data-api/): Real radiation dose measurements recorded by dosimetry instruments aboard the International Space Station, contributed by multiple international space agencies. Provides authentic astronaut radiation exposure data (e.g., absorbed dose rate) useful for any tool modeling shielding, health risk, or long-duration mission trade-offs.

[Mars Trek](https://trek.nasa.gov/mars/): An interactive visualization and data-download portal for real Mars surface imagery, elevation, and terrain data compiled from NASA's Mars missions (including Curiosity and Perseverance). Useful for teams wanting real environmental or geographic data to ground a Mars outpost site or terrain visualization in actual surface conditions.

## Space Agency Partner Resources

CSA (Canadian Space Agency)

[Space resources for STEM and youth organizations](https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp): The CSA's Space Resources for STEM and Youth Organizations page provides free, bilingual tools and activities to help educators engage youth in space and STEM. Designed for museums, libraries, camps, after-school clubs, community groups, and outreach organizations, these resources support learning beyond the classroom.

[Food production on the moon and in remote areas](https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/): This web package is a one-stop resource for educators and youth who want to learn about food in space. This toolkit aims to outline how food production in space can relate to the health and nutrition of astronauts as well as benefit humans on Earth.