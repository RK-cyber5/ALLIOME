/**
 * ALLIOME demo dataset — PART 2: portfolio, activation, signals, seed run.
 *
 * All fictional demo data. See demo-partners.ts for the disclaimer.
 */

import { DEMO_BRIEF, DEMO_PARTNER_BY_ID, SEED_ANALYSIS_ID } from "./demo-partners";
import type {
  ActivationPlan,
  ActivationResponse,
  Analysis,
  AnalysisStage,
  PartnerSignal,
  PortfolioResult,
  PartnersResponse,
} from "./types";

// ─── Portfolio result ──────────────────────────────────────────────────────

export const DEMO_PORTFOLIO: PortfolioResult = {
  analysis_id: SEED_ANALYSIS_ID,
  selected: [
    {
      partner_id: "rhineforge",
      contributions: [
        { capability_key: "manufacturing_domain", level: "strong" },
        { capability_key: "industry_relationships", level: "strong" },
        { capability_key: "german_distribution", level: "moderate" },
      ],
      rationale:
        "Domain credibility and C-level access into the exact ideal customer profile — the portfolio's advisory anchor.",
    },
    {
      partner_id: "nordwerk",
      contributions: [
        { capability_key: "enterprise_implementation", level: "strong" },
        { capability_key: "mes_erp_integration", level: "strong" },
      ],
      rationale:
        "Certified MES/ERP delivery on the systems Aivera Flow integrates with — the delivery backbone.",
    },
    {
      partner_id: "alpencloud",
      contributions: [
        { capability_key: "eu_cloud_deployment", level: "strong" },
        { capability_key: "enterprise_implementation", level: "moderate" },
      ],
      rationale:
        "Sovereign EU hosting with an ISV onboarding path — answers the data-residency question German buyers ask first.",
    },
    {
      partner_id: "hansetech",
      contributions: [
        { capability_key: "german_distribution", level: "strong" },
        { capability_key: "industry_relationships", level: "moderate" },
      ],
      rationale:
        "Existing reseller network reaching the Mittelstand at transactional scale — the distribution channel.",
    },
  ],
  capabilities: DEMO_BRIEF.required_capabilities,
  coverage: [
    // manufacturing_domain
    { capability_key: "manufacturing_domain", partner_id: "rhineforge", status: "supported" },
    { capability_key: "manufacturing_domain", partner_id: "nordwerk", status: "partial", note: "Automotive & machinery delivery, advisory-level positioning" },
    { capability_key: "manufacturing_domain", partner_id: "alpencloud", status: "not_established" },
    { capability_key: "manufacturing_domain", partner_id: "hansetech", status: "partial", note: "Industrial software portfolio, horizontal" },
    // enterprise_implementation
    { capability_key: "enterprise_implementation", partner_id: "rhineforge", status: "partial", note: "Advisory-led, delivery subcontracted" },
    { capability_key: "enterprise_implementation", partner_id: "nordwerk", status: "supported" },
    { capability_key: "enterprise_implementation", partner_id: "alpencloud", status: "partial", note: "Infrastructure & platform operations only" },
    { capability_key: "enterprise_implementation", partner_id: "hansetech", status: "not_established" },
    // mes_erp_integration
    { capability_key: "mes_erp_integration", partner_id: "rhineforge", status: "not_established" },
    { capability_key: "mes_erp_integration", partner_id: "nordwerk", status: "supported" },
    { capability_key: "mes_erp_integration", partner_id: "alpencloud", status: "partial", note: "Hosts integration workloads; does not implement" },
    { capability_key: "mes_erp_integration", partner_id: "hansetech", status: "not_established" },
    // eu_cloud_deployment
    { capability_key: "eu_cloud_deployment", partner_id: "rhineforge", status: "not_established" },
    { capability_key: "eu_cloud_deployment", partner_id: "nordwerk", status: "partial", note: "Hybrid deployments with Azure Deutschland" },
    { capability_key: "eu_cloud_deployment", partner_id: "alpencloud", status: "supported" },
    { capability_key: "eu_cloud_deployment", partner_id: "hansetech", status: "not_established" },
    // german_distribution
    { capability_key: "german_distribution", partner_id: "rhineforge", status: "partial", note: "Influence-based reach via advisory relationships" },
    { capability_key: "german_distribution", partner_id: "nordwerk", status: "partial", note: "Direct accounts, not a channel" },
    { capability_key: "german_distribution", partner_id: "alpencloud", status: "not_established" },
    { capability_key: "german_distribution", partner_id: "hansetech", status: "supported" },
    // industry_relationships
    { capability_key: "industry_relationships", partner_id: "rhineforge", status: "supported" },
    { capability_key: "industry_relationships", partner_id: "nordwerk", status: "partial", note: "Delivery credibility with plant IT" },
    { capability_key: "industry_relationships", partner_id: "alpencloud", status: "not_established" },
    { capability_key: "industry_relationships", partner_id: "hansetech", status: "supported", note: "Transaction-oriented reseller relationships" },
  ],
  complementarity: {
    narrative:
      "The optimizer selected four partners whose contributions interlock rather than overlap: RhineForge opens doors with domain credibility, NordWerk carries the technical delivery, AlpenCloud answers the data-residency requirement, and HanseTech multiplies reach through its reseller channel. Every required capability is covered by at least one partner, and the only deliberate overlap — relationships — combines two complementary forms of relationship capital.",
    vs_top_scores:
      "The two highest individual scores — RhineForge (92) and Baltic Digital (84) — are both advisory businesses with overlapping manufacturing-domain strength. Ranking by individual score alone would double-cover domain expertise while leaving distribution, sovereign cloud and MES/ERP delivery entirely uncovered. The selected portfolio trades 10 points of individual score for full capability coverage and two activation paths per critical capability.",
    redundancies: [
      {
        capability_key: "industry_relationships",
        partner_ids: ["rhineforge", "hansetech"],
        note: "Deliberate redundancy: advisory credibility (RhineForge) and transactional reseller reach (HanseTech) are complementary forms of relationship capital, not duplication.",
      },
    ],
    gaps: [
      {
        capability_key: "mes_erp_integration",
        note: "Single point of dependency on NordWerk — no second partner with strong MES/ERP integration credentials is in the portfolio. Elbe Systems is the natural back-up at moderate strength.",
      },
      {
        capability_key: "eu_cloud_deployment",
        note: "C5 attestation for AlpenCloud is “in progress” — compliance-sensitive customers may require NordWerk's Azure Deutschland path as an alternative.",
      },
    ],
  },
  alternatives: [
    {
      replace_partner_id: "hansetech",
      alternative_partner_id: "mittelstand",
      effect:
        "Swaps transactional industrial distribution for a managed-services SMB channel. German-market coverage weakens from supported to partial; regional reach shifts from national to South/East.",
      coverage_delta: [
        { capability_key: "german_distribution", change: "weakened", note: "Moderate SMB channel vs. specialised industrial reseller network" },
        { capability_key: "industry_relationships", change: "weakened", note: "Generalist SMB base, no industrial specialisation" },
      ],
    },
    {
      replace_partner_id: "alpencloud",
      alternative_partner_id: "baltic",
      effect:
        "Gains deep AI-delivery engineering but loses sovereign-EU hosting: EU cloud deployment drops to partial, while manufacturing-domain coverage gains a moderate second contributor.",
      coverage_delta: [
        { capability_key: "eu_cloud_deployment", change: "weakened", note: "EU-hosted data platforms exist, but no sovereign-cloud ISV program" },
        { capability_key: "manufacturing_domain", change: "improved", note: "Second moderate domain contributor" },
        { capability_key: "enterprise_implementation", change: "improved", note: "Hands-on data-platform delivery bench" },
      ],
    },
    {
      replace_partner_id: "nordwerk",
      alternative_partner_id: "elbe",
      effect:
        "Lower day rates and a smaller bench. MES/ERP coverage technically holds but at reduced scale and with process-industry (not discrete-manufacturing) emphasis.",
      coverage_delta: [
        { capability_key: "mes_erp_integration", change: "weakened", note: "Mid-market ERP (Dynamics, SAP B1) vs. certified S/4HANA + Opcenter" },
        { capability_key: "enterprise_implementation", change: "weakened", note: "Smaller bench; no concurrent-pilot capacity" },
        { capability_key: "manufacturing_domain", change: "weakened", note: "Process-industry focus, thin discrete-manufacturing references" },
      ],
    },
  ],
};

