import { ChangeDetectionStrategy, Component, inject, input, output, signal, viewChild } from '@angular/core';
import type { AdminItem } from '@org/shared-contracts';
import { ImageCropperComponent, type ImageCroppedEvent } from 'ngx-image-cropper';
import { AdminApi } from './admin-api.service';
import { apiErrorCode } from '../public/public-api.service';

const MAX_BYTES = 10 * 1024 * 1024;

const ERRORS: Record<string, string> = {
  PHOTO_UNREADABLE: "Cette image n'a pas pu être lue. Essaie une photo JPEG ou PNG.",
  PHOTO_FORMAT: 'Formats acceptés : JPEG, PNG ou WebP.',
  TOO_MANY_PHOTOS: '6 photos maximum par objet.',
};

/**
 * Add a photo to an item (DEV step 4.2, PRODUCT D20): pick a file, frame
 * it at the site's 4:5 ratio in the browser, upload the crop as JPEG; the
 * server makes the WebP renditions and strips metadata.
 */
@Component({
  selector: 'app-photo-uploader',
  imports: [ImageCropperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (file(); as picked) {
      <div class="uploader__crop">
        <image-cropper
          [imageFile]="picked"
          [aspectRatio]="4 / 5"
          [maintainAspectRatio]="true"
          [resizeToWidth]="1600"
          [onlyScaleDown]="true"
          format="jpeg"
          [imageQuality]="88"
          output="blob"
          [autoCrop]="true"
          (imageCropped)="cropped.set($event)"
          (loadImageFailed)="fail(ERRORS['PHOTO_UNREADABLE'])"
          cropperFrameAriaLabel="Cadre de recadrage"
        />
        <div class="uploader__actions">
          <button type="button" class="app-button app-button--ink" [disabled]="!cropped() || busy()" (click)="upload()">
            {{ busy() ? 'Envoi…' : 'Ajouter cette photo' }}
          </button>
          <button type="button" class="app-button app-button--outline" (click)="reset()">Annuler</button>
        </div>
      </div>
    } @else {
      <label class="app-button app-button--outline uploader__pick">
        <input #picker type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" (change)="pick($event)" />
        Ajouter une photo
      </label>
    }
    @if (error(); as message) {
      <p class="uploader__error" role="alert">{{ message }}</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .uploader__pick input {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
    }
    .uploader__pick:focus-within {
      outline: 3px solid var(--app-color-sage-strong);
      outline-offset: 2px;
    }
    .uploader__crop {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 420px;
    }
    .uploader__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .uploader__error {
      margin: 0;
      color: var(--app-color-error);
      font-weight: 800;
    }
  `,
})
export class PhotoUploader {
  private readonly api = inject(AdminApi);
  protected readonly ERRORS = ERRORS;

  readonly itemId = input.required<string>();
  readonly uploaded = output<AdminItem>();

  protected readonly file = signal<File | null>(null);
  protected readonly cropped = signal<ImageCroppedEvent | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly picker = viewChild<{ nativeElement: HTMLInputElement }>('picker');

  protected pick(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.error.set(null);
    if (!file) return;
    if (file.size > MAX_BYTES) {
      this.fail('Photo trop lourde (10 Mo maximum).');
      return;
    }
    this.file.set(file);
  }

  protected upload(): void {
    const blob = this.cropped()?.blob;
    if (!blob) return;
    this.busy.set(true);
    this.api.uploadPhoto(this.itemId(), blob).subscribe({
      next: (item) => {
        this.busy.set(false);
        this.reset();
        this.uploaded.emit(item);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.fail(ERRORS[apiErrorCode(err) ?? ''] ?? "L'envoi a échoué. Réessaie.");
      },
    });
  }

  protected reset(): void {
    this.file.set(null);
    this.cropped.set(null);
    const picker = this.picker()?.nativeElement;
    if (picker) picker.value = '';
  }

  protected fail(message: string): void {
    this.error.set(message);
    this.reset();
  }
}
