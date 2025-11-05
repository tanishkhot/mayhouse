# shadcn/ui Integration Guide for Mayhouse

**Status:** ✅ **INSTALLED & READY TO USE**

---

## 🎉 What Just Happened?

I've successfully installed **shadcn/ui**, the best component library for your Tailwind CSS setup! This is even **better** than what Airbnb uses because:

✅ **Copy-paste components** (no npm bloated packages)  
✅ **Tailwind-first** (works perfectly with Tailwind CSS 4)  
✅ **Accessible** (built on Radix UI primitives)  
✅ **Customizable** (you own the code)  
✅ **Type-safe** (full TypeScript support)  
✅ **Modern** (used by Vercel, T3 Stack, and top React teams)

---

## 📦 What Was Installed

### Components Added:
- ✅ `Button` - Primary, secondary, outline, ghost variants
- ✅ `Card` - Container with header, content, footer
- ✅ `Input` - Text inputs with variants
- ✅ `Badge` - Status labels and tags
- ✅ `Avatar` - User profile images
- ✅ `Skeleton` - Loading state placeholders
- ✅ `Sheet` - Mobile-friendly side panels
- ✅ `Dialog` - Modal dialogs
- ✅ `Select` - Dropdown selectors
- ✅ `Sonner` - Toast notifications
- ✅ `Tabs` - Tabbed navigation
- ✅ `Separator` - Visual dividers
- ✅ `Dropdown Menu` - Context menus
- ✅ `Hover Card` - Tooltip cards

### Utilities Added:
- ✅ `cn()` - Class name merger utility
- ✅ `utils.ts` - Helper functions
- ✅ Theme variables - CSS custom properties for theming
- ✅ Dark mode support - Built-in dark mode

---

## 🚀 How to Use

### 1. Import Components

```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
```

### 2. Use in Your Code

**Button Example:**
```tsx
import { Button } from "@/components/ui/button"

export default function MyPage() {
  return (
    <Button variant="default" size="lg">
      Book Now
    </Button>
  )
}
```

**Card Example:**
```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

<Card>
  <CardHeader>
    <CardTitle>Spice Market Tour</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Discover Mumbai's spice heritage with a local guide</p>
  </CardContent>
  <CardFooter>
    <Button>Book Now</Button>
  </CardFooter>
</Card>
```

**Toast Example:**
```tsx
import { toast } from "sonner"

// In your component
<Button onClick={() => toast.success("Booking confirmed!")}>
  Confirm
</Button>
```

---

## 🎨 Button Variants

```tsx
<Button variant="default">Default (Primary)</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Link</Button>
```

**Sizes:**
```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🎯</Button>
```

---

## 🎯 Common Use Cases

### 1. Replace Your Existing Buttons

**Before:**
```tsx
<button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
  Click me
</button>
```

**After:**
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">
  Click me
</Button>
```

### 2. Event Card

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

<Card className="overflow-hidden">
  <img src={coverUrl} className="w-full h-64 object-cover" />
  <CardHeader>
    <div className="flex items-start justify-between">
      <CardTitle>{title}</CardTitle>
      <Badge>{status}</Badge>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-gray-600">{description}</p>
    <div className="mt-4">
      <span className="text-2xl font-bold">{price}</span>
      <span className="text-gray-600"> per person</span>
    </div>
  </CardContent>
  <CardFooter>
    <Button className="w-full">Book Now</Button>
  </CardFooter>
</Card>
```

### 3. Loading States

```tsx
import { Skeleton } from "@/components/ui/skeleton"

{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-64 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
) : (
  <ActualContent />
)}
```

### 4. Forms

```tsx
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

<form className="space-y-4">
  <Input placeholder="Name" />
  <Input type="email" placeholder="Email" />
  <Input type="password" placeholder="Password" />
  <Button type="submit">Sign Up</Button>
</form>
```

### 5. Toast Notifications

**First, add Toaster to your layout:**
```tsx
// src/app/layout.tsx
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

**Then use anywhere:**
```tsx
import { toast } from "sonner"

function BookButton({ eventRun }) {
  const handleBook = async () => {
    try {
      await createBooking(eventRun)
      toast.success("Booking confirmed!")
    } catch (error) {
      toast.error("Booking failed. Please try again.")
    }
  }

  return <Button onClick={handleBook}>Book</Button>
}
```

---

## 🎨 Theming

### Customize Colors

Edit the CSS variables in `globals.css`:

```css
:root {
  /* Change these to your brand colors */
  --primary: oklch(0.205 0 0);  /* Your brand color */
  --primary-foreground: oklch(0.985 0 0);
  
  /* Add your purple/pink theme */
  --primary: oklch(0.55 0.25 330);  /* Purple/Pink #db2777 */
}
```

### Use Your Brand Colors

**Current Palette:**
- Primary: `#db2777` (Purple/Pink)
- Secondary: Blue
- Accent: Orange

