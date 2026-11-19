import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { AdminItem, AdminListing, ItemPublication, ListingStatus } from '@org/shared-contracts';
import { AdminApi } from './admin-api.service';
import { PUBLICATION_LABEL } from './items-page';
import { PhotoUploader } from './photo-uploader';
import { apiErrorCode } from '../public/public-api.service';

const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  active: 'Visible',
  hidden: 'Masquée',
  expired: 'Expirée',
};

const ERRORS: Record<string, string> = {
  PHOTO_REQUIRED: 'Ajoute au moins une photo avant de publier.',
  QUANTITY_BELOW_TAKEN: 'Impossible : des unités sont déjà prises.',
  ITEM_HAS_PARTICIPATIONS: "Cet objet a déjà été pris : archive-le plutôt que de le supprimer.",
  LISTING_DUPLICATE: 'Cette annonce est déjà ajoutée.',
};
const errorText = (err: unknown, fallback: string) => ERRORS[apiErrorCode(err) ?? ''] ?? fallback;

/**
 * Create / edit an item (DEV step 4.2): details, photos (cropped in the
 * browser), publication, listings, deletion.
 */
@Component({
  selector: 'app-item-edit-page',
  imports: [ReactiveFormsModule, RouterLink, PhotoUploader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="edit">
      <a routerLink="/admin/objets" class="edit__back">← Tous les objets</a>
      <h1>{{ isNew() ? 'Nouvel objet' : (item()?.title ?? 'Objet') }}</h1>

      @if (message(); as m) {
        <p class="edit__message" [class.edit__message--error]="m.error" [attr.role]="m.error ? 'alert' : 'status'">{{ m.text }}</p>
      }

      <form class="edit__card" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <h2>Détails</h2>
        <label class="edit__field">
          <span>Titre</span>
          <input formControlName="title" required maxlength="120" />
        </label>
        <label class="edit__field">
          <span>Description <em>(critères, taille, « pliable d'une main svp »…)</em></span>
          <textarea formControlName="description" rows="4" maxlength="2000"></textarea>
        </label>
        <div class="edit__row">
          <label class="edit__field">
            <span>Prix seconde main indicatif (€)</span>
            <input formControlName="price" type="number" min="0" step="1" required />
          </label>
          <label class="edit__field">
            <span>Quantité</span>
            <input formControlName="quantity" type="number" min="1" max="99" step="1" required />
          </label>
        </div>
        <button type="submit" class="app-button app-button--ink" [disabled]="busy()">
          {{ isNew() ? "Créer l'objet" : 'Enregistrer' }}
        </button>
      </form>

      @if (item(); as it) {
        <section class="edit__card">
          <h2>Photos</h2>
          <ul class="edit__photos">
            @for (photo of it.photos; track photo.id; let first = $first) {
              <li>
                <img [src]="photo.thumbUrl" [alt]="first ? 'Photo principale' : 'Photo'" />
                <button type="button" class="edit__link" (click)="removePhoto(photo.id)">Retirer</button>
              </li>
            }
          </ul>
          <app-photo-uploader [itemId]="it.id" (uploaded)="item.set($event)" />
        </section>

        <section class="edit__card">
          <h2>Publication</h2>
          <p>Statut : <strong>{{ publicationLabel[it.publication] }}</strong>
            · {{ it.availability === 'taken' ? 'pris' : 'disponible' }}
            @if (it.takenQuantity) { ({{ it.takenQuantity }}/{{ it.quantity }} pris) }
          </p>
          <div class="edit__buttons">
            @if (it.publication !== 'published') {
              <button type="button" class="app-button app-button--ink" (click)="publish('published')">Publier</button>
            }
            @if (it.publication !== 'draft') {
              <button type="button" class="app-button app-button--outline" (click)="publish('draft')">Repasser en brouillon</button>
            }
            @if (it.publication !== 'archived') {
              <button type="button" class="app-button app-button--outline" (click)="publish('archived')">Archiver</button>
            }
          </div>
          @if (it.takenQuantity === 0) {
            @if (confirmDelete()) {
              <p>Supprimer définitivement « {{ it.title }} » ?</p>
              <div class="edit__buttons">
                <button type="button" class="app-button app-button--outline edit__danger" (click)="remove()">Oui, supprimer</button>
                <button type="button" class="app-button app-button--outline" (click)="confirmDelete.set(false)">Non</button>
              </div>
            } @else {
              <button type="button" class="edit__link edit__danger" (click)="confirmDelete.set(true)">Supprimer l'objet</button>
            }
          } @else {
            <p class="edit__hint">Cet objet a été pris : il ne peut qu'être archivé. Préviens les personnes concernées (voir Participations).</p>
          }
        </section>

        <section class="edit__card">
          <h2>Annonces seconde main</h2>
          @if (listings().length) {
            <ul class="edit__listings">
              @for (l of listings(); track l.id) {
                <li>
                  <a [href]="l.url" target="_blank" rel="noopener noreferrer">{{ l.title || l.url }}</a>
                  <span>{{ l.platform }}@if (l.price !== null) { · {{ l.price }} €}@if (l.location) { · {{ l.location }}}</span>
                  <span class="edit__badge">{{ listingStatusLabel[l.status] }}</span>
                  @if (l.status !== 'active') {
                    <button type="button" class="edit__link" (click)="setListing(l, 'active')">Rendre visible</button>
                  } @else {
                    <button type="button" class="edit__link" (click)="setListing(l, 'hidden')">Masquer</button>
                    <button type="button" class="edit__link" (click)="setListing(l, 'expired')">Expirée</button>
                  }
                  <button type="button" class="edit__link edit__danger" (click)="deleteListing(l)">Supprimer</button>
                </li>
              }
            </ul>
          } @else {
            <p>Aucune annonce. Colle le lien d'une annonce Leboncoin, Vinted… pour aider les chasseurs.</p>
          }
          <form class="edit__listing-form" [formGroup]="listingForm" (ngSubmit)="addListing()" novalidate>
            <label class="edit__field">
              <span>Lien de l'annonce (https://…)</span>
              <input formControlName="url" type="url" required />
            </label>
            <div class="edit__row">
              <label class="edit__field"><span>Titre <em>(facultatif)</em></span><input formControlName="title" /></label>
              <label class="edit__field"><span>Prix (€)</span><input formControlName="price" type="number" min="0" step="1" /></label>
              <label class="edit__field"><span>Ville</span><input formControlName="location" /></label>
            </div>
            <button type="submit" class="app-button app-button--outline">Ajouter l'annonce</button>
          </form>
        </section>
      }
    </div>
  `,
  styles: `
    .edit {
      max-width: 48rem;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .edit h1 {
      margin: 0;
      font-size: 2rem;
    }
    .edit h2 {
      margin: 0 0 4px;
      font-size: 1.25rem;
    }
    .edit__back {
      font-weight: 800;
    }
    .edit__card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 18px 20px;
      background: var(--app-color-surface);
      border: var(--app-border-ink);
      border-radius: var(--app-radius-lg);
    }
    .edit__card > p {
      margin: 0;
    }
    .edit__field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-weight: 800;
      font-size: 0.875rem;
      flex: 1 1 10rem;
    }
    .edit__field em {
      font-weight: 400;
      font-style: normal;
    }
    .edit input,
    .edit textarea {
      min-height: 44px;
      padding: 8px 12px;
      box-sizing: border-box;
      border: var(--app-border-ink);
      border-radius: var(--app-radius-md);
      background: var(--app-color-surface);
      font: inherit;
      font-size: 1rem;
      color: var(--app-color-ink);
    }
    .edit__row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .edit__photos {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .edit__photos li {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .edit__photos img {
      width: 96px;
      aspect-ratio: 4 / 5;
      object-fit: cover;
      border-radius: 8px;
    }
    .edit__buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .edit__link {
      align-self: flex-start;
      border: 0;
      background: transparent;
      padding: 4px 0;
      font: inherit;
      font-weight: 800;
      text-decoration: underline;
      text-underline-offset: 3px;
      color: var(--app-color-ink);
      cursor: pointer;
    }
    .edit__danger {
      color: var(--app-color-error);
    }
    .edit__hint {
      font-size: 0.875rem;
      color: var(--app-color-on-surface-variant);
    }
    .edit__listings {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .edit__listings li {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 12px;
    }
    .edit__badge {
      padding: 2px 8px;
      border-radius: var(--app-radius-sm);
      background: var(--app-color-surface-variant);
      font-size: 0.8125rem;
      font-weight: 800;
    }
    .edit__listing-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 8px;
      border-top: var(--app-border-hairline);
    }
    .edit__message {
      margin: 0;
      font-weight: 800;
    }
    .edit__message--error {
      color: var(--app-color-error);
    }
  `,
})
export class ItemEditPage {
  private readonly api = inject(AdminApi);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly publicationLabel = PUBLICATION_LABEL;
  protected readonly listingStatusLabel = LISTING_STATUS_LABEL;

  /** Route param: an item id, or absent for `objets/nouveau`. */
  readonly id = input<string>();

  protected readonly isNew = computed(() => !this.id());
  protected readonly item = signal<AdminItem | null>(null);
  protected readonly listings = signal<AdminListing[]>([]);
  protected readonly busy = signal(false);
  protected readonly confirmDelete = signal(false);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });
  protected readonly listingForm = this.fb.group({
    url: ['', Validators.required],
    title: [''],
    price: [null as number | null],
    location: [''],
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      this.api.item(id).subscribe({
        next: (item) => this.loaded(item),
        error: () => this.message.set({ text: "Cet objet n'a pas pu se charger.", error: true }),
      });
      this.api.listings(id).subscribe((listings) => this.listings.set(listings));
    });
  }

  private loaded(item: AdminItem): void {
    this.item.set(item);
    this.form.setValue({
      title: item.title,
      description: item.description,
      price: item.price,
      quantity: item.quantity,
    });
  }

  protected save(): void {
    if (this.form.invalid || !this.form.getRawValue().title.trim()) {
      this.message.set({ text: 'Un titre et un prix, au minimum.', error: true });
      return;
    }
    const value = this.form.getRawValue();
    const body = {
      title: value.title,
      description: value.description,
      price: Number(value.price),
      quantity: Number(value.quantity),
    };
    this.busy.set(true);
    const current = this.item();
    const request = current ? this.api.updateItem(current.id, body) : this.api.createItem(body);
    request.subscribe({
      next: (item) => {
        this.busy.set(false);
        if (!current) {
          void this.router.navigate(['/admin/objets', item.id]);
          return;
        }
        this.loaded(item);
        this.message.set({ text: 'Enregistré.', error: false });
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.message.set({ text: errorText(err, "L'enregistrement a échoué."), error: true });
      },
    });
  }

  protected publish(publication: ItemPublication): void {
    const current = this.item();
    if (!current) return;
    this.api.updateItem(current.id, { publication }).subscribe({
      next: (item) => {
        this.item.set(item);
        this.message.set({ text: `Statut : ${PUBLICATION_LABEL[publication].toLowerCase()}.`, error: false });
      },
      error: (err: unknown) => this.message.set({ text: errorText(err, 'Le changement a échoué.'), error: true }),
    });
  }

  protected removePhoto(photoId: string): void {
    const current = this.item();
    if (!current) return;
    this.api.deletePhoto(current.id, photoId).subscribe({
      next: (item) => this.item.set(item),
      error: (err: unknown) =>
        this.message.set({
          text: apiErrorCode(err) === 'PHOTO_REQUIRED' ? 'Un objet publié garde au moins une photo.' : 'La photo n\'a pas pu être retirée.',
          error: true,
        }),
    });
  }

  protected remove(): void {
    const current = this.item();
    if (!current) return;
    this.api.deleteItem(current.id).subscribe({
      next: () => void this.router.navigate(['/admin/objets']),
      error: (err: unknown) => this.message.set({ text: errorText(err, 'La suppression a échoué.'), error: true }),
    });
  }

  protected addListing(): void {
    const current = this.item();
    const value = this.listingForm.getRawValue();
    if (!current || !value.url.trim()) return;
    this.api
      .createListing(current.id, {
        url: value.url.trim(),
        title: value.title.trim() || null,
        price: value.price === null || (value.price as unknown) === '' ? null : Number(value.price),
        location: value.location.trim() || null,
      })
      .subscribe({
        next: (listing) => {
          this.listings.update((all) => [listing, ...all]);
          this.listingForm.reset();
        },
        error: (err: unknown) =>
          this.message.set({ text: errorText(err, 'Lien invalide : il doit commencer par https://'), error: true }),
      });
  }

  protected setListing(listing: AdminListing, status: ListingStatus): void {
    this.api.updateListing(listing.id, { status }).subscribe((updated) =>
      this.listings.update((all) => all.map((l) => (l.id === updated.id ? updated : l))),
    );
  }

  protected deleteListing(listing: AdminListing): void {
    this.api.deleteListing(listing.id).subscribe(() =>
      this.listings.update((all) => all.filter((l) => l.id !== listing.id)),
    );
  }
}
