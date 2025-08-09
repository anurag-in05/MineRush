# MineRush

MineRush is a web-based game inspired by classic minesweeper and betting mechanics. Players can log in, place bets, select the number of mines, and reveal tiles for a chance to win. The project is built with a React + TypeScript frontend and an Express + MongoDB backend.

## Features

- User authentication (register, login, logout)
- Persistent user stats: balance, wins, daily quests, streaks
- Interactive game board with mines and gems
- Betting panel to set bet amount and mine count
- Daily quests and streak rewards
- Responsive UI with Tailwind CSS

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Other:** Lucide React icons, ESLint

## Getting Started

### Prerequisites

- Node.js & npm
- MongoDB (Atlas)

### Backend Setup

1. Navigate to the backend folder:
	```sh
	cd backend
	```
2. Install dependencies:
	```sh
	npm install
	```
3. Create a `.env` file with your MongoDB URI:
	```
	MONGODB_URI=your_mongodb_connection_string
	```
4. Start the server:
	```sh
	node server.js
	```
	The backend runs on `http://localhost:3000`.

### Frontend Setup

1. Navigate to the frontend folder:
	```sh
	cd frontend
	```
2. Install dependencies:
	```sh
	npm install
	```
3. Start the development server:
	```sh
	npm run dev
	```
	The frontend runs on `http://localhost:5173` (default Vite port).

## Usage

- Open the frontend in your browser.
- Register a new account or log in.
- Set your bet amount and number of mines.
- Reveal tiles to win or lose your bet.
- Complete daily quests and maintain streaks for bonuses.

## Environment Variables

- **Backend:**  
  - `MONGODB_URI` – MongoDB connection string

## Folder Structure

```
MineRush/
  backend/
	 server.js
	 package.json
	 .env
  frontend/
	 src/
		components/
		context/
		types/
		App.tsx
		main.tsx
	 package.json
	 index.html
	 tailwind.config.js
```

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

MIT