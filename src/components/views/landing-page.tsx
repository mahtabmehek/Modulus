'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Play, Users, Shield, Award, Target, Zap, Globe, CheckCircle, Star, Menu, X } from 'lucide-react'

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const features = [
    {
      icon: <Target className="w-8 h-8 text-red-500" />,
      title: "Interactive Cybersecurity Labs",
      description: "Hands-on practice with real-world scenarios in isolated virtual environments"
    },
    {
      icon: <Users className="w-8 h-8 text-red-500" />,
      title: "Multi-Role Management",
      description: "Student, instructor, and admin dashboards with role-based permissions"
    },
    {
      icon: <Award className="w-8 h-8 text-red-500" />,
      title: "Gamified Learning",
      description: "Earn badges, maintain streaks, and compete on leaderboards"
    },
    {
      icon: <Shield className="w-8 h-8 text-red-500" />,
      title: "Secure Virtual Environments",
      description: "Kubernetes-powered isolated labs for safe penetration testing"
    },
    {
      icon: <Zap className="w-8 h-8 text-red-500" />,
      title: "Real-time Progress Tracking",
      description: "Monitor student progress with detailed analytics and reporting"
    },
    {
      icon: <Globe className="w-8 h-8 text-red-500" />,
      title: "Cloud-Native Architecture",
      description: "Scalable AWS deployment with enterprise-grade security"
    }
  ]

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Cybersecurity Professor, MIT",
      content: "Modulus has transformed how we teach cybersecurity. Students love the hands-on approach!",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "IT Security Manager",
      content: "Our team's skills improved dramatically after using Modulus for training. Highly recommended!",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Computer Science Student",
      content: "The interactive labs make learning cybersecurity engaging and practical. Best platform I've used!",
      rating: 5
    }
  ]

  const faqs = [
    {
      question: "What makes Modulus different from other LMS platforms?",
      answer: "Modulus combines the interactive lab experience of TryHackMe with comprehensive course management. Our focus on cybersecurity education, gamification, and virtual lab environments sets us apart."
    },
    {
      question: "How does the virtual lab environment work?",
      answer: "Our labs run on Kubernetes clusters, providing isolated, secure environments for each student. You can practice penetration testing, network security, and other cybersecurity skills safely."
    },
    {
      question: "Is Modulus suitable for both beginners and advanced users?",
      answer: "Absolutely! We offer structured learning paths from beginner to advanced levels, with content suitable for students, professionals, and organizations."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We provide comprehensive documentation, video tutorials, community forums, and direct support for educational institutions."
    },
    {
      question: "Can I deploy Modulus on my own infrastructure?",
      answer: "Yes! Modulus is designed for cloud deployment on AWS with full documentation for self-hosting and customization."
    }
  ]

  const pricingPlans = [
    {
      name: "Free Tier",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "Up to 50 students",
        "Basic cybersecurity labs",
        "Community support",
        "Core gamification features"
      ],
      popular: false
    },
    {
      name: "Education",
      price: "$99",
      period: "per month",
      description: "Ideal for schools and universities",
      features: [
        "Up to 500 students",
        "Advanced lab environments",
        "Custom learning paths",
        "Priority support",
        "Analytics dashboard",
        "SSO integration"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For large organizations",
      features: [
        "Unlimited students",
        "Custom lab creation",
        "Advanced analytics",
        "24/7 support",
        "On-premise deployment",
        "Custom integrations"
      ],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-gray-900">
                  Modulus
                  <span className="text-red-500">LMS</span>
                </span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-gray-700 hover:text-red-500 px-3 py-2 text-sm font-medium">Features</a>
                <a href="#testimonials" className="text-gray-700 hover:text-red-500 px-3 py-2 text-sm font-medium">Testimonials</a>
                <a href="#pricing" className="text-gray-700 hover:text-red-500 px-3 py-2 text-sm font-medium">Pricing</a>
                <a href="#faq" className="text-gray-700 hover:text-red-500 px-3 py-2 text-sm font-medium">FAQ</a>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => window.location.href = '/?view=login'} 
                className="text-gray-700 hover:text-red-500 px-3 py-2 text-sm font-medium"
              >
                Sign In
              </button>
              <button 
                onClick={() => window.location.href = '/?view=register'} 
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-red-500"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <a href="#features" className="text-gray-700 hover:text-red-500 block px-3 py-2 text-base font-medium">Features</a>
              <a href="#testimonials" className="text-gray-700 hover:text-red-500 block px-3 py-2 text-base font-medium">Testimonials</a>
              <a href="#pricing" className="text-gray-700 hover:text-red-500 block px-3 py-2 text-base font-medium">Pricing</a>
              <a href="#faq" className="text-gray-700 hover:text-red-500 block px-3 py-2 text-base font-medium">FAQ</a>
              <div className="pt-4 pb-3 border-t border-gray-200">
                <button 
                  onClick={() => window.location.href = '/?view=login'} 
                  className="text-gray-700 hover:text-red-500 block px-3 py-2 text-base font-medium"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => window.location.href = '/?view=register'} 
                  className="bg-red-500 hover:bg-red-600 text-white block px-3 py-2 rounded-md text-base font-medium mx-3 mt-2 text-center"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-red-900">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              Master Cybersecurity with
              <span className="text-red-400 block">Interactive Learning</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The most comprehensive cybersecurity learning platform combining hands-on labs, 
              gamified experiences, and enterprise-grade virtual environments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/?view=register'} 
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center"
              >
                Start Learning Free
                <ChevronRight className="ml-2 w-5 h-5" />
              </button>
              <button className="border border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Modulus LMS?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for cybersecurity education with features that engage students and streamline instruction.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  {feature.icon}
                  <h3 className="text-xl font-semibold text-gray-900 ml-3">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Educators Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our users say about their experience with Modulus LMS.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-xl">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">&ldquo;{testimonial.content}&rdquo;</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs. Upgrade or downgrade at any time.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`bg-white p-8 rounded-xl shadow-lg ${plan.popular ? 'ring-2 ring-red-500 scale-105' : ''}`}>
                {plan.popular && (
                  <div className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {plan.price}
                    <span className="text-lg text-gray-600 font-normal">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => window.location.href = '/?view=register'} 
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-center block transition-colors ${
                    plan.popular 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Modulus LMS.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {openFaq === index ? 
                    <ChevronDown className="w-5 h-5 text-gray-500" /> : 
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  }
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Cybersecurity Education?
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Join thousands of students and educators already using Modulus LMS.
          </p>
          <button 
            onClick={() => window.location.href = '/?view=register'} 
            className="bg-white text-red-500 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center"
          >
            Start Your Free Trial
            <ChevronRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <span className="text-2xl font-bold">
                  Modulus<span className="text-red-500">LMS</span>
                </span>
              </div>
              <p className="text-gray-400 mb-4">
                The comprehensive cybersecurity learning platform designed for the next generation of security professionals.
              </p>
              <p className="text-sm text-gray-500">
                © 2024 Modulus by mahtabmehek. All rights reserved.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
