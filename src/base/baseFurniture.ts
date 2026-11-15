// @ts-nocheck
// Mobilia extra de cada secao da base, para as salas nao ficarem vazias. So cenario: nenhuma
// peca daqui muda regra do jogo. Tudo entra na malha estatica de baseDecor (uma por material).
// Coordenadas do mundo; cada sala tem o seu bloco, com os limites do ar no comentario.
//
// `box(w, h, d, mat, x, y, z)` desenha, `solid(minX, maxX, minZ, maxZ, altura)` cria a colisao,
// `F` e o topo do piso (y = 10).
export function addBaseFurniture({ box, solid, mats, zoneMats, F }) {
  // Peca apoiada no piso (ou em cima de outra, com `y0`); so as do piso ganham colisao
  const prop = (w, h, d, mat, x, z, y0 = 0) => {
    box(w, h, d, mat, x, F + y0 + h / 2, z);
    if (y0 === 0) solid(x - w / 2 - 0.04, x + w / 2 + 0.04, z - d / 2 - 0.04, z + d / 2 + 0.04, h);
  };
  // Detalhe sem colisao, com o centro em `y` acima do piso
  const deco = (w, h, d, mat, x, y, z) => box(w, h, d, mat, x, F + y, z);
  const stool = (x, z, mat = mats.blue) => {
    deco(0.42, 0.07, 0.42, mat, x, 0.5, z);
    deco(0.09, 0.47, 0.09, mats.silver, x, 0.235, z);
    solid(x - 0.22, x + 0.22, z - 0.22, z + 0.22, 0.5);
  };
  const table = (x, z, w, d) => {
    deco(w, 0.08, d, mats.white, x, 0.78, z);
    deco(0.14, 0.74, 0.14, mats.gray, x, 0.37, z);
    solid(x - w / 2, x + w / 2, z - d / 2, z + d / 2, 0.8);
  };
  const crate = (x, z, size, mat, y0 = 0) => {
    prop(size, size, size, mat, x, z, y0);
    deco(size + 0.02, 0.06, size + 0.02, mats.slate, x, y0 + size * 0.5, z);
  };

  // ================= Habitat principal (ar em x = -6..13, z = -11..6) =================
  // Area comum a noroeste: banco, mesinha e uma planta
  prop(0.7, 0.45, 3.6, mats.blue, -5.5, -7.5);
  deco(0.22, 0.5, 3.6, mats.white, -5.86, 0.7, -7.5);
  prop(0.7, 0.4, 1.2, mats.white, -4.5, -7.5);
  deco(0.3, 0.06, 0.4, mats.orange, -4.5, 0.43, -7.3);
  prop(0.5, 0.5, 0.5, mats.orange, -5.5, -4.7);
  deco(0.6, 0.7, 0.6, mats.green, -5.5, 0.85, -4.7);
  // Mesa de missao no meio do habitat: mapa iluminado da cratera e quatro bancos
  prop(1.2, 0.8, 0.8, mats.gray, 6.0, -6.0);
  deco(2.6, 0.1, 1.5, mats.slate, 6.0, 0.85, -6.0);
  deco(2.2, 0.04, 1.1, mats.cyanGlow, 6.0, 0.92, -6.0);
  deco(0.5, 0.12, 0.4, mats.brown, 5.5, 1.0, -6.1);
  deco(0.3, 0.2, 0.3, mats.white, 6.6, 1.04, -5.8);
  deco(0.14, 0.14, 0.14, mats.red, 6.9, 1.0, -6.3);
  solid(4.7, 7.3, -6.75, -5.25, 0.9);
  for (const [sx, sz] of [[5.2, -4.85], [6.8, -4.85], [5.2, -7.15], [6.8, -7.15]]) stool(sx, sz);
  // Carga encostada na parede sul, a leste do abrigo
  crate(7.2, 5.5, 0.9, mats.brown);
  crate(8.25, 5.5, 0.8, mats.orange);
  crate(9.35, 5.45, 1.0, mats.brown);
  crate(10.5, 5.5, 0.9, mats.silver);
  crate(9.3, 5.5, 0.6, mats.orange, 1.0);
  crate(7.25, 5.5, 0.5, mats.silver, 0.9);

  // ================= Dormitorio (ar em x = 18..29, z = -10..-1; porta a oeste) =================
  // Armarios da tripulacao na parede norte, um por pessoa, com a faixa na cor de cada um
  const lockerColors = [mats.orange, mats.green, mats.blue, mats.red, mats.yellow];
  lockerColors.forEach((mat, i) => {
    const x = 20.5 + i * 1.0;
    deco(0.9, 2.0, 0.5, mats.white, x, 1.0, -9.7);
    deco(0.9, 0.14, 0.02, mat, x, 1.6, -9.44);
    deco(0.06, 0.4, 0.03, mats.silver, x + 0.3, 1.0, -9.44);
  });
  solid(20.0, 25.0, -10.0, -9.42, 2.0);
  // Mesa de leitura e escrivaninha com tela
  table(23.5, -6.2, 1.6, 1.0);
  stool(22.45, -6.2, mats.orange);
  stool(24.55, -6.2, mats.orange);
  deco(0.3, 0.05, 0.4, mats.blue, 23.3, 0.85, -6.1);
  prop(0.7, 0.75, 1.6, mats.white, 28.5, -8.4);
  deco(0.06, 0.5, 0.9, mats.charcoal, 28.75, 1.1, -8.4);
  deco(0.03, 0.4, 0.78, mats.cyanGlow, 28.71, 1.1, -8.4);
  stool(27.7, -8.4);
  // Tapete das camas e luzes de leitura na parede sul
  deco(8.4, 0.03, 2.8, zoneMats.quarters, 24.0, 0.012, -2.3);
  for (const x of [21, 24, 27]) deco(0.3, 0.1, 0.06, mats.cyanGlow, x, 2.3, -1.06);
  // Planta e cesto de roupa
  prop(0.5, 0.5, 0.5, mats.orange, 18.6, -1.6);
  deco(0.6, 0.8, 0.6, mats.green, 18.6, 0.9, -1.6);
  prop(0.6, 0.7, 0.6, mats.gray, 26.6, -9.6);

  // ================= Energia (ar em x = -21..-10, z = -25..-16; porta a leste) =================
  // Dois inversores na parede norte, com faixa de aviso e luz de estado
  for (const x of [-19.0, -17.6]) {
    prop(1.2, 1.8, 0.6, mats.gray, x, -24.65);
    deco(1.2, 0.14, 0.02, mats.yellow, x, 1.2, -24.34);
    deco(0.16, 0.16, 0.03, mats.greenGlow, x + 0.35, 1.5, -24.34);
  }
  // Mesa de controle a sudeste e caixas de baterias reserva a nordeste
  prop(1.6, 0.75, 0.7, mats.white, -12.2, -16.5);
  deco(0.9, 0.5, 0.06, mats.charcoal, -12.2, 1.05, -16.3);
  deco(0.78, 0.4, 0.03, mats.cyanGlow, -12.2, 1.05, -16.34);
  stool(-12.2, -17.6);
  crate(-11.3, -24.2, 0.9, mats.brown);
  crate(-12.35, -24.3, 0.8, mats.slate);
  crate(-11.5, -24.2, 0.6, mats.yellow, 0.92);
  // Calhas de cabos no teto, das baterias ate o painel de distribuicao
  deco(0.25, 0.12, 7.4, mats.slate, -20.3, 3.3, -21.0);
  deco(5.0, 0.12, 0.25, mats.slate, -17.9, 3.3, -16.6);
  // Linha amarela no piso em volta do banco de baterias
  deco(0.08, 0.03, 7.6, mats.yellow, -19.7, 0.012, -21.2);

  // ================= Cozinha (ar em x = 6..17, z = -25..-16; porta a oeste) =================
  // Geladeira e bebedouro nas pontas da bancada
  prop(1.0, 2.0, 0.8, mats.white, 7.3, -16.5);
  deco(1.0, 0.1, 0.02, mats.blue, 7.3, 1.5, -16.91);
  deco(0.06, 0.6, 0.04, mats.silver, 7.65, 1.0, -16.92);
  prop(0.6, 1.5, 0.6, mats.gray, 15.4, -16.4);
  deco(0.3, 0.3, 0.03, mats.water, 15.4, 1.1, -16.71);
  // Mais bancos na mesa e uma segunda mesa
  stool(11.5, -19.35);
  stool(11.5, -21.65);
  table(13.4, -23.3, 1.6, 1.0);
  stool(12.35, -23.3);
  stool(14.45, -23.3);
  // Horta de temperos na parede norte, com luz de cultivo
  prop(3.0, 0.9, 0.5, mats.white, 9.0, -24.7);
  for (let i = 0; i < 5; i++) deco(0.36, 0.3, 0.3, mats.green, 7.8 + i * 0.6, 1.05, -24.7);
  deco(3.0, 0.08, 0.2, mats.pinkGlow, 9.0, 1.75, -24.75);
  // Lixeiras de reciclagem
  prop(0.5, 0.7, 0.5, mats.blue, 6.4, -24.4);
  prop(0.5, 0.7, 0.5, mats.green, 6.4, -23.7);

  // ================= Academia (ar em x = -11..-4, z = 8..13) =================
  // Suporte de halteres, tapete e prateleira de toalhas
  prop(0.5, 0.9, 1.0, mats.slate, -10.65, 8.6);
  for (let i = 0; i < 3; i++) deco(0.3, 0.14, 0.14, mats.charcoal, -10.65, 0.97, 8.3 + i * 0.3);
  deco(1.6, 0.04, 0.8, mats.blue, -7.6, 0.02, 8.6);
  prop(0.4, 1.2, 0.9, mats.white, -4.35, 12.4);
  [mats.blue, mats.orange].forEach((mat, i) => deco(0.3, 0.12, 0.6, mat, -4.35, 1.26 + i * 0.12, 12.4));
}
