import { useState, useEffect } from "react";
import { getModules, getWebsites, createModule, updateModule, deleteModule, type Module, type Website } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Blocks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ModuleManagement = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    websiteId: '',
    description: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setModules(getModules());
    setWebsites(getWebsites());
  };

  const getWebsiteName = (websiteId: string) => {
    return websites.find(w => w.id === websiteId)?.name || 'Unknown';
  };

  const handleOpenDialog = (module?: Module) => {
    if (module) {
      setEditingModule(module);
      setFormData({
        name: module.name,
        websiteId: module.websiteId,
        description: module.description || '',
      });
    } else {
      setEditingModule(null);
      setFormData({
        name: '',
        websiteId: '',
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingModule) {
      updateModule(editingModule.id, formData);
      toast({
        title: "Module updated",
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      createModule(formData);
      toast({
        title: "Module created",
        description: `${formData.name} has been created successfully.`,
      });
    }

    setDialogOpen(false);
    loadData();
  };

  const handleDelete = (module: Module) => {
    if (confirm(`Are you sure you want to delete "${module.name}"? This will also delete associated audits.`)) {
      deleteModule(module.id);
      toast({
        title: "Module deleted",
        description: `${module.name} has been deleted.`,
      });
      loadData();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Blocks className="w-5 h-5" />
              Module Management
            </CardTitle>
            <CardDescription>Manage modules for each website</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingModule ? 'Edit Module' : 'Add New Module'}</DialogTitle>
                <DialogDescription>
                  {editingModule ? 'Update module information' : 'Add a new module to a website'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website *</Label>
                  <Select
                    value={formData.websiteId}
                    onValueChange={(value) => setFormData({ ...formData, websiteId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a website" />
                    </SelectTrigger>
                    <SelectContent>
                      {websites.map(website => (
                        <SelectItem key={website.id} value={website.id}>
                          {website.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Module Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., User Login"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="e.g., Login functionality for users"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingModule ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {modules.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No modules added yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Module Name</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell className="font-medium">{module.name}</TableCell>
                  <TableCell>{getWebsiteName(module.websiteId)}</TableCell>
                  <TableCell className="max-w-xs truncate">{module.description || '-'}</TableCell>
                  <TableCell>{new Date(module.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(module)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(module)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ModuleManagement;
