import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

export function AuthCard({ title, description, children, footer }: { title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {footer && <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p>}
    </>
  );
}
