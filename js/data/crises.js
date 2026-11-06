// Act 2 crises. Each missed phishing type opens one; misses stack.
// quality: 0..1, how good the decision is (feeds the Resilience Score)
// hours:   downtime hours added (halved by 24/7 monitoring)
// loss:    direct dollars lost (fraud, ransom); `lossPerHead` scales with headcount
// requires: defense id needed for the option to be available

export const CRISES = {
  takeover: {
    id: 'takeover', title: 'ACCOUNT TAKEOVER', source: 'credential', art: 'office',
    prompt: 'Your email just signed in from overseas at 3:12 AM. Clients are getting strange messages "from you". What do you do?',
    timeoutChoice: 'ignore',
    choices: [
      { id: 'reset', label: 'RESET PASSWORDS + REVOKE SESSIONS', quality: 1, hours: 2,
        result: 'Locked out. The attacker loses access before reaching payroll or client files.' },
      { id: 'ignore', label: 'IGNORE THE ODD LOGIN ALERT', quality: 0, hours: 14, loss: 6500,
        result: 'They read a month of client email and used it to phish your customers. Cleanup and apologies take days.' },
    ],
  },
  supplychain: {
    id: 'supplychain', title: 'SUPPLY-CHAIN BREACH', source: 'vendor', art: 'office',
    prompt: 'That "update" installed a remote-access tool. Data is quietly leaving your server. What do you do?',
    timeoutChoice: 'keep',
    choices: [
      { id: 'isolate', label: 'ISOLATE THE VENDOR\'S ACCESS', quality: 1, hours: 4,
        result: 'You cut the connection and reset vendor accounts. A small leak, quickly closed.' },
      { id: 'keep', label: 'KEEP WORKING, LOOK INTO IT LATER', quality: 0, hours: 20, loss: 9000,
        result: 'By Monday the client database is for sale. Now it\'s a notification and legal problem.' },
    ],
  },
  wire: {
    id: 'wire', title: 'WIRE FRAUD', source: 'invoice', art: 'office',
    prompt: 'Accounting is about to send $18,400 to "new bank details" from that email thread. The button is right there.',
    timeoutChoice: 'send',
    choices: [
      { id: 'verify', label: 'VERIFY BY PHONE FIRST', quality: 1, hours: 0.5,
        result: 'A 2-minute call to the real number: "We never changed banks." Money saved.' },
      { id: 'send', label: 'SEND THE PAYMENT', quality: 0, hours: 3, loss: 18400,
        result: 'The money is gone within the hour. Banks rarely claw back fraudulent wires.' },
    ],
  },
  ransomware: {
    id: 'ransomware', title: 'RANSOMWARE', source: 'attachment', art: 'breach',
    prompt: 'Your screen just locked. FILES ENCRYPTED. It\'s spreading to the shared drive. What do you do?',
    timeoutChoice: 'pay',
    choices: [
      { id: 'unplug', label: 'UNPLUG FROM NETWORK', quality: 0.6, hours: 30,
        result: 'Smart move: the spread stops. But with no clean copy, every machine is rebuilt from scratch.' },
      { id: 'restore', label: 'RESTORE FROM BACKUP', quality: 1, hours: 6, requires: 'backups',
        result: 'Infected machines isolated, last night\'s immutable backup restored. Back by lunch.' },
      { id: 'pay', label: 'PAY THE RANSOM', quality: 0, hours: 40, lossPerHead: 1000,
        result: 'The decryptor is slow, a third of files come back corrupt, and you\'re now on a list of companies that pay.' },
    ],
  },
};

export const LIFELINE = {
  id: 'callptg', label: 'CALL THE PTG HOTLINE', quality: 1, hours: 2, lifeline: true,
  result: 'PTG\'s incident team picks up, contains the attack and walks you through recovery. Crisis handled.',
};

// Story beats (no decision) shown between crises.
export const BEATS = {
  mfaSaved: {
    title: 'MFA SAVED YOU',
    text: 'Someone tried your stolen password from overseas. MFA asked for a code from your phone. They didn\'t have it. Account safe.',
  },
  edrCaught: {
    title: '24/7 MONITORING',
    text: 'PTG\'s monitoring flagged the attack at 2:14 AM and contained it. Half the damage it would have done.',
  },
  vendorTwist: {
    title: 'YOU CAUGHT EVERY PHISH...',
    text: '...but your payroll vendor didn\'t. Attackers used the vendor\'s remote access to walk straight into your network.',
  },
  intro: {
    title: 'ACT 2: THE BREACH',
    text: 'Monday, 8:02 AM. Something got through last week. The phones start ringing.',
  },
};
