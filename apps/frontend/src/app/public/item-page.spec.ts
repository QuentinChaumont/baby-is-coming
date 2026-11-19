import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { PublicItem } from '@org/shared-contracts';
import { listingLabel } from './item-page';
import { TakeForm } from './take-form';

const ITEM: PublicItem = {
  id: 'i1',
  title: 'Poussette',
  description: '',
  price: 120,
  quantity: 3,
  remaining: 2,
  availability: 'available',
  photos: [],
  takers: [],
};

describe('listingLabel', () => {
  it('reads « Plateforme · prix · ville »', () => {
    expect(
      listingLabel({ id: 'l', url: 'https://x', platform: 'leboncoin', title: null, price: 90, location: 'Nantes', imageUrl: null }),
    ).toBe('Leboncoin · 90 € · Nantes');
    expect(
      listingLabel({ id: 'l', url: 'https://x', platform: 'autre', title: null, price: null, location: null, imageUrl: null }),
    ).toBe('Annonce');
  });
});

describe('TakeForm', () => {
  function render() {
    TestBed.configureTestingModule({
      imports: [TakeForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(TakeForm);
    fixture.componentRef.setInput('item', ITEM);
    fixture.componentRef.setInput('kind', 'chasse');
    fixture.detectChanges();
    return { fixture, http: TestBed.inject(HttpTestingController), el: fixture.nativeElement as HTMLElement };
  }
  const type = (el: HTMLElement, selector: string, value: string) => {
    const input = el.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  it('requires a first and last name before calling the API', () => {
    const { fixture, http, el } = render();
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Ton prénom et ton nom');
    http.expectNone('/api/public/items/i1/take');
  });

  it('sends the take with the chosen units and options', () => {
    const { fixture, http, el } = render();
    const taken = jest.fn();
    fixture.componentInstance.taken.subscribe(taken);
    type(el, 'input[formControlName="firstName"]', ' Paul ');
    type(el, 'input[formControlName="lastName"]', 'Martin');
    (el.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
    const select = el.querySelector('select') as HTMLSelectElement;
    select.value = select.options[1].value;
    select.dispatchEvent(new Event('change'));
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();

    const req = http.expectOne('/api/public/items/i1/take');
    expect(req.request.body).toMatchObject({ kind: 'chasse', firstName: ' Paul ', lastName: 'Martin', hideName: true, quantity: 2 });
    req.flush({ ...ITEM, remaining: 0, availability: 'taken' });
    expect(taken).toHaveBeenCalled();
  });

  it('reports a conflict when someone took it first', () => {
    const { fixture, http, el } = render();
    const conflict = jest.fn();
    fixture.componentInstance.conflict.subscribe(conflict);
    type(el, 'input[formControlName="firstName"]', 'Paul');
    type(el, 'input[formControlName="lastName"]', 'Martin');
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    http
      .expectOne('/api/public/items/i1/take')
      .flush({ statusCode: 409, code: 'ITEM_ALREADY_TAKEN', message: 'x' }, { status: 409, statusText: 'Conflict' });
    expect(conflict).toHaveBeenCalled();
  });
});
