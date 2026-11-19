import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PrivacyPolicy } from './privacy-policy.page';

describe('PrivacyPolicy', () => {
  it('states what guests share, what stays private and when it is erased', () => {
    TestBed.configureTestingModule({ imports: [PrivacyPolicy], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PrivacyPolicy);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Politique de confidentialité');
    expect(text).toContain('« Paul M. »');
    expect(text).toContain('ne sont jamais publics');
    expect(text).toContain('6 mois après la date prévue');
  });
});
