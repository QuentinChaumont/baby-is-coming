import { bubbleGeometry, bubbleLines } from './kiki.model';

describe('Kiki speech bubble', () => {
  it('keeps short lines whole', () => {
    expect(bubbleLines('Hi hi hi !')).toEqual(['Hi hi hi !']);
  });

  it('wraps long lines at the space closest to the middle', () => {
    expect(bubbleLines('Ouiiin ! Ma tétine !')).toEqual(['Ouiiin !', 'Ma tétine !']);
    expect(bubbleLines("T'as bâillé aussi, avoue !")).toEqual(["T'as bâillé", 'aussi, avoue !']);
  });

  it('grows upwards for two lines, its tail staying at her mouth', () => {
    const one = bubbleGeometry('Youpi !');
    const two = bubbleGeometry('Ouiiin ! Ma tétine !');
    expect(one.lines).toHaveLength(1);
    expect(two.lines).toHaveLength(2);
    expect(two.lines[0].y).toBeLessThan(one.lines[0].y);
    expect(two.path).toContain('L166,100');
  });
});
