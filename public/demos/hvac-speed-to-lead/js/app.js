/* HVAC Speed-to-Lead: simulated workflow engine + UI.
   Nothing here sends a text, places a call or makes a network request.
   All state lives in memory and resets when the page reloads. */
(function () {
  "use strict";

  var D = window.STL_DATA;
  var CO = D.company;
  var DAY = 86400;
  var WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var BASE_WEEKDAY = 2; // demo day 0 is a Tuesday
  var REVEAL_MS = 1000;
  var AFTER_HOURS_START = 22 * 3600 + 40 * 60; // 10:40 PM tonight

  /* ---------- workflow definitions ---------- */

  var TRACKS = {
    urgent: {
      name: "Urgent repair",
      steps: [
        ["received", "Inquiry received", "Website form, consent to text checked"],
        ["call", "Staff call task created", "Right away, even during quiet hours"],
        ["text1", "Instant text with same-day windows", "Under 60 seconds, any hour"],
        ["fu1", "Follow-up text", "5 min after the last text, if no reply"],
        ["booked", "Visit booked", "Confirmation text and calendar hold"]
      ]
    },
    standard: {
      name: "Standard service",
      steps: [
        ["received", "Inquiry received", "Website form, consent to text checked"],
        ["text1", "Instant text with next openings", "Under 60 seconds, or 8 AM in quiet hours"],
        ["fu1", "Follow-up text", "30 min after the last text, if no reply"],
        ["fu2", "Last check-in", "Next morning at 9 AM"],
        ["close", "Close as no response", "One day after the last check-in"],
        ["booked", "Visit booked", "Confirmation text and calendar hold"]
      ]
    },
    estimate: {
      name: "Estimate",
      steps: [
        ["received", "Inquiry received", "Website form, consent to text checked"],
        ["text1", "Instant text with estimate times", "Under 60 seconds, or 8 AM in quiet hours"],
        ["fu1", "Follow-up text", "2 hours after the last text, if no reply"],
        ["fu2", "Last check-in", "Next morning at 10 AM"],
        ["close", "Close as no response", "Two days after the last check-in"],
        ["booked", "Estimate visit booked", "Confirmation text and calendar hold"]
      ]
    }
  };

  var RX = {
    stop: /^\s*(stop|unsubscribe|quit|end|cancel)\s*[.!]?\s*$/i,
    notInterested: /not interested|no longer (need|interested|needed)|no thanks|never ?mind|found someone|went with (someone|another)|already (fixed|booked|got)|don'?t need/i,
    pick: /^\s*(?:reply\s*)?([1-3])\s*[.!]?\s*$/i,
    yes: /^\s*(yes|yep|yeah|sure|ok(ay)?|the first|first one|earliest|that works|sounds good|book it)\b/i,
    price: /price|pricing|cost|how much|charge|\bfee\b|\$/i,
    callback: /\b(call|phone|ring)\b/i,
    noHeat: /\b(no|without)\s+heat\b|\bheat(ing|er)?\s+(isn'?t|is not|won'?t|not|stopped|quit)\b|\bfurnace\b.{0,25}\b(stopped|won'?t|not|isn'?t|quit|cold)\b|blowing cold|freezing/i,
    noCool: /\b(ac|a\/c|air ?condition\w*|cooling)\b.{0,25}\b(stopped|won'?t|not|isn'?t|broke|quit|died)\b|warm air|not cooling|\bno (ac|a\/c|cooling)\b|\bhot in here\b/i,
    estimate: /estimate|quote|replace|replacement|new system|install/i
  };

  /* ---------- time helpers ---------- */

  function pad(n) { return String(n).padStart(2, "0"); }
  function dayLabel(d) { return d === 0 ? "Today" : d === 1 ? "Tomorrow" : WEEK[(BASE_WEEKDAY + d) % 7]; }
  function clock(t) {
    var s = ((t % DAY) + DAY) % DAY;
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return (h % 12 || 12) + ":" + pad(m) + " " + (h >= 12 ? "PM" : "AM");
  }
  function stamp(t) { var d = Math.floor(t / DAY); return (d ? dayLabel(d) + " " : "") + clock(t); }
  function hourLabel(h) { return (h % 12 || 12) + " " + (h % 24 >= 12 ? "PM" : "AM"); }
  function windowLabel(day, h, len) {
    var a = h, b = h + len;
    var left = (a < 12) === (b < 12) ? String(a % 12 || 12) : hourLabel(a);
    return dayLabel(day) + " " + left + "–" + hourLabel(b);
  }
  function elapsed(sec) {
    sec = Math.max(0, Math.round(sec));
    if (sec < 3600) return Math.floor(sec / 60) + ":" + pad(sec % 60);
    if (sec < DAY) return Math.floor(sec / 3600) + "h " + pad(Math.floor((sec % 3600) / 60)) + "m";
    return Math.floor(sec / DAY) + "d " + Math.floor((sec % DAY) / 3600) + "h";
  }
  function parseTime(str) {
    var p = str.split(":").map(Number);
    return p[0] * 3600 + p[1] * 60 + (p[2] || 0);
  }
  function nextMorning(t, h) { return (Math.floor(t / DAY) + 1) * DAY + h * 3600; }

  // Quiet hours: 9 PM to 8 AM. Non-urgent texts wait until 8 AM.
  var QUIET_START = 21, QUIET_END = 8;
  function inQuiet(t) { var h = (t % DAY) / 3600; return h >= QUIET_START || h < QUIET_END; }
  function quietEnd(t) {
    var day = Math.floor(t / DAY), h = (t % DAY) / 3600;
    return (h >= QUIET_START ? day + 1 : day) * DAY + QUIET_END * 3600;
  }
  function sendTime(lead, t) { return lead.track !== "urgent" && inQuiet(t) ? quietEnd(t) : t; }

  function slotsFor(track, t) {
    var day = Math.floor(t / DAY), hr = (t % DAY) / 3600;
    if (track === "urgent") {
      var out = [], d = day, start = Math.max(8, Math.ceil(hr) + 1);
      while (out.length < 3) {
        if (start + 2 > 19) { d += 1; start = 8; }
        out.push(windowLabel(d, start, 2));
        start += 2;
      }
      return out;
    }
    if (track === "standard") return [windowLabel(day + 1, 8, 2), windowLabel(day + 1, 13, 2), windowLabel(day + 2, 10, 2)];
    return [dayLabel(day + 1) + " 9 AM", dayLabel(day + 1) + " 2 PM", dayLabel(day + 2) + " 11 AM"];
  }

  /* ---------- engine ---------- */

  var seq = 0;

  function classifyIssue(text) {
    if (RX.noHeat.test(text)) return { track: "urgent", reason: "the form describes no heat" };
    if (RX.noCool.test(text)) return { track: "urgent", reason: "the form describes no cooling" };
    if (RX.estimate.test(text)) return { track: "estimate", reason: "the form asks for a quote or replacement" };
    return { track: "standard", reason: "no urgent words found in the form" };
  }

  function ev(lead, t, type, title, detail) {
    lead.events.push({ t: t, type: type, title: title, detail: detail || "" });
    lead.clock = Math.max(lead.clock, t);
  }

  // Sends a simulated text at t, or at 8 AM when t is in quiet hours and the
  // lead isn't urgent. Returns the time the text actually goes out.
  function say(lead, t, text, title, detail) {
    var at = sendTime(lead, t);
    if (at > t) ev(lead, t, "hold", "Text held for quiet hours", "Quiet hours are 9 PM–8 AM. It goes out at " + stamp(at) + ".");
    lead.messages.push({ who: "biz", text: text, t: at, held: at > t });
    t = at;
    if (lead.firstReplyAt === null) {
      lead.firstReplyAt = t;
      detail = (detail ? detail + " · " : "") + elapsed(t - lead.receivedAt) + " after the inquiry";
    }
    ev(lead, t, "out", title, detail);
    lead.lastOut = t;
    return t;
  }

  function slotList(lead) {
    return lead.slots.map(function (s, i) { return (i + 1) + ") " + s; }).join("\n");
  }

  function finish(lead, t, outcome, status, note) {
    if (lead.callTaskOpen && (outcome === "booked" || outcome === "lost" || outcome === "optout")) {
      lead.callTaskOpen = false;
      ev(lead, t, "task", "Staff call task closed", outcome === "booked" ? "Visit booked by text, so no call is needed." : "Lead closed, so no call is needed.");
      t += 1;
    }
    lead.stopped = true;
    lead.outcome = outcome;
    lead.status = status;
    if (note) ev(lead, t, "stop", "Workflow stopped", note);
  }

  function createCallTask(lead, t) {
    lead.done.call = true;
    lead.callTaskOpen = true;
    ev(lead, t, "alert", "Staff call task created", "Assigned to the on-call dispatcher right away" + (inQuiet(t) ? ", during quiet hours" : "") + ". No call is placed in this demo.");
  }

  function firstText(lead) {
    var hi = "Hi " + lead.first + ", this is " + CO.name + ". ";
    if (lead.track === "urgent") {
      var today = lead.slots[0].indexOf("Today") === 0;
      return hi + "Got your request about " + lead.short + " at " + lead.street + ". " +
        (today ? "We can get a tech out today:" : "Our earliest windows:") + "\n" + slotList(lead) +
        "\nReply 1, 2 or 3, or reply CALL and we'll phone you. Reply STOP to opt out.";
    }
    if (lead.track === "estimate") {
      return hi + "Thanks for asking about " + lead.short + ". Estimate visits take about an hour. Openings:\n" +
        slotList(lead) + "\nReply 1, 2 or 3, or reply CALL to talk it over first. Reply STOP to opt out.";
    }
    return hi + "Thanks for reaching out about " + lead.short + ". Next openings:\n" + slotList(lead) +
      "\nReply 1, 2 or 3 to book, or ask us anything here. Reply STOP to opt out.";
  }

  function makeLead(person, scenarioKey, t0, delay, issueOverride) {
    var sc = D.scenarios[scenarioKey];
    var issue = issueOverride || sc.issue;
    var cls = classifyIssue(issue);
    var lead = {
      id: "L" + (++seq), name: person.name, first: person.name.split(" ")[0], phone: person.phone, street: person.street,
      scenario: scenarioKey, service: sc.service, short: sc.short, issue: issue,
      track: cls.track, reason: cls.reason, escalated: false,
      receivedAt: t0, firstReplyAt: null, lastOut: t0, clock: t0,
      status: "New", messages: [], events: [], done: {}, slots: [],
      stopped: false, outcome: null, bookedSlot: null, callTaskOpen: false, revealUntil: Infinity
    };
    ev(lead, t0, "in", "Inquiry received", "Website form (sample): “" + issue + "”");
    ev(lead, t0 + 1, "rule", "Sorted as " + TRACKS[lead.track].name, "Because " + cls.reason);
    lead.done.received = true;
    var t1 = t0 + delay;
    if (lead.track === "urgent") createCallTask(lead, t0 + 2);
    lead.slots = slotsFor(lead.track, sendTime(lead, t1));
    say(lead, t1, firstText(lead), "Instant text sent", lead.track === "urgent" ? "Same-day windows offered" : "Open times offered");
    lead.done.text1 = true;
    lead.status = "Awaiting reply";
    return lead;
  }

  function detectIntent(text, lead) {
    if (RX.stop.test(text)) return { kind: "stop" };
    if (RX.notInterested.test(text)) return { kind: "lost" };
    var m = text.match(RX.pick);
    if (m && lead.slots.length) return { kind: "book", index: Number(m[1]) - 1 };
    if (RX.yes.test(text) && lead.slots.length) return { kind: "book", index: 0 };
    if (RX.price.test(text)) return { kind: "price" };
    if (RX.callback.test(text)) return { kind: "callback" };
    if (RX.noHeat.test(text)) return { kind: "urgent", what: "no heat" };
    if (RX.noCool.test(text)) return { kind: "urgent", what: "no cooling" };
    return { kind: "other" };
  }

  function reply(lead, text, t) {
    lead.messages.push({ who: "lead", text: text, t: t });
    ev(lead, t, "in", "Lead replied", "“" + text + "”");
    var intent = detectIntent(text, lead);
    var tr = t + 28 + (text.length % 17);
    var at;

    if (lead.outcome === "optout") {
      ev(lead, t + 1, "stop", "No automated reply", "This lead opted out, so the workflow stays silent.");
      return;
    }
    if (intent.kind === "stop") {
      at = say(lead, tr, "You're opted out of texts from " + CO.name + ". No more messages will be sent. Reply START to opt back in.", "Opt-out confirmation sent");
      finish(lead, at + 1, "optout", "Opted out", "Opt-out recorded. Every scheduled text is cancelled.");
      return;
    }
    if (lead.stopped) {
      ev(lead, t + 1, "task", "Reply logged for the office", "The workflow is already closed, so no automated text goes out.");
      return;
    }

    switch (intent.kind) {
      case "lost":
        at = say(lead, tr, "Understood, " + lead.first + ". We've closed this request and won't follow up again. If anything changes, call " + CO.phone + ".", "Close-out text sent");
        finish(lead, at + 1, "lost", "Not interested", "Marked not interested. Follow-ups cancelled.");
        break;

      case "book":
        var slot = lead.slots[intent.index] || lead.slots[0];
        lead.bookedSlot = slot;
        at = say(lead, tr, "You're booked for " + slot + ". Your technician will text when they're on the way. Need to change it? Just reply here.", "Booking confirmation sent");
        ev(lead, at + 1, "book", "Visit booked", slot + " · held on the sample calendar");
        lead.done.booked = true;
        finish(lead, at + 2, "booked", "Booked", null);
        break;

      case "price":
        var answer = lead.track === "estimate"
          ? "Good question. Our office will confirm pricing with you before the estimate visit."
          : "Pricing depends on what the tech finds, so our office will confirm it with you before any work starts.";
        say(lead, tr, answer + " Want one of these?\n" + slotList(lead), "Pricing reply sent", "Office will confirm pricing; times offered again");
        lead.status = "Awaiting reply";
        break;

      case "callback":
        at = say(lead, tr, "No problem. Someone from our office will call you at " + lead.phone + " in the next 15 minutes.", "Callback confirmation sent");
        ev(lead, at + 1, "task", "Callback task created", "Assigned to the office team, due in 15 min. No call is placed in this demo.");
        finish(lead, at + 2, "handoff", "Callback requested", "Automated follow-ups paused while a person takes over.");
        break;

      case "urgent":
        if (lead.track !== "urgent") {
          ev(lead, t + 2, "rule", "Urgency raised to Urgent repair", "Reply describes " + intent.what + "; was " + TRACKS[lead.track].name);
          lead.track = "urgent";
          lead.escalated = true;
          lead.reason = "a reply described " + intent.what;
          createCallTask(lead, t + 3);
          lead.slots = slotsFor("urgent", tr);
          say(lead, tr, "Thanks for letting us know, " + lead.first + ". That moves you up the list. Open windows:\n" + slotList(lead) + "\nReply 1, 2 or 3.", "Same-day windows offered");
        } else if (intent.what === "no heat") {
          say(lead, tr, "Sorry you're dealing with that. If you smell gas, leave the house and call 911 first. Otherwise, pick a window:\n" + slotList(lead), "Safety note and windows sent");
        } else {
          say(lead, tr, "Sorry about that. Keeping blinds closed helps until we get there. Pick a window:\n" + slotList(lead), "Windows offered again");
        }
        lead.status = "Awaiting reply";
        break;

      default:
        at = say(lead, tr, "Thanks, " + lead.first + ". I've passed this to our office team and someone will reply shortly.", "Holding reply sent");
        ev(lead, at + 1, "task", "Flagged for human review", "The reply didn't match a rule.");
        finish(lead, at + 2, "review", "Needs review", "Automated follow-ups paused until someone reviews the reply.");
    }
  }

  function nextStep(lead) {
    if (lead.stopped) return null;
    var d = lead.done, lo = lead.lastOut;
    if (lead.track === "urgent") {
      if (!d.fu1) return { id: "fu1", at: lo + 300, label: "Follow-up text" };
      return null;
    }
    if (lead.track === "standard") {
      if (!d.fu1) return { id: "fu1", at: sendTime(lead, lo + 1800), label: "Follow-up text" };
      if (!d.fu2) return { id: "fu2", at: nextMorning(lo, 9), label: "Last check-in" };
      if (!d.close) return { id: "close", at: lo + DAY, label: "Close as no response" };
      return null;
    }
    if (!d.fu1) return { id: "fu1", at: sendTime(lead, lo + 7200), label: "Follow-up text" };
    if (!d.fu2) return { id: "fu2", at: nextMorning(lo, 10), label: "Last check-in" };
    if (!d.close) return { id: "close", at: lo + 2 * DAY, label: "Close as no response" };
    return null;
  }

  function advance(lead) {
    var n = nextStep(lead);
    if (!n) return;
    var t = n.at;
    lead.done[n.id] = true;
    if (n.id === "fu1") {
      var text = lead.track === "urgent"
        ? "Hi " + lead.first + ", checking in. We're holding " + lead.slots[0] + " for you. Reply 1 to take it, or CALL for a phone call."
        : lead.track === "estimate"
          ? "Hi " + lead.first + ", any questions before booking your estimate? Happy to answer here, or reply CALL."
          : "Just following up, " + lead.first + ". Want to get " + lead.short + " on the schedule? Reply 1, 2 or 3 for the times above.";
      say(lead, t, text, "Follow-up text sent", "No reply since the last text");
      lead.status = "Follow-up sent";
    } else if (n.id === "fu2") {
      say(lead, t, "Hi " + lead.first + ", last note from " + CO.short + " about this request. Reply anytime and we'll find a time that works.", "Last check-in sent");
      lead.status = "Last check-in sent";
    } else if (n.id === "close") {
      finish(lead, t, "noresponse", "No response", "Closed after the last check-in. No more texts.");
    }
  }

  /* ---------- state ---------- */

  var state;

  function freshState() {
    seq = 0;
    var leads = D.seeds.map(function (s) {
      var lead = makeLead(s.person, s.scenario, parseTime(s.at), s.delay, s.issue);
      s.script.forEach(function (step) {
        if (step.reply) reply(lead, step.reply, lead.lastOut + step.after);
        if (step.advance) advance(lead);
      });
      // Anything already due before the demo clock starts has happened.
      var n;
      while ((n = nextStep(lead)) && n.at <= D.startClock) advance(lead);
      return lead;
    });
    var pick = D.seeds.reduce(function (acc, s, i) { return s.selected ? i : acc; }, leads.length - 1);
    return {
      leads: leads,
      selected: leads[pick].id,
      scenario: "noheat",
      personIndex: 0,
      simNow: D.startClock,
      afterHours: false,
      afterHoursCount: 0,
      busy: false
    };
  }

  function selectedLead() {
    return state.leads.filter(function (l) { return l.id === state.selected; })[0];
  }

  /* ---------- reveal animation ---------- */

  function revealNew(lead, fromTime) {
    var times = lead.messages.filter(function (m) { return m.who === "biz" && m.t > fromTime; }).map(function (m) { return m.t; });
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!times.length || reduce) { lead.revealUntil = Infinity; renderAll(); return; }
    state.busy = true;
    var i = 0;
    lead.revealUntil = times[0] - 1;
    renderAll();
    (function stepReveal() {
      setTimeout(function () {
        i += 1;
        lead.revealUntil = i < times.length ? times[i] - 1 : Infinity;
        if (i >= times.length) state.busy = false;
        renderAll();
        if (i < times.length) stepReveal();
      }, REVEAL_MS);
    })();
  }

  /* ---------- actions ---------- */

  function runInquiry() {
    if (state.busy) return;
    var person = D.people[state.personIndex % D.people.length];
    var n = state.personIndex;
    state.personIndex += 1;
    var t0;
    if (state.afterHours) {
      // Tonight, inside quiet hours. Doesn't move the daytime demo clock.
      t0 = AFTER_HOURS_START + state.afterHoursCount * 420;
      state.afterHoursCount += 1;
    } else {
      t0 = state.simNow;
      state.simNow += 360 + ((n * 97) % 300);
    }
    var lead = makeLead(person, state.scenario, t0, 34 + ((n * 7) % 21));
    lead.afterHours = state.afterHours;
    state.leads.push(lead);
    state.selected = lead.id;
    toast("Simulated inquiry from " + lead.name + " added. No text was sent.");
    revealNew(lead, t0);
    focusThread();
  }

  function sendReply(text) {
    var lead = selectedLead();
    text = (text || "").trim();
    if (!lead || !text || state.busy) return;
    var before = lead.clock;
    var at = (lead.afterHours ? lead.clock : Math.max(lead.clock, state.simNow)) + 60 + (text.length % 5) * 23;
    reply(lead, text.slice(0, 240), at);
    // Daytime replies move the demo clock; after-hours leads keep their own night clock.
    if (!lead.afterHours && Math.floor(at / DAY) === Math.floor(state.simNow / DAY)) state.simNow = Math.max(state.simNow, at);
    revealNew(lead, before);
  }

  function skipAhead() {
    var lead = selectedLead();
    if (!lead || state.busy) return;
    var before = lead.clock;
    advance(lead);
    revealNew(lead, before);
  }

  function resetDemo() {
    state = freshState();
    renderAll();
    toast("Demo reset to the sample inquiries.");
  }

  /* ---------- rendering ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(id) { return document.getElementById(id); }

  var STATUS_TONE = {
    "New": "neutral", "Awaiting reply": "cool", "Follow-up sent": "amber", "Last check-in sent": "amber",
    "Booked": "go", "Callback requested": "heat", "Needs review": "heat",
    "Not interested": "muted", "Opted out": "muted", "No response": "muted"
  };
  var TRACK_TONE = { urgent: "heat", standard: "cool", estimate: "est" };

  function pill(text, tone) { return '<span class="pill pill-' + tone + '">' + esc(text) + "</span>"; }
  function responseTime(lead) { return lead.firstReplyAt === null ? null : lead.firstReplyAt - lead.receivedAt; }
  function firstHeld(lead) {
    var first = lead.messages.filter(function (m) { return m.who === "biz"; })[0];
    return !!(first && first.held);
  }
  function needsPerson(lead) { return lead.callTaskOpen || lead.outcome === "handoff" || lead.outcome === "review"; }

  function renderKpis() {
    var leads = state.leads;
    var times = leads.map(responseTime).filter(function (x) { return x !== null; }).sort(function (a, b) { return a - b; });
    var median = times.length ? (times.length % 2 ? times[(times.length - 1) / 2] : (times[times.length / 2 - 1] + times[times.length / 2]) / 2) : 0;
    var booked = leads.filter(function (l) { return l.outcome === "booked"; }).length;
    var people = leads.filter(needsPerson).length;
    var urgent = leads.filter(function (l) { return l.track === "urgent"; }).length;
    var tiles = [
      ["Inquiries today", String(leads.length), urgent + " urgent"],
      ["Median first reply", elapsed(median), "Target: under 1:00"],
      ["Visits booked", String(booked), "Booked from the thread"],
      ["Need a person", String(people), "Call tasks, callbacks, reviews"]
    ];
    $("kpis").innerHTML = tiles.map(function (k) {
      return '<div class="kpi"><span class="kpi-label">' + k[0] + '</span><b class="kpi-value">' + k[1] + '</b><span class="kpi-note">' + k[2] + "</span></div>";
    }).join("");
  }

  function nextLabel(lead) {
    if (lead.stopped) {
      if (lead.outcome === "booked") return lead.bookedSlot;
      if (lead.outcome === "handoff" || lead.outcome === "review") return "With a person";
      return "Closed";
    }
    var n = nextStep(lead);
    if (n) return n.label + " · " + stamp(n.at);
    return lead.callTaskOpen ? "Staff call task open" : "Waiting on the lead";
  }

  function renderBoard() {
    var rows = state.leads.slice().sort(function (a, b) { return b.receivedAt - a.receivedAt; });
    var html = '<table class="board-table"><caption class="visually-hidden">Sample HVAC inquiries, newest first</caption><thead><tr>' +
      "<th scope=\"col\">Lead</th><th scope=\"col\">Urgency</th><th scope=\"col\">Inquiry</th><th scope=\"col\">First reply</th><th scope=\"col\">Status</th><th scope=\"col\">Next</th></tr></thead><tbody>";
    rows.forEach(function (l) {
      var rt = responseTime(l);
      var sel = l.id === state.selected;
      html += '<tr class="' + (sel ? "is-selected" : "") + '" data-id="' + l.id + '">' +
        '<td data-label="Lead"><button class="row-open" type="button" data-id="' + l.id + '" aria-pressed="' + sel + '"><b>' + esc(l.name) + "</b><small>" + esc(l.service) + "</small></button></td>" +
        '<td data-label="Urgency">' + pill(TRACKS[l.track].name, TRACK_TONE[l.track]) + (l.escalated ? '<small class="escalated">raised by reply</small>' : "") + "</td>" +
        '<td data-label="Inquiry" class="mono">' + (l.afterHours ? "Tonight " : "") + stamp(l.receivedAt) + "</td>" +
        '<td data-label="First reply" class="mono">' + (rt === null ? "—" : '<span class="rt' + (rt <= 60 ? " rt-ok" : "") + '">' + elapsed(rt) + "</span>") +
        (firstHeld(l) ? '<small class="escalated">held for quiet hours</small>' : "") + "</td>" +
        '<td data-label="Status">' + pill(l.status, STATUS_TONE[l.status] || "neutral") + "</td>" +
        '<td data-label="Next" class="next-cell">' + esc(nextLabel(l)) + "</td></tr>";
    });
    $("board-table").innerHTML = html + "</tbody></table>";
  }

  function renderLauncher() {
    var person = D.people[state.personIndex % D.people.length];
    var sc = D.scenarios[state.scenario];
    var cls = classifyIssue(sc.issue);
    var opts = Object.keys(D.scenarios).map(function (k) {
      var on = k === state.scenario;
      return '<button type="button" class="seg' + (on ? " is-on" : "") + '" data-scenario="' + k + '" aria-pressed="' + on + '">' + esc(D.scenarios[k].label) + "</button>";
    }).join("");
    $("launcher").innerHTML =
      '<div class="panel-head"><h3>Sample new inquiry</h3><span class="tag">Not a real form</span></div>' +
      '<p class="panel-note">Pick a scenario, then run it. The inquiry lands on the board and the auto-reply plays out in the thread.</p>' +
      '<div class="seg-group" role="group" aria-label="Inquiry scenario">' + opts + "</div>" +
      '<dl class="form-preview">' +
      "<div><dt>Name</dt><dd>" + esc(person.name) + "</dd></div>" +
      "<div><dt>Mobile</dt><dd class=\"mono\">" + esc(person.phone) + "</dd></div>" +
      "<div><dt>Address</dt><dd>" + esc(person.street) + "</dd></div>" +
      "<div><dt>Service</dt><dd>" + esc(sc.service) + "</dd></div>" +
      '<div class="wide"><dt>Message</dt><dd>“' + esc(sc.issue) + "”</dd></div>" +
      '<div class="wide"><dt>Text consent</dt><dd>☑ OK to text me about this request</dd></div>' +
      "</dl>" +
      '<div class="arrival" role="group" aria-label="Arrival time">' +
      '<button type="button" class="seg' + (state.afterHours ? "" : " is-on") + '" data-arrival="now" aria-pressed="' + !state.afterHours + '">Now · ' + clock(state.simNow) + "</button>" +
      '<button type="button" class="seg' + (state.afterHours ? " is-on" : "") + '" data-arrival="night" aria-pressed="' + state.afterHours + '">After hours · ' + clock(AFTER_HOURS_START + state.afterHoursCount * 420) + "</button></div>" +
      '<p class="route-preview">Will be sorted as ' + pill(TRACKS[cls.track].name, TRACK_TONE[cls.track]) + " because " + esc(cls.reason) + ".</p>" +
      (state.afterHours
        ? '<p class="quiet-note">' + (cls.track === "urgent"
          ? "Quiet hours: urgent, so the staff call task and the first text go out right away."
          : "Quiet hours: the first text is held until 8:00 AM.") + "</p>"
        : "") +
      '<button type="button" class="btn btn-primary btn-block" id="run-inquiry"' + (state.busy ? " disabled" : "") + ">Run simulated inquiry</button>";
  }

  function renderThread() {
    var lead = selectedLead();
    var until = lead.revealUntil;
    var msgs = lead.messages.filter(function (m) { return m.t <= until; });
    var typing = until !== Infinity;
    var html = '<div class="phone-head"><span class="avatar" aria-hidden="true">' + esc(lead.name.split(" ").map(function (p) { return p[0]; }).join("")) + "</span>" +
      '<div class="phone-who"><b>' + esc(lead.name) + '</b><small class="mono">' + esc(lead.phone) + " · " + esc(lead.street) + "</small></div>" +
      '<span class="sim-tag">Simulated SMS</span></div>';
    html += '<div class="thread" id="thread-log" role="log" aria-live="polite" aria-label="Simulated text conversation with ' + esc(lead.name) + '">';
    html += '<div class="form-card"><span class="mono">Website form · ' + stamp(lead.receivedAt) + "</span><p>“" + esc(lead.issue) + "”</p></div>";
    msgs.forEach(function (m) {
      html += '<div class="msg msg-' + m.who + '"><div class="bubble">' + esc(m.text) + '</div><span class="msg-meta">' +
        (m.who === "biz" ? "Simulated auto-text from " + esc(CO.short) : "Simulated reply from " + esc(lead.first)) + " · " + stamp(m.t) +
        (m.held ? " · held for quiet hours" : "") + "</span></div>";
    });
    if (typing) {
      var pending = lead.messages.filter(function (m) { return m.who === "biz" && m.t > until; })[0];
      html += '<div class="msg msg-biz"><div class="bubble typing" aria-label="Auto-reply being prepared"><i></i><i></i><i></i></div><span class="msg-meta">' +
        (pending && pending.held ? "Held for quiet hours · sends " + stamp(pending.t) : "Auto-reply preparing…") + "</span></div>";
    }
    html += "</div>";

    // reply controls
    var disabled = state.busy ? " disabled" : "";
    var chips = [["No heat", "No heat"], ["My AC stopped working", "My AC stopped working"], ["Ask about price", "How much is a service call?"],
      ["Request a callback", "Can someone call me?"], ["Not interested", "No longer interested"], ["STOP", "STOP"]];
    html += '<div class="reply-box"><div class="reply-head"><h3>Reply as the lead</h3><span class="tag">Simulated</span></div>';
    if (!lead.stopped && lead.slots.length) {
      html += '<div class="slot-row" role="group" aria-label="Pick an offered time">' + lead.slots.map(function (s, i) {
        return '<button type="button" class="chip chip-slot" data-reply="' + (i + 1) + '"' + disabled + "><b>" + (i + 1) + "</b> " + esc(s) + "</button>";
      }).join("") + "</div>";
    }
    html += '<div class="chip-row">' + chips.map(function (c) {
      return '<button type="button" class="chip" data-reply="' + esc(c[1]) + '"' + disabled + ">" + esc(c[0]) + "</button>";
    }).join("") + "</div>";
    html += '<div class="compose"><label class="visually-hidden" for="compose-input">Type a reply as the lead</label>' +
      '<input id="compose-input" type="text" maxlength="240" autocomplete="off" placeholder="Or type a reply, e.g. “is Thursday ok?”"' + disabled + ">" +
      '<button type="button" class="btn btn-primary" id="compose-send"' + disabled + ">Send</button></div>";
    var n = nextStep(lead);
    if (n) {
      html += '<button type="button" class="btn btn-ghost btn-block" id="skip-ahead"' + disabled + '>No reply: jump to “' + esc(n.label) + "” at " + stamp(n.at) + "</button>";
    } else {
      html += '<p class="fine">' + (lead.stopped ? "Automation is off for this lead. Replies are logged for the office team." : "Waiting on the lead.") + "</p>";
    }
    html += "</div>";
    $("thread").innerHTML = html;
    var log = $("thread-log");
    log.scrollTop = log.scrollHeight;
  }

  function stepState(lead, id, next) {
    if (lead.done[id]) return "done";
    if (lead.stopped) return "skipped";
    if (next && next.id === id) return "next";
    if (id === "booked") return "waiting";
    return "pending";
  }

  var STATE_TEXT = { done: "Done", next: "Next", skipped: "Skipped", waiting: "When a time is picked", pending: "Later" };
  var OUTCOME_TEXT = {
    booked: function (l) { return "Booked for " + l.bookedSlot + "."; },
    handoff: function () { return "Handed to the office for a callback."; },
    review: function () { return "Waiting on a person to review the last reply."; },
    lost: function () { return "Closed: the lead isn't interested."; },
    optout: function () { return "Closed: the lead opted out of texts."; },
    noresponse: function () { return "Closed after the last check-in with no reply."; }
  };

  function renderWorkflow() {
    var lead = selectedLead();
    var tr = TRACKS[lead.track];
    var n = nextStep(lead);
    var html = '<div class="panel-head"><h3>Follow-up workflow</h3>' + pill(tr.name, TRACK_TONE[lead.track]) + "</div>";
    html += '<p class="panel-note">On this track because ' + esc(lead.reason) + ".</p>";
    html += '<p class="quiet-note">' + (lead.track === "urgent"
      ? "Quiet hours (9 PM–8 AM) don't apply: the staff call task and texts go out right away."
      : "Quiet hours (9 PM–8 AM): texts due then are held until 8 AM.") + "</p>";
    if (lead.callTaskOpen) html += '<div class="outcome outcome-task">Staff call task is open for the on-call dispatcher.</div>';
    if (lead.stopped) {
      html += '<div class="outcome outcome-' + lead.outcome + '">' + esc(OUTCOME_TEXT[lead.outcome](lead)) + "</div>";
    } else if (n) {
      html += '<div class="outcome outcome-next">Next: ' + esc(n.label) + " at " + stamp(n.at) + " unless " + esc(lead.first) + " replies.</div>";
    }
    html += '<ol class="steps">' + tr.steps.map(function (s) {
      var st = stepState(lead, s[0], n);
      return '<li class="step step-' + st + '"><span class="step-dot" aria-hidden="true"></span><div><b>' + esc(s[1]) + "</b><small>" + esc(s[2]) + '</small></div><span class="step-state">' + STATE_TEXT[st] + "</span></li>";
    }).join("") + "</ol>";
    html += '<details class="rules"><summary>Reply rules</summary><ul>' +
      "<li><b>1, 2, 3 or “yes”</b> books that window</li>" +
      "<li><b>Price question</b> gets “our office will confirm pricing”, then the times again</li>" +
      "<li><b>CALL or “call me”</b> creates a callback task and pauses texts</li>" +
      "<li><b>“No heat” or “AC stopped”</b> raises the lead to Urgent repair</li>" +
      "<li><b>“Not interested”</b> closes the lead; <b>STOP</b> opts out</li>" +
      "<li><b>Anything else</b> goes to a person for review</li></ul></details>";
    $("workflow").innerHTML = html;
  }

  var EVENT_ICON = { in: "↓", out: "↑", rule: "⇄", hold: "☾", alert: "☎", task: "☎", book: "✓", stop: "■" };

  function renderTimeline() {
    var lead = selectedLead();
    var evs = lead.events.filter(function (e) { return e.t <= lead.revealUntil; });
    $("timeline").innerHTML = '<div class="panel-head"><h3>Activity timeline</h3><span class="tag">' + evs.length + " events</span></div>" +
      '<ol class="timeline">' + evs.map(function (e) {
        return '<li class="tl tl-' + e.type + '"><span class="tl-icon" aria-hidden="true">' + EVENT_ICON[e.type] + "</span>" +
          '<div class="tl-body"><div class="tl-top"><b>' + esc(e.title) + '</b><span class="mono">' + stamp(e.t) + '</span></div>' +
          (e.detail ? "<small>" + esc(e.detail) + "</small>" : "") +
          '<span class="tl-offset mono">+' + elapsed(e.t - lead.receivedAt) + "</span></div></li>";
      }).join("") + "</ol>";
  }

  function renderClock() {
    $("demo-clock").textContent = "Demo clock · " + WEEK[BASE_WEEKDAY] + " " + clock(state.simNow);
  }

  function renderAll() {
    var active = document.activeElement && document.activeElement.id;
    renderClock();
    renderKpis();
    renderBoard();
    renderLauncher();
    renderThread();
    renderWorkflow();
    renderTimeline();
    if (active && $(active) && !$(active).disabled) $(active).focus();
  }

  var toastTimer;
  function toast(msg) {
    var el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 3200);
  }

  function focusThread() {
    if (window.innerWidth < 1100) {
      var el = $("thread");
      if (el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /* ---------- events ---------- */

  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("button, tr[data-id]") : null;
    if (!t) return;
    if (t.dataset.scenario) { state.scenario = t.dataset.scenario; renderLauncher(); return; }
    if (t.dataset.arrival) { state.afterHours = t.dataset.arrival === "night"; renderLauncher(); return; }
    if (t.id === "run-inquiry") { runInquiry(); return; }
    if (t.dataset.reply) { sendReply(t.dataset.reply); return; }
    if (t.id === "compose-send") { var inp = $("compose-input"); sendReply(inp.value); return; }
    if (t.id === "skip-ahead") { skipAhead(); return; }
    if (t.id === "reset-demo") { resetDemo(); return; }
    if (t.dataset.id) {
      if (state.busy) return;
      state.selected = t.dataset.id;
      renderAll();
      if (t.tagName === "TR" || t.classList.contains("row-open")) focusThread();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target && e.target.id === "compose-input") {
      e.preventDefault();
      sendReply(e.target.value);
    }
  });

  state = freshState();
  renderAll();
})();
