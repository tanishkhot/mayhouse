# Mayhouse Frontend Asset Requirements

**Last Updated:** January 2025  
**Project:** Mayhouse ETH Experience Booking Platform

---

## 🎨 Design Assets Required

### 1. **Icon System** ✅

**Current Status:** Already have **Lucide React** (excellent choice!)

**Required Icons:** (All available in Lucide)
- ✅ Heart (favorites)
- ✅ Search
- ✅ MapPin (location)
- ✅ Calendar (dates)
- ✅ Users (guest count)
- ✅ Star (ratings)
- ✅ ChevronLeft/Right (carousel)
- ✅ X (close)
- ✅ Menu (mobile nav)
- ✅ Wallet (Web3 connection)
- ✅ Check (success states)

**Custom Icons Needed:**
```
src/icons/
├── mayhouse-logo.svg        # Brand logo
├── mayhouse-icon.svg        # Favicon/app icon
├── blockchain-badge.svg     # "Powered by Ethereum" badge
└── experience-categories/   # Category icons
    ├── food.svg
    ├── adventure.svg
    ├── culture.svg
    ├── wellness.svg
    └── social.svg
```

**Specifications:**
- **Format:** SVG (preferred) or PNG
- **Size:** Multi-resolution (1x, 2x, 3x)
- **Style:** Consistent with brand (outline or filled)
- **Color:** Current color scheme (supports theme switching)

---

### 2. **Image Assets**

#### A. **Placeholder Images** (Development)
```
public/images/
├── placeholders/
│   ├── experience-default-1.jpg    (1200x800)
│   ├── experience-default-2.jpg    (1200x800)
│   ├── experience-default-3.jpg    (1200x800)
│   ├── avatar-male.png             (200x200)
│   ├── avatar-female.png           (200x200)
│   └── logo-placeholder.svg        (500x500)
```

**Requirements:**
- High-quality professional photography
- Diverse representation
- Royalty-free licenses
- Optimized file sizes (< 500KB each)

#### B. **Hero Section Images**
```
public/images/
├── hero/
│   ├── hero-mumbai.jpg             (1920x1080)
│   ├── hero-delhi.jpg              (1920x1080)
│   └── hero-experiences.jpg        (1920x1080)
```

**Coverage Needed:**
- Mumbai cityscape
- Delhi landmarks
- People enjoying experiences (diverse group)
- Cultural experiences in action

#### C. **Category Banners**
```
public/images/
├── categories/
│   ├── food-and-drink.jpg          (800x400)
│   ├── adventure.jpg               (800x400)
│   ├── culture.jpg                 (800x400)
│   ├── wellness.jpg                (800x400)
│   ├── nightlife.jpg               (800x400)
│   └── social.jpg                  (800x400)
```

#### D. **Empty States**
```
public/images/
├── empty-states/
│   ├── no-experiences.svg          (600x400)
│   ├── no-bookings.svg             (600x400)
│   ├── no-favorites.svg            (600x400)
│   ├── no-results.svg              (600x400)
│   └── error-state.svg             (600x400)
```

**Design Brief:**
- Illustrative, friendly style
- Brand colors
- Simple and clear messaging
- SVG format for scalability

---

### 3. **Color Palette** 🎨

**Current Colors:**
```typescript
// Good foundation! Add these enhancements:
export const brandColors = {
  // Primary Brand Colors
  primary: {
    50: '#fdf2f8',
    100: '#fce7f3',
    500: '#ec4899',
    600: '#db2777',    // Main brand color
    700: '#be185d',
    800: '#9f1239',
    900: '#831843',
  },
  
  // Secondary (Blue/Purple)
  secondary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  
  // Accent (Orange/Red)
  accent: {
    500: '#f59e0b',
    600: '#d97706',
  },
  
  // Semantic Colors
  semantic: {
    success: '#10b981',
    successLight: '#d1fae5',
    error: '#ef4444',
    errorLight: '#fee2e2',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    info: '#3b82f6',
    infoLight: '#dbeafe',
  },
  
  // Neutrals (already have good grays)
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};
```

**Contrast Ratios:**
- ✅ Text on white: > 4.5:1 (WCAG AA)
- ✅ Text on colored backgrounds: > 4.5:1
- ✅ Interactive elements: clear visual distinction

---

### 4. **Typography**

**Current:** ✅ Using Geist Sans (excellent!)

**Additional Font Weights Needed:**
```typescript
// src/fonts/fonts.ts
import { Geist, Geist_Mono } from 'next/font/google';

export const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'], // Add all weights
});

export const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

// Typography Scale
export const typography = {
  h1: { size: '3rem', lineHeight: 1.2, weight: 700 },
  h2: { size: '2.25rem', lineHeight: 1.3, weight: 700 },
  h3: { size: '1.875rem', lineHeight: 1.4, weight: 600 },
  h4: { size: '1.5rem', lineHeight: 1.5, weight: 600 },
  h5: { size: '1.25rem', lineHeight: 1.5, weight: 600 },
  body: { size: '1rem', lineHeight: 1.6, weight: 400 },
  small: { size: '0.875rem', lineHeight: 1.5, weight: 400 },
  caption: { size: '0.75rem', lineHeight: 1.5, weight: 400 },
};
```

