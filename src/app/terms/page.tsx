import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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

                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 dark:text-slate-100">Terms of Service</h1>
                <p className="text-sm text-gray-500 mb-10">Last updated: {lastUpdated}</p>

                <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">1. Agreement to Terms</h2>
                        <p>
                            These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and <span className="font-bold text-[#073449]">Pocket</span><span className="font-bold text-[#F07E23]">Book</span> ("we," "us" or "our"), concerning your access to and use of the PocketBook website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
                        </p>
                        <p className="mt-4">
                            You agree that by accessing the Site, you have read, understood, and agree to be bound by all of these Terms of Service. If you do not agree with all of these Terms of Service, then you are expressly prohibited from using the Site and you must discontinue use immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">2. Intellectual Property Rights</h2>
                        <p>
                            Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws and various other intellectual property rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">3. User Representations</h2>
                        <p>
                            By using the Site, you represent and warrant that:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4">
                            <li>All registration information you submit will be true, accurate, current, and complete.</li>
                            <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
                            <li>You have the legal capacity and you agree to comply with these Terms of Service.</li>
                            <li>You will not access the Site through automated or non-human means, whether through a bot, script or otherwise.</li>
                            <li>You will not use the Site for any illegal or unauthorized purpose.</li>
                            <li>Your use of the Site will not violate any applicable law or regulation.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">4. User Registration</h2>
                        <p>
                            You may be required to register with the Site. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">5. Prohibited Activities</h2>
                        <p>
                            You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us. As a user of the Site, you agree not to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4">
                            <li>Systematically retrieve data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
                            <li>Make any unauthorized use of the Site, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email, or creating user accounts by automated means or under false pretenses.</li>
                            <li>Circumvent, disable, or otherwise interfere with security-related features of the Site, including features that prevent or restrict the use or copying of any Content or enforce limitations on the use of the Site and/or the Content contained therein.</li>
                            <li>Engage in unauthorized framing of or linking to the Site.</li>
                            <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
                            <li>Make improper use of our support services or submit false reports of abuse or misconduct.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">6. Site Management</h2>
                        <p>
                            We reserve the right, but not the obligation, to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 mt-4">
                            <li>Monitor the Site for violations of these Terms of Service.</li>
                            <li>Take appropriate legal action against anyone who, in our sole discretion, violates the law or these Terms of Service, including without limitation, reporting such user to law enforcement authorities.</li>
                            <li>In our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable (to the extent technologically feasible) any of your Contributions or any portion thereof.</li>
                            <li>Otherwise manage the Site in a manner designed to protect our rights and property and to facilitate the proper functioning of the Site.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">7. Modifications and Interruptions</h2>
                        <p>
                            We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Site. We also reserve the right to modify or discontinue all or part of the Site without notice at any time. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">8. Disclaimer</h2>
                        <p>
                            THE SITE IS PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SITE AND OUR SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SITE AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">9. Contact Us</h2>
                        <p>
                            In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at: <a href="mailto:mail@mypocketbook.in" className="text-blue-600 hover:underline">mail@mypocketbook.in</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
