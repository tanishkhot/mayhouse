'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import CreateEventForm from '@/components/CreateEventForm';
import AllEventsListing from '@/components/AllEventsListing';
import HostDashboard from '@/components/HostDashboard';
import UserBookings from '@/components/UserBookings';

export default function TestContractPage() {
  const { isConnected, address } = useAccount();
  const [activeTab, setActiveTab] = useState<'create' | 'book' | 'host' | 'user'>('create');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Smart Contract Testing
          </h1>
          <p className="text-gray-600">
            Test all contract functions on Sepolia Testnet
          </p>
          {isConnected && (
            <p className="text-sm text-gray-500 mt-2">
              Connected: {address?.substring(0, 6)}...{address?.substring(38)}
            </p>
          )}
        </div>

        {/* Connection Warning */}
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 text-center">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              ⚠️ Wallet Not Connected
            </h3>
            <p className="text-yellow-700 mb-4">
              Please connect your wallet to interact with the smart contract
            </p>
            <p className="text-sm text-yellow-600">
              Make sure you&apos;re on <strong>Sepolia Testnet</strong> and have test ETH
            </p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6 p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🎨 Create Event
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'book'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🎫 Book Event
          </button>
          <button
            onClick={() => setActiveTab('host')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'host'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            👨‍💼 Host Dashboard
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              activeTab === 'user'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📋 My Bookings
          </button>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'create' && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">👨‍💼 Host: Create Event</h3>
                <p className="text-sm text-blue-700">
                  As a host, create an event and stake 20% of the total event value. 
                  You&apos;ll get your stake back after completing the event.
                </p>
              </div>
              <CreateEventForm experienceId="test-experience-1" />
            </div>
          )}

          {activeTab === 'book' && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">🎫 User: Book Event</h3>
                <p className="text-sm text-blue-700">
                  Browse all available events and book by paying the ticket price + 20% stake. 
                  You&apos;ll get your stake back after attending.
                </p>
              </div>
              
              <AllEventsListing />
            </div>
          )}

          {activeTab === 'host' && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">👨‍💼 Host Dashboard</h3>
                <p className="text-sm text-blue-700">
                  View all events you&apos;ve created. Complete events to get paid and return 
                  stakes to attendees.
                </p>
              </div>
              <HostDashboard />
            </div>
          )}

          {activeTab === 'user' && (
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Your Bookings</h3>
                <p className="text-sm text-blue-700">
                  View all events you&apos;ve booked. Track your stakes and attendance status.
                </p>
              </div>
              <UserBookings />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4">📚 How It Works</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-1">1️⃣ Host Creates Event</h4>
              <p className="text-purple-200 text-sm">
                Host stakes 20% of total event value (e.g., 0.2 ETH for a 1 ETH event)
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">2️⃣ User Books Event</h4>
              <p className="text-purple-200 text-sm">
                User pays ticket price + 20% stake (e.g., 0.24 ETH for 0.2 ETH ticket)
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">3️⃣ Event Happens</h4>
              <p className="text-purple-200 text-sm">
                Users attend the experience in real life
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">4️⃣ Host Completes Event</h4>
              <p className="text-purple-200 text-sm">
                Host marks attendees. Attendees get stakes back, no-shows forfeit stakes. 
                Host receives payment + stake back.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-purple-700">
            <h4 className="font-semibold mb-2">🔗 Resources</h4>
            <ul className="text-sm text-purple-200 space-y-1">
              <li>
                <a 
                  href="https://sepolia.etherscan.io/address/0x09aB660CEac220678b42E0e23DebCb1475e1eAD5" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white underline"
                >
                  View Contract on Etherscan →
                </a>
              </li>
              <li>
                <a 
                  href="https://sepoliafaucet.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white underline"
                >
                  Get Test ETH (Faucet) →
                </a>
              </li>
              <li>
                <a 
                  href="/CONTRACT_INTEGRATION.md" 
                  className="hover:text-white underline"
                >
                  Read Integration Guide →
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

