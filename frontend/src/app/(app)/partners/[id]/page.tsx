"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { DemoBadge, EmptyState, ErrorState, PageSkeleton } from "@/components/shared/primitives";
import { PartnerProfileContent } from "@/components/partners/partner-profile";
import { useActiveAnalysisMeta, usePartners, usePortfolio } from "@/hooks/use-analysis";
import { useWorkspace } from "@/lib/store";

export default function PartnerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ analysis?: string }>;
}) {
  const { id } = use(params);
  const sp = use(searchParams);
  const { entry, hasActive } = useActiveAnalysisMeta();
  const analyses = useWorkspace((s) => s.analyses);

  // Prefer the ?analysis= param, then the active analysis, then any completed one.
  const analysisId = sp.analysis ?? (hasActive ? entry!.id : analyses.find((a) => a.status === "completed" || a.status === "partial")?.id ?? null);
  const hasResults = !!analysisId;
  const partners = usePartners(hasResults ? analysisId : null);
  const portfolio = usePortfolio(hasResults ? analysisId : null);
  const [notFound, setNotFound] = useState(false);

  const partner = partners.data?.partners.find((p) => p.id === id) ?? null;
  // Track not-found only after data is loaded (avoid flashing empty state during load).
  if (partners.data && !partner && !notFound) {
    // setState during render is discouraged; handled via derived render below
  }

  if (!analysisId) {
    return (
      <>
        <PageHeader title="Partner profile" />
        <EmptyState
          icon={<Search className="size-5" />}
          title="No analysis available"
          description="Partner profiles are shown within an investigation context. Run an investigation first."
          action={
            <Button asChild>
              <Link href="/new">Start a brief</Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Partner intelligence profile"
        description={partners.data ? "Evidence-based company intelligence from the active investigation." : undefined}
        demo={partners.data ? (entry?.demo ?? false) : false}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/discovery">
              <ArrowLeft className="size-3.5" /> Back to discovery
            </Link>
          </Button>
        }
      />

      {partners.loading && <PageSkeleton />}

      {partners.error && !partners.loading && (
        <ErrorState description={partners.error} onRetry={partners.refetch} />
      )}

      {partners.data && !partners.loading && !partner && (
        <EmptyState
          title="Partner not found in this investigation"
          description={`No partner with id “${id}” exists in the current analysis results. It may belong to a different investigation.`}
          action={
            <Button variant="outline" asChild>
              <Link href="/discovery">Open discovery</Link>
            </Button>
          }
        />
      )}

      {partner && portfolio.data && (
        <PartnerProfileContent partner={partner} portfolio={portfolio.data} analysisId={null} />
      )}
      {partner && !portfolio.data && !portfolio.error && (
        <PartnerProfileContent partner={partner} analysisId={null} />
      )}
    </>
  );
}
