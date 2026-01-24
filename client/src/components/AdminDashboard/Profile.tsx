import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AdminProfile() {
  const { user } = useAuth();

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-lg font-medium">Profile</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-base font-medium">{user?.name ?? "—"}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-base font-medium">{user?.email ?? "—"}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="text-base font-medium">{user?.role ?? "Admin"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
