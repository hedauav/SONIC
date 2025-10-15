import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/">
              <div className="flex items-center mb-4">
                <Image
                  src="/assets/logos/sonicip-logo.svg"
                  width={28}
                  height={28}
                  alt="SonicIPChain Logo"
                />
                <span className="ml-2 text-lg font-semibold">SonicIPChain</span>
              </div>
            </Link>
            <p className="text-gray-600 text-sm mb-4">
              Securely tokenize voice and audio assets using blockchain technology.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-gray-600 hover:text-blue-600 text-sm">Features</Link></li>
              <li><Link href="/pricing" className="text-gray-600 hover:text-blue-600 text-sm">Pricing</Link></li>
              <li><Link href="/marketplace" className="text-gray-600 hover:text-blue-600 text-sm">Marketplace</Link></li>
              <li><Link href="/security" className="text-gray-600 hover:text-blue-600 text-sm">Security</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/docs" className="text-gray-600 hover:text-blue-600 text-sm">Documentation</Link></li>
              <li><Link href="/api" className="text-gray-600 hover:text-blue-600 text-sm">API</Link></li>
              <li><Link href="/guides" className="text-gray-600 hover:text-blue-600 text-sm">Guides</Link></li>
              <li><Link href="/help" className="text-gray-600 hover:text-blue-600 text-sm">Help Center</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-600 hover:text-blue-600 text-sm">About</Link></li>
              <li><Link href="/blog" className="text-gray-600 hover:text-blue-600 text-sm">Blog</Link></li>
              <li><Link href="/careers" className="text-gray-600 hover:text-blue-600 text-sm">Careers</Link></li>
              <li><Link href="/contact" className="text-gray-600 hover:text-blue-600 text-sm">Contact</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            © 2025 SonicIPChain. All rights reserved.
          </p>
          
          <div className="flex space-x-6">
            <Link href="/terms" className="text-gray-500 hover:text-blue-600 text-sm">Terms</Link>
            <Link href="/privacy" className="text-gray-500 hover:text-blue-600 text-sm">Privacy</Link>
            <Link href="/cookies" className="text-gray-500 hover:text-blue-600 text-sm">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
