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
}

export function PaymentMethods({ selectedMethod, onSelectMethod, showSelection = false }: PaymentMethodsProps) {
  const { data: paymentMethods, isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

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
      <div className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Payment Options</h2>
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
      <div className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Payment Options</h2>
          <p className="text-gray-600">Payment methods are currently being updated.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Convenient Payment Options</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from multiple payment methods for your catering booking. We support popular Filipino payment options for your convenience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paymentMethods.map((method) => (
            <Card 
              key={method.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                showSelection && selectedMethod === method.id 
                  ? 'ring-2 ring-blue-500 border-blue-500' 
                  : 'hover:border-gray-300'
              }`}
              onClick={() => showSelection && onSelectMethod && onSelectMethod(method)}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4 text-blue-600">
                  {getIcon(method.icon)}
                </div>
                <CardTitle className="text-lg font-bold">{method.name}</CardTitle>
                <Badge variant="outline" className={getTypeColor(method.type)}>
                  {method.type.replace('_', ' ').toUpperCase()}
                </Badge>
              </CardHeader>
              
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  {method.description}
                </p>
                
                {method.details && (
                  <div className="space-y-2 text-xs bg-gray-50 p-3 rounded-lg">
                    {method.details.accountName && (
                      <div>
                        <span className="font-medium">Account Name:</span> {method.details.accountName}
                      </div>
                    )}
                    {method.details.bankName && (
                      <div>
                        <span className="font-medium">Bank:</span> {method.details.bankName}
                      </div>
                    )}
                    {method.details.accountNumber && (
                      <div>
                        <span className="font-medium">Account #:</span> {method.details.accountNumber}
                      </div>
                    )}
                    {method.details.instructions && (
                      <div className="text-orange-600 font-medium">
                        {method.details.instructions}
                      </div>
                    )}
                  </div>
                )}
                
                {showSelection && (
                  <Button 
                    variant={selectedMethod === method.id ? "default" : "outline"}
                    className="w-full mt-4"
                    onClick={() => onSelectMethod && onSelectMethod(method)}
                  >
                    {selectedMethod === method.id ? "Selected" : "Select"}
                  </Button>
                )}
                
                {!showSelection && method.type === "digital_wallet" && (
                  <Button variant="outline" size="sm" className="mt-4">
                    Learn More <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
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