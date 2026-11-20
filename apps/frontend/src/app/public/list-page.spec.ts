import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { PublicItem } from '@org/shared-contracts';
import { stampOf, takenByLine } from './item-card';
import { ListPage } from './list-page';

const item = (over: Partial<PublicItem>): PublicItem => ({
  id: 'i1',
  title: 'Poussette',
  description: '',
  price: 120,
  priceMax: null,
  quantity: 1,
  remaining: 1,
  availability: 'available',
  photos: [
    {
      id: 'p1',
      thumbUrl: '/api/media/p1/thumb',
      largeUrl: '/api/media/p1/large',
    },
  ],
  takers: [],
  destination: 'amis',
  bought: false,
  ...over,
});

describe('takers display', () => {
  it('names takers, hides hidden names and skips the parents', () => {
    expect(takenByLine([{ kind: 'chasse', name: 'Paul M.' }])).toBe(
      'par Paul M.',
    );
    expect(takenByLine([{ kind: 'don', name: null }])).toBe(
      "par quelqu'un de discret",
    );
    expect(takenByLine([{ kind: 'parents', name: null }])).toBeNull();
    expect(stampOf([{ kind: 'don', name: null }])).toBe('don');
    expect(
      stampOf([
        { kind: 'chasse', name: null },
        { kind: 'don', name: null },
      ]),
    ).toBe('chasse');
  });
});

describe('ListPage', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  const tick = (ms: number) => jest.advanceTimersByTime(ms);

  function render() {
    TestBed.configureTestingModule({
      imports: [ListPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    const fixture = TestBed.createComponent(ListPage);
    fixture.detectChanges();
    return {
      fixture,
      http: TestBed.inject(HttpTestingController),
      el: fixture.nativeElement as HTMLElement,
    };
  }

  it('lists available items with their price, then refetches with filters', () => {
    const { fixture, http, el } = render();
    tick(200);
    http.expectOne('/api/public/items').flush([item({})]);
    fixture.detectChanges();
    expect(el.querySelectorAll('app-item-card')).toHaveLength(1);
    expect(el.querySelector('lib-price-tag')?.textContent).toContain('120');

    (el.querySelector('lib-switch button') as HTMLButtonElement).click();
    (el.querySelector('.list__sort') as HTMLButtonElement).click();
    fixture.detectChanges();
    tick(200);
    const req = http.expectOne((r) => r.url === '/api/public/items');
    expect(req.request.params.get('showTaken')).toBe('true');
    expect(req.request.params.get('sort')).toBe('price_asc');
    req.flush([
      item({
        availability: 'taken',
        remaining: 0,
        takers: [{ kind: 'chasse', name: 'Paul M.' }],
      }),
    ]);
    fixture.detectChanges();
    expect(el.querySelector('lib-stamp')?.textContent).toContain('Chassé !');
    expect(el.textContent).toContain('par Paul M.');
  });

  it('explains an empty search and an all-taken list', () => {
    const { fixture, http, el } = render();
    tick(200);
    http.expectOne('/api/public/items').flush([]);
    fixture.detectChanges();
    expect(el.textContent).toContain('Tout a été chassé');

    const input = el.querySelector('input') as HTMLInputElement;
    input.value = 'trotteur';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    tick(200);
    http.expectOne((r) => r.params.get('q') === 'trotteur').flush([]);
    fixture.detectChanges();
    expect(el.textContent).toContain('Rien ne correspond à « trotteur »');
  });
});
