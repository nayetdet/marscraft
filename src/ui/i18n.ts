import { GYM_ES, GYM_PT_BR } from '../story/acts/act3Gym.ts';
import {
  CUTSCENE_ES, CUTSCENE_PT_BR, STORY_ES, STORY_MORE_ES, STORY_MORE_PT_BR, STORY_PT_BR,
} from './i18nStory.ts';

export const LANGUAGE_STORAGE_KEY = 'marscraft.language';

export const LANGUAGES = ['en', 'pt-BR', 'es'] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: '🇺🇸 English',
  'pt-BR': '🇧🇷 Português (Brasil)',
  es: '🇪🇸 Español',
};

// English is the source key. Keep every visible string that is translated here in
// both catalogs; checkTranslationCoverage() makes missing language entries testable.
const PT_BR: Record<string, string> = {
  ...STORY_PT_BR,
  ...GYM_PT_BR,
  ...STORY_MORE_PT_BR,
  ...CUTSCENE_PT_BR,
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
  'Game volume': 'Volume do jogo', Graphics: 'Gráficos',
  'Real-time sun shadows, glow and light rays. Turn off if the game feels slow.': 'Sombras do Sol em tempo real, brilho e raios de luz. Desative se o jogo ficar lento.',
  'Shaders: Off': 'Efeitos gráficos: desligados', 'Shaders: On': 'Efeitos gráficos: ligados',
  Language: 'Idioma', 'Choose the language used throughout the game.': 'Escolha o idioma usado no jogo.',
  '🇺🇸 English': '🇺🇸 Inglês', '🇧🇷 Português (Brasil)': '🇧🇷 Português (Brasil)', '🇪🇸 Español': '🇪🇸 Espanhol',
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
  ...STORY_ES,
  ...GYM_ES,
  ...STORY_MORE_ES,
  ...CUTSCENE_ES,
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
  'Game volume': 'Volumen del juego', Graphics: 'Gráficos',
  'Real-time sun shadows, glow and light rays. Turn off if the game feels slow.': 'Sombras del Sol en tiempo real, brillo y rayos de luz. Desactívalos si el juego va lento.',
  'Shaders: Off': 'Efectos gráficos: desactivados', 'Shaders: On': 'Efectos gráficos: activados',
  Language: 'Idioma', 'Choose the language used throughout the game.': 'Elige el idioma del juego.',
  '🇺🇸 English': '🇺🇸 Inglés', '🇧🇷 Português (Brasil)': '🇧🇷 Portugués (Brasil)', '🇪🇸 Español': '🇪🇸 Español',
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

const DYNAMIC_PATTERNS: Array<{
  match: RegExp;
  format: (parts: RegExpMatchArray, language: Language) => string;
}> = [
  {
    match: /^Real data from (.+)$/,
    format: ([, date], language) => language === 'pt-BR' ? `Dados reais de ${date}` : `Datos reales del ${date}`,
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
    match: /^(Based on|Happening right now in real life): a real CME that left the Sun on (.+) at (.+) km\/s, headed to Mars \((.+)\)$/,
    format: ([, basis, date, speed, source], language) => language === 'pt-BR'
      ? `${basis === 'Based on' ? 'Com base em' : 'Acontecendo agora na vida real:'} uma EMC real que saiu do Sol em ${date} a ${speed} km/s, a caminho de Marte (${translate(source, language)})`
      : `${basis === 'Based on' ? 'Basado en' : 'Ocurriendo ahora en la vida real:'} una EMC real que salió del Sol el ${date} a ${speed} km/s, rumbo a Marte (${translate(source, language)})`,
  },
  {
    match: /^(Based on|Happening right now in real life): a real burst of fast particles \(an SEP\) seen on (.+) by (.+) \((.+)\)$/,
    format: ([, basis, date, spacecraft, source], language) => language === 'pt-BR'
      ? `${basis === 'Based on' ? 'Com base em' : 'Acontecendo agora na vida real:'} um surto real de partículas rápidas (SEP), observado em ${date} pela ${spacecraft} (${translate(source, language)})`
      : `${basis === 'Based on' ? 'Basado en' : 'Ocurriendo ahora en la vida real:'} un estallido real de partículas rápidas (SEP), observado el ${date} por ${spacecraft} (${translate(source, language)})`,
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
      ? `TEMPESTADE SOLAR: a caminho, chega a Marte em ${time} de tempo de jogo.\n${translate(arrival, language)}. ${translate(source, language)}.`
      : `TORMENTA SOLAR: en camino, llega a Marte en ${time} de tiempo de juego.\n${translate(arrival, language)}. ${translate(source, language)}.`,
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
    // Boletim: ciencia que ficou em Marte x traje melhorado (#417)
    match: /^Science kept on Mars: (\d+) pts\. Suit: (\d+)% less radiation outside$/,
    format: ([, points, cut], language) => language === 'pt-BR'
      ? `Ciência que ficou em Marte: ${points} pts. Traje: ${cut}% menos radiação lá fora`
      : `Ciencia que se quedó en Marte: ${points} pts. Traje: ${cut}% menos radiación afuera`,
  },
  {
    match: /^Science kept on Mars: (\d+) pts\. No suit upgrade$/,
    format: ([, points], language) => language === 'pt-BR'
      ? `Ciência que ficou em Marte: ${points} pts. Traje sem melhoria`
      : `Ciencia que se quedó en Marte: ${points} pts. Traje sin mejora`,
  },
  {
    match: /^Total radiation: (.+) mSv$/,
    format: ([, value], language) => language === 'pt-BR' ? `Radiação total: ${value} mSv` : `Radiación total: ${value} mSv`,
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
  return pattern ? pattern.format(text.match(pattern.match)!, language) : text;
}

export function checkTranslationCoverage(): Record<Exclude<Language, 'en'>, string[]> {
  const englishKeys = new Set([...Object.keys(PT_BR), ...Object.keys(ES)]);
  return {
    'pt-BR': [...englishKeys].filter((key) => !PT_BR[key]),
    es: [...englishKeys].filter((key) => !ES[key]),
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
