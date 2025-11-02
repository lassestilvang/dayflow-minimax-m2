export default function HomePage() {
  // Return a welcome message for testing purposes
  return (
    <div data-testid="welcome-message" className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to DayFlow</h1>
        <p className="text-muted-foreground mb-8">Your daily task & calendar planner</p>
        <a
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}