// Mock data. Replace these with API calls (FastAPI / DB / Google Places) later.

export const SPECIALTIES = [
  "General Physician", "Cardiologist", "Dermatologist", "Orthopedic", "Pediatrician",
  "Gynecologist", "ENT Specialist", "Dentist", "Neurologist",
];

export interface Clinic {
  id: string; code: string; name: string; area: string; address: string; distanceKm: number;
  rating: number; reviews: number; open: [number, number]; urgent: boolean; baseWait: number;
  phone: string; x: number; y: number; services: string[]; blurb: string;
}
export interface Doctor {
  id: string; name: string; specialty: string; clinicId: string; rating: number; reviews: number;
  exp: number; fee: number; shift: [number, number]; avgConsult: number; languages: string[];
  about: string; treats: string[];
}
export interface Hospital {
  id: string; name: string; address: string; distanceKm: number; er: boolean; trauma: string;
  phone: string; x: number; y: number; note: string; beds: "Beds available" | "Limited beds";
}

export const CLINICS: Clinic[] = [
  { id: "c1", code: "SF", name: "Sunrise Family & Urgent Care", area: "Andheri West", address: "14, Lokhandwala Main Road, Andheri West", distanceKm: 1.2, rating: 4.7, reviews: 812, open: [480, 1380], urgent: true, baseWait: 14, phone: "+91 22 5550 0111", x: 44, y: 48, services: ["X-ray", "ECG", "Lab collection", "Minor procedures"], blurb: "Walk-in urgent care with on-site X-ray and ECG." },
  { id: "c2", code: "HF", name: "HeartFirst Cardiac Clinic", area: "Bandra West", address: "2nd Floor, Hill Road Medical Arcade, Bandra West", distanceKm: 3.4, rating: 4.8, reviews: 534, open: [600, 1080], urgent: false, baseWait: 20, phone: "+91 22 5550 0122", x: 66, y: 34, services: ["ECG", "2D Echo", "Stress test"], blurb: "Heart health, blood pressure and cholesterol care." },
  { id: "c3", code: "CX", name: "CityCare Express Urgent Care", area: "Juhu", address: "Shop 6, Juhu Tara Road, Juhu", distanceKm: 2.1, rating: 4.5, reviews: 391, open: [720, 1439], urgent: true, baseWait: 26, phone: "+91 22 5550 0133", x: 30, y: 36, services: ["Observation beds", "IV fluids", "Lab collection"], blurb: "Afternoon and late-evening urgent care." },
  { id: "c4", code: "LW", name: "Lotus Skin & Wellness", area: "Powai", address: "G-12, Hiranandani Gardens, Powai", distanceKm: 4.1, rating: 4.8, reviews: 702, open: [600, 1140], urgent: false, baseWait: 12, phone: "+91 22 5550 0144", x: 78, y: 62, services: ["Dermatoscopy", "Laser", "Patch testing"], blurb: "Skin, hair and allergy specialists." },
  { id: "c5", code: "BW", name: "BoneWell Ortho & Trauma Centre", area: "Andheri East", address: "Opp. Metro Station, Andheri East", distanceKm: 2.8, rating: 4.6, reviews: 468, open: [540, 1320], urgent: true, baseWait: 18, phone: "+91 22 5550 0155", x: 62, y: 52, services: ["X-ray", "Plaster room", "Physiotherapy"], blurb: "Fractures, sprains and joint pain, seen the same day." },
  { id: "c6", code: "LS", name: "Little Steps Children's Clinic", area: "Versova", address: "Ground Floor, Seven Bungalows, Versova", distanceKm: 1.9, rating: 4.9, reviews: 1043, open: [480, 1260], urgent: true, baseWait: 9, phone: "+91 22 5550 0166", x: 36, y: 62, services: ["Vaccination", "Nebulization", "Growth checks"], blurb: "Pediatric urgent care with child-friendly rooms." },
  { id: "c7", code: "NL", name: "NeuroLife Specialty Clinic", area: "Goregaon East", address: "4th Floor, Westside Plaza, Goregaon East", distanceKm: 4.6, rating: 4.4, reviews: 256, open: [660, 1140], urgent: false, baseWait: 22, phone: "+91 22 5550 0177", x: 74, y: 22, services: ["EEG", "Nerve conduction"], blurb: "Headache, nerve and movement disorders." },
  { id: "c8", code: "SA", name: "SmileArc Dental Studio", area: "Andheri West", address: "Shop 3, Four Bungalows, Andheri West", distanceKm: 1.5, rating: 4.6, reviews: 389, open: [600, 1200], urgent: false, baseWait: 10, phone: "+91 22 5550 0188", x: 52, y: 66, services: ["Dental X-ray", "Root canal", "Cleaning"], blurb: "Gentle family dentistry." },
  { id: "c9", code: "AW", name: "Aashray Women's Wellness Clinic", area: "Santacruz West", address: "1st Floor, SV Road, Santacruz West", distanceKm: 3.0, rating: 4.7, reviews: 611, open: [600, 1080], urgent: false, baseWait: 15, phone: "+91 22 5550 0199", x: 58, y: 28, services: ["Ultrasound", "Antenatal care"], blurb: "Women's health from teens to menopause." },
  { id: "c10", code: "CV", name: "ClearVoice ENT Centre", area: "Jogeshwari", address: "Unit 8, Ambolí Plaza, Jogeshwari West", distanceKm: 2.4, rating: 4.3, reviews: 214, open: [660, 1140], urgent: false, baseWait: 11, phone: "+91 22 5550 0210", x: 24, y: 52, services: ["Endoscopy", "Audiometry"], blurb: "Ear, nose and throat care." },
  { id: "c11", code: "MX", name: "Medico 24x7 Urgent Care", area: "Andheri East", address: "Near Chakala Junction, Andheri East", distanceKm: 5.2, rating: 4.2, reviews: 927, open: [0, 1440], urgent: true, baseWait: 7, phone: "+91 22 5550 0224", x: 84, y: 44, services: ["24x7 doctor", "Ambulance bay", "ECG", "Pharmacy"], blurb: "The one that is open at 3 AM." },
];

