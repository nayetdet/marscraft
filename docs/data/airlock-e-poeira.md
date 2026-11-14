# Airlock e poeira: como funciona na vida real e como o jogo usa isso

> Pesquisa de 2026-11-14. Os recursos oficiais do desafio ([`../challenge/recursos.md`](../challenge/recursos.md)) não cobrem airlock nem poeira; as fontes abaixo são papers da NASA (NTRS) e pesquisa publicada.

## O processo real

**Airlock tradicional:** é uma salinha com duas portas que nunca ficam abertas ao mesmo tempo.

- **Para sair:** o astronauta entra com o traje e fecha a porta de dentro. O ar é bombeado para fora (despressurização) e só então a porta de fora abre.
- **Para voltar:** ele fecha a porta de fora, o airlock enche de ar (repressurização), a porta de dentro abre e ele tira o traje.
- **Custo:** cada ciclo gasta gás. O ar da salinha é jogado fora antes de cada saída, e sistemas como o "Airsave" guardam parte dele para reaproveitar ([Stromgren et al., NASA NTRS 2023](https://ntrs.nasa.gov/citations/20230000121)).
- **Na ISS:** depois de uma caminhada espacial, a tripulação repressuriza o airlock Quest e tira o traje cerca de 1 h depois do fim ([NASA: Quest airlock](https://www.nasa.gov/international-space-station/quest-airlock/)).

**Poeira:** o maior problema do airlock tradicional é que a poeira entra junto com o traje ([Rucker, NASA NTRS 2016](https://ntrs.nasa.gov/citations/20150014493)).

- **No Apollo:** a poeira subiu no ar da cabine e causou a "lunar hay fever": olhos ardendo, espirro e garganta irritada (relato de Harrison Schmitt, Apollo 17). Os sintomas variaram de astronauta para astronauta ([NASA ICES](https://ntrs.nasa.gov/api/citations/20250000173/downloads/ICES%20doc.pdf), [Futurity](https://www.futurity.org/?p=1749272)).
- **Em Marte:** a poeira é muito fina e tem perclorato (atrapalha a tireoide), sílica, óxidos de ferro e metais. Quase todo o dano previsto é nos pulmões ([Wang et al. 2025, GeoHealth](https://ntrs.nasa.gov/citations/20250000969)).

**Limpeza eletrostática:** um campo elétrico empurra a poeira para fora.

- Um teste de 2024 tirou mais de 95% da poeira direto da superfície, mas **não limpou bem o tecido do traje**. A técnica ainda está em desenvolvimento ([Univ. Bristol, Acta Astronautica 2024](https://research-information.bris.ac.uk/en/publications/development-of-electrostatic-removal-system-for-application-in-du/)).
- Em 2012, fios no tecido repeliram mais de 80% da poeira ([ASCE 2012](https://ascelibrary.com/doi/10.1061/9780784412190.011)).

**Suitport (a alternativa preferida):** o traje fica preso do lado de fora da parede, e o astronauta entra nele por trás, então a poeira não entra.

- **Custo:** mais peso e espaço na cabine, e ainda é preciso uma porta para a primeira e a última saída ([Rucker 2016](https://ntrs.nasa.gov/citations/20150014493)).
- O estudo da base lunar Artemis recomenda o suitport-airlock, que não precisa ser ciclado a cada saída ([NTRS 2023](https://ntrs.nasa.gov/citations/20230000121)).

## Como o jogo usa isso (`src/world/Airlock.js`)

- **A porta só abre no fim do ciclo.**
  - Para abrir para Marte: fechar a outra porta, bombear o ar para fora e abrir.
  - Para abrir para a base: fechar a outra porta, encher de ar, limpar o traje e abrir.
  - Se o airlock já está na pressão certa, a etapa de ar é pulada.
- **A limpeza do traje** só acontece quando o jogador entra na base vindo do airlock com o traje sujo. Ela gasta `STATION_CONFIG.DECONTAMINATION_COST` de energia e leva `MISSION_CONFIG.SUIT_CLEAN_TIME`.
  - Sem energia, a etapa avisa e a poeira entra na base: `stations.contaminated` passa a ser verdadeiro, o O2 da base cai e a vida também.
  - O trade-off é **energia e tempo contra o ar da base**.
- **A barra no centro da tela** (`src/ui/airlockProgress.js`) mostra a etapa atual em palavras simples. Na primeira limpeza aparece o fato do Apollo.
- **Simplificação:** no jogo a limpeza tira toda a poeira. Na vida real ela ainda não limpa bem o tecido. Os tempos (3 s de ar e 2,5 s de limpeza) são escalados para o jogo; na ISS o processo leva horas.
