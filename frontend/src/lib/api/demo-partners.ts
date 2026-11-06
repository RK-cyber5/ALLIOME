/**
 * ALLIOME demo dataset — PART 1: brief + partner records.
 *
 * IMPORTANT: every company, person, number and evidence source in this file is
 * FICTIONAL demo data created for the ALLIOME product demonstration.
 * Domains use the reserved `.example` / `.demo` namespaces. The UI labels all
 * of this as "Demo data" and must never present it as real research.
 */

import type {
  AnalysisBrief,
  EvidenceSource,
  Partner,
} from "./types";

export const SEED_ANALYSIS_ID = "demo-seed-aivera-dach";

export const DEMO_BRIEF: AnalysisBrief = {
  company: {
    name: "Aivera",
    website: "https://aivera.example",
    product_name: "Aivera Flow",
    product_description:
      "An AI process-optimisation platform for discrete manufacturing. Aivera Flow ingests machine, MES and ERP data to model production lines, predict bottlenecks and recommend scheduling actions. Deployed on-premises or in EU cloud, with no-code operator dashboards.",
  },
  target_market: {
    geography: "Germany & DACH",
    industry: "Discrete manufacturing & industrial equipment",
    ideal_customer:
      "Mid-size manufacturers (500–5,000 employees) with in-house IT and an existing MES/ERP estate",
    objective:
      "Enter the German market through indirect channels — stand up a partner ecosystem that can sell, implement and support Aivera Flow within two quarters.",
  },
  required_capabilities: [
    {
      key: "manufacturing_domain",
      name: "Manufacturing domain expertise",
      importance: "critical",
      rationale:
        "Plant leadership only engages partners who speak production language and have done line work themselves.",
    },
    {
      key: "enterprise_implementation",
      name: "Enterprise implementation & delivery",
      importance: "high",
      rationale:
        "On-site deployment, change management and operator training decide whether pilots convert to production rollouts.",
    },
    {
      key: "mes_erp_integration",
      name: "MES / ERP technical integration",
      importance: "high",
      rationale:
        "Aivera Flow must connect to SAP and Siemens-class MES/ERP estates — this is the hardest technical dependency.",
    },
    {
      key: "eu_cloud_deployment",
      name: "EU cloud deployment & data residency",
      importance: "medium",
      rationale:
        "German industrial customers increasingly require EU-sovereign hosting options for production data.",
    },
    {
      key: "german_distribution",
      name: "German-market distribution & channel",
      importance: "medium",
      rationale:
        "Transactional reach into the Mittelstand accelerates revenue beyond what direct sales can cover.",
    },
    {
      key: "industry_relationships",
      name: "Industry relationships & references",
      importance: "medium",
      rationale:
        "Warm introductions and credible references shorten enterprise sales cycles by months.",
    },
  ],
  partner_types: [
    "system_integrator",
    "consultancy",
    "implementation",
    "cloud",
    "reseller",
    "technology",
  ],
  max_candidates: 12,
};

// ─── Evidence helper ───────────────────────────────────────────────────────

const ev = (
  id: string,
  title: string,
  path: string,
  publisher: string,
  daysAgo: number,
  support: EvidenceSource["support"],
  note?: string,
): EvidenceSource => ({
  id,
  title,
  url: `https://evidence.alliome.demo/${path}`,
  publisher,
  retrieved_at: new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10),
  support,
  note,
});

// ─── Partners ──────────────────────────────────────────────────────────────

