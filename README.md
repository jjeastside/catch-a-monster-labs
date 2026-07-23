# Catch a Monster Labs

A modern build planner and stat calculator for **Catch a Monster**, built with **React**, **Next.js**, **TypeScript**, and **Tailwind CSS**.

The goal of this project is to provide players with an accurate calculator for monster stats, skill damage, growth scaling, mutations, enhancements, and other gameplay mechanics while offering a clean, responsive interface inspired by tools like Path of Building and PCPartPicker.

---

## Features

- Monster browser with search and filtering
- Live stat calculator
- Health, Damage, and Skill Damage calculations
- Growth formula implementation
- Rank and enhancement scaling
- Mutation support
- Skill multiplier calculations
- Critical damage preview
- Responsive three-panel interface
- Modular React component architecture

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React | Component-based UI |
| Next.js | Application framework |
| TypeScript | Type safety and calculation logic |
| Tailwind CSS | Styling |
| Git & GitHub | Version control |

---

## How It Works

The application follows a centralized calculation pipeline.

```text
User Input
    │
    ▼
Build State (React)
    │
    ▼
Calculation Engine (TypeScript)
    │
    ▼
Calculated Stats
    │
    ▼
React Components
```

1. The user edits a monster build.
2. React updates the current build state.
3. TypeScript calculation functions apply growth formulas, rank multipliers, enhancements, mutations, and skill multipliers.
4. The resulting stats are passed to presentation components.
5. React automatically re-renders the updated values.

This separation keeps the calculation logic independent from the UI and makes the project easier to maintain and extend.

---

## Project Structure

```
app/
├── components/
├── data/
├── lib/
├── types/
├── page.tsx
└── layout.tsx
```

- **components/** – Reusable UI components
- **data/** – Monster and skill definitions
- **lib/** – Calculation helpers and utility functions
- **types/** – Shared TypeScript interfaces and types

---

## Getting Started

Clone the repository.

```bash
git clone https://github.com/jjeastside/catch-a-monster-labs.git
```

Install dependencies.

```bash
npm install
```

Start the development server.

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## Roadmap

- [x] Growth formula implementation
- [x] Skill multiplier calculations
- [x] Critical damage support
- [x] Monster browser
- [x] Responsive calculator layout
- [ ] Save and load builds
- [ ] Equipment optimization
- [ ] DPS comparison tools
- [ ] Account synchronization
- [ ] Formula breakdown visualizations

---

## Why I Built This

I wanted to create a tool that accurately models the game's stat formulas while practicing modern frontend development. The project emphasizes clean architecture, reusable React components, and a centralized calculation engine to keep the UI and business logic separated.

---

## License

This project is intended for educational and portfolio purposes.
