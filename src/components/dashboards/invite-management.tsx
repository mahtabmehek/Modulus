'use client'

import { useState } from 'react'
import { useApp } from '@/lib/hooks/use-app'
import { Plus, Copy, Mail, Users, Calendar, CheckCircle, X, ExternalLink } from 'lucide-react'

export default function InviteManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newInvite, setNewInvite] = useState({
    name: '',
    email: '',
    studentId: '',
    role: 'student' as 'student' | 'instructor' | 'admin',
    permissions: [] as string[],
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [copiedCode, setCopiedCode] = useState('')

  const { generateInviteCode, inviteCodes, user } = useApp()

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsCreating(true)

    try {
      if (!user) throw new Error('User not authenticated')
      
      const invite = await generateInviteCode({
        name: newInvite.name,
        email: newInvite.email,
        studentId: newInvite.studentId || undefined,
        role: newInvite.role,
        permissions: newInvite.permissions,
        createdBy: user.id,
        expiresAt: newInvite.expiresAt
      })

      // Reset form
      setNewInvite({
        name: '',
        email: '',
        studentId: '',
        role: 'student',
        permissions: [],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
      setShowCreateForm(false)
      
      // Auto-copy the invite link
      const inviteLink = `${window.location.origin}?view=invite-landing&code=${invite.code}`
      await navigator.clipboard.writeText(inviteLink)
      setCopiedCode(invite.code)
      
    } catch (err) {
      setError('Failed to create invite. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const copyInviteLink = async (code: string) => {
    const inviteLink = `${window.location.origin}?view=invite-landing&code=${code}`
    await navigator.clipboard.writeText(inviteLink)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const sendInviteEmail = (invite: any) => {
    const inviteLink = `${window.location.origin}?view=invite-landing&code=${invite.code}`
    const subject = `Invitation to Modulus LMS`
    const body = `Hello ${invite.name},

You have been invited to join Modulus LMS as a ${invite.role}.

Please click the link below to complete your account setup:
${inviteLink}

This invitation expires on ${new Date(invite.expiresAt).toLocaleDateString()}.

Best regards,
Modulus LMS Team`

    window.open(`mailto:${invite.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Invite Management</h2>
          <p className="text-muted-foreground">Create and manage user invitations</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invite</span>
        </button>
      </div>

      {/* Create Invite Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Create New Invite</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvite} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                <input
                  type="text"
                  value={newInvite.name}
                  onChange={(e) => setNewInvite({ ...newInvite, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-background text-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                <input
                  type="email"
                  value={newInvite.email}
                  onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-background text-foreground"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Student ID (Optional)</label>
                <input
                  type="text"
                  value={newInvite.studentId}
                  onChange={(e) => setNewInvite({ ...newInvite, studentId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-background text-foreground"
                  placeholder="e.g. S123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                <select
                  value={newInvite.role}
                  onChange={(e) => setNewInvite({ ...newInvite, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-background text-foreground"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Expires At</label>
                <input
                  type="datetime-local"
                  value={newInvite.expiresAt.toISOString().slice(0, 16)}
                  onChange={(e) => setNewInvite({ ...newInvite, expiresAt: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-background text-foreground"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Invite</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invites List */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">Recent Invitations</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inviteCodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No invitations created yet. Click &ldquo;Create Invite&rdquo; to get started.
                  </td>
                </tr>
              ) : (
                inviteCodes.map((invite) => (
                  <tr key={invite.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-foreground">{invite.name}</div>
                        <div className="text-sm text-muted-foreground">{invite.email}</div>
                        {invite.studentId && (
                          <div className="text-xs text-muted-foreground">ID: {invite.studentId}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 capitalize">
                        {invite.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {invite.isUsed ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Used
                        </span>
                      ) : new Date(invite.expiresAt) < new Date() ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyInviteLink(invite.code)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Copy invite link"
                        >
                          {copiedCode === invite.code ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => sendInviteEmail(invite)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          title="Send email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(`${window.location.origin}?view=invite-landing&code=${invite.code}`, '_blank')}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Open invite link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
