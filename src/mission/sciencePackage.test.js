import { describe, expect, it } from 'vitest';
import { SCIENCE_CONFIG } from '../config/constants.js';
import {
  sciencePackage,
  scienceMinimumMet,
  scienceMissingText,
  scienceStep,
  scansStillNeeded,
  uploadButtonLabel,
  uploadResultText,
} from './sciencePackage.js';

const { MIN_DISCOVERIES, MIN_SAMPLES, UPLOAD_BASE_COST, UPLOAD_COST_PER_ITEM, MAX_ITEMS_PER_UPLOAD } = SCIENCE_CONFIG;

describe('sciencePackage', () => {
  it('is empty and free with nothing new to send', () => {
    expect(sciencePackage({})).toMatchObject({ items: 0, cost: 0, metNow: false, metAfter: false });
    expect(sciencePackage({ discoveries: 3, sentDiscoveries: 3 })).toMatchObject({ items: 0, cost: 0 });
  });

  it('sends only what was not sent yet, samples first, up to one orbiter pass', () => {
    const pkg = sciencePackage({ discoveries: 20, samples: 3, sentDiscoveries: 2, sentSamples: 1 });
    expect(pkg).toMatchObject({ pendingDiscoveries: 18, pendingSamples: 2, uploadSamples: 2 });
    expect(pkg.items).toBe(MAX_ITEMS_PER_UPLOAD);
    expect(pkg.uploadDiscoveries).toBe(MAX_ITEMS_PER_UPLOAD - 2);
    expect(pkg.leftAfter).toBe(20 - MAX_ITEMS_PER_UPLOAD);
    expect(pkg.cost).toBe(UPLOAD_BASE_COST + MAX_ITEMS_PER_UPLOAD * UPLOAD_COST_PER_ITEM);
  });

  it('meets the minimum with enough discoveries or enough samples', () => {
    expect(scienceMinimumMet(MIN_DISCOVERIES - 1, MIN_SAMPLES - 1)).toBe(false);
    expect(scienceMinimumMet(MIN_DISCOVERIES, 0)).toBe(true);
    expect(scienceMinimumMet(0, MIN_SAMPLES)).toBe(true);
    expect(sciencePackage({ discoveries: MIN_DISCOVERIES }).metAfter).toBe(true);
  });
});

describe('scienceStep', () => {
  it('guides scan, analyze, send and then nothing', () => {
    expect(scienceStep({})).toBe('scan');
    expect(scienceStep({ rawSamples: 1 })).toBe('analyze');
    expect(scienceStep({ samples: MIN_SAMPLES })).toBe('send');
    expect(scienceStep({ discoveries: MIN_DISCOVERIES })).toBe('send');
    expect(scienceStep({ discoveries: MIN_DISCOVERIES, sentDiscoveries: MIN_DISCOVERIES })).toBeNull();
    expect(scansStillNeeded({ discoveries: 2 })).toBe(MIN_DISCOVERIES - 2);
  });
});

describe('science texts', () => {
  it('says what is missing', () => {
    expect(scienceMissingText({})).toMatch(new RegExp(`scan ${MIN_DISCOVERIES} more things.*analyze ${MIN_SAMPLES} more regolith samples`));
    expect(scienceMissingText({ samples: MIN_SAMPLES })).toMatch(/send the package/);
    expect(scienceMissingText({ sentSamples: MIN_SAMPLES })).toMatch(/Enough science is home/);
  });

  it('shows the cost of the package on the button', () => {
    expect(uploadButtonLabel(sciencePackage({}))).toMatch(/nothing new/);
    expect(uploadButtonLabel(sciencePackage({ discoveries: 2 }))).toBe(`Send 2 items to Earth (${UPLOAD_BASE_COST + 2 * UPLOAD_COST_PER_ITEM}% power)`);
  });

  it('explains each upload result', () => {
    expect(uploadResultText({ status: 'empty' })).toMatch(/Nothing new/);
    expect(uploadResultText({ status: 'no-energy', cost: 20 })).toMatch(/needs 20%/);
    const sent = uploadResultText({ status: 'sent', discoveries: 1, samples: 2, cost: 17, leftAfter: 0, dataSent: true });
    expect(sent).toMatch(/1 discovery and 2 samples/);
    expect(sent).toMatch(/orbiter/);
    expect(sent).toMatch(/enough of your science/);
  });
});
