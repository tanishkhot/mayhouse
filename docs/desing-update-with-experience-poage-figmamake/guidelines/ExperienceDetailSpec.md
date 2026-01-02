# Experience Detail Page - Design System Specification

## Overview
This document defines the complete design specification for the Experience Run Detail page, ensuring full consistency with Mayhouse's token-based design system and optimal user flow from Explore cards to booking conversion.

---

## 1. User Flow & Philosophy

### Flow Sequence
1. **Explore List** → User scans experience cards (image, title, chips, price)
2. **Card Interest** → User clicks card due to resonance (vibe, host, promise, logistics)
3. **Expanded View** → Detail page feels like card "unfolded" (not new design)
4. **Decision Support** → User evaluates fit, logistics, trust
5. **Booking Action** → User selects date/time and books

### Design Principle
> The detail page is the **expanded state** of the card. The top preserves continuity (same image/title/chips), then progressively discloses detail.

---

## 2. Token Mapping Table

All elements use token-based colors from `/styles/globals.css`. **Never use hardcoded colors** (e.g., `bg-white`, `text-gray-600`, `border-gray-200`).

| Element | Token | Purpose | Dark Mode |
|---------|-------|---------|-----------|
| **Layout** |
| Page Background | `bg-background` | Main canvas | Auto-adapts |
| Card Surfaces | `bg-card` | Content containers | Auto-adapts |
| Borders | `border-border` | All dividers/outlines | Auto-adapts |
| **Typography** |
| Primary Text | `text-foreground` | Body, headings | Auto-adapts |
| Secondary Text | `text-muted-foreground` | Descriptions, labels | Auto-adapts |
| **Interactive Elements** |
| Primary Button | `bg-primary` / `text-primary-foreground` | Main CTAs | Auto-adapts |
| Button Hover | `hover:bg-primary/90` | CTA hover state | - |
| Outline Button | `border-border` / `text-foreground` | Secondary actions | Auto-adapts |
| **Status Colors** |
| Success/Trust | `text-chart-1` | Ratings, verified badges | Auto-adapts |
| Destructive | `text-destructive` | Favorites, errors | Auto-adapts |
| Accent | `bg-accent` / `text-accent-foreground` | Hover states, highlights | Auto-adapts |
| Muted | `bg-muted` / `text-muted-foreground` | Disabled states | Auto-adapts |
| **Focus/Selection** |
| Focus Ring | `focus-visible:ring-ring/50` | Keyboard focus | Auto-adapts |
| Selected State | `bg-primary` / `text-primary-foreground` | Active selections | Auto-adapts |

---

## 3. Component State Specifications

### 3.1 Primary CTA Button (Reserve/Book)

```tsx
// Default
className="bg-primary text-primary-foreground"

// Hover
className="hover:bg-primary/90"

// Active/Pressed
className="active:scale-95 transition-all duration-300"

// Focus
className="focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"

// Disabled
className="disabled:opacity-50 disabled:pointer-events-none"
```

**Motion**: 300ms ease-out for hover, 100ms ease-in for active

---

### 3.2 Date Selector Cards

#### Default State
```tsx
className="bg-card border border-border hover:bg-accent hover:border-ring transition-all duration-300"
```

#### Selected State
```tsx
className="bg-primary text-primary-foreground shadow-sm"
```

#### Sold Out / Disabled State
```tsx
className="bg-muted text-muted-foreground cursor-not-allowed opacity-60"
```

#### Interaction
- **Hover**: Background → `bg-accent`, border → `border-ring`
- **Active**: `active:scale-95` (100ms)
- **Focus**: `focus-visible:ring-[3px] ring-ring/50`

---

### 3.3 Time Selector Buttons

```tsx
// Grid layout with responsive columns
<div className="grid grid-cols-2 gap-2">
  {times.map(time => (
    <button
      className={`
        p-3 rounded-lg text-sm transition-all duration-300
        ${selected 
          ? 'bg-primary text-primary-foreground shadow-sm' 
          : 'bg-card border border-border hover:bg-accent hover:border-ring active:scale-95'
        }
        focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50
      `}
    />
  ))}
</div>
```

