# Flowe — Design Theme

Extracted from `prototype/Mobile app design`.

---

## Color Palette

### Core (`:root`)

| Token | Hex | Usage |
|---|---|---|
| `--background` | `#1a1a1a` | App background |
| `--foreground` | `#ffffff` | Primary text |
| `--card` | `#2a2a2a` | Cards, surface panels |
| `--card-foreground` | `#ffffff` | Text on cards |
| `--popover` | `#2a2a2a` | Dropdowns, tooltips |
| `--secondary` | `#3a3a3a` | Secondary surfaces |
| `--muted` | `#404040` | Disabled states, switch backgrounds |
| `--muted-foreground` | `#a0a0a0` | Placeholder text, subtle labels |
| `--border` | `rgba(255,255,255,0.1)` | Dividers, card borders |
| `--input-background` | `#2a2a2a` | Input fields |
| `--switch-background` | `#404040` | Toggle/switch track |

### Brand / Accent

| Token | Hex | Usage |
|---|---|---|
| `--primary` | `#C5FF00` | CTA buttons, active states, accent dots, progress bars |
| `--primary-foreground` | `#000000` | Text on primary (lime-green) surfaces |
| `--accent` | `#C5FF00` | Same as primary — used for highlights |
| `--accent-foreground` | `#000000` | Text on accent surfaces |
| `--ring` | `#C5FF00` | Focus rings |

### Semantic

| Token | Value | Usage |
|---|---|---|
| `--destructive` | `#ff4444` | Delete / error actions |
| `--destructive-foreground` | `#ffffff` | Text on destructive backgrounds |

### Chart Colors

| Token | Hex | Meaning |
|---|---|---|
| `--chart-1` | `#C5FF00` | Primary series (lime) |
| `--chart-2` | `#00d4ff` | Cyan — secondary metric |
| `--chart-3` | `#ff6b6b` | Coral — expenses / negative |
| `--chart-4` | `#ffd93d` | Yellow — savings / Tabung |
| `--chart-5` | `#6bcf7f` | Green — income / positive |

### Account Type Colors (from Onboarding)

| Bank | Color |
|---|---|
| Maybank | `#ffd93d` |
| CIMB | `#ff6b6b` |
| Public Bank | `#00d4ff` |
| RHB | `#6bcf7f` |
| Hong Leong | `#C5FF00` |
| AmBank | `#a78bfa` |
| Bank Islam | `#34d399` |
| Bank Rakyat | `#f472b6` |
| BSN | `#60a5fa` |
| Affin Bank | `#fb923c` |
| Alliance Bank | `#c084fc` |
| Other | `#94a3b8` |

Wallet colors cycle through: `#6bcf7f`, `#ffd93d`, `#00d4ff`, `#C5FF00`, `#f472b6`.

---

## Typography

Base font size: **16px**

| Element | Size token | Weight |
|---|---|---|
| `h1` | `text-2xl` | 500 (medium) |
| `h2` | `text-xl` | 500 |
| `h3` | `text-lg` | 500 |
| `h4` | `text-base` | 500 |
| `label` | `text-base` | 500 |
| `button` | `text-base` | 500 |
| `input` | `text-base` | 400 (normal) |

### In practice (from components)

| Usage | Classes |
|---|---|
| Page title / hero | `text-4xl font-bold` |
| Section heading | `text-2xl font-bold` or `text-3xl font-bold` |
| Card title | `text-xl` or `text-2xl font-bold` |
| Body / description | `text-sm text-muted-foreground` |
| Label (form) | `text-xs text-muted-foreground font-medium` |
| Section label | `text-xs text-muted-foreground uppercase tracking-wider font-semibold` |
| Micro / hint | `text-xs text-muted-foreground/60` |
| Balance display | `text-4xl font-bold` |

---

## Border Radius

| Token | Value | Tailwind equivalent |
|---|---|---|
| `--radius` (lg) | `1rem` (16px) | `rounded-2xl` |
| `--radius-md` | `0.875rem` (14px) | `rounded-xl` |
| `--radius-sm` | `0.75rem` (12px) | `rounded-lg` |
| `--radius-xl` | `1.25rem` (20px) | `rounded-3xl` |

### Component radius in practice

| Component | Radius |
|---|---|
| Primary CTA button | `rounded-2xl` |
| Input field | `rounded-xl` or `rounded-2xl` |
| Card / surface panel | `rounded-2xl` or `rounded-3xl` |
| Icon badge / chip | `rounded-xl` |
| Numpad key | `rounded-2xl` |
| Tab / type chip | `rounded-2xl` |
| FAB (Add button) | `rounded-full` |
| Notification dot | `rounded-full` |
| Progress bar | `rounded-full` |
| Avatar / logo | `rx="22"` (~`rounded-2xl`) |