// ─── Activation plans ──────────────────────────────────────────────────────

const outreachEmail = (
  name: string,
  company: string,
  role: string,
  hook: string,
  value: string,
  ask: string,
  signoff = "Best regards,\nAlex Merk\nCo-founder & CRO, Aivera\nalex@aivera.example",
) =>
  `Subject: ${hook}\n\nDear ${name},\n\nI came across ${company} while mapping the German manufacturing ecosystem for Aivera's market entry — specifically ${role.replace(/^(Chief|Head|CTO|CEO|Managing Director|Founder) (of|&|,)?\s*/i, "your work leading ")}.\n\n${value}\n\n${ask}\n\nWould a 30-minute call in the next two weeks suit you?\n\n${signoff}`;

export const DEMO_ACTIVATIONS: ActivationResponse = {
  analysis_id: SEED_ANALYSIS_ID,
  activations: [
    {
      partner_id: "rhineforge",
      rationale:
        "RhineForge's manufacturing credibility and managing-partner network make it the fastest path to qualified conversations with exactly Aivera's ideal customer profile.",
      partner_benefit:
        "Extends advisory retainers into measurable operational outcomes: Aivera Flow turns RhineForge's recommendations into live production intelligence, deepening client relationships and creating a new implementation-revenue stream with delivery partners.",
      proposed_role: "Strategic advisory & demand-creation partner",
      joint_value_proposition:
        "The Line Intelligence Program: RhineForge's operational-excellence methodology powered by Aivera Flow's live production intelligence — from diagnosis to measurable throughput improvement in 12 weeks.",
      joint_solution:
        "A joint 12-week engagement: RhineForge diagnoses production bottlenecks across a client's value stream; Aivera Flow ingests the line's MES and machine data, models constraints and recommends scheduling actions; both firms co-deliver the readout and a rollout business case to plant leadership.",
      target_customer_profile:
        "Tier-1/2 automotive suppliers and industrial-machinery makers, 500–5,000 employees, running SAP or Siemens Opcenter MES, with an active operational-excellence or smart-factory agenda.",
      pilot_scope:
        "One production line at a joint account in RhineForge's network. Success criteria agreed with the plant manager before kickoff; 12 weeks from data connection to readout.",
      commercial_model:
        "Aivera licenses Flow per line per year; RhineForge bills advisory at day rates and receives a 10% first-year referral fee on licenses. Hypothesis to be validated during the pilot.",
      success_metrics: [
        "Pilot line OEE improvement of at least 3 percentage points",
        "Two qualified joint opportunities in the pipeline within 90 days",
        "A joint reference story approved by the pilot customer",
      ],
      technical_dependencies: [
        "Read access to MES/ERP data (SAP S/4HANA or Siemens Opcenter)",
        "Line-level machine data availability via OPC-UA or file export",
        "EU cloud landing zone (AlpenCloud) or on-prem edge node",
      ],
      decision_maker_ids: ["rf-dm-1", "rf-dm-2", "rf-dm-3"],
      draft_outreach: outreachEmail(
        "Dr. Hoffmann",
        "RhineForge Consulting",
        "Managing Partner",
        "Production intelligence for your Industrie 4.0 programs — joint pilot idea",
        "Your Tier-1 production-network case study describes exactly the bottleneck diagnosis where our platform, Aivera Flow, creates measurable value: live line models, bottleneck prediction and scheduling recommendations on top of MES and machine data. We are entering the German market and are building a small circle of advisory partners before scaling.",
        "I would value your perspective on where live production intelligence would strengthen your current programs — and whether a joint 12-week pilot on one line in your network is worth exploring.",
      ),
      meeting_agenda: [
        "Introductions and objectives (5 min)",
        "Aivera Flow: live demo on a simulated production line (10 min)",
        "RhineForge's Industrie 4.0 practice: where clients feel the most pain (10 min)",
        "Joint pilot sketch: scope, line, customer profile, success criteria (15 min)",
        "Commercial model hypothesis and next steps (10 min)",
      ],
      roadmap: [
        {
          id: "rf-r1",
          title: "Review technical fit together",
          description: "Joint working session: Aivera presents integration architecture; RhineForge validates against 2–3 client estates.",
          phase: "week_1",
          owner: "joint",
        },
        {
          id: "rf-r2",
          title: "Prepare solution presentation",
          description: "Co-develop the Line Intelligence Program deck: value proposition, 12-week journey, reference story.",
          phase: "week_1",
          owner: "you",
        },
        {
          id: "rf-r3",
          title: "Identify pilot scope and candidate line",
          description: "Shortlist 2 client lines with RhineForge's practice leads; agree success criteria with plant management.",
          phase: "week_2",
          owner: "joint",
        },
        {
          id: "rf-r4",
          title: "Prepare first-meeting agenda and materials",
          description: "Agenda, demo environment tailored to the candidate line, pilot one-pager for the plant manager.",
          phase: "week_2",
          owner: "you",
        },
        {
          id: "rf-r5",
          title: "Complete partner evaluation",
          description: "RhineForge internal assessment: delivery involvement model, referral terms, practice enablement needs.",
          phase: "week_3",
          owner: "partner",
        },
        {
          id: "rf-r6",
          title: "Pilot kickoff preparation",
          description: "Data-access checklist, security review package, pilot agreement draft, joint communication plan.",
          phase: "week_4",
          owner: "joint",
        },
      ],
    },
    {
      partner_id: "nordwerk",
      rationale:
        "NordWerk's certified MES/ERP practice and 470-person bench make it the implementation backbone of the portfolio — the partner who can actually deliver and support Aivera Flow at enterprise scale.",
      partner_benefit:
        "Differentiates NordWerk's smart-factory portfolio with an AI scheduling capability none of its large competitors currently offers, creates recurring managed-operations revenue on top of implementation fees, and strengthens its 'AI in manufacturing' positioning with two senior hires to anchor.",
      proposed_role: "Lead implementation & managed-operations partner",
      joint_value_proposition:
        "AI-optimised production scheduling delivered as a certified integration: Aivera Flow on top of the SAP/Opcenter estates NordWerk already runs — implemented, operated and supported as one service.",
      joint_solution:
        "Aivera Flow embedded into NordWerk's smart-factory delivery methodology: NordWerk leads integration, deployment and change management; Aivera provides the platform, model tuning and product support; jointly branded service catalog for new and existing manufacturing accounts.",
      target_customer_profile:
        "Mid-size to large discrete manufacturers with SAP S/4HANA or Siemens Opcenter and an existing NordWerk relationship — where scheduling pain is documented and the data foundation exists.",
      pilot_scope:
        "One production site, two lines, at an existing NordWerk account. 12-week implementation with agreed KPIs (throughput, schedule adherence, OEE).",
      commercial_model:
        "NordWerk sells the joint service (implementation at day rates + platform license pass-through at agreed margin); managed operations billed monthly per site. Hypothesis to be validated in pilot.",
      success_metrics: [
        "Schedule adherence improvement of at least 5% on pilot lines",
        "First joint proposal submitted within 60 days",
        "Two NordWerk consultants certified on Aivera Flow",
      ],
      technical_dependencies: [
        "SAP S/4HANA / Siemens Opcenter integration adapters",
        "OPC-UA connectivity to line PLCs",
        "EU cloud landing zone (AlpenCloud) or on-prem edge deployment",
        "SSO integration with customer identity providers",
      ],
      decision_maker_ids: ["nw-dm-1", "nw-dm-2", "nw-dm-3"],
      draft_outreach: outreachEmail(
        "Mr. Reiner",
        "NordWerk Systems",
        "CTO & Managing Director",
        "AI scheduling for your smart-factory portfolio — partnership proposal",
        "NordWerk's Opcenter and S/4HANA delivery practice is exactly the foundation our platform needs in Germany: Aivera Flow adds AI bottleneck prediction and scheduling optimisation on top of the estates you already run — with an EU-sovereign deployment option that your manufacturing customers increasingly demand.",
        "We are selecting one lead implementation partner for our German market entry. I would like to walk you through the platform, our partner economics and a pilot proposal for one of your existing accounts.",
      ),
      meeting_agenda: [
        "Introductions and partnership objectives (5 min)",
        "Aivera Flow architecture and integration surface (15 min)",
        "NordWerk's delivery model: where Flow fits the portfolio (10 min)",
        "Pilot proposal: joint account, two lines, 12 weeks (15 min)",
        "Partner economics, certification path and next steps (10 min)",
      ],
      roadmap: [
        {
          id: "nw-r1",
          title: "Technical fit review",
          description: "Deep-dive session: integration architecture, security model, deployment options against NordWerk standards.",
          phase: "week_1",
          owner: "joint",
        },
        {
          id: "nw-r2",
          title: "Identify pilot account",
          description: "NordWerk shortlists 2 candidate accounts with documented scheduling pain; joint qualification call.",
          phase: "week_1",
          owner: "partner",
        },
        {
          id: "nw-r3",
          title: "Prepare joint solution presentation",
          description: "Joint service catalog one-pager and pilot proposal for the candidate account's leadership.",
          phase: "week_2",
          owner: "you",
        },
        {
          id: "nw-r4",
          title: "Define partner economics",
          description: "Agree implementation day rates, license pass-through margin and managed-operations model.",
          phase: "week_2",
          owner: "joint",
        },
        {
          id: "nw-r5",
          title: "Complete partner evaluation",
          description: "NordWerk internal review: legal, security and delivery-capacity assessment.",
          phase: "week_3",
          owner: "partner",
        },
        {
          id: "nw-r6",
          title: "Certification and pilot kickoff",
          description: "Two consultants start Aivera Flow certification; pilot kickoff workshop with the customer.",
          phase: "week_4",
          owner: "joint",
        },
      ],
    },
    {
      partner_id: "alpencloud",
      rationale:
        "AlpenCloud's sovereign-EU infrastructure and ISV onboarding program let Aivera answer the data-residency question German industrial buyers ask first — without building local hosting alone.",
      partner_benefit:
        "Adds an AI manufacturing platform to the ISV portfolio on AlpenCloud's sovereign stack, increasing differentiated workload demand for its managed data services and partner-engineering practice.",
      proposed_role: "Sovereign cloud & platform-operations partner",
      joint_value_proposition:
        "Production intelligence with German data residency by design: Aivera Flow operated on AlpenCloud's sovereign EU infrastructure, delivered and supported as one offering.",
      joint_solution:
        "Aivera Flow as a certified ISV workload on AlpenCloud: joint reference architecture, one-click deployment into customer tenancies, and AlpenCloud-managed platform operations under a shared run-book.",
      target_customer_profile:
        "German manufacturers with strict data-residency or compliance requirements — typically mid-size industrial companies with in-house IT security veto over US-hyperscaler workloads.",
      pilot_scope:
        "Stand up Aivera Flow on AlpenCloud for one pilot customer (jointly with NordWerk as implementer); validate deployment automation, operations run-book and support model in 6 weeks.",
      commercial_model:
        "AlpenCloud bills managed infrastructure per customer environment; Aivera licenses Flow per line/year with a platform-hosting referral fee. Hypothesis to be validated in pilot.",
      success_metrics: [
        "Reference architecture published and one-click deployment proven",
        "Joint operations run-book signed off by both engineering teams",
        "One compliance-sensitive customer deployed in production within the quarter",
      ],
      technical_dependencies: [
        "Aivera Flow containerised deployment (Kubernetes, Helm)",
        "Managed Postgres, Kafka and object storage on AlpenCloud",
        "VPN/interconnect to customer on-prem MES sources",
        "Joint monitoring and incident-response integration",
      ],
      decision_maker_ids: ["ac-dm-1", "ac-dm-2"],
      draft_outreach: outreachEmail(
        "Mr. Maier",
        "AlpenCloud Solutions",
        "CEO",
        "Aivera Flow on your sovereign stack — ISV partnership",
        "German manufacturers keep asking us the same question before anything else: where does the data live? Your sovereign EU infrastructure and ISV program are the cleanest answer we have found — and production AI workloads are exactly the differentiated demand your platform is built for.",
        "We are onboarding a small set of launch ISV partners for our German market entry and would like to walk you through Aivera Flow, our hosting requirements and a joint reference architecture.",
      ),
      meeting_agenda: [
        "Introductions and ISV program overview (10 min)",
        "Aivera Flow architecture: hosting and data-flow requirements (15 min)",
        "Reference architecture sketch: one-click deployment, tenancy model (15 min)",
        "Pilot plan: compliance-sensitive customer, 6-week validation (10 min)",
        "Commercial model and next steps (10 min)",
      ],
      roadmap: [
        {
          id: "ac-r1",
          title: "Technical onboarding session",
          description: "Walk through hosting requirements, container topology, data services and security model with partner engineering.",
          phase: "week_1",
          owner: "joint",
        },
        {
          id: "ac-r2",
          title: "Draft reference architecture",
          description: "Joint architecture document: deployment topology, tenancy, backup/DR, monitoring.",
          phase: "week_2",
          owner: "joint",
        },
        {
          id: "ac-r3",
          title: "Stand up staging environment",
          description: "Deploy Aivera Flow staging instance on AlpenCloud; validate automation end-to-end.",
          phase: "week_2",
          owner: "partner",
        },
        {
          id: "ac-r4",
          title: "Operations run-book",
          description: "Define joint monitoring, incident response, upgrade and support-escalation procedures.",
          phase: "week_3",
          owner: "joint",
        },
        {
          id: "ac-r5",
          title: "Complete ISV agreement evaluation",
          description: "AlpenCloud legal/commercial review of the ISV partnership terms.",
          phase: "week_3",
          owner: "partner",
        },
        {
          id: "ac-r6",
          title: "Launch preparation",
          description: "Joint landing page, pricing packaging and go-to-market messaging for the sovereign offering.",
          phase: "week_4",
          owner: "you",
        },
      ],
    },
    {
      partner_id: "hansetech",
      rationale:
        "HanseTech's reseller network gives Aivera transactional reach into the Mittelstand that direct sales and advisory partners cannot economically cover — the volume channel of the portfolio.",
      partner_benefit:
        "Adds an AI production platform to an industrial-software portfolio that currently lacks scheduling optimisation — a differentiator for resellers facing MES commoditisation, plus new license-revenue streams with modest services load.",
      proposed_role: "Distribution & reseller-channel partner",
      joint_value_proposition:
        "AI production scheduling for the Mittelstand, delivered through the resellers customers already buy from — implemented by certified partners, hosted in the EU.",
      joint_solution:
        "Aivera Flow in the HanseTech catalog: reseller enablement kit (positioning, demo, qualification checklist), certified-implementation routing to NordWerk, and joint demand-generation campaigns targeting mid-size manufacturers.",
      target_customer_profile:
        "Mid-size German manufacturers (300–2,000 employees) buying through resellers; scheduling pain but no capacity for a direct vendor evaluation.",
      pilot_scope:
        "Onboard 3–5 pilot resellers in one region (e.g. Baden-Württemberg); enable with the kit; measure qualified-lead generation over one quarter.",
      commercial_model:
        "Two-tier distribution: HanseTech margin on license pass-through; implementation routed to certified partners with referral economics. Hypothesis to be validated with pilot resellers.",
      success_metrics: [
        "5 resellers enabled and certified in the first quarter",
        "10 qualified leads generated through the channel within 90 days",
        "First channel-sourced pilot customer signed",
      ],
      technical_dependencies: [
        "Reseller enablement kit and demo environment",
        "Lead-registration and deal-protection process",
        "Certified implementation capacity (NordWerk or Elbe Systems)",
      ],
      decision_maker_ids: ["ht-dm-1", "ht-dm-2"],
      draft_outreach: outreachEmail(
        "Mr. Krüger",
        "HanseTech Distribution",
        "Chief Revenue Officer",
        "AI production scheduling for your industrial portfolio",
        "Your industrial-software portfolio covers MES, QMS and analytics — but not AI scheduling, which is the question your resellers are starting to hear from mid-size manufacturers. Aivera Flow fills exactly that gap, with EU hosting and a certified-implementation model that keeps reseller relationships at the centre.",
        "We are selecting a distribution partner for our German launch and would like to present the platform, the enablement model and pilot-channel economics.",
      ),
      meeting_agenda: [
        "Introductions and portfolio fit (10 min)",
        "Aivera Flow: positioning and demo for the Mittelstand (15 min)",
        "Enablement model: reseller kit, certification, lead flow (15 min)",
        "Pilot channel: 3–5 resellers, one region, one quarter (10 min)",
        "Commercial terms and next steps (10 min)",
      ],
      roadmap: [
        {
          id: "ht-r1",
          title: "Portfolio-fit review",
          description: "HanseTech assesses category fit, margin structure and reseller demand signals.",
          phase: "week_1",
          owner: "partner",
        },
        {
          id: "ht-r2",
          title: "Prepare enablement kit",
          description: "Aivera delivers positioning, demo script, qualification checklist and pricing sheet.",
          phase: "week_2",
          owner: "you",
        },
        {
          id: "ht-r3",
          title: "Select pilot resellers",
          description: "Jointly shortlist 3–5 resellers in one region; define enablement workshop.",
          phase: "week_2",
          owner: "joint",
        },
        {
          id: "ht-r4",
          title: "Reseller enablement workshop",
          description: "Half-day workshop: positioning, demo, qualification and deal-registration process.",
          phase: "week_3",
          owner: "joint",
        },
        {
          id: "ht-r5",
          title: "Launch demand-generation campaign",
          description: "Joint campaign: target list, messaging, first webinar for pilot resellers' customers.",
          phase: "week_4",
          owner: "joint",
        },
      ],
    },
  ],
};

