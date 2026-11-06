// Deployment settings. Edit these when embedding on ptg.co or running the kiosk.
const params = new URLSearchParams(location.search);

export const CONFIG = {
  // Where the lead JSON is POSTed after the email gate. Open question in the brief:
  // HubSpot, Halo or a Webflow form. Leave null to store leads locally only
  // (localStorage key "click_leads") while the CRM is decided. See README.
  leadEndpoint: params.get('leadEndpoint') || null,

  // Calls to action on the results / report screens.
  assessmentUrl: 'https://ptg.co/contact',

  // Timing (the Quick Run should land around 3 minutes).
  inboxSeconds: 120,
  crisisSeconds: 15,

  // The report gate asks for a work email; free webmail is rejected.
  // Kiosk mode relaxes this so event visitors can use any address.
  kiosk: params.has('kiosk'),
  requireWorkEmail: !params.has('kiosk'),

  // Optional fixed seed (?seed=42) for demos and QA.
  seed: params.has('seed') ? Number(params.get('seed')) : null,
};

export const FREE_MAIL = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'me.com', 'live.com', 'msn.com', 'proton.me', 'protonmail.com', 'gmx.com', 'mail.com'];
