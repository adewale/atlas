# Atlas Wireframes

ASCII mockups of all Atlas views showing Pretext integration, Byrne color
drama, Tufte data density, animation moments, and mobile adaptations.

Key: ████ = deep blue (#133e7c), ░░░░ = warm red (#9e1c2c),
     ▓▓▓▓ = mustard (#c59b1a), ···· = paper (#f7f2e8)


## 1. Home Page — Periodic Table (`/`)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│   A T L A S                                                                      │
│   ─────────                                                                      │
│                                                                                  │
│   [Search name or symbol___________]  [Highlight: ▾ Block ]  [Property: ▾ Mass ] │
│                                                                                  │
│   ┌────┐                                                                  ┌────┐ │
│   │ 1  │                                                                  │ 2  │ │
│   │ H  │                                                                  │ He │ │
│   │Hydr│                                                                  │Heli│ │
│   ├────┼────┐                                          ┌────┬────┬────┬────┼────┤ │
│   │ 3  │ 4  │                                          │ 5  │ 6  │ 7  │ 8  │ 9  │ │
│   │ Li │ Be │              s-block ████                 │ B  │ C  │ N  │ O  │ F  │ │
│   │Lith│Bery│              p-block ▓▓▓▓                 │Boro│Carb│Nitr│Oxyg│Fluo│ │
│   ├────┼────┤              d-block ░░░░                 ├────┼────┼────┼────┼────┤ │
│   │11  │12  │              f-block ████                 │13  │14  │15  │16  │17  │ │
│   │ Na │ Mg │                                          │ Al │ Si │ P  │ S  │ Cl │ │
│   │Sodi│Magn│                                          │Alum│Sili│Phos│Sulf│Chlo│ │
│   ├────┼────┼────┬────┬────┬────┬────┬────┬────┬────┬────┼────┼────┼────┼────┼────┤ │
│   │19  │20  │21  │22  │23  │24  │25  │26  │27  │28  │29  │30  │31  │32  │33  │34  │ │
│   │ K  │ Ca │ Sc │ Ti │ V  │ Cr │ Mn │ Fe │ Co │ Ni │ Cu │ Zn │ Ga │ Ge │ As │ Se │ │
│   ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤ │
│   │37  │38  │39  │40  │41  │42  │43  │44  │45  │46  │47  │48  │49  │50  │51  │52  │ │
│   │ Rb │ Sr │ Y  │ Zr │ Nb │ Mo │ Tc │ Ru │ Rh │ Pd │ Ag │ Cd │ In │ Sn │ Sb │ Te │ │
│   ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤ │
│   │55  │56  │57  │72  │73  │74  │75  │76  │77  │78  │79  │80  │81  │82  │83  │84  │ │
│   │ Cs │ Ba │ La │ Hf │ Ta │ W  │ Re │ Os │ Ir │ Pt │ Au │ Hg │ Tl │ Pb │ Bi │ Po │ │
│   ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤ │
│   │87  │88  │89  │104 │105 │106 │107 │108 │109 │110 │111 │112 │113 │114 │115 │116 │ │
│   │ Fr │ Ra │ Ac │ Rf │ Db │ Sg │ Bh │ Hs │ Mt │ Ds │ Rg │ Cn │ Nh │ Fl │ Mc │ Lv │ │
│   └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘ │
│                                                                                  │
│        ┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐    │
│        │58  │59  │60  │61  │62  │63  │64  │65  │66  │67  │68  │69  │70  │71  │    │
│        │ Ce │ Pr │ Nd │ Pm │ Sm │ Eu │ Gd │ Tb │ Dy │ Ho │ Er │ Tm │ Yb │ Lu │    │
│        ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤    │
│        │90  │91  │92  │93  │94  │95  │96  │97  │98  │99  │100 │101 │102 │103 │    │
│        │ Th │ Pa │ U  │ Np │ Pu │ Am │ Cm │ Bk │ Cf │ Es │ Fm │ Md │ No │ Lr │    │
│        └────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘    │
│                                                                                  │
│   118 elements · Arrow keys to navigate · Enter to open folio                    │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

Animation: Explosive moment 4 — cells cascade in by atomic number (~8ms stagger).
Highlight mode switch: color ripples outward from focused cell (250ms).

### Mobile (<768px)

```
┌────────────────────────────┐
│  A T L A S                 │
│  ─────────                 │
│                            │
│  [Search element_________] │
│                            │
│  ┌─── scrollable ───────── │ ──┐
│  │┌──┬──┬──┬──┬──┬──┬──┬──│┬──┤
│  ││H │  │  │  │  │  │  │  ││He│
│  │├──┼──┤  │  │  │  ├──┼──│┼──┤
│  ││Li│Be│  │  │  │  │B │C ││N │
│  │├──┼──┤  │  │  │  ├──┼──│┼──┤
│  ││Na│Mg│  │  │  │  │Al│Si││P │
│  │├──┼──┼──┼──┼──┼──┼──┼──│┼──┤
│  ││K │Ca│Sc│Ti│V │Cr│Mn│Fe││Co│
│  │└──┴──┴──┴──┴──┴──┴──┴──│┴──┘
│  │   ← swipe / scroll →   │
│  └─────────────────────────│
│                            │
│  Search is primary nav     │
│  on mobile. Grid scrolls.  │
└────────────────────────────┘
```

The 18-column grid does NOT reflow to a list — spatial relationships are the point.


## 2. Element Folio (`/element/Fe`) — with Pretext features

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│   A T L A S  ·  / element / Fe                                                   │
│   ─────────────────────────────                                                  │
│                                                                                  │
│   ┌─────────────────────────────────────────────────┐ ┌────────────────────────┐ │
│   │                                                 │ │                        │ │
│   │         026                                     │ │  Marginalia            │ │
│   │                                                 │ │  ─────────            │ │
│   │          Fe                                     │ │                        │ │
│   │                                                 │ │  Category:             │ │
│   │   Iron                                          │ │  transition metal      │ │
│   │   ─────────────────────────────────────────     │ │                        │ │
│   │                                                 │ │                        │ │
│   │   SHAPED TEXT (narrow beside plate):            │ │  ◄── 55.845 Da        │ │
│   │                                                 │ │       marginal         │ │
│   │   Iron is a chemical element;   ┌────────────┐  │ │       annotation at    │ │
│   │   it has symbol Fe and atomic   │████████████│  │ │       exact y of the   │ │
│   │   number 26. It is by mass      │██ Group 8 █│  │ │       line mentioning  │ │
│   │   the most common element on    │░░ Period 4 ░│  │ │       mass             │ │
│   │   Earth, forming much of        │   Block D   │  │ │                        │ │
│   │   Earth's outer and inner       │       Fe   │  │ │  ◄── 1.83 Pauling     │ │
│   │   core.  ╌╌╌╌╌╌╌╌∿∿            └────────────┘  │ │                        │ │
│   │          ↑ sparkline                            │ │  ◄── 7.902 eV         │ │
│   │                                                 │ │                        │ │
│   │   FULL WIDTH (below plate):                     │ │  Radius: 126 pm       │ │
│   │                                                 │ │  Phase: solid          │ │
│   │   It has a relatively high melting              │ │                        │ │
│   │   point and is used extensively                 │ │  Neighbors:            │ │
│   │   in construction and manufacturing.            │ │  ← Mn  Co →           │ │
│   │                                                 │ │                        │ │
│   │   ─────────────────────────────────────────     │ │  ─────────            │ │
│   │                                                 │ │                        │ │
│   │                                                 │ │  Source strip           │ │
│   │                                                 │ │  Data: Wikidata (CC0) │ │
│   │                                                 │ │  Text: Iron (WP)      │ │
│   │                                                 │ │  Media: No media v1   │ │
│   │                                                 │ │  ─────────            │ │
│   │                                                 │ │  Compare with → O     │ │
│   └─────────────────────────────────────────────────┘ └────────────────────────┘ │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

Pretext features visible:
- SHAPED TEXT: Lines beside data plate are narrower (layoutNextLine variable width)
- DATA PLATE: Byrne color drama is structural — hard color fields for Group
  (deep blue) and Period (warm red) on the plate, not on text lines
- INLINE SPARKLINE: ∿∿ at end of line — trend drawn in remaining line space
- MARGINAL ANNOTATIONS: ◄── property values aligned to exact y of relevant line

Animation: Explosive moment 1 — text lines reveal top-to-bottom with stagger,
data plate wipes in from right via clip-path. Sparklines draw after parent line.

### Folio mobile (<768px)

```
┌────────────────────────────┐
│  A T L A S · Fe            │
│  ──────────────            │
│                            │
│       026                  │
│        Fe                  │
│  Iron                      │
│  ──────────────────────    │
│                            │
│  ┌──────────────────────┐  │
│  │  Group 8  Period 4   │  │
│  │  Block D        Fe   │  │
│  └──────────────────────┘  │
│                            │
│  Iron is a chemical        │
│  element; it has symbol    │
│  Fe and atomic number 26.  │
│  It is by mass the most    │
│  common element on Earth,  │
│  forming much of Earth's   │
│  outer core. ╌╌╌╌╌∿∿       │
│                            │
│  ──────────────────────    │
│                            │
│  transition metal          │
│  55.845 Da · 1.83 · solid  │
│  ← Mn · Co →              │
│                            │
│  ──────────────────────    │
│  Data: Wikidata (CC0)      │
│  Text: Iron (Wikipedia)    │
│  Media: No media v1        │
│  ──────────────────────    │
│  Compare with → O          │
│                            │
└────────────────────────────┘
```

Mobile: single column, data plate above text, full-width Pretext lines,
marginalia below. Byrne lines and sparklines still present.


## 3. Compare View (`/compare/Fe/Au`) — with wedge text

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│   A T L A S  ·  Compare                                                          │
│   ─────────────────────                                                          │
│                                                                                  │
│   ┌─────────────────────────────────┬─────────────────────────────────┐          │
│   │████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│          │
│   │████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│          │
│   │██████████████ 026 ████████████████░░░░░░░░░░░ 079 ░░░░░░░░░░░░░░│          │
│   │████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│          │
│   │███████████████ Fe █████████████████░░░░░░░░░░░░ Au ░░░░░░░░░░░░░░│          │
│   │████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│          │
│   │██████████████ Iron ████████████████░░░░░░░░░░░ Gold ░░░░░░░░░░░░░│          │
│   │████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│          │
│   └─────────────────────────────────┴─────────────────────────────────┘          │
│                                                                                  │
│   Comparison Bands                                                               │
│   ────────────────                                                               │
│                                                                                  │
│   Mass                                                                           │
│   Fe  ██████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  55.845 Da                │
│   Au  ██████████████████████████████████████████░░░░░░  196.967 Da               │
│                                                                                  │
│   Electronegativity                                                              │
│   Fe  ████████████████████████████████████████░░░░░░░░  1.83                     │
│   Au  █████████████████████████████████████████████████  2.54                     │
│                                                                                  │
│   Ionization Energy                                                              │
│   Fe  ███████████████████████████████████████████░░░░░  7.902 eV                 │
│   Au  ████████████████████████████████████████████████░  9.226 eV                │
│                                                                                  │
│   Radius                                                                         │
│   Fe  ██████████████████████████████░░░░░░░░░░░░░░░░░░  126 pm                   │
│   Au  ████████████████████████████████████████░░░░░░░░  144 pm                   │
│                                                                                  │
│   ──────────────────────────────────────────────────                             │
│                                                                                  │
│   WEDGE TEXT (Pretext V-shaped width profile):                                   │
│                                                                                  │
│                    Both transition                                                │
│                  metals in block d.                                               │
│                Iron is period 4, gold                                             │
│              is period 6. Category match                                          │
│            reveals editorial contrast in                                          │
│          density, conductivity, and reactivity.                                   │
│                                                                                  │
│   The text shape echoes the split above — narrow at top, wide at bottom.         │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

Animation: Explosive moment 2 — color halves expand from center like opening a book.
Comparison bars grow from 0 to final width, staggered 60ms. Wedge text reveals
from narrowest line first.

### Compare mobile (<768px)

```
┌────────────────────────────┐
│  A T L A S · Compare       │
│  ───────────────────       │
│                            │
│  ┌──────────────────────┐  │
│  │████████████████████████  │
│  │████████ 026 ███████████  │
│  │█████████ Fe ███████████  │
│  │████████ Iron ██████████  │
│  │████████████████████████  │
│  ├──────────────────────┤  │
│  │░░░░░░░░░░░░░░░░░░░░░░│  │
│  │░░░░░░░░ 079 ░░░░░░░░░│  │
│  │░░░░░░░░░ Au ░░░░░░░░░│  │
│  │░░░░░░░░ Gold ░░░░░░░░│  │
│  │░░░░░░░░░░░░░░░░░░░░░░│  │
│  └──────────────────────┘  │
│                            │
│  Mass                      │
│  Fe ████████░░░  55.8 Da   │
│  Au █████████████ 197 Da   │
│                            │
│  Electronegativity         │
│  Fe ██████████░░  1.83     │
│  Au ████████████  2.54     │
│                            │
│  ...                       │
│                            │
│  Both transition metals    │
│  in block d. Iron is       │
│  period 4, gold period 6.  │
│                            │
└────────────────────────────┘
```

Mobile: vertical split (top/bottom), horizontal comparison bands remain.
Wedge text reverts to standard Pretext block on narrow screens.


## 4. Atlas Plate (`/atlas/group/1`) — with Tufte small multiples

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│   A T L A S  ·  Group 1 — Alkali Metals (+ Hydrogen)                            │
│   ──────────────────────────────────────────────────                             │
│                                                                                  │
│   ████████████████████████████████████████████████████████████████████████████   │
│   ████ Group 1 elements share a single valence         ████████████████████████   │
│   ████ electron. Reactivity increases down the group   ████████████████████████   │
│   ████ as ionization energy decreases.  ╌╌╌╌╌∿∿        ████████████████████████   │
│   ████████████████████████████████████████████████████████████████████████████   │
│       ↑ Byrne caption strip: blue rect behind caption, sparkline at line end     │
│                                                                                  │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│   │ 001          │ │ 003          │ │ 011          │ │ 019          │           │
│   │              │ │              │ │              │ │              │           │
│   │      H       │ │     Li       │ │     Na       │ │      K       │           │
│   │              │ │              │ │              │ │              │           │
│   │  1.008 Da    │ │  6.941 Da    │ │ 22.990 Da    │ │ 39.098 Da    │           │
│   │  nonmetal    │ │  alkali      │ │  alkali      │ │  alkali      │           │
│   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘           │
│   ↑ Pretext-fitted: layout() verifies labels fit card width                      │
│                                                                                  │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                            │
│   │ 037          │ │ 055          │ │ 087          │                            │
│   │              │ │              │ │              │                            │
│   │     Rb       │ │     Cs       │ │     Fr       │                            │
│   │              │ │              │ │              │                            │
│   │ 85.468 Da    │ │ 132.91 Da    │ │ (223) Da     │                            │
│   │  alkali      │ │  alkali      │ │  alkali      │                            │
│   └──────────────┘ └──────────────┘ └──────────────┘                            │
│                                                                                  │
│   H · Li · Na · K · Rb · Cs · Fr                                                │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

Tufte: The grid IS the visualization (small multiples). No separate chart.
Byrne: Caption strip has color rect behind Pretext-measured text.
Sparkline at end of caption line shows the ionization energy trend for the group.


## 5. About Page (`/about`)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│   A T L A S  ·  About                                                            │
│   ───────────────────                                                            │
│                                                                                  │
│   Atlas is a machine-edited periodic atlas. It                                   │
│   privileges composition, comparison, and ranking                                │
│   over long-form narrative. Facts are normalized                                 │
│   from Wikidata, summaries are attributed to                                     │
│   Wikipedia, and media credits map to Wikimedia                                  │
│   Commons records.                                                               │
│                    ← Pretext-composed →                                          │
│                                                                                  │
│   ──────────────────────────────────────────────                                │
│                                                                                  │
│   · No original chemistry prose in folios.                                       │
│   · SVG-first rendering for plates and compare bands.                            │
│   · Build-time JSON generation for deterministic deploys.                        │
│   · Text layout by @chenglou/pretext.                                            │
│                                                                                  │
│   ──────────────────────────────────────────────                                │
│                                                                                  │
│   Data    Wikidata (CC0)                                                         │
│   Text    Wikipedia (CC BY-SA 4.0)                                               │
│   Code    github.com/adewale/atlas                                               │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```


## 6. Credits Page (`/credits`)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│   A T L A S  ·  Credits                                                          │
│   ─────────────────────                                                          │
│                                                                                  │
│   Structured Data                                                                │
│   ───────────────                                                                │
│   All structured element data is derived from                                    │
│   Wikidata and PubChem, available under CC0.                                     │
│                                                                                  │
│   Text Summaries                                                                 │
│   ──────────────                                                                 │
│   Element  Source                          License                               │
│   ──────── ─────────────────────────────── ──────────                            │
│   H        Hydrogen (Wikipedia)            CC BY-SA 4.0                          │
│   He       Helium (Wikipedia)              CC BY-SA 4.0                          │
│   Li       Lithium (Wikipedia)             CC BY-SA 4.0                          │
│   ...      ...                             ...                                   │
│   Og       Oganesson (Wikipedia)           CC BY-SA 4.0                          │
│                                                                                  │
│   Media                                                                          │
│   ─────                                                                          │
│   No media included in v1.                                                       │
│                                                                                  │
│   Software                                                                       │
│   ────────                                                                       │
│   · Vite · React · React Router · @chenglou/pretext                             │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```


## 7. Design Language Page (`/design`)

A living reference showing every visual element, like a component library
rendered in the actual design language. Inspired by print specimen sheets.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│   A T L A S  ·  Design Language                                                  │
│   ─────────────────────────────                                                  │
│                                                                                  │
│                                                                                  │
│   COLOUR PALETTE                                                                 │
│   ──────────────                                                                 │
│                                                                                  │
│   ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│   │████████████│ │            │ │████████████│ │░░░░░░░░░░░░│ │▓▓▓▓▓▓▓▓▓▓▓▓│   │
│   │████████████│ │   Paper    │ │████████████│ │░░░░░░░░░░░░│ │▓▓▓▓▓▓▓▓▓▓▓▓│   │
│   │████████████│ │            │ │████████████│ │░░░░░░░░░░░░│ │▓▓▓▓▓▓▓▓▓▓▓▓│   │
│   ├────────────┤ ├────────────┤ ├────────────┤ ├────────────┤ ├────────────┤   │
│   │ Black      │ │ Paper      │ │ Deep Blue  │ │ Warm Red   │ │ Mustard    │   │
│   │ #0f0f0f    │ │ #f7f2e8    │ │ #133e7c    │ │ #9e1c2c    │ │ #c59b1a    │   │
│   └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                                  │
│   Usage: Black for text and rules. Paper for backgrounds. Deep blue for          │
│   physical properties. Warm red for chemical/reactive. Mustard for structural.   │
│                                                                                  │
│                                                                                  │
│   TYPOGRAPHY                                                                     │
│   ──────────────                                                                 │
│                                                                                  │
│   Page title       A T L A S                    system sans · 1.75rem · 700      │
│   Section title    COLOUR PALETTE               system sans · 0.75rem · 600      │
│                                                 uppercase · 0.1em tracking       │
│   Hero numeral     026                          system sans · 6rem · 700         │
│   Hero symbol      Fe                           system sans · 4rem · 700         │
│   Element name     Iron                         system sans · 1.5rem · 600       │
│   Body text        Iron is a chemical...        system sans · 1rem · 400         │
│   Numeric data     55.845 Da                    system mono · 0.875rem · 500     │
│   Marginalia       Category: transition metal   system sans · 0.8125rem · 400    │
│                                                                                  │
│                                                                                  │
│   BYRNE COLOUR DRAMA                                                             │
│   ──────────────────                                                             │
│                                                                                  │
│   Color is structural, not per-line. Hard color fields on data plates,           │
│   compare splits, and highlight modes. Color IS identity, not decoration.        │
│                                                                                  │
│   ┌──────────────────────────────────────┐                                       │
│   │████████████████  Group 8              │  ← deep blue = group identity         │
│   │░░░░░░░░░░░░░░░░  Period 4             │  ← warm red = period identity         │
│   │                   Block D             │  ← neutral = context                  │
│   │                          Fe           │  ← giant symbol                       │
│   └──────────────────────────────────────┘                                       │
│                                                                                  │
│                                                                                  │
│   INLINE SPARKLINES                                                              │
│   ─────────────────                                                              │
│                                                                                  │
│   Sparklines occupy remaining horizontal space after Pretext measures            │
│   each line's width. Data and explanation share the same line.                   │
│                                                                                  │
│   Electronegativity increases across  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌∿∿∿∿                      │
│   the period from Na to Cl.           ↑ 12px sparkline in remaining space        │
│                                                                                  │
│                                                                                  │
│   MARGINAL ANNOTATIONS                                                           │
│   ────────────────────                                                           │
│                                                                                  │
│   Property values aligned to the exact y-position of the text line               │
│   that discusses them. Tufte sidenotes, programmatically positioned.             │
│                                                                                  │
│                                                  ◄── 55.845 Da                   │
│   Iron has a relatively high atomic mass,                                        │
│   making it one of the heavier elements                                          │
│   commonly found in Earth's crust. Its           ◄── 1.83 (Pauling)             │
│   electronegativity is moderate compared                                         │
│   to other transition metals.                    ◄── 7.902 eV                    │
│                                                                                  │
│                                                                                  │
│   SHAPED TEXT                                                                    │
│   ──────────────                                                                 │
│                                                                                  │
│   Pretext layoutNextLine() with variable maxWidth per line.                      │
│   Text flows around adjacent elements instead of sitting in a rectangle.         │
│                                                                                  │
│   Iron is a chemical       ┌────────────────┐                                    │
│   element with symbol      │                │                                    │
│   Fe and atomic number     │   DATA PLATE   │                                    │
│   26. It is the most       │                │                                    │
│   common element on        └────────────────┘                                    │
│   Earth by mass, forming much of the outer                                       │
│   and inner core. It has a relatively high                                       │
│   melting point.                                                                 │
│   ↑ narrow lines (beside plate)   ↑ full width lines (below plate)              │
│                                                                                  │
│                                                                                  │
│   WEDGE TEXT                                                                     │
│   ──────────                                                                     │
│                                                                                  │
│   Used in compare view. layoutNextLine() with V-shaped width profile.            │
│   Text shape echoes the dramatic split above it.                                 │
│                                                                                  │
│                      Both transition                                             │
│                    metals in block d.                                             │
│                  Iron is period 4, gold                                           │
│                is period 6. Category match                                        │
│              reveals editorial contrast in                                        │
│            density, conductivity, and reactivity.                                 │
│                                                                                  │
│                                                                                  │
│   THIN RULES                                                                     │
│   ──────────                                                                     │
│                                                                                  │
│   1px #0f0f0f. Used as section dividers, not borders.                            │
│   ──────────────────────────────────────────────────────────────────             │
│   Rules separate content areas. They are not decorative.                         │
│   ──────────────────────────────────────────────────────────────────             │
│                                                                                  │
│                                                                                  │
│   ELEMENT CELLS                                                                  │
│   ─────────────                                                                  │
│                                                                                  │
│   Default              Highlighted (block)    Focused                            │
│   ┌──────────┐         ┌──────────┐          ┌──────────┐                        │
│   │ 26       │         │████ 26 ██│          │░░ 26   ░░│                        │
│   │          │         │██████████│          │░░░░░░░░░░│                        │
│   │    Fe    │         │███ Fe ███│          │░░░ Fe ░░░│                        │
│   │          │         │██████████│          │░░░░░░░░░░│                        │
│   │   Iron   │         │███Iron███│          │░░ Iron ░░│                        │
│   └──────────┘         └──────────┘          └──────────┘                        │
│   paper fill           deep blue fill        warm red 2px                        │
│   #0f0f0f stroke       paper text            focus ring                          │
│                                                                                  │
│                                                                                  │
│   COMPARISON BANDS                                                               │
│   ────────────────                                                               │
│                                                                                  │
│   Fe  ██████████████░░░░░░░░░░░░░░░░░░░░  55.845 Da                             │
│   Au  ██████████████████████████████████░  196.967 Da                             │
│       ↑ blue bar = value   ↑ empty = remaining scale                             │
│                                                                                  │
│                                                                                  │
│   DATA PLATE                                                                     │
│   ──────────                                                                     │
│                                                                                  │
│   ┌──────────────────────────────────────┐                                       │
│   │████████████████  Group 8              │                                       │
│   │░░░░░░░░░░░░░░░░  Period 4             │                                       │
│   │                   Block D             │                                       │
│   │                          Fe           │                                       │
│   └──────────────────────────────────────┘                                       │
│   Hard color fields. Group = deep blue, Period = warm red.                        │
│   No gradients. Byrne geometry.                                                  │
│                                                                                  │
│                                                                                  │
│   ANIMATION MOMENTS                                                              │
│   ─────────────────                                                              │
│                                                                                  │
│   90% of the interface is perfectly still. Four moments are explosive:           │
│                                                                                  │
│   1. Folio entry      Byrne rects wipe left→right, text fades in after,          │
│                       sparklines draw, shaped text cascades. ~500ms.             │
│                                                                                  │
│   2. Compare split    Color halves expand from center like opening a book.       │
│                       Bars grow from zero. Wedge text reveals narrow→wide.       │
│                                                                                  │
│   3. Highlight mode   Color ripples outward from focused cell. 250ms.            │
│                                                                                  │
│   4. First load       Cells cascade in by atomic number. ~8ms/cell.              │
│                                                                                  │
│   Everything else is instant. No transition. No ease. The stillness              │
│   is deliberate. prefers-reduced-motion disables all animation.                  │
│                                                                                  │
│                                                                                  │
│   SPACING                                                                        │
│   ───────                                                                        │
│                                                                                  │
│   4 · 8 · 12 · 16 · 24 · 32 · 48 px                                            │
│   █ · ██ · ███ · ████ · ██████ · ████████ · ████████████                        │
│                                                                                  │
│   Border radius: 0px. Always. Sharp corners throughout.                          │
│   The aesthetic is printed, not digital.                                          │
│                                                                                  │
│                                                                                  │
│   DESIGN PRINCIPLES                                                              │
│   ─────────────────                                                              │
│                                                                                  │
│   60% Kronecker-Wallis / Byrne     Bold geometric color fields. Color as         │
│                                    meaning. Giant symbols. The table as           │
│                                    visual art, not just a data grid.             │
│                                                                                  │
│   40% Tufte                        High data-ink ratio. Sparklines inline        │
│                                    with text. Marginal annotations. Small        │
│                                    multiples. No chartjunk.                      │
│                                                                                  │
│   90% quiet / 10% explosive        Most of the interface is still. Four          │
│                                    specific moments have dramatic motion.        │
│                                    Stillness makes the motion land harder.       │
│                                                                                  │
│   Text as composition              Pretext measures every line. Text flows       │
│                                    around elements, sparklines fill remaining    │
│                                    space, colors classify lines. Text is not     │
│                                    dropped in — it is composed into space.       │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```


## 12. Explore Page — Faceted Entity Search (`/explore`)

### Desktop landing state (no filters, no search)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  ┌──┐                                                                            │
│  │A │  ┌─ VizNav ──────────────────────────────────────────────────────────────┐ │
│  │T │  │ ■ Table  ■ Phase  ■ Neighbours  ■ Anomalies  ■ Scatter  ■ Timeline  │ │
│  │L │  │ ■ Etymology  ■ Discoverers  █ EXPLORE                               │ │
│  │A │  └───────────────────────────────────────────────────────────────────────┘ │
│  │S │                                                                            │
│  └──┘  ┌─────────────────────────────────────────────────────────────────────┐  │
│        │                                                                     │  │
│   ①    │   E X P L O R E                                                    │  │
│        │   ─────────────                                                     │  │
│        │                                                                     │  │
│   ②    │   ┌──────────────────────────────────────────────────┐              │  │
│        │   │ 🔍  Search entities…                              │              │  │
│        │   └──────────────────────────────────────────────────┘              │  │
│        │                                                                     │  │
│   ③    │   ENTITY TYPE                                                       │  │
│        │   ░░ Element(118)  ░░ Discoverer(54)  ░░ Era(22)  ░░ Category(10)  │  │
│        │   ░░ Group(18)  ░░ Block(4)  ░░ Anomaly(5)  ░░ Etymology(7)       │  │
│        │                                                                     │  │
│        │   297 entities                                                      │  │
│        │                                                                     │  │
│   ④    │   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │  │
│        │   │██████████████████│  │██████████████████│  │██████████████████│ │  │
│        │   │██ H — Hydrogen ██│  │██ He — Helium  ██│  │██ Li — Lithium ██│ │  │
│        │   │██████████████████│  │██████████████████│  │██████████████████│ │  │
│        │   │ ELEMENT           │  │ ELEMENT           │  │ ELEMENT           │ │  │
│        │   │                   │  │                   │  │                   │ │  │
│        │   │ Hydrogen is the   │  │ Helium is a noble │  │ Lithium is the   │ │  │
│        │   │ lightest element  │  │ gas, the second…  │  │ lightest metal…  │ │  │
│        │   │ and most abundant │  │                   │  │                   │ │  │
│        │   │                   │  │                   │  │                   │ │  │
│        │   │ 1 element    ▸   │  │ 1 element    ▸   │  │ 1 element    ▸   │ │  │
│        │   └──────────────────┘  └──────────────────┘  └──────────────────┘ │  │
│        │                                                                     │  │
│        │   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │  │
│        │   │██████████████████│  │██████████████████│  │██████████████████│ │  │
│        │   │██  Alkali metals█│  │██   Humphry Davy█│  │██   1800s      ██│ │  │
│        │   │██████████████████│  │██████████████████│  │██████████████████│ │  │
│        │   │ CATEGORY          │  │ DISCOVERER        │  │ ERA               │ │  │
│        │   │                   │  │                   │  │                   │ │  │
│        │   │ The alkali metals │  │ Discovered 5      │  │ 31 elements       │ │  │
│        │   │ are soft, silvery │  │ elements: B, Na,  │  │ discovered in the │ │  │
│        │   │ reactive metals…  │  │ K, Ca, Ba         │  │ 1800s.            │ │  │
│        │   │ ██ ██ ██ ██ ██ ██ │  │ ██ ██ ██ ██ ██   │  │ ██ ██ ██ ██ ██ ██ │ │  │
│        │   │ 6 elements   ▸   │  │ 5 elements   ▸   │  │ 31 elements  ▸   │ │  │
│        │   └──────────────────┘  └──────────────────┘  └──────────────────┘ │  │
│        │                                                                     │  │
│        │   (… ~297 cards, all entity types interleaved …)                    │  │
│        │                                                                     │  │
│        └─────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│        ┌─ SiteNav ─────────────────────────────────────────────────────────────┐ │
│        │ Press ? for shortcuts     Atlas  About  Credits  Design  Explore  …  │ │
│        └───────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

#### Annotations

```
  ①  INSCRIPTION TITLE — "EXPLORE" in 13px bold uppercase with 0.2em
     tracking (INSCRIPTION_STYLE).  Coloured MUSTARD.  Same pattern as
     every other viz page heading.

  ②  SEARCH BOX — always visible, always at the top of the control
     section.  No "click to reveal" — the box IS the invitation.
     Black 1.5px border, no border-radius (Byrne: no rounded corners).
     Placeholder: "Search entities…"
     Typing filters the entity corpus client-side.  When empty, all
     ~297 entities are shown.  The search box and facet chips together
     form the "lens" — they narrow what's below.

     Keyboard: "/" focuses the search box from anywhere on the page.
     Esc clears the search and blurs.

  ③  FACET CHIPS — one row per facet dimension.  On landing, only the
     primary facet (Entity Type) is shown.  Each chip:
       ░░ = outlined, unselected (Byrne: colour border, transparent fill)
       ██ = filled, selected (Byrne: solid colour fill, contrast text)
       greyed = disabled, count is 0 (visible but not clickable)

     The (N) count after each label is SELF-EXCLUSION counted:
     counts for the Entity Type facet ignore which types are currently
     selected.  This means the user always sees the full distribution.

     Secondary facet rows (Block, Era, Etymology, Phase) appear when
     the result set is narrowed enough to make them useful — e.g.
     after selecting Entity Type = Element, or after clicking a
     discoverer card.

     All chip state is reflected in the URL query string.

  ④  ENTITY CARDS — CSS grid, 3 columns desktop / 1 column mobile.
     auto-fill with minmax(280px, 1fr).  All entity types use the
     same card structure:

     ┌──────────────────┐
     │██████████████████│ ← Colour header: entity type colour from
     │██   Name       ██│   ENTITY_TYPE_COLOURS (DEEP_BLUE for elements,
     │██████████████████│   MUSTARD for discoverers, WARM_RED for eras…)
     │ TYPE LABEL        │ ← 8px uppercase, entity type name
     │                   │
     │ Description text  │ ← CSS line-clamp: 3, no manual measurement
     │ flows here…       │
     │                   │
     │ ██ ██ ██ ██ ██    │ ← Child element symbols as mini block-coloured
     │                   │   squares (only for non-element entities)
     │ N elements   ▸   │ ← Footer: count + drill affordance
     └──────────────────┘

     Cards animate in via the existing card-enter keyframe (250ms
     ease-out, 15ms stagger per card).

     Clicking an ELEMENT card → navigates to /elements/:symbol
     via View Transition (element-symbol morphs to folio hero).

     Clicking a NON-ELEMENT card → pre-fills that entity as a
     facet value.  E.g. clicking "Humphry Davy" sets
     Discoverer = Humphry Davy, narrowing to his 5 elements.
     Secondary facet rows (Block, Era) appear with counts
     computed against that narrowed set.
```

### Desktop active state (search + facets)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  ┌──┐  ┌─ VizNav (█ EXPLORE active) ──────────────────────────────────────────┐ │
│  │A │  └──────────────────────────────────────────────────────────────────────┘ │
│  │T │                                                                            │
│  │L │   E X P L O R E                                                           │
│  │A │                                                                            │
│  │S │   ┌─────────────────────────────────────────────┐                          │
│  └──┘   │ 🔍  curie                                 × │  × Clear all            │
│         └─────────────────────────────────────────────┘                          │
│                                                                                  │
│         ENTITY TYPE                                                              │
│         ██ Element(3)  ░░ Discoverer(2)  ░░ Era(1)                              │
│         ░░ Category(2)  ░░ Group(2)  ░░ Block(1)                                │
│         ·· Anomaly(0)  ░░ Etymology(1)                                          │
│                   ↑                                                              │
│                   disabled — no Curie-related anomalies                          │
│                                                                                  │
│         BLOCK           ← secondary facet row, appeared because                  │
│         ░░ s(1)  ░░ p(1)  ░░ d(1)  ·· f(0)    results include elements          │
│                                       ↑                                          │
│                                       disabled                                   │
│                                                                                  │
│         ERA                                                                      │
│         ·· 1800s(0)  ░░ 1890s(2)  ░░ 1940s(1)                                  │
│            ↑                                                                     │
│            disabled — no Curie entity is from the 1800s                          │
│                                                                                  │
│         3 entities (filtered to Element)                                          │
│                                                                                  │
│         ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│         │██████████████████│  │██████████████████│  │██████████████████│        │
│         │██ Cm — Curium  ██│  │██ Ra — Radium  ██│  │██ Po — Polonium██│        │
│         │██████████████████│  │██████████████████│  │██████████████████│        │
│         │ ELEMENT           │  │ ELEMENT           │  │ ELEMENT           │        │
│         │                   │  │                   │  │                   │        │
│         │ Curium is a       │  │ Radium is a       │  │ Polonium is a    │        │
│         │ synthetic radio-  │  │ radioactive       │  │ radioactive      │        │
│         │ active element…   │  │ alkaline earth…   │  │ metalloid…       │        │
│         │                   │  │                   │  │                   │        │
│         │ 1 element    ▸   │  │ 1 element    ▸   │  │ 1 element    ▸   │        │
│         └──────────────────┘  └──────────────────┘  └──────────────────┘        │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile landing state

```
┌──────────────────────────────┐
│                               │
│  ■ Table ■ Phase ■ Neigh.    │
│  ■ Anom. ■ Scatter ■ Time.   │
│  ■ Etym. ■ Disc. █ EXPLORE   │
│                               │
│  E X P L O R E               │
│                               │
│  ┌──────────────────────────┐│
│  │ 🔍  Search entities…      ││
│  └──────────────────────────┘│
│                               │
│  ENTITY TYPE                  │
│  ░░ Element(118)              │
│  ░░ Discoverer(54)            │
│  ░░ Era(22) ░░ Category(10)  │
│  ░░ Group(18) ░░ Block(4)    │
│  ░░ Anomaly(5)                │
│  ░░ Etymology(7)              │
│                               │
│  297 entities                 │
│                               │
│  ┌──────────────────────────┐│
│  │██████████████████████████││
│  │██ H — Hydrogen         ██││
│  │██████████████████████████││
│  │ ELEMENT                   ││
│  │                           ││
│  │ Hydrogen is the lightest  ││
│  │ element and most abundant ││
│  │ chemical substance in…    ││
│  │                           ││
│  │ 1 element            ▸   ││
│  └──────────────────────────┘│
│                               │
│  ┌──────────────────────────┐│
│  │██████████████████████████││
│  │██ He — Helium          ██││
│  │██████████████████████████││
│  │ ELEMENT                   ││
│  │                           ││
│  │ Helium is a noble gas,   ││
│  │ the second lightest…     ││
│  │                           ││
│  │ 1 element            ▸   ││
│  └──────────────────────────┘│
│                               │
│  (… single-column cards …)    │
│                               │
│  ─────────────────────────── │
│  Press ? for shortcuts        │
│  Atlas About Credits Explore  │
│                               │
└──────────────────────────────┘

  Mobile notes:
  - VizNav wraps across 3 rows
  - Search box is full-width
  - Chips wrap naturally (flexbox)
  - Cards are single-column (grid: 1fr)
  - Same facet logic, just stacked
  - Touch targets: all chips ≥ 44px tall
```
