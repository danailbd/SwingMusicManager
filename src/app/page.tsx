import Link from 'next/link';
import { MusicalNoteIcon, TagIcon, QueueListIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { SPOTIFY_AUTH_URL } from '@/lib/spotify';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center text-white mb-16">
          <div className="flex justify-center items-center mb-6">
            <MusicalNoteIcon className="w-16 h-16 text-green-400 mr-4" />
            <h1 className="text-5xl md:text-7xl font-bold">Song Tagger</h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Organize your Spotify music with custom tags, create smart playlists, and discover your music in new ways
          </p>
          
          <a
            href={SPOTIFY_AUTH_URL}
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors duration-300 shadow-lg hover:shadow-xl"
          >
            <MusicalNoteIcon className="w-6 h-6 mr-2" />
            Connect with Spotify
          </a>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center text-white">
            <TagIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Custom Tags</h3>
            <p className="text-gray-300">Create and assign custom tags to organize your music by mood, genre, or any category you want</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center text-white">
            <QueueListIcon className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Smart Playlists</h3>
            <p className="text-gray-300">Create playlists based on your tags and push them directly to your Spotify account</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center text-white">
            <MusicalNoteIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Search & Filter</h3>
            <p className="text-gray-300">Find songs quickly using tag-based search and advanced filtering options</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center text-white">
            <DevicePhoneMobileIcon className="w-12 h-12 text-pink-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Mobile Ready</h3>
            <p className="text-gray-300">Fully responsive design that works perfectly on desktop, tablet, and mobile devices</p>
          </div>
        </div>

        {/* How it Works */}
        <div className="text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">1</div>
              <h3 className="text-xl font-semibold">Connect</h3>
              <p className="text-gray-300">Link your Spotify account to access your music library</p>
            </div>
            
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">2</div>
              <h3 className="text-xl font-semibold">Tag</h3>
              <p className="text-gray-300">Create custom tags and assign them to your favorite songs</p>
            </div>
            
            <div className="space-y-4">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">3</div>
              <h3 className="text-xl font-semibold">Organize</h3>
              <p className="text-gray-300">Create playlists based on tags and sync them back to Spotify</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
