"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle, Smartphone } from "lucide-react";
import Link from "next/link";

export default function AndroidFAQPage() {
    const faqs = [
        {
            category: "Getting Started",
            items: [
                {
                    q: "How do I install PocketBook on Android?",
                    a: "You can install PocketBook directly from the Play Store. Search for 'PocketBook' and look for our logo."
                },
                {
                    q: "Do I need an account to use the app?",
                    a: "Yes, you need to sign in with your phone number or Google account to sync your data securely across devices."
                }
            ]
        },
        {
            category: "App Features",
            items: [
                {
                    q: "How do I add a widget to my home screen?",
                    a: "Long press on your home screen, select 'Widgets', find PocketBook, and drag the 'Quick Add' widget to your screen."
                },
                {
                    q: "Why am I not receiving notifications?",
                    a: "Please check your Android settings. Go to Settings > Apps > PocketBook > Notifications and ensure they are enabled. Also, check if 'Battery Saver' mode is restricting background activity."
                }
            ]
        },
        {
            category: "Troubleshooting",
            items: [
                {
                    q: "The app is crashing, what should I do?",
                    a: "Try clearing the app cache. Go to Settings > Apps > PocketBook > Storage > Clear Cache. If the issue persists, reinstalling the app often helps."
                },
                {
                    q: "Data isn't syncing with the web version.",
                    a: "Ensure you are logged in with the same credentials on both devices. Pull down on the dashboard to force a refresh."
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <header className="space-y-4 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-between">
                        <div className="flex items-center gap-3 text-green-600">
                            <div className="p-3 bg-green-100 rounded-2xl">
                                <Smartphone size={32} />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">FAQ on Android App</h1>
                                <p className="text-sm text-gray-500">Specific help for our Android users</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="space-y-6">
                    {faqs.map((category, catIdx) => (
                        <div key={catIdx} className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 ml-1">
                                {category.category}
                            </h2>
                            <div className="grid gap-3">
                                {category.items.map((faq, idx) => (
                                    <AccordionItem key={idx} question={faq.q} answer={faq.a} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center pt-8">
                    <p className="text-gray-500 mb-4">Still have questions?</p>
                    <Link href="/faq" className="text-blue-600 hover:underline font-medium">
                        View General FAQs
                    </Link>
                </div>
            </div>
        </div>
    );
}

function AccordionItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="glass-panel p-0 overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-200 hover:shadow-md">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left font-medium text-gray-900 dark:text-gray-100 bg-white/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
                <span className="pr-4">{question}</span>
                {isOpen ? <ChevronUp size={20} className="text-gray-500 shrink-0" /> : <ChevronDown size={20} className="text-gray-500 shrink-0" />}
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
            >
                <div className="p-4 pt-0 text-sm md:text-base text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-900/50 leading-relaxed">
                    {answer}
                </div>
            </div>
        </div>
    );
}
