import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getWebsites, getAudits, getModules, getUsers, type Website, type AuditEntry, type Module, type User } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Speedometer from "@/components/Speedometer";

const Reports = () => {
  const [user] = useState(getCurrentUser());
  const navigate = useNavigate();
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filteredAudits, setFilteredAudits] = useState<AuditEntry[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadData();
  }, [user, navigate]);

  useEffect(() => {
    filterAudits();
  }, [selectedWebsite, selectedDate]);

  const loadData = () => {
    setWebsites(getWebsites());
    setModules(getModules());
    setUsers(getUsers());
  };

  const filterAudits = () => {
    let audits = getAudits();

    if (selectedDate) {
      audits = audits.filter(a => a.auditDate === selectedDate);
    }

    if (selectedWebsite && selectedWebsite !== 'all') {
      audits = audits.filter(a => a.websiteId === selectedWebsite);
    }

    setFilteredAudits(audits);
  };

  const getModuleName = (moduleId: string) => {
    return modules.find(m => m.id === moduleId)?.name || 'Unknown Module';
  };

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.username || 'Unknown User';
  };

  const getWebsiteName = (websiteId: string) => {
    return websites.find(w => w.id === websiteId)?.name || 'Unknown Website';
  };

  const calculateScore = () => {
    if (filteredAudits.length === 0) return { working: 0, total: 0 };
    
    const working = filteredAudits.filter(a => a.status === 'working').length;
    return { working, total: filteredAudits.length };
  };

  const score = calculateScore();

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
            <h1 className="text-2xl font-bold">Audit Reports</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Reports</CardTitle>
            <CardDescription>Select date and website to view audit history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Select value={selectedWebsite || 'all'} onValueChange={setSelectedWebsite}>
                  <SelectTrigger>
                    <SelectValue placeholder="All websites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All websites</SelectItem>
                    {websites.map(website => (
                      <SelectItem key={website.id} value={website.id}>
                        {website.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Display */}
        {filteredAudits.length > 0 && (
          <Card className="mb-6">
            <CardContent className="py-8">
              <div className="flex flex-col items-center">
                <Speedometer working={score.working} total={score.total} size={280} />
                <p className="text-lg text-muted-foreground mt-4">
                  {selectedWebsite && selectedWebsite !== 'all'
                    ? `${getWebsiteName(selectedWebsite)} - ${selectedDate}`
                    : `All Websites - ${selectedDate}`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Details */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Details</CardTitle>
            <CardDescription>
              {filteredAudits.length} module(s) audited
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAudits.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No audits found for the selected filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAudits.map((audit) => (
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
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{getModuleName(audit.moduleId)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {getWebsiteName(audit.websiteId)}
                          </p>
                        </div>
                        <span className={`text-sm font-medium ${
                          audit.status === 'working' ? 'text-primary' : 'text-destructive'
                        }`}>
                          {audit.status === 'working' ? 'Working' : 'Not Working'}
                        </span>
                      </div>
                      {audit.remarks && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Remarks:</span> {audit.remarks}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span>Audited by: {getUserName(audit.userId)}</span>
                        <span>•</span>
                        <span>{new Date(audit.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Reports;
