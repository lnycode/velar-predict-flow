import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, Bell, Shield, Download, Trash2, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Customize your Velar experience and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" defaultValue="Alex" className="bg-background border-border/50" />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" defaultValue="Johnson" className="bg-background border-border/50" />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="alex@example.com" className="bg-background border-border/50" />
            </div>
            
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select defaultValue="est">
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="est">Eastern (EST)</SelectItem>
                  <SelectItem value="cst">Central (CST)</SelectItem>
                  <SelectItem value="mst">Mountain (MST)</SelectItem>
                  <SelectItem value="pst">Pacific (PST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button className="w-full velar-button-primary">
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Configure your alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weatherAlerts">Weather Alerts</Label>
                <p className="text-sm text-muted-foreground">High-risk weather notifications</p>
              </div>
              <Switch id="weatherAlerts" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="medicationReminders">Medication Reminders</Label>
                <p className="text-sm text-muted-foreground">Preventive medication alerts</p>
              </div>
              <Switch id="medicationReminders" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="patternAlerts">Pattern Alerts</Label>
                <p className="text-sm text-muted-foreground">AI-detected pattern notifications</p>
              </div>
              <Switch id="patternAlerts" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weeklyReports">Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">Summary emails</p>
              </div>
              <Switch id="weeklyReports" />
            </div>
            
            <div>
              <Label htmlFor="alertTiming">Alert Timing</Label>
              <Select defaultValue="6hours">
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1hour">1 hour before</SelectItem>
                  <SelectItem value="3hours">3 hours before</SelectItem>
                  <SelectItem value="6hours">6 hours before</SelectItem>
                  <SelectItem value="12hours">12 hours before</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Medical Information
            </CardTitle>
            <CardDescription>Help improve AI accuracy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="migrainType">Migraine Type</Label>
              <Select defaultValue="episodic">
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="episodic">Episodic Migraine</SelectItem>
                  <SelectItem value="chronic">Chronic Migraine</SelectItem>
                  <SelectItem value="aura">Migraine with Aura</SelectItem>
                  <SelectItem value="basilar">Basilar Migraine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="commonTriggers">Known Triggers</Label>
              <Textarea 
                id="commonTriggers" 
                placeholder="e.g., stress, certain foods, weather changes..."
                className="bg-background border-border/50"
                defaultValue="Weather changes, stress, lack of sleep, bright lights"
              />
            </div>
            
            <div>
              <Label htmlFor="medications">Current Medications</Label>
              <Textarea 
                id="medications" 
                placeholder="List preventive and rescue medications..."
                className="bg-background border-border/50"
                defaultValue="Sumatriptan 50mg (rescue), Propranolol 40mg (preventive)"
              />
            </div>
            
            <div>
              <Label htmlFor="weatherSensitivity">Weather Sensitivity Level</Label>
              <Select defaultValue="high">
                <SelectTrigger className="bg-background border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="extreme">Extreme</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="velar-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Data & Privacy
            </CardTitle>
            <CardDescription>Manage your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Data Sharing for Research</Label>
                <p className="text-sm text-muted-foreground">Help improve migraine research (anonymized)</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Location Services</Label>
                <p className="text-sm text-muted-foreground">For local weather data</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export My Data
              </Button>
              
              <Button variant="outline" className="w-full">
                View Privacy Policy
              </Button>
              
              <Button variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* App Information */}
      <Card className="velar-card border-border/50">
        <CardHeader>
          <CardTitle>About Velar</CardTitle>
          <CardDescription>Version information and support</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary">v2.1.0</div>
              <div className="text-sm text-muted-foreground">App Version</div>
            </div>
            <div>
              <div className="text-lg font-bold text-warning">94%</div>
              <div className="text-sm text-muted-foreground">AI Accuracy</div>
            </div>
            <div>
              <div className="text-lg font-bold text-success">2.1M</div>
              <div className="text-sm text-muted-foreground">Global Users</div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center gap-4">
            <Button variant="outline" size="sm">Contact Support</Button>
            <Button variant="outline" size="sm">Rate App</Button>
            <Button variant="outline" size="sm">Release Notes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}