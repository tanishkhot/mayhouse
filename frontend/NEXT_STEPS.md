# 🚀 Next Steps - Start Here!

**Frontend running at:** http://localhost:3000  
**Backend running at:** http://localhost:8000  
**Status:** ✅ Ready to build!

---

## 🎯 What You Should Do Next (In Order)

### **✅ STEP 1: Quick Wins (30 minutes)** ⭐ START HERE

These give you **immediate visual improvements** and test that everything works:

#### 1.1 Add Toast Notifications to Layout
**File:** `src/app/layout.tsx`

```tsx
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster /> {/* Add this line */}
      </body>
    </html>
  )
}
```

**Why:** Enables toast notifications throughout your app

---

#### 1.2 Migrate One Button (Test shadcn/ui)
**File:** `src/components/Navbar.tsx`

**Find this:**
```tsx
<Link 
  href="/login"
  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg..."
>
  Connect Wallet
</Link>
```

**Replace with:**
```tsx
import { Button } from "@/components/ui/button"

<Link href="/login">
  <Button variant="default" size="lg">
    Connect Wallet
  </Button>
</Link>
```

**Why:** Test that shadcn/ui works, see immediate improvement

---

#### 1.3 Replace Loading Spinner with Skeleton
**File:** `src/app/page.tsx` (or wherever you have loading states)

**Find:**
```tsx
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
```

**Replace with:**
```tsx
import { Skeleton } from "@/components/ui/skeleton"

<div className="space-y-4">
  <Skeleton className="h-64 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

**Why:** Better UX, matches Airbnb's approach

---

### **🎨 STEP 2: Migrate Event Cards (1 hour)**

This will make your homepage look **much better**:

#### 2.1 Use Card Component for Event Listings
**File:** `src/app/page.tsx`

**Current:** Custom divs with Tailwind classes

**Replace with:**
```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

<Card className="overflow-hidden">
  <img src={coverUrl} className="w-full h-64 object-cover" />
  <CardHeader>
    <div className="flex justify-between items-start">
      <CardTitle>{title}</CardTitle>
      <Badge>{availableSpots} spots left</Badge>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-gray-600">{description}</p>
    <div className="mt-4">
      <span className="text-2xl font-bold">{price}</span>
    </div>
  </CardContent>
  <CardFooter>
    <Button className="w-full">View Details</Button>
  </CardFooter>
</Card>
```

**Why:** Consistent, professional look, matches Airbnb quality

---

### **🔍 STEP 3: Enable Search & Filters (2-3 hours)**

Your filters are commented out. Let's enable them:

#### 3.1 Create Filter Hook
**File:** `src/hooks/useEventRunFilters.ts` (CREATE NEW)

```tsx
import { useRouter, useSearchParams } from "next/navigation";

export function useEventRunFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = {
    domain: searchParams.get("domain") || undefined,
    neighborhood: searchParams.get("neighborhood") || undefined,
    priceMin: searchParams.get("priceMin") || undefined,
    priceMax: searchParams.get("priceMax") || undefined,
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.push(`/?${params.toString()}`);
  };

  return { filters, updateFilters };
}
```

#### 3.2 Uncomment Filters in Homepage
**File:** `src/app/page.tsx`

Find the commented filter section and uncomment it, then connect to the hook above.

**Why:** Makes your homepage searchable and filterable (like Airbnb)

---

### **🖼️ STEP 4: Optimize Images (1 hour)**

Replace all `<img>` tags with Next.js Image:

#### 4.1 Create OptimizedImage Component
**File:** `src/components/OptimizedImage.tsx` (CREATE NEW)

```tsx
import Image from "next/image";

export default function OptimizedImage({ src, alt, priority = false }) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        quality={85}
        priority={priority}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
      />
    </div>
  );
}
```

#### 4.2 Replace img tags
**File:** `src/app/page.tsx`

Replace:
```tsx
<img src={coverUrl} alt={title} />
```

With:
```tsx
<OptimizedImage src={coverUrl} alt={title} />
```

**Why:** Faster page loads, better performance

---

## 📋 Priority Order Summary

### **Today (2-3 hours):**
1. ✅ Add Toaster to layout (5 min)
2. ✅ Migrate one button (10 min)
3. ✅ Replace loading spinner (15 min)
4. ✅ Migrate event cards (1 hour)

### **This Week (4-6 hours):**
5. ✅ Enable search/filters (2-3 hours)
6. ✅ Optimize images (1 hour)
7. ✅ Set up Storybook (1 hour)

### **Next Week:**
8. ✅ Mobile optimization
9. ✅ Performance improvements
10. ✅ Accessibility audit

---

## 🎯 Quick Reference

### **Components Available:**
- `Button` - All button variants
- `Card` - Container components
- `Badge` - Status labels
- `Skeleton` - Loading states
- `Sonner` - Toast notifications
- `Sheet` - Mobile panels
- `Dialog` - Modals
- `Input` - Form inputs
- `Select` - Dropdowns
- And more...

### **Documentation:**
- **Usage Guide:** `SHADCN_INTEGRATION_GUIDE.md`
- **Full Checklist:** `IMPLEMENTATION_CHECKLIST.md`
- **Technical Details:** `AIRBNB_ANALYSIS_RECOMMENDATIONS.md`

---

## ✅ Success Checklist

After completing Step 1, you should have:
- [x] Toast notifications working
- [x] At least one button using shadcn/ui
- [x] Skeleton loaders instead of spinners
- [x] Better visual consistency

After completing Step 2, you should have:
- [x] Professional-looking event cards
- [x] Consistent styling
- [x] Better UX

After completing Step 3, you should have:
- [x] Working search/filters
- [x] URL-based state (shareable links)
- [x] Better discovery experience

---

## 🚀 Start Now!

**Recommended first action:**
1. Open `src/app/layout.tsx`
2. Add `<Toaster />` component
3. Test it by adding a toast somewhere
4. See immediate improvement!

**Then move to Step 1.2** - Migrate one button to see shadcn/ui in action.

---

**Questions?** Check the integration guide or ask me!

**Ready?** Let's build! 🎉

