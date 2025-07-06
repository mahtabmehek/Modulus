'use client'

import { useApp } from '@/lib/hooks/use-app'
import { ArrowLeft, Users, Mail } from 'lucide-react'

export function InviteUserView() {
  const { navigate } = useApp()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('dashboard')}
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-semibold text-foreground">User Invitations</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-muted rounded-full mx-auto mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Invite System Temporarily Disabled
          </h2>
          
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            The user invitation system is currently under maintenance. Please check back later or contact an administrator for manual user creation.
          </p>
          
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Contact Admin for Invites
            </div>
          </div>
          
          <div className="mt-8">
            <button
              onClick={() => navigate('dashboard')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}