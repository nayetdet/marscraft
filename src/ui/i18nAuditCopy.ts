// Player-facing copy found by the localization audit of 15/11/2026: story acts 2 to 5, airlock,
// greenhouse, items, station panels and dynamic messages that were still falling back to English.
// Each row is [English source, pt-BR, es], so the two catalogs can never drift apart.

type Row = readonly [en: string, ptBr: string, es: string];

const COPY: readonly Row[] = [
  // Base decor and prompts
  ['[F] Exit the rover', '[F] Sair do rover', '[F] Salir del rover'],
  ['Tap TALK to exit the rover', 'Toque em FALAR para sair do rover', 'Toca HABLAR para salir del rover'],
  ['BASE WATER', 'ÁGUA DA BASE', 'AGUA DE LA BASE'],
  ['[F] Check the water tank', '[F] Ver o tanque de água', '[F] Ver el tanque de agua'],
  ['Check the water tank', 'Ver o tanque de água', 'Ver el tanque de agua'],
  ['[F] Look at the medical bay', '[F] Olhar a enfermaria', '[F] Mirar la enfermería'],
  ['Look at the medical bay', 'Olhar a enfermaria', 'Mirar la enfermería'],
  ['First aid for the crew is kept here. Food and rest heal you, but a radiation dose can never be erased, so avoid it.', 'Os primeiros socorros da tripulação ficam aqui. Comida e descanso curam você, mas a dose de radiação nunca se apaga. Por isso, evite a radiação.', 'Aquí se guardan los primeros auxilios de la tripulación. La comida y el descanso te curan, pero la dosis de radiación nunca se borra. Por eso, evita la radiación.'],
  ['[F] Look at the suit locker', '[F] Olhar o armário dos trajes', '[F] Mirar el armario de los trajes'],
  ['Look at the suit locker', 'Olhar o armário dos trajes', 'Mirar el armario de los trajes'],
  ['Mars dust sticks to spacesuits. The airlock cleans your suit with electricity before you come in. With no power, the dust comes inside with you!', 'A poeira de Marte gruda nos trajes. A câmara de ar limpa o seu traje com eletricidade antes de você entrar. Sem energia, a poeira entra com você!', 'El polvo de Marte se pega a los trajes. La esclusa limpia tu traje con electricidad antes de que entres. Sin energía, ¡el polvo entra contigo!'],
  ['CREW QUARTERS', 'DORMITÓRIO', 'DORMITORIO'],
  ['COMMON AREA', 'ÁREA COMUM', 'ÁREA COMÚN'],
  ['MEDICAL BAY', 'ENFERMARIA', 'ENFERMERÍA'],
  ['MAIN HAB', 'HABITAT PRINCIPAL', 'HÁBITAT PRINCIPAL'],
  ['SOLAR FIELD', 'CAMPO SOLAR', 'CAMPO SOLAR'],
  ['SAMPLE FIELD', 'CAMPO DE AMOSTRAS', 'CAMPO DE MUESTRAS'],
  ['FOOD MONITOR', 'MONITOR DE ALIMENTOS', 'MONITOR DE ALIMENTOS'],
  ['WATER TAP', 'TORNEIRA DE ÁGUA', 'GRIFO DE AGUA'],
  ['Garden bed', 'Canteiro', 'Bancal'],
  ['Inner field', 'Canteiro de dentro', 'Campo interior'],
  ['Outer field', 'Canteiro de fora', 'Campo exterior'],
  ['Temporary Martian footprints', 'Pegadas temporárias em Marte', 'Huellas temporales en Marte'],

  // Greenhouse care
  ['Lights OFF in the power room', 'Luzes DESLIGADAS na sala de energia', 'Luces APAGADAS en la sala de energía'],
  ['Too cold: turn the heater on', 'Frio demais: ligue o aquecedor', 'Demasiado frío: enciende la calefacción'],
  ['No power for the LEDs', 'Sem energia para os LEDs', 'Sin energía para los LED'],
  ['Red and blue LEDs on', 'LEDs vermelhos e azuis ligados', 'LED rojos y azules encendidos'],
  ['Tank empty: bring ice', 'Tanque vazio: traga gelo', 'Tanque vacío: trae hielo'],
  ['LED LIGHT', 'LUZ DE LED', 'LUZ LED'],
  ['RECYCLED WATER', 'ÁGUA RECICLADA', 'AGUA RECICLADA'],
  ['Airlock kept the dust out', 'A câmara de ar deixou a poeira lá fora', 'La esclusa dejó el polvo afuera'],
  ['Dust inside: clean the habitat', 'Poeira aqui dentro: limpe o habitat', 'Polvo adentro: limpia el hábitat'],
  ['SPACE SCIENCE ON EARTH', 'CIÊNCIA ESPACIAL NA TERRA', 'CIENCIA ESPACIAL EN LA TIERRA'],
  ['First lettuce harvest!', 'Primeira colheita de alface!', '¡Primera cosecha de lechuga!'],
  ['Fresh food keeps the crew healthy and happy', 'Comida fresca deixa a tripulação saudável e feliz', 'La comida fresca mantiene a la tripulación sana y feliz'],
  ['Astronauts ate space lettuce in 2015', 'Astronautas comeram alface espacial em 2015', 'Los astronautas comieron lechuga espacial en 2015'],
  ['NASA Veggie on the Space Station. Plant studies: NASA OSDR', 'NASA Veggie na Estação Espacial. Estudos de plantas: NASA OSDR', 'NASA Veggie en la Estación Espacial. Estudios de plantas: NASA OSDR'],
  ['First potato harvest!', 'Primeira colheita de batata!', '¡Primera cosecha de papa!'],
  ['Mars soil has perchlorate salts', 'O solo de Marte tem sais de perclorato', 'El suelo de Marte tiene sales de perclorato'],
  ['So we grow plants in water, not soil', 'Por isso plantamos na água, não na terra', 'Por eso cultivamos en agua, no en tierra'],
  ['Earth: city vertical farms do the same', 'Na Terra: fazendas verticais nas cidades fazem igual', 'En la Tierra: las granjas verticales de las ciudades hacen lo mismo'],
  ['Perchlorate found in Mars soil by NASA Phoenix (2008). CSA: Food production toolkit', 'Perclorato achado no solo de Marte pela NASA Phoenix (2008). CSA: kit de produção de alimentos', 'Perclorato hallado en el suelo de Marte por la NASA Phoenix (2008). CSA: kit de producción de alimentos'],
  ['First soy harvest!', 'Primeira colheita de soja!', '¡Primera cosecha de soja!'],
  ['Our greenhouse reuses its water', 'A nossa estufa reaproveita a água', 'Nuestro invernadero reutiliza su agua'],
  ['Earth: closed greenhouses grow food in the Canadian Arctic', 'Na Terra: estufas fechadas produzem comida no Ártico do Canadá', 'En la Tierra: invernaderos cerrados producen comida en el Ártico de Canadá'],
  ['CSA: Food production on the Moon and in remote areas', 'CSA: produção de alimentos na Lua e em áreas remotas', 'CSA: producción de alimentos en la Luna y en zonas remotas'],
  ['You grew every crop!', 'Você plantou de tudo!', '¡Cultivaste todas las plantas!'],
  ['Red and blue LEDs feed the plants', 'LEDs vermelhos e azuis alimentam as plantas', 'Los LED rojos y azules alimentan a las plantas'],
  ['Earth: indoor farms use LEDs to save power', 'Na Terra: fazendas fechadas usam LEDs para gastar menos energia', 'En la Tierra: las granjas de interior usan LED para ahorrar energía'],
  ['NASA Veggie uses red and blue LED light. CSA: Food production toolkit', 'A NASA Veggie usa luz de LED vermelha e azul. CSA: kit de produção de alimentos', 'NASA Veggie usa luz LED roja y azul. CSA: kit de producción de alimentos'],

  // Items and blocks
  ['DUNE SAND', 'AREIA DE DUNA', 'ARENA DE DUNA'],
  ['ICE CORE', 'NÚCLEO DE GELO', 'NÚCLEO DE HIELO'],
  ['Mars carrot', 'cenoura de Marte', 'zanahoria de Marte'],
  ['Martian ice block', 'Bloco de gelo marciano', 'Bloque de hielo marciano'],
  ['Ice sensor online: nearby ice deposits highlighted', 'Sensor de gelo ligado: o gelo por perto está destacado', 'Sensor de hielo encendido: el hielo cercano está resaltado'],

  // Engine messages and sources
  ['Trip dose: Curiosity RAD inside its spacecraft on the way to Mars, 1.8 mSv per day (Zeitlin et al., Science, 2013), for a 203-day trip like Mars 2020.', 'Dose da viagem: instrumento RAD do Curiosity dentro da nave a caminho de Marte, 1,8 mSv por dia (Zeitlin et al., Science, 2013), em uma viagem de 203 dias como a da Mars 2020.', 'Dosis del viaje: instrumento RAD de Curiosity dentro de su nave rumbo a Marte, 1,8 mSv por día (Zeitlin et al., Science, 2013), en un viaje de 203 días como el de Mars 2020.'],
  ['Sunlight on Mars: 43% of Earth (NASA Mars Fact Sheet).', 'Luz do Sol em Marte: 43% da que chega à Terra (NASA Mars Fact Sheet).', 'Luz del Sol en Marte: 43% de la que llega a la Tierra (NASA Mars Fact Sheet).'],
  ['Crew needs: NASA Baseline Values and Assumptions Document. Water recycling: 98%, like the Space Station.', 'Necessidades da tripulação: NASA Baseline Values and Assumptions Document. Reciclagem de água: 98%, como na Estação Espacial.', 'Necesidades de la tripulación: NASA Baseline Values and Assumptions Document. Reciclaje de agua: 98%, como en la Estación Espacial.'],
  ['Storm shelter water wall: PREDICCS shielding model (University of New Hampshire, Curiosity RAD data) and NASA storm shelter studies.', 'Parede de água do abrigo: modelo de blindagem PREDICCS (Universidade de New Hampshire, dados do RAD do Curiosity) e estudos da NASA sobre abrigos contra tempestades.', 'Pared de agua del refugio: modelo de blindaje PREDICCS (Universidad de New Hampshire, datos del RAD de Curiosity) y estudios de la NASA sobre refugios contra tormentas.'],
  ['Trip time, thin air and launch windows: NASA Mars facts.', 'Tempo de viagem, ar rarefeito e janelas de lançamento: fatos sobre Marte da NASA.', 'Duración del viaje, aire tenue y ventanas de lanzamiento: datos de Marte de la NASA.'],
  ['The storm keeps adding more dust!', 'A tempestade continua cobrindo tudo de poeira!', '¡La tormenta sigue trayendo más polvo!'],
  ['Real case: gusts of wind cleaned the panels of NASA rovers Spirit and Opportunity.', 'Caso real: rajadas de vento limparam os painéis dos rovers Spirit e Opportunity da NASA.', 'Caso real: ráfagas de viento limpiaron los paneles de los rovers Spirit y Opportunity de la NASA.'],
  ['BASE BREACH', 'VAZAMENTO NA BASE', 'FUGA EN LA BASE'],
  ['AIR LEAK!', 'VAZAMENTO DE AR!', '¡FUGA DE AIRE!'],
  ['The rest is in the basket.', 'O restante está na cesta.', 'El resto está en la cesta.'],
  ['Suit air', 'Ar do traje', 'Aire del traje'],
  ['Rocket fuel', 'Combustível do foguete', 'Combustible del cohete'],
  ['Based on', 'Baseado em', 'Basado en'],
  ['No water ice nearby. Navigate to Northeast Ice Crater!', 'Não há gelo de água por perto. Vá até a Cratera de Gelo do Nordeste!', 'No hay hielo de agua cerca. ¡Ve al Cráter de Hielo del Noreste!'],
  ['Rover battery too low to drill. Park at the base depot to charge.', 'A bateria do rover está baixa demais para perfurar. Estacione no depósito da base para carregar.', 'La batería del rover está demasiado baja para perforar. Estaciónalo en el depósito de la base para cargarlo.'],
  ['Not in range of base water converter intake.', 'Longe demais da entrada do conversor de água da base.', 'Demasiado lejos de la entrada del convertidor de agua de la base.'],

  // Airlock
  ['Airlock cycling. Please wait.', 'A câmara de ar está trabalhando. Espere um pouco.', 'La esclusa está funcionando. Espera un momento.'],
  ['Move clear of the door.', 'Saia da frente da porta.', 'Apártate de la puerta.'],
  ['Closing airlock door.', 'Fechando a porta da câmara de ar.', 'Cerrando la puerta de la esclusa.'],
  ['Equip EVA Suit at Suitport [F] before exiting.', 'Vista o traje no suporte de trajes [F] antes de sair.', 'Ponte el traje en el puerto de trajes [F] antes de salir.'],
  ['Move clear of the other door.', 'Saia da frente da outra porta.', 'Apártate de la otra puerta.'],
  ['No power: opening the airlock by hand. It takes longer.', 'Sem energia: abrindo a câmara de ar na mão. Demora mais.', 'Sin energía: abriendo la esclusa a mano. Tarda más.'],
  ['Opening airlock: filling it with air first.', 'Abrindo a câmara de ar: primeiro ela se enche de ar.', 'Abriendo la esclusa: primero se llena de aire.'],
  ['Opening airlock: pumping the air out first.', 'Abrindo a câmara de ar: primeiro o ar é bombeado para fora.', 'Abriendo la esclusa: primero se bombea el aire hacia fuera.'],

  // Act 2
  ['Rare scan outside, only during the storm: scan the dusty sky.', 'Escaneamento raro lá fora, só durante a tempestade: escaneie o céu cheio de poeira.', 'Escaneo raro afuera, solo durante la tormenta: escanea el cielo lleno de polvo.'],
  ['DUST ON THE PANELS', 'POEIRA NOS PAINÉIS', 'POLVO EN LOS PANELES'],
  ['Clean now or wait? You decide', 'Limpar agora ou esperar? Você decide', '¿Limpiar ahora o esperar? Tú decides'],
  ['CLEAN NOW', 'LIMPAR AGORA', 'LIMPIAR AHORA'],
  ['Keeps the power up', 'Mantém a energia alta', 'Mantiene la energía alta'],
  ['Suit wears, dust comes back', 'O traje gasta e a poeira volta', 'El traje se desgasta y el polvo vuelve'],
  ['WAIT INSIDE', 'ESPERAR LÁ DENTRO', 'ESPERAR ADENTRO'],
  ['Suit stays whole', 'O traje fica inteiro', 'El traje queda entero'],
  ['Battery drops all storm', 'A bateria cai a tempestade toda', 'La batería baja toda la tormenta'],
  ['Real: Moon dust wore down the Apollo spacesuits (NASA/TM-2005-213610). The storm rule is a game rule.', 'Real: a poeira da Lua gastou os trajes das missões Apollo (NASA/TM-2005-213610). A regra da tempestade é uma regra do jogo.', 'Real: el polvo de la Luna desgastó los trajes de las misiones Apolo (NASA/TM-2005-213610). La regla de la tormenta es una regla del juego.'],
  ['YOU FOUND THE LEAK', 'VOCÊ ACHOU O VAZAMENTO', 'ENCONTRASTE LA FUGA'],
  ['This window is cracked', 'Esta janela está rachada', 'Esta ventana está agrietada'],
  ['Space Station crews hunt leaks by sound', 'As tripulações da Estação Espacial procuram vazamentos pelo som', 'Las tripulaciones de la Estación Espacial buscan fugas por el sonido'],
  ['Real: in 2020 the Space Station crew used an ultrasonic leak detector to find an air leak (NASA).', 'Real: em 2020 a tripulação da Estação Espacial usou um detector ultrassônico para achar um vazamento de ar (NASA).', 'Real: en 2020 la tripulación de la Estación Espacial usó un detector ultrasónico para encontrar una fuga de aire (NASA).'],
  ['EARTH IS NOT UP', 'A TERRA NÃO ESTÁ NO CÉU', 'LA TIERRA NO ESTÁ EN EL CIELO'],
  ['Earth is below the horizon right now', 'A Terra está abaixo do horizonte agora', 'La Tierra está bajo el horizonte ahora'],
  ['Scan the Sun or a moon instead', 'Escaneie o Sol ou uma lua', 'Escanea el Sol o una luna'],
  ['BASE WINDOW', 'JANELA DA BASE', 'VENTANA DE LA BASE'],
  ['WINDOW OK', 'JANELA OK', 'VENTANA OK'],
  ['YOUR PROGRESS', 'O SEU PROGRESSO', 'TU PROGRESO'],
  ['This counts everything you found. Fill it to rank up!', 'Aqui conta tudo o que você achou. Encha para subir de nível!', 'Aquí cuenta todo lo que encontraste. ¡Llénalo para subir de rango!'],
  ['THE PAGES', 'AS PÁGINAS', 'LAS PÁGINAS'],
  ['FINDS shows your scans. LOG keeps your choices. The other two show real NASA science.', 'ACHADOS mostra os seus escaneamentos. REGISTRO guarda as suas escolhas. As outras duas mostram ciência de verdade da NASA.', 'HALLAZGOS muestra tus escaneos. REGISTRO guarda tus decisiones. Las otras dos muestran ciencia real de la NASA.'],
  ['A FIND CARD', 'UMA FICHA DE ACHADO', 'UNA FICHA DE HALLAZGO'],
  ['Each scan becomes a card. Pick one to read its real facts.', 'Cada escaneamento vira uma ficha. Escolha uma para ler os fatos reais.', 'Cada escaneo se convierte en una ficha. Elige una para leer sus datos reales.'],

  // Act 3
  ['NIGHT IS COMING', 'A NOITE ESTÁ CHEGANDO', 'LLEGA LA NOCHE'],
  ['Plants only grow with the lights on', 'As plantas só crescem com as luzes ligadas', 'Las plantas solo crecen con las luces encendidas'],
  ['No Sun at night: lights eat battery', 'Sem Sol à noite: as luzes gastam bateria', 'Sin Sol de noche: las luces gastan batería'],
  ['LIGHTS ON', 'LUZES LIGADAS', 'LUCES ENCENDIDAS'],
  ['Plant keeps growing', 'A planta continua crescendo', 'La planta sigue creciendo'],
  ['LIGHTS OFF', 'LUZES DESLIGADAS', 'LUCES APAGADAS'],
  ['Plant stops until morning', 'A planta para até de manhã', 'La planta se detiene hasta la mañana'],
  ['Battery numbers are a game forecast, not NASA data', 'Os números da bateria são uma previsão do jogo, não dados da NASA', 'Los números de la batería son un pronóstico del juego, no datos de la NASA'],
  ['Greenhouse lights ON tonight: the plant grows, the battery drains faster.', 'Luzes da estufa LIGADAS esta noite: a planta cresce e a bateria acaba mais rápido.', 'Luces del invernadero ENCENDIDAS esta noche: la planta crece y la batería se gasta más rápido.'],
  ['Greenhouse lights OFF tonight: the battery lasts longer, the plant waits. Turn them on in the power room.', 'Luzes da estufa DESLIGADAS esta noite: a bateria dura mais e a planta espera. Ligue as luzes na sala de energia.', 'Luces del invernadero APAGADAS esta noche: la batería dura más y la planta espera. Enciéndelas en la sala de energía.'],
  ['Kitchen: press F on the cook, then eat the ration', 'Cozinha: aperte F no cozinheiro e depois coma a ração', 'Cocina: pulsa F sobre el cocinero y luego come la ración'],
  ['Get a ration from the cook in the kitchen and eat it', 'Pegue uma ração com o cozinheiro na cozinha e coma', 'Pide una ración al cocinero en la cocina y cómela'],
  ['KITCHEN: press F on the cook', 'COZINHA: aperte F no cozinheiro', 'COCINA: pulsa F sobre el cocinero'],
  ['Pick the ration, then right-click to eat', 'Escolha a ração e clique com o botão direito para comer', 'Elige la ración y haz clic derecho para comer'],
  ['Harvest! The cook can turn each plant into a ration for the crew.', 'Colheita! O cozinheiro pode transformar cada planta em uma ração para a tripulação.', '¡Cosecha! El cocinero puede convertir cada planta en una ración para la tripulación.'],

  // Act 4

  // Act 5 and chapters
  ['Go to the rocket and press IGNITE. The base stays as it is.', 'Vá até o foguete e aperte DECOLAR. A base fica como está.', 'Ve al cohete y pulsa DESPEGAR. La base queda como está.'],
  ['The solar panels are already clean. Nothing to pay.', 'Os painéis solares já estão limpos. Não há nada a pagar.', 'Los paneles solares ya están limpios. No hay nada que pagar.'],
  ['Not enough launch window left to tidy the base.', 'Não sobra tempo de janela de lançamento para arrumar a base.', 'No queda tiempo de ventana de lanzamiento para ordenar la base.'],
  ['The launch window is open', 'A janela de lançamento está aberta', 'La ventana de lanzamiento está abierta'],
  ['Get the ice the rocket needs', 'Pegue o gelo de que o foguete precisa', 'Consigue el hielo que necesita el cohete'],
  ['Press IGNITE before the window closes', 'Aperte DECOLAR antes de a janela fechar', 'Pulsa DESPEGAR antes de que se cierre la ventana'],
  ['A NEW LAUNCH WINDOW', 'UMA NOVA JANELA DE LANÇAMENTO', 'UNA NUEVA VENTANA DE LANZAMIENTO'],
  ['The crew waited for the next window', 'A tripulação esperou a próxima janela', 'La tripulación esperó la siguiente ventana'],
  ['Fill the rocket and press IGNITE', 'Encha o foguete e aperte DECOLAR', 'Llena el cohete y pulsa DESPEGAR'],
  ['FREE PLAY', 'MODO LIVRE', 'JUEGO LIBRE'],
  ['The rocket is on its way home', 'O foguete está a caminho de casa', 'El cohete va camino a casa'],
  ['No deadline now: the base is yours', 'Agora não há prazo: a base é sua', 'Ya no hay plazo: la base es tuya'],
  ['Storms and Mars events still come', 'As tempestades e os eventos de Marte continuam', 'Las tormentas y los eventos de Marte siguen llegando'],
  ['DUST STORM', 'TEMPESTADE DE POEIRA', 'TORMENTA DE POLVO'],

  // First-time moments
  ['SUIT ON!', 'TRAJE VESTIDO!', '¡TRAJE PUESTO!'],
  ['FIRST RATION!', 'PRIMEIRA RAÇÃO!', '¡PRIMERA RACIÓN!'],
  ['FROM PLANT TO PLATE', 'DA PLANTA AO PRATO', 'DE LA PLANTA AL PLATO'],
  ['The cook made a ration from your plant', 'O cozinheiro fez uma ração com a sua planta', 'El cocinero hizo una ración con tu planta'],
  ['NASA freeze-dries and packs food for astronauts', 'A NASA desidrata no frio e embala a comida dos astronautas', 'La NASA liofiliza y envasa la comida de los astronautas'],
  ['Food for long missions must stay good for up to 5 years', 'A comida de missões longas precisa durar até 5 anos', 'La comida de las misiones largas debe durar hasta 5 años'],

  // Station panels and journal
  ['No big choices this sol.', 'Nenhuma escolha grande neste sol.', 'Ninguna decisión grande en este sol.'],
  ['LED TO', 'LEVOU A', 'LLEVÓ A'],
  ['Open study', 'Abrir estudo', 'Abrir estudio'],
  ['Open on NASA OSDR', 'Abrir no NASA OSDR', 'Abrir en NASA OSDR'],
  ['More in your journal', 'Mais no seu diário', 'Más en tu diario'],
  ['To fit a whole mission into one play session, the game changes some numbers. Here is what is real and what is a game rule.', 'Para caber uma missão inteira em uma partida, o jogo muda alguns números. Veja o que é real e o que é regra do jogo.', 'Para que una misión entera quepa en una partida, el juego cambia algunos números. Mira qué es real y qué es regla del juego.'],
  ['BASE CONTROLS', 'CONTROLES DA BASE', 'CONTROLES DE LA BASE'],
  ['AIR ROOM', 'SALA DE AR', 'SALA DE AIRE'],
  ['OXYGEN SOURCE', 'FONTE DE OXIGÊNIO', 'FUENTE DE OXÍGENO'],
  ['MARS AIR', 'AR DE MARTE', 'AIRE DE MARTE'],
  ['BODY TELEMETRY', 'DADOS DO CORPO', 'DATOS DEL CUERPO'],
  ['WATER SHIELD', 'ESCUDO DE ÁGUA', 'ESCUDO DE AGUA'],
  ['ANALYZE HERE', 'ANALISAR AQUI', 'ANALIZAR AQUÍ'],
  ['TUBE TO EARTH', 'TUBO PARA A TERRA', 'TUBO A LA TIERRA'],
  ['SENT TO EARTH', 'ENVIADO À TERRA', 'ENVIADO A LA TIERRA'],
  ['Exercise bike', 'Bicicleta ergométrica', 'Bicicleta estática'],
  ['[A] Left pedal', '[A] Pedal esquerdo', '[A] Pedal izquierdo'],
  ['[D] Right pedal', '[D] Pedal direito', '[D] Pedal derecho'],
  ['[SPACE] Step', '[ESPAÇO] Passo', '[ESPACIO] Paso'],
  ['DRAG OR TAP CROP → BED', 'ARRASTE OU TOQUE: PLANTA → CANTEIRO', 'ARRASTRA O TOCA: PLANTA → BANCAL'],
  ['Real Case:', 'Caso real:', 'Caso real:'],
  ['Space Weather:', 'Clima espacial:', 'Clima espacial:'],
  ['Real Chemistry:', 'Química de verdade:', 'Química real:'],
  ['Earth Distance:', 'Distância da Terra:', 'Distancia a la Tierra:'],
  ['Water used so far:', 'Água usada até agora:', 'Agua usada hasta ahora:'],
  ["NASA's InSight lander shut down in 2022 when dust covered its solar panels.", 'A sonda InSight da NASA desligou em 2022, quando a poeira cobriu os seus painéis solares.', 'La sonda InSight de la NASA se apagó en 2022, cuando el polvo cubrió sus paneles solares.'],
  ['In 2018 NASA tested', 'Em 2018 a NASA testou o', 'En 2018 la NASA probó'],
  [', a small fission reactor that makes power day and night without sunlight. In the game it sits close to the base, so it adds radiation.', ', um pequeno reator de fissão que gera energia de dia e de noite, sem luz do Sol. No jogo ele fica perto da base, por isso aumenta a radiação.', ', un pequeño reactor de fisión que produce energía de día y de noche, sin luz del Sol. En el juego está cerca de la base, por eso añade radiación.'],
  ['36 g of water splits into 32 g of oxygen (ISS). A', '36 g de água viram 32 g de oxigênio (ISS). Um reator', '36 g de agua se convierten en 32 g de oxígeno (ISS). Un reactor'],
  ['reactor gives back half of that water!', 'devolve metade dessa água!', '¡devuelve la mitad de esa agua!'],
  ['A 10 cm water wall blocks about', 'Uma parede de água de 10 cm segura cerca de', 'Una pared de agua de 10 cm frena cerca del'],
  ['of a storm dose (game-scaled).', 'da dose de uma tempestade (na escala do jogo).', 'de la dosis de una tormenta (a escala del juego).'],
  ['NASA uses the', 'A NASA usa o sistema de alertas', 'La NASA usa el sistema de alertas'],
  ['alert system and', 'e as medições do', 'y las mediciones de'],
  ['measurements to warn astronauts before solar storms hit Mars.', 'para avisar os astronautas antes de as tempestades solares chegarem a Marte.', 'para avisar a los astronautas antes de que las tormentas solares lleguen a Marte.'],
  ['Real Mars rovers send data to an orbiter overhead (', 'Os rovers de verdade em Marte mandam os dados para um orbitador que passa no céu (', 'Los rovers reales de Marte envían sus datos a un orbitador que pasa por el cielo ('],
  ['), which beams it to Earth!', '), que repassa tudo para a Terra!', '), ¡que lo reenvía todo a la Tierra!'],
  ['Plants drink from the base tank and breathe water back for the recycler. NASA grew salad crops in 28 days on the Space Station.', 'As plantas bebem água do tanque da base e soltam água no ar, que volta para o reciclador. A NASA cultivou verduras em 28 dias na Estação Espacial.', 'Las plantas beben agua del tanque de la base y sueltan agua al aire, que vuelve al reciclador. La NASA cultivó verduras en 28 días en la Estación Espacial.'],
  ['Real CMEs (clouds of particles thrown by the Sun) that NASA predicted would reach Mars, listed by NASA DONKI. The warning time is the trip NASA predicted, squeezed so 1 real day is 1 game hour.', 'CMEs reais (nuvens de partículas lançadas pelo Sol) que a NASA previu que chegariam a Marte, listadas pelo NASA DONKI. O tempo de aviso é a viagem prevista pela NASA, encolhida para que 1 dia real seja 1 hora de jogo.', 'CME reales (nubes de partículas lanzadas por el Sol) que la NASA predijo que llegarían a Marte, según NASA DONKI. El tiempo de aviso es el viaje previsto por la NASA, reducido para que 1 día real sea 1 hora de juego.'],
  ['Solar storms shoot fast protons! Water is full of hydrogen, which slows protons down. Orion astronauts build shelters with their water and food bags.', 'As tempestades solares disparam prótons muito rápidos! A água é cheia de hidrogênio, que freia os prótons. Os astronautas da Orion montam abrigos com os sacos de água e de comida.', '¡Las tormentas solares disparan protones muy rápidos! El agua está llena de hidrógeno, que frena los protones. Los astronautas de Orion arman refugios con sus bolsas de agua y de comida.'],
];

