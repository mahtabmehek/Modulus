'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PrivacyPolicy() {
  const router = useRouter()

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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <div className="space-y-8 text-gray-700 dark:text-gray-300">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Introduction
              </h2>
              <p className="leading-relaxed">
                ModulusLMS ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Learning Management System platform. This policy complies with the General Data Protection Regulation (GDPR) and other applicable privacy laws.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. Information We Collect
              </h2>
              
              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                2.1 Personal Information
              </h3>
              <p className="leading-relaxed mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Name, email address, and contact information</li>
                <li>Account credentials and authentication data</li>
                <li>Profile information and academic details</li>
                <li>Course enrollment and progress data</li>
                <li>Assignment submissions and academic work</li>
                <li>Communication and feedback you provide</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                2.2 Usage Information
              </h3>
              <p className="leading-relaxed mb-4">
                We automatically collect certain information about your use of our platform:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Login times and platform usage patterns</li>
                <li>Course access and completion data</li>
                <li>IP addresses and device information</li>
                <li>Browser type and operating system</li>
                <li>Performance and error data for platform improvement</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. How We Use Your Information
              </h2>
              <p className="leading-relaxed mb-4">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Providing and maintaining our educational platform services</li>
                <li>Managing user accounts and authentication</li>
                <li>Delivering course content and tracking academic progress</li>
                <li>Facilitating communication between students and instructors</li>
                <li>Improving our platform functionality and user experience</li>
                <li>Sending important notifications about courses and platform updates</li>
                <li>Complying with legal obligations and institutional requirements</li>
                <li>Generating anonymized analytics and reports for educational insights</li>
              </ul>
            </section>

            {/* GDPR Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Your Rights Under GDPR
              </h2>
              <p className="leading-relaxed mb-4">
                If you are a resident of the European Union, you have the following rights under the General Data Protection Regulation:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Right of Access:</strong> You can request a copy of the personal data we hold about you</li>
                <li><strong>Right to Rectification:</strong> You can request correction of inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> You can request deletion of your personal data under certain circumstances</li>
                <li><strong>Right to Restrict Processing:</strong> You can request limitation of processing in specific situations</li>
                <li><strong>Right to Data Portability:</strong> You can request transfer of your data to another service</li>
                <li><strong>Right to Object:</strong> You can object to processing based on legitimate interests</li>
                <li><strong>Right to Withdraw Consent:</strong> You can withdraw consent for data processing at any time</li>
              </ul>
              <p className="leading-relaxed mt-4">
                To exercise these rights, please contact us at privacy@moduluslms.com. We will respond to your request within 30 days.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Information Sharing and Disclosure
              </h2>
              <p className="leading-relaxed mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Educational Institution:</strong> With your affiliated educational institution for academic purposes</li>
                <li><strong>Instructors and Staff:</strong> Course-related information with relevant teaching personnel</li>
                <li><strong>Service Providers:</strong> With trusted third-party providers who assist in platform operations</li>
                <li><strong>Legal Compliance:</strong> When required by law or to protect rights and safety</li>
                <li><strong>Anonymized Data:</strong> Aggregated, non-identifiable data for research and improvement purposes</li>
              </ul>
              <p className="leading-relaxed mt-4">
                We do not sell, rent, or trade your personal information to third parties for marketing purposes.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Data Security
              </h2>
              <p className="leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure data transmission, access controls, and regular security assessments. However, no internet-based service can guarantee complete security.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Data Retention
              </h2>
              <p className="leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and fulfill educational purposes. Academic records may be retained according to institutional policies and legal requirements. When data is no longer needed, we securely delete or anonymize it in accordance with our data retention policy.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. International Data Transfers
              </h2>
              <p className="leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. When we transfer personal data outside the European Economic Area, we ensure appropriate safeguards are in place, such as standard contractual clauses or adequacy decisions by the European Commission.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. Cookies and Tracking Technologies
              </h2>
              <p className="leading-relaxed">
                We use cookies and similar technologies to enhance your experience, maintain user sessions, and analyze platform usage. You can control cookie settings through your browser preferences. Essential cookies required for platform functionality cannot be disabled without affecting service quality.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Children's Privacy
              </h2>
              <p className="leading-relaxed">
                Our platform is designed for educational use and may be used by minors as part of their academic programs. We collect and process student data only as necessary for educational purposes and in compliance with applicable laws, including COPPA and GDPR provisions for children.
              </p>
            </section>

            {/* Policy Changes */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                11. Changes to This Privacy Policy
              </h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our platform and updating the "Last updated" date. Your continued use of ModulusLMS after changes take effect constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                12. Contact Us
              </h2>
              <p className="leading-relaxed mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="font-medium">ModulusLMS Privacy Team</p>
                <p>Email: privacy@moduluslms.com</p>
                <p>Address: Somewhere, find us</p>
                <p className="mt-2 text-sm">
                  For GDPR-related inquiries, please include "GDPR Request" in your subject line.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
