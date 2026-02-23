import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ... [existing imports]
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";


declare global {
    interface Window {
        recaptchaVerifier: RecaptchaVerifier | undefined;
    }
}

const OTP_SESSION_KEY = "pending_phone_otp_session_v1";
const OTP_SESSION_TTL_MS = 10 * 60 * 1000;

type OtpSession = {
    phoneNumber: string;
    verificationId: string;
    expiresAt: number;
};

export default function LoginView() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const isNativePlatform = Capacitor.isNativePlatform();
    const pendingPhoneNumberRef = useRef<string>("");

    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [step, setStep] = useState(1);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Force redirect if user is already logged in
    useEffect(() => {
        if (user && !loading) {
            console.log("User is logged in, redirecting...", user.uid);
            router.replace("/");
        }
    }, [user, loading, router]);

    const clearOtpSession = () => {
        localStorage.removeItem(OTP_SESSION_KEY);
    };

    const saveOtpSession = (session: OtpSession) => {
        localStorage.setItem(OTP_SESSION_KEY, JSON.stringify(session));
    };

    useEffect(() => {
        if (!isNativePlatform) return;

        const listenerHandles: Array<{ remove: () => Promise<void> }> = [];

        FirebaseAuthentication.addListener("phoneCodeSent", (event: any) => {
            const verificationId = event?.verificationId;
            if (!verificationId) {
                setIsSendingOtp(false);
                toast.error("Failed to start OTP verification. Please try again.");
                return;
            }

            const sentNumber = event?.phoneNumber || pendingPhoneNumberRef.current;
            saveOtpSession({
                phoneNumber: sentNumber,
                verificationId,
                expiresAt: Date.now() + OTP_SESSION_TTL_MS,
            });
            setConfirmationResult({ verificationId });
            setStep(2);
            setCountdown(180);
            setIsSendingOtp(false);
            toast.success("OTP sent successfully!");
        }).then((h) => listenerHandles.push(h));

        FirebaseAuthentication.addListener("phoneVerificationCompleted", () => {
            clearOtpSession();
            localStorage.setItem("lastActive", Date.now().toString());
            setIsSendingOtp(false);
            setIsVerifyingOtp(false);
            toast.success("Phone verified successfully!");
        }).then((h) => listenerHandles.push(h));

        FirebaseAuthentication.addListener("phoneVerificationFailed", (event: any) => {
            setIsSendingOtp(false);
            setIsVerifyingOtp(false);
            const message = event?.message || "Phone verification failed.";
            toast.error(message);
        }).then((h) => listenerHandles.push(h));

        return () => {
            listenerHandles.forEach((h) => h.remove().catch(() => undefined));
        };
    }, [isNativePlatform]);

    useEffect(() => {
        try {
            const rawSession = localStorage.getItem(OTP_SESSION_KEY);
            if (!rawSession) return;

            const parsed = JSON.parse(rawSession) as OtpSession;
            if (!parsed?.verificationId || !parsed?.expiresAt || Date.now() > parsed.expiresAt) {
                clearOtpSession();
                return;
            }

            const localNumber = parsed.phoneNumber.startsWith("+91")
                ? parsed.phoneNumber.slice(3)
                : parsed.phoneNumber;

            setPhoneNumber(localNumber);
            setConfirmationResult({ verificationId: parsed.verificationId });
            setStep(2);
            setCountdown(Math.max(0, Math.floor((parsed.expiresAt - Date.now()) / 1000)));
        } catch {
            clearOtpSession();
        }
    }, []);

    useEffect(() => {
        if (isNativePlatform) return;
        if (!auth) return;

        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch {
                // ignore
            }
        }

        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
                size: "invisible",
                callback: () => undefined,
                "expired-callback": () => toast.error("Recaptcha expired. Please refresh."),
            });
        } catch (err) {
            console.error("Recaptcha init error:", err);
        }

        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                    window.recaptchaVerifier = undefined;
                } catch {
                    // ignore
                }
            }
        };
    }, [isNativePlatform]);

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSendOtp = async () => {
        if (isSendingOtp) return;

        if (!phoneNumber) {
            toast.error("Please enter a valid phone number.");
            return;
        }

        const cleanNumber = phoneNumber.trim();
        const formattedNumber = cleanNumber.startsWith("+") ? cleanNumber : `+91${cleanNumber}`;

        if (formattedNumber.length < 12) {
            toast.error("Please enter a valid mobile number.");
            return;
        }

        setIsSendingOtp(true);
        try {
            if (isNativePlatform) {
                pendingPhoneNumberRef.current = formattedNumber;
                await FirebaseAuthentication.signInWithPhoneNumber({
                    phoneNumber: formattedNumber,
                });
                // Do NOT setIsSendingOtp(false) here; wait for listener
                return;
            }

            if (!auth) throw new Error("Firebase Auth not found");
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
                    size: "invisible",
                });
            }

            const confirmation = await signInWithPhoneNumber(auth, formattedNumber, window.recaptchaVerifier);
            setConfirmationResult(confirmation);
            clearOtpSession();
            setStep(2);
            setCountdown(180);
            toast.success("OTP sent successfully!");
            setIsSendingOtp(false); // Web success
        } catch (error: any) {
            console.error("Error sending OTP:", error);
            setIsSendingOtp(false); // Error case
            const errorMsg = error?.message || error?.toString?.() || "Unknown error";

            if (error?.code === "auth/invalid-app-credential" || errorMsg.toLowerCase().includes("credential") || errorMsg.toLowerCase().includes("app identifier")) {
                toast.error(
                    "Security Check Failed\n\n" +
                    "Firebase could not verify this app (Play Integrity/reCAPTCHA).\n\n" +
                    "Fix steps:\n" +
                    "1. Add both debug and release SHA-1/SHA-256 in Firebase Console\n" +
                    "2. Package name must be: in.mypocketbook.pocketbook\n" +
                    "3. Download new google-services.json and replace android/app/google-services.json\n" +
                    "4. Run npx cap sync android and rebuild"
                );
            } else if (error?.code === "auth/too-many-requests" || errorMsg.toLowerCase().includes("too many")) {
                toast.error("Too many requests. Please wait a few minutes before retrying.");
            } else if (error?.code === "auth/invalid-phone-number" || errorMsg.toLowerCase().includes("invalid")) {
                toast.error("Invalid phone number format. Use format: 9876543210");
            } else {
                toast.error("Failed to send OTP: " + errorMsg);
            }
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || !confirmationResult) return;

        setIsVerifyingOtp(true);
        try {
            if (isNativePlatform) {
                // Use JS SDK credential with Native Verification ID to sign in JS layer
                const credential = PhoneAuthProvider.credential(
                    confirmationResult.verificationId,
                    otp
                );
                await signInWithCredential(auth!, credential);

                // Also call native confirm (optional, but good for native plugin state consistency if needed)
                try {
                    await FirebaseAuthentication.confirmVerificationCode({
                        verificationId: confirmationResult.verificationId,
                        verificationCode: otp,
                    });
                } catch (e) {
                    console.log("Native confirm failed or already consumed by JS SDK, ignoring.", e);
                }

                clearOtpSession();
                localStorage.setItem("lastActive", Date.now().toString());
                toast.success("Phone verified successfully!");

                // Force hard navigation to ensure state sync on native as well
                router.replace("/");
                setTimeout(() => {
                    window.location.href = "/";
                }, 500);
            } else {
                await confirmationResult.confirm(otp);
                clearOtpSession();
                localStorage.setItem("lastActive", Date.now().toString());
                toast.success("Phone verified successfully!");

                // Force hard navigation to ensure state sync
                router.replace("/");
                setTimeout(() => {
                    window.location.href = "/";
                }, 500);
            }
        } catch (error: any) {
            console.error("Verification Error:", error);
            const errorMsg = error?.message || error?.toString?.() || "Unknown error";
            if (errorMsg.toLowerCase().includes("invalid")) {
                toast.error("Invalid OTP. Please try again.");
            } else {
                toast.error("Verification failed: " + errorMsg);
            }
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleResendOtp = () => {
        if (countdown > 0) return;
        handleSendOtp();
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 pt-safe">
            <div className="glass-panel p-8 max-w-md w-full text-center space-y-6">
                <div className="flex justify-center mb-4">
                    <img
                        src="/logo-updated.png"
                        alt="PocketBook"
                        className="w-24 h-24 rounded-2xl shadow-xl object-contain hover:scale-105 transition-transform duration-300"
                    />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">
                        <span className="text-[#073449]">Pocket</span><span className="text-[#F07E23]">Book</span>
                    </h1>
                    <p className="text-sm md:text-base text-gray-500 font-medium max-w-xs mx-auto">
                        Track Expenses, Log Income, and manage Reminders - 100% Free.
                    </p>
                </div>

                <div className="pt-4 space-y-4 text-left animate-in fade-in slide-in-from-bottom-4">
                    {step === 1 ? (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Phone Number</label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-500 font-medium border-r border-gray-300 pr-2 mr-2">
                                        <span>+91</span>
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="98765 43210"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                                        className="w-full pl-24 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                                        disabled={isSendingOtp}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSendOtp}
                                disabled={isSendingOtp || !phoneNumber}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/20"
                            >
                                {isSendingOtp ? <><Loader2 className="animate-spin" size={20} /> <span className="ml-1">Sending...</span></> : <><span className="mr-1">Get OTP</span> <ArrowRight size={18} /></>}
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Enter OTP</label>
                                    <button
                                        onClick={() => {
                                            setStep(1);
                                            setOtp("");
                                            setConfirmationResult(null);
                                            clearOtpSession();
                                        }}
                                        className="text-xs text-blue-500 hover:underline"
                                    >
                                        Change Number
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                    className="w-full px-4 py-3 text-center tracking-[0.5em] text-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                                    maxLength={6}
                                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                                />
                            </div>

                            <button
                                onClick={handleVerifyOtp}
                                disabled={isVerifyingOtp || otp.length !== 6}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-500/20"
                            >
                                {isVerifyingOtp ? <Loader2 className="animate-spin" size={20} /> : <><Check size={18} /> Verify and Login</>}
                            </button>

                            <div className="text-center pt-2">
                                {countdown > 0 ? (
                                    <p className="text-xs text-gray-400">
                                        Resend OTP in <span className="font-semibold text-gray-600 dark:text-gray-300">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}</span>
                                    </p>
                                ) : (
                                    <button
                                        onClick={handleResendOtp}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>



                <div id="recaptcha-container" className="hidden"></div>

                <div className="text-xs text-gray-400 mt-8">
                    <div className="text-gray-500 flex justify-center items-center gap-2">
                        <Link href="/privacy" className="hover:underline hover:text-blue-600 transition-colors">Privacy Policy</Link>
                        <span className="mx-1">|</span>
                        <Link href="/faq" className="hover:underline hover:text-blue-600 transition-colors">FAQ</Link>
                        <span className="mx-1">|</span>
                        <Link href="/terms" className="hover:underline hover:text-blue-600 transition-colors">Terms of Service</Link>
                    </div>
                </div>

                <div className="text-xs text-gray-400 mt-4 font-medium">
                    Built with ❤️ in India
                </div>
            </div>
        </div>
    );
}
