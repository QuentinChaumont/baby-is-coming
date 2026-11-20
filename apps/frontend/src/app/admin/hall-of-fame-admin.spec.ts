import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HallOfFameAdmin } from './hall-of-fame-admin';

describe('HallOfFameAdmin', () => {
  function render() {
    TestBed.configureTestingModule({
      imports: [HallOfFameAdmin],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(HallOfFameAdmin);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/admin/hall-of-fame').flush([
      { id: 'a', name: 'Paul M.', createdAt: '2026-11-20T10:00:00Z' },
      { id: 'b', name: 'Anne D.', createdAt: '2026-11-20T11:00:00Z' },
    ]);
    fixture.detectChanges();
    return { fixture, http, el: fixture.nativeElement as HTMLElement };
  }

  it('removes a name only after confirmation', () => {
    const { fixture, http, el } = render();
    expect(el.querySelectorAll('li')).toHaveLength(2);
    (el.querySelector('button[aria-label="Retirer Anne D."]') as HTMLButtonElement).click();
    fixture.detectChanges();
    http.expectNone('/api/admin/hall-of-fame/b');
    const yes = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Oui, retirer')) as HTMLButtonElement;
    yes.click();
    http.expectOne({ method: 'DELETE', url: '/api/admin/hall-of-fame/b' }).flush(null);
    fixture.detectChanges();
    expect(Array.from(el.querySelectorAll('.fame__name')).map((n) => n.textContent)).toEqual(['Paul M.']);
  });
});
