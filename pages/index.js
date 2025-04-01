import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate schema');
      }

      setResult(data.schema);
      setCurrentThreadId(data.threadId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (e) => {
    e.preventDefault();
    if (!currentThreadId) {
      setError('No active generation to modify. Please generate a schema first.');
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          threadId: currentThreadId,
          editPrompt 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to regenerate schema');
      }

      setResult(data.schema);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Roam JSON Schema Generator</title>
        <meta name="description" content="Generate game logic JSON structure from user game description prompts" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Game Logic JSON Generator</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Inputs */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your game logic prompt:
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows="4"
                    required
                    placeholder="Example: The player must collect 10 golden eggs, after they do defeat 5 enemies under 10 minutes, then collect 20 more golden eggs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate'}
                </button>
              </form>

              {result && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edit prompt for regeneration:
                  </label>
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows="2"
                    placeholder="Describe the changes you want to make to the generated JSON..."
                  />
                  <button
                    onClick={handleRegenerate}
                    disabled={loading || !editPrompt}
                    className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {loading ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">Error: {error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Generated Schema</h2>
            {result ? (
              <div className="relative">
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[600px] text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                    alert('Copied to clipboard!');
                  }}
                  className="absolute top-2 right-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
                >
                  Copy
                </button>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Generated JSON will appear here...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 