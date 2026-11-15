import { GYM_ES, GYM_PT_BR } from '../story/acts/act3Gym.ts';
import {
  ACT_STEPS_ES, ACT_STEPS_PT_BR, CUTSCENE_ES, CUTSCENE_PT_BR, STORY_ES, STORY_MORE_ES, STORY_MORE_PT_BR, STORY_PT_BR,
} from './i18nStory.ts';
import { FIRST_ICE_ES, FIRST_ICE_PT_BR } from './i18nFirstIce.ts';
import { STORM_SCANS_ES, STORM_SCANS_PT_BR } from './i18nStormScans.ts';
import { GAMEPLAY_ES, GAMEPLAY_PT_BR } from './i18nGameplay.ts';
import { GAMEPLAY_EXT_ES, GAMEPLAY_EXT_PT_BR } from './i18nGameplayExtended.ts';
import { STATION_COPY_ES, STATION_COPY_PT_BR } from './i18nStationCopy.ts';
import { SCIENCE_COPY_ES, SCIENCE_COPY_PT_BR } from './i18nScienceCopy.ts';
import { RESEARCH_COPY_ES, RESEARCH_COPY_PT_BR } from './i18nResearchCopy.ts';
import { SCANNER_COPY_ES, SCANNER_COPY_PT_BR } from './i18nScannerCopy.ts';
import { HUD_COPY_ES, HUD_COPY_PT_BR } from './i18nHudCopy.ts';
import { CORE_COPY_ES, CORE_COPY_PT_BR } from './i18nCoreCopy.ts';

export const LANGUAGE_STORAGE_KEY = 'marscraft.language';

export const LANGUAGES = ['en', 'pt-BR', 'es'] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  'pt-BR': 'Português (Brasil)',
  es: 'Español',
};

// English is the source key. Keep every visible string that is translated here in
// both catalogs; checkTranslationCoverage() makes missing language entries testable.
const PT_BR: Record<string, string> = {
  ...GAMEPLAY_PT_BR,
  ...GAMEPLAY_EXT_PT_BR,
  ...STATION_COPY_PT_BR,
  ...SCIENCE_COPY_PT_BR,
  ...RESEARCH_COPY_PT_BR,
  ...SCANNER_COPY_PT_BR,
  ...HUD_COPY_PT_BR,
  ...CORE_COPY_PT_BR,
  ...STORY_PT_BR,
  ...ACT_STEPS_PT_BR,
  ...GYM_PT_BR,
  ...STORY_MORE_PT_BR,
  ...CUTSCENE_PT_BR,
  ...FIRST_ICE_PT_BR, // trade-off do primeiro gelo (ato 1, #413)
  ...STORM_SCANS_PT_BR, // fichas raras que so existem na tempestade (ato 2, #419)
  'Loading terrain...': 'Carregando terreno...',
  'Rotate your device': 'Gire o aparelho',
  'Turn your device sideways to continue playing.': 'Vire o aparelho na horizontal para continuar jogando.',
  'Pause game': 'Pausar jogo',
  'Now with breathable habitats!': 'Agora com habitats que têm ar para respirar!',
  DUST: 'POEIRA', STORM: 'TEMPESTADE', SOON: 'EM BREVE',
  'Left stick': 'Controle esquerdo', 'Drag right': 'Arraste à direita',
  'JUMP · MINE · USE': 'PULAR · MINERAR · USAR', 'TALK · BAG': 'FALAR · MOCHILA',
  'Environment: Habitat breach (oxygen leaking)': 'Ambiente: falha no habitat (vazamento de oxigênio)',
  'Environment: Pressurized Habitat (WATER TANK EMPTY: no water to make oxygen)': 'Ambiente: habitat pressurizado (TANQUE DE ÁGUA VAZIO: sem água para produzir oxigênio)',
  'Environment: Pressurized Habitat (NO POWER: oxygen is not refilling)': 'Ambiente: habitat pressurizado (SEM ENERGIA: o oxigênio não está sendo reposto)',
  'Environment: Pressurized Habitat (refilling oxygen)': 'Ambiente: habitat pressurizado (repondo oxigênio)',
  'Environment: Martian Crater (using oxygen)': 'Ambiente: cratera marciana (usando oxigênio)',
  'DUST IN HABITAT: clean at life support': 'POEIRA NO HABITAT: limpe na estação de suporte à vida',
  'Low bone density / fitness: work is slower. Train in the Gym Wing!': 'Ossos ou preparo físico fracos: o trabalho fica mais lento. Treine na academia!',
  'Solar storm coming': 'Tempestade solar a caminho', 'Dust storm coming': 'Tempestade de poeira a caminho',
  'Dust storm in progress': 'Tempestade de poeira em andamento', 'Dust on the solar panels': 'Poeira nos painéis solares',
  'Scan complete · in journal [J]': 'Escaneamento concluído · veja no diário [J]', 'Scan complete!': 'Escaneamento concluído!',
  DOSE: 'DOSE', OXYGEN: 'OXIGÊNIO', HEALTH: 'SAÚDE', SUIT: 'TRAJE', WATER: 'ÁGUA', FOOD: 'COMIDA',
  DRILL: 'PERFURAR', 'Operate Rover Remote Terminal': 'Operar terminal remoto do rover',
  'Solar storms survived': 'Tempestades solares sobrevividas',
  'Mission clues: blue = analyzed, green = sent to Earth': 'Pistas da missão: azul = analisada, verde = enviada à Terra',
  'Science points sent to Earth': 'Pontos científicos enviados à Terra', 'Ice loaded into the rocket': 'Gelo carregado no foguete',
  EARTH: 'TERRA', POWER: 'ENERGIA', HELP: 'AJUDA', PLANTS: 'PLANTAS',
  DRINK: 'BEBER', GROW: 'CRESCER', WALL: 'PAREDE', AIR: 'AR', RADIATION: 'RADIAÇÃO', HEAT: 'CALOR', MORNING: 'MANHÃ',
  OUTSIDE: 'LÁ FORA', MARSQUAKE: 'TERREMOTO MARCIANO',
  'WATER NOW': 'ÁGUA ATUAL', 'OLD LAKE': 'LAGO ANTIGO', 'LIFE INGREDIENT': 'INGREDIENTE DA VIDA',
  'Mars still has water: it is frozen': 'Marte ainda tem água: ela está congelada', 'This rock was mud in a lake': 'Esta rocha já foi lama no fundo de um lago', 'Sulfur is one ingredient life needs': 'O enxofre é um dos ingredientes necessários à vida',
  'Gale was a lake, good for life': 'Gale já foi um lago, um lugar que poderia abrigar vida',
  'Unload 1 tube': 'Descarregar 1 tubo', 'Load 1 tube': 'Carregar 1 tubo',
  'The filter cleans the air you breathe out': 'O filtro limpa o ar que você expira',
  'Why exercise?': 'Por que fazer exercícios?',
  'Lower gravity means astronauts need to exercise their muscles and bones. Training effects are simulated.': 'A gravidade menor faz com que astronautas precisem exercitar os músculos e os ossos. Os efeitos do treino são simulados.',
  'NASA info': 'Informações da NASA', 'Journal pages': 'Páginas do diário',
  'Scope Scanner': 'Luneta de escaneamento', 'EVA SUIT DIAGNOSTICS': 'DIAGNÓSTICO DO TRAJE ESPACIAL',
  '[F] EQUIP SUIT & START EVA': '[F] VESTIR O TRAJE E INICIAR A EVA', '[R] REPAIR SUIT': '[R] REPARAR O TRAJE', '[C] CLEAN DUST': '[C] LIMPAR A POEIRA',
  'NASA DATA': 'DADOS DA NASA', 'Rocket Fuel (ISRU):': 'Combustível do foguete (uso de recursos locais):',
  'Splits Mars ice into hydrogen + oxygen, then mixes with Mars CO2 to make methane fuel.': 'Separa o gelo de Marte em hidrogênio e oxigênio. Depois, combina o hidrogênio com o CO₂ de Marte para produzir metano, usado como combustível.',
  'Storms:': 'Tempestades:', 'Wait out 1 solar storms safely inside or under the shield.': 'Espere a tempestade solar passar em segurança dentro da base ou sob o escudo.',
  'Sample Tubes:': 'Tubos de amostra:', 'NASA Mars ISRU': 'ISRU de Marte da NASA',
  'Interact with nearby stations or objects. Use a Crew Quarters bunk to sleep and pass time (costs food, water, and base power). In the rover, exit.': 'Interaja com estações e objetos próximos. Use uma cama nos alojamentos para dormir e adiantar o tempo (isso consome comida, água e energia da base). No rover, use para sair.',
  'Hold LMB': 'Segure o botão esquerdo do mouse',
  'Sleeping makes time pass fast. Your body still uses food and water. Life support has backup power, so an empty battery will not wake you. Critical alarms will.': 'Dormir faz o tempo passar rápido. Seu corpo continua usando comida e água. O suporte à vida tem energia reserva; por isso, uma bateria vazia não vai acordar você. Alarmes importantes vão.',
  'Stay awake': 'Continuar acordado', 'Sleeping... zzz': 'Dormindo... zzz',
  'Real NASA data (saved in game).': 'Dados reais da NASA (salvos no jogo).',
  'Explore radiation data': 'Explorar dados de radiação',
  'Drink tank': 'Tanque de água potável', 'Shield wall': 'Parede de blindagem',
  'The Sun is charging the battery': 'O Sol está carregando a bateria', 'Night: no sun, the battery goes down': 'À noite não há Sol e a bateria descarrega',
  MOVE: 'MOVER', JUMP: 'PULAR', MINE: 'MINERAR', USE: 'USAR', TALK: 'FALAR', BAG: 'MOCHILA', MORE: 'MAIS',
  RUN: 'CORRER', VIEW: 'VISÃO', DROP: 'SOLTAR', SEND: 'ENVIAR',
  'Jump': 'Pular', 'Mine or drill': 'Minerar ou perfurar', 'Use or place block': 'Usar ou colocar bloco',
  'Interact': 'Interagir', 'Open inventory': 'Abrir inventário', 'More actions': 'Mais ações',
  'Toggle sprint': 'Ativar corrida', 'Toggle third-person view': 'Alternar para terceira pessoa',
  'Drop selected item': 'Soltar item selecionado', 'Send science data to Earth': 'Enviar dados científicos à Terra',
  'Find water ice': 'Encontrar gelo de água', 'Collect ice': 'Coletar gelo', 'Unload ice': 'Descarregar gelo',
  'Aim at an object · hold left click to scan': 'Mire em um objeto · segure o botão esquerdo para escanear',
  'Martian Regolith': 'Rególito marciano', Empty: 'Vazio',
  Play: 'Jogar', Controls: 'Controles', Options: 'Opções', 'Demo Tools': 'Ferramentas de demonstração',
  'Science & Sources': 'Ciência e fontes', 'Reset World': 'Reiniciar mundo', Quit: 'Sair',
  'Meet the team': 'Conheça a equipe', Volume: 'Volume', 'Adjust the volume of game sounds.': 'Ajuste o volume dos sons do jogo.',
  Credits: 'Créditos', 'Meet the team behind MarsCraft.': 'Conheça a equipe por trás do MarsCraft.',
  'Derick Bessa on LinkedIn, opens in a new tab': 'Derick Bessa no LinkedIn, abre em uma nova aba',
  'João Pedro Moreira on LinkedIn, opens in a new tab': 'João Pedro Moreira no LinkedIn, abre em uma nova aba',
  'Isaac Duarte on LinkedIn, opens in a new tab': 'Isaac Duarte no LinkedIn, abre em uma nova aba',
  'Letícia Freitas on GitHub, opens in a new tab': 'Letícia Freitas no GitHub, abre em uma nova aba',
  'Renan França on LinkedIn, opens in a new tab': 'Renan França no LinkedIn, abre em uma nova aba',
  'Lucas Rocha on LinkedIn, opens in a new tab': 'Lucas Rocha no LinkedIn, abre em uma nova aba',
  'Game volume': 'Volume do jogo', Graphics: 'Gráficos',
  'Real-time sun shadows, glow and light rays. Turn off if the game feels slow.': 'Sombras do Sol em tempo real, brilho e raios de luz. Desative se o jogo ficar lento.',
  'Shaders: Off': 'Efeitos gráficos: desligados', 'Shaders: On': 'Efeitos gráficos: ligados',
  Language: 'Idioma', 'Choose the language used throughout the game.': 'Escolha o idioma usado no jogo.',
  English: 'Inglês', 'Português (Brasil)': 'Português (Brasil)', Español: 'Espanhol',
  Back: 'Voltar', 'Where the data comes from': 'De onde vêm os dados',
  'The science numbers in MarsCraft (radiation, sunlight, air, distance, crew needs) come from open NASA data. Speeds, sizes and costs are game rules, and each screen says which is which. Most data is saved inside the game with its date, so it is not live. Only space weather tries to load LIVE from NASA DONKI when the game opens. Without internet, the game uses the saved data and never says LIVE.': 'Os números científicos do MarsCraft (radiação, luz solar, ar, distância e necessidades da equipe) vêm de dados abertos da NASA. Velocidades, tamanhos e custos são regras do jogo; cada tela explica qual é qual. A maioria dos dados fica salva no jogo com a data de coleta, então não é ao vivo. Só o clima espacial tenta buscar dados AO VIVO na NASA DONKI quando o jogo abre. Sem internet, o jogo usa os dados salvos e nunca diz que estão AO VIVO.',
  'Solar storms': 'Tempestades solares',
  'Real CMEs (clouds of particles thrown by the Sun) that NASA predicted would reach Mars, listed by NASA DONKI. The warning time is the trip NASA predicted, squeezed so 1 real day is 1 game hour. ': 'EMCs reais (nuvens de partículas lançadas pelo Sol) que a NASA previu que chegariam a Marte, listadas pela NASA DONKI. O aviso usa o tempo de viagem previsto pela NASA, ajustado para que 1 dia real dure 1 hora no jogo. ',
  'Space weather live': 'Clima espacial ao vivo',
  'When the game opens it asks NASA DONKI for the CMEs of the last 30 days, the bursts of super fast particles (SEP) of the last 60 days and the newest NASA space weather bulletin, shown on the radio at the science station. If NASA sends no SEP, the game does not make one up. If the internet fails or no CME is headed to Mars, the game uses the data saved inside it.': 'Quando o jogo abre, ele pede à NASA DONKI as EMCs dos últimos 30 dias, os surtos de partículas muito rápidas (SEP) dos últimos 60 dias e o boletim mais recente de clima espacial da NASA, exibido no rádio da estação científica. Se a NASA não enviar um SEP, o jogo não inventa um. Se a internet falhar ou nenhuma EMC estiver a caminho de Marte, o jogo usa os dados salvos nele.',
  'Storm strength': 'Força da tempestade',
  'A game rule: a faster CME makes a stronger storm. It always stays between two real storms measured by the Curiosity rover: the one in 2017 that doubled the radiation for two days, and the biggest ever, in 2024 (8,100 uGy, like 30 chest X-rays). How much it hurts is also a game rule.': 'Regra do jogo: quanto mais rápida a EMC, mais forte a tempestade. A força fica entre duas tempestades reais medidas pelo rover Curiosity: a de 2017, que dobrou a radiação por dois dias, e a maior já medida, em 2024 (8.100 uGy, como 30 radiografias do tórax). O dano causado também é uma regra do jogo.',
  Radiation: 'Radiação',
  'Curiosity rover RAD instrument at Gale Crater, from NASA RadLab (OSDR): 6.93 uGy per hour, measured 16/11 to 10/12/2022.': 'Instrumento RAD do rover Curiosity na Cratera Gale, segundo o NASA RadLab (OSDR): 6,93 uGy por hora, medidos de 16/11 a 10/12/2022.',
  'Trip dose': 'Dose da viagem',
  "On the way to Mars, Curiosity's RAD measured 1.8 mSv per day inside the spacecraft (Zeitlin et al., Science, 2013). A 203-day trip like Mars 2020 adds about 365 mSv before landing. On Mars, the game counts each game hour like about 8 days (a game rule).": 'Na viagem a Marte, o RAD do Curiosity mediu 1,8 mSv por dia dentro da nave (Zeitlin et al., Science, 2013). Uma viagem de 203 dias, como a da missão Mars 2020, soma cerca de 365 mSv antes do pouso. Em Marte, cada hora no jogo vale cerca de 8 dias (regra do jogo).',
  Ground: 'Terreno',
  'The shape of the land is real. It is a small crater inside Gale Crater on Mars (': 'O formato do terreno é real. É uma cratera pequena dentro da Cratera Gale, em Marte (',
  '), measured from orbit by HiRISE, a camera on NASA\'s Mars Reconnaissance Orbiter. One block is about 1 meter. Real data from ': '), medida da órbita pela HiRISE, uma câmera da sonda Mars Reconnaissance Orbiter da NASA. Cada bloco tem cerca de 1 metro. Dados reais de ',
  '. The flat ground under the base and the ice pit were shaped for the game.': '. O chão plano sob a base e a cava de gelo foram preparados para o jogo.',
  'Mars facts': 'Fatos sobre Marte',
  'Gravity 38% of Earth, a day of 24 h 39 min and 43% of Earth sunlight, from the NASA Mars Fact Sheet.': 'Gravidade de 38% da terrestre, dia de 24 h e 39 min e 43% da luz solar que chega à Terra, segundo a Ficha Técnica de Marte da NASA.',
  Weather: 'Clima',
  'Real data from the NASA InSight lander at Elysium Planitia, sols 675 to 681 (October 2020): low and high temperature, air pressure and wind gusts. Each game sol uses one real sol, in order. The heater uses more power when the real air is colder. The shape of the temperature curve during the day is a game rule.': 'Dados reais do módulo de pouso InSight da NASA em Elysium Planitia, nos sols 675 a 681 (outubro de 2020): temperaturas mínima e máxima, pressão do ar e rajadas de vento. Cada sol do jogo usa um sol real, na ordem. O aquecedor consome mais energia quando o ar real está mais frio. O formato da curva de temperatura ao longo do dia é uma regra do jogo.',
  'Dust storms': 'Tempestades de poeira',
  'Dust in the air is measured as "tau" (how much sunlight it blocks). A clear sky at the Opportunity rover was about 0.5; the 2018 global storm reached 10.8, the highest ever measured on the ground (NASA JPL). Mars air is too thin to push you over: the danger is the dust, which hides the Sun and covers solar panels. When storms come, how long they last and how much power they cut are game rules.': 'A poeira no ar é medida como "tau" (quanto ela bloqueia a luz do Sol). O céu limpo observado pelo rover Opportunity tinha cerca de 0,5; a tempestade global de 2018 chegou a 10,8, o maior valor medido no solo (NASA JPL). O ar de Marte é fino demais para derrubar você: o perigo é a poeira, que esconde o Sol e cobre os painéis solares. Quando as tempestades acontecem, quanto duram e quanta energia cortam são regras do jogo.',
  'Mars events': 'Eventos em Marte',
  'Real events: the InSight lander felt more than 1,300 marsquakes (the biggest, magnitude 5, on 04/05/2022) and a meteor impact on 24/12/2021, whose new crater with ice was found by the MRO orbiter. Perseverance filmed Phobos crossing the Sun (02/04/2022) and detected a green aurora (March 2024). Spirit got its solar panels cleaned by the wind in March 2005, maybe by a dust devil. Viking 2 photographed frost on the ground (1977). When events happen and how strong they are is a game rule, picked by the mission seed.': 'Eventos reais: o módulo InSight sentiu mais de 1.300 tremores marcianos (o maior, de magnitude 5, em 04/05/2022) e um impacto de meteoro em 24/12/2021. A sonda MRO encontrou a nova cratera com gelo. O rover Perseverance filmou Fobos passando diante do Sol (02/04/2022) e detectou uma aurora verde (março de 2024). Em março de 2005, o vento limpou os painéis solares do Spirit, talvez com um redemoinho de poeira. A Viking 2 fotografou geada no solo (1977). Quando os eventos acontecem e qual sua intensidade são regras do jogo, definidas pela semente da missão.',
  'Map samples': 'Amostras do mapa',
  'Real finds: the Curiosity rover studied the moving Bagnold Dunes (2015), drilled lake mudstone at Yellowknife Bay (2013), cracked open a rock full of pure sulfur crystals (30/05/2024) and found iron meteorites like Cacao (2023), all in Gale Crater. The Phoenix lander dug up water ice near the north pole (2008). Where the samples sit on the map, and how many science points each one is worth, are game rules.': 'Descobertas reais: o rover Curiosity estudou as dunas móveis de Bagnold (2015), perfurou lama de lago em Yellowknife Bay (2013), abriu uma rocha cheia de cristais de enxofre puro (30/05/2024) e encontrou meteoritos de ferro como Cacao (2023), tudo na Cratera Gale. O módulo Phoenix encontrou gelo de água perto do polo norte (2008). Onde as amostras ficam no mapa e quantos pontos científicos valem são regras do jogo.',
  'Crew needs': 'Necessidades da equipe',
  'Oxygen, water and food per person from the NASA Baseline Values and Assumptions Document. Water recycling of 98% like the Space Station.': 'Quantidades de oxigênio, água e comida por pessoa segundo o documento NASA Baseline Values and Assumptions. Reciclagem de 98% da água, como na Estação Espacial.',
  'Making air': 'Produção de ar',
  'Two real machines, and you pick one. The Space Station Oxygen Generation Assembly (OGA) splits water: 36 g of water make 32 g of oxygen, so one person needs about 0.95 L of water a day for air (NASA, 2015). A Sabatier reactor turns leftover hydrogen and the CO2 we breathe out back into water, but gets back only about half (NASA ICES, 2024). MOXIE on the Perseverance rover pulled 122 g of oxygen out of Mars air, at best 12 g per hour (NASA, 2023). How much power each machine uses is a game rule.': 'Há duas máquinas reais; você escolhe uma. O Sistema de Geração de Oxigênio (OGA) da Estação Espacial separa a água: 36 g de água produzem 32 g de oxigênio. Uma pessoa precisa de cerca de 0,95 L de água por dia para produzir ar (NASA, 2015). Um reator Sabatier transforma em água o hidrogênio restante e o CO₂ que expiramos, mas recupera só cerca da metade (NASA ICES, 2024). O MOXIE, no rover Perseverance, extraiu 122 g de oxigênio do ar marciano, no máximo 12 g por hora (NASA, 2023). A energia consumida por cada máquina é uma regra do jogo.',
  'Space biology': 'Biologia espacial',
  'Real studies about bones, muscles, radiation, rest and the immune system from the NASA Open Science Data Repository (OSDR), and the radiation comparison from NASA RadLab. They unlock in your journal [J], which shows the date the data was saved.': 'Estudos reais sobre ossos, músculos, radiação, descanso e sistema imunológico do NASA Open Science Data Repository (OSDR), além da comparação de radiação do NASA RadLab. Eles são desbloqueados no diário [J], que mostra a data em que os dados foram salvos.',
  Health: 'Saúde',
  'Career radiation limit of 600 mSv (NASA-STD-3001). Bones lose about 1% of density a month in space without exercise (NASA, 2023).': 'Limite de radiação ao longo da carreira: 600 mSv (NASA-STD-3001). Sem exercícios, os ossos perdem cerca de 1% da densidade por mês no espaço (NASA, 2023).',
  Sleep: 'Sono',
  'Astronauts on the Space Shuttle and the Space Station slept about 6 hours a night, with 8.5 hours planned (study of 85 astronauts, Barger et al., 2014). How much food and water you use while you sleep is a game rule.': 'Astronautas do ônibus espacial e da Estação Espacial dormiam cerca de 6 horas por noite, embora 8,5 horas fossem planejadas (estudo com 85 astronautas, Barger et al., 2014). A comida e a água usadas durante o sono são regras do jogo.',
  'Night power': 'Energia à noite',
  'The fission reactor in the Power & Heat room is based on Kilopower, a small reactor NASA tested in 2018 (1 to 10 kW, day and night). Its power and the radiation it adds are game rules: real reactors stay far from the crew or behind a heavy shield.': 'O reator de fissão na sala de Energia e Calor é inspirado no Kilopower, um reator pequeno testado pela NASA em 2018 (de 1 a 10 kW, dia e noite). A energia dele e a radiação que acrescenta são regras do jogo: reatores reais ficam longe da equipe ou atrás de uma blindagem pesada.',
  'Sound effects': 'Efeitos sonoros',
  'Interface and suit sounds by Kenney, from the Interface Sounds, UI Audio, and Sci-fi Sounds packs, under CC0 1.0. The original sources of the older gameplay WAV files are not recorded in this project yet.': 'Sons da interface e do traje por Kenney, dos pacotes Interface Sounds, UI Audio e Sci-fi Sounds, sob a licença CC0 1.0. As fontes originais dos arquivos WAV mais antigos do jogo ainda não foram registradas neste projeto.',
  'Game speed, battery size and storm length are scaled so a mission fits in a few minutes. The start menu space art was generated with AI assistance. Other art and textures are drawn by code. The game uses no NASA logo. Parts of the code were written with AI assistance.': 'A velocidade do jogo, a capacidade da bateria e a duração das tempestades são ajustadas para que uma missão caiba em poucos minutos. A arte espacial do menu inicial foi criada com auxílio de IA. As outras artes e texturas são desenhadas por código. O jogo não usa o logotipo da NASA. Partes do código foram escritas com auxílio de IA.',
  'For judges and for recording the demo. These skip the waiting, they do not change the rules. Storms still come from the real NASA DONKI list.': 'Para avaliadores e gravação da demonstração. Estas ações pulam a espera, mas não mudam as regras. As tempestades ainda vêm da lista real da NASA DONKI.',
  'Start a solar storm': 'Iniciar tempestade solar', 'Start a dust storm': 'Iniciar tempestade de poeira',
  'Drain the battery to 10%': 'Reduzir a bateria a 10%', 'Jump to night': 'Avançar para a noite',
  'Jump to noon': 'Avançar para o meio-dia', 'Skip the tutorial': 'Pular o tutorial',
  'Meteor impact': 'Impacto de meteoro', Marsquake: 'Terremoto marciano', 'Phobos eclipse': 'Eclipse de Fobos',
  'Dust devil': 'Redemoinho de poeira', 'Morning frost': 'Geada matinal', 'Green aurora': 'Aurora verde',
  'Movement and View': 'Movimento e câmera',
  'Move on foot; drive and steer the rover. Double-tap forward to sprint.': 'Ande; dirija e controle o rover. Toque duas vezes para frente para correr.',
  'Hold to sprint on foot': 'Segure para correr a pé', 'Look around on foot and in the rover': 'Olhe ao redor a pé e no rover',
  'Show or hide diagnostics': 'Mostrar ou ocultar diagnósticos', 'Switch between first- and third-person view': 'Alternar entre primeira e terceira pessoa',
  'Actions and Items': 'Ações e itens', 'Jump on foot; drill or unload ice in the rover': 'Pule a pé; perfure ou descarregue gelo no rover',
  'Break blocks or harvest crops': 'Quebre blocos ou colha plantas', 'Use the selected item or place a block': 'Use o item selecionado ou coloque um bloco',
  'Cycle hotbar items; adjust scope zoom while scanning': 'Alterne itens da barra; ajuste o zoom da luneta ao escanear',
  'Open or close your inventory': 'Abra ou feche o inventário', 'Drop the selected item': 'Solte o item selecionado',
  'Touch controls': 'Controles por toque', 'Move and steer': 'Mover e dirigir', 'Look around': 'Olhar ao redor',
  'Act with the selected item': 'Aja com o item selecionado', 'Interact and open your inventory': 'Interaja e abra o inventário',
  'Run, change camera, drop an item or send science data': 'Corra, mude a câmera, solte um item ou envie dados científicos',
  'Tap a slot to select it': 'Toque em um espaço para selecioná-lo', 'Pause the mission': 'Pause a missão',
  'In the rover, steer with the stick, look by dragging, tap DRILL, then TALK to leave.': 'No rover, dirija com o controle, olhe arrastando, toque em PERFURAR e depois em FALAR para sair.',
  Paused: 'Em pausa', 'Close station': 'Fechar estação', 'NASA sources': 'Fontes da NASA',
  'MISSION SYSTEMS // SIMULATION PAUSED': 'SISTEMAS DA MISSÃO // SIMULAÇÃO EM PAUSA',
  'EVA suit': 'Traje de atividade extraveicular', Air: 'Ar', Heat: 'Calor', Filter: 'Filtro', Dust: 'Poeira',
  Inventory: 'Inventário', 'Choose an item, then a slot. Select the journal twice to open it.': 'Escolha um item e depois um espaço. Selecione o diário duas vezes para abri-lo.',
  'Close inventory': 'Fechar inventário', Close: 'Fechar', Hotbar: 'Barra de itens', 'SPACE JOURNAL': 'DIÁRIO ESPACIAL', CADET: 'CADETE',
  'MISSION ENDED': 'MISSÃO ENCERRADA', 'NEXT MISSION': 'PRÓXIMA MISSÃO', Respawn: 'Reaparecer',
  'MAV ROCKET': 'FOGUETE MAV', 'Rocket ready': 'Foguete pronto', 'Ice in bag': 'Gelo no compartimento', 'Base battery': 'Bateria da base',
  'Load 6 ice': 'Carregue 6 blocos de gelo', FUEL: 'COMBUSTÍVEL', STORMS: 'TEMPESTADES', DATA: 'DADOS', NO: 'NÃO',
  'Survive solar storms by sheltering in the base or using the shield. Scan and analyze samples, then send science from the radio terminal. Each rock sample tube needs more ice for the heavier rocket.': 'Sobreviva às tempestades solares abrigando-se na base ou usando o escudo. Escaneie e analise amostras; depois envie os dados científicos pelo rádio. Cada tubo de amostra de rocha exige mais gelo para o foguete mais pesado.',
  'Survive solar storms by sheltering in the base or using the shield. Scan and analyze samples, then send science from the radio terminal. A sample sealed in a tube is not analyzed: it is worth double in your final report, and needs more ice for the heavier rocket.': 'Sobreviva às tempestades solares abrigando-se na base ou usando o escudo. Escaneie e analise amostras; depois envie os dados científicos pelo rádio. A amostra guardada em um tubo não é analisada: ela vale o dobro no relatório final e exige mais gelo para o foguete mais pesado.',
  FACTORY: 'FÁBRICA', OFF: 'DESLIGADO', ON: 'LIGADO', '+1 ICE': '+1 GELO', 'ALL (0)': 'TODOS (0)', TUBES: 'TUBOS', '+2 ICE': '+2 GELO', 'IGNITE!': 'DECOLAR!',
  'Liftoff!': 'Decolagem!', 'The MAV is on its way to orbit. Mission complete!': 'O MAV está a caminho da órbita. Missão concluída!',
  'Mission numbers': 'Dados da missão', 'Play again': 'Jogar novamente', Skip: 'Pular', OK: 'OK',
  'EVERY CHOICE HAS A COST': 'TODA ESCOLHA TEM UM CUSTO', 'CERTIFICATE UNLOCKED': 'CERTIFICADO CONQUISTADO',
  'Unable to load the game. Please refresh.': 'Não foi possível carregar o jogo. Atualize a página.',
  'Pause the game': 'Pausar o jogo', 'Close journal': 'Fechar diário',
  'EQUIP SUIT & START EVA': 'VESTIR TRAJE E INICIAR EVA', 'REPAIR SUIT': 'REPARAR TRAJE', 'CLEAN DUST': 'LIMPAR POEIRA',
  'O2 SUPPLY': 'SUPRIMENTO DE O₂', 'THERMAL SHIELD': 'PROTEÇÃO TÉRMICA', 'CO2 SCRUBBER': 'FILTRO DE CO₂',
  PERCHLORATES: 'PERCLORATOS', 'SUIT INTEGRITY': 'INTEGRIDADE DO TRAJE', 'DOCKED': 'ACOPLADO', CHARGED: 'CARREGADO', READY: 'PRONTO', CLEAN: 'LIMPO',
  'Rotate your device to landscape': 'Gire o aparelho para a horizontal',
};

