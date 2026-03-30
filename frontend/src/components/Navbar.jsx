import React from 'react';
import { Wallet, CheckCircle2, LogOut, Users } from 'lucide-react';

export default function Navbar({ account, connectWallet, disconnectWallet, activeUserCount }) {
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="fixed top-0 w-full z-50 p-4 px-6 flex justify-between items-center bg-navy-bg/50 backdrop-blur-md border-b border-glass-border">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-teal to-accent-violet flex items-center justify-center">
          <span className="text-white font-bold text-xl">◈</span>
        </div>
        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-teal to-accent-violet hidden sm:inline-block">
          TrustLoan Lite
        </span>
      </div>

      {/* Center: Active Users badge — always visible */}
      <div className="flex items-center gap-2 glass-card px-4 py-2 rounded-full border border-glass-border">
        <div className="relative flex items-center justify-center">
          <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-60"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
        </div>
        <Users className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-300 font-medium">
          <span className="font-bold text-accent-teal">{activeUserCount}</span>
          <span className="ml-1 hidden sm:inline text-gray-500">
            {activeUserCount === 1 ? 'active user' : 'active users'}
          </span>
        </span>
      </div>

      {/* Right: Wallet */}
      <div>
        {account ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 glass-card px-4 py-2 rounded-full cursor-default">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Connected"></div>
              <span className="font-mono text-sm text-gray-300">{formatAddress(account)}</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <button
              onClick={disconnectWallet}
              className="p-2.5 rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 border border-rose-500/20 shadow-lg"
              title="Disconnect Wallet"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-accent-teal text-accent-teal hover:bg-accent-teal hover:text-navy-bg transition-all duration-300 shadow-[0_0_15px_rgba(12,244,198,0.2)] hover:shadow-[0_0_25px_rgba(12,244,198,0.5)]"
          >
            <Wallet className="w-5 h-5" />
            <span className="font-semibold">Connect Wallet</span>
          </button>
        )}
      </div>
    </nav>
  );
}
