// Fim de fragment shader para cores escritas "como aparecem na tela" (sRGB), caso do ceu e dos
// efeitos feitos a mao. Converte para linear e deixa o Three.js codificar para o destino: direto
// na tela o resultado e identico ao de antes; no modo Shaders (alvo linear, com tone mapping e
// bloom depois) a cor entra na conta certa em vez de ser clareada duas vezes.
export const SRGB_AUTHORED_OUTPUT = /* glsl */ `
    gl_FragColor.rgb = mix(
      pow(gl_FragColor.rgb * 0.9478672986 + 0.0521327014, vec3(2.4)),
      gl_FragColor.rgb * 0.0773993808,
      vec3(lessThanEqual(gl_FragColor.rgb, vec3(0.04045)))
    );
    #include <colorspace_fragment>
`;
