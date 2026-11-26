import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "@/styles/usman-portfolio.css";

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    number: "01",
    kind: "Interactive demo · Simulated shop",
    title: "AI quote assistant",
    description:
      "A repair-shop assistant that gathers the symptoms, prepares a quote from the shop’s rules, and keeps the owner in control before anything is sent.",
    href: "https://xschaudhry.github.io/#quote",
    linkText: "Try the quote demo",
    visual: "quote",
  },
  {
    number: "02",
    kind: "Workflow demo · Example scenario",
    title: "Lead follow-up",
    description:
      "A clear view of what happens when a new inquiry is answered quickly, offered a real appointment slot, and followed up if it goes quiet.",
    href: "https://xschaudhry.github.io/#followup",
    linkText: "View the follow-up demo",
    visual: "followup",
  },
  {
    number: "03",
    kind: "Calibration tool · Example jobs",
    title: "Quote accuracy kit",
    description:
      "A review flow that compares draft quotes with previously approved examples, flags differences, and makes the reason for each flag visible.",
    href: "https://xschaudhry.github.io/#accuracy",
    linkText: "Explore the calibration kit",
    visual: "calibration",
  },
  {
    number: "04",
    kind: "Interface prototype · Simulated workspace",
    title: "Service-shop command center",
    description:
      "A sample owner view for approvals, follow-ups, and crew questions, bringing the work of several assistants into one place.",
    href: "https://xschaudhry.github.io/#dashboard",
    linkText: "See the command-center demo",
    visual: "command",
  },
  {
    number: "05",
    kind: "CRM demo · Fictional data",
    title: "Lead Desk",
    description:
      "A browser-only HVAC lead desk I built to keep urgent no-heat requests and overdue callbacks visible. It uses made-up customer details, and its email drafts are never sent.",
    href: "https://github.com/xschaudhry/lead-desk-crm-demo",
    linkText: "View the Lead Desk source",
    visual: "lead-desk",
  },
  {
    number: "06",
    kind: "Interactive prototype · Simulated texts",
    title: "HVAC Speed-to-Lead",
    description:
      "I built this to explore the first few minutes after an HVAC inquiry arrives: sort it by urgency, offer visit windows in a simulated text, and choose the next step from the reply. All data is fictional.",
    href: "/demos/hvac-speed-to-lead/index.html",
    linkText: "Open the Speed-to-Lead demo",
    sourceHref: "https://github.com/xschaudhry/hvac-speed-to-lead-demo",
    sourceText: "View the source on GitHub",
    visual: "speed-to-lead",
  },
];

const capabilities = [
  {
    number: "01",
    title: "AI front desk",
    description: "Voice and messaging agents for first response, common questions, and appointment requests—with a clear path to a human.",
  },
  {
    number: "02",
    title: "Speed-to-lead",
    description: "Follow-up across calls, SMS, email, and web inquiries, connected to the team’s CRM and calendar.",
  },
  {
    number: "03",
    title: "GoHighLevel systems",
    description: "Funnels, pipelines, calendars, and workflows that make each lead’s next step visible to the team.",
  },
  {
    number: "04",
    title: "Quoting & operations",
    description: "Practical automations for quotes, reviews, reactivation, internal answers, and repetitive back-office work.",
  },
];

const process = [
  {
    number: "01",
    title: "Find the costly gap",
    description: "Map the path from first inquiry to booked and paid. Rank the missed steps by likely revenue impact using the business’s own numbers.",
  },
  {
    number: "02",
    title: "Build around existing tools",
    description: "Fit the workflow to the business’s CRM, calendar, phone, and operating rules instead of asking the team to replace everything.",
  },
  {
    number: "03",
    title: "Calibrate with the team",
    description: "Run a staff-led review, compare outputs with approved examples, and resolve material differences before expanding what the system can do.",
  },
];