**To apply:**
```bash
# Run this command to customize:
npx shadcn@latest init --base-color="your-color"
```

Or manually edit `globals.css` CSS variables.

---

## 📱 Mobile Components

### Sheet (Mobile-Friendly Sidebar)

```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

<Sheet>
  <SheetTrigger>Open</SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Booking Details</SheetTitle>
    </SheetHeader>
    <div className="space-y-4">
      {/* Your booking form */}
    </div>
  </SheetContent>
</Sheet>
```

### Dialog (Desktop Modal)

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Booking Confirmation</DialogTitle>
    </DialogHeader>
    <p>Are you sure?</p>
  </DialogContent>
</Dialog>
```

---

## 🔧 Advanced Usage

### Custom Button Variant

Add your own variant to `button.tsx`:

```tsx
const buttonVariants = cva(
  "inline-flex items-center...",
  {
    variants: {
      variant: {
        // Add your custom variant
        accent: "bg-orange-600 text-white hover:bg-orange-700",
      },
    },
  }
)

// Use it
<Button variant="accent">Custom</Button>
```

### Class Name Utility

Use `cn()` to merge classes safely:

```tsx
import { cn } from "@/lib/utils"

<div className={cn("base-class", isActive && "active-class", className)}>
  Content
</div>
```

---

## 📦 Add More Components

**Popular components to add:**

```bash
# For date selection
npx shadcn@latest add calendar date-picker

# For forms
npx shadcn@latest add form label

# For data display
npx shadcn@latest add table

# For navigation
npx shadcn@latest add breadcrumb navigation-menu

# For feedback
npx shadcn@latest add alert alert-dialog

# For overlays
npx shadcn@latest add tooltip popover
```

**See all components:**
```bash
npx shadcn@latest add --help
```

---

## 🆚 Before vs After

### Before (Custom CSS):
```tsx
<button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500">
  Click
</button>
```

### After (shadcn/ui):
```tsx
<Button>Click</Button>
```

**Benefits:**
- ✅ Consistent styling
- ✅ Built-in accessibility
- ✅ Easier maintenance
- ✅ Dark mode support
- ✅ Type-safe variants

---

## 🎯 Next Steps

### Immediate Actions:

1. **Replace existing buttons** in your components
   ```tsx
   // src/components/Navbar.tsx
   import { Button } from "@/components/ui/button"
   ```

2. **Add Toaster** to layout
   ```tsx
   // src/app/layout.tsx
   import { Toaster } from "@/components/ui/sonner"
   ```

3. **Use Card for event listings**
   ```tsx
   // src/app/page.tsx
   import { Card } from "@/components/ui/card"
   ```

4. **Replace loading spinners** with Skeleton
   ```tsx
   import { Skeleton } from "@/components/ui/skeleton"
   ```

### This Week:

- [ ] Migrate all buttons to shadcn Button
- [ ] Add Toaster to app layout
- [ ] Use Card for all event cards
- [ ] Replace spinners with Skeleton
- [ ] Add toast notifications to booking flow
- [ ] Test on mobile with Sheet component

### Next Week:

- [ ] Add calendar/date picker for bookings
- [ ] Use Select for filters
- [ ] Add Alert for error messages
- [ ] Create custom variants for your brand

---

## 📚 Resources

- **Official Docs:** https://ui.shadcn.com
- **Component Reference:** https://ui.shadcn.com/docs/components
- **Examples:** https://ui.shadcn.com/examples
- **Twitter:** @shadcn

---

## 🐛 Troubleshooting

### "Module not found"
```bash
npm install
```

### "Type errors"
```bash
# Restart TypeScript server in your IDE
# Or restart dev server
```

### "Styles not working"
Check that `globals.css` imports are correct:
```tsx
// In app/layout.tsx
import "./globals.css"
```

### "Can't import"
```bash
# Re-check your tsconfig.json paths
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

---

## ✅ Checklist

- [x] shadcn/ui installed
- [x] Components created
- [x] Theme configured
- [ ] Migrate existing buttons
- [ ] Add Toaster to layout
- [ ] Use Card for listings
- [ ] Replace spinners with Skeleton
- [ ] Add toast notifications
- [ ] Test on mobile

---

## 🎉 You're All Set!

You now have a **production-ready component library** that's:
- ✅ Better than Airbnb's internal library
- ✅ Fully customizable
- ✅ Accessible by default
- ✅ Type-safe
- ✅ Mobile-first
- ✅ Dark mode ready

**Start using it today!** 🚀

---

**Questions?** Check the docs at https://ui.shadcn.com or ask!




