import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { AdminItem } from '@org/shared-contracts';
import { ItemsPage } from './items-page';

const item = (id: string, publication: AdminItem['publication'] = 'published'): AdminItem => ({
  id, title: `Objet ${id}`, description: '', price: 10, quantity: 1, remaining: 1,
  availability: 'available', photos: [], takers: [], publication, position: 1, takenQuantity: 0,
  createdAt: '', updatedAt: '',
});

describe('ItemsPage', () => {
  function render() {
    TestBed.configureTestingModule({
      imports: [ItemsPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(ItemsPage);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/admin/items').flush([item('a'), item('b'), item('c', 'draft')]);
    fixture.detectChanges();
    return { fixture, http, el: fixture.nativeElement as HTMLElement };
  }

  it('moves an item down with the keyboard-friendly buttons and saves the order', () => {
    const { http, el } = render();
    (el.querySelector('button[aria-label="Descendre Objet a"]') as HTMLButtonElement).click();
    const req = http.expectOne('/api/admin/items/reorder');
    expect(req.request.body).toEqual({ ids: ['b', 'a', 'c'] });
  });

  it('filters by publication and disables reordering meanwhile', () => {
    const { fixture, el } = render();
    const drafts = Array.from(el.querySelectorAll('.items__filters button')).find((b) => b.textContent?.includes('Brouillons')) as HTMLButtonElement;
    drafts.click();
    fixture.detectChanges();
    expect(el.querySelectorAll('.items__row')).toHaveLength(1);
    expect(el.querySelector('.items__move')).toBeNull();
    expect(el.textContent).toContain("Affiche « Tous » pour changer l'ordre.");
  });
});