// ─── Partner signals (overview feed) ───────────────────────────────────────

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

export const DEMO_SIGNALS: PartnerSignal[] = [
  {
    id: "sig-1",
    partner_id: "nordwerk",
    partner_name: "NordWerk Systems AG",
    type: "content",
    text: "Published a new case study: Opcenter rollout across three plants at a machinery maker — signals active multi-site delivery capacity.",
    observed_at: hoursAgo(3),
    evidence_id: "nw-ev-2",
    url: "https://evidence.alliome.demo/nordwerk/case-studies",
  },
  {
    id: "sig-2",
    partner_id: "rhineforge",
    partner_name: "RhineForge Consulting GmbH",
    type: "hiring",
    text: "4 new manufacturing-consultant roles posted in Munich since the investigation — practice expansion continues.",
    observed_at: hoursAgo(9),
    evidence_id: "rf-ev-3",
    url: "https://evidence.alliome.demo/rhineforge/careers",
  },
  {
    id: "sig-3",
    partner_id: "alpencloud",
    partner_name: "AlpenCloud Solutions GmbH",
    type: "partnership",
    text: "Announced a sovereign-AI hosting initiative with two German ISVs — precedent for Aivera Flow onboarding.",
    observed_at: hoursAgo(26),
    evidence_id: "ac-ev-2",
    url: "https://evidence.alliome.demo/alpencloud/isv-program",
  },
  {
    id: "sig-4",
    partner_id: "hansetech",
    partner_name: "HanseTech Distribution AG",
    type: "hiring",
    text: "Opened 4 channel-manager roles in Frankfurt — consistent with vendor-portfolio expansion.",
    observed_at: hoursAgo(51),
    evidence_id: "ht-ev-4",
    url: "https://evidence.alliome.demo/hansetech/careers",
  },
  {
    id: "sig-5",
    partner_id: "rhineforge",
    partner_name: "RhineForge Consulting GmbH",
    type: "leadership",
    text: "Julia Brandt promoted to Principal, AI & Data — strengthens the internal champion for AI partnerships.",
    observed_at: hoursAgo(74),
    evidence_id: "rf-ev-1",
    url: "https://evidence.alliome.demo/rhineforge/practice",
  },
  {
    id: "sig-6",
    partner_id: "baltic",
    partner_name: "Baltic Digital Consulting",
    type: "event",
    text: "Speaking at Hamburg Industrial Data Meetup on production ML platforms — visibility in Aivera's target segment.",
    observed_at: hoursAgo(96),
    evidence_id: "bd-ev-2",
    url: "https://evidence.alliome.demo/baltic/services",
  },
];