export const DEMO_PARTNERS: Partner[] = [
  {
    id: "rhineforge",
    name: "RhineForge Consulting GmbH",
    website: "https://www.rhineforge-consulting.example",
    hq: "Munich, Germany",
    category: "consultancy",
    employees: "120–150",
    strategic_fit: 92,
    activation_readiness: 74,
    evidence_confidence: "high",
    capabilities: [
      { key: "manufacturing_domain", name: "Manufacturing domain expertise", level: "strong" },
      { key: "industry_relationships", name: "Industry relationships & references", level: "strong" },
      { key: "enterprise_implementation", name: "Enterprise implementation & delivery", level: "moderate" },
      { key: "german_distribution", name: "German-market distribution & channel", level: "moderate" },
      { key: "mes_erp_integration", name: "MES / ERP technical integration", level: "emerging" },
    ],
    geography: ["Germany", "Austria", "Switzerland"],
    technology_compatibility: {
      score: 71,
      notes:
        "No in-house engineering bench — relies on its partner network for delivery. Deep working knowledge of MES/ERP landscapes from advisory programs, but limited hands-on integration capacity.",
    },
    decision_makers: [
      {
        id: "rf-dm-1",
        name: "Dr. Lena Hoffmann",
        role: "Managing Partner",
        relevance:
          "Co-founder and final decision-maker on all alliance and partnership commitments.",
        evidence_ids: ["rf-ev-4"],
        confidence: "high",
        linkedin_url: null,
      },
      {
        id: "rf-dm-2",
        name: "Markus Vogel",
        role: "Head of Manufacturing Practice",
        relevance:
          "Owns the 40-person manufacturing practice; would sponsor and staff any joint pilot.",
        evidence_ids: ["rf-ev-1"],
        confidence: "high",
        linkedin_url: null,
      },
      {
        id: "rf-dm-3",
        name: "Julia Brandt",
        role: "Principal, AI & Data",
        relevance:
          "Leads AI adoption programs for industrial clients; natural internal champion for Aivera Flow.",
        evidence_ids: ["rf-ev-2"],
        confidence: "medium",
        linkedin_url: null,
      },
    ],
    unknowns: [
      "Implementation bench depth beyond advisory engagements — the team page lists 40+ manufacturing consultants, but delivery credentials are not independently verified.",
      "No evidence of EU sovereign-cloud delivery experience.",
      "Current capacity to run two concurrent pilots this quarter is unknown.",
    ],
    profile: {
      overview:
        "RhineForge Consulting is a Munich-based manufacturing transformation consultancy founded in 2014. It advises mid-size industrial companies on operational excellence, Industrie 4.0 adoption and production-network strategy, and runs a 40-person manufacturing practice. The firm positions itself as a strategy-to-execution advisor for German automotive suppliers and machinery makers.",
      services: [
        "Manufacturing transformation programs",
        "Operational excellence & lean production",
        "Industrie 4.0 / smart-factory strategy",
        "AI adoption programs for operations",
        "Production-network & site strategy",
        "Vendor selection & due diligence",
      ],
      industry_expertise: [
        {
          industry: "Automotive supply (Tier 1/2)",
          detail:
            "Multiple documented programs with Tier-1 suppliers, including a production-network optimisation case study.",
          evidence_ids: ["rf-ev-2"],
        },
        {
          industry: "Industrial machinery & equipment",
          detail: "Practice page lists machinery clients among core references.",
          evidence_ids: ["rf-ev-1"],
        },
      ],
      technology: {
        stack: [
          "Process mining (Celonis partner)",
          "MES/ERP landscape advisory",
          "Data strategy & analytics governance",
        ],
        integrations: ["SAP S/4HANA (advisory)", "Siemens Opcenter (advisory)"],
        notes:
          "Advisory-level familiarity with the systems Aivera Flow integrates against; hands-on integration is typically subcontracted to engineering partners such as system integrators.",
        evidence_ids: ["rf-ev-1", "rf-ev-2"],
      },
      hiring_momentum: {
        summary:
          "Hiring is concentrated in manufacturing consulting and data engineering — consistent with an expanding smart-factory practice.",
        signals: [
          {
            signal: "6 open roles in Munich: manufacturing consultants (4), data engineers (2).",
            evidence_ids: ["rf-ev-3"],
          },
          {
            signal: "New 'AI & Data' practice area added to the services page within the last quarter.",
            evidence_ids: ["rf-ev-1"],
          },
        ],
      },
      partnership_rationale:
        "RhineForge is the strongest domain anchor available: undisputed manufacturing credibility, C-level relationships into exactly Aivera's ideal customer profile, and an explicit AI-adoption agenda. Its gaps — limited integration bench and no cloud delivery — are covered by complementary partners in the portfolio.",
    },
    evidence: [
      ev(
        "rf-ev-1",
        "Manufacturing practice page — “Industrie 4.0 transformation programs”",
        "rhineforge/practice",
        "Company website",
        3,
        "verified",
      ),
      ev(
        "rf-ev-2",
        "Case study: Production-network optimisation for a Tier-1 automotive supplier",
        "rhineforge/case-study-tier1",
        "Company website",
        3,
        "verified",
      ),
      ev(
        "rf-ev-3",
        "Careers page — 6 open manufacturing & data roles (Munich)",
        "rhineforge/careers",
        "Company website",
        3,
        "verified",
      ),
      ev(
        "rf-ev-4",
        "Managing-partner profile — Dr. Lena Hoffmann",
        "rhineforge/team#hoffmann",
        "Company website",
        3,
        "verified",
      ),
      ev(
        "rf-ev-5",
        "Claim: “40+ manufacturing consultants” on team page",
        "rhineforge/team",
        "Company website",
        3,
        "unverified",
        "Self-reported figure; no independent headcount verification available.",
      ),
    ],
  },
  {
    id: "nordwerk",
    name: "NordWerk Systems AG",
    website: "https://www.nordwerk-systems.example",
    hq: "Stuttgart, Germany",
    category: "system_integrator",
    employees: "450–500",
    strategic_fit: 89,
    activation_readiness: 81,
    evidence_confidence: "high",
    capabilities: [
      { key: "enterprise_implementation", name: "Enterprise implementation & delivery", level: "strong" },
      { key: "mes_erp_integration", name: "MES / ERP technical integration", level: "strong" },
      { key: "manufacturing_domain", name: "Manufacturing domain expertise", level: "moderate" },
      { key: "eu_cloud_deployment", name: "EU cloud deployment & data residency", level: "moderate" },
    ],
    geography: ["Germany", "Austria"],
    technology_compatibility: {
      score: 88,
      notes:
        "Certified SAP and Siemens partner with an in-house development centre; regularly delivers hybrid on-prem/EU-cloud deployments for manufacturing clients.",
    },
    decision_makers: [
      {
        id: "nw-dm-1",
        name: "Thomas Reiner",
        role: "CTO & Managing Director",
        relevance:
          "Sets the technology-partnership roadmap; personally sponsors AI-era alliances.",
        evidence_ids: ["nw-ev-1"],
        confidence: "high",
        linkedin_url: null,
      },
      {
        id: "nw-dm-2",
        name: "Sandra Kopp",
        role: "Head of Delivery, Manufacturing",
        relevance:
          "Owns delivery capacity planning for manufacturing accounts; decides pilot staffing.",
        evidence_ids: ["nw-ev-2"],
        confidence: "high",
        linkedin_url: null,
      },
      {
        id: "nw-dm-3",
        name: "Peter Albrecht",
        role: "Head of Partnerships",
        relevance:
          "Negotiates ISV and vendor alliances; would run the commercial track with Aivera.",
        evidence_ids: ["nw-ev-3"],
        confidence: "medium",
        linkedin_url: null,
      },
    ],
    unknowns: [
      "Depth of applied AI/ML delivery experience beyond classical integration projects.",
      "Willingness to co-sell a young vendor's platform versus pure staff-augmentation economics.",
    ],
    profile: {
      overview:
        "NordWerk Systems AG is a Stuttgart system integrator with ~470 employees, focused on digitalising manufacturing operations. It implements and runs SAP, Siemens Opcenter and adjacent shop-floor systems, and maintains a 60-person development centre for custom production software.",
      services: [
        "MES implementation & migration (Siemens Opcenter)",
        "ERP integration (SAP S/4HANA)",
        "Shop-floor / IoT connectivity",
        "Custom production software development",
        "Managed operations & support",
        "Hybrid cloud infrastructure for manufacturing workloads",
      ],
      industry_expertise: [
        {
          industry: "Automotive & suppliers",
          detail: "Core segment — the majority of documented case studies are automotive manufacturing.",
          evidence_ids: ["nw-ev-2"],
        },
        {
          industry: "Industrial machinery",
          detail: "Secondary segment with several line-digitalisation projects.",
          evidence_ids: ["nw-ev-2"],
        },
      ],
      technology: {
        stack: [
          "SAP S/4HANA (certified partner)",
          "Siemens Opcenter MES (certified partner)",
          "Azure Deutschland / EU regions",
          "OPC-UA & MQTT shop-floor connectivity",
        ],
        integrations: ["SAP S/4HANA", "Siemens Opcenter", "SAP ME/MII", "Azure IoT Hub"],
        notes:
          "Exactly the integration surface Aivera Flow depends on: certified SAP + MES practice with EU-cloud delivery experience. Aivera's OPC-UA ingestion aligns with NordWerk's connectivity standard.",
        evidence_ids: ["nw-ev-1", "nw-ev-2"],
      },
      hiring_momentum: {
        summary:
          "Steady hiring in delivery roles; two senior “AI in manufacturing” positions suggest a deliberate push beyond classical integration.",
        signals: [
          {
            signal: "9 open delivery roles (Stuttgart, Munich) including 2 senior AI-in-manufacturing positions.",
            evidence_ids: ["nw-ev-4"],
          },
        ],
      },
      partnership_rationale:
        "NordWerk is the delivery backbone: certified on the exact MES/ERP estates in Aivera's target customers, with an in-house bench large enough to run several concurrent pilots. Its moderate domain positioning is offset by RhineForge's advisory anchor.",
    },
    evidence: [
      ev(
        "nw-ev-1",
        "Partner certifications page — SAP, Siemens, Microsoft Azure",
        "nordwerk/certifications",
        "Company website",
        4,
        "verified",
      ),
      ev(
        "nw-ev-2",
        "Case study collection — smart-factory rollouts (automotive & machinery)",
        "nordwerk/case-studies",
        "Company website",
        4,
        "verified",
      ),
      ev(
        "nw-ev-3",
        "Press release: partnership-team expansion for ISV alliances",
        "nordwerk/press/isv-alliances",
        "Company website / press",
        4,
        "verified",
      ),
      ev(
        "nw-ev-4",
        "Careers page — 9 delivery roles incl. 2 senior AI-in-manufacturing",
        "nordwerk/careers",
        "Company website",
        4,
        "verified",
      ),
      ev(
        "nw-ev-5",
        "Claim: “60-person development centre” in about-us",
        "nordwerk/about",
        "Company website",
        4,
        "unverified",
        "Self-reported; consistent with company size but not independently audited.",
      ),
    ],
  },
  {
    id: "baltic",
    name: "Baltic Digital Consulting",
    website: "https://www.baltic-digital.example",
    hq: "Hamburg, Germany",
    category: "technology",
    employees: "35–45",
    strategic_fit: 84,
    activation_readiness: 66,
    evidence_confidence: "medium",
    capabilities: [
      { key: "manufacturing_domain", name: "Manufacturing domain expertise", level: "moderate" },
      { key: "mes_erp_integration", name: "MES / ERP technical integration", level: "moderate" },
      { key: "enterprise_implementation", name: "Enterprise implementation & delivery", level: "moderate" },
    ],
    geography: ["Germany"],
    technology_compatibility: {
      score: 82,
      notes:
        "Strong data-engineering and MLOps practice; builds production data platforms on EU infrastructure. Smaller bench means multi-site rollouts would strain capacity.",
    },
    decision_makers: [
      {
        id: "bd-dm-1",
        name: "Katrin Seidel",
        role: "Founder & Managing Director",
        relevance: "Owner-decision-maker; personally leads strategic client engagements.",
        evidence_ids: ["bd-ev-1"],
        confidence: "high",
        linkedin_url: null,
      },
      {
        id: "bd-dm-2",
        name: "Jonas Petersen",
        role: "Lead Data Engineer",
        relevance: "Would architect any joint data platform work.",
        evidence_ids: ["bd-ev-2"],
        confidence: "medium",
        linkedin_url: null,
      },
    ],
    unknowns: [
      "Ability to staff more than one concurrent enterprise engagement.",
      "No documented manufacturing-domain references — industrial clients are self-reported.",
    ],
    profile: {
      overview:
        "Baltic Digital Consulting is a Hamburg data-and-AI consultancy (~40 people) building production data platforms and ML systems for mid-size enterprises. It positions as a senior, hands-on boutique rather than a staffing house.",
      services: [
        "Data platform engineering",
        "MLOps & model operations",
        "Analytics enablement",
        "AI strategy prototyping",
      ],
      industry_expertise: [
        {
          industry: "Logistics & manufacturing (self-reported)",
          detail: "References page names two industrial clients; no detailed case studies published.",
          evidence_ids: ["bd-ev-3"],
        },
      ],
      technology: {
        stack: ["Python / dbt / Airflow", "Kubernetes on EU regions", "MLOps tooling (MLflow, Feast)"],
        integrations: ["REST / OPC-UA ingestion (project-based)"],
        notes:
          "Excellent engineering fit for Aivera Flow's data layer; less proven on the shop-floor MES/ERP side.",
        evidence_ids: ["bd-ev-2"],
      },
      hiring_momentum: {
        summary: "Modest, steady hiring; senior-heavy profile with few graduate roles.",
        signals: [
          { signal: "3 open senior data-engineering roles (Hamburg).", evidence_ids: ["bd-ev-4"] },
        ],
      },
      partnership_rationale:
        "The best pure-engineering alternative in the candidate set — and the key proof that portfolio optimisation matters: Baltic scores 2nd individually, but overlaps heavily with RhineForge's domain role while covering neither distribution nor cloud delivery.",
    },
    evidence: [
      ev("bd-ev-1", "Founder profile — Katrin Seidel", "baltic/team#seidel", "Company website", 6, "verified"),
      ev("bd-ev-2", "Services page — data platform & MLOps", "baltic/services", "Company website", 6, "verified"),
      ev("bd-ev-3", "References page — two industrial clients (unnamed)", "baltic/references", "Company website", 6, "unverified", "Clients not named; claim cannot be corroborated."),
      ev("bd-ev-4", "Careers page — 3 senior data-engineering roles", "baltic/careers", "Company website", 6, "verified"),
    ],
  },
  {
    id: "alpencloud",
    name: "AlpenCloud Solutions GmbH",
    website: "https://www.alpencloud.example",
    hq: "Munich, Germany",
    category: "cloud",
    employees: "60–80",
    strategic_fit: 78,
    activation_readiness: 69,
    evidence_confidence: "medium",
    capabilities: [
      { key: "eu_cloud_deployment", name: "EU cloud deployment & data residency", level: "strong" },
      { key: "enterprise_implementation", name: "Enterprise implementation & delivery", level: "moderate" },
    ],
    geography: ["Germany", "Austria", "Switzerland"],
    technology_compatibility: {
      score: 84,
      notes:
        "Runs sovereign-EU managed Kubernetes and data services; ISV onboarding program documented. Direct fit for Aivera Flow's EU deployment model.",
    },
    decision_makers: [
      {
        id: "ac-dm-1",
        name: "Stefan Maier",
        role: "CEO",
        relevance: "Drives the ISV-partner program; fast decision path for platform partnerships.",
        evidence_ids: ["ac-ev-1"],
        confidence: "high",
        linkedin_url: null,
      },
      {
        id: "ac-dm-2",
        name: "Miriam Falk",
        role: "Head of Partner Engineering",
        relevance: "Owns technical onboarding of ISV platforms onto the sovereign stack.",
        evidence_ids: ["ac-ev-2"],
        confidence: "high",
        linkedin_url: null,
      },
    ],
    unknowns: [
      "Managed-service pricing for ISV workloads at production scale is not published.",
      "C5 attestation is listed as “in progress” — current compliance scope is unclear.",
    ],
    profile: {
      overview:
        "AlpenCloud Solutions is a Munich-based sovereign-cloud provider (~70 employees) offering EU-hosted infrastructure and managed data services, with a documented ISV onboarding program for software vendors.",
      services: [
        "Sovereign EU managed Kubernetes",
        "Managed data services (Postgres, Kafka, object storage)",
        "ISV platform onboarding & operations",
        "Compliance & data-residency consulting",
      ],
      industry_expertise: [
        {
          industry: "Regulated & industrial sectors",
          detail: "Positions explicitly on German data-residency requirements for production data.",
          evidence_ids: ["ac-ev-1"],
        },
      ],
      technology: {
        stack: ["Managed Kubernetes (EU regions)", "PostgreSQL / Kafka / S3-compatible storage", "Terraform-based provisioning"],
        integrations: ["Azure Deutschland interconnect", "On-prem edge connectivity"],
        notes:
          "Can host Aivera Flow's EU deployment model out of the box; ISV program reduces time-to-production for the platform.",
        evidence_ids: ["ac-ev-2"],
      },
      hiring_momentum: {
        summary: "Growing partner-engineering and compliance teams — consistent with ISV push.",
        signals: [
          { signal: "4 open roles: partner engineering (2), compliance (2).", evidence_ids: ["ac-ev-3"] },
        ],
      },
      partnership_rationale:
        "AlpenCloud closes the portfolio's cloud gap: sovereign EU hosting with an ISV onboarding path, letting Aivera answer the data-residency question German industrial buyers ask first.",
    },
    evidence: [
      ev("ac-ev-1", "About page — sovereign cloud positioning & ISV program", "alpencloud/about", "Company website", 5, "verified"),
      ev("ac-ev-2", "ISV onboarding program page", "alpencloud/isv-program", "Company website", 5, "verified"),
      ev("ac-ev-3", "Careers page — partner engineering & compliance roles", "alpencloud/careers", "Company website", 5, "verified"),
      ev("ac-ev-4", "Claim: “C5 attestation in progress”", "alpencloud/compliance", "Company website", 5, "unverified", "Self-declared status; no public attestation document found."),
    ],
  },
  {
    id: "hansetech",
    name: "HanseTech Distribution AG",
    website: "https://www.hansetech.example",
    hq: "Frankfurt, Germany",
    category: "reseller",
    employees: "200–250",
    strategic_fit: 71,
    activation_readiness: 58,
    evidence_confidence: "medium",
    capabilities: [
      { key: "german_distribution", name: "German-market distribution & channel", level: "strong" },
      { key: "industry_relationships", name: "Industry relationships & references", level: "moderate" },
    ],
    geography: ["Germany"],
    technology_compatibility: {
      score: 52,
      notes:
        "Distribution-first business; technical services limited to pre-sales support. Would depend on NordWerk or Aivera directly for implementation.",
    },
    decision_makers: [
      {
        id: "ht-dm-1",
        name: "Bernd Krüger",
        role: "Chief Revenue Officer",
        relevance: "Owns vendor onboarding and reseller economics for the industrial software portfolio.",
        evidence_ids: ["ht-ev-1"],
        confidence: "high",
        linkedin_url: null,
      },
      {
        id: "ht-dm-2",
        name: "Anja Roth",
        role: "Head of Vendor Management",
        relevance: "Runs day-to-day vendor relationships and co-marketing programs.",
        evidence_ids: ["ht-ev-2"],
        confidence: "medium",
        linkedin_url: null,
      },
    ],
    unknowns: [
      "Resale economics for AI platforms (subscription vs. license) are not documented.",
      "Depth of technical services beyond pre-sales is unclear.",
    ],
    profile: {
      overview:
        "HanseTech Distribution AG is a Frankfurt-based value-added distributor for industrial software with an established reseller network across the German Mittelstand.",
      services: [
        "Value-added distribution & reseller channel management",
        "Vendor onboarding & channel enablement",
        "Co-marketing & demand generation",
        "Pre-sales technical support",
      ],
      industry_expertise: [
        {
          industry: "Industrial software (horizontal)",
          detail: "Distributes MES, QMS and industrial-analytics products to manufacturing end customers.",
          evidence_ids: ["ht-ev-3"],
        },
      ],
      technology: {
        stack: ["Channel & license operations tooling"],
        integrations: [],
        notes:
          "Not an engineering partner — the value is transactional reach into the Mittelstand and reseller enablement.",
        evidence_ids: ["ht-ev-3"],
      },
      hiring_momentum: {
        summary: "Hiring channel managers — signals investment in vendor portfolio expansion.",
        signals: [
          { signal: "4 open channel-manager roles (Frankfurt, remote).", evidence_ids: ["ht-ev-4"] },
        ],
      },
      partnership_rationale:
        "HanseTech contributes the distribution capability no advisory or SI partner provides: an existing reseller network reaching mid-size manufacturers at transactional scale.",
    },
    evidence: [
      ev("ht-ev-1", "Leadership page — CRO Bernd Krüger", "hansetech/leadership", "Company website", 7, "verified"),
      ev("ht-ev-2", "Press: vendor-management team expansion", "hansetech/press", "Company website", 7, "verified"),
      ev("ht-ev-3", "Portfolio page — industrial software categories", "hansetech/portfolio", "Company website", 7, "verified"),
      ev("ht-ev-4", "Careers page — 4 channel-manager roles", "hansetech/careers", "Company website", 7, "verified"),
    ],
  },
  {
    id: "sachsencore",
    name: "Sachsencore Analytics GmbH",
    website: "https://www.sachsencore.example",
    hq: "Dresden, Germany",
    category: "technology",
    employees: "25–35",
    strategic_fit: 76,
    activation_readiness: 62,
    evidence_confidence: "medium",
    capabilities: [
      { key: "manufacturing_domain", name: "Manufacturing domain expertise", level: "moderate" },
      { key: "mes_erp_integration", name: "MES / ERP technical integration", level: "moderate" },
    ],
    geography: ["Germany (East)", "Czech Republic"],
    technology_compatibility: {
      score: 74,
      notes: "Manufacturing-analytics product stack; OPC-UA native. Integration depth with SAP estates unproven.",
    },
    decision_makers: [
      {
        id: "sc-dm-1",
        name: "Dr. Rainer Oettel",
        role: "CEO & Co-founder",
        relevance: "Technical founder; leads partnerships directly.",
        evidence_ids: ["sc-ev-1"],
        confidence: "medium",
        linkedin_url: null,
      },
    ],
    unknowns: [
      "Delivery capacity beyond the product team is unknown.",
      "Potential channel conflict: analytics product overlaps partially with Aivera Flow's scheduling module.",
    ],
    profile: {
      overview:
        "Sachsencore Analytics is a Dresden-based vendor of manufacturing-analytics software (~30 employees) with customers in Saxony's industrial belt and the Czech Republic.",
      services: ["Manufacturing analytics SaaS", "OEE dashboards", "Line-monitoring implementations"],
      industry_expertise: [
        { industry: "Discrete manufacturing (regional)", detail: "Regional customer base in machinery and electronics manufacturing.", evidence_ids: ["sc-ev-2"] },
      ],
      technology: {
        stack: ["OPC-UA collectors", "Time-series analytics", "Grafana-based dashboards"],
        integrations: ["OPC-UA", "MES data hooks (project-based)"],
        notes: "Complementary data-collection footprint; possible product overlap in analytics dashboards.",
        evidence_ids: ["sc-ev-2"],
      },
      hiring_momentum: {
        summary: "Small, stable team; no significant hiring signal detected.",
        signals: [{ signal: "1 open full-stack role (Dresden).", evidence_ids: ["sc-ev-3"] }],
      },
      partnership_rationale:
        "A credible regional technology ally in East Germany and a possible co-sell partner, but partial product overlap makes it a second-choice technology partner behind Baltic Digital.",
    },
    evidence: [
      ev("sc-ev-1", "Team page — CEO profile", "sachsencore/team", "Company website", 9, "verified"),
      ev("sc-ev-2", "Product page — manufacturing analytics", "sachsencore/product", "Company website", 9, "verified"),
      ev("sc-ev-3", "Careers page", "sachsencore/careers", "Company website", 9, "verified"),
    ],
  },
  {
    id: "elbe",
    name: "Elbe Systems GmbH",
    website: "https://www.elbe-systems.example",
    hq: "Hamburg, Germany",
    category: "implementation",
    employees: "80–100",
    strategic_fit: 73,
    activation_readiness: 60,
    evidence_confidence: "medium",
    capabilities: [
      { key: "enterprise_implementation", name: "Enterprise implementation & delivery", level: "moderate" },
      { key: "mes_erp_integration", name: "MES / ERP technical integration", level: "moderate" },
    ],
    geography: ["Germany (North)"],
    technology_compatibility: {
      score: 70,
      notes: "Solid ERP implementation practice; MES experience concentrated in food & beverage, not discrete manufacturing.",
    },
    decision_makers: [
      {
        id: "es-dm-1",
        name: "Claudia Wiese",
        role: "Managing Director",
        relevance: "Owns partnership decisions for the implementation practice.",
        evidence_ids: ["es-ev-1"],
        confidence: "medium",
        linkedin_url: null,
      },
    ],
    unknowns: [
      "Discrete-manufacturing references are thin — most case studies are process industry.",
      "Cloud-delivery experience not evidenced.",
    ],
    profile: {
      overview:
        "Elbe Systems is a Hamburg implementation boutique (~90 people) for ERP and operations software, strongest in process industries.",
      services: ["ERP implementation", "Operations-software rollout", "System migration", "Training & enablement"],
      industry_expertise: [
        { industry: "Food & beverage / process industry", detail: "Majority of published case studies.", evidence_ids: ["es-ev-2"] },
        { industry: "Discrete manufacturing (limited)", detail: "Two machinery projects listed.", evidence_ids: ["es-ev-2"] },
      ],
      technology: {
        stack: ["Microsoft Dynamics 365", "SAP Business One"],
        integrations: ["Dynamics 365", "SAP Business One"],
        notes: "Mid-market ERP focus; SAP S/4HANA enterprise experience limited.",
        evidence_ids: ["es-ev-2"],
      },
      hiring_momentum: {
        summary: "Stable headcount; no expansion signal.",
        signals: [{ signal: "2 open consultant roles.", evidence_ids: ["es-ev-3"] }],
      },
      partnership_rationale:
        "A cost-effective alternative implementation partner with a smaller bench and lighter manufacturing credentials than NordWerk.",
    },
    evidence: [
      ev("es-ev-1", "Leadership page", "elbe/leadership", "Company website", 11, "verified"),
      ev("es-ev-2", "Case studies page", "elbe/case-studies", "Company website", 11, "verified"),
      ev("es-ev-3", "Careers page", "elbe/careers", "Company website", 11, "verified"),
    ],
  },
  {
    id: "donauvalley",
    name: "DonauValley Advisory",
    website: "https://www.donauvalley.example",
    hq: "Vienna, Austria",
    category: "consultancy",
    employees: "15–25",
    strategic_fit: 68,
    activation_readiness: 55,
    evidence_confidence: "low",
    capabilities: [
      { key: "german_distribution", name: "German-market distribution & channel", level: "moderate" },
      { key: "industry_relationships", name: "Industry relationships & references", level: "moderate" },
    ],
    geography: ["Austria", "Germany (South)"],
    technology_compatibility: {
      score: 40,
      notes: "Pure advisory; no technical delivery capability.",
    },
    decision_makers: [
      {
        id: "dv-dm-1",
        name: "Mag. Andreas Steiner",
        role: "Founder",
        relevance: "Sole decision-maker; network-driven business.",
        evidence_ids: ["dv-ev-1"],
        confidence: "low",
        linkedin_url: null,
      },
    ],
    unknowns: [
      "Client roster is not published; relationship claims are self-reported.",
      "Capacity to support a structured partner program is unclear.",
    ],
    profile: {
      overview:
        "DonauValley Advisory is a small Vienna go-to-market advisory helping software vendors enter DACH markets through partner channels.",
      services: ["Market-entry strategy", "Partner-channel advisory", "Introductions & networking"],
      industry_expertise: [
        { industry: "Enterprise software (horizontal)", detail: "Self-described focus; no named clients.", evidence_ids: ["dv-ev-1"] },
      ],
      technology: {
        stack: [],
        integrations: [],
        notes: "No technical capability — advisory and introductions only.",
        evidence_ids: [],
      },
      hiring_momentum: {
        summary: "No hiring activity detected.",
        signals: [],
      },
      partnership_rationale:
        "Could accelerate initial introductions in Austria, but low verifiability and no delivery capability keep it out of the core portfolio.",
    },
    evidence: [
      ev("dv-ev-1", "Services page — DACH market entry", "donauvalley/services", "Company website", 12, "unverified", "No named clients or references published."),
    ],
  },
  {
    id: "mittelstand",
    name: "Mittelstand Digital AG",
    website: "https://www.mittelstand-digital.example",
    hq: "Nuremberg, Germany",
    category: "reseller",
    employees: "120–140",
    strategic_fit: 61,
    activation_readiness: 57,
    evidence_confidence: "medium",
    capabilities: [
      { key: "german_distribution", name: "German-market distribution & channel", level: "moderate" },
    ],
    geography: ["Germany (South & East)"],
    technology_compatibility: {
      score: 48,
      notes: "Managed-services provider; onboarding software vendors is documented but AI-platform experience is absent.",
    },
    decision_makers: [
      {
        id: "md-dm-1",
        name: "Petra Lehner",
        role: "Head of Portfolio",
        relevance: "Selects new software products for the managed-services portfolio.",
        evidence_ids: ["md-ev-1"],
        confidence: "medium",
        linkedin_url: null,
      },
    ],
    unknowns: [
      "Ability to position an AI platform without a dedicated practice.",
      "Margin expectations for platform resale are unknown.",
    ],
    profile: {
      overview:
        "Mittelstand Digital AG is a Nuremberg managed-services provider and reseller serving small and mid-size German businesses.",
      services: ["IT managed services", "Software resale & licensing", "Cloud migration for SMBs"],
      industry_expertise: [
        { industry: "SMB (cross-industry)", detail: "Broad SMB base; no manufacturing specialisation evidenced.", evidence_ids: ["md-ev-2"] },
      ],
      technology: {
        stack: ["Microsoft 365 / Azure", "SMB backup & security tooling"],
        integrations: [],
        notes: "Generalist SMB focus — weaker fit for production-line AI than industrial specialists.",
        evidence_ids: ["md-ev-2"],
      },
      hiring_momentum: {
        summary: "Moderate hiring across service desks.",
        signals: [{ signal: "7 open IT-service roles.", evidence_ids: ["md-ev-3"] }],
      },
      partnership_rationale:
        "A fallback distribution alternative to HanseTech with a managed-services angle, but weaker industrial reach.",
    },
    evidence: [
      ev("md-ev-1", "About page — portfolio team", "mittelstand/about", "Company website", 10, "verified"),
      ev("md-ev-2", "Portfolio page", "mittelstand/portfolio", "Company website", 10, "verified"),
      ev("md-ev-3", "Careers page", "mittelstand/careers", "Company website", 10, "verified"),
    ],
  },
  {
    id: "ruhrbyte",
    name: "RuhrByte Technologies GmbH",
    website: "https://www.ruhrbyte.example",
    hq: "Dortmund, Germany",
    category: "technology",
    employees: "20–30",
    strategic_fit: 57,
    activation_readiness: 49,
    evidence_confidence: "low",
    capabilities: [
      { key: "mes_erp_integration", name: "MES / ERP technical integration", level: "emerging" },
    ],
    geography: ["Germany (West)"],
    technology_compatibility: {
      score: 61,
      notes: "Young software house with IIoT projects; limited enterprise track record.",
    },
    decision_makers: [
      {
        id: "rb-dm-1",
        name: "Tobias Wagner",
        role: "CEO",
        relevance: "Founder; runs all client relationships.",
        evidence_ids: ["rb-ev-1"],
        confidence: "low",
        linkedin_url: null,
      },
    ],
    unknowns: [
      "Company sustainability at current size.",
      "No verifiable enterprise references.",
    ],
    profile: {
      overview:
        "RuhrByte Technologies is a young Dortmund software house (~25 people) doing industrial IoT and custom development.",
      services: ["IIoT development", "Custom software", "Proof-of-concept builds"],
      industry_expertise: [
        { industry: "Industrial (project-based)", detail: "Project portfolio lists IIoT work for regional manufacturers.", evidence_ids: ["rb-ev-1"] },
      ],
      technology: {
        stack: ["Node.js", "MQTT", "Grafana"],
        integrations: ["MQTT", "OPC-UA (basic)"],
        notes: "Could support PoC engineering; not yet an enterprise-delivery partner.",
        evidence_ids: ["rb-ev-1"],
      },
      hiring_momentum: {
        summary: "Light hiring; early-stage profile.",
        signals: [{ signal: "2 open developer roles.", evidence_ids: ["rb-ev-2"] }],
      },
      partnership_rationale:
        "Possible PoC engineering support at low cost, but verifiability and scale are insufficient for a core partnership.",
    },
    evidence: [
      ev("rb-ev-1", "Projects page", "ruhrbyte/projects", "Company website", 14, "unverified", "Project descriptions without named clients."),
      ev("rb-ev-2", "Careers page", "ruhrbyte/careers", "Company website", 14, "verified"),
    ],
  },
  {
    id: "ostwind",
    name: "Ostwind Digital GmbH",
    website: "https://www.ostwind.example",
    hq: "Berlin, Germany",
    category: "consultancy",
    employees: "10–20",
    strategic_fit: 54,
    activation_readiness: 44,
    evidence_confidence: "low",
    capabilities: [
      { key: "manufacturing_domain", name: "Manufacturing domain expertise", level: "emerging" },
    ],
    geography: ["Germany"],
    technology_compatibility: {
      score: 35,
      notes: "Digital-agency profile; no industrial delivery evidence.",
    },
    decision_makers: [
      {
        id: "ow-dm-1",
        name: "Luisa Berlin",
        role: "Managing Director",
        relevance: "Founder; generalist digital-transformation consulting.",
        evidence_ids: ["ow-ev-1"],
        confidence: "low",
        linkedin_url: null,
      },
    ],
    unknowns: [
      "Any manufacturing-sector experience — none evidenced publicly.",
      "Business focus appears to be marketing/digital, not operations.",
    ],
    profile: {
      overview:
        "Ostwind Digital is a small Berlin digital-transformation consultancy serving mid-size companies across sectors.",
      services: ["Digital strategy", "Transformation workshops", "Vendor selection support"],
      industry_expertise: [
        { industry: "Cross-industry", detail: "No industrial specialisation found.", evidence_ids: ["ow-ev-1"] },
      ],
      technology: {
        stack: [],
        integrations: [],
        notes: "Strategy workshops only; no technical delivery.",
        evidence_ids: [],
      },
      hiring_momentum: {
        summary: "No meaningful hiring signal.",
        signals: [],
      },
      partnership_rationale:
        "Weak fit: no verifiable manufacturing expertise or delivery capability relevant to Aivera's brief.",
    },
    evidence: [
      ev("ow-ev-1", "Services page", "ostwind/services", "Company website", 15, "unverified", "Generalist positioning; no named industrial clients."),
    ],
  },
  {
    id: "falke",
    name: "Falke Informatik AG",
    website: "https://www.falke-informatik.example",
    hq: "Bremen, Germany",
    category: "system_integrator",
    employees: "150–170",
    strategic_fit: 52,
    activation_readiness: 41,
    evidence_confidence: "low",
    capabilities: [
      { key: "enterprise_implementation", name: "Enterprise implementation & delivery", level: "moderate" },
    ],
    geography: ["Germany (North-West)"],
    technology_compatibility: {
      score: 44,
      notes: "Legacy-system integrator; modern data-platform experience not evidenced.",
    },
    decision_makers: [
      {
        id: "fi-dm-1",
        name: "Heinz Falke",
        role: "CEO",
        relevance: "Family-owned business; patriarchal decision structure.",
        evidence_ids: ["fi-ev-1"],
        confidence: "low",
        linkedin_url: null,
      },
    ],
    unknowns: [
      "Modernisation agenda — recent projects skew to legacy maintenance.",
      "Partner-program appetite unknown.",
    ],
    profile: {
      overview:
        "Falke Informatik is a Bremen system house (~160 employees) with a legacy-heavy project portfolio in logistics and trade.",
      services: ["Legacy system maintenance", "IT outsourcing", "On-prem infrastructure"],
      industry_expertise: [
        { industry: "Logistics & trade", detail: "Core sectors per project references.", evidence_ids: ["fi-ev-1"] },
      ],
      technology: {
        stack: ["IBM i", "On-prem Windows estates"],
        integrations: [],
        notes: "Technology stack misaligned with Aivera Flow's cloud-native model.",
        evidence_ids: ["fi-ev-1"],
      },
      hiring_momentum: {
        summary: "Declining headcount signal vs. prior year (self-reported).",
        signals: [],
      },
      partnership_rationale:
        "Weak strategic fit: legacy focus and misaligned technology stack.",
    },
    evidence: [
      ev("fi-ev-1", "References page", "falke/references", "Company website", 13, "unverified", "Self-reported client list without project details."),
    ],
  },
];

export const DEMO_PARTNER_BY_ID = new Map(DEMO_PARTNERS.map((p) => [p.id, p]));
