# Color States Quick Reference Card

**For Experience Detail Page & All Mayhouse Components**

---

## 🎨 Core Tokens (Never use hardcoded colors!)

| Instead of... | Use token... |
|---------------|--------------|
| `bg-white` | `bg-background` or `bg-card` |
| `bg-gray-50` / `bg-gray-100` | `bg-accent` or `bg-muted` |
| `text-gray-600` / `text-gray-700` | `text-muted-foreground` |
| `text-black` / `text-gray-900` | `text-foreground` |
| `border-gray-200` / `border-gray-300` | `border-border` |
| `text-orange-400` (ratings) | `text-chart-1` |
| `text-red-500` (favorites) | `text-destructive` |

---

## 🔘 Button States

### Primary CTA
```tsx
// One-liner for copy-paste:
className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300"
```

### Outline Button
```tsx
className="border border-border bg-card text-foreground hover:bg-accent hover:border-ring active:scale-95 transition-all duration-300"
```

### Ghost Button
```tsx
className="text-foreground hover:bg-accent active:scale-95 transition-all duration-300"
```

---

## 📅 Date/Time Selector States

```tsx
// Default
className="bg-card border border-border hover:bg-accent hover:border-ring"

// Selected
className="bg-primary text-primary-foreground shadow-sm"

// Disabled/Sold Out
className="bg-muted text-muted-foreground opacity-60 cursor-not-allowed"

// Always add:
className="transition-all duration-300 active:scale-95 focus-visible:ring-[3px] focus-visible:ring-ring/50"
```

---

## 🏷️ Badge/Chip Variants

```tsx
// Category (on images)
<Badge className="bg-background text-foreground border border-border shadow-md">

// Info chip (duration, size)
<Badge variant="outline" className="gap-2">

// Status chip (availability, verified)
<Badge variant="outline" className="border-chart-1 text-chart-1">

// Tag/filter
<Badge variant="outline" className="bg-accent">
```

---

## 🔗 Link States

```tsx
// Text link
className="text-foreground hover:text-primary underline-offset-4 transition-colors duration-200"

// Button-style link
<Button variant="link" className="p-0 h-auto text-foreground hover:text-primary">
```

---

## ❤️ Icon Button States

```tsx
// Default
className="hover:bg-accent active:scale-95 transition-all duration-300"

// Favorite (inactive)
<Heart className="h-5 w-5 text-foreground" />

// Favorite (active)
<Heart className="h-5 w-5 fill-destructive text-destructive" />
```

---

## 🖼️ Card Hover Effects

```tsx
// Experience card
className="bg-card border border-border hover:shadow-xl hover:border-ring transition-all duration-300"

// Review card / Info card
className="bg-card border border-border hover:shadow-lg transition-all duration-300"
```

---

## ⏱️ Transition Timing

| Element | Duration | Easing | Transform |
|---------|----------|--------|-----------|
| Hover (bg/color) | 300ms | ease-out | - |
| Active/Pressed | 100ms | ease-in | scale-95 |
| Focus ring | 150ms | ease-out | - |
| Page transitions | 200-300ms | cubic-bezier(0.4, 0, 0.2, 1) | - |
| Gallery navigation | 300ms | ease-out | opacity + scale |

**Standard hover/active combo**:
```tsx
className="transition-all duration-300 hover:bg-accent active:scale-95"
```

---

## 🌗 Dark Mode

**All tokens auto-adapt.** No manual `dark:` classes needed unless:
- Adding dark-specific backdrop effects
- Fine-tuning opacity overlays

If you write `dark:bg-gray-800`, you're doing it wrong! Use tokens.

---

## ✅ Trust/Success Indicators

```tsx
// Verified badge, ratings, trust icons
<Shield className="h-4 w-4 text-chart-1" />
<Star className="h-5 w-5 fill-chart-1 text-chart-1" />
<CheckCircle2 className="h-4 w-4 text-chart-1" />
```

---

## ⚠️ Error/Destructive States

```tsx
// Delete, errors, warnings
className="text-destructive"
className="border-destructive"
className="bg-destructive text-white" // For solid buttons
```

---

## 💀 Skeleton/Loading

```tsx
// Never use bg-gray-200!
<div className="bg-muted animate-pulse rounded-lg h-40" />
```

---

## 🎯 Focus States (Keyboard Navigation)

**Every interactive element must have**:
```tsx
className="focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
```

---

## 📱 Responsive Patterns

```tsx
// Sticky sidebar (desktop only)
<Card className="lg:sticky lg:top-24">

// Mobile bottom CTA
<div className="lg:hidden fixed bottom-0 left-0 right-0">

// Responsive text
className="text-2xl sm:text-3xl lg:text-4xl"
```

---

## 🚫 Common Mistakes to Avoid

| ❌ Don't | ✅ Do |
|---------|-------|
| `bg-white` | `bg-card` or `bg-background` |
| `text-gray-600` | `text-muted-foreground` |
| `border-gray-200` | `border-border` |
| `bg-orange-400` | `bg-chart-1` (if exists) or use token |
| `hover:opacity-80` | `hover:bg-primary/90` (use opacity modifier on token) |
| Manual dark mode | Let tokens handle it |
| Fixed durations everywhere | Use 300ms hover, 100ms active consistently |

---

## 📋 Pre-Commit Checklist

Before pushing code, verify:
- [ ] No hardcoded `bg-white`, `text-gray-*`, `border-gray-*`
- [ ] All buttons have hover + active + focus states
- [ ] All interactive elements have `transition-all duration-300`
- [ ] Active states use `active:scale-95`
- [ ] Focus states use `focus-visible:ring-[3px] ring-ring/50`
- [ ] Disabled states use `disabled:opacity-50 disabled:pointer-events-none`
- [ ] Cards use `bg-card`, not `bg-white`
- [ ] Icons use token colors (`text-chart-1`, `text-destructive`, etc.)
- [ ] Dark mode tested (toggle in browser devtools)

---

## 🔍 Quick Find/Replace

Use these to fix legacy code:

```bash
# Find hardcoded colors
grep -r "bg-white" .
grep -r "text-gray-" .
grep -r "border-gray-" .

# Common replacements
s/bg-white/bg-card/g
s/bg-gray-50/bg-accent/g
s/text-gray-600/text-muted-foreground/g
s/border-gray-200/border-border/g
s/text-orange-400/text-chart-1/g  # for ratings
s/text-red-500/text-destructive/g  # for favorites
```

---

**Quick Link**: [Full Spec →](/guidelines/ExperienceDetailSpec.md)

**Last Updated**: January 2, 2026
