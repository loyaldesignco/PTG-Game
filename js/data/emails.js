// Email pool. Every brand here is fictional.
//
// Text fields may contain:
//   {placeholders}  filled from the player's profile (company, domain, ceo...)
//   [[clueId|text]] a tappable clue; the explanation lives in `clues[clueId]`
//
// Tier 1: sloppy phish. Tier 2: brand-perfect lures. Tier 3: spear phishing.
// Phish types drive the Act 2 attack chain:
//   credential -> account takeover, invoice -> wire fraud,
//   attachment -> ransomware, vendor -> supply-chain breach

export const PHISH_TYPES = ['credential', 'invoice', 'attachment', 'vendor'];

export const EMAILS = [
  // ---------------- TIER 1 ----------------
  {
    id: 't1-cred', tier: 1, phish: true, type: 'credential',
    fromName: 'NimbusDrive Security',
    from: 'security@[[dom|nimbusdrive-verify.xyz]]',
    subject: 'Your acount will be [[urg|DELETED in 24 hour]]',
    body: 'Dear [[gen|Valued User]],\n\nWe detect unusual activity on you account. Verify your pasword now or lose all files forever.',
    link: { label: 'VERIFY ACCOUNT', url: '[[url|nimbusdrive.verify-login.xyz/auth]]' },
    clues: {
      dom: 'The sender is nimbusdrive-verify.xyz, not nimbusdrive.com.',
      urg: 'A panic deadline plus typos ("acount", "hour").',
      gen: '"Valued User": a real service knows your name.',
      url: 'The link goes to verify-login.xyz, a fake login page.',
    },
    lesson: 'Typos, a scary deadline and a login link: a classic password grab.',
  },
  {
    id: 't1-invoice', tier: 1, phish: true, type: 'invoice',
    fromName: 'Parcelo Delivery',
    from: 'billing@[[dom|parcel0-invoices.co]]',
    subject: '[[urg|FINAL NOTICE!!!]] unpaid shiping fee',
    body: 'Your package is held. Pay the $2.99 fee by [[pay|gift card or wire]] today or it is returned to sender.',
    clues: {
      dom: '"parcel0" uses a zero, and it is not the carrier\'s domain.',
      urg: 'All-caps urgency and triple exclamation marks.',
      pay: 'No real carrier asks for gift cards or wires.',
    },
    lesson: 'Odd payment methods are a giveaway. Real carriers bill through their own site.',
  },
  {
    id: 't1-attach', tier: 1, phish: true, type: 'attachment',
    fromName: 'Office Scanner',
    from: 'scan@[[dom|office-printer.net]]',
    subject: 'Scanned document (1 page)',
    body: 'You have recieved a scanned document. [[act|Open the attachment to view.]]',
    attachment: '[[ext|scan_0042.pdf.exe]]',
    clues: {
      dom: 'Your scanner sends from your own domain, not office-printer.net.',
      ext: 'A ".pdf.exe" is a program dressed up as a PDF.',
      act: 'Vague "open the attachment" with no context or sender name.',
    },
    lesson: 'Double extensions like .pdf.exe are malware wearing a costume.',
  },
  {
    id: 't1-vendor', tier: 1, phish: true, type: 'vendor',
    fromName: 'IT Departmant',
    from: 'it-support@[[dom|helpdesk-updates.info]]',
    subject: '[[urg|Critical update - install NOW]]',
    body: 'All staff must install this patch [[sec|before end of day or your computer will be disabled]]. [[sig|Department of IT]]',
    link: { label: 'DOWNLOAD PATCH', url: '[[url|helpdesk-updates.info/patch.exe]]' },
    clues: {
      dom: 'Your IT team would not email from helpdesk-updates.info.',
      urg: 'Pressure to install right now.',
      sec: 'Threats to disable your machine.',
      url: 'A direct .exe download link from an unknown site.',
      sig: '"Department of IT", and "Departmant" is misspelled in the sender name.',
    },
    lesson: 'Real updates come through your managed tools, not random email links.',
  },
  {
    id: 't1-legit-pizza', tier: 1, phish: false,
    fromName: 'Kevin (Office)', from: 'kevin@{domain}',
    subject: 'Pizza Friday?',
    body: 'Ordering from the usual place at noon. Reply with your topping or forever hold your peace.',
    clues: {},
    lesson: 'A coworker, your own domain, no links, no ask. Safe.',
  },
  {
    id: 't1-legit-front', tier: 1, phish: false,
    fromName: 'Front Desk', from: 'frontdesk@{domain}',
    subject: 'Client visit at 2pm',
    body: 'The Hendersons are coming in at 2. Conference room B is booked. Coffee is on me.',
    clues: {},
    lesson: 'Internal, specific and nothing to click. Safe.',
  },
  {
    id: 't1-legit-ledger', tier: 1, phish: false,
    fromName: 'LedgerLine', from: 'no-reply@ledgerline.com',
    subject: 'Your monthly statement is ready',
    body: 'Your November statement is available. Sign in at ledgerline.com as usual to view it. We never ask for your password by email.',
    clues: {},
    lesson: 'The right domain, no pressure and it tells you to log in the usual way. Safe.',
  },

  // ---------------- TIER 2 ----------------
  {
    id: 't2-cred', tier: 2, phish: true, type: 'credential',
    fromName: 'SignFlow',
    from: 'notifications@[[dom|signflow-docs.com]]',
    subject: '{ceo} sent you "Q4 Contract.pdf" to sign',
    body: 'Please review and sign the document. [[exp|This link expires in 2 hours.]]\n\nPowered by SignFlow',
    link: { label: 'REVIEW DOCUMENT', url: '[[url|signflow.docs-review.net/s/8812]]' },
    clues: {
      dom: 'The real service is signflow.com. "signflow-docs.com" is a lookalike.',
      url: 'The button goes to docs-review.net, not signflow.com.',
      exp: 'A short expiry window is a pressure tactic.',
    },
    lesson: 'Brand-perfect emails still slip on the domain. Hover before you click.',
  },
  {
    id: 't2-invoice', tier: 2, phish: true, type: 'invoice',
    fromName: 'Coastal Supply Co.',
    from: 'ar@[[dom|coastalsuppIy.com]]',
    subject: 'Invoice #4471 - updated remittance details',
    body: 'Hi, please note [[bank|we have changed banks]]. Kindly send this month\'s $12,860 to the new account below. [[reply|Please reply by email only, our phones are being upgraded.]]',
    attachment: 'Invoice_4471.pdf',
    clues: {
      dom: '"coastalsuppIy" uses a capital I instead of an l.',
      bank: 'Changing bank details by email is the #1 sign of invoice fraud.',
      reply: 'They block the one thing that would expose them: a phone call.',
    },
    lesson: 'Any bank-detail change gets verified by phone, using a number you already have.',
  },
  {
    id: 't2-attach', tier: 2, phish: true, type: 'attachment',
    fromName: 'BrightPay Payroll',
    from: 'payroll@[[dom|brightpay-hr.com]]',
    subject: 'Updated 2027 pay schedule',
    body: 'Attached is the updated pay calendar. [[mac|Click "Enable Content" to view the dates.]]',
    attachment: '[[ext|Pay_Schedule_2027.xlsm]]',
    clues: {
      dom: 'BrightPay sends from brightpay.com, not brightpay-hr.com.',
      ext: '.xlsm is a spreadsheet with macros, which can run code.',
      mac: '"Enable Content" is how macro malware gets permission to run.',
    },
    lesson: 'A calendar never needs macros. "Enable Content" is a trap.',
  },
  {
    id: 't2-vendor', tier: 2, phish: true, type: 'vendor',
    fromName: 'LedgerLine Support',
    from: 'support@[[dom|ledgerline-support.com]]',
    subject: 'Required security patch for LedgerLine Desktop',
    body: 'A vulnerability affects your version. [[how|Install the attached patch manually]] to stay compliant.',
    attachment: '[[ext|LL_Patch_4.2.msi]]',
    clues: {
      dom: 'LedgerLine emails come from ledgerline.com.',
      how: 'Vendors push patches through the app or your IT provider, not email.',
      ext: 'An installer (.msi) attached to an email.',
    },
    lesson: 'Software updates arrive through your managed tools, never as email attachments.',
  },
  {
    id: 't2-legit-sign', tier: 2, phish: false,
    fromName: 'SignFlow', from: 'notifications@signflow.com',
    subject: 'Harbor Dental sent you "Service Renewal" to sign',
    body: 'Harbor Dental has requested your signature. The document stays open for 30 days.',
    link: { label: 'REVIEW DOCUMENT', url: 'signflow.com/s/a91c2' },
    clues: {},
    lesson: 'Real domain, real client, a link that matches the sender, no rush. Safe.',
  },
  {
    id: 't2-legit-coastal', tier: 2, phish: false,
    fromName: 'Coastal Supply Co.', from: 'ar@coastalsupplyco.com',
    subject: 'Invoice #4470',
    body: 'Thanks for your business! Invoice #4470 is attached. Pay through our portal as always, same account as before.',
    attachment: 'Invoice_4470.pdf',
    clues: {},
    lesson: 'Same vendor, same account, plain PDF. Safe.',
  },
  {
    id: 't2-legit-nimbus', tier: 2, phish: false,
    fromName: 'NimbusDrive', from: 'no-reply@nimbusdrive.com',
    subject: 'Your storage is 80% full',
    body: 'You can manage storage from Settings in the NimbusDrive app. No action is required right now.',
    clues: {},
    lesson: 'No link, no deadline, points you to the app you already use. Safe.',
  },

  // ---------------- TIER 3 (spear phishing) ----------------
  {
    id: 't3-invoice', tier: 3, phish: true, type: 'invoice',
    fromName: '{ceo}',
    from: '{ceoFirst}@[[dom|{lookalike}]]',
    subject: 'Quick favor - confidential',
    body: 'Are you at your desk? I need you to wire $18,400 to a new vendor [[urg|before 3pm]]. [[call|I\'m boarding a flight so don\'t call]], just email me back when it\'s done. [[sec|Keep this between us for now.]]',
    clues: {
      dom: 'Look closely: {lookalike} is not {domain}.',
      urg: 'A tight deadline so you skip the usual checks.',
      call: 'They make sure you can\'t verify by phone.',
      sec: 'Secrecy is how wire fraud dodges a second pair of eyes.',
    },
    lesson: 'CEO requests for urgent, secret wires get a phone call. Every time.',
  },
  {
    id: 't3-cred', tier: 3, phish: true, type: 'credential',
    fromName: '{company} IT',
    from: 'it@[[dom|{domain}.mail-portal.co]]',
    subject: 'Password expiry notice',
    body: 'Hi, your {company} email password expires today. Keep your current password using the secure portal below.',
    link: { label: 'KEEP MY PASSWORD', url: '[[url|{domain}.mail-portal.co/reset]]' },
    clues: {
      dom: 'The real domain is at the end: this is mail-portal.co with your name in front.',
      url: 'Same trick in the link. Read domains right to left.',
    },
    lesson: 'Attackers put your company name in front of their own domain. Read to the end.',
  },
  {
    id: 't3-attach', tier: 3, phish: true, type: 'attachment',
    fromName: 'Mike Alvarez (Bayview CPA)',
    from: 'm.alvarez@[[dom|bayviewcpa-files.com]]',
    subject: '{company} 2026 tax docs - final review',
    body: 'Hi! Final docs for your review before we file. [[pw|The zip is password protected: 2026]]',
    attachment: '[[ext|{company}_Tax_Review.zip]]',
    clues: {
      dom: 'Your CPA emails from bayviewcpa.com. "-files" was added.',
      pw: 'Password-protected zips hide malware from email scanners.',
      ext: 'An unexpected zip, even from a "known" contact.',
    },
    lesson: 'Spear phish borrow real names. A zip with the password in the email is a red flag.',
  },
  {
    id: 't3-vendor', tier: 3, phish: true, type: 'vendor',
    fromName: 'Coreline Managed Print',
    from: 'support@corelineprint.com',
    subject: 'Firmware update for {company} printers',
    body: 'Your 3 office printers need firmware 7.2.1. [[rem|Our tech will connect remotely: approve the access request]] using the link below.',
    link: { label: 'APPROVE ACCESS', url: '[[url|corelineprint.com.firmware-cdn.net/approve]]' },
    clues: {
      url: 'The domain is firmware-cdn.net. "corelineprint.com" is just a prefix.',
      rem: 'Approving remote access from an email link hands over the keys.',
    },
    lesson: 'Even when the sender looks right, remote-access requests get verified first.',
  },
  {
    id: 't3-legit-ceo', tier: 3, phish: false,
    fromName: '{ceo}', from: '{ceoFirst}@{domain}',
    subject: 'Great work this quarter',
    body: 'Just wanted to say thanks, team. Lunch is on me Friday. No action needed :)',
    clues: {},
    lesson: 'Your real domain, no ask, no urgency. Safe.',
  },
  {
    id: 't3-legit-cpa', tier: 3, phish: false,
    fromName: 'Mike Alvarez (Bayview CPA)', from: 'm.alvarez@bayviewcpa.com',
    subject: 'Reminder: our meeting Thursday 10am',
    body: 'Looking forward to Thursday. I\'ll bring the draft return; no need to send anything beforehand.',
    clues: {},
    lesson: 'The correct domain and nothing to open. Safe.',
  },
  {
    id: 't3-legit-hr', tier: 3, phish: false,
    fromName: '{company} HR', from: 'hr@{domain}',
    subject: 'Open enrollment closes Nov 30',
    body: 'Reminder: pick your 2027 benefits in the portal you always use. Questions? Stop by my desk.',
    clues: {},
    lesson: 'Internal, no link, tells you to use the usual portal. Safe.',
  },
];
