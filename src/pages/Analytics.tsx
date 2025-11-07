import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Analytics = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Analíticas e Información</h1>
        <p className="text-muted-foreground mt-1">Análisis profundo del comportamiento de usuarios y rendimiento del contenido</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="content">Rendimiento del Contenido</TabsTrigger>
          <TabsTrigger value="learning">Métricas de Aprendizaje</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vista General de Analíticas</CardTitle>
              <CardDescription>Vista completa de las métricas de la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analíticas detalladas próximamente...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento del Contenido</CardTitle>
              <CardDescription>Seguimiento de interacción y popularidad de materiales educativos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analíticas de contenido próximamente...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Aprendizaje</CardTitle>
              <CardDescription>Progreso educativo y tasas de finalización</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analíticas de aprendizaje próximamente...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