const ES: Record<string, string> = {
  ...GAMEPLAY_ES,
  ...GAMEPLAY_EXT_ES,
  ...STATION_COPY_ES,
  ...SCIENCE_COPY_ES,
  ...RESEARCH_COPY_ES,
  ...SCANNER_COPY_ES,
  ...HUD_COPY_ES,
  ...CORE_COPY_ES,
  ...STORY_ES,
  ...ACT_STEPS_ES,
  ...GYM_ES,
  ...STORY_MORE_ES,
  ...CUTSCENE_ES,
  ...FIRST_ICE_ES, // trade-off do primeiro gelo (ato 1, #413)
  ...STORM_SCANS_ES, // fichas raras que so existem na tempestade (ato 2, #419)
  'Loading terrain...': 'Cargando terreno...',
  'Rotate your device': 'Gira el dispositivo',
  'Turn your device sideways to continue playing.': 'Gira el dispositivo a horizontal para seguir jugando.',
  'Pause game': 'Pausar juego',
  'Now with breathable habitats!': '¡Ahora con hábitats con aire respirable!',
  DUST: 'POLVO', STORM: 'TORMENTA', SOON: 'PRONTO',
  'Left stick': 'Control izquierdo', 'Drag right': 'Arrastra a la derecha',
  'JUMP · MINE · USE': 'SALTAR · MINAR · USAR', 'TALK · BAG': 'HABLAR · MOCHILA',
  'Environment: Habitat breach (oxygen leaking)': 'Entorno: falla del hábitat (fuga de oxígeno)',
  'Environment: Pressurized Habitat (WATER TANK EMPTY: no water to make oxygen)': 'Entorno: hábitat presurizado (TANQUE DE AGUA VACÍO: no hay agua para producir oxígeno)',
  'Environment: Pressurized Habitat (NO POWER: oxygen is not refilling)': 'Entorno: hábitat presurizado (SIN ENERGÍA: no se repone el oxígeno)',
  'Environment: Pressurized Habitat (refilling oxygen)': 'Entorno: hábitat presurizado (reponiendo oxígeno)',
  'Environment: Martian Crater (using oxygen)': 'Entorno: cráter marciano (consumiendo oxígeno)',
  'DUST IN HABITAT: clean at life support': 'POLVO EN EL HÁBITAT: limpia el sistema de soporte vital',
  'Low bone density / fitness: work is slower. Train in the Gym Wing!': 'Baja densidad ósea o poca condición física: trabajar es más lento. ¡Entrena en el gimnasio!',
  'Solar storm coming': 'Se acerca una tormenta solar', 'Dust storm coming': 'Se acerca una tormenta de polvo',
  'Dust storm in progress': 'Tormenta de polvo en curso', 'Dust on the solar panels': 'Polvo en los paneles solares',
  'Scan complete · in journal [J]': 'Escaneo completo · consulta el diario [J]', 'Scan complete!': '¡Escaneo completo!',
  DOSE: 'DOSIS', OXYGEN: 'OXÍGENO', HEALTH: 'SALUD', SUIT: 'TRAJE', WATER: 'AGUA', FOOD: 'COMIDA',
  DRILL: 'PERFORAR', 'Operate Rover Remote Terminal': 'Usar el terminal remoto del rover',
  'Solar storms survived': 'Tormentas solares sobrevividas',
  'Mission clues: blue = analyzed, green = sent to Earth': 'Pistas de la misión: azul = analizada, verde = enviada a la Tierra',
  'Science points sent to Earth': 'Puntos científicos enviados a la Tierra', 'Ice loaded into the rocket': 'Hielo cargado en el cohete',
  EARTH: 'TIERRA', POWER: 'ENERGÍA', HELP: 'AYUDA', PLANTS: 'PLANTAS',
  DRINK: 'BEBER', GROW: 'CRECER', WALL: 'PARED', AIR: 'AIRE', RADIATION: 'RADIACIÓN', HEAT: 'CALOR', MORNING: 'MAÑANA',
  OUTSIDE: 'AFUERA', MARSQUAKE: 'TERREMOTO MARCIANO',
  'WATER NOW': 'AGUA ACTUAL', 'OLD LAKE': 'LAGO ANTIGUO', 'LIFE INGREDIENT': 'INGREDIENTE DE LA VIDA',
  'Mars still has water: it is frozen': 'Marte aún tiene agua: está congelada', 'This rock was mud in a lake': 'Esta roca fue barro en el fondo de un lago', 'Sulfur is one ingredient life needs': 'El azufre es uno de los ingredientes que necesita la vida',
  'Gale was a lake, good for life': 'Gale fue un lago, un lugar donde pudo haber vida',
  'Unload 1 tube': 'Descargar 1 tubo', 'Load 1 tube': 'Cargar 1 tubo',
  'The filter cleans the air you breathe out': 'El filtro limpia el aire que exhalas',
  'Why exercise?': '¿Por qué hacer ejercicio?',
  'Lower gravity means astronauts need to exercise their muscles and bones. Training effects are simulated.': 'La menor gravedad hace que los astronautas deban ejercitar los músculos y los huesos. Los efectos del entrenamiento son simulados.',
  'NASA info': 'Información de la NASA', 'Journal pages': 'Páginas del diario',
  'Scope Scanner': 'Mira de escaneo', 'EVA SUIT DIAGNOSTICS': 'DIAGNÓSTICO DEL TRAJE ESPACIAL',
  '[F] EQUIP SUIT & START EVA': '[F] PONERSE EL TRAJE E INICIAR LA EVA', '[R] REPAIR SUIT': '[R] REPARAR EL TRAJE', '[C] CLEAN DUST': '[C] LIMPIAR EL POLVO',
  'NASA DATA': 'DATOS DE LA NASA', 'Rocket Fuel (ISRU):': 'Combustible del cohete (uso de recursos locales):',
  'Splits Mars ice into hydrogen + oxygen, then mixes with Mars CO2 to make methane fuel.': 'Separa el hielo de Marte en hidrógeno y oxígeno. Luego combina el hidrógeno con CO₂ de Marte para producir metano como combustible.',
  'Storms:': 'Tormentas:', 'Wait out 1 solar storms safely inside or under the shield.': 'Espera a que pase la tormenta solar en un lugar seguro, dentro de la base o bajo el escudo.',
  'Sample Tubes:': 'Tubos de muestras:', 'NASA Mars ISRU': 'ISRU de Marte de la NASA',
  'Interact with nearby stations or objects. Use a Crew Quarters bunk to sleep and pass time (costs food, water, and base power). In the rover, exit.': 'Interactúa con las estaciones y los objetos cercanos. Usa una litera de los dormitorios para dormir y adelantar el tiempo (consume comida, agua y energía de la base). En el rover, úsala para salir.',
  'Hold LMB': 'Mantén pulsado el botón izquierdo del ratón',
  'Sleeping makes time pass fast. Your body still uses food and water. Life support has backup power, so an empty battery will not wake you. Critical alarms will.': 'Al dormir, el tiempo pasa rápido. Tu cuerpo sigue usando comida y agua. El soporte vital tiene energía de reserva, así que una batería vacía no te despertará. Las alarmas importantes sí.',
  'Stay awake': 'Seguir despierto', 'Sleeping... zzz': 'Durmiendo... zzz',
  'Real NASA data (saved in game).': 'Datos reales de la NASA (guardados en el juego).',
  'Explore radiation data': 'Explorar datos de radiación',
  'Drink tank': 'Depósito de agua potable', 'Shield wall': 'Pared de blindaje',
  'The Sun is charging the battery': 'El Sol está cargando la batería', 'Night: no sun, the battery goes down': 'De noche no hay Sol y baja la batería',
  MOVE: 'MOVER', JUMP: 'SALTAR', MINE: 'MINAR', USE: 'USAR', TALK: 'HABLAR', BAG: 'MOCHILA', MORE: 'MÁS',
  RUN: 'CORRER', VIEW: 'VISTA', DROP: 'SOLTAR', SEND: 'ENVIAR',
  'Jump': 'Saltar', 'Mine or drill': 'Minar o perforar', 'Use or place block': 'Usar o colocar bloque',
  'Interact': 'Interactuar', 'Open inventory': 'Abrir inventario', 'More actions': 'Más acciones',
  'Toggle sprint': 'Activar carrera', 'Toggle third-person view': 'Cambiar a tercera persona',
  'Drop selected item': 'Soltar el objeto seleccionado', 'Send science data to Earth': 'Enviar datos científicos a la Tierra',
  'Find water ice': 'Encontrar hielo de agua', 'Collect ice': 'Recoger hielo', 'Unload ice': 'Descargar hielo',
  'Aim at an object · hold left click to scan': 'Apunta a un objeto · mantén pulsado el botón izquierdo para escanear',
  'Martian Regolith': 'Regolito marciano', Empty: 'Vacío',
  Play: 'Jugar', Controls: 'Controles', Options: 'Opciones', 'Demo Tools': 'Herramientas de demostración',
  'Science & Sources': 'Ciencia y fuentes', 'Reset World': 'Reiniciar mundo', Quit: 'Salir',
  'Meet the team': 'Conoce al equipo', Volume: 'Volumen', 'Adjust the volume of game sounds.': 'Ajusta el volumen de los sonidos del juego.',
  Credits: 'Créditos', 'Meet the team behind MarsCraft.': 'Conoce al equipo detrás de MarsCraft.',
  'Derick Bessa on LinkedIn, opens in a new tab': 'Derick Bessa en LinkedIn, se abre en una pestaña nueva',
  'João Pedro Moreira on LinkedIn, opens in a new tab': 'João Pedro Moreira en LinkedIn, se abre en una pestaña nueva',
  'Isaac Duarte on LinkedIn, opens in a new tab': 'Isaac Duarte en LinkedIn, se abre en una pestaña nueva',
  'Letícia Freitas on GitHub, opens in a new tab': 'Letícia Freitas en GitHub, se abre en una pestaña nueva',
  'Renan França on LinkedIn, opens in a new tab': 'Renan França en LinkedIn, se abre en una pestaña nueva',
  'Lucas Rocha on LinkedIn, opens in a new tab': 'Lucas Rocha en LinkedIn, se abre en una pestaña nueva',
  'Game volume': 'Volumen del juego', Graphics: 'Gráficos',
  'Real-time sun shadows, glow and light rays. Turn off if the game feels slow.': 'Sombras del Sol en tiempo real, brillo y rayos de luz. Desactívalos si el juego va lento.',
  'Shaders: Off': 'Efectos gráficos: desactivados', 'Shaders: On': 'Efectos gráficos: activados',
  Language: 'Idioma', 'Choose the language used throughout the game.': 'Elige el idioma del juego.',
  English: 'Inglés', 'Português (Brasil)': 'Portugués (Brasil)', Español: 'Español',
  Back: 'Volver', 'Where the data comes from': 'De dónde vienen los datos',
  'The science numbers in MarsCraft (radiation, sunlight, air, distance, crew needs) come from open NASA data. Speeds, sizes and costs are game rules, and each screen says which is which. Most data is saved inside the game with its date, so it is not live. Only space weather tries to load LIVE from NASA DONKI when the game opens. Without internet, the game uses the saved data and never says LIVE.': 'Los datos científicos de MarsCraft (radiación, luz solar, aire, distancia y necesidades de la tripulación) provienen de datos abiertos de la NASA. Las velocidades, los tamaños y los costos son reglas del juego; cada pantalla indica cuál es cuál. La mayoría de los datos se guardan en el juego con su fecha, así que no son en vivo. Solo se intenta cargar el clima espacial EN VIVO desde NASA DONKI al abrir el juego. Sin internet, el juego usa los datos guardados y nunca indica que están EN VIVO.',
  'Solar storms': 'Tormentas solares',
  'Real CMEs (clouds of particles thrown by the Sun) that NASA predicted would reach Mars, listed by NASA DONKI. The warning time is the trip NASA predicted, squeezed so 1 real day is 1 game hour. ': 'EMC reales (nubes de partículas expulsadas por el Sol) que, según la NASA, llegarían a Marte; están en la lista de NASA DONKI. El aviso usa el tiempo de viaje previsto por la NASA, ajustado para que 1 día real dure 1 hora de juego. ',
  'Space weather live': 'Clima espacial en vivo',
  'When the game opens it asks NASA DONKI for the CMEs of the last 30 days, the bursts of super fast particles (SEP) of the last 60 days and the newest NASA space weather bulletin, shown on the radio at the science station. If NASA sends no SEP, the game does not make one up. If the internet fails or no CME is headed to Mars, the game uses the data saved inside it.': 'Al abrir el juego, se solicitan a NASA DONKI las EMC de los últimos 30 días, los estallidos de partículas muy rápidas (SEP) de los últimos 60 días y el boletín más reciente de clima espacial de la NASA, que aparece en la radio de la estación científica. Si la NASA no envía un SEP, el juego no inventa uno. Si falla internet o ninguna EMC se dirige a Marte, el juego usa los datos guardados.',
  'Storm strength': 'Intensidad de la tormenta',
  'A game rule: a faster CME makes a stronger storm. It always stays between two real storms measured by the Curiosity rover: the one in 2017 that doubled the radiation for two days, and the biggest ever, in 2024 (8,100 uGy, like 30 chest X-rays). How much it hurts is also a game rule.': 'Regla del juego: cuanto más rápida es la EMC, más intensa es la tormenta. Su intensidad se mantiene entre dos tormentas reales medidas por el rover Curiosity: la de 2017, que duplicó la radiación durante dos días, y la mayor registrada, en 2024 (8.100 uGy, como 30 radiografías de tórax). El daño que causa también es una regla del juego.',
  Radiation: 'Radiación',
  'Curiosity rover RAD instrument at Gale Crater, from NASA RadLab (OSDR): 6.93 uGy per hour, measured 16/11 to 10/12/2022.': 'Instrumento RAD del rover Curiosity en el cráter Gale, según NASA RadLab (OSDR): 6,93 uGy por hora, medidos del 16/11 al 10/12/2022.',
  'Trip dose': 'Dosis del viaje',
  "On the way to Mars, Curiosity's RAD measured 1.8 mSv per day inside the spacecraft (Zeitlin et al., Science, 2013). A 203-day trip like Mars 2020 adds about 365 mSv before landing. On Mars, the game counts each game hour like about 8 days (a game rule).": 'Durante el viaje a Marte, el instrumento RAD de Curiosity midió 1,8 mSv por día dentro de la nave (Zeitlin et al., Science, 2013). Un viaje de 203 días como el de Mars 2020 suma unos 365 mSv antes de aterrizar. En Marte, cada hora del juego equivale a unos 8 días (regla del juego).',
  Ground: 'Terreno',
  'The shape of the land is real. It is a small crater inside Gale Crater on Mars (': 'La forma del terreno es real. Es un cráter pequeño dentro del cráter Gale, en Marte (',
  '), measured from orbit by HiRISE, a camera on NASA\'s Mars Reconnaissance Orbiter. One block is about 1 meter. Real data from ': '), medido desde la órbita por HiRISE, una cámara de la sonda Mars Reconnaissance Orbiter de la NASA. Cada bloque mide cerca de 1 metro. Datos reales del ',
  '. The flat ground under the base and the ice pit were shaped for the game.': '. El terreno plano bajo la base y el pozo de hielo se prepararon para el juego.',
  'Mars facts': 'Datos sobre Marte',
  'Gravity 38% of Earth, a day of 24 h 39 min and 43% of Earth sunlight, from the NASA Mars Fact Sheet.': 'Gravedad del 38 % de la terrestre, día de 24 h y 39 min y un 43 % de la luz solar que recibe la Tierra, según la ficha técnica de Marte de la NASA.',
  Weather: 'Clima',
  'Real data from the NASA InSight lander at Elysium Planitia, sols 675 to 681 (October 2020): low and high temperature, air pressure and wind gusts. Each game sol uses one real sol, in order. The heater uses more power when the real air is colder. The shape of the temperature curve during the day is a game rule.': 'Datos reales del módulo de aterrizaje InSight de la NASA en Elysium Planitia, sols 675 a 681 (octubre de 2020): temperaturas mínima y máxima, presión del aire y ráfagas de viento. Cada sol del juego usa un sol real, en orden. El calentador consume más energía cuando el aire real está más frío. La forma de la curva de temperatura durante el día es una regla del juego.',
  'Dust storms': 'Tormentas de polvo',
  'Dust in the air is measured as "tau" (how much sunlight it blocks). A clear sky at the Opportunity rover was about 0.5; the 2018 global storm reached 10.8, the highest ever measured on the ground (NASA JPL). Mars air is too thin to push you over: the danger is the dust, which hides the Sun and covers solar panels. When storms come, how long they last and how much power they cut are game rules.': 'El polvo del aire se mide como "tau" (cuánta luz solar bloquea). El cielo despejado observado por el rover Opportunity tenía un valor aproximado de 0,5; la tormenta global de 2018 llegó a 10,8, el valor más alto medido en la superficie (NASA JPL). El aire de Marte es demasiado fino para derribarte: el peligro es el polvo, que oculta el Sol y cubre los paneles solares. Cuándo llegan las tormentas, cuánto duran y cuánta energía reducen son reglas del juego.',
  'Mars events': 'Eventos en Marte',
  'Real events: the InSight lander felt more than 1,300 marsquakes (the biggest, magnitude 5, on 04/05/2022) and a meteor impact on 24/12/2021, whose new crater with ice was found by the MRO orbiter. Perseverance filmed Phobos crossing the Sun (02/04/2022) and detected a green aurora (March 2024). Spirit got its solar panels cleaned by the wind in March 2005, maybe by a dust devil. Viking 2 photographed frost on the ground (1977). When events happen and how strong they are is a game rule, picked by the mission seed.': 'Eventos reales: el módulo InSight detectó más de 1.300 sismos marcianos (el mayor, de magnitud 5, el 04/05/2022) y el impacto de un meteorito el 24/12/2021; el orbitador MRO encontró el nuevo cráter con hielo. El rover Perseverance filmó a Fobos cruzando el Sol (02/04/2022) y detectó una aurora verde (marzo de 2024). El viento limpió los paneles solares de Spirit en marzo de 2005, quizá por un remolino de polvo. Viking 2 fotografió escarcha en el suelo (1977). Cuándo ocurren estos eventos y qué intensidad tienen son reglas del juego, definidas por la semilla de la misión.',
  'Map samples': 'Muestras del mapa',
  'Real finds: the Curiosity rover studied the moving Bagnold Dunes (2015), drilled lake mudstone at Yellowknife Bay (2013), cracked open a rock full of pure sulfur crystals (30/05/2024) and found iron meteorites like Cacao (2023), all in Gale Crater. The Phoenix lander dug up water ice near the north pole (2008). Where the samples sit on the map, and how many science points each one is worth, are game rules.': 'Hallazgos reales: el rover Curiosity estudió las dunas móviles de Bagnold (2015), perforó lodo de lago en Yellowknife Bay (2013), abrió una roca llena de cristales de azufre puro (30/05/2024) y encontró meteoritos de hierro como Cacao (2023), todo en el cráter Gale. El módulo Phoenix desenterró hielo de agua cerca del polo norte (2008). Dónde aparecen las muestras en el mapa y cuántos puntos científicos vale cada una son reglas del juego.',
  'Crew needs': 'Necesidades de la tripulación',
  'Oxygen, water and food per person from the NASA Baseline Values and Assumptions Document. Water recycling of 98% like the Space Station.': 'Cantidades de oxígeno, agua y comida por persona según el documento NASA Baseline Values and Assumptions. Reciclaje del 98 % del agua, como en la Estación Espacial.',
  'Making air': 'Producción de aire',
  'Two real machines, and you pick one. The Space Station Oxygen Generation Assembly (OGA) splits water: 36 g of water make 32 g of oxygen, so one person needs about 0.95 L of water a day for air (NASA, 2015). A Sabatier reactor turns leftover hydrogen and the CO2 we breathe out back into water, but gets back only about half (NASA ICES, 2024). MOXIE on the Perseverance rover pulled 122 g of oxygen out of Mars air, at best 12 g per hour (NASA, 2023). How much power each machine uses is a game rule.': 'Hay dos máquinas reales y tú eliges una. El Sistema de Generación de Oxígeno (OGA) de la Estación Espacial separa el agua: 36 g de agua producen 32 g de oxígeno, así que una persona necesita unos 0,95 L de agua al día para generar aire (NASA, 2015). Un reactor Sabatier convierte en agua el hidrógeno sobrante y el CO₂ que exhalamos, pero recupera solo cerca de la mitad (NASA ICES, 2024). MOXIE, en el rover Perseverance, extrajo 122 g de oxígeno del aire marciano, como máximo 12 g por hora (NASA, 2023). Cuánta energía consume cada máquina es una regla del juego.',
  'Space biology': 'Biología espacial',
  'Real studies about bones, muscles, radiation, rest and the immune system from the NASA Open Science Data Repository (OSDR), and the radiation comparison from NASA RadLab. They unlock in your journal [J], which shows the date the data was saved.': 'Estudios reales sobre huesos, músculos, radiación, descanso y el sistema inmunitario del NASA Open Science Data Repository (OSDR), y una comparación de radiación de NASA RadLab. Se desbloquean en tu diario [J], que muestra la fecha en que se guardaron los datos.',
  Health: 'Salud',
  'Career radiation limit of 600 mSv (NASA-STD-3001). Bones lose about 1% of density a month in space without exercise (NASA, 2023).': 'Límite de radiación durante la carrera: 600 mSv (NASA-STD-3001). Sin ejercicio, los huesos pierden cerca del 1 % de su densidad al mes en el espacio (NASA, 2023).',
  Sleep: 'Sueño',
  'Astronauts on the Space Shuttle and the Space Station slept about 6 hours a night, with 8.5 hours planned (study of 85 astronauts, Barger et al., 2014). How much food and water you use while you sleep is a game rule.': 'Los astronautas del transbordador espacial y de la Estación Espacial dormían unas 6 horas por noche, aunque se planificaban 8,5 horas (estudio de 85 astronautas, Barger et al., 2014). Cuánta comida y agua usas al dormir es una regla del juego.',
  'Night power': 'Energía nocturna',
  'The fission reactor in the Power & Heat room is based on Kilopower, a small reactor NASA tested in 2018 (1 to 10 kW, day and night). Its power and the radiation it adds are game rules: real reactors stay far from the crew or behind a heavy shield.': 'El reactor de fisión de la sala de Energía y Calor se basa en Kilopower, un reactor pequeño probado por la NASA en 2018 (de 1 a 10 kW, de día y de noche). Su potencia y la radiación que añade son reglas del juego: los reactores reales se mantienen lejos de la tripulación o detrás de un blindaje grueso.',
  'Sound effects': 'Efectos de sonido',
  'Interface and suit sounds by Kenney, from the Interface Sounds, UI Audio, and Sci-fi Sounds packs, under CC0 1.0. The original sources of the older gameplay WAV files are not recorded in this project yet.': 'Sonidos de la interfaz y del traje creados por Kenney, de los paquetes Interface Sounds, UI Audio y Sci-fi Sounds, con licencia CC0 1.0. Las fuentes originales de los archivos WAV más antiguos del juego aún no están registradas en este proyecto.',
  'Game speed, battery size and storm length are scaled so a mission fits in a few minutes. The start menu space art was generated with AI assistance. Other art and textures are drawn by code. The game uses no NASA logo. Parts of the code were written with AI assistance.': 'La velocidad del juego, el tamaño de la batería y la duración de las tormentas se ajustan para que una misión dure unos minutos. El arte espacial del menú inicial se creó con ayuda de IA. El resto del arte y las texturas se dibujan con código. El juego no usa el logotipo de la NASA. Algunas partes del código se escribieron con ayuda de IA.',
  'For judges and for recording the demo. These skip the waiting, they do not change the rules. Storms still come from the real NASA DONKI list.': 'Para el jurado y para grabar la demostración. Estas acciones omiten la espera, pero no cambian las reglas. Las tormentas siguen viniendo de la lista real de NASA DONKI.',
  'Start a solar storm': 'Iniciar una tormenta solar', 'Start a dust storm': 'Iniciar una tormenta de polvo',
  'Drain the battery to 10%': 'Bajar la batería al 10%', 'Jump to night': 'Avanzar hasta la noche',
  'Jump to noon': 'Avanzar hasta el mediodía', 'Skip the tutorial': 'Saltar el tutorial',
  'Meteor impact': 'Impacto de meteorito', Marsquake: 'Terremoto marciano', 'Phobos eclipse': 'Eclipse de Fobos',
  'Dust devil': 'Remolino de polvo', 'Morning frost': 'Escarcha matutina', 'Green aurora': 'Aurora verde',
  'Movement and View': 'Movimiento y vista',
  'Move on foot; drive and steer the rover. Double-tap forward to sprint.': 'Camina; conduce y dirige el rover. Toca dos veces hacia delante para correr.',
  'Hold to sprint on foot': 'Mantén pulsado para correr a pie', 'Look around on foot and in the rover': 'Mira alrededor a pie y en el rover',
  'Show or hide diagnostics': 'Mostrar u ocultar diagnósticos', 'Switch between first- and third-person view': 'Cambiar entre primera y tercera persona',
  'Actions and Items': 'Acciones y objetos', 'Jump on foot; drill or unload ice in the rover': 'Salta a pie; perfora o descarga hielo en el rover',
  'Break blocks or harvest crops': 'Rompe bloques o cosecha plantas', 'Use the selected item or place a block': 'Usa el objeto seleccionado o coloca un bloque',
  'Cycle hotbar items; adjust scope zoom while scanning': 'Cambia los objetos de la barra; ajusta el zoom de la mira al escanear',
  'Open or close your inventory': 'Abre o cierra el inventario', 'Drop the selected item': 'Suelta el objeto seleccionado',
  'Touch controls': 'Controles táctiles', 'Move and steer': 'Mover y dirigir', 'Look around': 'Mirar alrededor',
  'Act with the selected item': 'Actúa con el objeto seleccionado', 'Interact and open your inventory': 'Interactúa y abre el inventario',
  'Run, change camera, drop an item or send science data': 'Corre, cambia la cámara, suelta un objeto o envía datos científicos',
  'Tap a slot to select it': 'Toca un espacio para seleccionarlo', 'Pause the mission': 'Pausa la misión',
  'In the rover, steer with the stick, look by dragging, tap DRILL, then TALK to leave.': 'En el rover, dirige con el control, mira arrastrando, toca PERFORAR y luego HABLAR para salir.',
  Paused: 'En pausa', 'Close station': 'Cerrar estación', 'NASA sources': 'Fuentes de la NASA',
  'MISSION SYSTEMS // SIMULATION PAUSED': 'SISTEMAS DE MISIÓN // SIMULACIÓN EN PAUSA',
  'EVA suit': 'Traje de actividad extravehicular', Air: 'Aire', Heat: 'Calor', Filter: 'Filtro', Dust: 'Polvo',
  Inventory: 'Inventario', 'Choose an item, then a slot. Select the journal twice to open it.': 'Elige un objeto y luego un espacio. Selecciona el diario dos veces para abrirlo.',
  'Close inventory': 'Cerrar inventario', Close: 'Cerrar', Hotbar: 'Barra de objetos', 'SPACE JOURNAL': 'DIARIO ESPACIAL', CADET: 'CADETE',
  'MISSION ENDED': 'MISIÓN TERMINADA', 'NEXT MISSION': 'SIGUIENTE MISIÓN', Respawn: 'Reaparecer',
  'MAV ROCKET': 'COHETE MAV', 'Rocket ready': 'Cohete listo', 'Ice in bag': 'Hielo en el depósito', 'Base battery': 'Batería de la base',
  'Load 6 ice': 'Carga 6 bloques de hielo', FUEL: 'COMBUSTIBLE', STORMS: 'TORMENTAS', DATA: 'DATOS', NO: 'NO',
  'Survive solar storms by sheltering in the base or using the shield. Scan and analyze samples, then send science from the radio terminal. Each rock sample tube needs more ice for the heavier rocket.': 'Sobrevive a las tormentas solares refugiándote en la base o usando el escudo. Escanea y analiza muestras; después envía los datos científicos desde la radio. Cada tubo de muestra de roca necesita más hielo para el cohete más pesado.',
  'Survive solar storms by sheltering in the base or using the shield. Scan and analyze samples, then send science from the radio terminal. A sample sealed in a tube is not analyzed: it is worth double in your final report, and needs more ice for the heavier rocket.': 'Sobrevive a las tormentas solares refugiándote en la base o usando el escudo. Escanea y analiza muestras; después envía los datos científicos por radio. La muestra guardada en un tubo no se analiza: vale el doble en el informe final y necesita más hielo para el cohete, que será más pesado.',
  FACTORY: 'FÁBRICA', OFF: 'APAGADO', ON: 'ENCENDIDO', '+1 ICE': '+1 HIELO', 'ALL (0)': 'TODO (0)', TUBES: 'TUBOS', '+2 ICE': '+2 HIELO', 'IGNITE!': '¡DESPEGAR!',
  'Liftoff!': '¡Despegue!', 'The MAV is on its way to orbit. Mission complete!': 'El MAV va rumbo a la órbita. ¡Misión cumplida!',
  'Mission numbers': 'Datos de la misión', 'Play again': 'Jugar de nuevo', Skip: 'Saltar', OK: 'OK',
  'EVERY CHOICE HAS A COST': 'CADA ELECCIÓN TIENE UN COSTO', 'CERTIFICATE UNLOCKED': 'CERTIFICADO DESBLOQUEADO',
  'Unable to load the game. Please refresh.': 'No se pudo cargar el juego. Actualiza la página.',
  'Pause the game': 'Pausar el juego', 'Close journal': 'Cerrar diario',
  'EQUIP SUIT & START EVA': 'PONERSE EL TRAJE E INICIAR EVA', 'REPAIR SUIT': 'REPARAR TRAJE', 'CLEAN DUST': 'LIMPIAR POLVO',
  'O2 SUPPLY': 'SUMINISTRO DE O₂', 'THERMAL SHIELD': 'PROTECCIÓN TÉRMICA', 'CO2 SCRUBBER': 'FILTRO DE CO₂',
  PERCHLORATES: 'PERCLORATOS', 'SUIT INTEGRITY': 'INTEGRIDAD DEL TRAJE', 'DOCKED': 'ACOPLADO', CHARGED: 'CARGADO', READY: 'LISTO', CLEAN: 'LIMPIO',
  'Rotate your device to landscape': 'Gira el dispositivo a horizontal',
};

