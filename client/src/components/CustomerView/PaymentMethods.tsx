import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, CreditCard, Building2, Banknote, ExternalLink } from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  details?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    instructions?: string;
  };
}

interface PaymentMethodsProps {
  selectedMethod?: string;
  onSelectMethod?: (method: PaymentMethod) => void;
  showSelection?: boolean;
  collapsed?: boolean;
}

export function PaymentMethods({ selectedMethod, onSelectMethod, showSelection = false, collapsed = false, className = "" }: PaymentMethodsProps & { className?: string }) {
  const { data: paymentMethods, isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const [isExpanded, setIsExpanded] = useState(!collapsed);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "smartphone":
        return <Smartphone className="w-8 h-8" />;
      case "credit-card":
        return <CreditCard className="w-8 h-8" />;
      case "building-2":
        return <Building2 className="w-8 h-8" />;
      case "banknote":
        return <Banknote className="w-8 h-8" />;
      default:
        return <CreditCard className="w-8 h-8" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "digital_wallet":
        return "bg-blue-100 text-blue-800";
      case "bank_transfer":
        return "bg-green-100 text-green-800";
      case "cash":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className={`py-16 ${className}`}>
        <div className={showSelection ? "" : "container mx-auto px-4"}>
          {!showSelection && <h2 className="text-3xl font-bold text-center mb-12">Payment Options</h2>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-300 rounded-lg h-48"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!paymentMethods || paymentMethods.length === 0) {
    return (
      <div className={`py-16 ${className}`}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Payment Options</h2>
          <p className="text-gray-600">Payment methods are currently being updated.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${showSelection ? 'py-4' : 'py-16'} ${className}`}>
      <div className={showSelection ? "" : "container mx-auto px-4"}>
        {!showSelection && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Convenient Payment Options</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from multiple payment methods for your catering booking. We support popular Filipino payment options for your convenience.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(isExpanded ? paymentMethods : paymentMethods.filter(m => m.id === selectedMethod)).map((method) => (
            <Card 
              key={method.id} 
              className={`cursor-pointer transition-all duration-200 relative overflow-hidden ${
                showSelection && selectedMethod === method.id 
                  ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-md scale-[1.02]' 
                  : 'hover:border-primary/50 hover:shadow-md'
              }`}
              onClick={() => showSelection && onSelectMethod && onSelectMethod(method)}
            >
              {showSelection && selectedMethod === method.id && (
                <div className="absolute top-0 right-0 bg-primary text-white p-1 rounded-bl-lg z-10">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className={`flex justify-center mb-4 ${showSelection && selectedMethod === method.id ? 'text-primary' : 'text-gray-500'}`}>
                  {getIcon(method.icon)}
                </div>
                <CardTitle className="text-lg font-bold">{method.name}</CardTitle>
                <Badge variant="outline" className={`mt-2 ${getTypeColor(method.type)}`}>
                  {method.type.replace('_', ' ').toUpperCase()}
                </Badge>
              </CardHeader>

              <CardContent className="text-center pt-2">
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {method.description}
                </p>

                {method.details && (
                  <div className="space-y-2 text-xs bg-gray-50 p-3 rounded-lg text-left">
                    {method.details.accountName && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Name:</span> 
                        <span className="font-medium">{method.details.accountName}</span>
                      </div>
                    )}
                    {method.details.bankName && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Bank:</span> 
                        <span className="font-medium">{method.details.bankName}</span>
                      </div>
                    )}
                    {method.details.accountNumber && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-500">Acct #:</span> 
                        <span className="font-medium font-mono">{method.details.accountNumber}</span>
                      </div>
                    )}
                  </div>
                )}

                {!showSelection && method.type === "digital_wallet" && (
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    Learn More <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {!isExpanded && showSelection && (
          <div className="mt-6 text-center">
             <Button variant="outline" onClick={() => setIsExpanded(true)}>
               Show Other Payment Options
             </Button>
          </div>
        )}

        {!showSelection && (
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              All payment methods are secure and encrypted. For bank transfers, please allow 1-2 business days for verification. 
              Digital wallet payments are processed instantly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}