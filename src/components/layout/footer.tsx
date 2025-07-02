'use client'

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">
              © 2024 Modulus by mahtabmehek. All rights reserved.
            </span>
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a 
              href="#" 
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="#" 
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Terms of Service
            </a>
            <a 
              href="#" 
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
