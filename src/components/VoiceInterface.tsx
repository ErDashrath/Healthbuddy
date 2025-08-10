import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Pause, Play } from 'lucide-react';

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface VoiceInterfaceProps {
  onVoiceInput: (text: string) => void;
  onVoiceToggle: (enabled: boolean) => void;
  aiResponse?: string;
  isListening?: boolean;
  disabled?: boolean;
}

export default function VoiceInterface({ 
  onVoiceInput, 
  onVoiceToggle, 
  aiResponse, 
  isListening = false,
  disabled = false 
}: VoiceInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [synthesisSupported, setSynthesisSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check for Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      // Event handlers
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        console.log('🎤 Voice recognition started');
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
        console.log('🎤 Voice recognition ended');
      };
      
      recognitionRef.current.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          console.log('🎤 Final transcript:', transcript);
          onVoiceInput(transcript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('🎤 Speech recognition error:', event.error);
        setIsRecording(false);
      };
    }

    // Check for Speech Synthesis support
    if ('speechSynthesis' in window) {
      setSynthesisSupported(true);
      
      // Load voices
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Find best voice for mental health conversations (prefer female, warm voices)
        const preferredVoice = availableVoices.find(voice => 
          voice.lang.startsWith('en') && 
          (voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Karen'))
        ) || availableVoices.find(voice => voice.lang.startsWith('en') && voice.default);
        
        setSelectedVoice(preferredVoice || availableVoices[0]);
      };
      
      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (recognitionRef.current) recognitionRef.current.abort();
      if (speechSynthesis.speaking) speechSynthesis.cancel();
    };
  }, [onVoiceInput]);

  // Auto-speak AI responses when voice is enabled
  useEffect(() => {
    if (voiceEnabled && aiResponse && synthesisSupported && !isSpeaking) {
      speakText(aiResponse);
    }
  }, [aiResponse, voiceEnabled, synthesisSupported]);

  const toggleVoiceMode = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    onVoiceToggle(newState);
    
    if (!newState) {
      // Stop any ongoing speech when disabling
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
      }
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
      }
    }
  };

  const startListening = () => {
    if (!recognitionRef.current || !speechSupported || disabled) return;
    
    // Stop any ongoing speech first
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
  };

  const speakText = (text: string) => {
    if (!synthesisSupported || !selectedVoice) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;
    
    // Configure utterance for calm, therapeutic delivery
    utterance.voice = selectedVoice;
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      console.log('🔊 Started speaking');
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      console.log('🔊 Finished speaking');
    };
    
    utterance.onerror = (event) => {
      console.error('🔊 Speech synthesis error:', event.error);
      setIsSpeaking(false);
      setIsPaused(false);
    };
    
    speechSynthesis.speak(utterance);
  };

  const toggleSpeech = () => {
    if (!isSpeaking) return;
    
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
    } else {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const stopSpeech = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  if (!speechSupported && !synthesisSupported) {
    return (
      <div className="text-center p-4 text-white/60 text-sm">
        Voice features not supported in this browser
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 enhanced-card-bg rounded-lg border border-white/20">
      {/* Voice Mode Toggle */}
      <Button
        onClick={toggleVoiceMode}
        variant={voiceEnabled ? "default" : "outline"}
        size="sm"
        className={`transition-all ${
          voiceEnabled 
            ? 'bg-green-600/90 hover:bg-green-700/90 border-green-400/50' 
            : 'bg-white/10 hover:bg-white/20 border-white/30'
        }`}
      >
        {voiceEnabled ? (
          <>
            <Volume2 className="w-4 h-4 mr-1" />
            Voice On
          </>
        ) : (
          <>
            <VolumeX className="w-4 h-4 mr-1" />
            Voice Off
          </>
        )}
      </Button>

      {voiceEnabled && (
        <>
          {/* Microphone Control */}
          {speechSupported && (
            <Button
              onClick={isRecording ? stopListening : startListening}
              disabled={disabled || isSpeaking}
              variant="outline"
              size="sm"
              className={`transition-all ${
                isRecording 
                  ? 'bg-red-600/90 hover:bg-red-700/90 border-red-400/50 animate-pulse' 
                  : 'bg-blue-600/90 hover:bg-blue-700/90 border-blue-400/50'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-1" />
                  Speak
                </>
              )}
            </Button>
          )}

          {/* Speech Control */}
          {synthesisSupported && isSpeaking && (
            <>
              <Button
                onClick={toggleSpeech}
                variant="outline"
                size="sm"
                className="bg-orange-600/90 hover:bg-orange-700/90 border-orange-400/50"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </>
                )}
              </Button>
              
              <Button
                onClick={stopSpeech}
                variant="outline"
                size="sm"
                className="bg-red-600/90 hover:bg-red-700/90 border-red-400/50"
              >
                Stop
              </Button>
            </>
          )}
        </>
      )}

      {/* Status Indicator */}
      {voiceEnabled && (
        <div className="text-xs text-white/70 ml-2">
          {isRecording && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              Listening...
            </span>
          )}
          {isSpeaking && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Speaking...
            </span>
          )}
          {!isRecording && !isSpeaking && 'Ready'}
        </div>
      )}
    </div>
  );
}
