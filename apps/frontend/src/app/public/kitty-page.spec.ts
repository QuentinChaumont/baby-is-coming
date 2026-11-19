import { formatIban, thanksLine } from './kitty-page';

describe('kitty helpers', () => {
  it('thanks visible names and counts the discreet ones', () => {
    expect(thanksLine({ totalPromised: 0, goal: null, contributorCount: 0, contributors: [] })).toBeNull();
    expect(thanksLine({ totalPromised: 30, goal: null, contributorCount: 1, contributors: ['Paul M.'] })).toBe(
      'Merci à Paul M. !',
    );
    expect(
      thanksLine({ totalPromised: 50, goal: null, contributorCount: 4, contributors: ['Paul M.', 'Anne L.'] }),
    ).toBe('Merci à Paul M., Anne L. et 2 personnes discrètes !');
    expect(thanksLine({ totalPromised: 5, goal: null, contributorCount: 1, contributors: [] })).toBe(
      'Merci à une personne discrète !',
    );
  });

  it('groups the IBAN by four', () => {
    expect(formatIban('FR7630006000011234567890189')).toBe('FR76 3000 6000 0112 3456 7890 189');
  });
});
