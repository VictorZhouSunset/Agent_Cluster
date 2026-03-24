export function Docs() {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-gray-900 mb-2">
            Documentation
          </h1>
          <p className="text-gray-500 text-lg">
            Learn how to build with openmoose
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Documentation
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Comprehensive guides, API references, and tutorials to help you get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}