# Components

Guide for modifying and creating components.

## Card Component

There is a single, slot-driven `Card.astro`. Call sites compose each kind of card by
filling its slots; there are no per-type card components. Styling is global in
`src/styles/cards.css`, and per-type formatting lives in `src/utils/cards.ts`.

| Slot | Purpose |
|------|---------|
| `badge` | Top label row (rendered raw — use for block content like a type label + date) |
| `meta` | Eyebrow line (wrapped in an inline span — text only) |
| `title` | Card heading |
| `description` | Summary text |
| `tags` | A `TagList` |
| default | Bespoke content (e.g. a talk's event line + slides/video links) |
| `cta` | Optional call-to-action — typically a `<ButtonGroup>` holding a forward `<Button>` |

Cards used directly on: projects, decisions, writing, and speaking listings. `TimelineEntry`
renders a `Card` for its content inside the timeline rail.

### Example: a project card

```astro
<Card>
  <div slot="badge" class="card-badges">
    {featured && <FeaturedBadge />}
    {status !== 'completed' && (
      <Label color={statusConfig[status].color} uppercase>{statusConfig[status].label}</Label>
    )}
  </div>

  <Fragment slot="meta">{role} · {year}</Fragment>
  <Fragment slot="title">{title}</Fragment>
  <Fragment slot="description">{outcomeSummary}</Fragment>

  <TagList slot="tags" items={techStack} max={4} />

  <ButtonGroup slot="cta">
    <Button href={`/projects/${slug}`} variant="secondary" size="sm" arrow>View case study</Button>
  </ButtonGroup>
</Card>
```

**Change displayed tech stack count:** adjust the `max` prop on `TagList` (e.g. `max={6}`).

**Add a new visual element:** put it in the default slot (between `tags` and `cta`), or in
`badge` for something above the title. Block-level markup must not go in the `meta` slot
(it is wrapped in an inline span).

## Adding New Fields to Content

### Step 1: Update Schema

Edit `src/content.config.ts`:

```typescript
const projectsCollection = defineCollection({
  schema: z.object({
    // Existing fields...
    title: z.string(),
    role: z.string(),
    
    // Add new field
    company: z.string().optional(),
    teamSize: z.number().optional(),
  }),
});
```

### Step 2: Update Component

Edit the component that displays the content:

```astro
---
interface Props {
  title: string;
  role: string;
  company?: string;
  teamSize?: number;
}

const { title, role, company, teamSize } = Astro.props;
---

<Card>
  <Fragment slot="meta">
    {role} · {year}
    {company && ` · ${company}`}
    {teamSize && ` · ${teamSize} engineers`}
  </Fragment>
</Card>
```

### Step 3: Update Content Files

```yaml
---
title: "Payment System Rebuild"
role: "Lead Engineer"
company: "Acme Corp"
teamSize: 4
---
```

## Creating New Components

### Basic Structure

```astro
---
interface Props {
  title: string;
  description?: string;
  variant?: 'default' | 'compact';
}

const { title, description, variant = 'default' } = Astro.props;
---

<div class:list={['component', variant]}>
  <h3 class="title">{title}</h3>
  {description && <p class="description">{description}</p>}
  <slot />
</div>

<style>
  .component {
    padding: var(--space-lg);
    background: var(--color-bg-elevated);
  }
  
  .component.compact {
    padding: var(--space-md);
  }
</style>
```

### Using CSS Custom Properties

Always use theme variables for consistency:

```css
/* ✅ Good */
.card {
  background: var(--color-bg-elevated);
  color: var(--color-text);
  padding: var(--space-lg);
  transition: var(--transition-base);
}

/* ❌ Bad - hardcoded values */
.card {
  background: #111111;
  color: #e5e5e5;
  padding: 24px;
}
```

## Page Customization

### Home Page

Edit `src/pages/index.astro`:
- Hero section text and CTAs
- Featured projects display
- Introduction content

### Contact Page

Edit `src/pages/contact.astro`:
- Contact messaging
- Response time expectations

### Navigation

Edit `src/components/Navigation.astro` for style changes.
Edit `src/config.ts` for navigation items.

### Footer

Edit `src/components/Footer.astro` for footer content.

## Adding New Pages

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import SEO from '../components/SEO.astro';
---

<BaseLayout>
  <SEO 
    slot="head"
    title="Page Title" 
    description="Page description" 
  />
  
  <main class="page-content">
    <!-- Your content -->
  </main>
</BaseLayout>

<style>
  .page-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }
</style>
```

**SEO Component Props:**
- `title` — Page title (automatically suffixed with author name)
- `description` — Meta description
- `type` — Open Graph type: `website` | `article` | `profile`
- `noSuffix` — Skip adding site name suffix (useful for homepage)

## Removing Sections

1. Remove from navigation in `src/config.ts`
2. Delete the page file (e.g., `src/pages/speaking.astro`)
3. Delete the content folder (e.g., `src/content/speaking/`)
4. Remove the collection from `src/content.config.ts`
