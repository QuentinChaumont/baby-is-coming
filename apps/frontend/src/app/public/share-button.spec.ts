import { TestBed } from '@angular/core/testing';
import { ShareButton } from './share-button';

describe('ShareButton', () => {
  const nav = globalThis.navigator as Navigator & { share?: unknown };
  afterEach(() => {
    delete (nav as { share?: unknown }).share;
  });

  async function click() {
    const fixture = TestBed.configureTestingModule({ imports: [ShareButton] }).createComponent(ShareButton);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('uses the native share sheet when available', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    Object.assign(nav, { share });
    await click();
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: "Coucou, c'est Kiki", url: expect.any(String) }));
  });

  it('falls back to copying the link', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(nav, 'clipboard', { value: { writeText }, configurable: true });
    const el = await click();
    expect(writeText).toHaveBeenCalled();
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Lien copié');
  });
});
