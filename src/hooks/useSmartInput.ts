import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { aiService } from '@/lib/aiService';

export interface UseSmartInputProps {
    onImageProcessed?: (parsedData: any) => void;
    onVoiceProcessed?: (transcript: string) => void;
}

export function useSmartInput({ onImageProcessed, onVoiceProcessed }: UseSmartInputProps = {}) {
    const [aiMode, setAiMode] = useState<"text" | "voice" | "image" | null>(null);
    const [aiInput, setAiInput] = useState("");
    const [aiProcessing, setAiProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleVoiceInput = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                const { speechRecognition } = await SpeechRecognition.requestPermissions();
                if (speechRecognition !== 'granted') {
                    toast.error("Microphone permission denied");
                    return;
                }

                setAiProcessing(true);
                setAiMode("voice");
                await SpeechRecognition.removeAllListeners();

                SpeechRecognition.addListener("partialResults", (data: any) => {
                    if (data.matches && data.matches.length > 0) {
                        setAiInput(data.matches[0]);
                        if (onVoiceProcessed) onVoiceProcessed(data.matches[0]);
                    }
                });

                await SpeechRecognition.start({
                    language: "en-IN",
                    maxResults: 1,
                    prompt: "Speak now...",
                    partialResults: true,
                    popup: false,
                });

            } catch (e) {
                console.error("Native Voice Error", e);
                setAiMode(null);
                setAiProcessing(false);
            } finally {
                setTimeout(() => setAiProcessing(false), 6000);
            }
        } else {
            // Web Fallback
            if (!('webkitSpeechRecognition' in window)) {
                toast.error("Voice input is not supported in this browser.");
                return;
            }

            // @ts-ignore
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onstart = () => {
                setAiProcessing(true);
                setAiMode("voice");
            };

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setAiInput(transcript);
                setAiMode("text");
                setAiProcessing(false);
                if (onVoiceProcessed) onVoiceProcessed(transcript);
            };

            recognition.onerror = () => {
                setAiProcessing(false);
                toast.error("Voice recognition error.");
            };

            recognition.onend = () => {
                setAiProcessing(false);
            };

            recognition.start();
        }
    };

    const handleCameraInput = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                const image = await Camera.getPhoto({
                    quality: 80,
                    allowEditing: true,
                    resultType: CameraResultType.Base64,
                    source: CameraSource.Prompt,
                    width: 1024,
                    correctOrientation: true
                });

                if (image.base64String) {
                    setAiProcessing(true);
                    toast.info("Analyzing receipt with Gemini...");

                    try {
                        const parsed = await aiService.analyzeImageWithGemini(image.base64String);
                        if (onImageProcessed) onImageProcessed(parsed);
                        toast.success("Receipt scanned successfully!");
                    } catch (aiError: any) {
                        console.error("AI Scan Error", aiError);
                        toast.error("Failed to analyze receipt: " + aiError.message);
                    } finally {
                        setAiProcessing(false);
                    }
                } else {
                    setAiProcessing(false);
                }
            } catch (e) {
                console.error("Camera Cancelled/Error", e);
                setAiProcessing(false);
            }
        } else {
            fileInputRef.current?.click();
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAiProcessing(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            toast.info("Image scanning simulating... (Backend integration required)");
            setAiProcessing(false);
        };
        reader.readAsDataURL(file);
    };

    return {
        aiMode,
        setAiMode,
        aiInput,
        setAiInput,
        aiProcessing,
        setAiProcessing,
        fileInputRef,
        handleVoiceInput,
        handleCameraInput,
        handleImageUpload
    };
}
