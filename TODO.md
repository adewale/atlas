# Atlas — Future Data & Visualisation Ideas

## Data Enrichment

### Melting & Boiling Points
- Source melting point (Tm) and boiling point (Tb) in Kelvin from Wikidata/PubChem
- Freezing point is the same phase boundary as melting point but approached from the liquid side — for pure elements at 1 atm they are identical, so a single Tm value suffices; note this equivalence in the UI
- Build a **temperature slider** (0 K – 10,000 K) that recolours the periodic table by phase at the selected temperature
- Add a **pressure dimension** for a 2D phase-state explorer (requires sourcing pressure–temperature phase diagrams, which are sparse for many elements)

### Electron Configuration & Aufbau Principle
- Research how to represent electron configuration strings (e.g. `[Ar] 3d⁵ 4s¹`) compactly in our data model
- Investigate an **orbital-filling animation** that builds the periodic table row by row, showing electrons entering orbitals in aufbau order
- Highlight anomalies where the aufbau prediction is wrong (Cr, Cu, etc.) and explain the half-filled / fully-filled subshell stability preference
- Consider how this fits alongside the existing Anomaly Explorer — could the aufbau visualiser *be* the anomaly explanation?

### Interactive Oxidation State Filters
- Source common oxidation states (list of integers per element) from Wikidata
- Add a filter/slider to the periodic table: "Show elements that can have oxidation state +3"
- Visualise how oxidation state variety correlates with position in the table (transition metals have many; s-block has few)

### Isotope Data
- Source isotope count, most stable isotope mass, and half-life of longest-lived radioactive isotope
- Build an **isotope abundance** pie chart or bar for each element
- Create a **radioactive decay timeline** — slider showing which isotopes remain after N years
- Flag synthetic/short-lived elements distinctly

### Density
- Source density (g/cm³) at STP from PubChem
- Add as a fifth numeric property alongside mass, electronegativity, ionisation energy, and radius
- Enables property scatter plots that bridge phase and mass
- Density gradient colouring on the periodic table would reveal why metals cluster at the bottom-left

### Abundance & Crystal Structure
- Research **cosmic abundance** (solar system), **crustal abundance** (Earth's crust), and **oceanic abundance** — these are relative phenomena measured on log scales
- Abundance data would power a "rarity slider" showing which elements are common vs. vanishingly rare
- Source **crystal structure** type (bcc, fcc, hcp, diamond cubic, etc.) from Wikidata
- Research how to render unit cells as small 3D or isometric SVG diagrams
- Crystal structure correlates with material properties (ductility, hardness) — visualise these relationships
