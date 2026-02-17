# Meeting Assistant Backend

## Overview
The Meeting Assistant Backend is an automated system designed to assist with online meetings. It integrates with various meeting platforms to join meetings, record audio, and transcribe recordings, providing users with a seamless experience.

## Features
- Join meetings automatically
- Record audio during meetings
- Transcribe recorded audio into text
- Manage worker processes for handling tasks

## Project Structure
```
meeting-assistant-backend
├── src
│   ├── index.ts               # Entry point for the application
│   ├── workers                 # Contains worker-related logic
│   │   ├── index.ts           # Initializes worker processes
│   │   └── meetingWorker.ts    # Logic for meeting handling
│   ├── config                  # Configuration settings
│   │   └── index.ts           # Application configuration
│   ├── services                # Services used by workers
│   │   └── index.ts           # Service exports
│   ├── utils                   # Utility functions
│   │   └── logger.ts          # Logging utility
│   └── types                   # TypeScript types and interfaces
│       └── index.ts           # Type definitions
├── package.json                # npm dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node package manager)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd meeting-assistant-backend
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the Application
To start the backend application, run:
```
npm start
```

### Development
For development purposes, you can run:
```
npm run dev
```
This will start the application in watch mode, automatically rebuilding on changes.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.