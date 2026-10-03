// Specialty routing + emergency keyword detection. This helps choose WHO to see. It does NOT diagnose.

const RULES: { s: string; k: string[] }[] = [
  { s: "Dermatologist", k: ["skin", "rash", "acne", "pimple", "itch", "eczema", "psoriasis", "hair fall", "dandruff", "fungal", "mole", "hives"] },
  { s: "Cardiologist", k: ["heart", "palpitation", "blood pressure", "bp ", "cholesterol", "chest tight", "chest discomfort"] },
  { s: "Orthopedic", k: ["bone", "fracture", "joint", "knee", "back pain", "shoulder", "sprain", "ligament", "neck pain", "muscle", "twisted", "ankle"] },
  { s: "Pediatrician", k: ["child", "baby", "infant", "kid", "toddler", "newborn", "vaccin", "my son", "my daughter"] },
  { s: "Gynecologist", k: ["period", "pregnan", "menstrual", "pcos", "gynec", "menopause", "ovary", "vaginal"] },
  { s: "ENT Specialist", k: ["ear", "nose", "throat", "sinus", "tonsil", "hearing", "sneez", "voice", "nasal"] },
  { s: "Dentist", k: ["tooth", "teeth", "dental", "gum", "cavity", "jaw", "toothache"] },
  { s: "Neurologist", k: ["migraine", "headache", "numb", "dizz", "tremor", "memory", "nerve", "epilep", "tingling"] },
  { s: "General Physician", k: ["fever", "cold", "cough", "flu", "stomach", "vomit", "diarr", "weak", "fatigue", "body ache", "infection", "check-up", "checkup", "tired"] },
];

const RED_FLAGS: { k: string[]; label: string; aid: string }[] = [
  { k: ["chest pain", "pressure in chest", "pain in chest", "heart attack"], label: "Chest pain can be a medical emergency", aid: "heart-attack" },
  { k: ["can't breathe", "cannot breathe", "unable to breathe", "difficulty breathing", "trouble breathing", "shortness of breath", "breathless", "gasping"], label: "Trouble breathing needs urgent care", aid: "asthma" },
  { k: ["unconscious", "not responding", "not breathing", "collapsed", "passed out and"], label: "An unresponsive person needs an ambulance now", aid: "cpr" },
  { k: ["severe bleeding", "bleeding heavily", "bleeding a lot", "blood loss", "won't stop bleeding", "wont stop bleeding"], label: "Heavy bleeding is an emergency", aid: "bleeding" },
  { k: ["stroke", "face droop", "slurred speech", "one side weak", "sudden weakness"], label: "These can be signs of a stroke", aid: "stroke" },
  { k: ["seizure", "convulsion", "fits"], label: "A seizure needs medical attention", aid: "seizure" },
  { k: ["choking", "choked"], label: "Choking is an emergency", aid: "choking" },
  { k: ["poison", "overdose", "swallowed", "drank phenyl", "consumed"], label: "Possible poisoning needs urgent care", aid: "poisoning" },
  { k: ["snake", "snakebite"], label: "A snake bite needs hospital care", aid: "snake-bite" },
  { k: ["severe burn", "burn", "scald"], label: "Burns may need urgent care", aid: "burns" },
  { k: ["electric shock", "electrocut"], label: "Electric shock needs urgent care", aid: "electric-shock" },
  { k: ["allergic reaction", "swelling of face", "swollen lips", "anaphyla"], label: "A severe allergic reaction is an emergency", aid: "anaphylaxis" },
  { k: ["head injury", "hit my head", "fell on head", "accident"], label: "A head injury or accident needs checking", aid: "head-injury" },
  { k: ["heat stroke", "heatstroke"], label: "Heat stroke is an emergency", aid: "heat-stroke" },
  { k: ["low sugar", "hypoglyc"], label: "Very low blood sugar needs quick action", aid: "low-sugar" },
  { k: ["broken bone", "bone sticking", "open fracture"], label: "A serious fracture needs urgent care", aid: "fracture" },
];
const MENTAL = ["suicid", "kill myself", "end my life", "self harm", "self-harm", "hurt myself"];

export interface Triage {
  specialty: string | null;
  matched: string[];
  redFlags: { label: string; aid: string }[];
  mental: boolean;
}

export function analyse(text: string): Triage {
  const t = ` ${text.toLowerCase()} `;
  const scores = RULES.map((r) => ({ s: r.s, hits: r.k.filter((k) => t.includes(k)) })).filter((x) => x.hits.length);
  scores.sort((a, b) => b.hits.length - a.hits.length);
  const redFlags = RED_FLAGS.filter((r) => r.k.some((k) => t.includes(k))).map(({ label, aid }) => ({ label, aid }));
  const mental = MENTAL.some((k) => t.includes(k));
  const specialty = scores[0]?.s ?? (text.trim().length > 3 ? "General Physician" : null);
  return { specialty, matched: scores[0]?.hits ?? [], redFlags, mental };
}

export const isLateNight = (d: Date) => d.getHours() >= 22 || d.getHours() < 6;
