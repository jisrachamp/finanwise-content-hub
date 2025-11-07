import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, BookOpen, Target, ArrowUp, ArrowDown, DollarSign, PiggyBank } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Sample data
const userGrowthData = [
  { month: "Jul", users: 1200 },
  { month: "Aug", users: 1450 },
  { month: "Sep", users: 1680 },
  { month: "Oct", users: 2100 },
  { month: "Nov", users: 2650 },
  { month: "Dec", users: 3200 },
  { month: "Jan", users: 3850 },
];

const engagementData = [
  { name: "Credit Simulator", value: 35 },
  { name: "Savings Calculator", value: 28 },
  { name: "CETES Info", value: 18 },
  { name: "Budget Planner", value: 12 },
  { name: "Investment Guide", value: 7 },
];

const transactionData = [
  { category: "Housing", amount: 45000 },
  { category: "Food", amount: 28000 },
  { category: "Transport", amount: 15000 },
  { category: "Entertainment", amount: 12000 },
  { category: "Savings", amount: 35000 },
  { category: "Other", amount: 8000 },
];

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time analytics and system overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,850</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>+12.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Published</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>+8 this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.2 min</div>
            <div className="flex items-center text-xs text-destructive mt-1">
              <ArrowDown className="h-3 w-3 mr-1" />
              <span>-0.3 min from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Retention</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>+5% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth Trend</CardTitle>
            <CardDescription>Active users over the last 7 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Engagement</CardTitle>
            <CardDescription>Most-used tools and simulators</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Transaction and Financial Health */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Transaction Categories</CardTitle>
            <CardDescription>Aggregate user spending by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transactionData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="category" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Health</CardTitle>
            <CardDescription>Key user metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Avg. DTI Ratio</span>
                </div>
                <Badge variant="secondary">42%</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Debt-to-Income: Healthy range</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium">Avg. Savings Rate</span>
                </div>
                <Badge className="bg-secondary text-secondary-foreground">18%</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Monthly income saved</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Recommendations</span>
                </div>
                <Badge className="bg-success text-white">1,240</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Issued this month</p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Last data sync: <span className="text-foreground font-medium">12:34:56</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>System Notifications</CardTitle>
          <CardDescription>Important alerts and system status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-info/10 border border-info/20">
              <div className="h-2 w-2 rounded-full bg-info" />
              <div className="flex-1">
                <p className="text-sm font-medium">5 content items pending approval</p>
                <p className="text-xs text-muted-foreground">Review queue requires attention</p>
              </div>
              <Badge variant="outline" className="border-info text-info">Action Required</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="h-2 w-2 rounded-full bg-success" />
              <div className="flex-1">
                <p className="text-sm font-medium">Database backup completed successfully</p>
                <p className="text-xs text-muted-foreground">Last backup: 2 hours ago</p>
              </div>
              <Badge variant="outline" className="border-success text-success">Success</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="h-2 w-2 rounded-full bg-warning" />
              <div className="flex-1">
                <p className="text-sm font-medium">Storage approaching 85% capacity</p>
                <p className="text-xs text-muted-foreground">Consider archive old content</p>
              </div>
              <Badge variant="outline" className="border-warning text-warning">Warning</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
