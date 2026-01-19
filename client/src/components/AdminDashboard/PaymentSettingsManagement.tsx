import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, CreditCard, Smartphone, Building2, Banknote } from "lucide-react";

interface PaymentSetting {
  id: number;
  paymentMethod: string;
  accountName: string;
  accountNumber: string;
  isActive: boolean;
  instructions: string | null;
  updatedAt: string;
}

const PAYMENT_METHODS = [
  { id: "gcash", label: "GCash", icon: Smartphone, color: "bg-blue-500" },
  { id: "paymaya", label: "PayMaya / Maya", icon: Smartphone, color: "bg-green-500" },
  { id: "bank_bdo", label: "BDO Bank Transfer", icon: Building2, color: "bg-yellow-600" },
  { id: "bank_bpi", label: "BPI Bank Transfer", icon: Building2, color: "bg-red-600" },
  { id: "cash", label: "Cash Payment", icon: Banknote, color: "bg-gray-600" },
];

export default function PaymentSettingsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [savingMethod, setSavingMethod] = useState<string | null>(null);

  const { data: settings = [], isLoading } = useQuery<PaymentSetting[]>({
    queryKey: ["/api/payment-settings"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { paymentMethod: string; accountName: string; accountNumber: string; isActive: boolean; instructions: string }) => {
      const res = await apiRequest("POST", "/api/payment-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-settings"] });
      toast({
        title: "Settings Saved",
        description: "Payment account settings have been updated.",
      });
      setSavingMethod(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save payment settings.",
        variant: "destructive",
      });
      setSavingMethod(null);
    },
  });

  const getSettingForMethod = (methodId: string) => {
    return settings.find((s) => s.paymentMethod === methodId);
  };

  const handleSave = (methodId: string, form: HTMLFormElement) => {
    const formData = new FormData(form);
    setSavingMethod(methodId);
    
    saveMutation.mutate({
      paymentMethod: methodId,
      accountName: formData.get("accountName") as string || "",
      accountNumber: formData.get("accountNumber") as string || "",
      isActive: formData.get("isActive") === "on",
      instructions: formData.get("instructions") as string || "",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
          <p className="text-gray-500">Configure your payment accounts for customer transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {PAYMENT_METHODS.map((method) => {
          const setting = getSettingForMethod(method.id);
          const Icon = method.icon;
          
          return (
            <Card key={method.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${method.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{method.label}</CardTitle>
                      <CardDescription>
                        {setting ? "Configured" : "Not configured"}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave(method.id, e.currentTarget);
                  }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${method.id}-active`}>Active</Label>
                    <Switch
                      id={`${method.id}-active`}
                      name="isActive"
                      defaultChecked={setting?.isActive ?? true}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${method.id}-name`}>Account Name</Label>
                    <Input
                      id={`${method.id}-name`}
                      name="accountName"
                      placeholder={method.id === "cash" ? "e.g., Peter Santos" : "e.g., PETER C. SANTOS"}
                      defaultValue={setting?.accountName || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${method.id}-number`}>
                      {method.id.startsWith("bank_") ? "Account Number" : 
                       method.id === "cash" ? "Contact Number" : "Mobile Number"}
                    </Label>
                    <Input
                      id={`${method.id}-number`}
                      name="accountNumber"
                      placeholder={
                        method.id === "gcash" || method.id === "paymaya" ? "09XX XXX XXXX" :
                        method.id.startsWith("bank_") ? "1234-5678-9012" :
                        "09XX XXX XXXX"
                      }
                      defaultValue={setting?.accountNumber || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${method.id}-instructions`}>Additional Instructions</Label>
                    <Textarea
                      id={`${method.id}-instructions`}
                      name="instructions"
                      placeholder="Optional: Add any special instructions for this payment method"
                      defaultValue={setting?.instructions || ""}
                      rows={2}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={savingMethod === method.id}
                  >
                    {savingMethod === method.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save {method.label}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-medium text-blue-800 mb-2">How it works</h3>
          <p className="text-sm text-blue-700">
            When you approve a booking and send an SMS notification, your configured payment account details 
            will be included in the message. Customers will see the account name and number for the selected 
            payment method, making it easy for them to send their deposit.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
