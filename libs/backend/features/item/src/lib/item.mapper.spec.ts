import { normalizeSearch } from './item.mapper';

describe('normalizeSearch', () => {
  it('lower-cases and strips accents so searches ignore them', () => {
    expect(normalizeSearch('  Écharpe de PORTAGE bébé ')).toBe('echarpe de portage bebe');
  });
});
