# Yu-Gi-Oh! Deck Builder

A modern Yu-Gi-Oh! card database and deck builder application built with SvelteKit, shadcn-svelte, and MySQL.

## Features

- 🎴 **Card Database**: Browse and search through thousands of Yu-Gi-Oh! cards
- 🔍 **Advanced Filters**: Filter by type, attribute, archetype, and race
- 🎯 **Deck Builder**: Create and manage custom decks with drag-and-drop simplicity
- 💾 **Save Decks**: Store your decks in the database for later editing
- 💰 **Card Prices**: View current market prices from multiple vendors
- 🎨 **Blue & Yellow Theme**: Beautiful, modern UI with customizable theme

## Tech Stack

- **Frontend**: SvelteKit + TypeScript
- **UI Components**: shadcn-svelte + TailwindCSS
- **Backend**: SvelteKit API routes
- **Database**: MySQL 8.0
- **ORM**: Prisma
- **API**: YGOProDeck API (https://db.ygoprodeck.com/)

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm

### Installation

1. **Clone the repository**
   ```bash
   cd yugioh-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start MySQL with Docker**
   ```bash
   npm run docker:up
   ```

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Sync cards from YGOProDeck API**
   ```bash
   npm run sync:cards
   ```
   This will fetch all cards from the YGOProDeck API and populate the database. This may take a few minutes.

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to http://localhost:5173

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run docker:up` | Start MySQL container |
| `npm run docker:down` | Stop MySQL container |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run sync:cards` | Sync cards from API |

## Project Structure

```
yugioh-app/
├── src/
│   ├── lib/
│   │   ├── api/              # API integration (YGOProDeck)
│   │   ├── components/       # UI components
│   │   │   ├── ui/          # shadcn components
│   │   │   ├── layout/      # Navbar, SearchBar
│   │   │   └── cards/       # Card display components
│   │   ├── server/          # Server-side code (database)
│   │   └── utils.ts         # Utility functions
│   ├── routes/
│   │   ├── +page.svelte     # Home page
│   │   ├── cards/           # Card database pages
│   │   ├── decks/           # Deck builder pages
│   │   └── api/             # API endpoints
│   └── app.css              # Global styles
├── prisma/
│   └── schema.prisma        # Database schema
├── docker-compose.yml       # MySQL Docker configuration
└── scripts/
    └── sync-cards.ts        # Card sync script
```

## Database Schema

### Card
- Stores all Yu-Gi-Oh! card information
- Includes name, type, attribute, ATK/DEF, level, etc.
- Related to CardImage and CardPrice

### CardImage
- Stores card image URLs
- Supports multiple image types (small, large)

### CardPrice
- Stores market prices from various vendors
- Cardmarket, TCGPlayer, eBay, Amazon, CoolStuffInc

### Deck
- User-created decks
- JSON storage for main, extra, and side deck contents

## API Integration

The application uses the YGOProDeck API (https://db.ygoprodeck.com/) to:
- Fetch all card data
- Sync cards to local database
- Get card images and prices

## Theme

The application uses a blue and yellow color scheme:
- **Primary**: Blue (#3b82f6)
- **Accent**: Yellow (#eab308)

Colors are configurable via CSS custom properties in `src/app.css`.

## License

This project is for educational purposes. Yu-Gi-Oh! is a trademark of Konami.

## Credits

- Card data provided by [YGOProDeck](https://ygoprodeck.com/)
- Built with [SvelteKit](https://kit.svelte.dev/)
- UI components from [shadcn-svelte](https://www.shadcn-svelte.com/)
