export { AsyncButtonDirective } from './lib/async-button.directive';
export { CopyButton } from './lib/copy-button.component';
export { DataTable } from './lib/data-table/data-table.component';
export { DataTableRowActionsDirective } from './lib/data-table/data-table-row-actions.directive';
export type {
  DataCellContext,
  DataColumn,
  DataPage,
  DataQuery,
  DataSource,
  SortDirection,
} from './lib/data-table/data-table.types';
export { EmptyState } from './lib/empty-state.component';
export { FormErrors } from './lib/form-errors.component';
export { PageHeader } from './lib/page-header.component';
export { PasswordRevealButton } from './lib/password-reveal-button.component';
export { RelativeTime, RelativeTimeClock } from './lib/relative-time.component';
export { StatusBadge, type StatusTone } from './lib/status-badge.component';

// Brand components — charter « Brocante en savane » (DESIGN.md).
export { GiraffeBand } from './lib/brand/giraffe-band.component';
export { InkCard } from './lib/brand/ink-card.component';
export { LinkPill } from './lib/brand/link-pill.component';
export { PriceTag, type PriceTagVariant } from './lib/brand/price-tag.component';
export { Stamp, type StampKind } from './lib/brand/stamp.component';
export { Switch } from './lib/brand/switch.component';
export { Kiki } from './lib/brand/kiki.component';
export type { KikiMood, KikiTreasure } from './lib/brand/kiki.model';
export { KikiSounds, type KikiSound } from './lib/brand/kiki-sound.service';
export { Confetti, type ConfettiOptions } from './lib/brand/confetti.service';
export { BabyBottle } from './lib/brand/baby-bottle.component';
export { Doudou } from './lib/brand/doudou.component';
export { Hochet } from './lib/brand/hochet.component';
export { KIKI_TREASURES, KikiTreasures } from './lib/brand/treasures.store';
export { KIKI_HUG_MS } from './lib/brand/kiki.model';
export { KikiDiscoveries, type KikiDiscovery } from './lib/brand/discoveries.store';
