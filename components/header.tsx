"use client"
import Image from "next/image";
import Link from 'next/link';
import { WalletConnect } from "./walletConnect";

const Header = () => {
  return (
    <div className="w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <div className="flex items-center">
              <Image
                src="/assets/logos/sonicip-logo.svg"
                width={32}
                height={32}
                alt="SonicIPChain Logo"
              />
              <span className="ml-2 text-xl font-bold">SonicIPChain</span>
              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Beta</span>
            </div>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/" className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
            Home
          </Link>
          <Link href="/about" className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
            About
          </Link>
          <Link href="/contact" className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
            Contact
          </Link>
          <Link href="/profile" className="font-medium text-gray-800 hover:text-blue-600 transition-colors">
            Profile
          </Link>
        </div>
        
        <div className="flex items-center space-x-3">
          <WalletConnect />
          <Link href="/store" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Header;

