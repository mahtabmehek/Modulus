'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TermsOfService() {
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
                        Terms of Service
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>

                    <div className="space-y-8 text-gray-700 dark:text-gray-300">
                        {/* Acceptance of Terms */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                1. Acceptance of Terms
                            </h2>
                            <p className="leading-relaxed">
                                By accessing and using ModulusLMS ("the Platform," "our Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms of Service, please do not use our platform. These terms apply to all users, including students, instructors, administrators, and visitors.
                            </p>
                        </section>

                        {/* Description of Service */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                2. Description of Service
                            </h2>
                            <p className="leading-relaxed mb-4">
                                ModulusLMS is a comprehensive Learning Management System designed to facilitate online and blended learning experiences. Our platform provides:
                            </p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Course management and content delivery systems</li>
                                <li>Interactive learning environments and virtual labs</li>
                                <li>Assessment and grading tools</li>
                                <li>Communication and collaboration features</li>
                                <li>Progress tracking and analytics</li>
                                <li>Administrative and reporting capabilities</li>
                            </ul>
                        </section>

                        {/* User Accounts and Registration */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                3. User Accounts and Registration
                            </h2>

                            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                                3.1 Account Creation
                            </h3>
                            <p className="leading-relaxed mb-4">
                                To access most features of ModulusLMS, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to maintain its accuracy.
                            </p>

                            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                                3.2 Account Security
                            </h3>
                            <p className="leading-relaxed mb-4">
                                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
                            </p>

                            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                                3.3 Account Eligibility
                            </h3>
                            <p className="leading-relaxed">
                                Accounts are typically created through institutional affiliation or invitation. Users must be authorized by their educational institution or organization to access the platform.
                            </p>
                        </section>

                        {/* Acceptable Use Policy */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                4. Acceptable Use Policy
                            </h2>

                            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                                4.1 Permitted Use
                            </h3>
                            <p className="leading-relaxed mb-4">
                                You may use ModulusLMS solely for legitimate educational purposes, including:
                            </p>
                            <ul className="list-disc list-inside space-y-2 mb-4">
                                <li>Participating in assigned courses and academic activities</li>
                                <li>Accessing and submitting coursework and assignments</li>
                                <li>Collaborating with classmates and instructors as directed</li>
                                <li>Using provided tools and resources for learning</li>
                            </ul>

                            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                                4.2 Prohibited Activities
                            </h3>
                            <p className="leading-relaxed mb-4">
                                You agree not to engage in any of the following activities:
                            </p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Violating any applicable laws, regulations, or institutional policies</li>
                                <li>Sharing account credentials or accessing others' accounts without permission</li>
                                <li>Uploading, posting, or transmitting harmful, offensive, or inappropriate content</li>
                                <li>Attempting to bypass, disable, or interfere with platform security features</li>
                                <li>Using the platform for commercial purposes without authorization</li>
                                <li>Copying, distributing, or reverse engineering platform software or content</li>
                                <li>Harassing, threatening, or discriminating against other users</li>
                                <li>Submitting false information or impersonating others</li>
                            </ul>
                        </section>

                        {/* Academic Integrity */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                5. Academic Integrity
                            </h2>
                            <p className="leading-relaxed mb-4">
                                Users must adhere to their institution's academic integrity policies when using ModulusLMS. This includes:
                            </p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Submitting original work and properly citing sources</li>
                                <li>Not engaging in plagiarism, cheating, or unauthorized collaboration</li>
                                <li>Respecting intellectual property rights of course materials</li>
                                <li>Following examination and assessment guidelines</li>
                                <li>Reporting suspected violations of academic integrity</li>
                            </ul>
                        </section>

                        {/* Content and Intellectual Property */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                6. Content and Intellectual Property
                            </h2>

                            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                                6.1 Platform Content
                            </h3>
                            <p className="leading-relaxed mb-4">
                                Course materials, software, and other content provided through ModulusLMS are owned by the respective educational institutions, instructors, or content creators. Users may access and use this content solely for educational purposes as authorized.
                            </p>

                            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                                6.2 User-Generated Content
                            </h3>
                            <p className="leading-relaxed mb-4">
                                You retain ownership of content you create and submit through the platform. By submitting content, you grant ModulusLMS and your educational institution a non-exclusive license to use, display, and distribute your content for educational and administrative purposes.
                            </p>

                            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                                6.3 Copyright Compliance
                            </h3>
                            <p className="leading-relaxed">
                                Users must respect intellectual property rights and comply with copyright laws. We will respond to valid copyright infringement claims in accordance with applicable law.
                            </p>
                        </section>

                        {/* Privacy and Data Protection */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                7. Privacy and Data Protection
                            </h2>
                            <p className="leading-relaxed">
                                Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms of Service by reference. We comply with applicable data protection laws, including the General Data Protection Regulation (GDPR).
                            </p>
                        </section>

                        {/* Platform Availability */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                8. Platform Availability and Modifications
                            </h2>

                            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                                8.1 Service Availability
                            </h3>
                            <p className="leading-relaxed mb-4">
                                We strive to maintain high platform availability but cannot guarantee uninterrupted service. Planned maintenance, updates, and unforeseen circumstances may cause temporary service interruptions.
                            </p>

                            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                                8.2 Platform Modifications
                            </h3>
                            <p className="leading-relaxed">
                                We reserve the right to modify, update, or discontinue features of the platform at any time. We will provide reasonable notice of significant changes that may affect your use of the service.
                            </p>
                        </section>

                        {/* Limitation of Liability */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                9. Limitation of Liability
                            </h2>
                            <p className="leading-relaxed mb-4">
                                To the maximum extent permitted by law, ModulusLMS and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
                            </p>
                            <ul className="list-disc list-inside space-y-2">
                                <li>Your use or inability to use the platform</li>
                                <li>Any unauthorized access to or use of our servers and/or personal information</li>
                                <li>Any interruption or cessation of transmission to or from the platform</li>
                                <li>Any bugs, viruses, or similar harmful code that may be transmitted through the platform</li>
                                <li>Any errors or omissions in content or for any loss or damage incurred as a result of your use of any content</li>
                            </ul>
                        </section>

                        {/* Indemnification */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                10. Indemnification
                            </h2>
                            <p className="leading-relaxed">
                                You agree to defend, indemnify, and hold harmless ModulusLMS, its affiliates, and their respective officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including attorney's fees) arising from your use of the platform or violation of these Terms of Service.
                            </p>
                        </section>

                        {/* Termination */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                11. Termination
                            </h2>

                            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                                11.1 Termination by User
                            </h3>
                            <p className="leading-relaxed mb-4">
                                You may discontinue use of the platform at any time, subject to your institutional requirements and course obligations.
                            </p>

                            <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-3">
                                11.2 Termination by ModulusLMS
                            </h3>
                            <p className="leading-relaxed">
                                We may suspend or terminate your access to the platform immediately, without prior notice or liability, if you breach these Terms of Service or engage in conduct that we determine to be inappropriate or harmful to the platform or other users.
                            </p>
                        </section>

                        {/* Governing Law */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                12. Governing Law and Dispute Resolution
                            </h2>
                            <p className="leading-relaxed">
                                These Terms of Service shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes arising under these terms shall be resolved through the appropriate legal channels as determined by your institutional policies and applicable law.
                            </p>
                        </section>

                        {/* Accessibility */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                13. Accessibility
                            </h2>
                            <p className="leading-relaxed">
                                We are committed to making ModulusLMS accessible to users with disabilities. We strive to comply with applicable accessibility standards and welcome feedback on how we can improve accessibility. If you encounter accessibility barriers, please contact our support team.
                            </p>
                        </section>

                        {/* Changes to Terms */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                14. Changes to Terms of Service
                            </h2>
                            <p className="leading-relaxed">
                                We reserve the right to modify these Terms of Service at any time. We will notify users of material changes by posting updated terms on the platform and updating the "Last updated" date. Your continued use of ModulusLMS after changes take effect constitutes acceptance of the updated terms.
                            </p>
                        </section>

                        {/* Contact Information */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                15. Contact Information
                            </h2>
                            <p className="leading-relaxed mb-4">
                                If you have questions about these Terms of Service, please contact us:
                            </p>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <p className="font-medium">ModulusLMS Support Team</p>
                                <p>Email: support@moduluslms.com</p>
                                <p>Legal inquiries: legal@moduluslms.com</p>
                                <p>Address: Somewhere, find us</p>
                            </div>
                        </section>

                        {/* Severability */}
                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                16. Severability
                            </h2>
                            <p className="leading-relaxed">
                                If any provision of these Terms of Service is held to be unenforceable or invalid, such provision will be changed and interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, and the remaining provisions will continue in full force and effect.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
