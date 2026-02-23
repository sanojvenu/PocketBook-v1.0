import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    const lastUpdated = "February 13, 2026";

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-12">
            <div className="max-w-4xl mx-auto glass-panel p-8 md:p-12">
                <div className="sticky top-0 z-10 -mx-8 -mt-8 px-8 py-6 md:-mx-12 md:-mt-12 md:px-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md mb-8 border-b border-gray-100 dark:border-gray-800 rounded-t-[1rem]">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline mb-6">
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Application
                    </Link>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 dark:text-slate-100">Privacy Policy</h1>
                <p className="text-sm text-gray-500 mb-10">Last updated: {lastUpdated}</p>

                <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                            1. Introduction
                        </h2>
                        <p>
                            Welcome to <span className="font-bold text-[#073449]">Pocket</span><span className="font-bold text-[#F07E23]">Book</span> ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
                        </p>
                        <p className="mt-4">
                            When you visit our website and use our services, you trust us with your personal information. We take your privacy very seriously. In this privacy policy, we describe our privacy policy. We seek to explain to you in the clearest way possible what information we collect, how we use it, and what rights you have in relation to it.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">2. Information We Collect</h2>
                        <p className="mb-2">We collect information that you voluntarily provide to us when registering at the Services, expressing an interest in obtaining information about us or our products and services, when participating in activities on the Services or otherwise contacting us.</p>
                        <ul className="list-disc pl-5 space-y-2 mt-2">
                            <li><strong>Personal Information Provided by You:</strong> We collect names; phone numbers; email addresses; and other similar information.</li>
                            <li><strong>Social Media Login Data:</strong> We provide you with the option to register using social media account details, like your Google account. If you choose to register in this way, we will collect the Information described in the section called "How do we handle your social logins" below.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">3. How We Use Your Information</h2>
                        <p>We use personal information collected via our Services for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
                        <ul className="list-disc pl-5 space-y-2 mt-4">
                            <li><strong>To facilitate account creation and logon process.</strong></li>
                            <li><strong>To send administrative information to you.</strong> We may use your personal information to send you product, service and new feature information and/or information about changes to our terms, conditions, and policies.</li>
                            <li><strong>To protect our Services.</strong> We may use your information as part of our efforts to keep our Services safe and secure (for example, for fraud monitoring and prevention).</li>
                            <li><strong>To enforce our terms, conditions and policies.</strong></li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">4. Will Your Information be Shared with Anyone?</h2>
                        <p>
                            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may process or share data based on the following legal basis:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4">
                            <li><strong>Consent:</strong> We may process your data if you have given us specific consent to use your personal information in a specific purpose.</li>
                            <li><strong>Legitimate Interests:</strong> We may process your data when it is reasonably necessary to achieve our legitimate business interests.</li>
                            <li><strong>Performance of a Contract:</strong> Where we have entered into a contract with you, we may process your personal information to fulfill the terms of our contract.</li>
                            <li><strong>Legal Obligations:</strong> We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, a judicial proceeding, court order, or legal process.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">5. How Do We Handle Your Social Logins?</h2>
                        <p>
                            Our Services offer you the ability to register and login using your third party social media account details (like your Google logins). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile Information we receive may vary depending on the social media provider concerned, but will often include your name, e-mail address, list of friends, profile picture as well as other information you choose to make public.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">6. How Long Do We Keep Your Information?</h2>
                        <p>
                            We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law (such as tax, accounting or other legal requirements). No purpose in this policy will require us keeping your personal information for longer than the period of time in which users have an account with us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">7. How Do We Keep Your Information Safe?</h2>
                        <p>
                            We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the services within a secure environment.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">8. What Are Your Privacy Rights?</h2>
                        <p>
                            In some regions, such as the European Economic Area, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.
                        </p>
                        <p className="mt-2">
                            If you are resident in the European Economic Area and you believe we are unlawfully processing your personal information, you also have the right to complain to your local data protection supervisory authority.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">9. Account Termination</h2>
                        <p>
                            If you would like to review or change the information in your account or terminate your account, you can contact us. Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, some information may be retained in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our Terms of Use and/or comply with legal requirements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">10. Contact Us</h2>
                        <p>
                            If you have questions or comments about this policy, you may email us at <a href="mailto:mail@mypocketbook.in" className="text-blue-600 hover:underline">mail@mypocketbook.in</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