function ProjectVisual({ kind }: { kind: string }) {
  if (kind === "lead-desk") {
    return <img className="project-screenshot" src="/lead-desk-dashboard.png" alt="Lead Desk dashboard with 14 fictional HVAC leads, urgent requests first, and an overdue follow-up." loading="lazy" />;
  }
  if (kind === "speed-to-lead") {
    return (
      <div className="demo-ui demo-ui-stl" aria-hidden="true">
        <div className="demo-window-bar"><i /><i /><i /><span>Copperline Heating &amp; Air · Fictional</span><b className="stl-sim">Simulated SMS</b></div>
        <div className="stl-body">
          <div className="stl-board">
            <div className="stl-row"><span className="stl-pill stl-heat">Urgent</span><b>No heat</b><small>0:41</small><em className="stl-booked">Booked</em></div>
            <div className="stl-row"><span className="stl-pill stl-heat">Urgent</span><b>AC stopped</b><small>0:37</small><em>Awaiting reply</em></div>
            <div className="stl-row"><span className="stl-pill stl-est">Estimate</span><b>New system</b><small>0:52</small><em>Follow-up sent</em></div>
          </div>
          <div className="stl-thread">
            <div className="stl-msg stl-msg-biz">Got your request about no heat. We can get a tech out today: 1) 10 AM–12 PM 2) 12–2 PM</div>
            <div className="stl-msg stl-msg-lead">1</div>
            <div className="stl-msg stl-msg-biz">You're booked for 10 AM–12 PM.</div>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "quote") {
    return (
      <div className="demo-ui demo-ui-quote" aria-hidden="true">
        <div className="demo-window-bar"><i /><i /><i /><span>Riverside Auto · Quote assistant</span></div>
        <div className="demo-chat demo-chat-agent">I can help prepare an estimate. What is happening with your car?</div>
        <div className="demo-chat demo-chat-person">The brakes grind when I slow down.</div>
        <div className="demo-review"><span>Draft quote</span><b>Owner approval required</b><div className="demo-review-line" /><div className="demo-review-line short" /></div>
      </div>
    );
  }
  if (kind === "followup") {
    return (
      <div className="demo-ui demo-ui-followup" aria-hidden="true">
        <div className="demo-window-bar"><i /><i /><i /><span>Lead journey · Example</span></div>
        <div className="demo-timeline"><span className="timeline-dot active" /><div><b>New service inquiry</b><small>Captured from website form</small></div></div>
        <div className="demo-timeline"><span className="timeline-dot active" /><div><b>First response sent</b><small>Approved service information</small></div></div>
        <div className="demo-timeline"><span className="timeline-dot" /><div><b>Appointment offered</b><small>Open times from the calendar</small></div></div>
      </div>
    );
  }
  if (kind === "calibration") {
    return (
      <div className="demo-ui demo-ui-calibration" aria-hidden="true">
        <div className="demo-window-bar"><i /><i /><i /><span>Quote review · Example jobs</span></div>
        <div className="demo-score"><b>8 <small>of 10 within review range</small></b><span>2 need a closer look</span></div>
        <div className="demo-table"><span>Brake inspection</span><b>Matched</b><span>Air conditioning repair</span><b className="flagged">Review</b><span>Oil change</span><b>Matched</b><span>Engine diagnostic</span><b className="flagged">Review</b></div>
      </div>
    );
  }
  return (
    <div className="demo-ui demo-ui-command" aria-hidden="true">
      <div className="demo-window-bar"><i /><i /><i /><span>Owner view · Sample workspace</span></div>
      <div className="command-top"><b>Today</b><span>Sample data</span></div>
      <div className="command-grid"><div><small>Needs your review</small><b>03</b></div><div><small>Open follow-ups</small><b>08</b></div><div><small>Crew questions</small><b>02</b></div></div>
      <div className="command-task"><span className="timeline-dot active" /><div><b>Approve draft estimate</b><small>Brake inspection · Riverside Auto</small></div><span className="task-arrow">↗</span></div>
    </div>
  );
}

