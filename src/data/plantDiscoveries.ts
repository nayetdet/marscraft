// @ts-nocheck
import research from './osdrPlants.json';

// Child-friendly explanations; titles, IDs and missions remain API-sourced.
const explanations = {
  'OSD-772': 'Peppers grew aboard the Space Station! Researchers studied the tiny living things around these plants.',
  'OSD-177': 'Space plants can get sick too. Scientists studied a fungus from infected zinnia plants on the Space Station.',
  'OSD-773': 'Can roots grow without soil? XROOTS tested systems that deliver water to roots in space.',
};
export function plantDiscovery(index) {
  if (index < 0) return null;
  const study = research.studies[index % research.studies.length];
  return { ...study, explanation: explanations[study.id] ?? 'Explore this real space-biology study using the NASA link below.' };
}
