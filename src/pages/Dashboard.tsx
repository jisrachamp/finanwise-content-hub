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
  { name: "Simulador de Crédito", value: 35 },
  { name: "Calculadora de Ahorro", value: 28 },
  { name: "Info CETES", value: 18 },
  { name: "Planificador de Presupuesto", value: 12 },
  { name: "Guía de Inversión", value: 7 },
];

const transactionData = [
  { category: "Vivienda", amount: 45000 },
  { category: "Alimentación", amount: 28000 },
  { category: "Transporte", amount: 15000 },
  { category: "Entretenimiento", amount: 12000 },
  { category: "Ahorros", amount: 35000 },
  { category: "Otros", amount: 8000 },
];

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Panel Principal</h1>
        <p className="text-muted-foreground mt-1">Analíticas en tiempo real y vista general del sistema</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,850</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>+12.5% respecto al mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contenido Publicado</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>+8 esta semana</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sesión Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.2 min</div>
            <div className="flex items-center text-xs text-destructive mt-1">
              <ArrowDown className="h-3 w-3 mr-1" />
              <span>-0.3 min desde la semana pasada</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retención de Usuarios</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <div className="flex items-center text-xs text-success mt-1">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>+5% respecto al mes anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Crecimiento de Usuarios</CardTitle>
            <CardDescription>Usuarios activos en los últimos 7 meses</CardDescription>
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
            <CardTitle>Mayor Interacción</CardTitle>
            <CardDescription>Herramientas y simuladores más utilizados</CardDescription>
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
            <CardTitle>Categorías de Transacciones</CardTitle>
            <CardDescription>Gasto agregado de usuarios por categoría</CardDescription>
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
            <CardTitle>Salud Financiera</CardTitle>
            <CardDescription>Métricas clave de usuarios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Ratio DTI Promedio</span>
                </div>
                <Badge variant="secondary">42%</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Deuda-Ingreso: Rango saludable</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium">Tasa de Ahorro Promedio</span>
                </div>
                <Badge className="bg-secondary text-secondary-foreground">18%</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Ingreso mensual ahorrado</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Recomendaciones</span>
                </div>
                <Badge className="bg-success text-white">1,240</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Emitidas este mes</p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Última sincronización: <span className="text-foreground font-medium">12:34:56</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones del Sistema</CardTitle>
          <CardDescription>Alertas importantes y estado del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-info/10 border border-info/20">
              <div className="h-2 w-2 rounded-full bg-info" />
              <div className="flex-1">
                <p className="text-sm font-medium">5 elementos de contenido pendientes de aprobación</p>
                <p className="text-xs text-muted-foreground">Cola de revisión requiere atención</p>
              </div>
              <Badge variant="outline" className="border-info text-info">Acción Requerida</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="h-2 w-2 rounded-full bg-success" />
              <div className="flex-1">
                <p className="text-sm font-medium">Respaldo de base de datos completado exitosamente</p>
                <p className="text-xs text-muted-foreground">Último respaldo: hace 2 horas</p>
              </div>
              <Badge variant="outline" className="border-success text-success">Éxito</Badge>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <div className="h-2 w-2 rounded-full bg-warning" />
              <div className="flex-1">
                <p className="text-sm font-medium">Almacenamiento cercano al 85% de capacidad</p>
                <p className="text-xs text-muted-foreground">Considera archivar contenido antiguo</p>
              </div>
              <Badge variant="outline" className="border-warning text-warning">Advertencia</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
