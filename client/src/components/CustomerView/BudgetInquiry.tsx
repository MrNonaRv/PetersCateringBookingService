import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Calendar, CheckCircle } from "lucide-react";

interface Service {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  featured: boolean;
}

interface BudgetInquiryProps {
  services: Service[];
  onSelectService: (serviceId: number) => void;
  onCustomInquiry: () => void;
}

const budgetRanges = [
  { id: "budget", label: "Budget-Friendly", min: 25000, max: 50000, color: "bg-green-100 text-green-800" },
  { id: "standard", label: "Standard", min: 50000, max: 100000, color: "bg-blue-100 text-blue-800" },
  { id: "premium", label: "Premium", min: 100000, max: 150000, color: "bg-purple-100 text-purple-800" },
  { id: "luxury", label: "Luxury", min: 150000, max: 300000, color: "bg-gold-100 text-gold-800" }
];

const packageInclusions = {
  budget: [
    "Basic catering service",
    "Standard menu options", 
    "Basic table setup",
    "2-hour service",
    "Disposable tableware"
  ],
  standard: [
    "Full catering service",
    "Expanded menu selection",
    "Professional table setup", 
    "4-hour service",
    "Quality tableware",
    "Basic decorations"
  ],
  premium: [
    "Premium catering service",
    "Gourmet menu options",
    "Elegant table settings",
    "6-hour service",
    "Premium tableware",
    "Custom decorations",
    "Dedicated service staff"
  ],
  luxury: [
    "Luxury catering experience",
    "Chef's special menu",
    "Designer table arrangements",
    "Full-day service",
    "Fine dining tableware",
    "Premium decorations",
    "Personal event coordinator",
    "Live cooking stations"
  ]
};

export default function BudgetInquiry({ services, onSelectService, onCustomInquiry }: BudgetInquiryProps) {
  const [budget, setBudget] = useState(75000);
  const [guestCount, setGuestCount] = useState(50);
  const [selectedRange, setSelectedRange] = useState("standard");
  const [recommendations, setRecommendations] = useState<Service[]>([]);

  const formatPrice = (priceInCents: number) => {
    return `₱${Math.round(priceInCents / 100).toLocaleString("en-PH")}`;
  };

  const calculateTotalCost = (service: Service, guests: number) => {
    return Math.round((service.basePrice * guests) / 100);
  };

  useEffect(() => {
    // Filter services based on budget and guest count
    const filteredServices = services.filter(service => {
      const totalCost = calculateTotalCost(service, guestCount);
      return totalCost <= budget;
    });

    setRecommendations(filteredServices.slice(0, 3)); // Show top 3 recommendations

    // Update selected range based on budget
    const range = budgetRanges.find(r => budget >= r.min && budget <= r.max);
    if (range) {
      setSelectedRange(range.id);
    }
  }, [budget, guestCount, services]);

  const handleBudgetRangeSelect = (rangeId: string) => {
    const range = budgetRanges.find(r => r.id === rangeId);
    if (range) {
      setSelectedRange(rangeId);
      setBudget(range.min);
    }
  };

  const currentRange = budgetRanges.find(r => r.id === selectedRange);
  const currentInclusions = packageInclusions[selectedRange as keyof typeof packageInclusions];

  return (
    <section id="budget-inquiry" className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-primary mb-4">Find Your Perfect Package</h2>
          <p className="text-[#343a40] max-w-2xl mx-auto">
            Tell us your budget and guest count, and we'll recommend the best catering packages for your event
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Budget Configuration */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary" />
                Configure Your Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Budget Range Selector */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Budget Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  {budgetRanges.map((range) => (
                    <Button
                      key={range.id}
                      variant={selectedRange === range.id ? "default" : "outline"}
                      onClick={() => handleBudgetRangeSelect(range.id)}
                      className="justify-start p-3 h-auto"
                    >
                      <div className="text-left">
                        <div className="font-semibold">{range.label}</div>
                        <div className="text-sm opacity-70">
                          ₱{(range.min / 1000).toFixed(0)}K - ₱{(range.max / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Budget Slider */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-base font-semibold">Custom Budget</Label>
                  <Badge variant="secondary" className="text-lg font-bold">
                    ₱{(budget / 1000).toFixed(0)}K
                  </Badge>
                </div>
                <Slider
                  value={[budget]}
                  onValueChange={([value]) => setBudget(value)}
                  max={300000}
                  min={25000}
                  step={5000}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>₱25K</span>
                  <span>₱300K</span>
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  <Users className="inline h-4 w-4 mr-1" />
                  Number of Guests
                </Label>
                <Input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value) || 50)}
                  min={10}
                  max={500}
                  className="text-lg font-semibold"
                />
              </div>
            </CardContent>
          </Card>

          {/* Package Overview */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Your {currentRange?.label} Package
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Budget Range:</span>
                  <Badge className={currentRange?.color}>
                    ₱{((currentRange?.min || 0) / 1000).toFixed(0)}K - ₱{((currentRange?.max || 0) / 1000).toFixed(0)}K
                  </Badge>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Package Includes:</h4>
                  <ul className="space-y-2">
                    {currentInclusions?.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Estimated Cost per Person:</span>
                    <span className="text-lg font-bold text-secondary">
                      ₱{(budget / guestCount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Budget:</span>
                    <span className="text-xl font-bold text-primary">₱{budget.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Services */}
        {recommendations.length > 0 && (
          <div>
            <h3 className="text-2xl font-heading font-bold text-primary mb-6 text-center">
              Recommended Services Within Your Budget
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {recommendations.map((service) => {
                const totalCost = calculateTotalCost(service, guestCount);
                const savings = budget - totalCost;

                return (
                  <Card key={service.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="relative">
                      <img 
                        src={service.imageUrl} 
                        alt={service.name}
                        className="w-full h-48 object-cover"
                      />
                      {savings > 0 && (
                        <Badge className="absolute top-2 right-2 bg-green-600">
                          Save ₱{savings.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h4 className="text-lg font-heading font-bold text-primary mb-2">{service.name}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{service.description}</p>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span>Per Person:</span>
                          <span className="font-semibold">{formatPrice(service.basePrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total for {guestCount} guests:</span>
                          <span className="font-bold text-secondary">₱{totalCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Within budget:</span>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      </div>

                      <Button 
                        onClick={() => onSelectService(service.id)}
                        className="w-full bg-primary hover:bg-secondary transition-colors"
                      >
                        Select This Service
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* No Recommendations */}
        {recommendations.length === 0 && services.length > 0 && (
          <Card className="text-center p-8 bg-orange-50 border-orange-200">
            <div className="space-y-4">
              <Calendar className="h-12 w-12 text-orange-500 mx-auto" />
              <h3 className="text-xl font-heading font-bold text-orange-800">
                No Services Match Your Current Budget
              </h3>
              <p className="text-orange-600 max-w-md mx-auto">
                Consider increasing your budget or reducing the guest count. 
                Alternatively, contact us for a custom package within your budget.
              </p>
              <div className="flex justify-center gap-4 pt-4">
                <Button 
                  onClick={() => setBudget(budget + 25000)}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Increase Budget by ₱25K
                </Button>
                <Button 
                  onClick={onCustomInquiry}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Custom Inquiry
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-heading font-bold text-primary mb-4">
              Need a Custom Package?
            </h3>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Let us create a personalized catering package 
              that fits your specific budget and requirements.
            </p>
            <Button 
              onClick={onCustomInquiry}
              size="lg"
              className="bg-secondary hover:bg-secondary/90 text-white px-8 py-3"
            >
              Request Custom Quote
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