const TRANSLATIONS: Record<Language, Readonly<Record<string, string>>> = {
  en: {}, 'pt-BR': PT_BR, es: ES,
};

function stationSubject(station: string, language: Language, sentenceStart = false): string {
  const name = translate(station, language);
  const subject = language === 'pt-BR'
    ? `${station === 'greenhouse' ? 'a' : 'o'} ${name}`
    : `el ${name}`;
  return sentenceStart ? subject[0].toUpperCase() + subject.slice(1) : subject;
}

function foodName(food: string, language: Language): string {
  const fromMars = food.startsWith('Mars ');
  const crop = food.replace(/^Mars /, '').toLowerCase();
  const name = crop === 'carrot' ? (language === 'pt-BR' ? 'cenoura' : 'zanahoria') : translate(crop, language);
  return fromMars ? `${name} marciana` : name;
}

function translateUppercaseLabel(label: string, language: Language): string {
  const sentenceCase = ({
    'AIR FROM WATER': 'Air from water',
    'AIR FROM MARS AIR': 'Air from Mars air',
  } as Record<string, string>)[label] ?? label.toLowerCase().replace(/^./, (first) => first.toUpperCase());
  return translate(sentenceCase, language).toUpperCase();
}

const DYNAMIC_PATTERNS: Array<{
  match: RegExp;
  format: (parts: RegExpMatchArray, language: Language) => string;
}> = [
  {
    match: /^(LEAVING THE BASE|FLY NOW|Keep all your window time|The base stays as it is|TIDY THE BASE|Clean panels for the next crew|water|clean panels|planted fields|EVA suit integrity is already at 100%\.|CHARGED 100%|SYSTEMS READY|NO POWER \(\d+%\)|CLEAN|CLOSE OUTER DOOR & PRESSURIZE|\[F\] DOCK EVA SUIT|\[F\] EQUIP SUIT & START EVA|\[F\] EQUIP SUIT \(EMERGENCY EVA\)|\[R\] EMERGENCY PATCH)$/,
    format: ([, source], language) => {
      const copy: Record<string, [string, string]> = {
        'LEAVING THE BASE': ['DEIXANDO A BASE', 'DEJANDO LA BASE'],
        'FLY NOW': ['DECOLAR AGORA', 'DESPEGAR AHORA'],
        'Keep all your window time': ['Manter todo o tempo da janela', 'Conservar todo el tiempo de la ventana'],
        'The base stays as it is': ['A base fica como está', 'La base se queda como está'],
        'TIDY THE BASE': ['ARRUMAR A BASE', 'ORDENAR LA BASE'],
        'Clean panels for the next crew': ['Limpar os painéis para a próxima equipe', 'Limpiar los paneles para la próxima tripulación'],
        water: ['água', 'agua'],
        'clean panels': ['painéis limpos', 'paneles limpios'],
        'planted fields': ['campos plantados', 'cultivos sembrados'],
        'EVA suit integrity is already at 100%.': ['A integridade do traje espacial já está em 100%.', 'La integridad del traje espacial ya está al 100%.'],
        'CHARGED 100%': ['CARREGADO 100%', 'CARGADO 100%'],
        'SYSTEMS READY': ['SISTEMAS PRONTOS', 'SISTEMAS LISTOS'],
        'CLEAN': ['LIMPO', 'LIMPIO'],
        'CLOSE OUTER DOOR & PRESSURIZE': ['FECHE A PORTA EXTERNA E PRESSURIZE', 'CIERRA LA PUERTA EXTERIOR Y PRESURIZA'],
        '[F] DOCK EVA SUIT': ['[F] GUARDAR O TRAJE EVA', '[F] GUARDAR EL TRAJE EVA'],
        '[F] EQUIP SUIT & START EVA': ['[F] VESTIR O TRAJE E INICIAR A EVA', '[F] PONERSE EL TRAJE E INICIAR LA EVA'],
        '[F] EQUIP SUIT (EMERGENCY EVA)': ['[F] VESTIR O TRAJE (EVA DE EMERGÊNCIA)', '[F] PONERSE EL TRAJE (EVA DE EMERGENCIA)'],
        '[R] EMERGENCY PATCH': ['[R] REMENDO DE EMERGÊNCIA', '[R] PARCHE DE EMERGENCIA'],
      };
      return copy[source][language === 'pt-BR' ? 0 : 1];
    },
  },
  {
    match: /^NO POWER \((\d+)%\)$/,
    format: ([, pct], language) => language === 'pt-BR' ? `SEM ENERGIA (${pct}%)` : `SIN ENERGÍA (${pct}%)`,
  },
  {
    match: /^RECHARGING\.\.\. (\d+)% -> 100%$/,
    format: ([, pct], language) => language === 'pt-BR' ? `RECARREGANDO... ${pct}% -> 100%` : `RECARGANDO... ${pct}% -> 100%`,
  },
  {
    match: /^AUTO-CLEANING (\d+)% -> 100%$/,
    format: ([, pct], language) => language === 'pt-BR' ? `LIMPEZA AUTOMÁTICA ${pct}% -> 100%` : `LIMPIEZA AUTOMÁTICA ${pct}% -> 100%`,
  },
  {
    match: /^(\d+)% READY$/,
    format: ([, pct], language) => language === 'pt-BR' ? `${pct}% PRONTO` : `${pct}% LISTO`,
  },
  {
    match: /^(\d+)% \((-?\d+)°C (NIGHT READY|STANDBY)\)$/,
    format: ([, pct, temp, mode], language) => language === 'pt-BR'
      ? `${pct}% (${temp}°C ${mode === 'STANDBY' ? 'EM ESPERA' : 'PRONTO PARA A NOITE'})`
      : `${pct}% (${temp}°C ${mode === 'STANDBY' ? 'EN ESPERA' : 'LISTO PARA LA NOCHE'})`,
  },
  {
    match: /^(\d+)% \(LOW THERMAL\)$/,
    format: ([, pct], language) => language === 'pt-BR' ? `${pct}% (POUCO CALOR)` : `${pct}% (POCO CALOR)`,
  },
  {
    match: /^DUSTY \((\d+)%\)$/,
    format: ([, pct], language) => language === 'pt-BR' ? `EMPOEIRADO (${pct}%)` : `CON POLVO (${pct}%)`,
  },
  {
    match: /^(CHARGING O2|CHARGING THERMAL|CLEANING CO2) \((\d+)% \/ (\d+)%\)$/,
    format: ([, kind, current, target], language) => {
      const labels: Record<string, [string, string]> = {
        'CHARGING O2': ['CARREGANDO O₂', 'CARGANDO O₂'],
        'CHARGING THERMAL': ['AQUECENDO', 'CALENTANDO'],
        'CLEANING CO2': ['LIMPANDO CO₂', 'LIMPIANDO CO₂'],
      };
      const label = labels[kind][language === 'pt-BR' ? 0 : 1];
      return `${label} (${current}% / ${target}%)`;
    },
  },
  {
    match: /^Water tank: (\d+) of (\d+) L$/,
    format: ([, current, total], language) => language === 'pt-BR'
      ? `Tanque de água: ${current} de ${total} L`
      : `Depósito de agua: ${current} de ${total} L`,
  },
  {
    match: /^Dust on solar panels: (\d+)%$/,
    format: ([, pct], language) => language === 'pt-BR'
      ? `Poeira nos painéis solares: ${pct}%`
      : `Polvo en los paneles solares: ${pct}%`,
  },
  {
    match: /^Fields planted: (\d+) of (\d+)$/,
    format: ([, planted, total], language) => language === 'pt-BR'
      ? `Campos plantados: ${planted} de ${total}`
      : `Campos sembrados: ${planted} de ${total}`,
  },
  {
    match: /^(\d+) h less launch window$/,
    format: ([, hours], language) => language === 'pt-BR'
      ? `${hours} h a menos na janela de lançamento`
      : `${hours} h menos de ventana de lanzamiento`,
  },
  {
    match: /^Base ready for the next crew: (water, panels and fields|\d+ of \d+ \(missing: .+\))$/,
    format: ([, status], language) => {
      if (status === 'water, panels and fields') {
        return language === 'pt-BR'
          ? 'Base pronta para a próxima equipe: água, painéis e campos'
          : 'Base lista para la próxima tripulación: agua, paneles y cultivos';
      }
      const match = status.match(/^(\d+) of (\d+) \(missing: (.+)\)$/)!;
      const names = match[3].split(', ').map((name) => translate(name, language)).join(', ');
      return language === 'pt-BR'
        ? `Base pronta para a próxima equipe: ${match[1]} de ${match[2]} (faltam: ${names})`
        : `Base lista para la próxima tripulación: ${match[1]} de ${match[2]} (faltan: ${names})`;
    },
  },
  {
    match: /^Real: crews hand the Space Station to the next crew\. People have lived there non-stop since 2000 \(NASA\)$/,
    format: (_parts, language) => language === 'pt-BR'
      ? 'Fato real: equipes passam a Estação Espacial para a próxima tripulação. Pessoas vivem lá sem parar desde 2000 (NASA).'
      : 'Dato real: las tripulaciones entregan la Estación Espacial a la siguiente. Hay personas viviendo allí sin interrupción desde 2000 (NASA).',
  },
  {
    match: /^EVA suit seals & armor repaired to 100% \(-([\d.]+)% power\)\.$/,
    format: ([, cost], language) => language === 'pt-BR'
      ? `Vedação e blindagem do traje espacial reparadas até 100% (-${cost}% de energia).`
      : `Sellos y blindaje del traje espacial reparados al 100% (-${cost}% de energía).`,
  },
  {
    match: /^Low power: applied emergency patch \((\d+)% integrity\)\. Restore power for full repair\.$/,
    format: ([, integrity], language) => language === 'pt-BR'
      ? `Pouca energia: remendo de emergência aplicado (${integrity}% de integridade). Recupere a energia para reparar por completo.`
      : `Poca energía: se aplicó un parche de emergencia (${integrity}% de integridad). Recupera la energía para repararlo por completo.`,
  },
  {
    match: /^Need (\d+)% base power for full suit repair\.$/,
    format: ([, cost], language) => language === 'pt-BR'
      ? `É necessária uma carga de ${cost}% na base para reparar o traje por completo.`
      : `Se necesita un ${cost}% de energía en la base para reparar el traje por completo.`,
  },
  {
    match: /^Real fact: astronauts on the Space Shuttle and the Space Station slept only about ([\d.]+) hours a night, even with ([\d.]+) hours planned for sleep\. Tired people make more mistakes\. \(Study of 85 astronauts, Barger et al\., 2014\)$/,
    format: ([, slept, planned], language) => language === 'pt-BR'
      ? `Fato real: astronautas do ônibus espacial e da Estação Espacial dormiam apenas cerca de ${slept} horas por noite, mesmo com ${planned} horas reservadas para dormir. Pessoas cansadas cometem mais erros. (Estudo com 85 astronautas, Barger et al., 2014)`
      : `Dato real: los astronautas del transbordador espacial y de la Estación Espacial dormían solo unas ${slept} horas por noche, aunque tenían ${planned} horas reservadas para dormir. Las personas cansadas cometen más errores. (Estudio de 85 astronautas, Barger et al., 2014)`,
  },
  {
    match: /^(.+): NASA study$/,
    format: ([, id], language) => language === 'pt-BR' ? `${id}: estudo da NASA` : `${id}: estudio de la NASA`,
  },
  {
    match: /^Astronaut rank: (.+)\. (.+)$/,
    format: ([, rank, hint], language) => language === 'pt-BR'
      ? `Patente de astronauta: ${translate(rank, language)}. ${translate(hint, language)}`
      : `Rango de astronauta: ${translate(rank, language)}. ${translate(hint, language)}`,
  },
  {
    match: /^(.+) more finds to (.+)$/,
    format: ([, count, rank], language) => language === 'pt-BR'
      ? `Mais ${count} descobertas para ${translate(rank, language)}`
      : `${count} hallazgos más para ${translate(rank, language)}`,
  },
  {
    match: /^\+(\d+) points$/,
    format: ([, points], language) => language === 'pt-BR' ? `+${points} pontos` : `+${points} puntos`,
  },
  {
    match: /^(-?\d+) °C to (-?\d+) °C \(InSight\)$/,
    format: ([, low, high], language) => language === 'pt-BR'
      ? `De ${low} °C a ${high} °C (InSight)`
      : `De ${low} °C a ${high} °C (InSight)`,
  },
  {
    match: /^About (-?\d+) °C \(InSight\)$/,
    format: ([, temp], language) => language === 'pt-BR'
      ? `Cerca de ${temp} °C (InSight)`
      : `Unos ${temp} °C (InSight)`,
  },
  {
    match: /^~([\d.]+)% of Earth \((?:~([\d.]+) Pa, )?InSight\)$/,
    format: ([, percent, pascals], language) => language === 'pt-BR'
      ? `Cerca de ${percent.replace('.', ',')}% da pressão atmosférica da Terra${pascals ? ` (cerca de ${pascals} Pa, InSight)` : ' (InSight)'}`
      : `Un ${percent.replace('.', ',')}% de la presión atmosférica terrestre${pascals ? ` (unos ${pascals} Pa, InSight)` : ' (InSight)'}`,
  },
  {
    match: /^(.+) finds left$/,
    format: ([, count], language) => language === 'pt-BR'
      ? `Faltam ${count} descobertas`
      : `Faltan ${count} hallazgos`,
  },
  {
    match: /^(.+), new find$/,
    format: ([, label], language) => language === 'pt-BR'
      ? `${translate(label, language)}, nova descoberta`
      : `${translate(label, language)}, nuevo hallazgo`,
  },
  {
    match: /^Press F: collect (.+) \(\+(\d+) science in the lab\)$/,
    format: ([, sample, points], language) => language === 'pt-BR'
      ? `Aperte F: coletar ${translate(sample, language)} (+${points} pontos de ciência no laboratório)`
      : `Pulsa F: recoger ${translate(sample, language)} (+${points} puntos de ciencia en el laboratorio)`,
  },
  {
    match: /^WATER WALL: (.+) \/ (.+) L$/,
    format: ([, amount, capacity], language) => language === 'pt-BR'
      ? `PAREDE DE ÁGUA: ${amount} / ${capacity} L`
      : `PARED DE AGUA: ${amount} / ${capacity} L`,
  },
  {
    match: /^BLOCKS: (.+)% of storm radiation inside this booth$/,
    format: ([, percent], language) => language === 'pt-BR'
      ? `BLOQUEIA ${percent}% da radiação da tempestade neste abrigo`
      : `BLOQUEA el ${percent}% de la radiación de la tormenta en este refugio`,
  },
  {
    match: /^BASE WATER TANK: (.+) \/ (.+) L$/,
    format: ([, amount, capacity], language) => language === 'pt-BR'
      ? `TANQUE DE ÁGUA DA BASE: ${amount} / ${capacity} L`
      : `DEPÓSITO DE AGUA DE LA BASE: ${amount} / ${capacity} L`,
  },
  {
    match: /^SOLAR STORM: (.+)$/,
    format: ([, status], language) => language === 'pt-BR'
      ? `TEMPESTADE SOLAR: ${status === 'ACTIVE, stay in here!' ? 'ATIVA, fique aqui!' : translate(status, language)}`
      : `TORMENTA SOLAR: ${status === 'ACTIVE, stay in here!' ? 'ACTIVA, quédate aquí' : translate(status, language)}`,
  },
  {
    match: /^Collected: (.*) \| Harvests: (\d+)$/,
    format: ([, crops, harvests], language) => {
      const localizedCrops = crops.split(', ').map((crop) => translate(crop, language)).join(', ');
      return language === 'pt-BR'
        ? `Coletado: ${localizedCrops} | Colheitas: ${harvests}`
        : `Recogido: ${localizedCrops} | Cosechas: ${harvests}`;
    },
  },
  {
    match: /^([A-Z]+) \| (.+) L water \/ (.+)% power \/ (.+)s \/ \+(.+) food$/,
    format: ([, crop, water, power, seconds, food], language) => language === 'pt-BR'
      ? `${translate(crop.toLowerCase(), language).toUpperCase()} | ${water} L de água / ${power}% de energia / ${seconds}s / +${food} de alimento`
      : `${translate(crop.toLowerCase(), language).toUpperCase()} | ${water} L de agua / ${power}% de energía / ${seconds}s / +${food} de comida`,
  },
  {
    match: /^Awake (.+) h \(tired\)$/,
    format: ([, hours], language) => language === 'pt-BR'
      ? `Acordado há ${hours} h (cansado)`
      : `Despierto hace ${hours} h (con sueño)`,
  },
  {
    match: /^Base tank: (.+) L\.$/,
    format: ([, liters], language) => language === 'pt-BR'
      ? `Tanque da base: ${liters} L.`
      : `Depósito de la base: ${liters} L.`,
  },
  {
    match: /^Battery set to (.+)%\.$/,
    format: ([, percent], language) => language === 'pt-BR'
      ? `Bateria ajustada para ${percent}%.`
      : `Batería ajustada al ${percent}%.`,
  },
  {
    match: /^Battery (\d+)%$/,
    format: ([, percent], language) => language === 'pt-BR'
      ? `Bateria ${percent}%`
      : `Batería ${percent}%`,
  },
  {
    match: /^Base tank \+(\d+) L$/,
    format: ([, liters], language) => language === 'pt-BR'
      ? `Tanque da base +${liters} L`
      : `Depósito de la base +${liters} L`,
  },
  {
    match: /^Storm phase is now: (.+)$/,
    format: ([, phase], language) => language === 'pt-BR'
      ? `Etapa da tempestade: ${phase === 'WARNING' ? 'AVISO' : phase === 'ACTIVE' ? 'ATIVA' : 'ENCERRADA'}`
      : `Fase de la tormenta: ${phase === 'WARNING' ? 'AVISO' : phase === 'ACTIVE' ? 'ACTIVA' : 'TERMINADA'}`,
  },
  {
    match: /^Dust weather is now: (.+)$/,
    format: ([, phase], language) => language === 'pt-BR'
      ? `Clima de poeira: ${phase === 'WARNING' ? 'AVISO' : phase === 'STORM' ? 'TEMPESTADE' : 'LIMPO'}`
      : `Clima de polvo: ${phase === 'WARNING' ? 'AVISO' : phase === 'STORM' ? 'TORMENTA' : 'DESPEJADO'}`,
  },
  {
    match: /^Crew stations (\d+)%$/,
    format: ([, percent], language) => language === 'pt-BR'
      ? `Estações da equipe ${percent}%`
      : `Estaciones de la tripulación ${percent}%`,
  },
  {
    match: /^(Re-scanning|Scanning) (.+)\.\.\. (\d+)%$/,
    format: ([, rescanning, category, percent], language) => language === 'pt-BR'
      ? `Escaneando ${translate(category, language)}${rescanning === 'Re-scanning' ? ' de novo' : ''}... ${percent}%`
      : `Escaneando ${translate(category, language)}${rescanning === 'Re-scanning' ? ' otra vez' : ''}... ${percent}%`,
  },
  {
    match: /^NEW (\d+)\/(\d+)$/,
    format: ([, found, total], language) => language === 'pt-BR'
      ? `NOVO ${found}/${total}`
      : `NUEVO ${found}/${total}`,
  },
  {
    match: /^Sleep until sunrise \((.+)\)$/,
    format: ([, details], language) => {
      const costs = details.match(/^(.+): food -(.+), water -(.+)$/);
      if (!costs) return language === 'pt-BR' ? `Dormir até o nascer do Sol (${details})` : `Dormir hasta el amanecer (${details})`;
      return language === 'pt-BR'
        ? `Dormir até o nascer do Sol (${costs[1]}: comida −${costs[2]}, água −${costs[3]})`
        : `Dormir hasta el amanecer (${costs[1]}: comida −${costs[2]}, agua −${costs[3]})`;
    },
  },
  {
    match: /^Nap \((.+)\)$/,
    format: ([, details], language) => {
      const costs = details.match(/^(.+): food -(.+), water -(.+)$/);
      if (!costs) return language === 'pt-BR' ? `Cochilo (${details})` : `Siesta (${details})`;
      return language === 'pt-BR'
        ? `Cochilo (${costs[1]}: comida −${costs[2]}, água −${costs[3]})`
        : `Siesta (${costs[1]}: comida −${costs[2]}, agua −${costs[3]})`;
    },
  },
  {
    match: /^Real data from (.+)$/,
    format: ([, date], language) => language === 'pt-BR' ? `Dados reais de ${date}` : `Datos reales del ${date}`,
  },
  {
    match: /^\), measured from orbit by HiRISE, a camera on NASA's Mars Reconnaissance Orbiter\. One block is about 1 meter\. Real data from (.+)$/,
    format: ([, date], language) => language === 'pt-BR'
      ? `), medida em órbita pela HiRISE, uma câmera da sonda Mars Reconnaissance Orbiter da NASA. Cada bloco tem cerca de 1 metro. Dados reais de ${date}`
      : `), medida desde la órbita por HiRISE, una cámara de la sonda Mars Reconnaissance Orbiter de la NASA. Cada bloque mide cerca de 1 metro. Datos reales del ${date}`,
  },
  {
    match: /^real data from (.+)$/,
    format: ([, date], language) => language === 'pt-BR' ? `dados reais de ${date}` : `datos reales del ${date}`,
  },
  {
    match: /^NASA DONKI, real data from (.+)$/,
    format: ([, date], language) => language === 'pt-BR'
      ? `NASA DONKI, dados reais de ${date}`
      : `NASA DONKI, datos reales del ${date}`,
  },
  {
    match: /^NASA DONKI, LIVE from NASA DONKI, fetched (.+)$/,
    format: ([, time], language) => language === 'pt-BR'
      ? `NASA DONKI, AO VIVO, consultado às ${time}`
      : `NASA DONKI, EN VIVO, consultado a las ${time}`,
  },
  {
    match: /^Distance calculated for (.+) from NASA\/JPL planet orbits$/,
    format: ([, date], language) => language === 'pt-BR'
      ? `Distância calculada para ${date} com base nas órbitas dos planetas da NASA/JPL`
      : `Distancia calculada para ${date} según las órbitas planetarias de NASA/JPL`,
  },
  {
    match: /^Real radio trip: (.+) min there and back$/,
    format: ([, minutes], language) => language === 'pt-BR'
      ? `Tempo real do sinal de rádio: ${minutes} min para ir e voltar`
      : `Tiempo real de ida y vuelta de la señal de radio: ${minutes} min`,
  },
  {
    match: /^This message left Earth (.+) min before you read it$/,
    format: ([, minutes], language) => language === 'pt-BR'
      ? `Esta mensagem saiu da Terra ${minutes} min antes de você lê-la`
      : `Este mensaje salió de la Tierra ${minutes} min antes de que lo leyeras`,
  },
  {
    match: /^Earth got your science: (.+) points$/,
    format: ([, points], language) => language === 'pt-BR'
      ? `A Terra recebeu suas descobertas: ${points} pontos`
      : `La Tierra recibió tus descubrimientos: ${points} puntos`,
  },
  {
    match: /^Your (\d+) clues say: (.+)$/,
    format: ([, count, answer], language) => language === 'pt-BR'
      ? `Suas ${count} pistas indicam: ${translate(answer, language)}`
      : `Tus ${count} pistas indican: ${translate(answer, language)}`,
  },
  {
    match: /^Touchdown! You are (.+) million km from home\.$/,
    format: ([, distance], language) => language === 'pt-BR'
      ? `Pouso! Você está a ${distance} milhões de km de casa.`
      : `¡Aterrizaje! Estás a ${distance} millones de km de casa.`,
  },
  {
    match: /^(.+) brings (.+) from the greenhouse\.$/,
    format: ([, name, crop], language) => language === 'pt-BR'
      ? `${name} trouxe ${translate(crop, language)} da estufa.`
      : `${name} trae ${translate(crop, language)} del invernadero.`,
  },
  {
    match: /^Talk to (.+) here to grab one\.$/,
    format: ([, name], language) => language === 'pt-BR'
      ? `Fale com ${name} aqui para pegar uma.`
      : `Habla con ${name} aquí para recoger una.`,
  },
  {
    match: /^FIND CLUE: (.+)$/,
    format: ([, clue], language) => language === 'pt-BR'
      ? `ENCONTRE A PISTA: ${translate(clue, language)}`
      : `ENCUENTRA LA PISTA: ${translate(clue, language)}`,
  },
  {
    match: /^FIND (\d+) SCIENCE (POINT|POINTS)$/,
    format: ([, count], language) => language === 'pt-BR'
      ? `ENCONTRE ${count} ${count === '1' ? 'PONTO CIENTÍFICO' : 'PONTOS CIENTÍFICOS'}`
      : `ENCUENTRA ${count} ${count === '1' ? 'PUNTO CIENTÍFICO' : 'PUNTOS CIENTÍFICOS'}`,
  },
  {
    match: /^(?:ACT (\d+) - )?STEP (\d+)\/(\d+): (.+)$/,
    format: ([, act, step, total, label], language) => language === 'pt-BR'
      ? `${act ? `ATO ${act} - ` : ''}ETAPA ${step}/${total}: ${translate(label, language)}`
      : `${act ? `ACTO ${act} - ` : ''}PASO ${step}/${total}: ${translate(label, language)}`,
  },
  {
    match: /^STEP (\d+)\/(\d+)$/,
    format: ([, step, total], language) => language === 'pt-BR' ? `ETAPA ${step}/${total}` : `PASO ${step}/${total}`,
  },
  {
    match: /^FIRST: (.+)$/,
    format: ([, label], language) => language === 'pt-BR'
      ? `PRIMEIRO: ${translate(label, language)}`
      : `PRIMERO: ${translate(label, language)}`,
  },
  {
    match: /^(\d+) (discovery|discoveries|sample|samples)(?: and (\d+) (discovery|discoveries|sample|samples))?$/,
    format: ([, firstCount, firstThing, secondCount, secondThing], language) => {
      const item = (count: string, thing: string): string => {
        if (thing.startsWith('discover')) {
          return language === 'pt-BR'
            ? `${count} ${count === '1' ? 'descoberta' : 'descobertas'}`
            : `${count} ${count === '1' ? 'hallazgo' : 'hallazgos'}`;
        }
        return language === 'pt-BR' ? `${count} ${count === '1' ? 'amostra' : 'amostras'}` : `${count} ${count === '1' ? 'muestra' : 'muestras'}`;
      };
      return [item(firstCount, firstThing), secondCount ? item(secondCount, secondThing) : ''].filter(Boolean).join(language === 'pt-BR' ? ' e ' : ' y ');
    },
  },
  {
    match: /^Sol (\d+) report$/,
    format: ([, sol], language) => language === 'pt-BR' ? `Relatório do sol ${sol}` : `Informe del sol ${sol}`,
  },
  {
    match: /^You put water in the shelter wall: now (.+) L\. Less water to drink, more protection\.$/,
    format: ([, liters], language) => language === 'pt-BR'
      ? `Você colocou água na parede do abrigo: agora há ${liters} L. Menos água para beber, mais proteção.`
      : `Pusiste agua en la pared del refugio: ahora hay ${liters} L. Menos agua para beber, más protección.`,
  },
  {
    match: /^You took water out of the shelter wall: now (.+) L\. More water to drink, less protection\.$/,
    format: ([, liters], language) => language === 'pt-BR'
      ? `Você tirou água da parede do abrigo: agora há ${liters} L. Mais água para beber, menos proteção.`
      : `Sacaste agua de la pared del refugio: ahora hay ${liters} L. Más agua para beber, menos protección.`,
  },
  {
    match: /^You planted (.+)\. It drinks water from the tank while it grows\.$/,
    format: ([, crop], language) => language === 'pt-BR'
      ? `Você plantou ${translate(crop, language)}. A planta consome água do tanque enquanto cresce.`
      : `Plantaste ${translate(crop, language)}. La planta consume agua del tanque mientras crece.`,
  },
  {
    match: /^You finished a workout on the (.+)\. It cost power, but kept your (.+) strong\.$/,
    format: ([, machine, body], language) => language === 'pt-BR'
      ? `Você treinou na ${translate(machine, language)}. O treino gastou energia, mas fortaleceu seus ${translate(body, language)}.`
      : `Terminaste un ejercicio en la ${translate(machine, language)}. Consumió energía, pero fortaleció tus ${translate(body, language)}.`,
  },
  {
    match: /^You made it through the solar storm\.(?: It gave you (.+)\.)?$/,
    format: ([, dose], language) => language === 'pt-BR'
      ? `Você sobreviveu à tempestade solar.${dose ? ` Sua dose foi ${dose}.` : ''}`
      : `Sobreviviste a la tormenta solar.${dose ? ` Tu dosis fue ${dose}.` : ''}`,
  },
  {
    match: /^You made it through the storm with (\d+) L in the shelter wall\.(?: It gave you (.+)\.)?$/,
    format: ([, liters, dose], language) => language === 'pt-BR'
      ? `Você sobreviveu à tempestade com ${liters} L na parede do abrigo.${dose ? ` Sua dose foi ${dose}.` : ''}`
      : `Sobreviviste a la tormenta con ${liters} L en la pared del refugio.${dose ? ` Tu dosis fue ${dose}.` : ''}`,
  },
  {
    match: /^(.+) is weak: missing (.+)\.$/,
    format: ([, name, resources], language) => {
      const translated = resources.split(' and ').map((resource) => translate(resource, language)).join(language === 'pt-BR' ? ' e ' : ' y ');
      return language === 'pt-BR' ? `${name} está fraco: faltam ${translated}.` : `${name} está débil: le faltan ${translated}.`;
    },
  },
  {
    match: /^(.+) had to rest in the medbay\.$/,
    format: ([, name], language) => language === 'pt-BR' ? `${name} precisou descansar na enfermaria.` : `${name} tuvo que descansar en la enfermería.`,
  },
  {
    match: /^(.+) feels better and is back to work\.$/,
    format: ([, name], language) => language === 'pt-BR' ? `${name} está melhor e voltou ao trabalho.` : `${name} se siente mejor y volvió al trabajo.`,
  },
  {
    match: /^Test pulse: your (.+) L wall blocks (.+)% of it$/,
    format: ([, liters, percent], language) => language === 'pt-BR'
      ? `Pulso de teste: sua parede de ${liters} L bloqueia ${percent}% dele`
      : `Pulso de prueba: tu pared de ${liters} L bloquea el ${percent}%`,
  },
  {
    match: /^NASA's model said it would reach Mars on (.+)$/,
    format: ([, date], language) => language === 'pt-BR'
      ? `O modelo da NASA previu que chegaria a Marte em ${date}`
      : `El modelo de la NASA indicó que llegaría a Marte el ${date}`,
  },
  {
    match: /^(Based on|Happening right now in real life:?) a real CME that left the Sun on (.+) at (.+) km\/s, headed to Mars \((.+?)\)(\.)?$/,
    format: ([, basis, date, speed, source, period], language) => language === 'pt-BR'
      ? `${basis.startsWith('Based on') ? 'Com base em' : 'Acontecendo agora na vida real:'} uma EMC real que saiu do Sol em ${date} a ${speed} km/s, a caminho de Marte (${translate(source, language)})${period ?? ''}`
      : `${basis.startsWith('Based on') ? 'Basado en' : 'Ocurriendo ahora en la vida real:'} una EMC real que salió del Sol el ${date} a ${speed} km/s, rumbo a Marte (${translate(source, language)})${period ?? ''}`,
  },
  {
    match: /^(Based on|Happening right now in real life:?) a real burst of fast particles \(an SEP\) seen on (.+) by (.+) \((.+?)\)(\.)?$/,
    format: ([, basis, date, spacecraft, source, period], language) => language === 'pt-BR'
      ? `${basis.startsWith('Based on') ? 'Com base em' : 'Acontecendo agora na vida real:'} um surto real de partículas rápidas (SEP), observado em ${date} pela ${spacecraft} (${translate(source, language)})${period ?? ''}`
      : `${basis.startsWith('Based on') ? 'Basado en' : 'Ocurriendo ahora en la vida real:'} un estallido real de partículas rápidas (SEP), observado el ${date} por ${spacecraft} (${translate(source, language)})${period ?? ''}`,
  },
  {
    match: /^SOLAR STORM: ACTIVE, (.+) left\.\n(.+)$/,
    format: ([, time, source], language) => language === 'pt-BR'
      ? `TEMPESTADE SOLAR: ATIVA, restam ${time}.\n${translate(source, language)}`
      : `TORMENTA SOLAR: ACTIVA, quedan ${time}.\n${translate(source, language)}`,
  },
  {
    match: /^SOLAR STORM: on the way, reaches Mars in (.+) of game time\.\n(.+)\. (.+)\.$/,
    format: ([, time, arrival, source], language) => language === 'pt-BR'
      ? `TEMPESTADE SOLAR: a caminho, chega a Marte em ${time} de tempo de jogo.\n${translate(arrival, language)}. ${translate(source, language)}${source.endsWith('.') ? '' : '.'}`
      : `TORMENTA SOLAR: en camino, llega a Marte en ${time} de tiempo de juego.\n${translate(arrival, language)}. ${translate(source, language)}${source.endsWith('.') ? '' : '.'}`,
  },
  {
    match: /^RADIATION ALERT! The Sun shot out super fast particles \(an SEP, solar energetic particles\)\. Fast particles fly almost as fast as light, so the warning is very short: they hit in (.+)\. Hide in the storm shelter now! (.+)\.$/,
    format: ([, time, source], language) => language === 'pt-BR'
      ? `ALERTA DE RADIAÇÃO! O Sol lançou partículas muito rápidas (um SEP, partículas energéticas solares). ${translate('Fast particles fly almost as fast as light, so the warning is very short', language)}: elas chegam em ${time}. Esconda-se no abrigo contra tempestades agora! ${translate(source, language)}.`
      : `¡ALERTA DE RADIACIÓN! El Sol lanzó partículas muy rápidas (un SEP, partículas energéticas solares). ${translate('Fast particles fly almost as fast as light, so the warning is very short', language)}: llegan en ${time}. ¡Refúgiate ahora! ${translate(source, language)}.`,
  },
  {
    match: /^Solar storm coming! The Sun threw out a giant cloud of particles \(a CME\)\. NASA's model said it would reach Mars on (.+): in the game that is (.+) from now\. (.+)\.$/,
    format: ([, date, time, source], language) => language === 'pt-BR'
      ? `Tempestade solar a caminho! O Sol lançou uma grande nuvem de partículas (uma EMC). ${translate(`NASA's model said it would reach Mars on ${date}`, language)}: no jogo, isso será daqui a ${time}. ${translate(source, language)}.`
      : `¡Se acerca una tormenta solar! El Sol lanzó una gran nube de partículas (una EMC). ${translate(`NASA's model said it would reach Mars on ${date}`, language)}: en el juego, llegará dentro de ${time}. ${translate(source, language)}.`,
  },
  {
    match: /^Sunset soon: the solar panels stop at 18:00\. Battery at (.+)%\. Charge it before night, and turn off the fuel factory if it is low\.$/,
    format: ([, percent], language) => language === 'pt-BR'
      ? `Pôr do Sol em breve: os painéis param às 18:00. Bateria em ${percent}%. Carregue-a antes da noite e desligue a fábrica de combustível se estiver baixa.`
      : `Pronto será de noche: los paneles se detienen a las 18:00. Batería al ${percent}%. Cárgala antes de que anochezca y apaga la fábrica de combustible si está baja.`,
  },
  {
    match: /^LIVE from NASA DONKI, fetched (.+)$/,
    format: ([, time], language) => language === 'pt-BR'
      ? `AO VIVO da NASA DONKI, consultado às ${time}`
      : `EN VIVO desde NASA DONKI, consultado a las ${time}`,
  },
  {
    match: /^POWER (\d+)%$/,
    format: ([, value], language) => language === 'pt-BR' ? `ENERGIA ${value}%` : `ENERGÍA ${value}%`,
  },
  {
    match: /^Speed: (.+) km\/h$/,
    format: ([, value], language) => language === 'pt-BR' ? `Velocidade: ${value} km/h` : `Velocidad: ${value} km/h`,
  },
  {
    match: /^Heading: (.+)$/,
    format: ([, value], language) => language === 'pt-BR' ? `Direção: ${value}` : `Rumbo: ${value}`,
  },
  {
    match: /^Ice cargo: (.+)$/,
    format: ([, value], language) => language === 'pt-BR' ? `Carga de gelo: ${value}` : `Carga de hielo: ${value}`,
  },
  {
    match: /^ICE (.+) blocks$/,
    format: ([, value], language) => language === 'pt-BR' ? `GELO ${value} blocos` : `HIELO ${value} bloques`,
  },
  {
    match: /^Battery: (.+)$/,
    format: ([, value], language) => language === 'pt-BR' ? `Bateria: ${value}` : `Batería: ${value}`,
  },
  {
    match: /^CHARGED (.+)$/,
    format: ([, value], language) => language === 'pt-BR' ? `CARREGADO ${value}` : `CARGADO ${value}`,
  },
  {
    match: /^(\d+)% \((-?\d+)°C NIGHT READY\)$/,
    format: ([, charge, temp], language) => language === 'pt-BR'
      ? `${charge}% (${temp}°C PRONTO PARA A NOITE)`
      : `${charge}% (${temp}°C LISTO PARA LA NOCHE)`,
  },
  {
    match: /^(\d+)% READY$/,
    format: ([, charge], language) => language === 'pt-BR' ? `${charge}% PRONTO` : `${charge}% LISTO`,
  },
  {
    match: /^(\d+)% \((\d+)% WEAR\)$/,
    format: ([, integrity, wear], language) => language === 'pt-BR'
      ? `${integrity}% (${wear}% DE DESGASTE)`
      : `${integrity}% (${wear}% DE DESGASTE)`,
  },
  {
    match: /^Extra tubes make the rocket heavier \(\+(\d+) ice each\)\.$/,
    format: ([, ice], language) => language === 'pt-BR'
      ? `Cada tubo extra deixa o foguete mais pesado (+${ice} bloco de gelo).`
      : `Cada tubo extra hace que el cohete pese más (+${ice} bloque de hielo).`,
  },
  {
    match: /^\+(\d+) more messages$/,
    format: ([, value], language) => language === 'pt-BR' ? `+${value} mensagens a mais` : `+${value} mensajes más`,
  },
  {
    // Boletim: ciencia gasta nas melhorias do laboratorio x traje melhorado (#417)
    match: /^Lab upgrades used (\d+) science pts\. Suit: (\d+)% less radiation outside$/,
    format: ([, points, cut], language) => language === 'pt-BR'
      ? `Melhorias do laboratório gastaram ${points} pts de ciência. Traje: ${cut}% menos radiação lá fora`
      : `Las mejoras del laboratorio gastaron ${points} pts de ciencia. Traje: ${cut}% menos radiación afuera`,
  },
  {
    match: /^Lab upgrades used (\d+) science pts\. No suit upgrade$/,
    format: ([, points], language) => language === 'pt-BR'
      ? `Melhorias do laboratório gastaram ${points} pts de ciência. Traje sem melhoria`
      : `Las mejoras del laboratorio gastaron ${points} pts de ciencia. Traje sin mejora`,
  },
  {
    // Dica do [F] na tela: HudManager.setInteractionPrompt troca "[F] " por "Press F: ". Usa a
    // traducao da chave com [F] (ou a do texto sozinho) para a dica nao ficar em ingles.
    match: /^Press F: (.+)$/,
    format: ([, action], language) => {
      const keyed = translate(`[F] ${action}`, language);
      const text = keyed === `[F] ${action}` ? translate(action, language) : keyed.replace(/^\[F\]\s*/, '');
      return `${language === 'pt-BR' ? 'Aperte F' : 'Pulsa F'}: ${text}`;
    },
  },
  {
    // Primeiro gelo no tanque (#413): o numero cai quando o tanque esta quase cheio
    match: /^Ice in the base tank: \+(\d+) L of water\. The rocket still needs this block\.$/,
    format: ([, liters], language) => language === 'pt-BR'
      ? `Gelo no tanque da base: +${liters} L de água. O foguete ainda precisa deste bloco.`
      : `Hielo en el tanque de la base: +${liters} L de agua. El cohete aún necesita este bloque.`,
  },
  {
    match: /^Total radiation: (.+) mSv$/,
    format: ([, value], language) => language === 'pt-BR' ? `Radiação total: ${value} mSv` : `Radiación total: ${value} mSv`,
  },
  {
    match: /^Impact! A new crater (\d+) blocks (north|northeast|east|southeast|south|southwest|west|northwest) of the base has (\d+) ice blocks showing\. The ice sensor marks them in blue\.$/,
    format: ([, distance, direction, ice], language) => language === 'pt-BR'
      ? `Impacto! Uma nova cratera a ${distance} blocos a ${translate(direction, language)} da base revelou ${ice} blocos de gelo. O sensor os marca em azul.`
      : `¡Impacto! Un cráter nuevo a ${distance} bloques al ${translate(direction, language)} de la base dejó ${ice} bloques de hielo al descubierto. El sensor los marca en azul.`,
  },
  {
    match: /^Impact! A new crater opened (\d+) blocks (north|northeast|east|southeast|south|southwest|west|northwest) of the base\.$/,
    format: ([, distance, direction], language) => language === 'pt-BR'
      ? `Impacto! Uma nova cratera se abriu a ${distance} blocos a ${translate(direction, language)} da base.`
      : `¡Impacto! Se abrió un cráter nuevo a ${distance} bloques al ${translate(direction, language)} de la base.`,
  },
  {
    match: /^Marsquake! The (.+) lost (\d+)% health\. Everyone is safe\.$/,
    format: ([, station, lost], language) => language === 'pt-BR'
      ? `Terremoto em Marte! A estação ${translate(station, language)} perdeu ${lost}% de integridade. Todos estão em segurança.`
      : `¡Terremoto en Marte! La estación ${translate(station, language)} perdió un ${lost}% de integridad. Todos están a salvo.`,
  },
  {
    match: /^The (.+) got damaged$/,
    format: ([, station], language) => language === 'pt-BR'
      ? `Estação danificada: ${translate(station, language)}.`
      : `Estación dañada: ${translate(station, language)}.`,
  },
  {
    match: /^The dust devil swept the solar field: (\d+)% of the panel dust blew away!$/,
    format: ([, percent], language) => language === 'pt-BR'
      ? `O redemoinho de poeira atravessou o campo solar e levou ${percent}% da poeira dos painéis!`
      : `¡El remolino de polvo cruzó el campo solar y se llevó el ${percent}% del polvo de los paneles!`,
  },
  {
    match: /^SCIENCE (\d+) \| SENT (\d+)\/(\d+)$/,
    format: ([, found, sent, goal], language) => language === 'pt-BR'
      ? `CIÊNCIA ${found} | ENVIADOS ${sent}/${goal}`
      : `CIENCIA ${found} | ENVIADOS ${sent}/${goal}`,
  },
  {
    match: /^The dust devil swept (\d+) of your (\d+) solar panels clean! Brush the others yourself\.$/,
    format: ([, cleaned, total], language) => language === 'pt-BR'
      ? `O redemoinho de poeira limpou ${cleaned} dos ${total} painéis solares! Limpe os outros você mesmo.`
      : `¡El remolino de polvo limpió ${cleaned} de tus ${total} paneles solares! Limpia los demás tú mismo.`,
  },
  {
    match: /^RADIATION NOW: (.+) per hour\nDOSE SO FAR: (.+) \(NASA career limit: (.+) mSv\)\n(Dose is how much radiation your body has collected\. It only goes up\.) The trip from Earth already used most of it\.\nMeasured on Mars by the Curiosity rover \(NASA RadLab\)\. GAME SCALE: each game hour adds the dose of about (.+) days on Mars\.$/,
    format: ([, rate, total, limit, explainer, days], language) => language === 'pt-BR'
      ? `RADIAÇÃO AGORA: ${rate} por hora\nDOSE ATÉ AGORA: ${total} (limite da NASA para a carreira: ${limit} mSv)\n${translate(explainer, language)} A viagem da Terra já usou boa parte dela.\nMedido em Marte pelo rover Curiosity (NASA RadLab). ESCALA DO JOGO: cada hora de jogo acrescenta uma dose parecida com a de ${days} dias em Marte.`
      : `RADIACIÓN AHORA: ${rate} por hora\nDOSIS ACUMULADA: ${total} (límite de la NASA durante la carrera: ${limit} mSv)\n${translate(explainer, language)} El viaje desde la Tierra ya consumió gran parte de ella.\nMedido en Marte por el rover Curiosity (NASA RadLab). ESCALA DEL JUEGO: cada hora del juego añade una dosis parecida a la de ${days} días en Marte.`,
  },
  {
    match: /^RADIATION DOSE: (.+) of (.+) \(NASA career limit\)\n(Dose is how much radiation your body has collected\. It only goes up\.)\nWHERE YOUR DOSE CAME FROM:\n  Trip from Earth: (.+)\n  Walks outside: (.+)\n  Solar storms: (.+)\n  Inside the base: (.+)(?:\n  Fission reactor: (.+))?(?:\nFLIGHT DOCTOR: no more walks outside for you\.)?$/,
    format: (parts, language) => {
      const [, total, limit, explainer, transit, eva, storm, habitat, reactor] = parts;
      const labels = language === 'pt-BR'
        ? { head: 'DOSE DE RADIAÇÃO', limit: 'limite da NASA para a carreira', where: 'DE ONDE VEIO SUA DOSE:', trip: '  Viagem da Terra:', eva: '  Saídas da base:', storm: '  Tempestades solares:', habitat: '  Dentro da base:', reactor: '  Reator de fissão:', doctor: 'MÉDICA DA MISSÃO: você não pode mais sair da base.' }
        : { head: 'DOSIS DE RADIACIÓN', limit: 'límite de la NASA durante la carrera', where: 'DE DÓNDE VINO TU DOSIS:', trip: '  Viaje desde la Tierra:', eva: '  Salidas al exterior:', storm: '  Tormentas solares:', habitat: '  Dentro de la base:', reactor: '  Reactor de fisión:', doctor: 'MÉDICA DE VUELO: ya no puedes salir de la base.' };
      const doctorLine = parts[0].includes('FLIGHT DOCTOR:') ? `\n${labels.doctor}` : '';
      return `${labels.head}: ${total} de ${limit} (${labels.limit})\n${translate(explainer, language)}\n${labels.where}\n${labels.trip} ${transit}\n${labels.eva} ${eva}\n${labels.storm} ${storm}\n${labels.habitat} ${habitat}${reactor ? `\n${labels.reactor} ${reactor}` : ''}${doctorLine}`;
    },
  },
  {
    match: /^(.+), (under|over) the NASA limit of (.+)$/,
    format: ([, dose, relation, limit], language) => language === 'pt-BR'
      ? `${dose}, ${relation === 'under' ? 'abaixo do' : 'acima do'} limite da NASA de ${limit}`
      : `${dose}, ${relation === 'under' ? 'por debajo del' : 'por encima del'} límite de la NASA de ${limit}`,
  },
  {
    match: /^Trip (.+), outside (.+), storms (.+), in base (.+?)(?:, reactor (.+))?$/,
    format: ([, trip, outside, storms, base, reactor], language) => language === 'pt-BR'
      ? `Viagem ${trip}, fora ${outside}, tempestades ${storms}, na base ${base}${reactor ? `, reator ${reactor}` : ''}`
      : `Viaje ${trip}, exterior ${outside}, tormentas ${storms}, en la base ${base}${reactor ? `, reactor ${reactor}` : ''}`,
  },
  {
    match: /^(.+) mSv total dose$/,
    format: ([, dose], language) => language === 'pt-BR'
      ? `${dose.replace('.', ',')} mSv de dose total`
      : `${dose.replace('.', ',')} mSv de dosis total`,
  },
  {
    match: /^Bones (.+)%, (\d+) workouts?$/,
    format: ([, percent, workouts], language) => language === 'pt-BR'
      ? `Ossos ${percent}%, ${workouts} ${workouts === '1' ? 'treino' : 'treinos'}`
      : `Huesos ${percent}%, ${workouts} ${workouts === '1' ? 'entrenamiento' : 'entrenamientos'}`,
  },
  {
    match: /^(\d+) harvests, (\d+) of (\d+) crops$/,
    format: ([, harvests, picked, total], language) => language === 'pt-BR'
      ? `${harvests} colheitas, ${picked} de ${total} tipos de planta`
      : `${harvests} cosechas, ${picked} de ${total} tipos de cultivo`,
  },
  {
    match: /^(\d+) ice to fuel, (.+) h on standby$/,
    format: ([, ice, hours], language) => language === 'pt-BR'
      ? `${ice} blocos de gelo para combustível, ${hours.replace('.', ',')} h em espera`
      : `${ice} bloques de hielo para combustible, ${hours.replace('.', ',')} h en espera`,
  },
  {
    match: /^(\d+) scans, (\d+) samples, (\d+) pts sent$/,
    format: ([, scans, samples, points], language) => language === 'pt-BR'
      ? `${scans} escaneamentos, ${samples} amostras, ${points} pontos enviados`
      : `${scans} escaneos, ${samples} muestras, ${points} puntos enviados`,
  },
  {
    match: /^You (.+), but next time (.+)!$/,
    format: ([, strength, tip], language) => language === 'pt-BR'
      ? `Você ${translate(strength, language)}, mas na próxima vez ${translate(tip, language)}!`
      : `${({
        'kept everyone safe from solar storms': 'Mantuviste a todos a salvo de las tormentas solares',
        'kept your bones and muscles strong': 'Mantuviste fuertes tus huesos y músculos',
        'grew lots of fresh food': 'Cultivaste muchos alimentos frescos',
        'kept the power and the rocket fuel going': 'Mantuviste la energía y el combustible del cohete',
        'found lots of new things for Earth': 'Encontraste muchos hallazgos para la Tierra',
      }[strength] ?? translate(strength, language))}, pero la próxima vez ${translate(tip, language)}!`,
  },
  {
    match: /^You found (.+) of (.+) things$/,
    format: ([, found, total], language) => language === 'pt-BR'
      ? `Você encontrou ${found} de ${total} descobertas`
      : `Encontraste ${found} de ${total} hallazgos`,
  },
  {
    match: /^NASA space weather bulletin, (.+): (.+)$/,
    format: ([, day, type], language) => language === 'pt-BR'
      ? `Boletim de clima espacial da NASA, ${day}: ${translate(type, language)}`
      : `Boletín de clima espacial de la NASA, ${day}: ${translate(type, language)}`,
  },
  {
    match: /^DUST STORM IN (.+) MIN$/,
    format: ([, minutes], language) => language === 'pt-BR' ? `TEMPESTADE DE POEIRA EM ${minutes} MIN` : `TORMENTA DE POLVO EN ${minutes} MIN`,
  },
  {
    match: /^DUST STORM: SUN (.+)%$/,
    format: ([, percent], language) => language === 'pt-BR' ? `TEMPESTADE DE POEIRA: SOL ${percent}%` : `TORMENTA DE POLVO: SOL ${percent}%`,
  },
  {
    match: /^Low (.+), high (.+)$/,
    format: ([, low, high], language) => language === 'pt-BR' ? `Mínima ${low}, máxima ${high}` : `Mínima ${low}, máxima ${high}`,
  },
  {
    match: /^Wind gusts (.+) m\/s$/,
    format: ([, speed], language) => language === 'pt-BR' ? `Rajadas de vento ${speed} m/s` : `Ráfagas de viento ${speed} m/s`,
  },
  {
    match: /^Strong wind blew (.+)% of the dust off the panels$/,
    format: ([, percent], language) => language === 'pt-BR' ? `Vento forte removeu ${percent}% da poeira dos painéis` : `El viento fuerte quitó el ${percent}% del polvo de los paneles`,
  },
  {
    match: /^Real data: NASA InSight lander, sol (.+) \((.+)\), Elysium Planitia$/,
    format: ([, sol, date], language) => language === 'pt-BR'
      ? `Dados reais: módulo InSight da NASA, sol ${sol} (${date}), Planície Elysium`
      : `Datos reales: módulo InSight de la NASA, sol ${sol} (${date}), llanura de Elysium`,
  },
  {
    match: /^Dust storm coming! (Mars air is too thin to push you over\. The danger is the dust: it blocks the Sun and covers the solar panels\.)$/,
    format: ([, danger], language) => language === 'pt-BR'
      ? `Tempestade de poeira a caminho! ${translate(danger, language)}`
      : `¡Se acerca una tormenta de polvo! ${translate(danger, language)}`,
  },
  {
    match: /^The solar storm is over\. You made it!(?: (.+))?$/,
    format: ([, after], language) => language === 'pt-BR'
      ? `A tempestade solar terminou. Você conseguiu!${after ? ` ${translate(after, language)}` : ''}`
      : `La tormenta solar terminó. ¡Lo lograste!${after ? ` ${translate(after, language)}` : ''}`,
  },
  {
    match: /^The solar storm is over, but you fainted during it\. Next time, hide before it hits\.(?: (.+))?$/,
    format: ([, after], language) => language === 'pt-BR'
      ? `A tempestade solar terminou, mas você desmaiou. Da próxima vez, esconda-se antes que ela chegue.${after ? ` ${translate(after, language)}` : ''}`
      : `La tormenta solar terminó, pero te desmayaste. La próxima vez, escóndete antes de que llegue.${after ? ` ${translate(after, language)}` : ''}`,
  },
  {
    match: /^A solar storm passed while the game was paused\.(?: (.+))?$/,
    format: ([, after], language) => language === 'pt-BR'
      ? `Uma tempestade solar passou enquanto o jogo estava pausado.${after ? ` ${translate(after, language)}` : ''}`
      : `Pasó una tormenta solar mientras el juego estaba en pausa.${after ? ` ${translate(after, language)}` : ''}`,
  },
  {
    match: /^The radiation shield turned off: the battery is empty\.$/,
    format: (_parts, language) => language === 'pt-BR' ? 'O escudo contra radiação desligou: a bateria está vazia.' : 'El escudo contra la radiación se apagó: la batería está vacía.',
  },
  {
    match: /^The MAV fuel tank is full!$/,
    format: (_parts, language) => language === 'pt-BR' ? 'O tanque de combustível do MAV está cheio!' : '¡El tanque de combustible del MAV está lleno!',
  },
  // Dynamic messages from systems that interpolate game values.
  {
    match: /^Science sent: (\d+) \/ (\d+) points(\.)?$/,
    format: ([, sent, goal, period], language) => language === 'pt-BR'
      ? `Ciência enviada: ${sent} / ${goal} pontos${period ? '.' : ''}`
      : `Ciencia enviada: ${sent} / ${goal} puntos${period ? '.' : ''}`,
  },
  {
    match: /^(\d+) points?$/,
    format: ([, count], language) => language === 'pt-BR'
      ? `${count} ${count === '1' ? 'ponto' : 'pontos'}`
      : `${count} ${count === '1' ? 'punto' : 'puntos'}`,
  },
  {
    match: /^Send (\d+) items? = (\d+) points? to Earth \((\d+)% power\)$/,
    format: ([, items, points, cost], language) => language === 'pt-BR'
      ? `Enviar ${items} ${items === '1' ? 'item' : 'itens'} = ${points} ${points === '1' ? 'ponto' : 'pontos'} para a Terra (${cost}% de energia)`
      : `Enviar ${items} ${items === '1' ? 'objeto' : 'objetos'} = ${points} ${points === '1' ? 'punto' : 'puntos'} a la Tierra (${cost}% de energía)`,
  },
  {
    match: /^Not enough power: this upload needs (\d+)% of the battery\. Wait for the Sun\.$/,
    format: ([, cost], language) => language === 'pt-BR' ? `Energia insuficiente: este envio precisa de ${cost}% da bateria. Espere o Sol.` : `Falta energía: este envío necesita el ${cost}% de la batería. Espera al Sol.`,
  },
  {
    match: /^Not enough science points: this needs (\d+) points that were not sent to Earth yet\.$/,
    format: ([, cost], language) => language === 'pt-BR' ? `Faltam pontos científicos: são necessários ${cost} pontos ainda não enviados à Terra.` : `Faltan puntos científicos: necesitas ${cost} puntos que aún no hayas enviado a la Tierra.`,
  },
  {
    match: /^Question sent\. The answer needs about (\d+) s \(game time\) to come back\.$/,
    format: ([, seconds], language) => language === 'pt-BR' ? `Pergunta enviada. A resposta deve voltar em cerca de ${seconds} s do jogo.` : `Pregunta enviada. La respuesta tardará unos ${seconds} s del juego.`,
  },
  {
    match: /^Regolith analyzed: \+(\d+) science point\. Plain regolith only counts once: the glowing sample spots outside are worth more\.$/,
    format: ([, points], language) => language === 'pt-BR' ? `Solo marciano (rególito) analisado: +${points} ponto científico. O solo comum só conta uma vez; os locais brilhantes de amostra lá fora valem mais.` : `Suelo marciano (regolito) analizado: +${points} punto científico. El suelo común solo cuenta una vez; los lugares brillantes con muestras valen más.`,
  },
  {
    match: /^Tool upgraded \(-([\d.]+) science points, not sent to Earth\): collecting blocks is faster\.$/,
    format: ([, points], language) => language === 'pt-BR' ? `Ferramenta melhorada (−${points} pontos científicos, não enviados à Terra): agora você coleta blocos mais rápido.` : `Herramienta mejorada (−${points} puntos científicos, no enviados a la Tierra): ahora recoges bloques más rápido.`,
  },
  {
    match: /^Suit upgrade installed \(-([\d.]+) science points, not sent to Earth\): outside, less radiation hurts you and less dose adds up\.$/,
    format: ([, points], language) => language === 'pt-BR' ? `Melhoria do traje instalada (−${points} pontos científicos, não enviados à Terra): lá fora, a radiação machuca menos e sua dose aumenta mais devagar.` : `Mejora del traje instalada (−${points} puntos científicos, no enviados a la Tierra): afuera, la radiación te hace menos daño y tu dosis aumenta más despacio.`,
  },
  {
    match: /^Moved (\d+(?:\.\d+)?) L into the wall\. Less water to drink, more protection\.$/,
    format: ([, liters], language) => language === 'pt-BR' ? `Você colocou ${liters} L de água na parede. Menos água para beber, mais proteção.` : `Pusiste ${liters} L de agua en la pared. Menos agua para beber, más protección.`,
  },
  {
    match: /^Moved (\d+(?:\.\d+)?) L back to the tank\. More water to drink, less protection\.$/,
    format: ([, liters], language) => language === 'pt-BR' ? `Você tirou ${liters} L de água da parede e devolveu ao tanque. Mais água para beber, menos proteção.` : `Sacaste ${liters} L de agua de la pared y la devolviste al tanque. Más agua para beber, menos protección.`,
  },
  {
    match: /^Need (\d+(?:\.\d+)?)% base power for full suit repair\.$/,
    format: ([, cost], language) => language === 'pt-BR' ? `São necessários ${cost}% de energia da base para reparar o traje por completo.` : `Necesitas el ${cost}% de energía de la base para reparar todo el traje.`,
  },
  {
    match: /^Need (\d+(?:\.\d+)?)% base power for electrostatic cleaning\.$/,
    format: ([, cost], language) => language === 'pt-BR' ? `São necessários ${cost}% de energia da base para limpar o traje com eletricidade estática.` : `Necesitas el ${cost}% de energía de la base para limpiar el traje con electricidad estática.`,
  },
  {
    match: /^Commander, the (.+) has no power! The battery is empty\.$/,
    format: ([, station], language) => language === 'pt-BR'
      ? `Comandante, ${stationSubject(station, language)} está sem energia! A bateria acabou.`
      : `Comandante, ${stationSubject(station, language)} se quedó sin energía. La batería está agotada.`,
  },
  {
    match: /^Commander, the (.+) is breaking down\. It needs care\.$/,
    format: ([, station], language) => language === 'pt-BR'
      ? `Comandante, ${stationSubject(station, language)} está com problemas e precisa de manutenção.`
      : `Comandante, ${stationSubject(station, language)} tiene problemas y necesita mantenimiento.`,
  },
  {
    match: /^Commander, it is freezing! The (.+) stopped\. Turn the heater on in the power room\.$/,
    format: ([, station], language) => language === 'pt-BR'
      ? `Comandante, está congelando! ${stationSubject(station, language, true)} parou. Ligue o aquecedor na sala de energia.`
      : `Comandante, ¡hace mucho frío! ${stationSubject(station, language, true)} se detuvo. Enciende la calefacción en la sala de energía.`,
  },
  {
    match: /^Fission reactor ON: \+(\d+(?:\.\d+)?)%\/h day and night\. Your radiation dose climbs faster while it runs\.$/,
    format: ([, output], language) => language === 'pt-BR'
      ? `Reator de fissão LIGADO: +${output}%/h, de dia e de noite. Sua dose de radiação aumenta mais rápido enquanto ele funciona.`
      : `Reactor de fisión ENCENDIDO: +${output}%/h, día y noche. Tu dosis de radiación aumenta más rápido mientras funciona.`,
  },
  {
    match: /^The rocket takes ice in loads of (\d+(?:\.\d+)?) kg\. Drill more first\.$/,
    format: ([, amount], language) => language === 'pt-BR'
      ? `O foguete só pode receber gelo em cargas de ${amount} kg. Perfure mais gelo primeiro.`
      : `El cohete solo puede cargarse con lotes de ${amount} kg de hielo. Perfora más hielo primero.`,
  },
  {
    match: /^Rover loaded (\d+(?:\.\d+)?) ice into the rocket\. No walk outside needed!$/,
    format: ([, amount], language) => language === 'pt-BR'
      ? `O rover carregou ${amount} blocos de gelo no foguete. Você não precisou sair da base!`
      : `El rover cargó ${amount} bloques de hielo en el cohete. ¡No tuviste que salir de la base!`,
  },
  {
    match: /^EVA suit below minimum launch levels \((\d+)% O2 \/ (\d+)% Heat\)\. Wait for recharge\.$/,
    format: ([, oxygen, heat], language) => language === 'pt-BR'
      ? `O traje espacial (EVA) está abaixo do nível mínimo para decolar (${oxygen}% de O₂ / ${heat}% de proteção térmica). Espere a recarga.`
      : `El traje espacial (EVA) está por debajo del nivel mínimo para despegar (${oxygen}% de O₂ / ${heat}% de protección térmica). Espera a que se recargue.`,
  },
  {
    match: /^The battery will be empty before sunrise \((.+) to go\)\. Turn something off, or start the fission reactor\.$/,
    format: ([, time], language) => language === 'pt-BR'
      ? `A bateria vai acabar antes do nascer do Sol (faltam ${time}). Desligue algum aparelho ou ligue o reator de fissão.`
      : `La batería se agotará antes del amanecer (faltan ${time}). Apaga algún aparato o enciende el reactor de fisión.`,
  },
  {
    match: /^Planted (lettuce|soy|potato)\. It drinks (\d+(?:\.\d+)?) L from the base tank while it grows, and needs light and a clean greenhouse\.$/,
    format: ([, crop, liters], language) => language === 'pt-BR'
      ? `Você plantou ${translate(crop, language)}. A planta consome ${liters} L do tanque da base enquanto cresce e precisa de luz e de uma estufa limpa.`
      : `Plantaste ${translate(crop, language)}. La planta consume ${liters} L del tanque de la base mientras crece y necesita luz y un invernadero limpio.`,
  },
  {
    match: /^Harvested (lettuce|soy|potato)\. Pick up your harvest and use it to eat\. A real NASA study is now in your field notebook!$/,
    format: ([, crop], language) => language === 'pt-BR'
      ? `Você colheu ${translate(crop, language)}. Pegue a colheita para comer. Um estudo real da NASA está no seu diário de campo!`
      : `Cosechaste ${translate(crop, language)}. Recoge la cosecha para comer. ¡Ahora tienes un estudio real de la NASA en tu cuaderno de campo!`,
  },
  {
    match: /^The (lettuce|soy|potato) basket is empty\.$/,
    format: ([, crop], language) => language === 'pt-BR'
      ? `O cesto de ${translate(crop, language)} está vazio.`
      : `La cesta de ${translate(crop, language)} está vacía.`,
  },
  {
    match: /^Collected (\d+) (lettuce|soy|potato)\.( The rest is in the basket\.)?$/,
    format: ([, count, crop, rest], language) => language === 'pt-BR'
      ? `${count} unidades de ${translate(crop, language)} coletadas.${rest ? ' O restante está no cesto.' : ''}`
      : `Se recogieron ${count} unidades de ${translate(crop, language)}.${rest ? ' El resto está en la cesta.' : ''}`,
  },
  {
    match: /^(.+) analyzed: \+(\d+) science points\. Send it to Earth from this terminal\.$/,
    format: ([, sample, points], language) => language === 'pt-BR'
      ? `${translate(sample, language)} analisada: +${points} pontos científicos. Envie os dados à Terra por este terminal.`
      : `${translate(sample, language)} analizada: +${points} puntos científicos. Envía los datos a la Tierra desde esta terminal.`,
  },
  {
    match: /^Got a Space Ration! \((\d+) left in the pantry\)$/,
    format: ([, count], language) => language === 'pt-BR'
      ? `Você pegou uma ração espacial! Restam ${count} na despensa.`
      : `¡Tomaste una ración espacial! Quedan ${count} en la despensa.`,
  },
  {
    match: /^Cooking your (lettuce|soy|potato|Mars carrot): ready in (\d+(?:\.\d+)?) seconds\.$/,
    format: ([, crop, seconds], language) => language === 'pt-BR'
      ? `Sua refeição de ${foodName(crop, language)} ficará pronta em ${seconds} segundos.`
      : `Tu comida de ${foodName(crop, language)} estará lista en ${seconds} segundos.`,
  },
  {
    match: /^(.+): Your ration is cooking! (\d+) s to go\.$/,
    format: ([, name, seconds], language) => language === 'pt-BR'
      ? `${name}: sua refeição está sendo preparada! Faltam ${seconds} s.`
      : `${name}: ¡están preparando tu comida! Faltan ${seconds} s.`,
  },
  {
    match: /^(.+): Your ration is ready! Make room in your bag\.$/,
    format: ([, name], language) => language === 'pt-BR'
      ? `${name}: sua refeição está pronta! Abra espaço na mochila.`
      : `${name}: ¡tu comida está lista! Haz espacio en tu mochila.`,
  },
  {
    match: /^(.+): Thanks for the (lettuce|soy|potato|Mars carrot)! Your ration is ready in (\d+(?:\.\d+)?) s\.$/,
    format: ([, name, crop, seconds], language) => language === 'pt-BR'
      ? `${name}: obrigado pela ${foodName(crop, language)}! Sua refeição ficará pronta em ${seconds} s.`
      : `${name}: ¡gracias por la ${foodName(crop, language)}! Tu comida estará lista en ${seconds} s.`,
  },
  {
    match: /^(.+): No food! Grow some in the greenhouse\.$/,
    format: ([, name], language) => language === 'pt-BR'
      ? `${name}: não temos comida! Plante alimentos na estufa.`
      : `${name}: ¡no hay comida! Cultiva alimentos en el invernadero.`,
  },
  {
    match: /^(.+): Here is a ration! (\d+) left\.$/,
    format: ([, name, count], language) => language === 'pt-BR'
      ? `${name}: aqui está sua refeição! Restam ${count}.`
      : `${name}: ¡aquí tienes tu comida! Quedan ${count}.`,
  },
  {
    match: /^(.+): Your (lettuce|soy|potato|Mars carrot) ration is ready!$/,
    format: ([, name, crop], language) => language === 'pt-BR'
      ? `${name}: sua refeição de ${foodName(crop, language)} está pronta!`
      : `${name}: ¡tu comida de ${foodName(crop, language)} está lista!`,
  },
  {
    match: /^Got a Space Ration made from your (lettuce|soy|potato|Mars carrot)! Eat it from your hotbar\.$/,
    format: ([, crop], language) => language === 'pt-BR'
      ? `Você recebeu uma ração espacial feita com ${foodName(crop, language)}! Coma pela barra de itens.`
      : `¡Recibiste una ración espacial hecha con ${foodName(crop, language)}! Cómela desde la barra de objetos.`,
  },
  {
    match: /^(.+) is cooking your ration \((\d+) s\)$/,
    format: ([, name, seconds], language) => language === 'pt-BR'
      ? `${name} está preparando sua refeição (${seconds} s)`
      : `${name} está preparando tu comida (${seconds} s)`,
  },
  {
    match: /^\[F\] Give (lettuce|soy|potato|Mars carrot) to (.+): 1 ration \((\d+(?:\.\d+)?)% battery\)$/,
    format: ([, crop, name, cost], language) => language === 'pt-BR'
      ? `[F] Entregar ${foodName(crop, language)} para ${name}: 1 refeição (${cost}% da bateria)`
      : `[F] Dar ${foodName(crop, language)} a ${name}: 1 comida (${cost}% de batería)`,
  },
  {
    match: /^\[F\] Get space ration from (.+) \((\d+) in pantry\)$/,
    format: ([, name, count], language) => language === 'pt-BR'
      ? `[F] Pegar ração espacial com ${name} (${count} na despensa)`
      : `[F] Recoger una ración espacial con ${name} (${count} en la despensa)`,
  },
  {
    match: /^\[F\] Talk to (.+) \(pantry empty\)$/,
    format: ([, name], language) => language === 'pt-BR'
      ? `[F] Falar com ${name} (despensa vazia)`
      : `[F] Hablar con ${name} (despensa vacía)`,
  },
  {
    match: /^\[F\] Talk to (.+)$/,
    format: ([, name], language) => language === 'pt-BR'
      ? `[F] Falar com ${name}`
      : `[F] Hablar con ${name}`,
  },
  {
    match: /^(.+): I'm too weak to work\. We need (.+)!$/,
    format: ([, name, needs], language) => {
      const localizedNeeds = needs.split(' and ').map((need) => translate(need, language));
      const joiner = language === 'pt-BR' ? ' e ' : ' y ';
      const list = localizedNeeds.length > 2
        ? `${localizedNeeds.slice(0, -1).join(', ')}${joiner}${localizedNeeds.at(-1)}`
        : localizedNeeds.join(joiner);
      return language === 'pt-BR'
        ? `${name}: estou sem forças para trabalhar. Precisamos de ${list}!`
        : `${name}: no tengo fuerzas para trabajar. ¡Necesitamos ${list}!`;
    },
  },
  {
    match: /^(.+): Thanks, Commander! I'm back to work\.$/,
    format: ([, name], language) => language === 'pt-BR'
      ? `${name}: valeu, comandante! Voltei ao trabalho.`
      : `${name}: ¡gracias, comandante! Ya volví al trabajo.`,
  },
  {
    match: /^(.+) is too weak and must rest in the medical bay\. Bring air, water and food back so (.+) can get better\.$/,
    format: ([, name], language) => language === 'pt-BR'
      ? `${name} está sem forças e precisa descansar na enfermaria. Reponha o ar, a água e a comida para ${name} se recuperar.`
      : `${name} no tiene fuerzas y necesita descansar en la enfermería. Repón el aire, el agua y la comida para que ${name} se recupere.`,
  },
  {
    match: /^(.+): Going to rest\. I still need air, water and food\.$/,
    format: ([, name], language) => language === 'pt-BR'
      ? `${name}: vou descansar. Ainda preciso de ar, água e comida.`
      : `${name}: voy a descansar. Todavía necesito aire, agua y comida.`,
  },
  {
    match: /^(.+): On my way to the (.+)!$/,
    format: ([, name, station], language) => language === 'pt-BR'
      ? `${name}: estou indo para ${translate(station, language)}!`
      : `${name}: ¡voy hacia ${translate(station, language)}!`,
  },
  {
    match: /^Commander, the (.+) has a problem\.$/,
    format: ([, station], language) => language === 'pt-BR'
      ? `Comandante, ${stationSubject(station, language)} está com problemas.`
      : `Comandante, ${stationSubject(station, language)} tiene problemas.`,
  },
  {
    match: /^RADIATION DOSE: (.+) of (.+) \(NASA career limit\)$/,
    format: ([, dose, limit], language) => language === 'pt-BR'
      ? `DOSE DE RADIAÇÃO: ${dose} de ${limit} (limite da NASA ao longo da carreira)`
      : `DOSIS DE RADIACIÓN: ${dose} de ${limit} (límite de la NASA durante la carrera)`,
  },
  {
    match: /^Flight doctor: your radiation dose is almost at the NASA limit \((\d+) mSv\)\.$/,
    format: ([, limit], language) => language === 'pt-BR'
      ? `Médica da missão: sua dose de radiação está perto do limite da NASA (${limit} mSv).`
      : `Médica de vuelo: tu dosis de radiación está cerca del límite de la NASA (${limit} mSv).`,
  },
  {
    match: /^Flight doctor: your dose passed the NASA limit of (\d+) mSv\. You cannot go outside anymore\.$/,
    format: ([, limit], language) => language === 'pt-BR'
      ? `Médica da missão: sua dose passou do limite da NASA de ${limit} mSv. Você não pode mais sair da base.`
      : `Médica de vuelo: tu dosis superó el límite de la NASA de ${limit} mSv. Ya no puedes salir de la base.`,
  },
  {
    match: /^OXYGEN MACHINE: (.+) \((.+)\)$/,
    format: ([, label, machine], language) => language === 'pt-BR'
      ? `MÁQUINA DE OXIGÊNIO: ${translateUppercaseLabel(label, language)} (${translate(machine, language)})`
      : `MÁQUINA DE OXÍGENO: ${translateUppercaseLabel(label, language)} (${translate(machine, language)})`,
  },
  {
    match: /^OTHER CHOICE: (.+) \((.+)\)$/,
    format: ([, label, machine], language) => language === 'pt-BR'
      ? `OUTRA OPÇÃO: ${translateUppercaseLabel(label, language)} (${translate(machine, language)})`
      : `LA OTRA OPCIÓN: ${translateUppercaseLabel(label, language)} (${translate(machine, language)})`,
  },
  {
    match: /^Cost: ([\d.]+)% power per O2 point\. No water\.$/,
    format: ([, power], language) => language === 'pt-BR'
      ? `  Custo: ${power}% de energia por ponto de O₂. Não usa água.`
      : `  Costo: ${power}% de energía por punto de O₂. No usa agua.`,
  },
  {
    match: /^Cost: ([\d.]+)% power per O2 point, and about ([\d.]+) L of water per person each sol\.$/,
    format: ([, power, water], language) => language === 'pt-BR'
      ? `  Custo: ${power}% de energia por ponto de O₂ e cerca de ${water} L de água por pessoa a cada sol.`
      : `  Costo: ${power}% de energía por punto de O₂ y unos ${water} L de agua por persona cada sol.`,
  },
  {
    match: /^SABATIER REACTOR: not built\. It would give back half of that water \(([\d.]+) regolith, ([\d.]+)% power\)\.$/,
    format: ([, regolith, power], language) => language === 'pt-BR'
      ? `REATOR SABATIER: ainda não construído. Ele recuperaria metade dessa água (${regolith} blocos de rególito, ${power}% de energia).`
      : `REACTOR SABATIER: aún no está construido. Recuperaría la mitad de esa agua (${regolith} bloques de regolito, ${power}% de energía).`,
  },
  {
    match: /^WATER USED TO MAKE AIR SO FAR: ([\d.]+) L$/,
    format: ([, water], language) => language === 'pt-BR'
      ? `ÁGUA USADA PARA PRODUZIR AR ATÉ AGORA: ${water} L`
      : `AGUA USADA PARA PRODUCIR AIRE HASTA AHORA: ${water} L`,
  },
  {
    match: /^Build Sabatier reactor \(([\d.]+) regolith, ([\d.]+)% power\)$/,
    format: ([, regolith, power], language) => language === 'pt-BR'
      ? `Construir reator Sabatier (${regolith} blocos de rególito, ${power}% de energia)`
      : `Construir reactor Sabatier (${regolith} bloques de regolito, ${power}% de energía)`,
  },
  {
    match: /^The oxygen machine is already on (.+)\.$/,
    format: ([, mode], language) => language === 'pt-BR'
      ? `A máquina de oxigênio já está ligada em ${translate(mode, language)}.`
      : `La máquina de oxígeno ya está en ${translate(mode, language)}.`,
  },
  {
    match: /^Collect (\d+) regolith blocks outside to print the Sabatier reactor\.$/,
    format: ([, count], language) => language === 'pt-BR'
      ? `Colete ${count} blocos de rególito lá fora para fabricar o reator Sabatier.`
      : `Recoge ${count} bloques de regolito afuera para fabricar el reactor Sabatier.`,
  },
  {
    match: /^\[F\] Clean solar panel (\d+) \(dust (\d+)%, uses suit air\)$/,
    format: ([, panel, dust], language) => language === 'pt-BR'
      ? `[F] Limpar painel solar ${panel} (poeira: ${dust}%, consome ar do traje)`
      : `[F] Limpiar panel solar ${panel} (polvo: ${dust}%, consume aire del traje)`,
  },
  {
    match: /^Suit integrity: (\d+)%$/,
    format: ([, integrity], language) => language === 'pt-BR'
      ? `Integridade do traje: ${integrity}%`
      : `Integridad del traje: ${integrity}%`,
  },
  {
    match: /^(\d+)% suit integrity$/,
    format: ([, integrity], language) => language === 'pt-BR'
      ? `${integrity}% de integridade do traje`
      : `${integrity}% de integridad del traje`,
  },
  {
    match: /^Suit upgrade \(uses (\d+) unsent science points\)$/,
    format: ([, points], language) => language === 'pt-BR'
      ? `Melhorar traje (custa ${points} pontos científicos ainda não enviados)`
      : `Mejorar traje (cuesta ${points} puntos científicos aún no enviados)`,
  },
  {
    match: /^Tool upgrade \(uses (\d+) unsent science points\)$/,
    format: ([, points], language) => language === 'pt-BR'
      ? `Melhorar ferramenta (custa ${points} pontos científicos ainda não enviados)`
      : `Mejorar herramienta (cuesta ${points} puntos científicos aún no enviados)`,
  },
  {
    match: /^Fill wall \(\+(\d+) L\)$/,
    format: ([, liters], language) => language === 'pt-BR' ? `Encher parede (+${liters} L)` : `Llenar la pared (+${liters} L)`,
  },
  {
    match: /^Drain wall \(-(\d+) L\)$/,
    format: ([, liters], language) => language === 'pt-BR' ? `Esvaziar parede (−${liters} L)` : `Vaciar la pared (−${liters} L)`,
  },
  {
    match: /^Mars (lettuce|soy|potato) \(Use to eat\)$/,
    format: ([, crop], language) => language === 'pt-BR'
      ? `${foodName(`Mars ${crop}`, language)} (use para comer)`
      : `${foodName(`Mars ${crop}`, language)} (usa para comer)`,
  },
  {
    match: /^Sample: Dark Dune Sand \(analyze in the lab\)$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Amostra: areia escura das dunas (analisar no laboratório)' : 'Muestra: arena oscura de las dunas (analizar en el laboratorio)',
  },
  {
    match: /^Sample: Layered Mudstone \(analyze in the lab\)$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Amostra: rocha sedimentar em camadas (analisar no laboratório)' : 'Muestra: roca sedimentaria en capas (analizar en el laboratorio)',
  },
  {
    match: /^Sample: Yellow Sulfur Crystals \(analyze in the lab\)$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Amostra: cristais amarelos de enxofre (analisar no laboratório)' : 'Muestra: cristales amarillos de azufre (analizar en el laboratorio)',
  },
  {
    match: /^Sample: Iron Meteorite \(analyze in the lab\)$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Amostra: meteorito de ferro (analisar no laboratório)' : 'Muestra: meteorito de hierro (analizar en el laboratorio)',
  },
  {
    match: /^Sample: Buried Ice Core \(analyze in the lab\)$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Amostra: núcleo de gelo enterrado (analisar no laboratório)' : 'Muestra: núcleo de hielo enterrado (analizar en el laboratorio)',
  },
  {
    match: /^Space Ration \(Use to eat\)$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Ração espacial (use para comer)' : 'Ración espacial (úsala para comer)',
  },
  {
    match: /^Discovery Journal \(Use to open\)$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Diário de descobertas (use para abrir)' : 'Diario de descubrimientos (úsalo para abrir)',
  },
  {
    match: /^Shield Remote \(Use to turn the radiation shield on\/off\)$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Controle do escudo (use para ligar ou desligar a proteção contra radiação)' : 'Control del escudo (úsalo para activar o desactivar la protección contra la radiación)',
  },
  {
    match: /^Mars Carrot \(Right-click to eat\)$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Cenoura marciana (clique com o botão direito para comer)' : 'Zanahoria marciana (haz clic derecho para comer)',
  },
  {
    match: /^Martian Regolith$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Solo marciano (rególito)' : 'Suelo marciano (regolito)',
  },
  {
    match: /^Crater Rock$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Rocha da cratera' : 'Roca del cráter',
  },
  {
    match: /^Martian Water Ice$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Gelo de água marciano' : 'Hielo de agua marciano',
  },
  {
    match: /^Habitat Hull Block$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Bloco estrutural do habitat' : 'Bloque estructural del hábitat',
  },
  {
    match: /^Gold Thermal Block$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Bloco de isolamento térmico dourado' : 'Bloque dorado de aislamiento térmico',
  },
  {
    match: /^Pressurized Glass$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Vidro pressurizado' : 'Vidrio presurizado',
  },
  {
    match: /^Solar Lamp$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Luminária solar' : 'Lámpara solar',
  },
  {
    match: /^Fresh Meteor Ice$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Gelo fresco de meteorito' : 'Hielo fresco de meteorito',
  },
  {
    match: /^Solar Panel Block$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Bloco de painel solar' : 'Bloque de panel solar',
  },
  {
    match: /^Metal Floor Plate$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Placa metálica de piso' : 'Placa metálica para el suelo',
  },
  {
    match: /^Console Block$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Bloco de console' : 'Bloque de consola',
  },
  {
    match: /^Orange Beacon$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Sinalizador laranja' : 'Baliza naranja',
  },
  {
    match: /^Dark Basalt$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Basalto escuro' : 'Basalto oscuro',
  },
  {
    match: /^Scope Scanner$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Luneta de escaneamento' : 'Luneta de exploración',
  },
  {
    match: /^Orange Sandstone$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Arenito alaranjado' : 'Arenisca anaranjada',
  },
  {
    match: /^Sample: (.+) \(analyze in the lab\)$/,
    format: ([, sample], language) => language === 'pt-BR'
      ? `Amostra: ${translate(sample, language)} (analisar no laboratório)`
      : `Muestra: ${translate(sample, language)} (analizar en el laboratorio)`,
  },
  {
    match: /^You ate a (Mars (?:carrot|lettuce|soy|potato)|lettuce|soy|potato) \(\+Food\)\. No oxygen! Food cannot heal you, go back to the base\.?$/,
    format: ([, food], language) => language === 'pt-BR'
      ? `Você comeu ${foodName(food, language)} (+comida), mas está sem oxigênio! Comida não recupera sua saúde. Volte para a base.`
      : `Comiste ${foodName(food, language)} (+comida), pero te falta oxígeno. La comida no recupera tu salud. Vuelve a la base.`,
  },
  {
    match: /^You ate a (Mars (?:carrot|lettuce|soy|potato)|lettuce|soy|potato) \(\+Food\)$/,
    format: ([, food], language) => language === 'pt-BR'
      ? `Você comeu ${foodName(food, language)} (+comida).`
      : `Comiste ${foodName(food, language)} (+comida).`,
  },
  {
    match: /^Drank clean water from habitat purifier \(\+Hydration full\)\. Base reserve: (\d+)L\. The used water goes to the recycler\.$/,
    format: ([, reserve], language) => language === 'pt-BR'
      ? `Você bebeu água limpa do purificador (+hidratação completa). Reserva da base: ${reserve} L. A água usada vai para o reciclador.`
      : `Bebiste agua limpia del purificador (+hidratación completa). Reserva de la base: ${reserve} L. El agua usada va al reciclador.`,
  },
  {
    match: /^Base water reservoir is dry! Collect ice with the Rover\.$/,
    format: (_parts, language) => language === 'pt-BR'
      ? 'O tanque de água da base está vazio! Colete gelo com o rover.'
      : '¡El depósito de agua de la base está vacío! Recoge hielo con el rover.',
  },
  {
    match: /^Collected a sample outside: (.+)\.$/,
    format: ([, sample], language) => language === 'pt-BR'
      ? `Amostra coletada lá fora: ${translate(sample, language)}.`
      : `Muestra recogida afuera: ${translate(sample, language)}.`,
  },
  {
    match: /^Sample collected: (.+)\. Analyze it at the science & radio terminal for \+(\d+)\. (\d+) sample spots left on the map\.$/,
    format: ([, sample, points, remaining], language) => language === 'pt-BR'
      ? `Amostra coletada: ${translate(sample, language)}. Analise-a no terminal de ciência e rádio para ganhar +${points}. Restam ${remaining} locais de amostra no mapa.`
      : `Muestra recogida: ${translate(sample, language)}. Analízala en la terminal de ciencia y radio para ganar +${points}. Quedan ${remaining} lugares de muestra en el mapa.`,
  },
  {
    match: /^Sealed a sample in a tube for Earth: (.+)\.$/,
    format: ([, sample], language) => language === 'pt-BR'
      ? `Você guardou uma amostra em um tubo para enviar à Terra: ${translate(sample, language)}.`
      : `Guardaste una muestra en un tubo para enviarla a la Tierra: ${translate(sample, language)}.`,
  },
  {
    match: /^(.+) is back in your bag\. You can analyze it now\.$/,
    format: ([, sample], language) => language === 'pt-BR'
      ? `${translate(sample, language)} voltou para sua mochila. Agora você pode analisá-la.`
      : `${translate(sample, language)} volvió a tu mochila. Ya puedes analizarla.`,
  },
  {
    match: /^Picked up (\d+) items?$/,
    format: ([, count], language) => language === 'pt-BR'
      ? `${count} ${count === '1' ? 'item coletado' : 'itens coletados'}`
      : `${count} ${count === '1' ? 'objeto recogido' : 'objetos recogidos'}`,
  },
  {
    match: /^Brushed (\d+)% of the dust off panel (\d+) \(used suit air\)\. Dust left on it: (\d+)%\.(.*)$/,
    format: ([, cleaned, panel, remaining, extra], language) => language === 'pt-BR'
      ? `Você removeu ${cleaned}% da poeira do painel ${panel} (usou o ar do traje). Restam ${remaining}% de poeira.${extra ? ` ${translate(extra.trim(), language)}` : ''}`
      : `Quitaste el ${cleaned}% del polvo del panel ${panel} (usaste aire del traje). Queda un ${remaining}% de polvo.${extra ? ` ${translate(extra.trim(), language)}` : ''}`,
  },
  {
    match: /^\+(.+) of science: (.+?)( \(rare find!\))?\. Send it home from the science & radio terminal\.$/,
    format: ([, points, title, rare], language) => language === 'pt-BR'
      ? `+${translate(points, language)} de ciência: ${translate(title, language)}${rare ? ' (descoberta rara)' : ''}. Envie pelo terminal de ciência e rádio.`
      : `+${translate(points, language)} de ciencia: ${translate(title, language)}${rare ? ' (hallazgo poco común)' : ''}. Envíalo desde la terminal de ciencia y radio.`,
  },
  {
    match: /^(.+) complete! Scope upgraded: ([\d.]+)s scan, (\d+) block range$/,
    format: ([, category, seconds, blocks], language) => language === 'pt-BR'
      ? `${translate(category, language)} concluída! Luneta melhorada: escaneamento de ${seconds} s, alcance de ${blocks} blocos.`
      : `¡Categoría ${translate(category, language)} completada! Luneta mejorada: escaneo de ${seconds} s y alcance de ${blocks} bloques.`,
  },
  {
    match: /^Every target scanned: you are a Junior Astronaut!$/,
    format: (_parts, language) => language === 'pt-BR'
      ? 'Você escaneou todos os alvos: já é astronauta júnior!'
      : '¡Escaneaste todos los objetivos: ya eres astronauta júnior!',
  },
  {
    match: /^Sample analyzed, (.+): (.+)\. Real find: (.+)\. \((.+)\)$/,
    format: ([, sample, fact, place, source], language) => language === 'pt-BR'
      ? `Amostra analisada, ${translate(sample, language)}: ${translate(fact, language)}. Descoberta real: ${translate(place, language)}. (${translate(source, language)})`
      : `Muestra analizada, ${translate(sample, language)}: ${translate(fact, language)}. Hallazgo real: ${translate(place, language)}. (${translate(source, language)})`,
  },
  {
    match: /^WAIT OUT THE STORM \(no solar storm right now\)$/,
    format: (_parts, language) => language === 'pt-BR'
      ? 'ESPERAR A TEMPESTADE PASSAR (não há tempestade solar agora)'
      : 'ESPERAR A QUE PASE LA TORMENTA (ahora no hay tormenta solar)',
  },
  {
    match: /^WAIT OUT THE STORM \(the wall needs (\d+) more L\)$/,
    format: ([, liters], language) => language === 'pt-BR'
      ? `ESPERAR A TEMPESTADE PASSAR (faltam ${liters} L na parede)`
      : `ESPERAR A QUE PASE LA TORMENTA (faltan ${liters} L en la pared)`,
  },
  {
    match: /^WAIT OUT THE STORM \(step inside the shelter first\)$/,
    format: (_parts, language) => language === 'pt-BR'
      ? 'ESPERAR A TEMPESTADE PASSAR (entre no abrigo primeiro)'
      : 'ESPERAR A QUE PASE LA TORMENTA (entra primero en el refugio)',
  },
  {
    match: /^WAIT OUT THE STORM \(time runs fast\)$/,
    format: (_parts, language) => language === 'pt-BR'
      ? 'ESPERAR A TEMPESTADE PASSAR (o tempo passa rápido)'
      : 'ESPERAR A QUE PASE LA TORMENTA (el tiempo pasa rápido)',
  },
  {
    match: /^With a FULL wall \((\d+) L\) you can wait out a solar storm in here with the clock running fast: the base still uses power and you still get hungry and thirsty\.$/,
    format: ([, liters], language) => language === 'pt-BR'
      ? `Com a parede CHEIA (${liters} L), você pode esperar a tempestade passar aqui enquanto o tempo corre rápido: a base continua gastando energia e você continua sentindo fome e sede.`
      : `Con la pared LLENA (${liters} L), puedes esperar aquí a que pase la tormenta mientras el tiempo avanza rápido: la base sigue usando energía y tú sigues teniendo hambre y sed.`,
  },
  {
    match: /^(The solar storm is over\.|The battery ran out, so you stopped waiting!|The base is losing air, so you stopped waiting!|An alarm is on in the base, so you stopped waiting\.|You got too hungry to keep waiting\.|You got too thirsty to keep waiting\.) You waited (.+) of game time behind the water wall\. Battery (\d+)% -> (\d+)%\.$/,
    format: ([, head, time, before, after], language) => language === 'pt-BR'
      ? `${translate(head, language)} Você esperou ${time} atrás da parede de água. Bateria: ${before}% → ${after}%.`
      : `${translate(head, language)} Esperaste ${time} detrás de la pared de agua. Batería: ${before}% → ${after}%.`,
  },
  {
    match: /^Sealed in a tube: \+(\d+) points in your final report, none now\. The rocket needs \+(\d+) ice\.$/,
    format: ([, points, ice], language) => language === 'pt-BR'
      ? `Guardada em um tubo: +${points} pontos no relatório final, nenhum agora. O foguete precisa de mais ${ice} blocos de gelo.`
      : `Guardada en un tubo: +${points} puntos en el informe final, ninguno ahora. El cohete necesita ${ice} bloques de hielo más.`,
  },
  {
    match: /^Now pedal (left|right)\.$/,
    format: ([, side], language) => language === 'pt-BR'
      ? `Agora pedale para ${side === 'left' ? 'a esquerda' : 'a direita'}.`
      : `Ahora pedalea hacia ${side === 'left' ? 'la izquierda' : 'la derecha'}.`,
  },
  {
    match: /^Good! Now pedal (left|right)\.$/,
    format: ([, side], language) => language === 'pt-BR'
      ? `Muito bem! Agora pedale para ${side === 'left' ? 'a esquerda' : 'a direita'}.`
      : `¡Muy bien! Ahora pedalea hacia ${side === 'left' ? 'la izquierda' : 'la derecha'}.`,
  },
  {
    match: /^Battery at sunrise: about (\d+)%$/,
    format: ([, percent], language) => language === 'pt-BR'
      ? `Bateria ao nascer do Sol: cerca de ${percent}%`
      : `Batería al amanecer: cerca del ${percent}%`,
  },
  {
    match: /^Making fuel \((\d+) ice\)$/,
    format: ([, ice], language) => language === 'pt-BR'
      ? `Produzindo combustível (${ice} blocos de gelo)`
      : `Produciendo combustible (${ice} bloques de hielo)`,
  },
  {
    match: /^Need (\d+(?:\.\d+)?)% power to train\.$/,
    format: ([, cost], language) => language === 'pt-BR'
      ? `São necessários ${cost}% de energia para treinar.`
      : `Necesitas el ${cost}% de energía para entrenar.`,
  },
  {
    match: /^(.+) liters in wall, (\d+)% radiation blocked$/,
    format: ([, liters, blocked], language) => language === 'pt-BR'
      ? `${liters} litros na parede, ${blocked}% da radiação bloqueada`
      : `${liters} litros en la pared, ${blocked}% de radiación bloqueada`,
  },
  {
    match: /^Nothing new to send\. Scan things with the scope or analyze samples first\.$/,
    format: (_parts, language) => language === 'pt-BR'
      ? 'Nada novo para enviar. Escaneie objetos com a luneta ou analise amostras primeiro.'
      : 'No hay nada nuevo para enviar. Primero escanea objetos con la mira o analiza muestras.',
  },
  {
    match: /^Earth also needs the (\d+) clues \((\d+) samples each\)\. Still missing: (.+)\.$/,
    format: ([, clues, perClue, missing], language) => language === 'pt-BR'
      ? `A Terra também precisa das ${clues} pistas (${perClue} amostras de cada tipo). Ainda faltam: ${translate(missing, language)}.`
      : `La Tierra también necesita las ${clues} pistas (${perClue} muestras de cada tipo). Aún faltan: ${translate(missing, language)}.`,
  },
  {
    match: /^Enough points are home, but Earth still needs these clues: (.+)\. Each clue is (\d+) samples of one kind: find the glowing samples, analyze them and send them\.$/,
    format: ([, clues, count], language) => language === 'pt-BR'
      ? `A Terra já recebeu pontos suficientes, mas ainda precisa destas pistas: ${translate(clues, language)}. Cada pista exige ${count} amostras do mesmo tipo: encontre as amostras brilhantes, analise-as e envie os dados.`
      : `La Tierra ya recibió suficientes puntos, pero aún necesita estas pistas: ${translate(clues, language)}. Cada pista requiere ${count} muestras del mismo tipo: encuentra las muestras brillantes, analízalas y envía los datos.`,
  },
  {
    match: /^Enough science is home\. Extra uploads still count for your report\.$/,
    format: (_parts, language) => language === 'pt-BR'
      ? 'A Terra já recebeu ciência suficiente. Os envios extras ainda contam no seu relatório.'
      : 'La Tierra ya recibió suficiente ciencia. Los envíos extra también cuentan en tu informe.',
  },
  {
    match: /^The rocket needs (\d+) points? of science sent to Earth\.$/,
    format: ([, points], language) => language === 'pt-BR'
      ? `O foguete precisa que ${points} pontos científicos sejam enviados à Terra.`
      : `Hay que enviar ${points} puntos científicos a la Tierra para el cohete.`,
  },
  {
    match: /^The rocket needs (\d+) points of science sent to Earth\.$/,
    format: ([, points], language) => language === 'pt-BR'
      ? `O foguete precisa que ${points} pontos científicos sejam enviados à Terra.`
      : `Hay que enviar ${points} puntos científicos a la Tierra para el cohete.`,
  },
  {
    match: /^(.+) You have enough: send it\.(.*)$/,
    format: ([, goal, clues], language) => language === 'pt-BR'
      ? `${translate(goal, language)} Você já tem o suficiente: envie os dados.${translate(clues, language)}`
      : `${translate(goal, language)} Ya tienes suficientes: envía los datos.${translate(clues, language)}`,
  },
  {
    match: /^(.+) Still missing: (.+)\. Scan new things with the scope or analyze samples from the map\.(.*)$/,
    format: ([, goal, missing, clues], language) => language === 'pt-BR'
      ? `${translate(goal, language)} Ainda faltam ${translate(missing, language)}. Escaneie novos objetos com a luneta ou analise amostras do mapa.${translate(clues, language)}`
      : `${translate(goal, language)} Aún faltan ${translate(missing, language)}. Escanea objetos nuevos con la mira o analiza muestras del mapa.${translate(clues, language)}`,
  },
  {
    match: /^Sent (\d+) items? \(\+(\d+) points\) to a Mars orbiter, which passes it on to Earth \(-([\d.]+)% power\)\.(.*)$/,
    format: ([, items, points, cost, rest], language) => language === 'pt-BR'
      ? `${items} ${items === '1' ? 'item enviado' : 'itens enviados'} (+${points} pontos) ao orbitador de Marte, que encaminha os dados à Terra (−${cost}% de energia).${translate(rest, language)}`
      : `${items} ${items === '1' ? 'objeto enviado' : 'objetos enviados'} (+${points} puntos) a un orbitador de Marte, que los reenvía a la Tierra (−${cost}% de energía).${translate(rest, language)}`,
  },
  {
    match: /^(.+) more items? wait for the next orbiter pass\.$/,
    format: ([, count], language) => language === 'pt-BR'
      ? ` ${count} ${count === '1' ? 'item espera' : 'itens esperam'} a próxima passagem do orbitador.`
      : ` ${count} ${count === '1' ? 'objeto espera' : 'objetos esperan'} el próximo paso del orbitador.`,
  },
  {
    match: /^Earth has enough of your science!$/,
    format: (_parts, language) => language === 'pt-BR'
      ? 'A Terra já recebeu ciência suficiente!'
      : '¡La Tierra ya recibió suficiente ciencia!',
  },
  {
    match: /^(.+) sealed in a tube: \+(\d+) points in your final report, none now\. The rocket needs \+(\d+) ice\.$/,
    format: ([, sample, points, ice], language) => language === 'pt-BR'
      ? `${translate(sample, language)} guardada em um tubo: +${points} pontos no relatório final, nenhum agora. O foguete precisa de mais ${ice} blocos de gelo.`
      : `${translate(sample, language)} guardada en un tubo: +${points} puntos en el informe final, ninguno ahora. El cohete necesita ${ice} bloques de hielo más.`,
  },
  {
    match: /^(.+): I can't, the (.+) has no power\.$/,
    format: ([, name, station], language) => language === 'pt-BR'
      ? `${name}: não consigo; ${stationSubject(station, language)} está sem energia.`
      : `${name}: no puedo; ${stationSubject(station, language)} se quedó sin energía.`,
  },
  {
    match: /^Science you let pass: (.+) \(storm-only scans\)$/,
    format: ([, scans], language) => language === 'pt-BR'
      ? `Descobertas perdidas: ${scans.split(', ').map((scan) => translate(scan, language)).join(', ')} (escaneamentos disponíveis só durante a tempestade)`
      : `Descubrimientos perdidos: ${scans.split(', ').map((scan) => translate(scan, language)).join(', ')} (escaneos disponibles solo durante la tormenta)`,
  },
  {
    match: /^Follow the arrow to (.+), the engineer: press F$/,
    format: ([, name], language) => language === 'pt-BR'
      ? `Siga a seta até ${name}, da equipe de engenharia: pressione F`
      : `Sigue la flecha hasta ${name}, parte del equipo de ingeniería: pulsa F`,
  },
  {
    match: /^Get the scope from (.+), the flight engineer$/,
    format: ([, name], language) => language === 'pt-BR'
      ? `Pegue a luneta com ${name}, da equipe de engenharia de voo`
      : `Recoge la mira con ${name}, parte del equipo de ingeniería de vuelo`,
  },
  {
    match: /^(.+), the engineer, has a scope for you$/,
    format: ([, name], language) => language === 'pt-BR'
      ? `${name}, da equipe de engenharia, tem uma luneta para você`
      : `${name}, parte del equipo de ingeniería, tiene una mira para ti`,
  },
  {
    match: /^\[F\] Get the scope from (.+)$/,
    format: ([, name], language) => language === 'pt-BR' ? `[F] Pegar a luneta com ${name}` : `[F] Recoger la mira con ${name}`,
  },
  {
    match: /^\[F\] Get the new window glass from (.+)$/,
    format: ([, name], language) => language === 'pt-BR' ? `[F] Pegar o vidro novo da janela com ${name}` : `[F] Recoger el vidrio nuevo de la ventana con ${name}`,
  },
  {
    match: /^(.+): Here is your scope\. Scan the windows to find the leak!$/,
    format: ([, name], language) => language === 'pt-BR'
      ? `${name}: aqui está sua luneta. Escaneie as janelas para encontrar o vazamento!`
      : `${name}: aquí tienes la mira. ¡Escanea las ventanas para encontrar la fuga!`,
  },
  {
    match: /^(.+): I am getting new glass\. Come and take it!$/,
    format: ([, name], language) => language === 'pt-BR'
      ? `${name}: vou buscar um vidro novo. Venha pegar!`
      : `${name}: voy a buscar un vidrio nuevo. ¡Ven a recogerlo!`,
  },
  {
    match: /^(.+): Here is the glass\. Put it on the cracked window!$/,
    format: ([, name], language) => language === 'pt-BR'
      ? `${name}: aqui está o vidro. Coloque-o na janela rachada!`
      : `${name}: aquí está el vidrio. ¡Ponlo en la ventana rota!`,
  },
  {
    match: /^Window OK\. The leak sounds (\d+) blocks away$/,
    format: ([, blocks], language) => language === 'pt-BR'
      ? `Janela intacta. O vazamento parece estar a ${blocks} blocos`
      : `La ventana está bien. La fuga parece estar a ${blocks} bloques`,
  },
  {
    match: /^Battery at sunrise: about (\d+)%$/,
    format: ([, percent], language) => language === 'pt-BR'
      ? `Bateria ao nascer do Sol: cerca de ${percent}%`
      : `Batería al amanecer: cerca del ${percent}%`,
  },
  {
    match: /^(.+) fields outside, (\d+) glowing rocks in each$/,
    format: ([, fields, rocks], language) => language === 'pt-BR'
      ? `${fields} áreas lá fora, com ${rocks} rochas brilhantes em cada uma`
      : `${fields} campos afuera, con ${rocks} rocas brillantes en cada uno`,
  },
  {
    match: /^Collect (\d+) samples of each of the (\d+) kinds outside$/,
    format: ([, samples, kinds], language) => language === 'pt-BR'
      ? `Colete ${samples} amostras de cada um dos ${kinds} tipos lá fora`
      : `Recoge ${samples} muestras de cada uno de los ${kinds} tipos afuera`,
  },
  {
    match: /^Analyze your (\d+) samples at the science & radio terminal$/,
    format: ([, samples], language) => language === 'pt-BR'
      ? `Analise suas ${samples} amostras no terminal de ciência e rádio`
      : `Analiza tus ${samples} muestras en la terminal de ciencia y radio`,
  },
  {
    match: /^Each sample uses (\d+(?:\.\d+)?)% of the battery$/,
    format: ([, percent], language) => language === 'pt-BR'
      ? `Cada amostra consome ${percent}% da bateria`
      : `Cada muestra consume el ${percent}% de la batería`,
  },
  {
    match: /^Send (\d+) science points and the (\d+) clues to Earth$/,
    format: ([, points, clues], language) => language === 'pt-BR'
      ? `Envie ${points} pontos científicos e as ${clues} pistas para a Terra`
      : `Envía ${points} puntos científicos y las ${clues} pistas a la Tierra`,
  },
  {
    match: /^Earth needs (\d+) points and (\d+) clues$/,
    format: ([, points, clues], language) => language === 'pt-BR'
      ? `A Terra precisa de ${points} pontos e ${clues} pistas`
      : `La Tierra necesita ${points} puntos y ${clues} pistas`,
  },
  {
    match: /^One orbiter pass carries only (\d+) items$/,
    format: ([, items], language) => language === 'pt-BR'
      ? `Cada passagem do orbitador leva só ${items} itens`
      : `Cada paso del orbitador lleva solo ${items} objetos`,
  },
  {
    match: /^Water tank: (\d+) of (\d+) L$/,
    format: ([, amount, total], language) => language === 'pt-BR'
      ? `Tanque de água: ${amount} de ${total} L`
      : `Depósito de agua: ${amount} de ${total} L`,
  },
  {
    match: /^Dust on solar panels: (\d+)%$/,
    format: ([, percent], language) => language === 'pt-BR'
      ? `Poeira nos painéis solares: ${percent}%`
      : `Polvo en los paneles solares: ${percent}%`,
  },
  {
    match: /^Fields planted: (\d+) of (\d+)$/,
    format: ([, planted, total], language) => language === 'pt-BR'
      ? `Canteiros plantados: ${planted} de ${total}`
      : `Parcelas plantadas: ${planted} de ${total}`,
  },
  {
    match: /^Base ready for the next crew: (\d+) of (\d+) \(missing: (.+)\)$/,
    format: ([, ready, total, missing], language) => language === 'pt-BR'
      ? `Base pronta para a próxima equipe: ${ready} de ${total} itens prontos (faltam: ${missing.split(/, | and /).map((item) => translate(item, language)).join(', ')})`
      : `Base lista para la próxima tripulación: ${ready} de ${total} elementos listos (faltan: ${missing.split(/, | and /).map((item) => translate(item, language)).join(', ')})`,
  },
  {
    match: /^clean panels$/,
    format: (_parts, language) => language === 'pt-BR' ? 'painéis limpos' : 'paneles limpios',
  },
  {
    match: /^planted fields$/,
    format: (_parts, language) => language === 'pt-BR' ? 'canteiros plantados' : 'parcelas plantadas',
  },
  {
    match: /^Liftoff in the (first|second|third) launch window: right on time$/,
    format: ([, ordinal], language) => language === 'pt-BR'
      ? `Decolagem na ${({ first: 'primeira', second: 'segunda', third: 'terceira' } as Record<string, string>)[ordinal]} janela: no horário certo`
      : `Despegue en la ${({ first: 'primera', second: 'segunda', third: 'tercera' } as Record<string, string>)[ordinal]} ventana: justo a tiempo`,
  },
  {
    match: /^Liftoff in the (first|second|third) launch window: the crew waited about (\d+) months$/,
    format: ([, ordinal, months], language) => language === 'pt-BR'
      ? `Decolagem na ${({ first: 'primeira', second: 'segunda', third: 'terceira' } as Record<string, string>)[ordinal]} janela: a equipe esperou cerca de ${months} meses`
      : `Despegue en la ${({ first: 'primera', second: 'segunda', third: 'tercera' } as Record<string, string>)[ordinal]} ventana: la tripulación esperó unos ${months} meses`,
  },
  {
    match: /^Liftoff in launch window (\d+): the crew waited about (\d+) months$/,
    format: ([, window, months], language) => language === 'pt-BR'
      ? `Decolagem na janela ${window}: a equipe esperou cerca de ${months} meses`
      : `Despegue en la ventana ${window}: la tripulación esperó unos ${months} meses`,
  },
  {
    match: /^Liftoff in launch window (\d+): right on time$/,
    format: ([, window], language) => language === 'pt-BR'
      ? `Decolagem na janela ${window}: no horário certo`
      : `Despegue en la ventana ${window}: justo a tiempo`,
  },
  {
    match: /^24 h clock, played in (\d+) minutes$/,
    format: ([, minutes], language) => language === 'pt-BR'
      ? `Relógio de 24 h: um dia do jogo dura ${minutes} minutos`
      : `Reloj de 24 h: un día del juego dura ${minutes} minutos`,
  },
  {
    match: /^1 game hour = (\d+) real seconds, so a mission fits in one play session\.$/,
    format: ([, seconds], language) => language === 'pt-BR'
      ? `1 hora do jogo = ${seconds} segundos reais. Assim, a missão cabe em uma partida.`
      : `1 hora del juego = ${seconds} segundos reales. Así, la misión cabe en una partida.`,
  },
  {
    match: /^About ([\d.]+) s to pump air and clean the suit$/,
    format: ([, seconds], language) => language === 'pt-BR'
      ? `Cerca de ${seconds} s para retirar o ar e limpar o traje`
      : `Unos ${seconds} s para sacar el aire y limpiar el traje`,
  },
  {
    match: /^0 to (\d+)%, about ([\d.]+) kWh; the solar field makes up to ([\d.]+) kW$/,
    format: ([, capacity, energy, power], language) => language === 'pt-BR'
      ? `De 0 a ${capacity}%, cerca de ${energy} kWh; o campo solar produz até ${power} kW`
      : `De 0 al ${capacity}%, unos ${energy} kWh; el campo solar produce hasta ${power} kW`,
  },
  {
    match: /^One Kilopower reactor: 1 to ([\d.]+) kW\. Sunlight on Mars: 43% of Earth$/,
    format: ([, power], language) => language === 'pt-BR'
      ? `Um reator Kilopower: de 1 a ${power} kW. A luz solar em Marte: 43% da que chega à Terra.`
      : `Un reactor Kilopower: de 1 a ${power} kW. La luz solar en Marte: el 43% de la que llega a la Tierra.`,
  },
  {
    match: /^Power is shown in % so it is easy to compare\. Our ruler: the game reactor counts as one real ([\d.]+) kW Kilopower\. How much each machine uses is a game rule\.$/,
    format: ([, power], language) => language === 'pt-BR'
      ? `A energia aparece em % para facilitar a comparação. A referência é um reator Kilopower real de ${power} kW. O consumo de cada máquina é uma regra do jogo.`
      : `La energía aparece en % para que sea fácil comparar. La referencia es un reactor Kilopower real de ${power} kW. El consumo de cada máquina es una regla del juego.`,
  },
  {
    match: /^About ([\d.]+) kW, day and night$/,
    format: ([, power], language) => language === 'pt-BR' ? `Cerca de ${power} kW, de dia e de noite` : `Unos ${power} kW, día y noche`,
  },
  {
    match: /^Curiosity's generator \(MMRTG\): about (\d+) W$/,
    format: ([, power], language) => language === 'pt-BR'
      ? `Gerador do Curiosity (MMRTG): cerca de ${power} W`
      : `Generador de Curiosity (MMRTG): unos ${power} W`,
  },
  {
    match: /^A base needs far more power than a rover\. The game one is like (\d+) rover generators together\.$/,
    format: ([, count], language) => language === 'pt-BR'
      ? `Uma base precisa de muito mais energia que um rover. O gerador do jogo equivale a ${count} geradores de rover juntos.`
      : `Una base necesita mucha más energía que un rover. El generador del juego equivale a ${count} generadores de rover juntos.`,
  },
  {
    match: /^([\d.]+) L of water \(drinking, cooking and washing\) and ([\d.]+) kg of food per person each sol$/,
    format: ([, water, food], language) => language === 'pt-BR'
      ? `${water} L de água por pessoa a cada sol (para beber, cozinhar e lavar) e ${food} kg de comida`
      : `${water} L de agua por persona cada sol (para beber, cocinar y lavarse) y ${food} kg de comida`,
  },
  {
    match: /^A full bar lasts (\d+) game hours \((\d+) minutes of play\)$/,
    format: ([, hours, minutes], language) => language === 'pt-BR'
      ? `Uma barra cheia dura ${hours} horas do jogo (${minutes} minutos de partida)`
      : `Una barra llena dura ${hours} horas del juego (${minutes} minutos de partida)`,
  },
  {
    match: /^Astronauts eat about (\d+) meals a day$/,
    format: ([, meals], language) => language === 'pt-BR'
      ? `Astronautas fazem cerca de ${meals} refeições por dia`
      : `Los astronautas comen unas ${meals} veces al día`,
  },
  {
    match: /^(\d+) minutes of play, about ([\d.]+) game hours$/,
    format: ([, minutes, hours], language) => language === 'pt-BR'
      ? `${minutes} minutos de partida, cerca de ${hours} horas do jogo`
      : `${minutes} minutos de partida, unas ${hours} horas del juego`,
  },
  {
    match: /^A real spacewalk lasts (\d+) to (\d+) hours$/,
    format: ([, min, max], language) => language === 'pt-BR'
      ? `Uma caminhada espacial real dura de ${min} a ${max} horas`
      : `Una caminata espacial real dura de ${min} a ${max} horas`,
  },
  {
    match: /^(\d+) blocks of ice fill the tank$/,
    format: ([, count], language) => language === 'pt-BR'
      ? `${count} blocos de gelo enchem o tanque`
      : `${count} bloques de hielo llenan el tanque`,
  },
  {
    match: /^About ([\d.]+) tons: 7 of fuel and 25 of oxygen to lift 4 astronauts$/,
    format: ([, tons], language) => language === 'pt-BR'
      ? `Cerca de ${tons} toneladas: 7 de combustível e 25 de oxigênio para levar 4 astronautas`
      : `Unas ${tons} toneladas: 7 de combustible y 25 de oxígeno para llevar a 4 astronautas`,
  },
  {
    match: /^([\d.]+) game hours$/,
    format: ([, hours], language) => language === 'pt-BR' ? `${hours} horas do jogo` : `${hours} horas del juego`,
  },
  {
    match: /^([\d.]+) L of water = 10 g\/cm²$/,
    format: ([, liters], language) => language === 'pt-BR'
      ? `${liters} L de água = 10 g/cm²`
      : `${liters} L de agua = 10 g/cm²`,
  },
  {
    match: /^(\d+) to (\d+) seconds to grow$/,
    format: ([, min, max], language) => language === 'pt-BR'
      ? `De ${min} a ${max} segundos para crescer`
      : `De ${min} a ${max} segundos para crecer`,
  },
  {
    match: /^(\d+) to (\d+) days: lettuce ([\d.]+), soy ([\d.]+), potato ([\d.]+)$/,
    format: ([, min, max, lettuce, soy, potato], language) => language === 'pt-BR'
      ? `De ${min} a ${max} dias: alface ${lettuce}, soja ${soy}, batata ${potato}`
      : `De ${min} a ${max} días: lechuga ${lettuce}, soja ${soy}, patata ${potato}`,
  },
  {
    match: /^The greenhouse runs much faster than the game clock so you can see a harvest: ([\d.]+) real days pass each second\. Which plant is slower is real\.$/,
    format: ([, days], language) => language === 'pt-BR'
      ? `A estufa funciona bem mais rápido que o relógio do jogo para você ver a colheita: a cada segundo passam ${days} dias reais. A planta que cresce mais devagar é baseada em dados reais.`
      : `El invernadero funciona mucho más rápido que el reloj del juego para que veas la cosecha: cada segundo pasan ${days} días reales. Qué planta crece más lento sí se basa en datos reales.`,
  },
  {
    match: /^(\d+(?:\.\d+)?) s of waiting for each minute of light travel$/,
    format: ([, seconds], language) => language === 'pt-BR'
      ? `${seconds} s de espera para cada minuto que a luz leva para viajar`
      : `${seconds} s de espera por cada minuto que tarda la luz en viajar`,
  },
  {
    match: /^(\d+) game hours, once per mission$/,
    format: ([, hours], language) => language === 'pt-BR'
      ? `${hours} horas do jogo, uma vez por missão`
      : `${hours} horas del juego, una vez por misión`,
  },
  {
    match: /^Same as the real one$/,
    format: (_parts, language) => language === 'pt-BR' ? 'Igual ao valor real' : 'Igual que el valor real',
  },
  {
    match: /^Curiosity rover median on the Mars surface$/,
    format: (_parts, language) => language === 'pt-BR'
      ? 'Mediana medida pelo rover Curiosity na superfície de Marte'
      : 'Mediana medida por el rover Curiosity en la superficie de Marte',
  },
  {
    match: /^This number is not changed: it comes straight from NASA RadLab data\.$/,
    format: (_parts, language) => language === 'pt-BR'
      ? 'Este valor não foi alterado: vem diretamente dos dados do NASA RadLab.'
      : 'Este valor no se cambió: viene directamente de los datos de NASA RadLab.',
  },
  {
    match: /^([\d.]+) mSv each hour it runs$/,
    format: ([, dose], language) => language === 'pt-BR'
      ? `${dose} mSv a cada hora de funcionamento`
      : `${dose} mSv por cada hora de funcionamiento`,
  },
  {
    match: /^Works day and night\. Costs radiation: \+([\d.]+) mSv each hour it runs$/,
    format: ([, dose], language) => language === 'pt-BR'
      ? `Funciona de dia e de noite. Aumenta a dose de radiação: +${dose} mSv por hora.`
      : `Funciona día y noche. Aumenta la dosis de radiación: +${dose} mSv por hora.`,
  },
  {
    match: /^The distance is real for today's date; only the wait is shorter\.$/,
    format: (_parts, language) => language === 'pt-BR'
      ? 'A distância é real para a data de hoje; só a espera é mais curta.'
      : 'La distancia es real para la fecha de hoy; solo la espera es más corta.',
  },
  {
    match: /^The game acts one out so you can practice deciding without Earth\.$/,
    format: (_parts, language) => language === 'pt-BR'
      ? 'O jogo simula uma conjunção para você praticar decisões sem falar com a Terra.'
      : 'El juego simula una conjunción para que practiques cómo decidir sin hablar con la Tierra.',
  },
  {
    match: /^Battery at sunrise: about (\d+)%$/,
    format: ([, percent], language) => language === 'pt-BR'
      ? `Bateria ao nascer do Sol: cerca de ${percent}%`
      : `Batería al amanecer: cerca del ${percent}%`,
  },
  {
    match: /^GRAVITY$/,
    format: (_parts, language) => language === 'pt-BR' ? 'GRAVIDADE' : 'GRAVEDAD',
  },
  {
    match: /^ONE DAY \(SOL\)$/,
    format: (_parts, language) => language === 'pt-BR' ? 'UM DIA (SOL)' : 'UN DÍA (SOL)',
  },
  {
    match: /^AIRLOCK$/,
    format: (_parts, language) => language === 'pt-BR' ? 'CÂMARA DE DESCOMPRESSÃO' : 'CÁMARA DE DESCOMPRESIÓN',
  },
  {
    match: /^BATTERY$/,
    format: (_parts, language) => language === 'pt-BR' ? 'BATERIA' : 'BATERÍA',
  },
  {
    match: /^NUCLEAR GENERATOR \(RTG\)$/,
    format: (_parts, language) => language === 'pt-BR' ? 'GERADOR NUCLEAR (RTG)' : 'GENERADOR NUCLEAR (RTG)',
  },
  {
    match: /^CREW FOOD AND WATER$/,
    format: (_parts, language) => language === 'pt-BR' ? 'COMIDA E ÁGUA DA EQUIPE' : 'COMIDA Y AGUA DE LA TRIPULACIÓN',
  },
  {
    match: /^YOUR HUNGER AND THIRST$/,
    format: (_parts, language) => language === 'pt-BR' ? 'SUA FOME E SEDE' : 'TU HAMBRE Y SED',
  },
  {
    match: /^SUIT AIR$/,
    format: (_parts, language) => language === 'pt-BR' ? 'AR DO TRAJE' : 'AIRE DEL TRAJE',
  },
  {
    match: /^ROCKET FUEL$/,
    format: (_parts, language) => language === 'pt-BR' ? 'COMBUSTÍVEL DO FOGUETE' : 'COMBUSTIBLE DEL COHETE',
  },
  {
    match: /^SOLAR STORM$/,
    format: (_parts, language) => language === 'pt-BR' ? 'TEMPESTADE SOLAR' : 'TORMENTA SOLAR',
  },
  {
    match: /^STORM SHELTER WALL$/,
    format: (_parts, language) => language === 'pt-BR' ? 'PAREDE DO ABRIGO CONTRA TEMPESTADES' : 'PARED DEL REFUGIO CONTRA TORMENTAS',
  },
  {
    match: /^PLANTS$/,
    format: (_parts, language) => language === 'pt-BR' ? 'PLANTAS' : 'PLANTAS',
  },
  {
    match: /^RADIO TO EARTH$/,
    format: (_parts, language) => language === 'pt-BR' ? 'RÁDIO PARA A TERRA' : 'RADIO A LA TIERRA',
  },
  {
    match: /^SOLAR CONJUNCTION$/,
    format: (_parts, language) => language === 'pt-BR' ? 'CONJUNÇÃO SOLAR' : 'CONJUNCIÓN SOLAR',
  },
  {
    match: /^NORMAL RADIATION$/,
    format: (_parts, language) => language === 'pt-BR' ? 'RADIAÇÃO NORMAL' : 'RADIACIÓN NORMAL',
  },
  {
    match: /^1 real day of the storm trip = 1 game hour of warning\. The storms come from real NASA DONKI data\.$/,
    format: (_parts, language) => language === 'pt-BR'
      ? '1 dia real de percurso da tempestade = 1 hora de aviso no jogo. As tempestades vêm de dados reais do NASA DONKI.'
      : '1 día real de recorrido de la tormenta = 1 hora de aviso en el juego. Las tormentas provienen de datos reales de NASA DONKI.',
  },
];

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

