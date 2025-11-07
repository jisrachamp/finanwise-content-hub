import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Analytics = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Analytics & Insights</h1>
        <p className="text-muted-foreground mt-1">Deep dive into user behavior and content performance</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="learning">Learning Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
              <CardDescription>Comprehensive view of platform metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Detailed analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
              <CardDescription>Track engagement and popularity of educational materials</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Content analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Metrics</CardTitle>
              <CardDescription>Educational progress and completion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Learning analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