// Dynamic messages. {0}, {1}... stand for values put in at runtime; each value is translated too,
// so a crop or sample name inside the sentence also changes language.
const TEMPLATES: readonly Row[] = [
  // Prompts ("[F] " is shown as "Press F: " by the HUD, so both forms are registered)
  ['[F] Give {0} to {1}: 1 ration ({2}% battery)', '[F] Dar {0} para {1}: 1 ração ({2}% de bateria)', '[F] Dar {0} a {1}: 1 ración ({2}% de batería)'],
  ['[R] REPAIR SUIT (-{0}% PWR)', '[R] REPARAR O TRAJE (-{0}% ENERGIA)', '[R] REPARAR EL TRAJE (-{0}% ENERGÍA)'],
  ['Press F or tap: collect {0}', 'Aperte F ou toque: coletar {0}', 'Pulsa F o toca: recoger {0}'],

  // Engine
  ['CO2 {0}%: replace filter', 'CO₂ {0}%: troque o filtro', 'CO₂ {0}%: cambia el filtro'],
  ['Solar storms: real CMEs that NASA predicted would reach Mars, from NASA DONKI ({0}).', 'Tempestades solares: CMEs reais que a NASA previu que chegariam a Marte, do NASA DONKI ({0}).', 'Tormentas solares: CME reales que la NASA predijo que llegarían a Marte, de NASA DONKI ({0}).'],
  ['Biggest choice: {0}', 'Maior escolha: {0}', 'Decisión más grande: {0}'],
  ['Got a Space Ration made from your {0}! Eat it from your hotbar.', 'Você ganhou uma Ração Espacial feita com a sua planta ({0})! Coma pela barra de itens.', '¡Recibiste una Ración Espacial hecha con tu planta ({0})! Cómela desde tu barra de objetos.'],
  ['Space weather is calm. {0}', 'O clima espacial está calmo. {0}', 'El clima espacial está en calma. {0}'],
  ['Mission Control: {0}', 'Controle da Missão: {0}', 'Control de Misión: {0}'],
  ['Planted {0}. It drinks {1} L from the base tank while it grows, and needs light and a clean greenhouse.', 'Você plantou: {0}. A planta bebe {1} L do tanque da base enquanto cresce e precisa de luz e de uma estufa limpa.', 'Plantaste: {0}. La planta bebe {1} L del tanque de la base mientras crece y necesita luz y un invernadero limpio.'],
  ['Harvested {0}. Pick up your harvest and use it to eat. A real NASA study is now in your field notebook!', 'Você colheu: {0}. Pegue a colheita e use para comer. Um estudo real da NASA entrou no seu caderno de campo!', 'Cosechaste: {0}. Recoge tu cosecha y úsala para comer. ¡Un estudio real de la NASA entró en tu cuaderno de campo!'],
  ['The {0} basket is empty.', 'A cesta ({0}) está vazia.', 'La cesta ({0}) está vacía.'],
  ['Collected {0} {1}.{2?}', 'Coletado: {0} {1}.{2}', 'Recogido: {0} {1}.{2}'],
  ['Ate a packaged ration. {0} left for the whole crew.', 'Você comeu uma ração embalada. Sobram {0} para a tripulação inteira.', 'Comiste una ración envasada. Quedan {0} para toda la tripulación.'],
  ['Cooking your {0}: ready in {1} seconds.', 'Cozinhando a sua planta ({0}): fica pronta em {1} segundos.', 'Cocinando tu planta ({0}): estará lista en {1} segundos.'],
  ['Tank {0} L, {1}% recycled', 'Tanque {0} L, {1}% reciclado', 'Tanque {0} L, {1}% reciclado'],
  ['Space science on Earth: {0}. ({1})', 'Ciência espacial na Terra: {0}. ({1})', 'Ciencia espacial en la Tierra: {0}. ({1})'],

  // Real vs game
  ['Mars: about {0} times the Space Station', 'Marte: cerca de {0} vezes a Estação Espacial', 'Marte: unas {0} veces la Estación Espacial'],
  ['Lab result: +{0} science points', 'Resultado do laboratório: +{0} pontos de ciência', 'Resultado del laboratorio: +{0} puntos de ciencia'],

  // Radiation and storms
  ['Trip from Earth: {0}', 'Viagem da Terra: {0}', 'Viaje desde la Tierra: {0}'],
  ['Walks outside: {0}', 'Passeios lá fora: {0}', 'Salidas al exterior: {0}'],
  ['Solar storms: {0}', 'Tempestades solares: {0}', 'Tormentas solares: {0}'],
  ['Inside the base: {0}', 'Dentro da base: {0}', 'Dentro de la base: {0}'],
  ['Fission reactor: {0}', 'Reator de fissão: {0}', 'Reactor de fisión: {0}'],
  ['RADIATION NOW: {0} per hour', 'RADIAÇÃO AGORA: {0} por hora', 'RADIACIÓN AHORA: {0} por hora'],
  ['DOSE SO FAR: {0} (NASA career limit: {1} mSv)', 'DOSE ATÉ AGORA: {0} (limite de carreira da NASA: {1} mSv)', 'DOSIS HASTA AHORA: {0} (límite de carrera de la NASA: {1} mSv)'],
  ['Real NASA DONKI data from {0}', 'Dados reais do NASA DONKI de {0}', 'Datos reales de NASA DONKI del {0}'],
  ['Storm data: {0}.', 'Dados da tempestade: {0}.', 'Datos de la tormenta: {0}.'],
  ['{0}. Connected live to NASA DONKI.', '{0}. Conectado ao vivo com o NASA DONKI.', '{0}. Conectado en vivo con NASA DONKI.'],
  ['{0}. Using saved NASA data inside the game.', '{0}. Usando dados da NASA guardados no jogo.', '{0}. Usando datos de la NASA guardados en el juego.'],
  ['Impact! A new crater {0} blocks {1} of the base has {2} ice blocks showing. The ice sensor marks them in blue.', 'Impacto! Uma cratera nova, a {0} blocos da base (direção: {1}), tem {2} blocos de gelo à mostra. O sensor de gelo marca o gelo de azul.', '¡Impacto! Un cráter nuevo, a {0} bloques de la base (dirección: {1}), tiene {2} bloques de hielo a la vista. El sensor de hielo los marca en azul.'],
  ['Impact! A new crater opened {0} blocks {1} of the base.', 'Impacto! Uma cratera nova abriu a {0} blocos da base (direção: {1}).', '¡Impacto! Se abrió un cráter nuevo a {0} bloques de la base (dirección: {1}).'],
  ['RADIATION ALERT! The Sun shot out super fast particles (an SEP, solar energetic particles). {0}: they hit in {1}. Hide in the storm shelter now! {2}.', 'ALERTA DE RADIAÇÃO! O Sol disparou partículas super-rápidas (um SEP, partículas energéticas solares). {0}: elas chegam em {1}. Entre no abrigo agora! {2}.', '¡ALERTA DE RADIACIÓN! El Sol disparó partículas superrápidas (un SEP, partículas energéticas solares). {0}: llegan en {1}. ¡Entra en el refugio ahora! {2}.'],
  ['Solar storm coming! The Sun threw out a giant cloud of particles (a CME). {0}: in the game that is {1} from now. {2}.', 'Tempestade solar chegando! O Sol lançou uma nuvem gigante de partículas (uma CME). {0}: no jogo, isso é daqui a {1}. {2}.', '¡Viene una tormenta solar! El Sol lanzó una nube gigante de partículas (una CME). {0}: en el juego, eso es dentro de {1}. {2}.'],
  ['Dust storm coming! {0}', 'Tempestade de poeira chegando! {0}', '¡Viene una tormenta de polvo! {0}'],
  ['SOLAR STORM! {0} left', 'TEMPESTADE SOLAR! Faltam {0}', '¡TORMENTA SOLAR! Faltan {0}'],
  ['In the storm shelter: {0} L of water in the wall.', 'No abrigo: {0} L de água na parede.', 'En el refugio: {0} L de agua en la pared.'],
  ['Solar storm in {0}', 'Tempestade solar em {0}', 'Tormenta solar en {0}'],
  ['It gave you {0}.', 'Ela deu a você {0}.', 'Te dio {0}.'],
  ['You made it through the storm with {0} L in the shelter wall.{1?}', 'Você passou pela tempestade com {0} L na parede do abrigo.{1}', 'Superaste la tormenta con {0} L en la pared del refugio.{1}'],

  // Oxygen plant

  // Science
  ['The rocket needs {0} of science sent to Earth.', 'O foguete precisa de {0} de ciência enviados à Terra.', 'El cohete necesita {0} de ciencia enviados a la Tierra.'],
  ['Sent {0} (+{1}) to a Mars orbiter, which passes it on to Earth (-{2}% power).{3?}', 'Enviado: {0} (+{1}) para um orbitador de Marte, que repassa tudo para a Terra (-{2}% de energia).{3}', 'Enviado: {0} (+{1}) a un orbitador de Marte, que lo reenvía a la Tierra (-{2}% de energía).{3}'],
  ['SEND {0} PTS TO EARTH', 'ENVIAR {0} PTS À TERRA', 'ENVIAR {0} PTS A LA TIERRA'],
  ['+{0} ice', '+{0} de gelo', '+{0} de hielo'],
  ['Used in lab upgrades (not sent): {0}.', 'Usados em melhorias do laboratório (não enviados): {0}.', 'Usados en mejoras del laboratorio (no enviados): {0}.'],
  ['Upgrade suit (uses {0} unsent science points)', 'Melhorar o traje (usa {0} pontos de ciência não enviados)', 'Mejorar el traje (usa {0} puntos de ciencia no enviados)'],
  ['Upgrade tool (uses {0} unsent science points)', 'Melhorar a ferramenta (usa {0} pontos de ciência não enviados)', 'Mejorar la herramienta (usa {0} puntos de ciencia no enviados)'],
  ['Analyze a sample ({0}% power)', 'Analisar uma amostra ({0}% de energia)', 'Analizar una muestra ({0}% de energía)'],
  ['Source: {0} (reference data, not live)', 'Fonte: {0} (dados de referência, não ao vivo)', 'Fuente: {0} (datos de referencia, no en vivo)'],
  ['Source: {0}', 'Fonte: {0}', 'Fuente: {0}'],
  ['New real NASA study in your journal: {0}. {1}', 'Novo estudo real da NASA no seu diário: {0}. {1}', 'Nuevo estudio real de la NASA en tu diario: {0}. {1}'],
  ['Real NASA OSDR data ({0}).', 'Dados reais do NASA OSDR ({0}).', 'Datos reales de NASA OSDR ({0}).'],
  ['Middle value of real readings, compared with the Space Station (1x). NASA RadLab, real data from {0}.', 'Valor do meio das medições reais, comparado com a Estação Espacial (1x). NASA RadLab, dados reais de {0}.', 'Valor medio de las mediciones reales, comparado con la Estación Espacial (1x). NASA RadLab, datos reales del {0}.'],
  ["Real studies from NASA's Open Science Data Repository (OSDR), real data from {0}. They were done on the Space Station or in labs on Earth, many with mice. None of them measured Mars: nobody has lived on Mars yet.", 'Estudos reais do Open Science Data Repository (OSDR) da NASA, dados reais de {0}. Eles foram feitos na Estação Espacial ou em laboratórios na Terra, muitos com camundongos. Nenhum mediu Marte: ninguém morou em Marte ainda.', 'Estudios reales del Open Science Data Repository (OSDR) de la NASA, datos reales del {0}. Se hicieron en la Estación Espacial o en laboratorios de la Tierra, muchos con ratones. Ninguno midió Marte: nadie ha vivido en Marte todavía.'],

  // Player, suit and rover
  ['Not enough power! Need {0}%.', 'Falta energia! Você precisa de {0}%.', '¡Falta energía! Necesitas {0}%.'],
  ['Need {0}L / {1}%', 'Precisa de {0} L / {1}%', 'Necesita {0} L / {1}%'],
  ['Need {0}', 'Precisa de {0}', 'Necesita {0}'],
  ['You slept {0}. Battery {1}% -> {2}%.', 'Você dormiu {0}. Bateria {1}% -> {2}%.', 'Dormiste {0}. Batería {1}% -> {2}%.'],
  ['You ate a {0} (+Food). No oxygen! Food cannot heal you, go back to the base', 'Você comeu: {0} (+Comida). Sem oxigênio! A comida não cura você: volte para a base', 'Comiste: {0} (+Comida). ¡Sin oxígeno! La comida no te cura: vuelve a la base'],
  ['You ate a {0} (+Food)', 'Você comeu: {0} (+Comida)', 'Comiste: {0} (+Comida)'],
  ['Ice hold is full ({0}kg). Offload at Habitat Bay!', 'O compartimento de gelo está cheio ({0} kg). Descarregue na doca do habitat!', 'El compartimento de hielo está lleno ({0} kg). ¡Descarga en el muelle del hábitat!'],
  ['Drill active! Collected +{0}kg Water Ice ({1}/{2}kg)', 'Perfuratriz ligada! Você coletou +{0} kg de gelo de água ({1}/{2} kg)', '¡Taladro encendido! Recogiste +{0} kg de hielo de agua ({1}/{2} kg)'],
  ['Offloaded {0}kg ice to base! Converted to {1}L Purified Water.', 'Você descarregou {0} kg de gelo na base! Viraram {1} L de água purificada.', '¡Descargaste {0} kg de hielo en la base! Se convirtieron en {1} L de agua purificada.'],
  ['Now pedal {0}.', 'Agora pedale: {0}.', 'Ahora pedalea: {0}.'],
  ['Good! Now pedal {0}.', 'Boa! Agora pedale: {0}.', '¡Bien! Ahora pedalea: {0}.'],

  // Story acts
  ['Dust wears your suit {0}x faster.', 'A poeira gasta o seu traje {0}x mais rápido.', 'El polvo desgasta tu traje {0}x más rápido.'],
  ['Wait: lettuce is ready in {0} seconds', 'Espere: a alface fica pronta em {0} segundos', 'Espera: la lechuga estará lista en {0} segundos'],
  ['It uses battery and takes {0} seconds', 'Gasta bateria e leva {0} segundos', 'Gasta batería y tarda {0} segundos'],
  ['The crew cleaned the solar panels for the next crew. The launch window lost {0} h.', 'A tripulação limpou os painéis solares para a próxima tripulação. A janela de lançamento perdeu {0} h.', 'La tripulación limpió los paneles solares para la próxima tripulación. La ventana de lanzamiento perdió {0} h.'],
  ['+{0} L to drink and breathe', '+{0} L para beber e respirar', '+{0} L para beber y respirar'],
  ['Uses {0}% battery, no new water', 'Gasta {0}% da bateria e não traz água nova', 'Gasta {0}% de la batería y no trae agua nueva'],
  ['First ice: base tank (+{0} L of water, rocket waited)', 'Primeiro gelo: tanque da base (+{0} L de água, o foguete esperou)', 'Primer hielo: tanque de la base (+{0} L de agua, el cohete esperó)'],
  ['First ice: rocket fuel ({0}% battery, no new water)', 'Primeiro gelo: combustível do foguete ({0}% da bateria, sem água nova)', 'Primer hielo: combustible del cohete ({0}% de la batería, sin agua nueva)'],
  ['Liftoff in {0}: right on time', 'Decolagem em {0}: bem na hora', 'Despegue en {0}: justo a tiempo'],
  ['Liftoff in {0}: the crew waited about {1} months', 'Decolagem em {0}: a tripulação esperou cerca de {1} meses', 'Despegue en {0}: la tripulación esperó unos {1} meses'],

  // Panels and journal
  ['FULL WALL {0} L', 'PAREDE CHEIA {0} L', 'PARED LLENA {0} L'],
  ['Water stops radiation. Water in the wall is water you cannot drink. {0}', 'A água segura a radiação. A água da parede é água que você não pode beber. {0}', 'El agua frena la radiación. El agua de la pared es agua que no puedes beber. {0}'],
  ['Load {0} ice', 'Carregue {0} de gelo', 'Carga {0} de hielo'],
  ['Wait {0} storms', 'Espere {0} tempestades', 'Espera {0} tormentas'],
  ['Wait out {0} solar storms safely inside or under the shield.', 'Espere {0} tempestades solares passarem em segurança dentro da base ou sob o escudo.', 'Espera a que pasen {0} tormentas solares a salvo dentro de la base o bajo el escudo.'],
  ['Power: made {0}%, used {1}%', 'Energia: gerou {0}%, gastou {1}%', 'Energía: generó {0}%, gastó {1}%'],
  ['Water tank: in {0} L, out {1} L', 'Tanque de água: entraram {0} L, saíram {1} L', 'Tanque de agua: entraron {0} L, salieron {1} L'],
  ['Radiation today: {0}', 'Radiação hoje: {0}', 'Radiación de hoy: {0}'],
  ['Because: {0}', 'Porque: {0}', 'Porque: {0}'],
  ['Empty in about {0}', 'Vazia em cerca de {0}', 'Vacía en unos {0}'],
  ['Full in about {0}', 'Cheia em cerca de {0}', 'Llena en unos {0}'],
  ['EASY START: BASE USES {0}% OF NORMAL POWER', 'COMEÇO FÁCIL: A BASE GASTA {0}% DA ENERGIA NORMAL', 'INICIO FÁCIL: LA BASE GASTA {0}% DE LA ENERGÍA NORMAL'],
  ['Journal rank: {0}', 'Nível do diário: {0}', 'Rango del diario: {0}'],
  ['Coolest finds: {0}', 'Achados mais legais: {0}', 'Hallazgos más geniales: {0}'],
  ['Profile: {0}.', 'Perfil: {0}.', 'Perfil: {0}.'],
  ['Signed: {0}', 'Assinado: {0}', 'Firmado: {0}'],
  ['RADIO: SILENT, solar conjunction ({0}). {1} left.', 'RÁDIO: EM SILÊNCIO, conjunção solar ({0}). Faltam {1}.', 'RADIO: EN SILENCIO, conjunción solar ({0}). Faltan {1}.'],
  ['Next solar conjunction (simulated): in {0}.', 'Próxima conjunção solar (simulada): em {0}.', 'Próxima conjunción solar (simulada): en {0}.'],
  ['EARTH IS NOW {0} million km away.', 'A TERRA ESTÁ AGORA A {0} milhões de km.', 'LA TIERRA ESTÁ AHORA A {0} millones de km.'],
  ['A radio message needs {0} min to get there and {1} min to come back.', 'Uma mensagem de rádio leva {0} min para chegar lá e {1} min para voltar.', 'Un mensaje de radio tarda {0} min en llegar y {1} min en volver.'],
  ['HARVEST READY ({0})', 'COLHER AS PRONTAS ({0})', 'COSECHAR LAS LISTAS ({0})'],
  ['FILTER: {0}%   SCIENCE TO SEND: {1} points', 'FILTRO: {0}%   CIÊNCIA PARA ENVIAR: {1} pontos', 'FILTRO: {0}%   CIENCIA POR ENVIAR: {1} puntos'],
  ['BONE DENSITY: {0}%', 'DENSIDADE DOS OSSOS: {0}%', 'DENSIDAD DE LOS HUESOS: {0}%'],
  ['BASE WATER TANK: {0} L | POWER: {1}%', 'TANQUE DE ÁGUA DA BASE: {0} L | ENERGIA: {1}%', 'TANQUE DE AGUA DE LA BASE: {0} L | ENERGÍA: {1}%'],
  ['{0} million km (NASA/JPL orbits on {1}). One radio message takes', '{0} milhões de km (órbitas da NASA/JPL em {1}). Uma mensagem de rádio leva', '{0} millones de km (órbitas de NASA/JPL del {1}). Un mensaje de radio tarda'],
  ["NASA's Perseverance rover seals rock samples in tubes for a future trip to Earth. Here a sample in a tube is NOT analyzed: it is worth {0}x points, but only in your final report. Each tube makes the rocket heavier (+{1} ice). Points and ice are game rules.", 'O rover Perseverance da NASA guarda amostras de rocha em tubos para uma viagem futura à Terra. Aqui a amostra no tubo NÃO é analisada: ela vale {0}x pontos, mas só no relatório final. Cada tubo deixa o foguete mais pesado (+{1} de gelo). Os pontos e o gelo são regras do jogo.', 'El rover Perseverance de la NASA guarda muestras de roca en tubos para un futuro viaje a la Tierra. Aquí la muestra del tubo NO se analiza: vale {0}x puntos, pero solo en tu informe final. Cada tubo hace el cohete más pesado (+{1} de hielo). Los puntos y el hielo son reglas del juego.'],
  ['{0} | {1} L water / {2}% power / {3}s / +{4} food', '{0} | {1} L de água / {2}% de energia / {3} s / +{4} de comida', '{0} | {1} L de agua / {2}% de energía / {3} s / +{4} de comida'],
  ['one way ({0} s in game).', 'só de ida ({0} s no jogo).', 'solo de ida ({0} s en el juego).'],
];

