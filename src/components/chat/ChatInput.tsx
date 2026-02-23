import { RefObject, useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, Send, ArrowRight, Camera as CameraIcon, Mic, X } from "lucide-react";
import { Camera, CameraResultType } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import { aiService } from "@/lib/aiService";
import { toast } from "sonner";

interface ChatInputProps {
    input: string;
    setInput: (val: string) => void;
    handleSend: (txt?: string) => void;
    loading: boolean;
    variant?: 'fullscreen' | 'compact' | 'start';
    onFocus?: () => void;
    externalRef?: RefObject<HTMLInputElement | null>;
    autoFocus?: boolean;
}

export function ChatInput({ input, setInput, handleSend, loading, variant = 'fullscreen', onFocus, externalRef, autoFocus }: ChatInputProps) {
    const internalRef = useRef<HTMLInputElement>(null);
    const ref = (externalRef || internalRef) as RefObject<HTMLInputElement>;
    const [analyzing, setAnalyzing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const isNative = Capacitor.isNativePlatform();

    useEffect(() => {
        if (isNative) {
            SpeechRecognition.requestPermissions();
        }
    }, [isNative]);

    const handleMic = async () => {
        if (!isNative) {
            toast.error("Voice input is only available on the mobile app.");
            return;
        }

        try {
            if (isRecording) {
                await SpeechRecognition.stop();
                setIsRecording(false);
            } else {
                const { available } = await SpeechRecognition.available();
                if (!available) {
                    toast.error("Speech recognition not available on this device.");
                    return;
                }

                const permStatus = await SpeechRecognition.checkPermissions();
                if (permStatus.speechRecognition !== 'granted') {
                    const reqStatus = await SpeechRecognition.requestPermissions();
                    if (reqStatus.speechRecognition !== 'granted') {
                        toast.error("Microphone permission denied");
                        return;
                    }
                }

                setIsRecording(true);

                // On Android, if popup: true, partialResults does not emit.
                // We await the final result instead.
                const result = await SpeechRecognition.start({
                    language: "en-US",
                    maxResults: 1,
                    prompt: "Speak now...",
                    partialResults: false,
                    popup: true
                });

                if (result && result.matches && result.matches.length > 0) {
                    setInput(result.matches[0]);
                }

                setIsRecording(false);
            }
        } catch (error) {
            console.error("Speech recognition error:", error);
            setIsRecording(false);
            // We do not toast an error here because closing the native Android popup without speaking throws an exception.
        }
    };

    const handleCamera = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Base64
            });

            if (image.base64String) {
                // Add to selected images to process together
                setSelectedImages(prev => [...prev, image.base64String!]);
            }
        } catch (e) {
            if ((e as any).message !== 'User cancelled photos app') {
                console.error(e);
                toast.error("Failed to capture image");
            }
        }
    };

    const processSelectedImages = async () => {
        if (selectedImages.length === 0) return;

        setAnalyzing(true);
        const count = selectedImages.length;
        toast.info(count > 1 ? `Analyzing ${count} receipts...` : "Analyzing receipt...");

        try {
            const result = await aiService.analyzeImageWithGemini(selectedImages);
            setAnalyzing(false);
            setSelectedImages([]); // clear out

            if (result) {
                const desc = result.description || 'Unknown Items';
                const amount = result.amount || 0;
                const cat = result.category ? `for ${result.category}` : '';

                if (amount > 0) {
                    handleSend(`Spent ${amount} on ${desc} ${cat}`);
                } else {
                    setInput(`Spent [AMOUNT] on ${desc} ${cat}`);
                    toast.warning("Could not detect total amount. Please enter it.");
                }
            }
        } catch (e) {
            setAnalyzing(false);
            console.error(e);
            toast.error("Failed to analyze receipts");
        }
    };

    const handleSendClick = () => {
        if (selectedImages.length > 0) {
            processSelectedImages();
        } else {
            handleSend();
        }
    };

    if (variant === 'start') {
        return (
            <div className="p-1 flex items-center">
                <div className="pl-4 text-blue-500"><Sparkles size={20} /></div>
                <input
                    type="text"
                    className="w-full bg-transparent border-none outline-none p-4 text-gray-900 dark:text-white placeholder-gray-400 font-medium"
                    placeholder="Ask PocketBook... (or click to chat)"
                    onFocus={onFocus}
                    autoFocus={autoFocus}
                />
                <button onClick={onFocus} className="p-3 bg-blue-600 text-white rounded-xl shadow-md"><ArrowRight size={20} /></button>
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className="p-3 bg-white border-t pb-14">
                <div className="relative flex items-center gap-2">
                    {isNative && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleCamera}
                                disabled={analyzing || loading || isRecording}
                                className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 hover:text-blue-600 disabled:opacity-50"
                            >
                                {analyzing ? <Loader2 size={20} className="animate-spin" /> : <CameraIcon size={20} />}
                            </button>
                            <button
                                onClick={handleMic}
                                disabled={analyzing || loading}
                                className={`p-3 rounded-xl transition-colors disabled:opacity-50 ${isRecording ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-blue-600'}`}
                            >
                                <Mic size={20} className={isRecording ? 'animate-pulse' : ''} />
                            </button>
                        </div>
                    )}
                    <div className="relative flex-1">
                        <input
                            ref={ref}
                            className="w-full bg-gray-100 text-sm p-3 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type a message..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendClick()}
                            disabled={loading || analyzing}
                            autoFocus={autoFocus}
                        />
                        <button onClick={handleSendClick} disabled={loading || analyzing} className="absolute right-2 top-2 text-blue-600">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default: Full Screen
    return (
        <div className="p-2 md:p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <div className="container mx-auto max-w-4xl relative">
                {selectedImages.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto p-2 mb-2">
                        {selectedImages.map((img, i) => (
                            <div key={i} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-500 shadow-sm">
                                <img src={`data:image/jpeg;base64,${img}`} alt="Receipt Preview" className="w-full h-full object-cover" />
                                <button onClick={() => setSelectedImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md">
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendClick()}
                        placeholder={selectedImages.length > 0 ? "Add optional note..." : "Ask me anything..."}
                        className={`w-full ${isNative ? 'pl-20' : 'pl-4'} pr-12 py-2.5 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 border-2 focus:border-blue-500 rounded-xl text-sm transition-all outline-none shadow-sm`}
                        disabled={loading || analyzing}
                        autoFocus={autoFocus}
                    />

                    {isNative && (
                        <div className="absolute left-2 top-2 flex items-center gap-1">
                            <button
                                onClick={handleCamera}
                                disabled={analyzing || loading || isRecording}
                                className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-50 transition-colors"
                            >
                                {analyzing ? <Loader2 size={18} className="animate-spin" /> : <CameraIcon size={18} />}
                            </button>
                            <button
                                onClick={handleMic}
                                disabled={analyzing || loading}
                                className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${isRecording ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-blue-600'}`}
                            >
                                <Mic size={18} className={isRecording ? 'animate-pulse' : ''} />
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleSendClick}
                        disabled={loading || analyzing || isRecording || (!input.trim() && selectedImages.length === 0)}
                        className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
