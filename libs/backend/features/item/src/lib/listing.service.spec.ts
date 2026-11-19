import { platformOf } from './listing.service';

describe('platformOf', () => {
  it('recognises the usual second-hand platforms from the URL', () => {
    expect(platformOf('https://www.leboncoin.fr/ad/bebe/123')).toBe('leboncoin');
    expect(platformOf('https://www.vinted.fr/items/42-poussette')).toBe('vinted');
    expect(platformOf('https://www.vinted.co.uk/items/42')).toBe('vinted');
    expect(platformOf('https://www.facebook.com/marketplace/item/9')).toBe('facebook');
    expect(platformOf('https://www.label-emmaus.co/fr/p/1')).toBe('autre');
    // look-alike hosts are not trusted
    expect(platformOf('https://leboncoin.fr.evil.example/ad')).toBe('autre');
  });
});
