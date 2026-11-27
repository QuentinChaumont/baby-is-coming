import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { AdminItem } from '@org/shared-contracts';
import {
  ImageCropperComponent,
  type CropperPosition,
  type ImageCroppedEvent,
} from 'ngx-image-cropper';
import { AdminApi } from './admin-api.service';
import { apiErrorCode } from '../public/public-api.service';
import {
  PADDING_COLOR,
  PHOTO_RATIO,
  fillFrame,
  padToFrame,
  wholePhoto,
  type PaddedPhoto,
} from './photo-padding';

const MAX_BYTES = 10 * 1024 * 1024;

const ERRORS: Record<string, string> = {
  PHOTO_UNREADABLE:
    "Cette image n'a pas pu être lue. Essaie une photo JPEG ou PNG.",
  PHOTO_FORMAT: 'Formats acceptés : JPEG, PNG ou WebP.',
  TOO_MANY_PHOTOS: '6 photos maximum par objet.',
};

/**
 * Add a photo to an item (DEV step 4.2, PRODUCT D20): pick a file, frame
 * it at the site's 4:5 ratio in the browser, upload the crop as JPEG; the
 * server makes the WebP renditions and strips metadata. The photo is put on
 * a kraft background first, so the frame can grow past its edges: zooming
 * out shows the whole photo with bands instead of cutting it.
 */
@Component({
  selector: 'app-photo-uploader',
  imports: [ImageCropperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (padded(); as picked) {
      <div class="uploader__crop">
        <image-cropper
          [imageFile]="picked.file"
          [cropper]="frame()"
          [aspectRatio]="ratio"
          [maintainAspectRatio]="true"
          [resizeToWidth]="1600"
          [onlyScaleDown]="true"
          format="jpeg"
          [imageQuality]="88"
          output="blob"
          [autoCrop]="true"
          [backgroundColor]="background"
          (cropperReady)="ready($event)"
          (imageCropped)="cropped.set($event)"
          (loadImageFailed)="fail(ERRORS['PHOTO_UNREADABLE'])"
          cropperFrameAriaLabel="Cadre de recadrage"
        />
        @if (!picked.fits) {
          <div class="uploader__zoom" role="group" aria-label="Cadrage">
            <button
              type="button"
              class="app-button app-button--outline"
              [disabled]="!shown()"
              (click)="showWhole()"
            >
              Photo entière
            </button>
            <button
              type="button"
              class="app-button app-button--outline"
              [disabled]="!shown()"
              (click)="fill()"
            >
              Remplir le cadre
            </button>
          </div>
          <p class="uploader__hint">
            Ou agrandis / réduis le cadre avec ses poignées.
          </p>
        }
        <div class="uploader__actions">
          <button
            type="button"
            class="app-button app-button--ink"
            [disabled]="!cropped() || busy()"
            (click)="upload()"
          >
            {{ busy() ? 'Envoi…' : 'Ajouter cette photo' }}
          </button>
          <button
            type="button"
            class="app-button app-button--outline"
            (click)="reset()"
          >
            Annuler
          </button>
        </div>
      </div>
    } @else {
      <label class="app-button app-button--outline uploader__pick">
        <input
          #picker
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          (change)="pick($event)"
        />
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
    .uploader__hint {
      margin: 0;
      color: var(--app-color-on-surface-variant);
      font-size: 0.9rem;
    }
    .uploader__zoom,
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
  protected readonly ratio = PHOTO_RATIO;
  protected readonly background = PADDING_COLOR;

  readonly itemId = input.required<string>();
  readonly uploaded = output<AdminItem>();

  protected readonly padded = signal<PaddedPhoto | null>(null);
  /** Cropper display size, known once it is ready. */
  protected readonly shown = signal<{ width: number; height: number } | null>(
    null,
  );
  protected readonly frame = signal<CropperPosition | undefined>(undefined);
  protected readonly cropped = signal<ImageCroppedEvent | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly picker = viewChild<{ nativeElement: HTMLInputElement }>(
    'picker',
  );

  protected async pick(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.error.set(null);
    if (!file) return;
    if (file.size > MAX_BYTES) {
      this.fail('Photo trop lourde (10 Mo maximum).');
      return;
    }
    try {
      this.padded.set(await padToFrame(file));
    } catch {
      this.fail(ERRORS['PHOTO_UNREADABLE']);
    }
  }

  /** Start like before: the photo fills the frame, nothing added. */
  protected ready(shown: { width: number; height: number }): void {
    this.shown.set(shown);
    this.fill();
  }

  protected fill(): void {
    const padded = this.padded();
    const shown = this.shown();
    if (padded && shown) this.frame.set(fillFrame(padded, shown));
  }

  protected showWhole(): void {
    const shown = this.shown();
    if (shown) this.frame.set(wholePhoto(shown));
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
        this.fail(
          ERRORS[apiErrorCode(err) ?? ''] ?? "L'envoi a échoué. Réessaie.",
        );
      },
    });
  }

  protected reset(): void {
    this.padded.set(null);
    this.shown.set(null);
    this.frame.set(undefined);
    this.cropped.set(null);
    const picker = this.picker()?.nativeElement;
    if (picker) picker.value = '';
  }

  protected fail(message: string): void {
    this.error.set(message);
    this.reset();
  }
}
