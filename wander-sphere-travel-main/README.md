# WanderSphere Travel App

A modern travel social platform built with React, TypeScript, and Tailwind CSS.

<!-- Last deployment trigger: 2025-01-25 -->

## Features

- Social feed with stories and posts
- Travel clubs and trip discovery
- Interactive travel map
- Budget planning and tracking
- Booking integration

## Security Notice

For security reasons, this project uses Command Prompt batch files instead of PowerShell scripts. PowerShell has more extensive permissions that could potentially be exploited, while Command Prompt provides a more restricted environment.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory

### Running the Development Server

To start the development server, double-click the `start-dev.bat` file or run it from Command Prompt:

```
start-dev.bat
```

This will install dependencies (if needed) and start the development server.

### Building for Production

To build the project for production, double-click the `build.bat` file or run it from Command Prompt:

```
build.bat
```

This will create an optimized production build in the `dist` directory.

## Project Structure

```
src/
├── assets/       # Images and static assets
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── lib/          # Utility functions
├── pages/        # Application pages
```

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- Shadcn UI
- React Router
- React Query
- Leaflet (for maps)

## License

MIT
