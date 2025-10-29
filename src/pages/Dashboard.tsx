import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getWebsites, getModulesByWebsite, getTodayAuditsByWebsite, logout, type Website } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Settings, FileText, CheckCircle, XCircle } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState(getCurrentUser());
  const [websites, setWebsites] = useState<Website[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadWebsites();
  }, [user, navigate]);

  const loadWebsites = () => {
    setWebsites(getWebsites());
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const getAuditStatus = (websiteId: string) => {
    const modules = getModulesByWebsite(websiteId);
    const todayAudits = getTodayAuditsByWebsite(websiteId);
    const auditedModuleIds = new Set(todayAudits.map(a => a.moduleId));
    
    return {
      total: modules.length,
      audited: todayAudits.length,
      complete: modules.length > 0 && auditedModuleIds.size === modules.length,
    };
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Daily Audit Portal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">
              {user?.username} ({user?.role})
            </span>
            {user?.role === 'admin' && (
              <Button variant="secondary" size="sm" onClick={() => navigate("/admin")}>
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => navigate("/reports")}>
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </Button>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-foreground">Today's Audits</h2>
          <p className="text-muted-foreground">Select a website to perform or view audits</p>
        </div>

        {websites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No websites configured yet.</p>
              {user?.role === 'admin' && (
                <Button className="mt-4" onClick={() => navigate("/admin")}>
                  Go to Admin Panel
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map((website) => {
              const status = getAuditStatus(website.id);
              return (
                <Card
                  key={website.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/audit/${website.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{website.name}</CardTitle>
                        <CardDescription className="mt-1">{website.url}</CardDescription>
                      </div>
                      {status.complete ? (
                        <CheckCircle className="w-6 h-6 text-primary" />
                      ) : status.audited > 0 ? (
                        <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold">{status.audited}</span>
                        </div>
                      ) : (
                        <XCircle className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Modules Audited</span>
                      <span className="font-semibold">
                        {status.audited} / {status.total}
                      </span>
                    </div>
                    {status.total > 0 && (
                      <div className="mt-3 bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${(status.audited / status.total) * 100}%` }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
