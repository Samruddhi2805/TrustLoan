import React from 'react';
import { Shield } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 p-3 sm:p-4 px-3 sm:px-6 flex justify-between items-center bg-navy-bg/50 backdrop-blur-md border-b border-glass-border">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <Shield className="text-white w-6 h-6" />
        </div>
        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Loan Safety Advisory System
        </span>
      </div>
    </nav>
  );
}
