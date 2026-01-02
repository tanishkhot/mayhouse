# Card-to-Detail Transition Specification

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│ EXPLORE LIST VIEW                                                       │
│ /explore                                                                │
└─────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────┐
    │ ╔═══════════════════════╗                                   │
    │ ║   [Image: 400x300]    ║  │ Gothic Quarter Experience      │
    │ ║   [Category Badge]    ║  │ ★ 4.9 · Barcelona             │
    │ ╚═══════════════════════╝  │ Duration: 3h · 6-8 people     │
    │                            │ $45 [Book Now]                 │
    └─────────────────────────────────────────────────────────────┘
                                  │
                                  │ USER CLICKS CARD
                                  ▼
                            [Transition: 300ms]
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ DETAIL PAGE VIEW                                                        │
│ /experiences/run/{id}                                                   │
└─────────────────────────────────────────────────────────────────────────┘

    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║         [Hero Image: Full Width, 21:9 aspect]                 ║
    ║         [Same image from card, expanded]                      ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    
    [Category Badge] Gothic Quarter Experience          [Share][♥]
    ★ 4.9 (127 reviews) · 📍 Barcelona, Spain
    [Duration: 3h] [6-8 people] [3 spots left]
    
    ┌───────────────────────────────────────────┐  ┌──────────────┐
    │ Host Card                                 │  │  $45/person  │
    │ [Avatar] Maria Garcia ✓                   │  │              │
    │ Local historian · Host since 2022         │  │  [Calendar]  │
    │ ...                                       │  │  [Times]     │
    │                                           │  │  [Reserve]   │
    │ What you'll experience                    │  │              │
    │ Timeline                                  │  │  Trust       │
    │ Reviews                                   │  │  Indicators  │
    └───────────────────────────────────────────┘  └──────────────┘
```

---

## Detailed Transition Keyframes

### Phase 1: Initiation (0ms - 100ms)

```
t=0ms    User clicks card
         └─> onClick fires
         └─> setState(selectedExperience: id)
         └─> React Router or modal overlay triggers
         └─> ExperienceDetailRefined component mounts

t=50ms   Old view: Fade out (optional, if full page transition)
         └─> opacity: 1 → 0.95
         └─> scale: 1 → 0.98 (subtle zoom-out)
```

### Phase 2: Image Expansion (100ms - 400ms)

```
IDEAL (Shared Element Transition):
────────────────────────────────────────────────────────────────────
Card Image (400x300px)               Hero Image (1200x512px)
┌────────────┐                       ╔════════════════════════╗
│            │  ──────────────────>  ║                        ║
│  [Gothic]  │  Scale + Translate    ║      [Gothic Hero]     ║
│            │  300ms ease-out       ║                        ║
└────────────┘                       ╚════════════════════════╝

Properties animated:
• width:  400px  → 1200px
• height: 300px  → 512px
• x-position: card-left → hero-left
• y-position: card-top  → hero-top
• border-radius: 16px → 24px
────────────────────────────────────────────────────────────────────

FALLBACK (Simple Fade):
Card: opacity 1 → 0 (150ms)
Hero: opacity 0 → 1 (300ms, delay 100ms)
```

### Phase 3: Content Stagger (150ms - 700ms)

```
Timeline View:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
0ms       150ms     250ms     350ms     450ms     700ms

Hero      │         │         │         │         │
Image     ████████████████                        │
          │         │         │         │         │
Header    │         ██████████████                │
(Title)   │         │         │         │         │
          │         │         │         │         │
Host      │         │         ██████████████      │
Card      │         │         │         │         │
          │         │         │         │         │
Details   │         │         │         ████████████
Content   │         │         │         │         │
          │         │         │         │         │
Booking   │         │         │         │         ████████
Sidebar   │         │         │         │         │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each element:
• opacity: 0 → 1
• y-position: +20px → 0px
• duration: 300ms
• easing: ease-out
```

### Phase 4: Interactive Ready (700ms)

```
t=700ms  All animations complete
         └─> User can interact with elements
         └─> Focus management: Trap focus in modal (if modal)
         └─> Scroll position: Reset to top
```

---

## Motion Library Implementation

### Using Motion (Framer Motion)

```tsx
import { motion, AnimatePresence } from 'motion/react';

// Page wrapper
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>

// Hero image (shared element concept)
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ 
    delay: 0.15, 
    duration: 0.3, 
    ease: [0.4, 0, 0.2, 1] // cubic-bezier
  }}
  className="relative rounded-3xl overflow-hidden"
>

// Header (title + chips)
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.25, duration: 0.3 }}
>

// Host card
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3, duration: 0.3 }}
>

// Details section
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.35, duration: 0.3 }}
>

// Booking sidebar
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4, duration: 0.3 }}
>

// Mobile bottom CTA (conditional render)
<AnimatePresence>
  {showMobileCTA && (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    />
  )}
</AnimatePresence>
```

---

## Color Transition Mapping

### Background Continuity

```css
/* Card background (Explore page) */
.experience-card {
  background: var(--color-card);      /* #ffffff in light mode */
}

/* Detail page background */
.experience-detail {
  background: var(--color-background); /* #ffffff in light mode */
}

/* Transition (imperceptible in light mode) */
background: var(--color-card) → var(--color-background)
duration: 200ms
easing: linear
```

**Note**: In light mode, both are `#ffffff`, so transition is invisible. In dark mode, there may be subtle contrast (`oklch(0.145 0 0)` → `oklch(0.145 0 0)`), but both are very close.

### Text Continuity

