export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold text-gray-900">BuildBot</h1>
      <p className="text-lg text-gray-500 max-w-md">
        Generate full-stack applications from a single natural language prompt.
      </p>
      <a
        href="/api/ai/create"
        className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        Get Started via API
      </a>
    </main>
  );
}