export default function UsmanPortfolioPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    const context = gsap.context(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      gsap.fromTo(
        ".hero-reveal",
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", delay: 0.1 },
      );

      gsap.utils.toArray<HTMLElement>(".scroll-reveal").forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            ease: "power2.out",
            scrollTrigger: { trigger: element, start: "top 86%", once: true },
          },
        );
      });
    }, page);
    return () => context.revert();
  }, []);

  return (
    <div className="usman-site" ref={pageRef}>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="site-topbar"><span>ISLAMABAD, PAKISTAN <i>·</i> AVAILABLE FOR INTERNATIONAL REMOTE WORK</span><a href="mailto:chaudhry@trxmode.com">CHAUDHRY@TRXMODE.COM</a></div>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Chaudhry Usman, home"><span className="wordmark-mark">CU</span><span>CHAUDHRY USMAN</span></a>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#work">Selected work</a>
          <a href="#capabilities">What I build</a>
          <a href="#about">About</a>
          <a className="nav-contact" href="#contact">Let’s talk <span aria-hidden="true">↗</span></a>
        </nav>
      </header>

      <main id="main">
        <section className="hero-section" id="top">
          <p className="eyebrow hero-reveal"><span className="status-dot" /> AI AUTOMATION CONSULTANT <span className="eyebrow-divider">/</span> TRXMODE</p>
          <h1 className="hero-name hero-reveal">CHAUDHRY USMAN</h1>
          <div className="hero-lower">
            <div className="hero-services hero-reveal" aria-label="Areas of work">
              <a href="#capabilities">AI FRONT DESK <span>↗</span></a>
              <a href="#capabilities">LEAD FOLLOW-UP <span>↗</span></a>
              <a href="#capabilities">GOHIGHLEVEL SYSTEMS <span>↗</span></a>
              <a href="#capabilities">CRM & WORKFLOW INTEGRATION <span>↗</span></a>
              <a href="#work">INTERACTIVE PROJECTS <span>↗</span></a>
            </div>
            <div className="hero-statement hero-reveal">
              <p className="hero-location"><span aria-hidden="true">◎</span> ISLAMABAD, PAKISTAN <i>·</i> WORKING REMOTELY</p>
              <h2><span>AI</span><em>SYSTEMS</em></h2>
              <p className="hero-summary">I build practical AI and automation systems that help service teams answer faster, follow up consistently, and turn more inquiries into booked work.</p>
              <div className="hero-actions">
                <a className="button button-primary" href="#work">EXPLORE SELECTED WORK <span aria-hidden="true">↗</span></a>
                <a className="text-link" href="mailto:chaudhry@trxmode.com">CONTACT ME <span aria-hidden="true">↗</span></a>
              </div>
            </div>
          </div>
          <div className="hero-bottomline"><span>AI IMPLEMENTATION · WORKFLOWS · GOHIGHLEVEL</span><a href="#work">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></a></div>
        </section>

        <section className="intro-section section-pad" id="about">
          <div className="section-kicker scroll-reveal"><span>01</span> A PRACTICAL OPERATOR’S VIEW</div>
          <div className="intro-grid">
            <h2 className="section-heading scroll-reveal">Automation should solve a <em>business problem</em> before it adds another tool.</h2>
            <div className="intro-copy scroll-reveal">
              <p>I’ve spent more than a decade building and operating e-commerce, product, and AI ventures. That work taught me where small teams lose time and revenue: unanswered calls, slow lead response, quotes that take too long, and admin that depends on someone remembering.</p>
              <p>Through TRXmode, I turn those gaps into focused systems—connected to the CRM, phone, calendar, and rules the business already relies on.</p>
              <a className="text-link" href="https://www.linkedin.com/in/xschaudhry/" target="_blank" rel="noreferrer">Connect on LinkedIn <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <div className="experience-strip scroll-reveal"><span className="experience-date">2026 — NOW</span><div><b>Founder & AI Automation Consultant</b><small>TRXmode AI Systems · Wolfpack Ventures LLC</small></div><span className="experience-note">Remote · Service businesses</span></div>
          <div className="experience-strip scroll-reveal"><span className="experience-date">BEFORE 2026</span><div><b>Founder & Operator</b><small>E-commerce · Product development · AI ventures</small></div><span className="experience-note">Built and operated end to end</span></div>
        </section>

        <section className="work-section section-pad" id="work">
          <div className="section-kicker scroll-reveal"><span>02</span> SELECTED WORK</div>
          <div className="section-intro-row"><h2 className="section-heading scroll-reveal">See the systems <em>in action.</em></h2><p className="section-side-copy scroll-reveal">Interactive product demonstrations built around service-business workflows. Each demo uses simulated shops, customers, and prices—not client data or client results.</p></div>
          <div className="project-grid">
            {projects.map((project) => (
              <article className={`project-card project-${project.visual}${project.sourceHref ? " has-source" : ""} scroll-reveal`} key={project.number}>
                <a className="project-card-link" href={project.href} target="_blank" rel="noreferrer" aria-label={`${project.linkText} (opens in a new tab)`}>
                  <div className="project-visual"><ProjectVisual kind={project.visual} /><span className="project-visual-arrow" aria-hidden="true">↗</span></div>
                  <div className="project-info"><div className="project-meta"><span>{project.number} / {String(projects.length).padStart(2, "0")}</span><span>{project.kind}</span></div><h3>{project.title}</h3><p>{project.description}</p><span className="project-cta">{project.linkText} <span aria-hidden="true">↗</span></span></div>
                </a>
                {project.sourceHref && (
                  <a className="project-source-link" href={project.sourceHref} target="_blank" rel="noreferrer" aria-label={`${project.sourceText} (opens in a new tab)`}>{project.sourceText} <span aria-hidden="true">↗</span></a>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="capabilities-section section-pad" id="capabilities">
          <div className="section-kicker scroll-reveal"><span>03</span> WHAT I BUILD</div>
          <div className="section-intro-row"><h2 className="section-heading scroll-reveal">The useful layer between <em>people and process.</em></h2><p className="section-side-copy scroll-reveal">I’m open to international remote roles in AI automation, implementation, and GoHighLevel systems, as well as focused builds for service businesses.</p></div>
          <div className="capability-list">
            {capabilities.map((item) => <article className="capability-row scroll-reveal" key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.description}</p><span className="capability-arrow" aria-hidden="true">↗</span></article>)}
          </div>
          <div className="tool-line scroll-reveal"><span>TOOLS & CHANNELS</span><p>GoHighLevel · Voice AI · OpenAI · Claude · Zapier · Make · n8n · Webhooks · CRM & calendar integrations · SMS · WhatsApp · Instagram · Email</p></div>
        </section>

        <section className="method-section section-pad">
          <div className="section-kicker scroll-reveal"><span>04</span> HOW I WORK</div>
          <div className="section-intro-row"><h2 className="section-heading scroll-reveal">Start with the leak. <em>Prove the fix.</em></h2><p className="section-side-copy scroll-reveal">A measured, human-reviewed delivery process keeps the automation tied to the real work of the team.</p></div>
          <div className="process-grid">{process.map((item) => <article className="process-card scroll-reveal" key={item.number}><span className="process-number">{item.number}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-glow" aria-hidden="true" />
          <div className="contact-content scroll-reveal"><p className="eyebrow"><span className="status-dot" /> AVAILABLE FOR REMOTE WORK</p><h2>Have a workflow that’s <em>losing the next step?</em></h2><p>Tell me what your team is trying to improve. I’m open to remote AI automation and implementation roles, contract work, and focused service-business builds.</p><div className="contact-actions"><a className="button button-light" href="mailto:chaudhry@trxmode.com">chaudhry@trxmode.com <span aria-hidden="true">↗</span></a><a className="contact-link" href="https://www.linkedin.com/in/xschaudhry/" target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a><a className="contact-link" href="https://github.com/xschaudhry" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a></div></div>
          <div className="contact-signature" aria-hidden="true">CU</div>
        </section>
      </main>

      <footer className="site-footer"><a className="wordmark" href="#top"><span className="wordmark-mark">CU</span><span>CHAUDHRY USMAN</span></a><span>AI automation · Islamabad, Pakistan</span><a href="#top">Back to top ↑</a><span>© {new Date().getFullYear()} Chaudhry Usman</span></footer>
    </div>
  );
}
