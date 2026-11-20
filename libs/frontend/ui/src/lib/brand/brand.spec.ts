import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GiraffeBand } from './giraffe-band.component';
import { InkCard } from './ink-card.component';
import { LinkPill } from './link-pill.component';
import { PriceTag } from './price-tag.component';
import { Stamp, StampKind } from './stamp.component';
import { Switch } from './switch.component';

@Component({
  imports: [PriceTag, Stamp, LinkPill, GiraffeBand, InkCard, Switch],
  template: `
    <lib-price-tag id="overlay" [amount]="1250" />
    <lib-price-tag id="label" [amount]="120" variant="label" suffix="d'occasion" />
    <lib-price-tag id="range" [amount]="80" [max]="120" />
    <lib-price-tag id="none" [amount]="null" />
    <lib-stamp [kind]="kind()" />
    <lib-link-pill href="https://example.com/annonce" label="Leboncoin" />
    <lib-giraffe-band />
    <lib-ink-card tilted><p>Le mot des parents</p></lib-ink-card>
    <lib-switch [(checked)]="showTaken" label="Afficher aussi les objets pris" />
  `,
})
class Host {
  kind = signal<StampKind>('chasse');
  showTaken = signal(false);
}

function render() {
  const fixture = TestBed.configureTestingModule({ imports: [Host] }).createComponent(Host);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

describe('brand components', () => {
  it('formats the indicative price the French way, with a tilde', () => {
    const { el } = render();
    // fr-FR groups thousands with a narrow no-break space
    expect(el.querySelector('#overlay')?.textContent?.replace(/\s/g, ' ').trim()).toBe(
      '~1 250 €',
    );
    expect(el.querySelector('#label')?.textContent?.trim()).toBe("~120 € d'occasion");
    expect(el.querySelector('#label')?.className).toContain('price-tag--label');
  });

  it('shows a price range, and nothing at all without a price', () => {
    const { el } = render();
    expect(el.querySelector('#range')?.textContent?.trim()).toBe('~80–120 €');
    expect((el.querySelector('#none') as HTMLElement).hidden).toBe(true);
  });

  it('labels the stamp from the way the gift was taken', () => {
    const { fixture, el } = render();
    expect(el.querySelector('lib-stamp')?.textContent?.trim()).toBe('Chassé !');
    fixture.componentInstance.kind.set('don');
    fixture.detectChanges();
    expect(el.querySelector('lib-stamp')?.textContent?.trim()).toBe('Adopté !');
  });

  it('opens listing links in a new tab, safely', () => {
    const { el } = render();
    const a = el.querySelector('lib-link-pill a') as HTMLAnchorElement;
    expect(a.getAttribute('href')).toBe('https://example.com/annonce');
    expect(a.target).toBe('_blank');
    expect(a.rel).toContain('noopener');
    expect(a.textContent).toContain('Leboncoin');
  });

  it('keeps the giraffe band out of the accessibility tree', () => {
    const { el } = render();
    expect(el.querySelector('lib-giraffe-band svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('tilts the ink card on request and projects its content', () => {
    const { el } = render();
    const card = el.querySelector('lib-ink-card');
    expect(card?.className).toContain('ink-card--tilted');
    expect(card?.textContent).toContain('Le mot des parents');
  });

  it('toggles the switch and two-way binds its state', () => {
    const { fixture, el } = render();
    const button = el.querySelector('lib-switch button') as HTMLButtonElement;
    expect(button.getAttribute('role')).toBe('switch');
    expect(button.getAttribute('aria-checked')).toBe('false');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-checked')).toBe('true');
    expect(fixture.componentInstance.showTaken()).toBe(true);
  });
});
