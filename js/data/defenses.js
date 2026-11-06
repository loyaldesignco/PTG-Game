// Shop items. Each defense maps to a PTG service and changes the run visibly.
export const BUDGET = 100;

export const DEFENSES = [
  { id: 'filter',   name: 'EMAIL FILTER',    cost: 20, service: 'Managed email security',
    effect: 'Removes 3 of the 15 emails before they reach your inbox.' },
  { id: 'training', name: 'TRAINING',        cost: 15, service: 'Security awareness training',
    effect: 'Highlights clues in every email.' },
  { id: 'mfa',      name: 'MFA',             cost: 20, service: 'Identity and access management',
    effect: 'A stolen password no longer means a stolen account.' },
  { id: 'edr',      name: '24/7 MONITORING', cost: 30, service: 'Managed detection and response',
    effect: 'Attacks are caught early: the breach does half the damage.' },
  { id: 'backups',  name: 'BACKUPS',         cost: 25, service: 'Backup, recovery and continuity',
    effect: 'Unlocks RESTORE FROM BACKUP when ransomware hits.' },
  { id: 'ir',       name: 'IR HOTLINE',      cost: 20, service: 'Incident response',
    effect: 'Adds a CALL PTG lifeline that resolves one crisis.' },
];

export const defenseById = Object.fromEntries(DEFENSES.map(d => [d.id, d]));
