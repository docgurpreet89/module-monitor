import { useState, useEffect } from "react";
import { getWebsites, createWebsite, updateWebsite, deleteWebsite, type Website } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WebsiteManagement = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadWebsites();
  }, []);

  const loadWebsites = () => {
    setWebsites(getWebsites());
  };

  const handleOpenDialog = (website?: Website) => {
    if (website) {
      setEditingWebsite(website);
      setFormData({
        name: website.name,
        url: website.url,
      });
    } else {
      setEditingWebsite(null);
      setFormData({
        name: '',
        url: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingWebsite) {
      updateWebsite(editingWebsite.id, formData);
      toast({
        title: "Website updated",
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      createWebsite(formData);
      toast({
        title: "Website created",
        description: `${formData.name} has been created successfully.`,
      });
    }

    setDialogOpen(false);
    loadWebsites();
  };

  const handleDelete = (website: Website) => {
    if (confirm(`Are you sure you want to delete "${website.name}"? This will also delete all associated modules and audits.`)) {
      deleteWebsite(website.id);
      toast({
        title: "Website deleted",
        description: `${website.name} and its data have been deleted.`,
      });
      loadWebsites();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Website Management
            </CardTitle>
            <CardDescription>Manage websites to be audited</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Website
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingWebsite ? 'Edit Website' : 'Add New Website'}</DialogTitle>
                <DialogDescription>
                  {editingWebsite ? 'Update website information' : 'Add a new website to audit'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Website Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Acme Corp"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Website URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="e.g., https://acme.com"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingWebsite ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {websites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No websites added yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {websites.map((website) => (
                <TableRow key={website.id}>
                  <TableCell className="font-medium">{website.name}</TableCell>
                  <TableCell>
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {website.url}
                    </a>
                  </TableCell>
                  <TableCell>{new Date(website.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(website)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(website)}
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

export default WebsiteManagement;