---

## Spacing & Layout

- Max container width: **`max-w-md`** (centered, `mx-auto`)
- Screen padding: `p-4` or `px-6`
- Section gap: `mb-6`
- Card padding: `p-5` or `p-6`
- Grid for shortcuts: `grid grid-cols-4 gap-3`
- Bottom nav height: `py-3` with fixed positioning

---

## Component Patterns

### Primary CTA Button
```
bg-primary text-black rounded-2xl py-4 font-bold text-base
active:scale-[0.98] transition-transform
flex items-center justify-center gap-2
```

### Disabled Button
```
bg-muted text-muted-foreground cursor-not-allowed rounded-2xl
```

### Ghost / Secondary Button
```
text-muted-foreground hover:text-foreground transition-colors py-3 text-sm
```

### Card Surface
```
bg-card border border-border rounded-2xl p-5
```

### Balance Banner (gradient card)
```
bg-gradient-to-br from-card via-card to-secondary rounded-2xl p-6 shadow-lg
```

### Input Field
```
bg-background border border-border rounded-xl px-4 py-3
outline-none focus:border-primary transition-colors
placeholder:text-muted-foreground/50
```

### Input on Onboarding Name screen (larger)
```
bg-card border-2 border-border rounded-2xl px-5 py-4 text-lg
focus:border-primary transition-colors
```

### Active / Selected Chip
```
border-primary bg-primary/10 text-primary   (active)
border-border bg-card text-muted-foreground (inactive)
```

### FAB (Floating Action Button — Add)
```
bg-primary text-primary-foreground w-14 h-14 rounded-full
shadow-lg shadow-primary/30 hover:scale-105 transition-transform -mt-8
```

### Bottom Navigation Item
```
Active:   text-primary
Inactive: text-muted-foreground hover:text-foreground
```

### Progress Step Bar
```
Active step:    bg-primary text-black ring-4 ring-primary/25 rounded-full
Completed step: bg-primary text-black rounded-full
Inactive step:  bg-muted text-muted-foreground rounded-full
Connector line: bg-primary (done) / bg-muted (pending) h-0.5 rounded-full
```

### PIN Dot
```
Filled:  bg-primary border-primary scale-110
Empty:   bg-transparent border-muted-foreground/50
```

### Glow / Ambient Effect
```
blur-2xl bg-primary/30 rounded-full scale-150 (absolute, behind logo)
```

### Info Box (subtle)
```
bg-primary/10 border border-primary/20 rounded-2xl p-4
```

### Dashed "Add" Button
```
border-2 border-dashed border-primary/40 rounded-2xl
text-primary font-semibold hover:bg-primary/5
```

### Error Text
```
text-xs text-red-400 mt-1
```

---

## Iconography

- Icon library: **Lucide React** (`lucide-react`)
- Standard icon size: `w-5 h-5`
- Large icon (hero): `w-7 h-7` or `w-14 h-14`
- Small inline icon: `w-4 h-4`
- FAB icon: `w-6 h-6`

---

## Motion & Interaction

| Pattern | Implementation |
|---|---|
| Button press | `active:scale-[0.98] transition-transform` |
| FAB hover | `hover:scale-105 transition-transform` |
| Color transitions | `transition-colors` |
| All transitions | `transition-all` |
| Scanning pulse ring | `animate-ping opacity-40` |
| Success glow | `animate-pulse` |
| Checkmark draw | CSS `stroke-dashoffset` animation (0.45s ease-out) |
| PIN dot fill | `transition-all duration-150` |
| Fingerprint border | `transition-all duration-500` |

---

## App Logo

SVG, 80×80, corner radius `rx="22"`:
- Background fill: `#C5FF00` (lime)
- Card/body fill: `#1a1a1a` (dark)
- Accent circle: `#C5FF00` with `#1a1a1a` inner dot
- Strip detail: `#555` (muted grey)

---

## Summary

| Attribute | Value |
|---|---|
| Theme mode | **Dark only** |
| Brand color | **`#C5FF00`** (Electric Lime) |
| App background | `#1a1a1a` |
| Surface / card | `#2a2a2a` |
| Text on brand | `#000000` (black) |
| Base radius | `16px` (`rounded-2xl`) |
| Base font | 16px, weight 400/500 |
| Icon library | Lucide React |
| Motion style | Scale press + color transitions |