export function readLanguagePreference(storage: Pick<Storage, 'getItem'>): Language {
  try {
    const value = storage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(value) ? value : 'en';
  } catch {
    return 'en';
  }
}

export function translate(text: string, language: Language): string {
  if (language === 'en') return text;
  const literal = TRANSLATIONS[language][text];
  if (literal) return literal;
  const whitespace = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (whitespace && whitespace[2] && whitespace[2] !== text) {
    return `${whitespace[1]}${translate(whitespace[2], language)}${whitespace[3]}`;
  }
  const pattern = DYNAMIC_PATTERNS.find((entry) => entry.match.test(text));
  if (pattern) return pattern.format(text.match(pattern.match)!, language);
  if (text.includes('\n')) return text.split('\n').map((line) => translate(line, language)).join('\n');
  return text;
}

export function checkTranslationCoverage(): Record<Exclude<Language, 'en'>, string[]> {
  const englishKeys = new Set([...Object.keys(PT_BR), ...Object.keys(ES)]);
  return {
    'pt-BR': [...englishKeys].filter((key) => !PT_BR[key]),
    es: [...englishKeys].filter((key) => !ES[key]),
  };
}

export function checkGameplayTranslationCoverage(): Record<Exclude<Language, 'en'>, string[]> {
  const ptBr = { ...GAMEPLAY_PT_BR, ...GAMEPLAY_EXT_PT_BR };
  Object.assign(ptBr, STATION_COPY_PT_BR);
  Object.assign(ptBr, SCIENCE_COPY_PT_BR);
  Object.assign(ptBr, RESEARCH_COPY_PT_BR);
  Object.assign(ptBr, SCANNER_COPY_PT_BR);
  Object.assign(ptBr, HUD_COPY_PT_BR);
  Object.assign(ptBr, CORE_COPY_PT_BR);
  Object.assign(ptBr, STORY_PT_BR, ACT_STEPS_PT_BR, GYM_PT_BR, STORY_MORE_PT_BR, CUTSCENE_PT_BR, FIRST_ICE_PT_BR, STORM_SCANS_PT_BR);
  const es = {
    ...GAMEPLAY_ES, ...GAMEPLAY_EXT_ES, ...STATION_COPY_ES, ...SCIENCE_COPY_ES, ...RESEARCH_COPY_ES,
    ...SCANNER_COPY_ES, ...HUD_COPY_ES, ...CORE_COPY_ES, ...STORY_ES, ...ACT_STEPS_ES, ...GYM_ES, ...STORY_MORE_ES,
    ...CUTSCENE_ES, ...FIRST_ICE_ES, ...STORM_SCANS_ES,
  };
  const allEnglishCopy = { ...ptBr, ...es };
  const gameplayKeys = Object.keys(allEnglishCopy);
  const unchangedByDesign = new Set([
    'NASA RadLab + DONKI', 'NASA ICES 2024: Sabatier', 'NASA OSDR RadLab (Curiosity MSL-RAD, LRO CRaTER)',
    'NASA Science: Deimos', 'NASA JPL, 2017; NASA DONKI', 'Quinn et al., UNH (PREDICCS)',
    'NASA RadLab (Curiosity MSL-RAD)', 'base',
    'DEIMOS', 'HABITAT', 'Mouse', 'Shift', '[Enter]', 'DOSE', 'Volume', 'SOL 1',
  ]);
  return {
    'pt-BR': gameplayKeys.filter((key) => !ptBr[key] || (!unchangedByDesign.has(key) && ptBr[key] === key)),
    es: gameplayKeys.filter((key) => !es[key] || (!unchangedByDesign.has(key) && es[key] === key)),
  };
}

