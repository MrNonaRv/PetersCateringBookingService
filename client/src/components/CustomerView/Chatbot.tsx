import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  featured: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
}

interface ChatbotProps {
  services: Service[];
}

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  suggestions?: string[];
}

export default function Chatbot({ services }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello! I'm Peter's Creation assistant. I can help you learn about our catering services, pricing, and booking process. How can I assist you today?",
      isBot: true,
      timestamp: new Date(),
      suggestions: ["What services do you offer?", "How much does catering cost?", "How do I make a booking?", "What payment methods do you accept?"]
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch payment methods
  const { data: paymentMethods } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const formatPrice = (priceInCents: number) => {
    return `₱${Math.round(priceInCents / 100).toLocaleString("en-PH")}`;
  };

  const getResponse = (userMessage: string): { text: string; suggestions?: string[] } => {
    const message = userMessage.toLowerCase();

    // Services inquiry
    if (message.includes("service") || message.includes("what do you offer") || message.includes("what can you do")) {
      const servicesList = services.map(s => `• ${s.name} - Starting at ${formatPrice(s.basePrice)} per person`).join("\n");
      return {
        text: `We offer a variety of catering services:\n\n${servicesList}\n\nEach service includes professional setup, quality ingredients, and experienced staff. Would you like to know more about any specific service?`,
        suggestions: ["Tell me about wedding receptions", "Corporate event pricing", "How do I book a service?", "What's included in each package?"]
      };
    }

    // Pricing inquiry
    if (message.includes("price") || message.includes("cost") || message.includes("budget") || message.includes("how much")) {
      return {
        text: `Our pricing varies based on the service and guest count:\n\n• Wedding Receptions: ${formatPrice(services.find(s => s.name.includes("Wedding"))?.basePrice || 120000)} per person\n• Corporate Events: ${formatPrice(services.find(s => s.name.includes("Corporate"))?.basePrice || 80000)} per person\n• Private Parties: ${formatPrice(services.find(s => s.name.includes("Private"))?.basePrice || 60000)} per person\n\nPrices include food, service staff, and basic setup. Additional services and decorations are available. You can use our Budget Inquiry tool to find packages that fit your budget!`,
        suggestions: ["Check budget packages", "What's included?", "Payment options", "How to get a quote"]
      };
    }

    // Booking inquiry
    if (message.includes("book") || message.includes("reservation") || message.includes("how to order") || message.includes("make an appointment")) {
      return {
        text: `Booking with us is simple and secure:\n\n1. Select your preferred service or package\n2. Choose your event date and provide details\n3. Submit your booking request for approval\n4. Once approved, pay the 50% downpayment to secure your date\n5. The remaining balance is due before the event\n\nWe'll review your request and get back to you within 24 hours!`,
        suggestions: ["Start booking now", "Check availability", "Deposit requirements", "How far in advance?"]
      };
    }

    // Payment methods
    if (message.includes("payment") || message.includes("pay") || message.includes("gcash") || message.includes("bank")) {
      const methods = paymentMethods?.map(m => m.name).join(", ") || "GCash, PayMaya, and Bank Transfer";
      return {
        text: `We accept secure payments via ${methods}.\n\nA 50% downpayment is required to confirm your booking after approval. The remaining balance can be paid before your event date. All transactions are verified by our team.`,
        suggestions: ["How to pay deposit", "Is it secure?", "Payment schedule", "Receipts"]
      };
    }

    // Cancellation Policy
    if (message.includes("cancel") || message.includes("refund") || message.includes("policy") || message.includes("terms")) {
      return {
        text: `Our cancellation policy ensures fairness for both parties:\n\n• Deposits secure your date and are generally non-refundable if cancelled close to the event.\n• Cancellations made well in advance may be eligible for partial refunds or rescheduling.\n• Please contact us immediately if you need to make changes to your booking.\n\nFor full details, please review our Terms & Conditions page.`,
        suggestions: ["Contact support", "Reschedule event", "Terms & Conditions", "Force Majeure"]
      };
    }

    // Location & Contact
    if (message.includes("location") || message.includes("where") || message.includes("address") || message.includes("contact") || message.includes("call")) {
      return {
        text: `You can reach Peter's Creation Catering at:\n\n📍 Address: Casa Amparo, Local City\n📞 Phone: 0917-123-4567\n📧 Email: info@peterscreation.com\n\nOffice Hours: Monday - Saturday, 9:00 AM - 6:00 PM\n\nFeel free to visit us for a food tasting or consultation!`,
        suggestions: ["Book consultation", "Get directions", "Email us", "Call now"]
      };
    }

    // Menu and food
    if (message.includes("menu") || message.includes("food") || message.includes("dish") || message.includes("cuisine")) {
      return {
        text: `Our menus feature delicious Filipino cuisine with international options:\n\n• Traditional Filipino dishes\n• International cuisine\n• Buffet or plated service\n• Vegetarian and special dietary options\n• Custom menu creation available\n\nWe use fresh, quality ingredients and can accommodate dietary restrictions. Our chefs can also create custom menus for your event theme and preferences.`,
        suggestions: ["Special dietary needs", "Custom menu options", "Buffet vs plated service", "Sample menu"]
      };
    }

    // Contact and location
    if (message.includes("contact") || message.includes("phone") || message.includes("email") || message.includes("address") || message.includes("location")) {
      return {
        text: `You can reach us through:\n\n📍 Address: 123 Culinary Lane, Gourmet City, GC 12345\n📞 Phone: (555) 123-4567\n📧 Email: info@peterscreation.com\n\n🕒 Business Hours:\nMon-Fri: 9am-5pm\nSat: 10am-3pm\nSun: Closed\n\nWe're here to help with all your catering needs!`,
        suggestions: ["Schedule consultation", "Visit our location", "Get a quote", "Emergency contact"]
      };
    }

    // Event types
    if (message.includes("wedding") || message.includes("corporate") || message.includes("birthday") || message.includes("event")) {
      return {
        text: `We cater all types of events:\n\n🎭 Weddings & Receptions - Make your special day memorable\n🏢 Corporate Events - Professional catering for business functions\n🎉 Birthday Parties - Celebrate with delicious food\n👨‍👩‍👧‍👦 Family Gatherings - Bring loved ones together\n🎓 Graduations - Honor achievements with great food\n🎊 Special Occasions - Any celebration, we've got you covered\n\nEach event is customized to your needs and preferences.`,
        suggestions: ["Wedding packages", "Corporate catering", "Party planning", "Custom events"]
      };
    }

    // Availability and timing
    if (message.includes("available") || message.includes("when") || message.includes("schedule") || message.includes("date")) {
      return {
        text: `We're available throughout the year for your events:\n\n• Advance booking recommended (2-4 weeks minimum)\n• Peak seasons (December, June-August) book quickly\n• Weekends are popular - book early\n• We can accommodate morning, afternoon, or evening events\n\nTo check specific date availability, please use our booking system or contact us directly. What date did you have in mind?`,
        suggestions: ["Check date availability", "Book consultation", "Peak season info", "Flexible dates"]
      };
    }

    // General greetings
    if (message.includes("hello") || message.includes("hi") || message.includes("good morning") || message.includes("good afternoon")) {
      return {
        text: `Hello! Welcome to Peter's Creation Catering Services. We're delighted to help you create memorable events with exceptional food and service. What would you like to know about our catering services?`,
        suggestions: ["Browse services", "Get pricing info", "Make a booking", "Contact us"]
      };
    }

    // Thank you
    if (message.includes("thank") || message.includes("thanks")) {
      return {
        text: `You're very welcome! We're here to make your event planning as smooth as possible. Is there anything else you'd like to know about our catering services?`,
        suggestions: ["Make a booking", "Get more info", "Contact us", "Browse gallery"]
      };
    }

    // Default response
    return {
      text: `I'd be happy to help you with information about our catering services! I can assist with:\n\n• Service offerings and pricing\n• Booking process and requirements\n• Menu options and customization\n• Payment methods\n• Contact information\n• Event planning advice\n\nWhat specific information are you looking for?`,
      suggestions: ["Our services", "Pricing info", "How to book", "Menu options", "Contact details"]
    };
  };

  const simulateTyping = (): Promise<void> => {
    return new Promise((resolve) => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        resolve();
      }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
    });
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");

    // Simulate typing and get response
    await simulateTyping();

    const response = getResponse(text);
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: response.text,
      isBot: true,
      timestamp: new Date(),
      suggestions: response.suggestions
    };

    setMessages(prev => [...prev, botMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <>
      {/* Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]">
          <Card className="shadow-2xl border-primary/20">
            <CardHeader className="pb-3 bg-primary text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bot className="h-5 w-5" />
                  Peter's Creation Assistant
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/10 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Online - Ready to help!
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-80 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.isBot ? "justify-start" : "justify-end"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2",
                          message.isBot
                            ? "bg-gray-100 text-gray-800"
                            : "bg-primary text-white"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {message.isBot && (
                            <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm whitespace-pre-line">{message.text}</p>
                            <span className="text-xs opacity-70 mt-1 block">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!message.isBot && (
                            <User className="h-4 w-4 mt-1 flex-shrink-0" />
                          )}
                        </div>

                        {/* Suggestions */}
                        {message.suggestions && (
                          <div className="mt-2 space-y-1">
                            {message.suggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="text-xs h-7 mr-1 mb-1 bg-white hover:bg-primary hover:text-white border-primary/30"
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-[80%]">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about our catering services..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Ask about services, pricing, booking, or anything else!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
