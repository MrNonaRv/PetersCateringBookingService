import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react";

export default function CustomersManagement() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['/api/bookings'],
    queryFn: async () => {
      const res = await fetch('/api/bookings');
      if (!res.ok) {
        throw new Error('Failed to fetch bookings');
      }
      return res.json();
    },
  });

  // Extract unique customers from bookings
  const customers = bookings ? 
    bookings.reduce((acc: any[], booking: any) => {
      // Check if customer with this email already exists in our accumulated array
      const exists = acc.some(c => c.email === booking.customer.email);
      // If not, add it to our accumulator
      if (!exists) {
        acc.push(booking.customer);
      }
      return acc;
    }, [])
    : [];

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b">
        <CardTitle className="text-lg font-medium">Customer Management</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton loading
                Array(5).fill(0).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : (
                customers.map((customer: any) => {
                  // Count how many bookings this customer has
                  const customerBookings = bookings.filter((booking: any) => 
                    booking.customer.email === customer.email
                  ).length;
                  
                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.company || "-"}</TableCell>
                      <TableCell>{customerBookings}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}