const d = (
  id: string, name: string, specialty: string, clinicId: string, rating: number, reviews: number,
  exp: number, fee: number, shift: [number, number], languages: string[], about: string, treats: string[], avgConsult = 12,
): Doctor => ({ id, name, specialty, clinicId, rating, reviews, exp, fee, shift, avgConsult, languages, about, treats });

export const DOCTORS: Doctor[] = [
  d("d1", "Dr. Rahul Sharma", "General Physician", "c1", 4.8, 640, 12, 500, [540, 1260], ["English", "Hindi", "Marathi"], "Family physician focused on fever, infections, diabetes and blood pressure follow-ups.", ["fever", "infection", "diabetes", "blood pressure", "cough"]),
  d("d18", "Dr. Pooja Menon", "General Physician", "c1", 4.6, 288, 9, 450, [840, 1380], ["English", "Hindi", "Malayalam"], "Evening urgent care physician. Sees walk-ins for sudden illness and minor injuries.", ["stomach pain", "vomiting", "minor injury", "fever"]),
  d("d2", "Dr. Meera Iyer", "General Physician", "c11", 4.4, 331, 11, 400, [480, 960], ["English", "Hindi", "Tamil"], "Day-shift physician at a 24x7 urgent care centre.", ["fever", "infection", "dehydration"]),
  d("d3", "Dr. Imran Qureshi", "General Physician", "c11", 4.3, 276, 8, 500, [0, 480], ["English", "Hindi", "Urdu"], "Night-duty doctor. Handles urgent problems when other clinics are closed.", ["night emergencies", "fever", "pain", "breathing difficulty"]),
  d("d19", "Dr. Sanjay Kulkarni", "General Physician", "c11", 4.2, 402, 14, 450, [960, 1410], ["English", "Hindi", "Marathi"], "Evening-shift physician with emergency medicine training.", ["injury", "infection", "chest discomfort"]),
  d("d4", "Dr. Ananya Rao", "Cardiologist", "c2", 4.9, 512, 15, 1200, [600, 1080], ["English", "Hindi", "Kannada"], "Preventive cardiology, blood pressure and cholesterol management.", ["blood pressure", "palpitations", "chest discomfort", "cholesterol"]),
  d("d5", "Dr. Vikram Desai", "Cardiologist", "c2", 4.6, 301, 20, 1500, [720, 1200], ["English", "Hindi", "Gujarati"], "Senior cardiologist, heart failure and rhythm disorders.", ["heart failure", "arrhythmia", "post-heart attack care"]),
  d("d6", "Dr. Neha Kapoor", "Dermatologist", "c4", 4.8, 598, 9, 800, [600, 1140], ["English", "Hindi", "Punjabi"], "Persistent skin problems, acne, eczema, and hair fall.", ["skin rash", "acne", "eczema", "hair fall", "fungal infection"]),
  d("d7", "Dr. Arjun Menon", "Orthopedic", "c5", 4.7, 377, 14, 900, [540, 1260], ["English", "Hindi", "Malayalam"], "Fractures, sports injuries and joint replacement review.", ["fracture", "sprain", "knee pain", "back pain"]),
  d("d8", "Dr. Farah Sheikh", "Orthopedic", "c5", 4.4, 190, 8, 700, [840, 1320], ["English", "Hindi", "Urdu"], "Evening ortho clinic for sprains, shoulder and neck pain.", ["shoulder pain", "neck pain", "sprain"]),
  d("d9", "Dr. Priya Nair", "Pediatrician", "c6", 4.9, 905, 11, 600, [540, 1260], ["English", "Hindi", "Malayalam"], "Newborn to teen care, vaccination, fever and breathing issues in children.", ["child fever", "cough", "vaccination", "rashes"]),
  d("d10", "Dr. Kunal Joshi", "Pediatrician", "c6", 4.5, 210, 6, 500, [480, 960], ["English", "Hindi", "Marathi"], "Morning pediatric clinic and growth monitoring.", ["child cold", "growth", "diarrhea"]),
  d("d11", "Dr. Lakshmi Pillai", "Gynecologist", "c9", 4.8, 588, 17, 1000, [600, 1080], ["English", "Hindi", "Tamil"], "Menstrual health, pregnancy care and PCOS.", ["pregnancy", "PCOS", "irregular periods"]),
  d("d12", "Dr. Rohan Bhatt", "ENT Specialist", "c10", 4.4, 205, 10, 700, [660, 1140], ["English", "Hindi", "Gujarati"], "Ear infections, sinus, tonsils and hearing evaluation.", ["ear pain", "sinus", "sore throat", "hearing loss"]),
  d("d13", "Dr. Aditi Verma", "Dentist", "c8", 4.6, 361, 7, 400, [600, 1200], ["English", "Hindi"], "General and restorative dentistry, painless root canals.", ["toothache", "gum problems", "cavities"]),
  d("d14", "Dr. Sameer Ghosh", "Neurologist", "c7", 4.5, 233, 16, 1300, [660, 1140], ["English", "Hindi", "Bengali"], "Migraine, epilepsy, numbness and balance problems.", ["migraine", "numbness", "dizziness", "epilepsy"]),
  d("d15", "Dr. Tanvi Shah", "General Physician", "c3", 4.5, 266, 8, 450, [720, 1410], ["English", "Hindi", "Gujarati"], "Afternoon-to-night urgent care physician.", ["fever", "food poisoning", "minor injury"]),
  d("d16", "Dr. Harsh Vora", "General Physician", "c3", 4.3, 152, 5, 400, [720, 1080], ["English", "Hindi"], "Walk-in general medicine.", ["cold", "cough", "body ache"]),
];

