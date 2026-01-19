import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dish } from "@shared/schema";
import { insertDishSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  LayoutDashboard,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MENU_CATEGORIES = [
  { value: "pork", label: "Pork Menu" },
  { value: "chicken", label: "Chicken Menu" },
  { value: "beef", label: "Beef Menu" },
  { value: "fish", label: "Fish Menu" },
  { value: "appetizer", label: "Appetizers (Pasta/Vegetables)" },
  { value: "dessert", label: "Dessert" },
  { value: "standard_inclusion", label: "Standard Inclusions" },
  { value: "amenity", label: "Freebies (Amenities)" },
];

export default function AdminDishes() {
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Controlled Dialog state
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dishes, isLoading } = useQuery<Dish[]>({
    queryKey: ["/api/dishes"],
  });

  const form = useForm({
    resolver: zodResolver(insertDishSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "pork",
      tags: [],
      imageUrl: "",
      additionalCost: 0,
      isAvailable: true,
      sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/dishes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      toast({ title: "Success", description: "Dish created successfully" });
      setIsDialogOpen(false); // Close dialog on success
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/dishes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      toast({ title: "Success", description: "Dish updated successfully" });
      setIsDialogOpen(false); // Close dialog on success
      setEditingDish(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/dishes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      toast({ title: "Success", description: "Dish deleted successfully" });
    },
  });

  // Helper to open dialog for NEW dish
  const handleAddNew = () => {
    setEditingDish(null);
    form.reset({
      name: "",
      description: "",
      category: "pork",
      tags: [],
      imageUrl: "",
      additionalCost: 0,
      isAvailable: true,
      sortOrder: 0,
    });
    setIsDialogOpen(true);
  };

  // Helper to open dialog for EDITING dish
  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    form.reset(dish);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-primary">Menu Management</h1>
        </div>
        <Button onClick={handleAddNew} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingDish ? "Edit Menu Item" : "Add New Menu Item"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => {
                if (editingDish) {
                  updateMutation.mutate({ id: editingDish.id, data });
                } else {
                  createMutation.mutate(data);
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter dish name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MENU_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter description" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {editingDish ? "Update Menu Item" : "Create Menu Item"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {MENU_CATEGORIES.map((category) => {
        const categoryDishes = dishes?.filter((d) => d.category === category.value) || [];
        if (categoryDishes.length === 0 && !isLoading) return null;

        return (
          <div key={category.value} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-700 border-b pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary p-2 rounded-lg">
                  <LayoutDashboard className="h-5 w-5" />
                </span>
                {category.label}
                <span className="text-sm font-normal text-gray-400 ml-2">
                  ({categoryDishes.length} items)
                </span>
              </div>
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryDishes.map((dish) => (
                <div key={dish.id} className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{dish.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{dish.description}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={() => handleEdit(dish)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${dish.name}"?`)) {
                            deleteMutation.mutate(dish.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}