---

### 5. **Illustrations**

**Where to Use:**
- Empty states
- Error pages (404, 500)
- Onboarding flow
- Success screens

**Style Guide:**
- Modern, minimalist
- Flat design with subtle shadows
- Brand color palette
- Human-centered (show people, not abstract shapes)

**Required Illustrations:**
```
public/illustrations/
├── onboarding-1.svg        # Welcome screen
├── onboarding-2.svg        # Choose experience
├── onboarding-3.svg        # Start booking
├── success-booking.svg     # Booking confirmed
├── not-found.svg           # 404 page
└── something-wrong.svg     # 500 error page
```

**Tools:**
- Figma
- Adobe Illustrator
- Framer Motion-ready (SVG paths)

---

### 6. **Mock Data**

#### A. **Experience Categories**
```typescript
export const categories = [
  {
    id: 'food',
    name: 'Food & Drink',
    icon: '🍽️',
    description: 'Culinary adventures and local flavors',
    color: '#f59e0b',
  },
  {
    id: 'adventure',
    name: 'Adventure',
    icon: '🏔️',
    description: 'Thrilling outdoor experiences',
    color: '#10b981',
  },
  {
    id: 'culture',
    name: 'Culture',
    icon: '🏛️',
    description: 'Art, history, and local traditions',
    color: '#6366f1',
  },
  {
    id: 'wellness',
    name: 'Wellness',
    icon: '🧘',
    description: 'Mind, body, and soul experiences',
    color: '#ec4899',
  },
];
```

#### B. **Sample Experiences**
```typescript
export const mockExperiences = [
  {
    id: 'exp-1',
    title: 'Spice Market Walking Tour',
    domain: 'food',
    neighborhood: 'Crawford Market',
    duration_minutes: 180,
    price_inr: '2500',
    cover_photo_url: '/images/placeholders/spice-market.jpg',
    experience_promise: 'Discover Mumbai\'s rich spice heritage with a local guide',
    max_capacity: 12,
  },
  // ... more samples
];
```

---

### 7. **Animation Assets**

#### A. **Loading Animations**
```
public/animations/
├── spinner.json            # Lottie animation for loading
├── heartbeat.json          # Favorite animation
└── celebration.json        # Success animation
```