const toRecord = (index: 1 | 2): Record<string, string> => Object.fromEntries(COPY.map((row) => [row[0], row[index]]));

export const AUDIT_COPY_PT_BR: Record<string, string> = toRecord(1);
export const AUDIT_COPY_ES: Record<string, string> = toRecord(2);

type Translate = (text: string, language: 'pt-BR' | 'es') => string;
export type AuditPattern = {
  match: RegExp;
  format: (parts: RegExpMatchArray, language: 'pt-BR' | 'es', translate: Translate) => string;
};

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "{0}" must hold something; "{0?}" may be empty (an optional extra sentence at the end).
function compile([source, ptBr, es]: Row): AuditPattern {
  const order: number[] = [];
  const pattern = source.split(/(\{\d+\??\})/).map((piece) => {
    const slot = piece.match(/^\{(\d+)(\?)?\}$/);
    if (!slot) return escapeRegExp(piece);
    order.push(Number(slot[1]));
    return slot[2] ? '(.*?)' : '(.+?)';
  }).join('');
  return {
    match: new RegExp(`^${pattern}$`),
    format: (parts, language, translate) => {
      const values = new Map(order.map((slot, i) => [slot, translate(parts[i + 1], language)]));
      return (language === 'pt-BR' ? ptBr : es).replace(/\{(\d+)\}/g, (_, slot) => values.get(Number(slot)) ?? '');
    },
  };
}

const withoutKeyPrefix = (row: Row): Row | null => {
  const prefix = /^\[F\] /;
  return prefix.test(row[0]) ? [row[0].replace(prefix, ''), row[1].replace(prefix, ''), row[2].replace(prefix, '')] : null;
};

export const AUDIT_PATTERNS: AuditPattern[] = TEMPLATES
  .flatMap((row) => [row, withoutKeyPrefix(row)])
  .filter((row): row is Row => row !== null)
  .map(compile);

// English sources of the dynamic messages with a sample value in every slot, for the coverage test
export const AUDIT_TEMPLATE_SAMPLES: string[] = TEMPLATES.map(([source]) => source.replace(/\{\d+\??\}/g, '7'));