// ─── Seed analysis (completed) ─────────────────────────────────────────────

const stage = (
  key: string,
  label: string,
  detail: string,
  minutesOffset: number,
): AnalysisStage => ({
  key,
  label,
  status: "completed",
  started_at: new Date(Date.now() - (minutesOffset + 6) * 60000).toISOString(),
  completed_at: new Date(Date.now() - minutesOffset * 60000).toISOString(),
  detail,
});

export const DEMO_SEED_ANALYSIS: Analysis = {
  analysis_id: SEED_ANALYSIS_ID,
  status: "completed",
  brief: DEMO_BRIEF,
  created_at: new Date(Date.now() - 60 * 60000).toISOString(),
  updated_at: new Date(Date.now() - 12 * 60000).toISOString(),
  demo: true,
  stage: "generating_activation",
  progress: 100,
  warnings: [],
  errors: [],
  stages: [
    stage("analysing_company", "Analysing company & product", "Aivera Flow — AI process optimisation for discrete manufacturing", 54),
    stage("compiling_capability_gaps", "Compiling capability gaps", "6 required capabilities identified for DACH market entry", 51),
    stage("discovering_partners", "Discovering partner companies", "23 companies surfaced · 12 candidates shortlisted", 44),
    stage("investigating_capabilities", "Investigating business capabilities", "12 candidates investigated across services, clients and delivery", 36),
    stage("identifying_decision_makers", "Identifying decision-makers", "17 relevant decision-makers identified with evidence", 30),
    stage("collecting_evidence", "Collecting evidence", "42 sources collected · 6 claims remain unverified", 22),
    stage("evaluating_fit", "Evaluating individual partner fit", "Strategic fit & activation readiness scored per candidate", 16),
    stage("optimising_portfolio", "Optimising the portfolio", "4 partners selected · full capability coverage · 1 deliberate redundancy", 14),
    stage("generating_activation", "Generating activation plans", "4 activation plans with 30-day roadmaps drafted", 12),
  ],
  error: null,
};

export const DEMO_PARTNERS_RESPONSE: PartnersResponse = {
  analysis_id: SEED_ANALYSIS_ID,
  partners: Array.from(DEMO_PARTNER_BY_ID.values()),
  partial: null,
};

export function getDemoActivation(): ActivationResponse {
  return DEMO_ACTIVATIONS;
}

export function getDemoPlan(partnerId: string): ActivationPlan | undefined {
  return DEMO_ACTIVATIONS.activations.find((a) => a.partner_id === partnerId);
}