**Tools:**
- [LottieFiles](https://lottiefiles.com/)
- Adobe After Effects
- Bodymovin plugin

#### B. **Micro-Interactions**
- **Hover states:** Subtle scale/color transitions
- **Click feedback:** Ripple effects
- **Page transitions:** Fade/slide animations
- **Scrolling:** Smooth scroll behavior

**Implementation:**
```typescript
// Using Framer Motion (add to dependencies)
import { motion } from 'framer-motion';

<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.2 }}
>
  {/* Content */}
</motion.div>
```

---

### 8. **Marketing Assets**

#### A. **Social Media Graphics**
```
public/marketing/
├── og-image.png            (1200x630) # Open Graph
├── twitter-card.png        (1200x675)
├── facebook-share.jpg      (1200x630)
└── app-screenshot.png      (1080x1920) # Mobile app
```

#### B. **Email Templates**
```
src/templates/
├── welcome-email.tsx
├── booking-confirmed.tsx
├── reminder-24h.tsx
└── review-request.tsx
```

**Design:**
- Responsive email-safe HTML
- Brand colors and fonts
- Clear call-to-action buttons

---

### 9. **Video Assets** (Optional)

```
public/videos/
├── hero-video.webm         (1080p, muted, < 10MB)
├── how-it-works.mp4        (Explainer video)
└── testimonial.mp4         (Customer story)
```

**Specifications:**
- **Format:** WebM (primary), MP4 (fallback)
- **Codec:** VP9/AV1 for WebM, H.264 for MP4
- **Duration:** < 30 seconds
- **Size:** Optimized for web (< 2MB)
- **Autoplay:** Muted, loop option

---

## 📁 File Organization

### Recommended Structure:
```
mayhouse/frontend/
├── public/
│   ├── favicon.ico                     ✅ Already have
│   ├── images/
│   │   ├── hero/                      ❌ Need
│   │   ├── categories/                ❌ Need
│   │   ├── placeholders/              ❌ Need
│   │   └── empty-states/              ❌ Need
│   ├── icons/                         ❌ Need
│   ├── illustrations/                 ❌ Need
│   ├── animations/                    ❌ Optional
│   └── marketing/                     ❌ Need
│
├── src/
│   ├── app/
│   ├── components/
│   │   └── ui/                        ⚠️ Need to create
│   ├── fonts/                         ⚠️ Enhance
│   ├── lib/
│   │   └── design-system.ts           ❌ Need to create
│   └── styles/
│       └── animations.css             ❌ Need to create
```

---

## 🖼️ Image Optimization Checklist

### Technical Requirements:

1. **Formats:**
   - **Primary:** WebP (modern browsers)
   - **Fallback:** JPEG (older browsers)
   - **Icons:** SVG
   - **Backgrounds:** Optimized PNG

2. **Dimensions:**
   - **Hero images:** 1920x1080px
   - **Experience cards:** 1200x800px
   - **Thumbnails:** 400x300px
   - **Avatars:** 200x200px

3. **Optimization:**
   - **Compression:** 80-85% quality
   - **WebP:** 75% quality
   - **File size target:** < 500KB for large images
   - **Loading:** Lazy load below fold
   - **Placeholder:** Blur-up technique

4. **CDN:** (Future)
   - Cloudflare Images
   - Cloudinary
   - Imgix

---

## 🎭 Design System Components

### Base Components to Create:

```typescript
// src/components/ui/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { Badge } from './Badge';
export { Avatar } from './Avatar';
export { Skeleton } from './Skeleton';
export { Toast } from './Toast';
export { Modal } from './Modal';
export { Tabs } from './Tabs';
export { Accordion } from './Accordion';
export { Dropdown } from './Dropdown';
export { Tooltip } from './Tooltip';
```

**Specifications:**
- Consistent spacing (8px grid)
- Reusable variants
- Accessible (ARIA labels)
- Themeable (dark mode ready)
- Documented in Storybook

---

## 📐 Layout Specifications

### Breakpoints:
```typescript
export const breakpoints = {
  xs: '0px',      // Mobile
  sm: '640px',    // Large mobile
  md: '768px',    // Tablet
  lg: '1024px',   // Desktop
  xl: '1280px',   // Large desktop
  '2xl': '1536px', // XL desktop
};
```

### Container Widths:
```typescript
export const containerWidths = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
};
```

---

## 🔍 Quality Checklist

Before using assets:

- [ ] **Optimized file sizes**
- [ ] **Correct dimensions**
- [ ] **Proper formats** (WebP + fallback)
- [ ] **Copyright cleared**
- [ ] **Brand consistent**
- [ ] **Accessible** (alt text, ARIA labels)
- [ ] **Responsive** (multiple breakpoints)
- [ ] **Fast loading** (lazy load, CDN ready)
- [ ] **Retina ready** (2x/3x versions)
- [ ] **Documented** (usage guidelines)

---

## 🚀 Quick Start Asset Pack

**Minimal viable assets to launch:**

1. ✅ **Logo** (PNG + SVG)
2. ✅ **5 placeholder images** for experiences
3. ✅ **Default avatars** (male/female/neutral)
4. ✅ **Category icons** (6 categories)
5. ✅ **Empty state illustrations** (3-4)
6. ✅ **Loading skeleton** CSS

**Can launch with just these!** Add more assets iteratively.

---

## 📦 Recommended Tools

### Design:
- **Figma:** Design mockups and components
- **Adobe Illustrator:** Vector illustrations
- **Photoshop:** Image editing and optimization

### Optimization:
- **Squoosh:** Image compression
- **TinyPNG:** Bulk image optimization
- **SVGOMG:** SVG optimization

### Animation:
- **LottieFiles:** Free animations
- **Framer Motion:** React animations
- **After Effects:** Custom animations

### Stock Assets:
- **Unsplash:** High-quality photos
- **Pexels:** Free stock images
- **Freepik:** Icons and illustrations
- **Heroicons:** Beautiful icons

---

## ✅ Current Asset Status

| Asset Type | Status | Priority | Notes |
|-----------|--------|----------|-------|
| **Icons** | ✅ Good | Low | Have Lucide React |
| **Typography** | ✅ Good | Low | Geist Sans is perfect |
| **Colors** | ✅ Good | Low | Well-defined palette |
| **Logo** | ❌ Missing | **HIGH** | Need ASAP |
| **Placeholder Images** | ❌ Missing | **HIGH** | Need for dev |
| **Category Images** | ❌ Missing | Medium | Can use placeholders |
| **Empty States** | ❌ Missing | Medium | Can use temporary text |
| **Hero Images** | ❌ Missing | Low | Nice-to-have |
| **Animations** | ❌ Missing | Low | Can add later |
| **Email Templates** | ❌ Missing | Low | Future feature |

---

## 🎯 Immediate Action Items

**This Week:**
1. [ ] Design logo (SVG + PNG)
2. [ ] Get 5 placeholder experience images
3. [ ] Create default avatar set
4. [ ] Set up design system tokens

**Next Week:**
5. [ ] Add category images
6. [ ] Create empty state illustrations
7. [ ] Build UI component library
8. [ ] Set up Storybook

**Following Week:**
9. [ ] Add animations
10. [ ] Create email templates
11. [ ] Marketing graphics
12. [ ] Video assets

---

**Questions?** Need help sourcing or creating any of these assets? Let me know which ones to prioritize! 🚀



