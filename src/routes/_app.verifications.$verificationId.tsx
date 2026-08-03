import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page";
import { adminListVerifications, adminReviewVerification } from "@/lib/adminApi";

export const Route = createFileRoute("/_app/verifications/$verificationId")({
  component: VerificationDetailPage,
});

function statusBadge(status: string): { variant: "success" | "warning" | "destructive" | "secondary"; label: string } {
  switch (status) {
    case "approved":
    case "verified":
      return { variant: "success", label: status.replace("_", " ") };
    case "rejected":
      return { variant: "destructive", label: "rejected" };
    case "in_review":
      return { variant: "warning", label: "in review" };
    case "pending":
    default:
      return { variant: "warning", label: "pending" };
  }
}

function VerificationDetailPage() {
  const { verificationId } = Route.useParams();
  const queryClient = useQueryClient();

  const submissionQuery = useQuery({
    queryKey: ["verifications", "list"],
    queryFn: () => adminListVerifications({}),
    select: (rows) => rows.find((v) => v.id === verificationId),
  });

  const reviewMutation = useMutation({
    mutationFn: (action: "approve" | "reject") => adminReviewVerification(verificationId, action),
    onSuccess: (_, action) => {
      toast.success(action === "approve" ? "Verification approved" : "Verification rejected");
      queryClient.invalidateQueries({ queryKey: ["verifications"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update verification"),
  });

  const v = submissionQuery.data;

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
        title={`${v.verification_type === "government_id" ? "Government ID" : "Student"} review`}
        description={`${v.id.slice(0, 8)} · submitted ${new Date(v.submitted_at).toLocaleDateString()}`}
        actions={<Badge variant={statusBadge(v.status).variant}>{statusBadge(v.status).label}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Submitted documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid aspect-video place-items-center rounded-lg border bg-muted/40">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {v.verification_type === "government_id" ? v.government_id_kind ?? "Government ID" : "Student card"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Signed links load from the private verification-documents bucket.
                </p>
              </div>
            </div>
            {v.university_email && (
              <>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">University email:</span> {v.university_email}
                </p>
              </>
            )}
            {v.rejection_reason && (
              <>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Rejection reason:</span> {v.rejection_reason}
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
                <p className="font-medium">{v.user_display_name ?? v.user_email}</p>
                <p className="text-xs text-muted-foreground">{v.user_email}</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Submitted</span>
                <span className="tabular-nums font-medium">
                  {new Date(v.submitted_at).toLocaleDateString()}
                </span>
              </div>
              {v.reviewed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reviewed</span>
                  <span className="tabular-nums font-medium">
                    {new Date(v.reviewed_at).toLocaleDateString()}
                  </span>
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
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate("reject")}
                >
                  {reviewMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                  Reject
                </Button>
                <Button
                  size="sm"
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate("approve")}
                >
                  {reviewMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
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