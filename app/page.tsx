"use client";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import Header from "@/components/header";
import { FeatureTag } from "@/components/FeatureTag";
import { StatCard } from "@/components/StatCard";
import { Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        {/* Protocol Banner */}
        <div className="flex justify-center items-center mb-8 mt-16">
          <div className="bg-gray-50 py-2 px-4 rounded-full inline-flex items-center">
            <Zap size={16} className="text-amber-500 mr-2" />
            <span className="text-sm text-gray-600">Powered by Flow, Self Protocol & IPFS</span>
          </div>
        </div>
      
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Tokenize Your <span className="text-blue-600">Voice Assets</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            Securely store, tokenize, and monetize your audio with blockchain technology.
          </p>
          
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Privacy-first identity verification and encrypted decentralized storage.
          </p>
        </div>
        
        {/* Feature Tags */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <FeatureTag text="Self Protocol Verified" type="protocol" />
          <FeatureTag text="IPFS Encrypted Storage" type="ipfs" />
          <FeatureTag text="Flow Blockchain" type="blockchain" />
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-24">
          <Link href="/store">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium flex items-center justify-center">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="mr-2"
              >
                <path d="M5 12L19 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 5L19 12L12 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Start Tokenizing
            </button>
          </Link>
          
          <Link href="/marketplace">
            <button className="border border-gray-300 hover:border-gray-400 text-gray-800 px-8 py-3 rounded-md font-medium">
              Explore Marketplace
            </button>
          </Link>
        </div>
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <StatCard value="1,247" label="Tokens Minted" />
          <StatCard value="342" label="Active Creators" />
          <StatCard value="15.8 ETH" label="Total Volume" />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
