# Bank Statement Web UI

A React TypeScript application for uploading and processing PDF bank statements.

## Project Structure

```
src/
├── components/     # React components
├── services/       # API clients and external services
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── App.tsx         # Main application component
├── main.tsx        # Application entry point
└── test-setup.ts   # Jest test configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## Technology Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Jest** with React Testing Library for testing
- **fast-check** for property-based testing
- **CSS Modules** for styling (configured)

## Path Aliases

The project is configured with TypeScript path aliases:

- `@/` → `src/`
- `@/components/` → `src/components/`
- `@/services/` → `src/services/`
- `@/hooks/` → `src/hooks/`
- `@/types/` → `src/types/`
- `@/utils/` → `src/utils/`

## Testing

The project includes both unit testing and property-based testing:

- **Unit Tests**: Using Jest and React Testing Library
- **Property-Based Tests**: Using fast-check for testing universal properties
- **Test Setup**: Includes mocks for File API, ResizeObserver, and matchMedia

## Development

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Run tests: `npm test`
4. Build for production: `npm run build`

## Integration

This frontend is designed to integrate with the DocSift API backend at `/v1/extract/bank-statement` endpoint.