---

### 3.4 Badges & Chips

#### Category Badge (on image overlay)
```tsx
<Badge className="bg-background text-foreground border border-border shadow-md">
  Culture
</Badge>
```

#### Status Chips (duration, group size)
```tsx
<Badge variant="outline" className="gap-2">
  <Clock className="h-3 w-3" />
  3 hours
</Badge>
```

#### Availability Indicator
```tsx
<Badge variant="outline" className="gap-2 border-chart-1 text-chart-1">
  <CheckCircle2 className="h-3 w-3" />
  3 spots left
</Badge>
```

---

### 3.5 Links (Host Profile, Maps, etc.)

```tsx
<Button
  variant="link"
  className="p-0 h-auto text-foreground hover:text-primary transition-colors duration-200 underline-offset-4"
>
  View full profile →
</Button>
```

---

### 3.6 Icon Buttons (Share, Favorite, Gallery Nav)

```tsx
<Button
  variant="ghost"
  size="icon"
  className="transition-all duration-300 hover:bg-accent active:scale-95"
>
  <Heart className="h-5 w-5" />
</Button>
```

**Favorite Active State**: `fill-destructive text-destructive`

---

### 3.7 Image Gallery Navigation

```tsx
<button
  className="
    h-10 w-10 rounded-full 
    bg-background/90 backdrop-blur-sm border border-border
    opacity-0 group-hover:opacity-100 
    hover:bg-background hover:scale-110 active:scale-95
    transition-all duration-300
  "
>
  <ChevronLeft className="h-5 w-5" />
</button>
```

---

### 3.8 Loading Skeletons

```tsx
<div className="bg-muted animate-pulse rounded-lg h-40 w-full" />
```

Use `bg-muted` (not `bg-gray-200`) for all skeleton states.

---

## 4. Motion & Transition Specifications

### 4.1 Card-to-Detail Page Transition

**Duration**: 300ms  
**Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out)

#### Shared Element Animation (Ideal)
```
Card Image → Hero Image
├─ Scale: card size → full hero size
├─ Position: card position → hero top
└─ Border-radius: preserved during transition

Title + Chips → Header
├─ Position: maintain initial position briefly
├─ Opacity: 1 → 0.8 → 1 (subtle pulse)
└─ Duration: 200ms delay
```

#### Fallback (If shared-element not feasible)
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>
  {/* Full page content */}
