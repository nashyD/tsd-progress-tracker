// Source of truth for all launch-prep tasks and milestones.
// Pulled from TSD_Launch_Preparation_Plan.pptx (Apr 6–Apr 30, 2026).

export const LAUNCH_DATE = "2026-05-01";

export const OWNERS = {
  Nash: { name: "Nash Davis", role: "CEO & Mod. Solutions Lead", color: "#7c5cfc" },
  Bishop: { name: "Bishop Switzer", role: "COO & Detailing Lead", color: "#06d6a0" },
  Grant: { name: "Grant Tadlock", role: "CFO & Sales Lead", color: "#f472b6" },
  All: { name: "All Founders", role: "Shared responsibility", color: "#fbbf24" },
};

export const WEEKS = [
  { id: 1, label: "Week 1", theme: "Legal & Formation", dates: "Apr 6–12", note: "Critical path: The LLC must be filed before the bank account can be opened." },
  { id: 2, label: "Week 2", theme: "Equipment & Systems", dates: "Apr 13–19", note: "Bishop leads equipment procurement; Nash and Grant build the digital infrastructure." },
  { id: 3, label: "Week 3", theme: "Marketing & Outreach", dates: "Apr 20–26", note: "Goal: pre-book 5–8 detailing jobs and line up 2–3 Modernization discovery calls before May 1." },
  { id: 4, label: "Week 4", theme: "Final Readiness", dates: "Apr 27–30", note: "Short week (4 days). Everything tested, confirmed, and ready to go live May 1." },
];

