"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowLeft, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function FAQPage() {
    const faqs = [
        {
            category: "General",
            items: [
                {
                    q: "Is PocketBook really free?",
                    a: "Yes, PocketBook is 100% free to use for personal finance tracking.",
                    tags: ["General"]
                },
                {
                    q: "Is my data secure?",
                    a: "Absolutely. Your data is stored securely on Google Cloud servers and is only accessible by you via your authenticated account.",
                    tags: ["General"]
                }
            ]
        },
        {
            category: "Android & App Features",
            items: [
                {
                    q: "How do I install PocketBook on Android?",
                    a: "You can install PocketBook directly from the Play Store. Search for 'PocketBook' and look for our logo.",
                    tags: ["Android"]
                },
                {
                    q: "How do I add a widget to my home screen?",
                    a: "Long press on your home screen, select 'Widgets', find PocketBook, and drag the 'Quick Add' widget to your screen.",
                    tags: ["Android"]
                },
                {
                    q: "Why am I not receiving notifications?",
                    a: "Check Android Settings > Apps > PocketBook > Notifications to ensure they are enabled. Also check battery optimization settings.",
                    tags: ["Android"]
                }
            ]
        },
        {
            category: "Web & Desktop",
            items: [
                {
                    q: "Can I use PocketBook on any browser?",
                    a: "Yes, PocketBook works on all modern browsers including Chrome, Safari, Firefox, and Edge.",
                    tags: ["Web"]
                },
                {
                    q: "Is there a desktop app?",
                    a: "PocketBook is a Progressive Web App (PWA). You can install it on your desktop by clicking the install icon in your browser's address bar.",
                    tags: ["Web"]
                },
                {
                    q: "Can I export reports from the web?",
                    a: "Yes, go to the 'Reports' section to download your transaction history as PDF or Excel files.",
                    tags: ["Web"]
                }
            ]
        },
        {
            category: "Account & Sync",
            items: [
                {
                    q: "Will my data sync if I use different computers?",
                    a: "Yes, as long as you log in with the same Google account or phone number, your data will be instantly verified and synced.",
                    tags: ["General"]
                },
                {
                    q: "How do I log out?",
                    a: "Click on your profile avatar in the bottom left sidebar and select 'Sign Out'.",
                    tags: ["General"]
                },
                {
                    q: "Data isn't syncing with the web version.",
                    a: "Ensure you are logged in with the same credentials. Pull down on the dashboard to force a refresh.",
                    tags: ["Android", "Web"]
                }
            ]
        },
        {
            category: "Cashbook & Reminders",
            items: [
                {
                    q: "How do I add a transaction?",
                    a: "Navigate to the Dashboard or Cashbook page and click the \"Add Transaction\" button.",
                    tags: ["General"]
                },
                {
                    q: "Can I edit or delete a transaction?",
                    a: "Yes, use the edit (pencil) or delete (trash) icons on any transaction card.",
                    tags: ["General"]
                },
                {
                    q: "How do reminders work?",
                    a: "Set reminders for future payments. Marking them complete automatically creates a transaction.",
                    tags: ["General"]
                }
            ]
        },
        {
            category: "Troubleshooting",
            items: [
                {
                    q: "The app is crashing, what should I do?",
                    a: "Try clearing the app cache via Settings > Apps > PocketBook > Storage > Clear Cache.",
                    tags: ["Android"]
                }
            ]
        }
    ];

    return (
        <div className="space-y-6 max-w-3xl mx-auto p-4 md:p-6 relative min-h-screen">
            <div className="sticky top-0 z-20 -mx-4 -mt-4 px-4 py-3 md:-mx-6 md:-mt-6 md:px-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm mb-6 transition-all">
                <Link href="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline mb-6">
                    <ArrowLeft size={16} className="mr-2" />
                    Back to Application
                </Link>
            </div>

            <header className="space-y-3 mb-8 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2.5 text-blue-600">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <HelpCircle size={24} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Frequently Asked Questions</h1>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-xl">Everything you need to know about using <span className="text-[#073449] font-bold">Pocket</span><span className="text-[#F07E23] font-bold">Book</span>.</p>
            </header>

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {faqs.map((category, catIdx) => (
                    <div key={catIdx} className="space-y-3">
                        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
                            {category.category}
                        </h2>
                        <div className="grid gap-3">
                            {category.items.map((faq, idx) => (
                                <AccordionItem key={idx} question={faq.q} answer={faq.a} tags={faq.tags} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center pt-10 pb-6 border-t border-gray-100 dark:border-gray-800 mt-8">
                <p className="text-sm text-gray-500 mb-2">Still need help?</p>
                <a href="mailto:mail@mypocketbook.in" className="text-sm text-blue-600 hover:underline font-medium">
                    Contact Support
                </a>
            </div>
        </div>
    );
}

function AccordionItem({ question, answer, tags }: { question: string; answer: string; tags: string[] }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="group bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-xl transition-all duration-200 hover:shadow-sm hover:border-blue-100 dark:hover:border-blue-900/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left transition-colors gap-4"
            >
                <span className={`font-semibold text-sm md:text-base text-gray-900 dark:text-gray-100 flex-1 transition-colors ${isOpen ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                    {question}
                </span>

                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex gap-1.5">
                        {tags.map(tag => (
                            <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-[4px] border border-opacity-20 uppercase tracking-wider ${tag === 'Android' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400' :
                                tag === 'Web' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400' :
                                    'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                {tag}
                            </span>
                        ))}
                    </div>
                    {isOpen ? <ChevronUp size={18} className="text-blue-500 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 shrink-0 transition-colors" />}
                </div>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
            >
                <div className="p-4 pt-0 pl-4 pr-8 text-sm text-gray-600 dark:text-gray-300 leading-relaxed opacity-90">
                    {answer}
                </div>
            </div>
        </div>
    );
}
