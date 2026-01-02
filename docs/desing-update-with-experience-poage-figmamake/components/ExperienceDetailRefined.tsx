/**
 * EXPERIENCE DETAIL PAGE - DESIGN SYSTEM SPECIFICATION
 * 
 * DESIGN PHILOSOPHY:
 * This page is the "unfolded" state of the ExploreCard. The hero preserves visual
 * continuity (same image/title/chips) and progressively discloses detail.
 * 
 * MOTION SPECIFICATION:
 * Card-to-Detail Transition (300ms cubic-bezier(0.4, 0, 0.2, 1))
 * - Card image: Scale and position to fill hero area
 * - Title + Chips: Maintain position, fade/scale slightly for continuity
 * - Card background: bg-card → bg-background with 200ms fade
 * - Content: Fade in progressively with 150ms stagger (hero → host → details → booking)
 * - Fallback: If shared-element not feasible, use opacity fade (0 → 1) for entire view
 * 
 * SCROLL BEHAVIOR:
 * - Desktop: Booking sidebar becomes sticky at top: 96px (6rem) from viewport top
 * - Mobile: Booking CTA appears as fixed bottom bar when user scrolls past hero
 * - Header: Sticky with backdrop-blur and border reveal on scroll
 * 
 * TOKEN MAPPING TABLE:
 * ┌─────────────────────────┬──────────────────────────┬────────────────────────────┐
 * │ Element                 │ Token                    │ States                     │
 * ├─────────────────────────┼──────────────────────────┼────────────────────────────┤
 * │ Page Background         │ bg-background            │ Static                     │
 * │ Card Surfaces           │ bg-card                  │ hover: shadow-lg           │
 * │ Text Primary            │ text-foreground          │ Static                     │
 * │ Text Secondary          │ text-muted-foreground    │ Static                     │
 * │ Borders                 │ border-border            │ Static                     │
 * │ Dividers                │ border-border            │ Static                     │
 * ├─────────────────────────┼──────────────────────────┼────────────────────────────┤
 * │ Primary CTA             │ bg-primary               │ hover: bg-primary/90       │
 * │                         │ text-primary-foreground  │ focus: ring-ring/50        │
 * │                         │                          │ disabled: opacity-50       │
 * ├─────────────────────────┼──────────────────────────┼────────────────────────────┤
 * │ Date Selector (Default) │ bg-card                  │ hover: bg-accent           │
 * │                         │ border-border            │ active: scale-95           │
 * │ Date Selector (Selected)│ bg-primary               │ Static                     │
 * │                         │ text-primary-foreground  │                            │
 * │ Date Selector (Disabled)│ bg-muted                 │ cursor-not-allowed         │
 * │                         │ text-muted-foreground    │ opacity-60                 │
 * ├─────────────────────────┼──────────────────────────┼────────────────────────────┤
 * │ Badges/Chips            │ bg-primary               │ Static                     │
 * │                         │ text-primary-foreground  │                            │
 * │ Badges (outline)        │ border-border            │ hover: bg-accent           │
 * │                         │ text-foreground          │                            │
 * ├─────────────────────────┼──────────────────────────┼────────────────────────────┤
 * │ Links                   │ text-foreground          │ hover: text-primary        │
 * │                         │                          │ underline-offset-4         │
 * ├─────────────────────────┼──────────────────────────┼────────────────────────────┤
 * │ Icon Buttons            │ bg-transparent           │ hover: bg-accent           │
 * │                         │ text-foreground          │ active: scale-95           │
 * │                         │                          │ focus: ring-ring/50        │
 * ├─────────────────────────┼──────────────────────────┼────────────────────────────┤
 * │ Image Overlay (Gallery) │ bg-background/60         │ hover: bg-background/80    │
 * │                         │ backdrop-blur            │                            │
 * ├─────────────────────────┼──────────────────────────┼────────────────────────────┤
 * │ Loading Skeleton        │ bg-muted                 │ animate-pulse              │
 * │                         │                          │                            │
 * └─────────────────────────┴──────────────────────────┴────────────────────────────┘
 * 
 * INTERACTION STATES (All elements):
 * - Default: Token-based colors as specified
 * - Hover: Enhanced with opacity/background changes (300ms ease-out)
 * - Active/Pressed: scale-95 transform (100ms ease-in)
 * - Focus-visible: ring-ring/50 ring-[3px] outline-none
 * - Disabled: opacity-50 pointer-events-none
 * - Selected: Inverted colors (bg-primary + text-primary-foreground)
 * 
 * DARK MODE:
 * All tokens automatically adapt via CSS variables defined in globals.css
 * No manual dark: classes required unless adding dark-specific effects
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Star, Clock, Users, MapPin, Calendar as CalendarIcon, 
  Shield, Heart, Share2, ChevronLeft, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ExperienceDetailProps {
  onClose: () => void;
  /** Optional: Experience ID to load from API */
  experienceId?: string;
}

