import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, FileX2, Loader2, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ErrorState } from "@/components/page";
import { DocumentPreview } from "@/components/verification/document-preview";
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
    case "resubmission_requested":
      return { variant: "secondary", label: "resubmission requested" };
    case "in_review":
    case "pending":
    default:
      return { variant: "warning", label: status.replace("_", " ") };
  }
}

function VerificationDetailPage() {
  const { verificationId } = Route.useParams();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<null | { action: "reject" | "resubmit" | "approve"; reason: string }>(null);

  const submissionQuery = useQuery({
    queryKey: ["verifications", "all"],
    queryFn: () => adminListVerifications({ status: "all" }),
    select: (rows) => rows.find((v) => v.id === verificationId),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ action, reason }: { action: "approve" | "reject" | "request_resubmission"; reason?: string }) =>
      adminReviewVerification(verificationId, action, reason ?? null),
    onSuccess: (_, { action }) => {
      toast.success(
        action === "approve" ? "Verification approved" : action === "reject" ? "Verification rejected" : "Resubmission requested",
      );
      queryClient.invalidateQueries({ queryKey: ["verifications"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not update verification"),
  });

  const runAction = (action: "approve" | "reject" | "request_resubmission", reason?: string) => {
    if ((action === "reject" || action === "request_resubmission") && !reason?.trim()) {
      toast.error("A reason is required");
      return;
    }
    setDialog(null);
    reviewMutation.mutate({ action, reason: reason?.trim() });
  };

  if (submissionQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (submissionQuery.isError) {
    return (
      <ErrorState
        message="Could not load the verification submission."
        onRetry={() => void submissionQuery.refetch()}
      />
    );
  }

  const v = submissionQuery.data;

  if (!v) {
    return (
      <ErrorState
        message="Verification submission not found."
        onRetry={() => void submissionQuery.refetch()}
      />
    );
  }

  const isGovernmentId = v.verification_type === "government_id";
  const hasDocuments = isGovernmentId
    ? Boolean(v.front_document_url || v.back_document_url || v.selfie_url)
    : Boolean(v.student_card_url || v.university_email);

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
        <Link to="/verifications">
          <ArrowLeft className="size-4" />
          Back to verifications
        </Link>
      </Button>

      <PageHeader
        title={`${isGovernmentId ? "Government ID" : "Student"} review`}
        description={`${v.id.slice(0, 8)} · submitted ${new Date(v.submitted_at).toLocaleDateString()}`}
        actions={<Badge variant={statusBadge(v.status).variant}>{statusBadge(v.status).label}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Submitted documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {hasDocuments ? (
              isGovernmentId ? (
                <>
                  {v.front_document_url ? (
                    <DocumentPreview path={v.front_document_url} label="Front of ID" />
                  ) : null}
                  {v.back_document_url ? (
                    <DocumentPreview path={v.back_document_url} label="Back of ID" />
                  ) : null}
                  {v.selfie_url ? <DocumentPreview path={v.selfie_url} label="Selfie" /> : null}
                </>
              ) : (
                <>
                  {v.student_card_url ? (
                    <DocumentPreview path={v.student_card_url} label="Student card" />
                  ) : null}
                  {v.university_email ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">University email:</span> {v.university_email}
                    </p>
                  ) : null}
                </>
              )
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
                <FileX2 className="size-6 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                  No documents were attached to this submission.
                </p>
              </div>
            )}
            {v.rejection_reason && (
              <>
                <Separator />
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
                <span className="tabular-nums font-medium">{new Date(v.submitted_at).toLocaleDateString()}</span>
              </div>
              {v.reviewed_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reviewed</span>
                  <span className="tabular-nums font-medium">{new Date(v.reviewed_at).toLocaleDateString()}</span>
                </div>
              )}
              {v.verification_type === "government_id" && v.government_id_kind ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ID type</span>
                  <span className="font-medium capitalize">{v.government_id_kind.replace("_", " ")}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  disabled={reviewMutation.isPending}
                  onClick={() => setDialog({ action: "reject", reason: "" })}
                >
                  {reviewMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                  Reject
                </Button>
                <Button
                  size="sm"
                  disabled={reviewMutation.isPending}
                  onClick={() => setDialog({ action: "approve", reason: "" })}
                >
                  {reviewMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Approve
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                disabled={reviewMutation.isPending}
                onClick={() => setDialog({ action: "resubmit", reason: "" })}
              >
                <RotateCcw className="size-4" />
                Request resubmission
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Resubmission asks the applicant to upload corrected documents.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {dialog?.action === "approve" ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          title="Approve verification"
          description="This confirms the submitted documents. The member's profile badge will be updated immediately."
          confirmLabel="Approve verification"
          loading={reviewMutation.isPending}
          onConfirm={() => runAction("approve")}
        />
      ) : null}

      {dialog && dialog.action !== "approve" ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          title={dialog.action === "reject" ? "Reject verification" : "Request resubmission"}
          description={
            dialog.action === "reject"
              ? "The applicant will see the reason and can re-apply."
              : "The applicant will be asked to upload corrected documents."
          }
          confirmLabel={dialog.action === "reject" ? "Reject" : "Request resubmission"}
          destructive={dialog.action === "reject"}
          loading={reviewMutation.isPending}
          onConfirm={() => runAction(dialog.action === "resubmit" ? "request_resubmission" : "reject", dialog.reason)}
        >
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              placeholder="Why is this being rejected / requested again?"
              value={dialog.reason}
              onChange={(e) => setDialog({ ...dialog, reason: e.target.value })}
              autoFocus
            />
          </div>
        </ConfirmDialog>
      ) : null}
    </div>
  );
}