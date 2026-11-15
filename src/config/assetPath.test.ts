import { describe, expect, it } from 'vitest';
import { assetPath } from './assetPath.ts';

describe('assetPath', () => {
  it('keeps root hosted asset paths unchanged', () => {
    expect(assetPath('/audio/')).toBe('/audio/');
  });

  it('prefixes assets with the GitHub Pages project path', () => {
    expect(assetPath('/textures/mars.jpg', '/marscraft')).toBe('/marscraft/textures/mars.jpg');
  });
});