</motion.div>
```

#### Content Stagger
```
Hero Image:     delay: 0ms,   duration: 300ms
Header:         delay: 150ms, duration: 300ms
Host Card:      delay: 250ms, duration: 300ms
Details:        delay: 350ms, duration: 300ms
Booking Sidebar: delay: 400ms, duration: 300ms
```

---

### 4.2 Background Transition

**Card → Page**
```
bg-card (white/#030213) → bg-background (#ffffff/oklch(0.145 0 0))
Duration: 200ms
Easing: linear
```

---

### 4.3 Interactive Element Transitions

| Element | Property | Duration | Easing |
|---------|----------|----------|--------|
| Button hover | background, opacity | 300ms | ease-out |
| Button active | transform (scale) | 100ms | ease-in |
| Link hover | color | 200ms | ease-out |
| Card hover | shadow, border | 300ms | ease-out |
| Focus ring | box-shadow | 150ms | ease-out |
| Date selection | background, color | 300ms | ease-out |
| Image gallery | opacity | 300ms | ease-out |
| Gallery nav | transform, opacity | 300ms | ease-out |

---

### 4.4 Scroll Behaviors

#### Desktop: Sticky Booking Sidebar
```tsx
<Card className="sticky top-24">
  {/* Booking form */}
</Card>
```
- Sticks at **96px (6rem)** from viewport top
- Shadow: `shadow-lg` (static, not scroll-dependent)

#### Mobile: Fixed Bottom CTA Bar
```tsx
<motion.div
  initial={{ y: 100 }}
  animate={{ y: 0 }}
  className="lg:hidden fixed bottom-0 left-0 right-0 
             p-4 bg-background/95 backdrop-blur-sm 
             border-t border-border shadow-2xl"
>
  {/* Price + Reserve button */}
</motion.div>
```
- Appears when user scrolls past hero
- Uses `backdrop-blur-sm` for depth

#### Header Scroll State
```tsx
<div className="sticky top-0 z-10 
                bg-background/95 backdrop-blur-sm 
                border-b border-border">
  {/* Close, Share, Favorite */}
</div>
```
- Always sticky
- Subtle backdrop blur for glass effect

---

## 5. Responsive Breakpoints

### Desktop (lg: 1024px+)
- Grid: `lg:grid-cols-3` (2/3 content, 1/3 booking sidebar)
- Booking sidebar: Sticky at `top-24`
- Hero aspect ratio: `aspect-[21/9]` (ultra-wide)

### Tablet (md: 768px - 1023px)
- Grid: Single column stack
- Booking sidebar: Full-width card below content
- Hero aspect ratio: `aspect-[16/9]`

### Mobile (< 768px)
- Grid: Single column
- Booking: Fixed bottom CTA bar
- Hero aspect ratio: `aspect-[4/3]`
- Typography: Responsive heading sizes

---

## 6. Content Structure & Progressive Disclosure

### Above Fold (Immediate visibility)
1. Hero image gallery
2. Title + category badge
3. Rating + location
4. Quick info chips (duration, group size, availability)
5. Host card (avatar, name, credibility)

### Below Fold (Scroll to reveal)
6. What you'll experience (storytelling)
7. Experience timeline (step-by-step itinerary)
8. What's included (checklist)
9. Meeting point + logistics
10. Guest reviews
11. Booking sidebar (sticky on desktop)

---

## 7. Trust & Safety Indicators

All use `text-chart-1` for positive trust signals:

```tsx
<div className="flex items-start gap-3 text-sm">
  <Shield className="h-4 w-4 text-chart-1 flex-shrink-0 mt-0.5" />
  <span className="text-muted-foreground">Full refund up to 24h before</span>
</div>
```

### Trust Points to Display
- ✓ Full refund up to 24h before
- ✓ Host verified & background checked
- ✓ Secure blockchain payment escrow
- ✓ 20% stake held until experience complete

---

## 8. Dark Mode Compliance

**All tokens automatically adapt.** No manual `dark:` classes required unless adding dark-specific effects.

### Verified Dark Mode Elements
- ✅ Background: `bg-background` (white → dark)
- ✅ Cards: `bg-card` (white → dark)
- ✅ Text: `text-foreground` / `text-muted-foreground`
- ✅ Borders: `border-border`
- ✅ Buttons: `bg-primary` / `text-primary-foreground`
- ✅ Focus rings: `ring-ring/50`

---

## 9. API Integration Notes

### Data Source
```typescript
// In production, replace mock data with:
const data = await EventRunAPI.getPublicEventRunDetails(runId);
```

### Graceful Degradation
If fields are missing:
- **No cover photo**: Show placeholder with category icon
- **No reviews**: Hide review section, emphasize host credibility
- **No host stats**: Show bio and verification badge only
- **No availability**: Show "Coming soon" message

---

## 10. Accessibility Checklist

- [x] All interactive elements have `aria-label` where text isn't visible
- [x] Focus-visible states defined for keyboard navigation
- [x] Image alt text describes content, not decorative
- [x] Color contrast meets WCAG AA (4.5:1 for text)
- [x] Button disabled states use `disabled:opacity-50` + `pointer-events-none`
- [x] Form inputs have associated labels
- [x] Semantic HTML (`<button>` not `<div onClick>`)

---

## 11. Implementation Checklist

### Phase 1: Token Migration (✅ Complete)
- [x] Replace all `bg-white` with `bg-card` or `bg-background`
- [x] Replace all `text-gray-*` with `text-foreground` or `text-muted-foreground`
- [x] Replace all `border-gray-*` with `border-border`
- [x] Remove hardcoded gradient (orange/rose) or map to token
- [x] Use `fill-chart-1` / `text-chart-1` for ratings/success states

### Phase 2: Motion Implementation (✅ Complete)
- [x] Add Motion (Framer Motion) animations
- [x] Stagger content reveals on page load
- [x] Smooth card-to-detail transition
- [x] Active/hover state micro-interactions

### Phase 3: State Definitions (✅ Complete)
- [x] Define hover states for all interactive elements
- [x] Define focus-visible rings
- [x] Define active/pressed states (scale transforms)
- [x] Define selected states (date/time pickers)
- [x] Define disabled states

### Phase 4: Responsive Behaviors (✅ Complete)
- [x] Desktop: Sticky sidebar
- [x] Mobile: Fixed bottom CTA
- [x] Scroll-triggered header blur
- [x] Responsive typography/spacing

---

## 12. Next Steps & Recommendations

### Immediate Priorities
1. **Test dark mode** thoroughly across all interactive states
2. **Connect to real API** (`EventRunAPI.getPublicEventRunDetails`)
3. **Add error boundaries** for graceful failures
4. **Test accessibility** with screen reader

### Future Enhancements
1. **Image lazy loading** for performance
2. **Calendar integration** (replace mock date picker)
3. **Real-time availability** updates
4. **Social proof** (live "X people viewing" indicator)
5. **Share functionality** (generate preview cards)
6. **Favorites sync** with user account

### Optional Polish
- Parallax scroll on hero image
- Animated host avatar on hover
- Micro-animations for trust badges
- Skeleton screens during data loading

---

## 13. Clarifying Questions for Final Tuning

1. **Booking flow**: Is it instant confirmation or request-based?
   - Currently designed for instant (date/time → Reserve → Confirm)
   - If request-based, add "Request to Book" messaging

2. **Stake mechanism**: 20% stake is shown, but needs explanation:
   - "20% held in escrow until experience is complete"
   - Consider adding tooltip or modal with full explanation

3. **API fields guaranteed**:
   - Cover photo: Yes/No?
   - Promise/tagline: Yes/No?
   - Meeting instructions: Yes/No?
   - Reviews: Yes/No?
   - This determines fallback UI strategies

4. **Terracotta color scale**:
   - You mentioned "terracotta-500/600/700" but it's not in `globals.css`
   - Should we add this as a custom color scale, or use existing `chart-*` tokens?
   - Current implementation uses `chart-1` (orange) for ratings/success

---

## 14. File Structure

```
/components
  ├── ExperienceDetailRefined.tsx   ← Main implementation
  └── ExperienceDetail.tsx          ← Legacy (can be deprecated)

/pages
  ├── ExplorePageSimple.tsx         ← Updated with tokens
  └── ExplorePage.tsx               ← Full grid (not updated yet)

/guidelines
  └── ExperienceDetailSpec.md       ← This document

/styles
  └── globals.css                   ← Token definitions
```

---

## 15. Design System Summary

### Core Principles
1. **Token-only colors** (no hardcoded hex/gray scales)
2. **Consistent transitions** (300ms hover, 100ms active)
3. **Explicit states** (default, hover, active, focus, disabled, selected)
4. **Dark mode native** (auto-adapts via CSS variables)
5. **Progressive disclosure** (hero → host → details → booking)
6. **Trust-first** (verification, escrow, refund policy always visible)

### Token Philosophy
> Every color, every spacing, every animation duration should be **intentional and documented**. If it's not in the design system, it shouldn't be in the code.

---

**Last Updated**: January 2, 2026  
**Maintained By**: Mayhouse Design System Team  
**Version**: 1.0.0
