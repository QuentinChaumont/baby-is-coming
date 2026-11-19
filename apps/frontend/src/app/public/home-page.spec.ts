import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { PublicBirthList } from '@org/shared-contracts';
import { HomePage } from './home-page';

const LIST: PublicBirthList = {
  babyNickname: 'Kiki',
  dueDate: '2027-03-15',
  welcomeMessage: 'On a eu envie de casser un peu les codes…',
  paymentMethods: { iban: null, ibanHolder: null, links: [], note: null },
  kittyGoal: null,
};

function render() {
  TestBed.configureTestingModule({
    imports: [HomePage],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const fixture = TestBed.createComponent(HomePage);
  fixture.detectChanges();
  return { fixture, http: TestBed.inject(HttpTestingController), el: fixture.nativeElement as HTMLElement };
}

describe('HomePage', () => {
  it('shows the nickname, the due date in French and the parents’ note', () => {
    const { fixture, http, el } = render();
    http.expectOne('/api/public/list').flush(LIST);
    fixture.detectChanges();

    expect(el.querySelector('h1')?.textContent).toContain("c'est Kiki");
    expect(el.textContent).toContain('Terme prévu : 15 mars 2027');
    expect(el.textContent).toContain('Fille ou garçon ? Surprise');
    expect(el.querySelector('lib-ink-card')?.textContent).toContain('casser un peu les codes');
  });

  it('hides the due date label while none is set', () => {
    const { fixture, http, el } = render();
    http.expectOne('/api/public/list').flush({ ...LIST, dueDate: null });
    fixture.detectChanges();
    expect(el.textContent).not.toContain('Terme prévu');
  });

  it('says so in French when the list cannot load', () => {
    const { fixture, http, el } = render();
    http.expectOne('/api/public/list').flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain("n'a pas pu se charger");
  });
});