let activeLanguage: Language = 'en';
let observer: MutationObserver | undefined;
const originalText = new WeakMap<CharacterData, string>();
const renderedText = new WeakMap<CharacterData, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const renderedAttributes = new WeakMap<Element, Map<string, string>>();
const LOCALIZED_ATTRIBUTES = ['aria-label', 'title', 'placeholder', 'alt'] as const;

function translateTextNode(node: CharacterData, force = false): void {
  const current = node.data;
  const lastRendered = renderedText.get(node);
  if (!force && lastRendered === current) return;

  let source = originalText.get(node);
  if (source === undefined || (!force && current !== lastRendered && current !== source)) {
    source = current;
    originalText.set(node, source);
  }
  const next = translate(source, activeLanguage);
  renderedText.set(node, next);
  if (next !== current) node.data = next;
}

function translateElementAttributes(element: Element, force = false): void {
  let originals = originalAttributes.get(element);
  let rendered = renderedAttributes.get(element);
  if (!originals) { originals = new Map(); originalAttributes.set(element, originals); }
  if (!rendered) { rendered = new Map(); renderedAttributes.set(element, rendered); }
  for (const name of LOCALIZED_ATTRIBUTES) {
    const current = element.getAttribute(name);
    if (current === null) continue;
    const lastRendered = rendered.get(name);
    if (!force && lastRendered === current) continue;
    let source = originals.get(name);
    if (source === undefined || (!force && current !== lastRendered && current !== source)) {
      source = current;
      originals.set(name, source);
    }
    const next = translate(source, activeLanguage);
    rendered.set(name, next);
    if (next !== current) element.setAttribute(name, next);
  }
}

