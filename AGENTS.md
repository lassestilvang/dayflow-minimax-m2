# DayFlow Agent Guidelines

## Build/Lint/Test Commands

### Development

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run type-check` - Run TypeScript type checking

### Testing

- `bun run test` - Run all tests
- `bun run test:unit` - Run unit tests once
- `bun run test:integration` - Run integration tests once
- `bun run test:e2e` - Run end-to-end tests
- `bun run test:coverage` - Run tests with coverage
- `bun run test:watch` - Watch mode for all tests
- `bun run test:run` - Run all tests once

### Single Test

- `bun test path/to/test.test.ts` - Run specific test file
- `bun test --run path/to/test.test.ts` - Alternative syntax

### Database

- `bun run db:generate` - Generate migrations
- `bun run db:migrate` - Apply migrations
- `bun run db:push` - Push schema changes
- `bun run db:studio` - Open Drizzle Studio

## Code Style Guidelines

### Imports

- Use absolute imports with `@/` prefix for internal modules
- Group imports: external libraries first, then internal modules
- Use `import type` for type-only imports

### TypeScript

- Strict mode enabled - all types must be defined
- Use interfaces for object shapes, types for unions/primitives
- Prefer `const` assertions for readonly data
- Use Zod for runtime validation schemas

### Naming Conventions

- Components: PascalCase (e.g., `TaskList`, `CalendarEvent`)
- Functions/variables: camelCase (e.g., `getUserTasks`, `isLoading`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- Files: kebab-case for components (e.g., `task-list.tsx`), camelCase for utilities

### Error Handling

- Use try/catch blocks for async operations
- Return boolean success indicators for store actions
- Set error state in stores for UI feedback
- Log errors with context for debugging

### React Patterns

- Use functional components with hooks
- Implement proper TypeScript props interfaces
- Use `React.forwardRef` for components needing ref forwarding
- Apply `cn()` utility for conditional Tailwind classes

### Database/State

- Use Drizzle ORM with PostgreSQL
- Implement optimistic updates in Zustand stores
- Use repository pattern for data access
- Maintain sync status for real-time features

### Testing

- Write unit tests for utilities and store logic
- Use Bun Test for unit/integration, Playwright for E2E
- Mock external dependencies in tests
- Aim for >80% test coverage
