import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PriceTag, Stamp, type StampKind } from '@org/frontend-ui';
import type { PublicItem, PublicTaker } from '@org/shared-contracts';

/** « par Paul M. » / « par quelqu'un de discret » — nothing for an item
 * the parents marked taken themselves. */
export function takenByLine(takers: PublicTaker[]): string | null {
  const names = takers
    .filter((t) => t.kind !== 'parents')
    .map((t) => t.name ?? "quelqu'un de discret");
  return names.length ? `par ${[...new Set(names)].join(', ')}` : null;
}

/** The stamp of a taken item: « Adopté ! » when it was given, else
 * « Chassé ! ». */
export function stampOf(takers: PublicTaker[]): StampKind {
  return takers.some((t) => t.kind === 'don') && takers.every((t) => t.kind !== 'chasse')
    ? 'don'
    : 'chasse';
}

/** A gift in the list grid: 4:5 photo with its handwritten price, a stamp
 * once taken, the title and who took it. */
@Component({
  selector: 'app-item-card',
  imports: [RouterLink, PriceTag, Stamp],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="card" [routerLink]="['/objet', item().id]">
      <div class="card__photo">
        @if (item().photos[0]; as photo) {
          <img [src]="photo.thumbUrl" alt="" loading="lazy" decoding="async" />
        }
        <lib-price-tag class="card__price" [amount]="item().price" />
        @if (taken()) {
          <span class="card__veil"><lib-stamp [kind]="stamp()" /></span>
        }
      </div>
      <span class="card__title">{{ item().title }}</span>
      @if (taken() && takenBy(); as by) {
        <span class="card__by">{{ by }}</span>
      } @else if (item().quantity > 1 && !taken()) {
        <span class="card__by">Encore {{ item().remaining }} sur {{ item().quantity }}</span>
      }
    </a>
  `,
  styles: `
    .card {
      display: flex;
      flex-direction: column;
      gap: 8px;
      color: var(--app-color-ink);
      text-decoration: none;
    }
    .card__photo {
      position: relative;
      aspect-ratio: 4 / 5;
      border-radius: var(--app-radius-lg);
      background: var(--app-color-kraft);
      overflow: hidden;
    }
    .card__photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .card__price {
      position: absolute;
      top: 10px;
      left: -4px;
    }
    .card__veil {
      position: absolute;
      inset: 0;
      background: rgba(251, 247, 238, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card__title {
      font-weight: 800;
      font-size: 0.9375rem;
      line-height: 1.25;
    }
    .card__by {
      font-size: 0.8125rem;
      color: var(--app-color-on-surface-variant);
    }
    .card__photo {
      transition: transform var(--app-duration) var(--app-ease-out);
    }
    @media (hover: hover) {
      .card:hover .card__photo {
        transform: translateY(-3px) rotate(-0.4deg);
      }
    }
    .card:hover .card__title {
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  `,
})
export class ItemCard {
  readonly item = input.required<PublicItem>();

  protected readonly taken = computed(() => this.item().availability === 'taken');
  protected readonly stamp = computed(() => stampOf(this.item().takers));
  protected readonly takenBy = computed(() => takenByLine(this.item().takers));
}
