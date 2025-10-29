import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser, getWebsites, getModulesByWebsite, getTodayAuditsByWebsite, createAudit, updateAudit, type Module } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Speedometer from "@/components/Speedometer";

interface ModuleAuditData {
  moduleId: string;
  status: 'working' | 'not_working';
  remarks: string;
}

const AuditWebsite = () => {
  const { websiteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user] = useState(getCurrentUser());
  const [website, setWebsite] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [auditData, setAuditData] = useState<Record<string, ModuleAuditData>>({});
  const [existingAudits, setExistingAudits] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!websiteId) {
      navigate("/dashboard");
      return;
    }
    loadData();
  }, [user, websiteId, navigate]);

  const loadData = () => {
    const websites = getWebsites();
    const foundWebsite = websites.find(w => w.id === websiteId);
    if (!foundWebsite) {
      navigate("/dashboard");
      return;
    }
    setWebsite(foundWebsite);

    const websiteModules = getModulesByWebsite(websiteId!);
    setModules(websiteModules);

    const todayAudits = getTodayAuditsByWebsite(websiteId!);
    setExistingAudits(todayAudits);

    // Initialize audit data from existing audits
    const initialData: Record<string, ModuleAuditData> = {};
    todayAudits.forEach(audit => {
      initialData[audit.moduleId] = {
        moduleId: audit.moduleId,
        status: audit.status,
        remarks: audit.remarks || '',
      };
    });
    setAuditData(initialData);
  };

  const updateModuleStatus = (moduleId: string, status: 'working' | 'not_working') => {
    setAuditData(prev => ({
      ...prev,
      [moduleId]: {
        moduleId,
        status,
        remarks: prev[moduleId]?.remarks || '',
      },
    }));
  };

  const updateModuleRemarks = (moduleId: string, remarks: string) => {
    setAuditData(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        moduleId,
        status: prev[moduleId]?.status || 'working',
        remarks,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all modules have been audited
    const unauditedModules = modules.filter(m => !auditData[m.id]);
    if (unauditedModules.length > 0) {
      toast({
        variant: "destructive",
        title: "Incomplete audit",
        description: `Please audit all modules. ${unauditedModules.length} module(s) remaining.`,
      });
      return;
    }

    setSubmitting(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Submit or update audits for all modules
      Object.values(auditData).forEach(data => {
        // Check if audit already exists for this module today
        const existingAudit = existingAudits.find(a => a.moduleId === data.moduleId);
        
        if (existingAudit) {
          // Update existing audit
          updateAudit(existingAudit.id, {
            status: data.status,
            remarks: data.remarks,
            timestamp: new Date().toISOString(),
          });
        } else {
          // Create new audit
          createAudit({
            websiteId: websiteId!,
            moduleId: data.moduleId,
            userId: user!.id,
            status: data.status,
            remarks: data.remarks,
            auditDate: today,
          });
        }
      });

      toast({
        title: "Audit saved",
        description: "All modules have been audited successfully.",
      });

      navigate("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: "Failed to submit audit. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isModuleAudited = (moduleId: string) => {
    return !!auditData[moduleId];
  };

  const workingCount = Object.values(auditData).filter(d => d.status === 'working').length;
  const totalAudited = Object.keys(auditData).length;

  if (!website) return null;

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{website.name}</h1>
              <p className="text-sm text-primary-foreground/80">{website.url}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {existingAudits.length > 0 && totalAudited === modules.length && (
          <Card className="mb-6 bg-primary/5 border-primary">
            <CardContent className="py-6">
              <div className="flex items-center justify-center">
                <Speedometer working={workingCount} total={modules.length} size={240} />
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {modules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No modules configured for this website.</p>
              </CardContent>
            </Card>
          ) : (
            modules.map((module) => {
              const isAudited = isModuleAudited(module.id);
              return (
                <Card key={module.id} className={isAudited ? "border-primary/50" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {module.name}
                          {isAudited && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </CardTitle>
                        {module.description && (
                          <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Status *</Label>
                      <RadioGroup
                        value={auditData[module.id]?.status || ''}
                        onValueChange={(value) => updateModuleStatus(module.id, value as 'working' | 'not_working')}
                      >
                        <div className="flex items-center space-x-2 p-3 rounded-md border border-border hover:bg-secondary/50">
                          <RadioGroupItem value="working" id={`${module.id}-working`} />
                          <Label htmlFor={`${module.id}-working`} className="flex-1 cursor-pointer flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-primary" />
                            Working
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 rounded-md border border-border hover:bg-secondary/50">
                          <RadioGroupItem value="not_working" id={`${module.id}-not-working`} />
                          <Label htmlFor={`${module.id}-not-working`} className="flex-1 cursor-pointer flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-destructive" />
                            Not Working
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${module.id}-remarks`}>Remarks (Optional)</Label>
                      <Textarea
                        id={`${module.id}-remarks`}
                        placeholder="Add any notes or observations..."
                        value={auditData[module.id]?.remarks || ''}
                        onChange={(e) => updateModuleRemarks(module.id, e.target.value)}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}

          {modules.length > 0 && (
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || totalAudited !== modules.length}>
                {submitting ? "Submitting..." : "Submit Audit"}
              </Button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default AuditWebsite;
