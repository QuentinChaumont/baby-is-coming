import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type {
  AdminContribution,
  AdminItem,
  AdminParticipation,
} from '@org/shared-contracts';
import { DashboardPage } from './dashboard-page';

const item = (over: Partial<AdminItem>): AdminItem => ({
  id: 'i',
  title: 'Poussette',
  description: '',
  price: 120,
  priceMax: null,
  quantity: 1,
  remaining: 1,
  availability: 'available',
  photos: [],
  takers: [],
  destination: 'amis',
  bought: false,
  publication: 'published',
  position: 1,
  takenQuantity: 0,
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
  ...over,
});
const participation: AdminParticipation = {
  id: 'p',
  itemId: 'i',
  itemTitle: 'Poussette',
  kind: 'chasse',
  quantity: 1,
  firstName: 'Paul',
  lastName: 'Martin',
  hideName: false,
  message: 'Bisous',
  enteredByParents: false,
  received: false,
  thanked: false,
  anonymized: false,
  createdAt: '2026-11-18T10:00:00Z',
};
const contribution: AdminContribution = {
  id: 'c',
  firstName: 'Zoé',
  lastName: 'Kitty',
  hideName: false,
  amount: 40,
  message: null,
  received: true,
  thanked: false,
  anonymized: false,
  createdAt: '2026-11-18T11:00:00Z',
};

describe('DashboardPage', () => {
  beforeEach(() => localStorage.clear());

  it('summarises items, kitty, to-dos and what is new', () => {
    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne('/api/admin/items')
      .flush([
        item({ availability: 'taken' }),
        item({ id: 'j' }),
        item({ id: 'k', publication: 'draft' }),
      ]);
    http.expectOne('/api/admin/participations').flush([participation]);
    http.expectOne('/api/admin/contributions').flush([contribution]);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('2objets publiés');
    expect(text).toContain('1 pris · 1 brouillons · 0 archivés');
    expect(text).toContain('40 €promis à la cagnotte');
    expect(text).toContain('40 € reçus');
    expect(text).toContain('2mercis à envoyer');
    expect(text).toContain(
      'Paul Martin a pris « Poussette » (chasse) et a laissé un petit mot.',
    );
    expect(text).toContain('Zoé Kitty a promis 40 € à la cagnotte.');
  });
});
