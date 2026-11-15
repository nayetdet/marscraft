// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { latestBulletin, summarizeCmes, summarizeSep, summarizeSeps } from './donkiNormalize.ts';
import cmeSample from '../../docs/data/samples/donki-cme-2026-11-sample.json';
import notificationSample from '../../docs/data/samples/donki-notifications-2026-11-07_13.json';

describe('donkiNormalize (issue #100)', () => {
  it('keeps only Mars-bound CMEs, once each, in time order', () => {
    const [toElsewhere, toMars] = cmeSample.items;
    const cmes = summarizeCmes([toMars, toElsewhere, toMars]);
    expect(cmes.map((c) => c.id)).toEqual(['2026-11-01T19:00:00-CME-001']);
  });

  it('turns a real DONKI SEP into what the game needs: when and which spacecraft saw it', () => {
    const sep = summarizeSep({
      sepID: '2025-11-15T03:42:00-SEP-001',
      eventTime: '2025-11-15T03:42Z',
      instruments: [{ displayName: 'STEREO A: IMPACT 13-100 MeV' }, { displayName: 'STEREO A: LET' }, { displayName: 'GOES-19: SEISS >10 MeV' }],
      link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/42742/-1',
    });
    expect(sep).toEqual({
      id: '2025-11-15T03:42:00-SEP-001',
      eventTime: '2025-11-15T03:42Z',
      seenBy: ['STEREO A', 'GOES-19'],
      link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/42742/-1',
    });
    expect(summarizeSep({ sepID: 'x' })).toBeNull();
    expect(summarizeSeps([{ sepID: 'b', eventTime: '2025-11-16T00:00Z' }, { sepID: 'a', eventTime: '2025-11-15T00:00Z' }]).map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('picks the newest bulletin with only its type, date and link (no long technical body)', () => {
    const bulletin = latestBulletin(notificationSample.items);
    const newest = [...notificationSample.items].sort((a, b) => b.messageIssueTime.localeCompare(a.messageIssueTime))[0];
    expect(bulletin).toEqual({ type: newest.messageType, issueTime: newest.messageIssueTime, url: newest.messageURL });
    expect(latestBulletin([])).toBeNull();
    expect(latestBulletin([{ messageType: 'CME' }])).toBeNull();
  });
});