```
Card Title:
  color: text-foreground
  
Detail Title:
  color: text-foreground
  
→ No transition needed (same token)
```

### Badge Continuity

```
Card Badge:
  bg: bg-background
  text: text-foreground
  border: border-border
  
Detail Badge:
  bg: bg-primary (changed for emphasis)
  text: text-primary-foreground
  
→ Subtle color shift (300ms ease-out)
```

---

## Scroll Position Management

### On Page Open

```typescript
useEffect(() => {
  // Scroll to top when detail page opens
  window.scrollTo({ top: 0, behavior: 'instant' });
  
  // Lock body scroll if modal overlay
  document.body.style.overflow = 'hidden';
  
  return () => {
    document.body.style.overflow = 'unset';
  };
}, []);
```

### On Page Close

```typescript
const handleClose = () => {
  // Fade out animation
  setIsClosing(true);
  
  setTimeout(() => {
    onClose(); // Callback to parent
  }, 200); // Match exit animation duration
};
```

---

## Performance Considerations

### Optimization Strategies

1. **Image Preloading**
   ```tsx
   useEffect(() => {
     const img = new Image();
     img.src = heroImageUrl;
   }, []);
   ```

2. **GPU Acceleration**
   ```css
   .animated-element {
     will-change: transform, opacity;
     transform: translateZ(0); /* Force GPU layer */
   }
   ```

3. **Reduce Layout Thrashing**
   - Use `transform` and `opacity` (GPU-friendly)
   - Avoid animating `width`, `height`, `top`, `left`

4. **Lazy Load Below-Fold Content**
   ```tsx
   <LazyLoad offset={100}>
     <ReviewsSection />
   </LazyLoad>
   ```

---

## Fallback Strategy

### If Motion Library Fails

```tsx
// Graceful degradation
const motionProps = useReducedMotion() 
  ? {} // No animation
  : {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 }
    };

<div {...motionProps}>
```

### If Shared Element Not Feasible

Current implementation uses **staggered fade-in** as fallback:
- Hero: Fade + subtle scale
- Content: Fade + slide-up (y: 20px → 0)
- No attempt to morph card image → hero image

Future enhancement: Use View Transitions API (Chrome 111+):
```css
::view-transition-old(hero-image),
::view-transition-new(hero-image) {
  animation-duration: 300ms;
}
```

---

## Mobile-Specific Transitions

### Bottom CTA Slide-Up

```
┌─────────────────────────────────┐
│                                 │
│ [Detail Content]                │
│                                 │
│ User scrolls past hero...       │
│                                 │
└─────────────────────────────────┘
                ▼
┌─────────────────────────────────┐
│ [Detail Content]                │
│                                 │
├─────────────────────────────────┤ ← Slide up from bottom
│ $45       [Reserve Spot] →     │
└─────────────────────────────────┘

Trigger: IntersectionObserver on hero
Animation: y: 100 → 0, spring physics
```

Implementation:
```tsx
const [showCTA, setShowCTA] = useState(false);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => setShowCTA(!entry.isIntersecting),
    { threshold: 0.1 }
  );
  observer.observe(heroRef.current);
}, []);
```

---

## Accessibility During Transitions

### Focus Management

```typescript
// On page open
useEffect(() => {
  const closeButton = document.querySelector('[aria-label="Close"]');
  closeButton?.focus();
}, []);

// During animation
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  aria-hidden={isAnimating} // Hide from screen readers during animation
  onAnimationComplete={() => setIsAnimating(false)}
>
```

### Reduced Motion Preference

```tsx
import { useReducedMotion } from 'motion/react';

const shouldReduceMotion = useReducedMotion();

const transition = shouldReduceMotion
  ? { duration: 0.01 } // Instant
  : { duration: 0.3, ease: [0.4, 0, 0.2, 1] };
```

### Announce Page Change

```tsx
<div role="status" aria-live="polite" className="sr-only">
  {isOpen && "Experience detail page opened"}
</div>
```

---

## Testing Checklist

### Visual Testing

- [ ] Card → Detail transition feels smooth (not jarring)
- [ ] No content "jump" or layout shift during animation
- [ ] Dark mode: Transitions remain smooth
- [ ] Mobile: Bottom CTA slides up correctly
- [ ] Desktop: Sidebar sticks at correct position

### Performance Testing

- [ ] No animation jank (60fps maintained)
- [ ] Page opens in < 300ms on fast 3G
- [ ] Images load progressively (no white flash)
- [ ] CPU usage stays reasonable during animation

### Interaction Testing

- [ ] User can't interact with elements until animation completes
- [ ] Clicking "Back" during animation doesn't break state
- [ ] Rapid open/close doesn't cause race conditions
- [ ] Keyboard navigation works during transitions

### Edge Cases

- [ ] Very long title: No text overflow during transition
- [ ] Missing image: Placeholder animates correctly
- [ ] Slow network: Loading state shows immediately
- [ ] Touch device: No hover effects causing issues

---

## Reference Implementation

**Live in**: `/components/ExperienceDetailRefined.tsx`

Key sections:
- Lines 92-99: Page-level fade-in
- Lines 104-114: Sticky header animation
- Lines 120-145: Hero image gallery with expansion
- Lines 159-409: Content stagger (staggered reveals)
- Lines 412-481: Booking sidebar (desktop sticky)
- Lines 484-502: Mobile bottom CTA (scroll-triggered)

---

**Animation Philosophy**:
> Transitions should **enhance** the narrative, not distract from it. Every motion must have purpose: guiding attention, preserving context, or delighting the user.

---

**Last Updated**: January 2, 2026  
**Specification Version**: 1.0.0