export const HOSPITALS: Hospital[] = [
  { id: "h1", name: "Lifeline Multispecialty Hospital", address: "Link Road, Andheri West", distanceKm: 2.3, er: true, trauma: "Trauma care, 24x7 ICU", phone: "022 5550 0101", x: 40, y: 42, note: "Emergency department open 24 hours", beds: "Beds available" },
  { id: "h2", name: "St. Anthony Emergency Hospital", address: "SV Road, Vile Parle West", distanceKm: 3.1, er: true, trauma: "Cardiac and stroke ready", phone: "022 5550 0102", x: 56, y: 40, note: "Cath lab on call", beds: "Limited beds" },
  { id: "h3", name: "Metro General Hospital", address: "Western Express Highway, Andheri East", distanceKm: 4.8, er: true, trauma: "Level 1 trauma centre", phone: "022 5550 0103", x: 70, y: 56, note: "Major accident and burns unit", beds: "Beds available" },
  { id: "h4", name: "Harmony Heart & Critical Care", address: "Hill Road, Bandra West", distanceKm: 5.6, er: true, trauma: "Cardiac emergency", phone: "022 5550 0104", x: 68, y: 30, note: "24x7 cardiac emergency", beds: "Limited beds" },
  { id: "h5", name: "Government Civil Hospital", address: "Jogeshwari East", distanceKm: 6.9, er: true, trauma: "Free emergency care", phone: "022 5550 0105", x: 28, y: 22, note: "Casualty ward open 24 hours", beds: "Limited beds" },
];

export const EMERGENCY_CONTACTS = [
  { label: "Ambulance (national)", number: "108", note: "Free, 24x7. Availability varies by state." },
  { label: "All emergencies (police, fire, medical)", number: "112", note: "Single emergency number across India." },
  { label: "Mother and child ambulance", number: "102", note: "Free transport for pregnancy and newborn care in many states." },
  { label: "Private ambulance (sample)", number: "02255500199", display: "022 5550 0199", note: "Sample number. Replace with a verified provider." },
  { label: "Mental health support (Tele-MANAS)", number: "14416", note: "Free, 24x7 counselling helpline." },
];

export const getClinic = (id: string) => CLINICS.find((c) => c.id === id)!;
export const getDoctor = (id: string) => DOCTORS.find((x) => x.id === id)!;
export const doctorsOf = (clinicId: string) => DOCTORS.filter((x) => x.clinicId === clinicId);
export const clinicSpecialties = (clinicId: string) => Array.from(new Set(doctorsOf(clinicId).map((x) => x.specialty)));
export const DEMO_NAMES = ["Anita Kulkarni", "Sohail Khan", "Ritu Verma", "Dev Patel", "Meenal Joshi", "Farhan Ali", "Kavya Reddy", "Nikhil Rao", "Sara Dsouza", "Imran Sayed", "Pooja Shetty", "Yash Mehra"];
