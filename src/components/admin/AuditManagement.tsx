import { useState, useEffect } from "react";
import { getAudits, getWebsites, getModules, getUsers, updateAudit, deleteAudit, type AuditEntry, type Website, type Module, type User } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, FileCheck, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AuditManagement = () => {
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAudit, setEditingAudit] = useState<AuditEntry | null>(null);
  const [formData, setFormData] = useState({
    status: 'working' as 'working' | 'not_working',
    remarks: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAudits(getAudits().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setWebsites(getWebsites());
    setModules(getModules());
    setUsers(getUsers());
  };

  const getWebsiteName = (websiteId: string) => {
    return websites.find(w => w.id === websiteId)?.name || 'Unknown';
  };

  const getModuleName = (moduleId: string) => {
    return modules.find(m => m.id === moduleId)?.name || 'Unknown';
  };

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.username || 'Unknown';
  };

  const handleOpenDialog = (audit: AuditEntry) => {
    setEditingAudit(audit);
    setFormData({
      status: audit.status,
      remarks: audit.remarks || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAudit) {
      updateAudit(editingAudit.id, formData);
      toast({
        title: "Audit updated",
        description: "The audit record has been updated successfully.",
      });
    }

    setDialogOpen(false);
    loadData();
  };

  const handleDelete = (audit: AuditEntry) => {
    if (confirm('Are you sure you want to delete this audit record?')) {
      deleteAudit(audit.id);
      toast({
        title: "Audit deleted",
        description: "The audit record has been deleted.",
      });
      loadData();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Audit Data Management
          </CardTitle>
          <CardDescription>View, edit, or delete audit records (Admin only)</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {audits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No audit records found.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {audits.length} audit record(s)
            </div>
            <div className="space-y-4">
              {audits.map((audit) => (
                <div
                  key={audit.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-secondary/50"
                >
                  <div className="flex-shrink-0 mt-1">
                    {audit.status === 'working' ? (
                      <CheckCircle className="w-6 h-6 text-primary" />
                    ) : (
                      <XCircle className="w-6 h-6 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{getModuleName(audit.moduleId)}</h3>
                        <p className="text-sm text-muted-foreground">
                          {getWebsiteName(audit.websiteId)}
                        </p>
                      </div>
                      <Badge variant={audit.status === 'working' ? 'default' : 'destructive'}>
                        {audit.status === 'working' ? 'Working' : 'Not Working'}
                      </Badge>
                    </div>
                    {audit.remarks && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Remarks:</span> {audit.remarks}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Date: {audit.auditDate}</span>
                      <span>•</span>
                      <span>By: {getUserName(audit.userId)}</span>
                      <span>•</span>
                      <span>{new Date(audit.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(audit)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(audit)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Audit Record</DialogTitle>
              <DialogDescription>
                Update the status or remarks for this audit
              </DialogDescription>
            </DialogHeader>
            {editingAudit && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Module</Label>
                  <Input value={getModuleName(editingAudit.moduleId)} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as 'working' | 'not_working' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="working">Working</SelectItem>
                      <SelectItem value="not_working">Not Working</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AuditManagement;