export function ExperienceDetailRefined({ onClose, experienceId }: ExperienceDetailProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  // Mock data - in production, fetch via EventRunAPI.getPublicEventRunDetails(runId)
  const images = [
    'https://images.unsplash.com/photo-1761666520000-def67e58766e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZWlnaGJvcmhvb2QlMjB3YWxraW5nJTIwdG91cnxlbnwxfHx8fDE3NjIzNjE1NzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1666617181888-40d6e700ba62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHN0b3J5dGVsbGluZ3xlbnwxfHx8fDE3NjIzNjE1NzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1568492650629-3dfa9b007cbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBodW1hbiUyMGNvbm5lY3Rpb258ZW58MXx8fHwxNzYyMzYxNTcyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  ];

  const availableDates = [
    { date: '2026-01-15', display: 'Wed, Jan 15', available: true },
    { date: '2026-01-18', display: 'Sat, Jan 18', available: true },
    { date: '2026-01-22', display: 'Wed, Jan 22', available: true },
    { date: '2026-01-25', display: 'Sat, Jan 25', available: false },
  ];

  const availableTimes = ['10:00 AM', '2:00 PM', '4:00 PM'];

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      {/* Sticky Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="transition-all duration-300 hover:bg-accent active:scale-95"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="transition-all duration-300 hover:bg-accent active:scale-95"
              >
                <Share2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFavorited(!isFavorited)}
                className="transition-all duration-300 hover:bg-accent active:scale-95"
              >
                <Heart
                  className={`h-5 w-5 transition-all duration-200 ${
                    isFavorited ? 'fill-destructive text-destructive' : ''
                  }`}
                />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content Container */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Image Gallery - Preserves card image with expansion animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="relative rounded-3xl overflow-hidden mb-8 group"
        >
          <ImageWithFallback
            src={images[currentImageIndex]}
            alt="Experience"
            className="w-full aspect-[21/9] object-cover"
          />
          
          {/* Gallery Navigation */}
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:scale-110 active:scale-95 border border-border"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:scale-110 active:scale-95 border border-border"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          
          {/* Image Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-background/50 hover:bg-background/70'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width on desktop */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header Section - Preserves card title/chips with subtle animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <div className="mb-4">
                <Badge className="mb-3">Culture</Badge>
                <h1 className="mb-2">
                  Hidden Stories of the Gothic Quarter
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-chart-1 text-chart-1" />
                    <span>4.9</span>
                    <span>(127 reviews)</span>
                  </div>
                  <span className="hidden sm:inline">·</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>Barcelona, Spain</span>
                  </div>
                </div>
              </div>

              {/* Quick Info Chips */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Badge variant="outline" className="gap-2">
                  <Clock className="h-3 w-3" />
                  3 hours
                </Badge>
                <Badge variant="outline" className="gap-2">
                  <Users className="h-3 w-3" />
                  6-8 people
                </Badge>
                <Badge variant="outline" className="gap-2 border-chart-1 text-chart-1">
                  <CheckCircle2 className="h-3 w-3" />
                  3 spots left
                </Badge>
              </div>
            </motion.div>

            {/* Host Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <Card className="p-6 transition-all duration-300 hover:shadow-lg border-border">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      MG
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3>Maria Garcia</h3>
                      <Shield className="h-4 w-4 text-chart-1 flex-shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Local historian and storyteller · Host since 2022
                    </p>
                    <p className="text-sm">
                      I've lived in Barcelona's Gothic Quarter for 25 years. Every stone here has a story,
                      and I love sharing the hidden narratives that tourists never hear.
                    </p>
                    <Button
                      variant="link"
                      className="mt-3 p-0 h-auto text-foreground hover:text-primary transition-colors duration-200"
                    >
                      View full profile →
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* What You'll Experience */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <h3 className="mb-4">What you'll experience</h3>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    Forget the typical tourist trails. This intimate walk takes you through the labyrinthine
                    streets of Barcelona's oldest neighborhood, revealing layers of Roman, Medieval, and
                    modern history that most visitors never discover.
                  </p>
                  <p>
                    We'll visit hidden courtyards, ancient Roman walls embedded in Gothic buildings,
                    and the favorite haunts of local artists and writers. Along the way, I'll share
                    stories passed down through generations of my family who've called this neighborhood home.
                  </p>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Timeline/Itinerary */}
              <div>
                <h3 className="mb-4">Experience timeline</h3>
                <div className="space-y-4">
                  {[
                    { time: '0:00', title: 'Meet at Plaça Sant Jaume', desc: 'Introduction and overview of the quarter\'s history' },
                    { time: '0:30', title: 'Hidden Roman ruins', desc: 'Explore ancient walls few tourists see' },
                    { time: '1:30', title: 'Traditional café break', desc: 'Taste authentic Catalan pastries' },
                    { time: '2:15', title: 'Secret courtyards', desc: 'Visit private spaces with local stories' },
                  ].map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-sm text-foreground border border-border">
                          {index + 1}
                        </div>
                        {index < 3 && <div className="w-px h-full bg-border mt-2" />}
                      </div>
                      <div className="pb-6 flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h4>{step.title}</h4>
                          <span className="text-sm text-muted-foreground">{step.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-border" />

              {/* What's Included */}
              <div>
                <h3 className="mb-4">What's included</h3>
                <ul className="space-y-3">
                  {[
                    '3-hour guided walk through hidden corners',
                    'Traditional Catalan snack at a local café',
                    'Digital guide with recommended spots',
                    'Proof-of-attendance blockchain token',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5 border border-border">
                        <CheckCircle2 className="h-4 w-4 text-foreground" />
                      </div>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator className="bg-border" />

              {/* Meeting Point */}
              <div>
                <h3 className="mb-4">Meeting point & logistics</h3>
                <Card className="p-6 border-border">
                  <div className="flex gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="mb-1">Plaça Sant Jaume</p>
                      <p className="text-sm text-muted-foreground">
                        08002 Barcelona, Spain
                      </p>
                      <Button
                        variant="link"
                        className="mt-2 p-0 h-auto text-foreground hover:text-primary transition-colors duration-200"
                      >
                        Open in maps →
                      </Button>
                    </div>
                  </div>
                  <Separator className="my-4 bg-border" />
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Wear comfortable walking shoes</p>
                    <p>• Bring water and sunscreen</p>
                    <p>• Photography is encouraged</p>
                  </div>
                </Card>
              </div>

              <Separator className="bg-border" />

              {/* Reviews */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3>Guest reviews</h3>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-chart-1 text-chart-1" />
                    <span>4.9 · 127 reviews</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {[
                    { name: 'Sarah Chen', date: '2 weeks ago', review: "This wasn't just a tour—it was like spending an afternoon with a friend who happens to know every secret corner of Barcelona. Absolutely unforgettable!" },
                    { name: 'James Wilson', date: '1 month ago', review: "Maria's passion for the Gothic Quarter is infectious. The hidden spots she showed us were incredible, and the stories brought the history to life." },
                    { name: 'Emma Rodriguez', date: '1 month ago', review: 'Best experience in Barcelona! Small group, personal attention, and genuine local insight. Worth every euro.' },
                  ].map((review, index) => (
                    <Card key={index} className="p-6 border-border transition-all duration-300 hover:shadow-lg">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarFallback className="bg-accent text-foreground border border-border">
                            {review.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2 gap-4">
                            <h4>{review.name}</h4>
                            <span className="text-sm text-muted-foreground whitespace-nowrap">{review.date}</span>
                          </div>
                          <div className="flex gap-1 mb-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-chart-1 text-chart-1" />
                            ))}
                          </div>
                          <p className="text-muted-foreground">{review.review}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-6 transition-all duration-300 hover:bg-accent active:scale-95"
                >
                  Show all 127 reviews
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Booking Sidebar - 1/3 width on desktop, sticky */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="lg:col-span-1"
          >
            <Card className="p-6 sticky top-24 space-y-6 border-border shadow-lg">
              {/* Price */}
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl">$45</span>
                  <span className="text-muted-foreground">per person</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Price includes all fees
                </p>
              </div>

              <Separator className="bg-border" />

              {/* Date Selection */}
              <div>
                <h4 className="mb-3">Select a date</h4>
                <div className="grid gap-2">
                  {availableDates.map((dateOption) => (
                    <button
                      key={dateOption.date}
                      onClick={() => dateOption.available && setSelectedDate(new Date(dateOption.date))}
                      disabled={!dateOption.available}
                      className={`
                        w-full p-3 rounded-lg text-left transition-all duration-300
                        ${
                          selectedDate?.toISOString().split('T')[0] === dateOption.date
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : dateOption.available
                            ? 'bg-card border border-border hover:bg-accent hover:border-ring active:scale-95'
                            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                        }
                        ${dateOption.available ? 'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{dateOption.display}</span>
                        {!dateOption.available && (
                          <span className="text-xs">Sold out</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <AnimatePresence>
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h4 className="mb-3">Available times</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {availableTimes.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`
                            p-3 rounded-lg text-sm transition-all duration-300
                            ${
                              selectedTime === time
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-card border border-border hover:bg-accent hover:border-ring active:scale-95'
                            }
                            focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50
                          `}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Separator className="bg-border" />

              {/* CTA */}
              <div className="space-y-3">
                <Button
                  className="w-full h-11 bg-primary hover:bg-primary/90 active:scale-95 transition-all duration-300 focus-visible:ring-ring/50"
                  disabled={!selectedDate || !selectedTime}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {selectedDate && selectedTime ? 'Reserve your spot' : 'Select date & time'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  20% stake held in escrow · Released after experience
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <Shield className="h-4 w-4 text-chart-1 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Full refund up to 24h before</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Shield className="h-4 w-4 text-chart-1 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Host verified & background checked</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Shield className="h-4 w-4 text-chart-1 flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Secure blockchain payment escrow</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Mobile Bottom CTA - Shows when user scrolls past hero */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">From</p>
            <p className="text-xl">$45</p>
          </div>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 active:scale-95 transition-all duration-300"
            disabled={!selectedDate || !selectedTime}
          >
            Reserve spot
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}