import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { type FileFolder, type File } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  FolderPlus,
  Upload,
  Folder,
  FileIcon,
  ChevronLeft,
  Trash2,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Files() {
  const { toast } = useToast();
  const [currentFolderId, setCurrentFolderId] = useState<number | undefined>(undefined);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { data: folders } = useQuery<FileFolder[]>({
    queryKey: ["/api/folders", currentFolderId],
    queryFn: () =>
      fetch(`/api/folders?${currentFolderId ? `parentId=${currentFolderId}` : ''}`).then(r => r.json())
  });

  const { data: files } = useQuery<File[]>({
    queryKey: ["/api/files", currentFolderId],
    queryFn: () =>
      fetch(`/api/files?${currentFolderId ? `folderId=${currentFolderId}` : ''}`).then(r => r.json())
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("POST", "/api/folders", {
        name,
        parentId: currentFolderId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders", currentFolderId] });
      setNewFolderName("");
      setIsNewFolderDialogOpen(false);
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create folder",
      });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload file");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files", currentFolderId] });
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload file",
      });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/folders/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/folders", currentFolderId] });
      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete folder",
      });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/files/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files", currentFolderId] });
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete file",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = file.webkitRelativePath || file.name;
      formData.append("files", file);
      formData.append("paths", relativePath);
    }

    if (currentFolderId) {
      formData.append("folderId", currentFolderId.toString());
    }

    uploadFileMutation.mutate(formData);
    event.target.value = "";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {currentFolderId && (
              <Button
                variant="outline"
                onClick={() => setCurrentFolderId(undefined)}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <h1 className="text-3xl font-bold">File Manager</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => window.location.href = `/api/files/download-all${currentFolderId ? `?folderId=${currentFolderId}` : ''}`}
            >
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
            <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Folder Name</Label>
                    <Input
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder name"
                    />
                  </div>
                  <Button
                    onClick={() => createFolderMutation.mutate(newFolderName)}
                    disabled={!newFolderName || createFolderMutation.isPending}
                  >
                    {createFolderMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="relative">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                webkitdirectory="true"
                multiple
              />
              <Upload className="h-4 w-4 mr-2" />
              Upload Folder
            </Button>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {folders?.map((folder) => (
            <TableRow key={`folder-${folder.id}`}>
              <TableCell>
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <Folder className="h-4 w-4 mr-2 text-blue-500" />
                  {folder.name}
                </Button>
              </TableCell>
              <TableCell>Folder</TableCell>
              <TableCell>-</TableCell>
              <TableCell>{format(new Date(folder.createdAt), "PPP")}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteFolderMutation.mutate(folder.id)}
                  disabled={deleteFolderMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {files?.map((file) => (
            <TableRow key={`file-${file.id}`}>
              <TableCell className="flex items-center">
                <FileIcon className="h-4 w-4 mr-2 text-gray-500" />
                {file.name}
              </TableCell>
              <TableCell>{file.type}</TableCell>
              <TableCell>{Math.round(file.size / 1024)} KB</TableCell>
              <TableCell>{format(new Date(file.createdAt), "PPP")}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => window.location.href = `/api/files/${file.id}/download`}
                  >
                    <Download className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFileMutation.mutate(file.id)}
                    disabled={deleteFileMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {(!folders?.length && !files?.length) && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                This folder is empty
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}