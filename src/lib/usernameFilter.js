// Blocked terms for username validation.
// Checked against the lowercased username with underscores stripped,
// so "f_u_c_k" and "FUCK" both match "fuck".

const BLOCKED_TERMS = [
  // Slurs & hate speech
  'nigger',
  'nigga',
  'faggot',
  'fag',
  'retard',
  'tranny',
  'dyke',
  'kike',
  'spic',
  'chink',
  'gook',
  'wetback',
  'beaner',
  'coon',
  'darkie',
  'gringo',
  'honky',
  'cracker',
  'raghead',
  'towelhead',
  'zipperhead',
  // Profanity
  'fuck',
  'shit',
  'cunt',
  'bitch',
  'asshole',
  'dickhead',
  'cocksucker',
  'motherfucker',
  'pussy',
  'penis',
  'vagina',
  'cock',
  'dick',
  'tits',
  'whore',
  'slut',
  'bastard',
  'damn',
  'piss',
  // Sexual
  'porn',
  'hentai',
  'rape',
  'molest',
  'pedophile',
  'pedo',
  // Violence
  'killall',
  'genocide',
  'murder',
  // Impersonation
  'admin',
  'moderator',
  'rebabel',
  'support',
  'official',
  'staff',
];

/**
 * Returns an error string if the username is inappropriate, or null if clean.
 * Strips underscores and lowercases before checking so common evasion
 * tricks like "f_u_c_k" or "SLUT" are caught.
 */
export function checkUsername(username) {
  const normalized = username.toLowerCase().replace(/_/g, '');

  for (const term of BLOCKED_TERMS) {
    if (normalized.includes(term)) {
      return 'That username is not allowed. Please choose another.';
    }
  }

  return null;
}
