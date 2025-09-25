# ChromaClash

> A retro-themed strategy board game where players win by capturing the entire board through explosive, color-converting chain reactions against a challenging AI.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/semeerwork/generated-app-20250925-035825)

ChromaClash is a visually striking, retro-themed turn-based strategy game. Played on a 6x6 grid, two players—one human, one advanced AI—battle for territorial dominance. The core mechanic revolves around placing and growing colored circles. When a circle's energy level reaches four, it explodes, capturing adjacent cells and triggering potential chain reactions. The objective is to convert the entire board to your color.

The game features a challenging AI, smooth, neon-infused animations, and a minimalist UI that evokes a 90s arcade aesthetic, all running on a high-performance, serverless architecture powered by Cloudflare.

## Table of Contents

- [Key Features](#key-features)
- [Game Rules](#game-rules)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Development](#development)
- [Deployment](#deployment)
- [AI Strategy](#ai-strategy)
- [Future Extensions](#future-extensions)
- [License](#license)

## Key Features

- **Interactive Playable Board**: An intuitive 6x6 grid with responsive interactions and clear visual feedback.
- **Challenging AI Opponent**: A highly adaptive AI designed to be unpredictable and strategic, operating at its hardest difficulty.
- **Stunning Visuals & Animations**: A retro-neon aesthetic with smooth, polished animations for explosions, chain reactions, and dot transfers.
- **Dynamic Piece Scaling**: Player circles visually scale based on their energy level, providing an at-a-glance strategic overview.
- **Simple Game Controls**: A minimalist UI with essential controls like 'Reset Game' to quickly start a new match.
- **Responsive Perfection**: Flawless gameplay experience across all device sizes, with a mobile-first design approach.

## Game Rules

1.  **Board Setup**: The game is played on a 6x6 grid. Each square can be empty or occupied by a player's colored circle. Circles display 0-4 dots, representing their energy level.
2.  **First Move**: Each player's first move is to place a new circle with 3 dots on any empty square.
3.  **Subsequent Moves**: After the first move, players select one of their own circles to add +1 dot of energy.
4.  **Explosions & Chain Reactions**: When a circle reaches 4 dots, it explodes. The circle is removed, and 1 dot is sent to each of the 4 cardinal neighbors (up, down, left, right). If a neighbor belongs to an opponent, it is captured and converted to the player's color. These captures can trigger further explosions, creating cascading chain reactions.
5.  **Win Condition**: A player wins when they successfully convert the entire board to their color.

## Technology Stack

- **Frontend**: React, Vite, TypeScript
- **Styling**: Tailwind CSS, Framer Motion for animations
- **State Management**: Zustand
- **Icons**: Lucide React
- **Deployment**: Cloudflare Pages & Workers

## Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing purposes.

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.
- A code editor like VS Code.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/chromaclash.git
    cd chromaclash
    ```

2.  **Install dependencies:**
    ```sh
    bun install
    ```

3.  **Run the development server:**
    ```sh
    bun run dev
    ```
    The application will be available at `http://localhost:3000` (or the next available port).

## Development

The core application logic is contained within `src/pages/HomePage.tsx`. This file includes the game state management (Zustand store), game logic, AI algorithm, and all React components for rendering the UI.

- **Game Logic**: Managed within the Zustand store actions.
- **AI Logic**: Encapsulated in a dedicated function that receives the current game state and returns the best move.
- **UI Components**: The `GameBoard`, `Cell`, and `PlayerInfo` components render the game state.
- **Styling**: Custom retro-neon styles and animations are defined in `src/styles/chromaclash.css` and configured in `tailwind.config.js`.

## Deployment

This project is optimized for deployment on the Cloudflare network.

1.  **Log in to Wrangler:**
    ```sh
    wrangler login
    ```

2.  **Deploy the application:**
    ```sh
    bun run deploy
    ```
    This command will build the application and deploy it to your Cloudflare account. Wrangler will provide you with the final URL.

Alternatively, you can deploy directly from your GitHub repository with a single click.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/semeerwork/generated-app-20250925-035825)

## AI Strategy

The AI is designed to be a formidable opponent by prioritizing:

1.  **Center Control**: Favoring central cells for maximum influence.
2.  **Fork Creation**: Generating multiple simultaneous threats.
3.  **Chain Reactions**: Identifying and executing moves that trigger cascading captures.
4.  **Opponent Disruption**: Thwarting the opponent's strategic opportunities.
5.  **Adaptive Flexibility**: Adjusting its strategy based on whether it is in a dominant or defensive position.

## Future Extensions

- **Multiplayer Mode**: Add support for human vs. human gameplay.
- **AI Difficulty Levels**: Introduce easier modes for new players.
- **Custom Board Sizes**: Allow players to choose different grid dimensions.
- **Game Settings**: Add options to control animation speed and themes.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.