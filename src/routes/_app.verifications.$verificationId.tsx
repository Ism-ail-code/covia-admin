import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page";
import { api } from "@/lib/api";
import type { VerificationStatus } from "@/lib/types";

export const Route = createFileRoute("/_app/verifications/$verificationId")({
  component: VerificationDetailPage,
});

const statusVariant: Record<VerificationStatus, "success" | "warning" | "destructive" | "secondary"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  needs_review: "secondary",
};

const typeLabel: Record<string, string> = {
  cnic: "CNIC",
  license: "Driving licence",
  vehicle: "Vehicle registration",
  document: "Supporting document",
};

function VerificationDetailPage() {
  const { verificationId } = Route.useParams();
  const verificationQuery = useQuery({
    queryKey: ["verification", verificationId],
    queryFn: () => api.getVerification(verificationId),
  });

  const v = verificationQuery.data;

  if (!v) return null;

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
        <Link to="/verifications">
          <ArrowLeft className="size-4" />
          Back to verifications
        </Link>
      </Button>

      <PageHeader
        title={`${typeLabel[v.type]} review`}
        description={`${v.id} · submitted ${v.submittedAt}`}
        actions={<Badge variant={statusVariant[v.status]}>{v.status.replace("_", " ")}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Document preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid aspect-video place-items-center rounded-lg border bg-muted/40">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{typeLabel[v.type]}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Placeholder — real scans load from Supabase storage.
                </p>
              </div>
            </div>
            {v.notes && (
              <>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Reviewer notes:</span> {v.notes}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Applicant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">{v.applicant.name}</p>
                <p className="text-xs text-muted-foreground">{v.applicant.phone}</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Auto-check confidence</span>
                <span className="tabular-nums font-medium">{Math.round(v.confidence * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span className="tabular-nums font-medium">{v.submittedAt}</span>
              </div>
              {v.expiresAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="tabular-nums font-medium">{v.expiresAt}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => toast.error("Verification rejected")}
                >
                  <XCircle className="size-4" />
                  Reject
                </Button>
                <Button size="sm" onClick={() => toast.success("Verification approved")}>
                  <CheckCircle2 className="size-4" />
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}