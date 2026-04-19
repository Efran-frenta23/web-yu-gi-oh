# Quick Start Guide - Yu-Gi-Oh! Deck Builder

## 🚀 Getting Started in 5 Steps

### 1. Start MySQL Database
```bash
cd yugioh-app
npm run docker:up
```

This will start a MySQL container on port 3306 with the following credentials:
- **Database**: yugioh_db
- **User**: yugioh_user  
- **Password**: yugioh_pass
- **Root Password**: rootpassword

### 2. Initialize Database
```bash
npm run db:push
```

This creates the database tables based on the Prisma schema.

### 3. Sync Cards from API
```bash
npm run sync:cards
```

This fetches all Yu-Gi-Oh! cards from the YGOProDeck API and populates your database. 
⏱️ **This may take 5-10 minutes** depending on your internet connection.

### 4. Start Development Server
```bash
npm run dev
```

### 5. Open in Browser
Navigate to: **http://localhost:5173**

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (http://localhost:5173) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run docker:up` | Start MySQL database |
| `npm run docker:down` | Stop MySQL database |
| `npm run db:push` | Sync database schema |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio (database GUI at http://localhost:5555) |
| `npm run sync:cards` | Sync all cards from YGOProDeck API |

---

## 🎨 Features

✅ **Card Database** - Browse 12,000+ Yu-Gi-Oh! cards  
✅ **Advanced Search** - Search by name, type, attribute, archetype, race  
✅ **Card Details** - View full card info, prices, and related cards  
✅ **Deck Builder** - Create and manage custom decks  
✅ **Blue & Yellow Theme** - Beautiful modern UI  
✅ **Responsive Design** - Works on desktop and mobile  

---

## 🗂️ Project Structure

```
yugioh-app/
├── src/
│   ├── routes/
│   │   ├── +page.svelte           # Home page
│   │   ├── cards/                 # Card database pages
│   │   ├── decks/                 # Deck builder pages
│   │   └── api/                   # API endpoints
│   └── lib/
│       ├── components/            # UI components
│       └── server/                # Database connection
├── prisma/
│   └── schema.prisma              # Database schema
└── docker-compose.yml             # MySQL configuration
```

---

## 🔧 Troubleshooting

### Database Connection Error
Make sure Docker is running and execute:
```bash
npm run docker:up
```

### Cards Not Showing
Sync the cards from the API:
```bash
npm run sync:cards
```

### Port Already in Use
If port 3306 is already in use, modify `docker-compose.yml` and change:
```yaml
ports:
  - "3307:3306"  # Use 3307 instead
```

Then update `.env` file:
```
DATABASE_URL="mysql://yugioh_user:yugioh_pass@localhost:3307/yugioh_db"
```

---

## 🎮 How to Use

### Browse Cards
1. Click "Cards" in the navigation
2. Use the search bar to find cards
3. Apply filters (type, attribute, archetype, race)
4. Click on any card to view details

### Create a Deck
1. Click "Decks" → "Create New Deck"
2. Enter a deck name
3. Search for cards in the search bar
4. Add cards to Main, Extra, or Side deck
5. Click "Save Deck" when done

### View Card Details
1. Click any card from the database
2. View full card information
3. See current market prices
4. Browse related cards from the same archetype

---

Enjoy building your ultimate Yu-Gi-Oh! deck! 🎴✨