function visit(root: Node, force = false): void {
  if (root.nodeType === Node.TEXT_NODE || root.nodeType === Node.CDATA_SECTION_NODE) {
    translateTextNode(root as CharacterData, force);
  }
  if (root instanceof Element) translateElementAttributes(root, force);
  if (root instanceof Document || root instanceof DocumentFragment || root instanceof Element) {
    const rootDocument = root instanceof Document ? root : root.ownerDocument;
    if (!rootDocument) return;
    const walker = rootDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) translateTextNode(node as CharacterData, force);
    if (root instanceof Element) {
      for (const element of root.querySelectorAll('*')) translateElementAttributes(element, force);
    } else {
      for (const element of root.querySelectorAll?.('*') ?? []) translateElementAttributes(element, force);
    }
  }
}

export function setLanguage(language: Language, storage?: Pick<Storage, 'setItem'>): void {
  activeLanguage = language;
  let targetStorage = storage;
  if (!targetStorage && typeof window !== 'undefined') {
    try { targetStorage = window.localStorage; } catch { /* Storage can be unavailable in private contexts. */ }
  }
  try { targetStorage?.setItem(LANGUAGE_STORAGE_KEY, language); } catch { /* Storage can be unavailable in private contexts. */ }
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
  visit(document, true);
}

export function getLanguage(): Language {
  return activeLanguage;
}

export function startLocalization(): Language {
  let language: Language = 'en';
  if (typeof window !== 'undefined') {
    try { language = readLanguagePreference(window.localStorage); } catch { /* Use English when storage is unavailable. */ }
  }
  activeLanguage = language;
  if (typeof document === 'undefined') return language;
  document.documentElement.lang = language;
  visit(document, true);
  observer?.disconnect();
  observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData' && record.target instanceof CharacterData) {
        translateTextNode(record.target);
      } else if (record.type === 'childList') {
        record.addedNodes.forEach((node) => visit(node));
      } else if (record.type === 'attributes' && record.target instanceof Element && record.attributeName) {
        translateElementAttributes(record.target);
      }
    }
  });
  observer.observe(document.documentElement, {
    subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: [...LOCALIZED_ATTRIBUTES],
  });
  return language;
}
