/* HVAC Speed-to-Lead: fictional sample data.
   Every company, person, address and phone number here is invented.
   Phone numbers use the 555-010x range, which is reserved for fiction. */
window.STL_DATA = {
  company: {
    name: "Copperline Heating & Air",
    short: "Copperline",
    phone: "(555) 010-0100"
  },

  // Demo day starts on a Tuesday. Times are seconds after midnight.
  startClock: 9 * 3600 + 5 * 60,

  scenarios: {
    noheat: {
      label: "No heat",
      service: "Furnace repair",
      short: "no heat",
      issue: "Furnace is running but blowing cold air. House is down to 58°F."
    },
    noac: {
      label: "AC stopped working",
      service: "AC repair",
      short: "your AC",
      issue: "AC won't turn on since last night. Upstairs is 84°F."
    },
    estimate: {
      label: "Replacement estimate",
      service: "System replacement",
      short: "a new system estimate",
      issue: "Our heat pump is 17 years old. Looking for a quote to replace it."
    },
    tuneup: {
      label: "Tune-up request",
      service: "Maintenance",
      short: "a furnace tune-up",
      issue: "Would like a fall furnace tune-up sometime next week."
    }
  },

  // Pre-loaded inquiries. Each script runs through the same workflow engine
  // the interactive controls use, so their histories are consistent.
  seeds: [
    {
      person: { name: "Dana Whitlock", phone: "(555) 010-0142", street: "4417 Linden Ct" },
      scenario: "noheat", at: "6:48:10", delay: 41,
      script: [{ reply: "1", after: 95 }]
    },
    {
      person: { name: "Marcus Oyelaran", phone: "(555) 010-0157", street: "88 Bramble Way" },
      scenario: "noac", at: "9:01:10", delay: 37,
      script: [{ reply: "How much is a service call?", after: 90 }]
    },
    {
      person: { name: "Priya Raman", phone: "(555) 010-0163", street: "1290 Orchard Hill Dr" },
      scenario: "estimate", at: "7:31:05", delay: 52,
      script: []
    },
    {
      person: { name: "Tom Kessler", phone: "(555) 010-0118", street: "35 Quarry Ln" },
      scenario: "tuneup", at: "8:56:40", delay: 44,
      script: [{ reply: "Actually the heat isn't coming on at all now", after: 300 }]
    },
    {
      person: { name: "Elena Baptiste", phone: "(555) 010-0171", street: "602 Wrenfield Ave" },
      scenario: "noac", at: "8:19:15", delay: 39,
      issue: "Thermostat screen is blank and the AC won't turn on.",
      script: [{ reply: "Can someone call me instead?", after: 130 }]
    },
    {
      person: { name: "Greg Halvorsen", phone: "(555) 010-0129", street: "17 Saltmarsh Rd" },
      scenario: "estimate", at: "8:40:50", delay: 48,
      issue: "Quote for adding central AC to a house with a boiler.",
      script: [{ reply: "No longer interested, we went with someone else", after: 1500 }]
    },
    {
      person: { name: "Ruth Adeyemi", phone: "(555) 010-0186", street: "2204 Kettle Creek Rd" },
      scenario: "tuneup", at: "8:51:20", delay: 43,
      script: [], selected: true
    }
  ],

  // Fictional people used for each new simulated inquiry, in order.
  people: [
    { name: "Jordan Pike", phone: "(555) 010-0191", street: "73 Fernhill Rd" },
    { name: "Alma Ferreira", phone: "(555) 010-0134", street: "510 Copper Beech Ln" },
    { name: "Wes Barnaby", phone: "(555) 010-0148", street: "9 Larkspur Ct" },
    { name: "Hana Kowalczyk", phone: "(555) 010-0175", street: "1388 Millrace Dr" },
    { name: "Rico Delmar", phone: "(555) 010-0122", street: "46 Thornbury St" },
    { name: "Simone Achebe", phone: "(555) 010-0169", street: "2011 Juniper Bend" },
    { name: "Lyle Brandt", phone: "(555) 010-0153", street: "318 Harrow Ave" },
    { name: "Nora Quist", phone: "(555) 010-0197", street: "77 Glenmoor Pl" }
  ]
};
