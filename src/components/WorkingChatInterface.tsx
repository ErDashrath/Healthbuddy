import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Brain, Heart, Users } from "lucide-react";

interface ThemeColors {
  text: string;
  cardBg: string;
  buttonBg: string;
  border: string;
}

interface ChatInterfaceProps {
  themeColors?: ThemeColors;
}

const quickStartSuggestions = [
  {
    icon: Brain,
    title: "Stress Management",
    description: "Learn techniques to manage daily stress",
  },
  {
    icon: Heart,
    title: "Emotional Wellness", 
    description: "Explore your feelings in a safe space",
  },
  {
    icon: Users,
    title: "Relationship Support",
    description: "Navigate relationship challenges",
  }
];

export default function WorkingChatInterface({ themeColors }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{id: string, content: string, sender: 'user' | 'ai'}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? "smooth" : "auto",
        block: "nearest"
      });
    }
  };

  useEffect(() => {
    // Only auto-scroll if user is near the bottom
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest('.overflow-y-auto');
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom || isLoading) {
          scrollToBottom();
        }
      }
    }
  }, [messages, isLoading]);

  const colors = themeColors || {
    text: 'text-white',
    cardBg: 'bg-card/40',
    buttonBg: 'bg-card/30',
    border: 'border-border'
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      content: message,
      sender: 'user' as const
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = message; // Store the message before clearing
    setMessage("");
    
    // Don't set loading if already loading (allow multiple messages)
    const wasLoading = isLoading;
    if (!wasLoading) {
      setIsLoading(true);
    }
    
    // Immediately scroll to bottom when user sends message
    setTimeout(() => scrollToBottom(false), 10);

    try {
      console.log('🚀 Sending to API with session ID:', sessionId);
      
      // Use Vercel API route in production, proxy in development
      const apiEndpoint = window.location.hostname === 'localhost' 
        ? '/api/query' 
        : '/api/query';
      
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          query: currentMessage,
          sessionId: sessionId
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', data);
      
      const aiMessage = {
        id: `msg_${Date.now()}_ai`,
        content: data.answer || "No response received",
        sender: 'ai' as const
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('❌ Error:', error);
      const errorMessage = {
        id: `msg_${Date.now()}_error`,
        content: "Connection error. Please try again.",
        sender: 'ai' as const
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      if (!wasLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {messages.length > 0 ? (
        <>
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-white enhanced-text-visibility">MindCare AI Chat</h2>
              <p className="text-xs text-white/60 enhanced-text-light">
                🧠 Session active • AI remembers our conversation • {messages.length} messages
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isLoading ? (
                <div className="flex items-center gap-2 text-white/70">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs">AI is thinking...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white/60">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs">Ready</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Messages Area - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <div className="max-w-4xl mx-auto space-y-4 pb-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-lg enhanced-card-bg ${msg.sender === 'user' ? 'border-blue-400/50' : 'border-gray-600/50'} border`}>
                    <p className="text-white enhanced-text-visibility">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="enhanced-card-bg p-4 rounded-lg border border-white/20">
                    <p className="text-white enhanced-text-visibility">🤖 AI is thinking...</p>
                  </div>
                </div>
              )}
              {/* Invisible div for auto-scrolling with some padding */}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
          
          {/* Fixed Input Area at Bottom */}
          <div className="flex-shrink-0 p-3 border-t border-white/10 bg-black/5 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto">
              <div className="enhanced-card-bg rounded-lg border border-white/20 p-3">
                <div className="relative">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isLoading ? "AI is responding... You can still type!" : "Type your message..."}
                    className="pr-12 enhanced-input"
                  />
                  <Button 
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600/90 hover:bg-blue-700/90 border border-blue-400/50 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="max-w-2xl w-full text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-white enhanced-text-visibility">🤖 MindCare AI</h1>
              <p className="text-lg text-white/90 enhanced-text-light">Your mental health companion</p>
            </div>
            
            <Card className="p-4 enhanced-card-bg shadow-2xl border border-white/20">
              <div className="relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your mental health..."
                  className="pr-12 enhanced-input"
                />
                <Button 
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600/90 hover:bg-blue-700/90 border border-blue-400/50 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-white/80 mt-2 enhanced-text-light">Press Enter to send</p>
            </Card>
            
            <div className="grid gap-4 md:grid-cols-3">
              {quickStartSuggestions.map((suggestion, index) => (
                <Card 
                  key={index}
                  onClick={() => setMessage(`Tell me about ${suggestion.title.toLowerCase()}`)}
                  className="p-4 cursor-pointer enhanced-card-bg hover:bg-white/15 transition-all duration-300 hover:scale-105 shadow-lg border border-white/20"
                >
                  <h4 className="font-medium text-white mb-2 enhanced-text-visibility">{suggestion.title}</h4>
                  <p className="text-sm text-white/90 enhanced-text-light">{suggestion.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
