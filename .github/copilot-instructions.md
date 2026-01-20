# GitHub Copilot Instructions

## Project Overview
Dit is een Taskmanager applicatie gebouwd met Node.js, Express en SQLite. De frontend is vanilla JavaScript met HTML/CSS.

## Tech Stack
- **Backend:** Node.js met Express.js
- **Database:** SQLite3
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Testing:** Playwright (E2E tests), Jest (API tests)

## Project Structure
```
├── backend/
│   ├── server.js      # Express API server
│   ├── database.js    # SQLite database configuratie
│   └── tests/         # Jest API tests
├── public/
│   ├── index.html     # Frontend HTML
│   ├── app.js         # Frontend JavaScript
│   └── styles.css     # Styling
├── tests/
│   └── taskmanager.spec.js  # Playwright E2E tests
└── server.js          # Main entry point
```

## Coding Guidelines

### JavaScript
- Gebruik moderne ES6+ syntax (const, let, arrow functions, async/await)
- Schrijf duidelijke, beschrijvende variabele- en functienamen
- Voeg comments toe voor complexe logica
- Gebruik Nederlandse comments waar passend

### API Design
- RESTful endpoints
- Gebruik correcte HTTP methods (GET, POST, PUT, DELETE)
- Return JSON responses met consistente structuur
- Gebruik correcte HTTP status codes

### Testing
- Schrijf tests voor alle nieuwe functionaliteit
- API tests met Jest en Supertest
- E2E tests met Playwright
- Tests moeten slagen voordat code gecommit wordt (pre-commit hook)

### Database
- Gebruik prepared statements om SQL injection te voorkomen
- Houd database schema simpel en genormaliseerd

## Commands
- `npm start` - Start de server
- `npm test` - Run Playwright E2E tests
- `npm run test:api` - Run Jest API tests
- `npm run test:all` - Run alle tests

## Important Notes
- Server draait op port 3000
- Database wordt automatisch aangemaakt bij eerste start
- Pre-commit hook voert alle tests uit voordat commit wordt toegestaan
