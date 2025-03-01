import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Waitlist } from "@shared/schema";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function WaitlistTable() {
  const { toast } = useToast();

  const { data: entries, isLoading } = useQuery<Waitlist[]>({
    queryKey: ["/api/waitlist"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/waitlist/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/waitlist"] });
      toast({
        title: "Success",
        description: "Entry deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete entry",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Company</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries?.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>{format(new Date(entry.createdAt), "PPP")}</TableCell>
            <TableCell>{entry.name}</TableCell>
            <TableCell>{entry.email}</TableCell>
            <TableCell>{entry.company || "-"}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMutation.mutate(entry.id)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {entries?.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              No entries yet
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
