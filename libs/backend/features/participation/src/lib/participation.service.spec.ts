import { displayName } from './participation.service';

describe('displayName', () => {
  it('shows the first name and the last initial', () => {
    expect(displayName(' Paul ', 'martin')).toBe('Paul M.');
    expect(displayName('Élodie', 'éclair')).toBe('Élodie É.');
  });
});
