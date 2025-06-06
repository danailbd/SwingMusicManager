// Test page to check environment variables
console.log('Environment check:');
console.log('SPOTIFY_CLIENT_ID:', process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID);
console.log('FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

export default function EnvTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      <div className="space-y-2">
        <p><strong>Spotify Client ID:</strong> {process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}</p>
        <p><strong>Firebase Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</p>
        <p><strong>Redirect URI:</strong> {process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI}</p>
      </div>
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Next Steps:</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Get your Spotify Client ID from <a href="https://developer.spotify.com/dashboard" className="text-blue-500 underline">Spotify Developer Dashboard</a></li>
          <li>Create a Firebase project at <a href="https://console.firebase.google.com/" className="text-blue-500 underline">Firebase Console</a></li>
          <li>Update the .env.local file with your real keys</li>
          <li>Restart the dev server</li>
        </ol>
      </div>
    </div>
  );
}
