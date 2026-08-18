# CAM Lab

CAM Lab is a modern build planner and stat calculator for **Catch a Monster**, built with **React**, **Next.js**, **TypeScript**, and **Tailwind CSS**.

The project turns game data and player-tested formulas into an interactive tool for exploring monsters, creating builds, and understanding how each modifier affects combat statistics. Its interface is inspired by detailed planning tools such as Path of Building and PCPartPicker while remaining approachable for regular players.

## Access the Site

Use CAM Lab directly in your browser:

**[Open CAM Lab](https://jjeastside.github.io/catch-a-monster-labs/)**

No installation is required. The current build is hosted on GitHub Pages and is automatically redeployed from the `main` branch.

## Current Features

### Monster Browser

- Search and browse more than 200 monsters
- Filter by source, rarity, element, evolution status, and passive
- Compact and expanded browser views
- Monster artwork, element icons, rarity styling, and source information
- Detailed monster overview with skills and availability requirements
- Persistent selected monster after refreshing the page

### Build Editor

- Level and rank configuration
- Enhancements from `+0` through `+10`
- Genetic Potential for Damage and Health
- Breed Attack and Breed Health values
- Evolution Multiplier with `0.01%` precision
- Standard and X mutation variants
- Weapon and armor selection
- Rarity-based equipment attribute slots
- Trait selection with rarity-specific visuals
- Combat-condition controls for contextual effects

### Calculation Engine

- Base Health and Damage calculations
- Piecewise level-growth formulas
- Rank, enhancement, Genetic Potential, breed, and evolution scaling
- Mutation and X-mutation modifiers
- Equipment and attribute multipliers
- Trait effects
- Account achievement multipliers
- Conditional passive effects
- Normal and critical skill-damage previews
- Multi-hit and chance-based skill calculations
- Healing, shielding, cooldown, resistance, and damage-reduction effects
- Boss, Rift, Spire, dungeon, and HP-threshold conditions

### Calculator Results

- Combined combat-stat summary
- Skill analysis for every monster skill
- Normal and critical result comparisons
- Passive-effect breakdown with active and inactive states
- Equipment, attribute, mutation, and trait summaries
- Advanced Health and Damage formula breakdowns
- Growth preview graph
- Copyable calculation values
- Consistent large-number formatting

### Account Multipliers

- Path of Progress tracking
- Index Mania tracking
- Sequential Pet Quest tracking
- Rift Challenger support
- Striver for Perfection support
- Automatic combined Health, Damage, Rift Damage, and Critical Chance bonuses

### Interface and Deployment

- Responsive three-panel desktop interface
- CAM Lab navy visual theme
- Rarity-specific Legendary, Mythical, Secret, and Void presentation
- Persistent build state in browser storage
- Work-in-progress pages for upcoming navigation destinations
- Static Next.js export deployed automatically through GitHub Actions
- GitHub Pages subpath-aware routing and public assets

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Interactive component-based interface and state updates |
| Next.js | Application structure, routing, static export, and deployment build |
| TypeScript | Type-safe data models and calculation logic |
| Tailwind CSS | Responsive styling and reusable visual patterns |
| CSV and JavaScript import scripts | Maintainable source data and generated TypeScript records |
| Browser local storage | Build and selected-monster persistence |
| GitHub Actions | Automated build and GitHub Pages deployment |
| Git and GitHub | Version control, project history, and hosting |

## How It Works

CAM Lab uses a centralized calculation pipeline:

```text
User Input
    │
    ▼
Typed Build State
    │
    ▼
Calculation Modules
    │
    ▼
Calculated Stats and Effects
    │
    ▼
React Presentation Components
```

1. The user selects a monster and modifies its build.
2. React updates the typed build state.
3. Independent calculation modules apply growth, rank, enhancement, mutation, equipment, trait, passive, achievement, and combat-context modifiers.
4. The engine returns calculated statistics and skill results.
5. React renders the results immediately and saves the build state locally.

Keeping the calculation engine separate from the presentation layer makes individual formulas easier to test, explain, and update without rewriting the interface.

## Architecture and Interview Talking Points

This project demonstrates more than a finished interface. It documents the process of converting uncertain game behavior into a maintainable software model.

### Separation of Concerns

- UI components collect input and display results.
- Shared TypeScript types define the data contracts between systems.
- Calculation modules contain game formulas independently from visual components.
- Generated data files keep large monster and skill datasets separate from hand-written logic.

### Data-Driven Design

Monsters, skills, equipment, attributes, traits, achievements, and passives are represented as structured data. Adding content usually requires a data entry rather than a new custom component or calculation path.

### Modifier Composition

The calculation pipeline distinguishes additive bonuses, multiplicative modifiers, conditional effects, and context-dependent rules. This is important because combining every percentage in the same way would produce incorrect results.

### State and Persistence

The editor uses one typed build state as its source of truth. Derived results are recalculated from that state, while browser storage restores the user’s monster and build after a refresh.

### Validation Through Testing

Many formulas were determined by controlled in-game comparisons. Baseline values were recorded, one variable was changed at a time, and competing formulas were checked against observed results before implementation.

### Static Deployment

CAM Lab is exported as static HTML, CSS, and JavaScript. A shared asset-path utility allows the same codebase to work at `localhost:3000` and under GitHub Pages’ `/catch-a-monster-labs` repository path.

## Project Structure

```text
.github/
└── workflows/        # Automated GitHub Pages deployment
app/
├── components/       # Browser, editor, result, navigation, and shared UI
├── data/             # Equipment, traits, passives, and generated game data
├── data-source/      # Maintainable CSV source files
├── lib/              # Asset helpers and calculation modules
├── scripts/          # Data-import and asset-validation scripts
├── types/            # Shared TypeScript interfaces
├── work-in-progress/ # Placeholder route for upcoming pages
├── layout.tsx
└── page.tsx
public/               # Monster artwork and interface icons
```

## Local Development

Clone the repository:

```bash
git clone https://github.com/jjeastside/catch-a-monster-labs.git
cd catch-a-monster-labs
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Create a production build:

```bash
npm run build
```

## Progress and Roadmap

### Completed

- [x] Monster browser, search, and filters
- [x] Responsive calculator layout
- [x] Growth, rank, enhancement, GP, breed, and evolution formulas
- [x] Mutation and X-mutation calculations
- [x] Equipment and attribute system
- [x] Achievement-based account multipliers
- [x] Conditional passive multipliers
- [x] Trait system
- [x] Skill, critical-hit, healing, shielding, and cooldown analysis
- [x] Advanced formula breakdowns and growth visualization
- [x] Browser-based build and monster persistence
- [x] GitHub Pages static deployment

### Planned

- [ ] Dedicated visual Monster Database
- [ ] Favorites management
- [ ] Named build slots and build sharing
- [ ] Total DPS and rotation comparisons
- [ ] Equipment optimization tools
- [ ] Reverse base-stat solver
- [ ] Account synchronization across devices
- [ ] Complete Guides, Compare, Changelog, Feedback, About, and Privacy pages
- [ ] Additional automated calculation tests

## Why I Built This

I built CAM Lab to create a genuinely useful community tool while strengthening my ability to design and explain a real application. The project combines UI design, data modeling, TypeScript architecture, reverse engineering, controlled testing, formula validation, and automated deployment.

Instead of treating the calculator as a collection of unrelated inputs, I designed it around a centralized build model and composable calculation pipeline. This makes the project easier to extend and gives me concrete engineering decisions to discuss in interviews, including state management, separation of concerns, data-driven design, validation strategy, static-hosting constraints, and tradeoffs between accuracy and maintainability.

## Fan-Site Notice

CAM Lab is an independent, fan-made companion site. It is not affiliated with, endorsed by, or sponsored by Roblox Corporation or LDS II. Game names, trademarks, characters, and related game assets remain the property of their respective owners.

## License and Usage

Copyright © 2026 Juan Jimenez. All rights reserved.

The source code and original CAM Lab materials in this repository are publicly available for viewing, educational review, and portfolio evaluation only. No permission is granted to copy, reproduce, redistribute, publish, sell, sublicense, or create derivative projects from this repository without prior written authorization from the copyright owner.

Third-party trademarks, game artwork, names, and other referenced assets are excluded from this copyright claim and remain subject to the rights of their respective owners.
