import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';

/**
 * « Partager la liste » (PRODUCT F10): the native share sheet on phones
 * (WhatsApp, SMS…), otherwise copies the link.
 */
@Component({
  selector: 'app-share-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="app-button app-button--outline app-button--block" (click)="share()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M12 3v12" /><path d="M7 8l5-5 5 5" />
      </svg>
      {{ label() }}
    </button>
    <p class="share__status" role="status">{{ status() }}</p>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .share__status {
      margin: 0;
      min-height: 1.25em;
      text-align: center;
      font-weight: 700;
      font-size: 0.875rem;
    }
  `,
})
export class ShareButton {
  private readonly document = inject(DOCUMENT);

  readonly label = input('Partager la liste');
  readonly text = input("La liste de naissance seconde main de Kiki : chine un cadeau, donne ce qui dort au grenier, ou participe à la cagnotte.");

  protected readonly status = signal('');

  protected async share(): Promise<void> {
    const view = this.document.defaultView;
    const url = view?.location.origin ?? '';
    const data = { title: "Coucou, c'est Kiki", text: this.text(), url };
    const nav = view?.navigator;

    if (nav?.share && (!nav.canShare || nav.canShare(data))) {
      try {
        await nav.share(data);
        return;
      } catch (error) {
        // Closing the share sheet is not an error worth reporting.
        if ((error as DOMException)?.name === 'AbortError') return;
      }
    }
    try {
      await nav?.clipboard?.writeText(url);
      this.status.set('Lien copié ! Colle-le dans un message.');
    } catch {
      this.status.set(`Copie ce lien : ${url}`);
    }
  }
}
