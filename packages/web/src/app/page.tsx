export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to Calenote</h1>
        <p className="text-muted-foreground">
          Entry-first calendar and task management
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <a
            href="/calendar"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to Calendar
          </a>
          <a
            href="/entries"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            View Entries
          </a>
        </div>
      </div>
    </div>
  );
}
