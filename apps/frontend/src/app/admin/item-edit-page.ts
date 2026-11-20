import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type {
  AdminItem,
  AdminListing,
  ItemDestination,
  ItemPublication,
  ListingStatus,
  UpdateItemRequest,
} from '@org/shared-contracts';
import { AdminApi } from './admin-api.service';
import { PUBLICATION_LABEL } from './items-page';
import { PhotoUploader } from './photo-uploader';
import { apiErrorCode } from '../public/public-api.service';
import {
  LISTING_STATUS_LABEL,
  errorText,
  optionalNumber,
} from './item-edit.helpers';

/**
 * Create / edit an item (DEV step 4.2): details, photos (cropped in the
 * browser), publication, listings, deletion.
 */
@Component({
  selector: 'app-item-edit-page',
  imports: [ReactiveFormsModule, RouterLink, PhotoUploader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-edit-page.html',
  styleUrl: './item-edit-page.scss',
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
  protected readonly message = signal<{ text: string; error: boolean } | null>(
    null,
  );

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: [''],
    price: [null as number | null, Validators.min(0)],
    priceMax: [null as number | null, Validators.min(0)],
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
        error: () =>
          this.message.set({
            text: "Cet objet n'a pas pu se charger.",
            error: true,
          }),
      });
      this.api
        .listings(id)
        .subscribe((listings) => this.listings.set(listings));
    });
  }

  private loaded(item: AdminItem): void {
    this.item.set(item);
    this.form.setValue({
      title: item.title,
      description: item.description,
      price: item.price,
      priceMax: item.priceMax,
      quantity: item.quantity,
    });
  }

  protected save(): void {
    if (this.form.invalid || !this.form.getRawValue().title.trim()) {
      this.message.set({
        text: 'Un titre, au minimum (et des prix positifs).',
        error: true,
      });
      return;
    }
    const value = this.form.getRawValue();
    const body = {
      title: value.title,
      description: value.description,
      price: optionalNumber(value.price),
      priceMax: optionalNumber(value.priceMax),
      quantity: Number(value.quantity),
    };
    this.busy.set(true);
    const current = this.item();
    const request = current
      ? this.api.updateItem(current.id, body)
      : this.api.createItem(body);
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
        this.message.set({
          text: errorText(err, "L'enregistrement a échoué."),
          error: true,
        });
      },
    });
  }

  protected setDestination(destination: ItemDestination): void {
    const current = this.item();
    if (!current || current.destination === destination) return;
    this.update(
      { destination },
      destination === 'cagnotte'
        ? 'Objet passé dans la cagnotte.'
        : 'Objet passé dans la liste des amis.',
    );
  }

  protected setBought(bought: boolean): void {
    const current = this.item();
    if (current)
      this.update(
        { bought },
        bought ? 'Marqué acheté.' : 'Plus marqué acheté.',
      );
  }

  private update(patch: UpdateItemRequest, done: string): void {
    const current = this.item();
    if (!current) return;
    this.api.updateItem(current.id, patch).subscribe({
      next: (item) => {
        this.item.set(item);
        this.message.set({ text: done, error: false });
      },
      error: (err: unknown) =>
        this.message.set({
          text: errorText(err, 'Le changement a échoué.'),
          error: true,
        }),
    });
  }

  protected publish(publication: ItemPublication): void {
    const current = this.item();
    if (!current) return;
    this.api.updateItem(current.id, { publication }).subscribe({
      next: (item) => {
        this.item.set(item);
        this.message.set({
          text: `Statut : ${PUBLICATION_LABEL[publication].toLowerCase()}.`,
          error: false,
        });
      },
      error: (err: unknown) =>
        this.message.set({
          text: errorText(err, 'Le changement a échoué.'),
          error: true,
        }),
    });
  }

  protected removePhoto(photoId: string): void {
    const current = this.item();
    if (!current) return;
    this.api.deletePhoto(current.id, photoId).subscribe({
      next: (item) => this.item.set(item),
      error: (err: unknown) =>
        this.message.set({
          text:
            apiErrorCode(err) === 'PHOTO_REQUIRED'
              ? 'Un objet publié garde au moins une photo.'
              : "La photo n'a pas pu être retirée.",
          error: true,
        }),
    });
  }

  protected remove(): void {
    const current = this.item();
    if (!current) return;
    this.api.deleteItem(current.id).subscribe({
      next: () => void this.router.navigate(['/admin/objets']),
      error: (err: unknown) =>
        this.message.set({
          text: errorText(err, 'La suppression a échoué.'),
          error: true,
        }),
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
        price:
          value.price === null || (value.price as unknown) === ''
            ? null
            : Number(value.price),
        location: value.location.trim() || null,
      })
      .subscribe({
        next: (listing) => {
          this.listings.update((all) => [listing, ...all]);
          this.listingForm.reset();
        },
        error: (err: unknown) =>
          this.message.set({
            text: errorText(
              err,
              'Lien invalide : il doit commencer par https://',
            ),
            error: true,
          }),
      });
  }

  protected setListing(listing: AdminListing, status: ListingStatus): void {
    this.api
      .updateListing(listing.id, { status })
      .subscribe((updated) =>
        this.listings.update((all) =>
          all.map((l) => (l.id === updated.id ? updated : l)),
        ),
      );
  }

  protected deleteListing(listing: AdminListing): void {
    this.api
      .deleteListing(listing.id)
      .subscribe(() =>
        this.listings.update((all) => all.filter((l) => l.id !== listing.id)),
      );
  }
}
