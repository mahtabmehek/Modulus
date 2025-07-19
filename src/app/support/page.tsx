'use client'

import { useState } from 'react'
import { ArrowLeft, Mail, MessageSquare, User, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Support() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    priority: 'medium',
    description: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSendEmail = () => {
    // Construct the email body with all the form information
    const emailBody = `
Name: ${formData.name}
Email: ${formData.email}
Category: ${formData.category}
Priority: ${formData.priority}

Subject: ${formData.subject}

Description:
${formData.description}

---
This message was sent from ModulusLMS Support Form
Date: ${new Date().toLocaleString()}
    `.trim()

    // Create mailto URL with pre-filled data
    const mailtoUrl = `mailto:support@moduluslms.com?subject=${encodeURIComponent(`[ModulusLMS Support] ${formData.subject}`)}&body=${encodeURIComponent(emailBody)}`
    
    // Open default email client
    window.location.href = mailtoUrl
  }

  const isFormValid = formData.name && formData.email && formData.subject && formData.description

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Support Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Contact Support
                </h1>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Need help with ModulusLMS? Fill out the form below and we'll get back to you as soon as possible.
              </p>

              <div className="space-y-6">
                {/* Name and Email Row */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                {/* Category and Priority Row */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Issue</option>
                      <option value="account">Account Problem</option>
                      <option value="course">Course Related</option>
                      <option value="lab">Lab Environment</option>
                      <option value="grade">Grades & Assessment</option>
                      <option value="billing">Billing & Payment</option>
                      <option value="feature">Feature Request</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="low">Low - General question</option>
                      <option value="medium">Medium - Standard issue</option>
                      <option value="high">High - Urgent problem</option>
                      <option value="critical">Critical - System down</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-vertical"
                    placeholder="Please provide detailed information about your issue. Include any error messages, steps to reproduce the problem, and your browser/device information if relevant."
                    required
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Be as specific as possible to help us provide better assistance.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSendEmail}
                    disabled={!isFormValid}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Send Support Request
                  </button>
                </div>

                {!isFormValid && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Please fill in all required fields (*) before sending.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Support Information Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Contact Information
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Email Support</p>
                  <p className="text-purple-600 dark:text-purple-400">support@moduluslms.com</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Response Time</p>
                  <p className="text-gray-600 dark:text-gray-400">Within 24 hours</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Address</p>
                  <p className="text-gray-600 dark:text-gray-400">Somewhere, find us</p>
                </div>
              </div>
            </div>

            {/* Support Hours */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Support Hours
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Monday - Friday</div>
                  <div className="text-gray-900 dark:text-white">9:00 AM - 6:00 PM</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Saturday</div>
                  <div className="text-gray-900 dark:text-white">10:00 AM - 4:00 PM</div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400">Sunday</div>
                  <div className="text-gray-900 dark:text-white">Closed</div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Emergency issues will be addressed outside business hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
