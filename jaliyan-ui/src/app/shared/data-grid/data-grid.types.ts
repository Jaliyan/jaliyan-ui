/**
 * Configuration contracts for the reusable {@link DataGridComponent}.
 * A screen declares its columns/quick-filters once and the grid renders a
 * premium desktop table + mobile card list with search, per-column filtering,
 * sorting and pagination.
 */

export type DataGridColumnType = 'text' | 'avatar' | 'badge' | 'status';

export interface DataGridColumn {
  /** Property key on the row; also used as the sort id. */
  key: string;
  /** Header label (or i18n key when {@link translateHeader} is true). */
  header: string;
  /** Cell renderer. Defaults to `text`. */
  type?: DataGridColumnType;
  /** Translate the header label with ngx-translate. */
  translateHeader?: boolean;
  /** Show a sort arrow / enable sorting on this column. */
  sortable?: boolean;
  /** Show a per-column filter input under the header. */
  filterable?: boolean;
  /** Render numeric cell values in Gujarati digits. */
  gujaratiDigits?: boolean;
  /** Leading Material icon name for `text`/`badge` cells. */
  icon?: string;
  /** Hide this column in the mobile card view. */
  hideOnMobile?: boolean;

  /** Custom cell text. Overrides the raw `row[key]`. */
  format?: (value: any, row: any) => string;

  /** `avatar`: builds the secondary line under the name. */
  subtitleFormat?: (row: any) => string;

  /** `status`: labels for truthy / falsy values (i18n keys or literals). */
  statusTrueLabel?: string;
  statusFalseLabel?: string;
  /** `status`: translate the labels. */
  translateStatus?: boolean;
  /** `status`: when true, the truthy value is the positive (green) state.
   *  Default false => falsy value is positive (e.g. "Active" vs "Returned"). */
  statusTruePositive?: boolean;
}

export interface DataGridQuickFilter {
  /** Unique key; `all` is reserved for the default "show everything" chip. */
  key: string;
  /** Chip label (or i18n key when {@link translate} is true). */
  label: string;
  translate?: boolean;
  /** Row predicate. Omit for the `all` chip. */
  predicate?: (row: any) => boolean;
}