export const TASKS = [
  // ── Week 1 ─────────────────────────────────────────────────
  { id: "w1-1", week: 1, title: "File NC Articles of Organization", desc: "Submit LLC filing via NC Secretary of State ($125)", owner: "Nash" },
  { id: "w1-2", week: 1, title: "Draft Operating Agreement", desc: "Equal thirds, dissolution date Aug 31, majority vote rules", owner: "Nash" },
  { id: "w1-3", week: 1, title: "Apply for Federal EIN", desc: "Free via IRS.gov — needed for bank account", owner: "Nash" },
  { id: "w1-4", week: 1, title: "Open Business Checking Account", desc: "Relay or Mercury (free); all 3 founders get access", owner: "Grant" },
  { id: "w1-5", week: 1, title: "Set Up Shared Gmail", desc: "tsdincorporated@gmail.com — single client inbox", owner: "Nash" },
  { id: "w1-6", week: 1, title: "Create Shared Google Drive", desc: "Folder structure: Financials, Clients, Marketing, Legal", owner: "Bishop" },
  { id: "w1-7", week: 1, title: "Research NC Sales Tax Requirements", desc: "Determine if detailing/consulting services require collection", owner: "Grant" },
  { id: "w1-8", week: 1, title: "Sign Operating Agreement (All 3)", desc: "Schedule in-person meetup to sign and align on all terms", owner: "All" },

  // ── Week 2 ─────────────────────────────────────────────────
  { id: "w2-1", week: 2, title: "Purchase Detailing Equipment", desc: "Pressure washer, foam cannon, polisher, vacuum ($510–$850)", owner: "Bishop" },
  { id: "w2-2", week: 2, title: "Order Chemicals & Supplies", desc: "APC, dressing, wax, ceramic coating, microfiber towels (bulk)", owner: "Bishop" },
  { id: "w2-3", week: 2, title: "Set Up HouseCall Pro / Google Cal", desc: "Booking system for detailing — scheduling + Square payments", owner: "Bishop" },
  { id: "w2-4", week: 2, title: "Build Notion CRM Workspace", desc: "Mod. Solutions pipeline: Leads, Proposals, Active, Completed", owner: "Nash" },
  { id: "w2-5", week: 2, title: "Set Up Square / Venmo Business", desc: "Payment processing for detailing jobs (contactless + Venmo)", owner: "Grant" },
  { id: "w2-6", week: 2, title: "Configure HoneyBook or Wave", desc: "Invoicing for Modernization Solutions projects", owner: "Grant" },
  { id: "w2-7", week: 2, title: "Create Proposal & SLA Templates", desc: "Mod. Solutions: 1–2 page proposal PDF + service agreements", owner: "Nash" },
  { id: "w2-8", week: 2, title: "Order Branded Shirts (x3)", desc: "TSD Incorporated polos/tees for professional appearance", owner: "Bishop" },

  // ── Week 3 ─────────────────────────────────────────────────
  { id: "w3-1", week: 3, title: "Set Up Google Business Profile", desc: "Mobile detailing listing — photos, hours, service area, reviews", owner: "Nash" },
  { id: "w3-2", week: 3, title: "Create Instagram & TikTok Accounts", desc: "@tsddetailing — branding, bio, first 3 placeholder posts", owner: "Nash" },
  { id: "w3-3", week: 3, title: "Build Personal Outreach Lists (20–30 ea.)", desc: "Each founder lists contacts: family, friends, neighbors, colleagues", owner: "All" },
  { id: "w3-4", week: 3, title: "Begin Warm Outreach (Text/Call)", desc: "Announce TSD to personal networks; pre-book 5–8 detailing jobs", owner: "All" },
  { id: "w3-5", week: 3, title: "Draft LinkedIn Content Strategy", desc: "3–4 post ideas for Mod. Solutions (AI for small biz thought pieces)", owner: "Nash" },
  { id: "w3-6", week: 3, title: "Design Door Hangers / Yard Signs", desc: "Low-cost physical marketing; Canva templates for local print shop", owner: "Grant" },
  { id: "w3-7", week: 3, title: "Join Nextdoor & Facebook Groups", desc: "Gastonia, Belmont, south Charlotte neighborhood groups", owner: "Grant" },
  { id: "w3-8", week: 3, title: "Reach Out to Family Business Contacts", desc: "Parents' networks for Mod. Solutions warm intros", owner: "All" },

  // ── Week 4 ─────────────────────────────────────────────────
  { id: "w4-1", week: 4, title: "Test All Equipment (Dry Run)", desc: "Practice a full detail job on a founder's car — document issues", owner: "Bishop" },
  { id: "w4-2", week: 4, title: "Finalize Service Pricing Card", desc: "Print and digital: all 6 detailing tiers + Mod. Solutions packages", owner: "Nash" },
  { id: "w4-3", week: 4, title: "Confirm First Week Bookings", desc: "Lock in May 1–7 jobs; send confirmation texts with address/time", owner: "Bishop" },
  { id: "w4-4", week: 4, title: "Rehearse Mod. Solutions Sales Pitch", desc: "30-sec elevator pitch + free Tech Audit offer scripted", owner: "Grant" },
  { id: "w4-5", week: 4, title: "Set Up Financial Tracking Sheet", desc: "Google Sheet: income, expenses, per-job tracking, by subsidiary", owner: "Grant" },
  { id: "w4-6", week: 4, title: "Final Founder Alignment Meeting", desc: "Review all systems, confirm roles, finalize Week 1 schedule", owner: "All" },
  { id: "w4-7", week: 4, title: "Publish First LinkedIn Post", desc: "Mod. Solutions announcement — AI for small business thought piece", owner: "Nash" },
  { id: "w4-8", week: 4, title: "Load Vehicle with All Equipment", desc: "Organize supplies, chemicals, towels — ready-to-deploy mobile kit", owner: "Bishop" },
];

export const MILESTONES = [
  { id: "m1", date: "Apr 8",  iso: "2026-04-08", label: "LLC filed with NC Secretary of State" },
  { id: "m2", date: "Apr 10", iso: "2026-04-10", label: "EIN obtained & Operating Agreement signed" },
  { id: "m3", date: "Apr 14", iso: "2026-04-14", label: "Bank account open & funded" },
  { id: "m4", date: "Apr 17", iso: "2026-04-17", label: "All equipment purchased & tested" },
  { id: "m5", date: "Apr 22", iso: "2026-04-22", label: "Google Business Profile live" },
  { id: "m6", date: "Apr 25", iso: "2026-04-25", label: "5+ detailing jobs pre-booked for May" },
  { id: "m7", date: "Apr 28", iso: "2026-04-28", label: "Dry run complete — full detail on test car" },
  { id: "m8", date: "Apr 30", iso: "2026-04-30", label: "Final alignment meeting — launch ready" },
];
