// General first aid guidance for the minutes before help arrives. Not a substitute for professional care.

export interface Guide {
  id: string; title: string; severity: "critical" | "urgent"; icon: string; blurb: string; keywords: string[];
  steps: string[]; dont: string[]; tell: string[];
}

export const GUIDES: Guide[] = [
  {
    id: "cpr", title: "Not responding or not breathing (CPR)", severity: "critical", icon: "HeartPulse",
    blurb: "Tap and shout. If there is no normal breathing, start chest compressions.",
    keywords: ["unconscious", "not breathing", "collapsed", "cpr", "cardiac arrest", "unresponsive"],
    steps: [
      "Tap their shoulders and shout. If they do not respond and are not breathing normally, call 108 or 112, or ask someone nearby to call. Put the phone on speaker.",
      "Lay them on their back on a firm surface.",
      "Place the heel of one hand on the centre of the chest, the other hand on top. Lock your elbows.",
      "Push hard and fast: about 5 to 6 cm deep, 100 to 120 times a minute. Let the chest rise fully each time.",
      "If you are trained, give 2 rescue breaths after every 30 compressions. If not, keep going with compressions only.",
      "If an AED is nearby, switch it on and follow its voice prompts.",
      "Continue until the ambulance arrives, the person starts breathing, or you are too exhausted to continue. Swap with someone else if possible.",
    ],
    dont: ["Do not stop to keep checking for a pulse.", "Do not give water, food or medicine.", "Do not move them unless the place is unsafe."],
    tell: ["When they collapsed", "Known heart problems or medicines", "How long you have been doing CPR"],
  },
  {
    id: "heart-attack", title: "Chest pain or possible heart attack", severity: "critical", icon: "HeartPulse",
    blurb: "Pressure, squeezing or pain in the chest, arm, jaw or back, with sweating or breathlessness.",
    keywords: ["chest pain", "heart attack", "chest pressure", "left arm pain", "sweating", "heart"],
    steps: [
      "Call 108 now. Do not wait to see if it passes.",
      "Help them sit down in a half-sitting position, with knees bent and back supported.",
      "Loosen tight clothing and keep them calm and still.",
      "If they are not allergic to aspirin and the emergency operator agrees, give one regular adult aspirin to chew slowly.",
      "Stay with them and watch their breathing. If they become unresponsive and stop breathing normally, start CPR.",
      "Unlock the door and send someone to the road to guide the ambulance.",
    ],
    dont: ["Do not let them walk around, climb stairs or drive.", "Do not give food or drink.", "Do not leave them alone."],
    tell: ["When the pain started", "Heart or blood pressure medicines", "Allergies, especially to aspirin"],
  },
  {
    id: "stroke", title: "Possible stroke (FAST)", severity: "critical", icon: "Brain",
    blurb: "Face drooping, arm weakness, slurred speech. Time matters.",
    keywords: ["stroke", "face droop", "slurred speech", "arm weakness", "paralysis", "sudden weakness"],
    steps: [
      "Check FAST: Face drooping on one side? Arm weak or numb? Speech slurred or confused? If any are yes, Time to call 108.",
      "Note the exact time symptoms started. Doctors need this to decide on treatment.",
      "Ask the operator for the nearest hospital that treats stroke.",
      "Keep them lying down with head and shoulders slightly raised. If drowsy, turn them onto their side.",
      "Loosen tight clothing. Stay with them and keep them calm.",
    ],
    dont: ["Do not give food, water or any medicine, including aspirin.", "Do not let them 'sleep it off'.", "Do not drive them yourself if an ambulance is available."],
    tell: ["Exact time symptoms started", "Medicines, especially blood thinners", "Any recent fall or head injury"],
  },
  {
    id: "bleeding", title: "Severe bleeding", severity: "critical", icon: "Droplet",
    blurb: "Blood that is spurting, soaking through cloth, or will not stop.",
    keywords: ["bleeding", "blood", "cut", "wound", "deep cut", "stab"],
    steps: [
      "Call 108. Use gloves or a clean plastic bag on your hand if you can.",
      "Press firmly and directly on the wound with a clean cloth or bandage. Keep pressing.",
      "If blood soaks through, add more cloth on top. Do not lift the first layer.",
      "Lay the person down and raise the injured limb if there is no suspected fracture.",
      "Keep them warm and talking. Pale, cold, sweaty skin means shock: keep them lying flat.",
      "Once bleeding slows, bandage firmly over the pad.",
    ],
    dont: ["Do not remove objects stuck in the wound. Pad around them.", "Do not keep peeking at the wound.", "Do not give food or drink."],
    tell: ["How long it has been bleeding", "Blood thinner medicines", "How the injury happened"],
  },
  {
    id: "choking", title: "Choking", severity: "critical", icon: "Wind",
    blurb: "Cannot speak, cough or breathe. May clutch their throat.",
    keywords: ["choking", "choked", "stuck in throat", "food stuck"],
    steps: [
      "Ask 'Are you choking?' If they can cough, encourage them to keep coughing.",
      "If they cannot cough, speak or breathe: lean them forward and give 5 firm back blows between the shoulder blades with the heel of your hand.",
      "Then give up to 5 abdominal thrusts: stand behind, fist just above the navel, pull sharply inward and upward.",
      "Alternate 5 back blows and 5 thrusts until the object comes out.",
      "If they become unresponsive, call 108 and start CPR.",
      "Infant under 1 year: lay face down along your forearm, 5 back blows, then turn over and give 5 chest thrusts with two fingers. No abdominal thrusts.",
    ],
    dont: ["Do not slap the back of someone who is coughing effectively.", "Do not sweep the mouth blindly with fingers.", "Do not give water."],
    tell: ["What they were eating or what was swallowed", "How long they could not breathe"],
  },
  {
    id: "burns", title: "Burns and scalds", severity: "urgent", icon: "Flame",
    blurb: "Cool first. Then cover loosely.",
    keywords: ["burn", "scald", "fire", "hot water", "hot oil", "acid"],
    steps: [
      "Move away from the heat source. Remove rings, watches and tight clothing near the burn before it swells, unless stuck to the skin.",
      "Cool the burn under cool (not ice-cold) running water for at least 20 minutes.",
      "Cover loosely with clean cling film or a clean non-fluffy cloth.",
      "Keep the person warm. Give small sips of water if they are alert.",
      "Call 108 for burns that are large, deep, on the face, hands, genitals or airway, or caused by chemicals or electricity.",
    ],
    dont: ["Do not apply ice, butter, oil, toothpaste or powder.", "Do not burst blisters.", "Do not pull off clothing that is stuck to the burn."],
    tell: ["What caused the burn", "How long ago", "Any smoke inhalation"],
  },
  {
    id: "fracture", title: "Suspected broken bone", severity: "urgent", icon: "Bone",
    blurb: "Swelling, deformity, unable to move or bear weight.",
    keywords: ["fracture", "broken bone", "broke", "bone", "sprain", "fall", "twisted ankle"],
    steps: [
      "Keep the person still. Do not try to move the injured part.",
      "Support the limb in the position you found it, using rolled clothes, a pillow or a folded newspaper as a splint.",
      "If there is an open wound, cover it with a clean dressing and press around (not on) the bone to control bleeding.",
      "Hold a cold pack wrapped in cloth on the area for up to 20 minutes to reduce swelling.",
      "Call 108 if the injury is to the neck, back, head, hip or thigh, or if the bone is visible.",
    ],
    dont: ["Do not straighten the limb or push the bone back.", "Do not give food or drink in case surgery is needed.", "Do not move someone with a possible neck or back injury."],
    tell: ["How the injury happened", "Loss of feeling or colour change below the injury"],
  },
  {
    id: "seizure", title: "Seizure or convulsions", severity: "urgent", icon: "Brain",
    blurb: "Shaking, stiffening, or sudden loss of awareness.",
    keywords: ["seizure", "fits", "convulsion", "epilepsy", "shaking"],
    steps: [
      "Note the time the seizure started.",
      "Clear hard objects away and cushion the head with something soft.",
      "Loosen tight clothing around the neck.",
      "When the shaking stops, gently roll them onto their side (recovery position).",
      "Stay until they are fully awake. Speak calmly and reassure them.",
      "Call 108 if it lasts more than 5 minutes, repeats, it is their first seizure, they are injured, pregnant, or have trouble breathing afterwards.",
    ],
    dont: ["Do not hold them down.", "Do not put anything in their mouth.", "Do not give food or water until fully alert."],
    tell: ["How long it lasted", "Known epilepsy and medicines", "Any head injury"],
  },
  {
    id: "anaphylaxis", title: "Severe allergic reaction", severity: "critical", icon: "ShieldAlert",
    blurb: "Swelling of lips or face, hives, wheeze, dizziness after a sting, food or medicine.",
    keywords: ["allergy", "allergic", "swelling", "sting", "hives", "anaphylaxis", "peanut"],
    steps: [
      "Call 108 immediately.",
      "If they carry an adrenaline (epinephrine) auto-injector, use it on the outer thigh, through clothing if needed.",
      "Lay them flat with legs raised. If they are struggling to breathe, let them sit up instead.",
      "If there is no improvement after 5 to 15 minutes and a second injector is available, use it.",
      "Stay with them. Be ready to start CPR if they stop breathing.",
    ],
    dont: ["Do not rely on an antihistamine tablet alone.", "Do not make them stand or walk.", "Do not give food or drink."],
    tell: ["What triggered it, if known", "Time and number of auto-injector doses used"],
  },
  {
    id: "asthma", title: "Asthma attack or breathing difficulty", severity: "urgent", icon: "Wind",
    blurb: "Wheezing, cannot speak full sentences, tight chest.",
    keywords: ["asthma", "breathing", "wheez", "breathless", "shortness of breath", "can't breathe"],
    steps: [
      "Sit them upright and keep calm. Loosen tight clothing.",
      "Help them use their reliever inhaler (usually blue): one puff at a time, with a spacer if they have one, 4 slow breaths per puff. Up to 10 puffs.",
      "Open windows for fresh air. Remove them from smoke, dust or triggers.",
      "Call 108 if there is no quick improvement, they cannot speak, or lips turn blue.",
      "If they have no inhaler, keep them upright and calm while waiting for the ambulance.",
    ],
    dont: ["Do not make them lie flat.", "Do not leave them alone.", "Do not give oral medicines they do not normally take."],
    tell: ["Asthma history and medicines", "How many puffs were used and when"],
  },
  {
    id: "poisoning", title: "Poisoning or overdose", severity: "critical", icon: "Skull",
    blurb: "Swallowed medicine, chemicals, pesticide or an unknown substance.",
    keywords: ["poison", "overdose", "swallowed", "pesticide", "chemical", "tablets", "phenyl"],
    steps: [
      "Call 108 now and tell them what was taken, how much and when.",
      "Keep the container, strip or label. Send it with the person to the hospital.",
      "If there are fumes, move to fresh air. For chemicals on skin, remove clothing and rinse with water for 15 minutes. For eyes, rinse for 15 minutes.",
      "If the person is drowsy or unconscious but breathing, place them in the recovery position.",
      "Stay with them and watch their breathing.",
    ],
    dont: ["Do not make them vomit.", "Do not give milk, salt water or home remedies.", "Do not leave them alone."],
    tell: ["Name of substance and amount", "Time taken", "Weight and age of the person"],
  },
  {
    id: "snake-bite", title: "Snake bite", severity: "critical", icon: "AlertTriangle",
    blurb: "Keep still and get to a hospital with anti-venom quickly.",
    keywords: ["snake", "snakebite", "bitten", "venom"],
    steps: [
      "Call 108. Keep the person calm and as still as possible. Movement spreads venom faster.",
      "Remove rings, bangles, watches and tight clothing near the bite before swelling starts.",
      "Immobilise the limb like a fracture, keeping it at or just below heart level.",
      "Note the time of the bite. Mark the edge of any swelling with a pen and write the time.",
      "Go to a hospital that stocks anti-snake venom. Do not delay.",
    ],
    dont: ["Do not cut the wound or suck out venom.", "Do not tie a tight tourniquet.", "Do not apply ice, herbs or give alcohol.", "Do not try to catch or kill the snake. A phone photo from a safe distance is enough."],
    tell: ["Time of bite", "Snake description if seen", "Symptoms such as drooping eyelids or breathing difficulty"],
  },
  {
    id: "heat-stroke", title: "Heat stroke", severity: "critical", icon: "Sun",
    blurb: "Very hot skin, confusion, collapse after heat or exertion.",
    keywords: ["heat stroke", "heatstroke", "sun stroke", "overheated", "heat"],
    steps: [
      "Call 108 if they are confused, very drowsy or unconscious.",
      "Move them to shade or a cool room. Remove extra clothing.",
      "Cool the body: wet cloths, fanning, cool water on skin, ice packs wrapped in cloth on neck, armpits and groin.",
      "Give small sips of cool water only if they are fully alert.",
    ],
    dont: ["Do not give fever tablets.", "Do not give drinks to someone who is drowsy.", "Do not leave them alone."],
    tell: ["How long in the heat", "Any medicines or alcohol"],
  },
  {
    id: "head-injury", title: "Head injury", severity: "urgent", icon: "Brain",
    blurb: "A knock to the head, a fall or an accident.",
    keywords: ["head injury", "hit head", "concussion", "fell", "accident"],
    steps: [
      "Keep them still and support the head and neck. Do not move them if a neck injury is possible.",
      "If bleeding, press gently around the wound with a clean cloth.",
      "Call 108 if they lost consciousness, vomited, are confused or drowsy, have a seizure, fluid from ears or nose, or a severe headache.",
      "Apply a cold pack wrapped in cloth to swelling.",
      "Watch them closely for the next 24 hours, even if they seem fine.",
    ],
    dont: ["Do not let them sleep unsupervised right after a serious knock.", "Do not remove a helmet unless it blocks breathing.", "Do not give painkillers like aspirin."],
    tell: ["How the injury happened", "Whether they blacked out"],
  },
  {
    id: "electric-shock", title: "Electric shock", severity: "critical", icon: "Zap",
    blurb: "Make sure the power is off before you touch anyone.",
    keywords: ["electric", "shock", "electrocut", "current"],
    steps: [
      "Do not touch the person until the power is off. Switch off at the mains, or push the source away with a dry wooden or plastic object.",
      "Call 108.",
      "Check breathing. If not breathing normally, start CPR.",
      "Cool any burns with running water and cover loosely.",
      "Keep them lying down and warm until help arrives.",
    ],
    dont: ["Do not touch them with bare hands while still in contact with power.", "Do not go near fallen power lines. Stay well back."],
    tell: ["Source and voltage if known", "Whether they lost consciousness"],
  },
  {
    id: "low-sugar", title: "Very low blood sugar", severity: "urgent", icon: "Droplet",
    blurb: "Shaky, sweaty, confused, usually in someone with diabetes.",
    keywords: ["low sugar", "diabetes", "hypoglycemia", "sugar", "shaky"],
    steps: [
      "If they are awake and can swallow, give 15 to 20 g of fast sugar: 3 teaspoons sugar, a glass of juice or glucose tablets.",
      "Wait 15 minutes. If still unwell, repeat once.",
      "When better, give a snack with starch such as biscuits or bread.",
      "If they become drowsy or unconscious, call 108 and place them on their side. Give nothing by mouth.",
    ],
    dont: ["Do not give food or drink to someone who is not fully awake.", "Do not give insulin."],
    tell: ["Diabetes type and medicines", "Time of last meal"],
  },
  {
    id: "faint", title: "Fainting (breathing normally)", severity: "urgent", icon: "User",
    blurb: "Someone has passed out but is breathing.",
    keywords: ["faint", "fainted", "dizzy", "passed out", "blackout"],
    steps: [
      "Lay them flat and raise their legs about 30 cm.",
      "Loosen tight clothing and make sure they have fresh air.",
      "Check breathing. If they are breathing but stay unconscious, roll them onto their side and call 108.",
      "When they wake, keep them lying down for a few minutes. Offer sips of water when fully alert.",
    ],
    dont: ["Do not sit them up quickly.", "Do not splash water on the face.", "Do not give food or drink until awake."],
    tell: ["How long they were out", "Any chest pain, injury or medical conditions"],
  },
];

export const WAITING_CHECKLIST = [
  "Keep the phone on speaker with the emergency operator and follow their instructions.",
  "Share the exact address, a nearby landmark and the floor or gate number.",
  "Unlock the gate and door, switch on lights, and send someone to wait on the road.",
  "Gather ID, medicine strips, and any medical reports.",
  "Stay with the patient. Note any changes and the time they happen.",
  "Do not give food or drink unless a guide above says it is safe.",
];

export const guideById = (id: string) => GUIDES.find((g) => g.id === id);
export function guideForText(text: string): Guide | undefined {
  const t = text.toLowerCase();
  let best: { g: Guide; n: number } | null = null;
  for (const g of GUIDES) {
    const n = g.keywords.filter((k) => t.includes(k)).length;
    if (n && (!best || n > best.n)) best = { g, n };
  }
  return best?.g;
}
