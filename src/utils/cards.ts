/**
 * Card content helpers
 *
 * Small formatting helpers and label/colour maps that previously lived inside
 * the per-type card wrapper components. They live here so the listing pages can
 * fill the single Card's slots directly without duplicating this logic.
 */

/** Colours accepted by the Label primitive. */
type LabelColor = 'neutral' | 'accent' | 'green' | 'purple' | 'amber' | 'pink';

/**
 * Truncates text to a maximum length with an ellipsis.
 *
 * If the text is shorter than `maxLength`, returns it unchanged. Trims trailing
 * whitespace before adding the ellipsis. Used to keep decision-card heights
 * consistent.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/** Project status -> display label + Label colour. */
export const statusConfig: Record<
  'completed' | 'ongoing' | 'archived',
  { label: string; color: LabelColor }
> = {
  completed: { label: 'Completed', color: 'neutral' },
  ongoing: { label: 'Ongoing', color: 'green' },
  archived: { label: 'Archived', color: 'neutral' },
};

/** Talk type -> display label. */
export const talkTypeLabels: Record<
  'conference' | 'meetup' | 'podcast' | 'workshop' | 'webinar',
  string
> = {
  conference: 'Conference',
  meetup: 'Meetup',
  podcast: 'Podcast',
  workshop: 'Workshop',
  webinar: 'Webinar',
};

/** Talk type -> Label colour. */
export const talkTypeColors: Record<
  'conference' | 'meetup' | 'podcast' | 'workshop' | 'webinar',
  LabelColor
> = {
  conference: 'accent',
  meetup: 'green',
  podcast: 'purple',
  workshop: 'amber',
  webinar: 'pink',
};

/** Timeline entry type -> display label. */
export const timelineTypeLabels: Record<'milestone' | 'learning' | 'transition', string> = {
  milestone: 'Milestone',
  learning: 'Learning',
  transition: 'Transition',
};

/** Timeline entry type -> Label colour. */
export const timelineTypeColors: Record<
  'milestone' | 'learning' | 'transition',
  LabelColor
> = {
  milestone: 'accent',
  learning: 'green',
  transition: 'amber',
};
