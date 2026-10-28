// Mock data. Replace these with API calls (FastAPI / DB / Google Places) later.

export const SPECIALTIES = [
  "General Physician", "Cardiologist", "Dermatologist", "Orthopedic", "Pediatrician",
  "Gynecologist", "ENT Specialist", "Dentist", "Neurologist",
];

export interface Clinic {
  id: string; code: string; name: string; area: string; address: string; lat: number; lng: number;
  rating: number; reviews: number; open: [number, number]; urgent: boolean; baseWait: number;
  phone: string; services: string[]; blurb: string; status?: string;
}
export interface Doctor {
  id: string; name: string; specialty: string; clinicId: string; rating: number; reviews: number;
  exp: number; fee: number; shift: [number, number]; avgConsult: number; languages: string[];
  about: string; treats: string[]; status?: string;
}
export interface Hospital {
  id: string; name: string; address: string; lat: number; lng: number; er: boolean; trauma: string;
  phone: string; note: string; beds: "Beds available" | "Limited beds";
}

export let CLINICS: Clinic[] = [
  { id: "c1", code: "SF", name: "Sunrise Family & Urgent Care", area: "Andheri West", address: "14, Lokhandwala Main Road, Andheri West", lat: 19.1363, lng: 72.8277, rating: 4.7, reviews: 812, open: [480, 1380], urgent: true, baseWait: 14, phone: "+91 22 5550 0111", services: ["X-ray", "ECG", "Lab collection", "Minor procedures"], blurb: "Walk-in urgent care with on-site X-ray and ECG." },
  { id: "c2", code: "HF", name: "HeartFirst Cardiac Clinic", area: "Bandra West", address: "2nd Floor, Hill Road Medical Arcade, Bandra West", lat: 19.0596, lng: 72.8295, rating: 4.8, reviews: 534, open: [600, 1080], urgent: false, baseWait: 20, phone: "+91 22 5550 0122", services: ["ECG", "2D Echo", "Stress test"], blurb: "Heart health, blood pressure and cholesterol care." },
  { id: "c3", code: "CX", name: "CityCare Express Urgent Care", area: "Juhu", address: "Shop 6, Juhu Tara Road, Juhu", lat: 19.1075, lng: 72.8263, rating: 4.5, reviews: 391, open: [720, 1439], urgent: true, baseWait: 26, phone: "+91 22 5550 0133", services: ["Observation beds", "IV fluids", "Lab collection"], blurb: "Afternoon and late-evening urgent care." },
  { id: "c4", code: "LW", name: "Lotus Skin & Wellness", area: "Powai", address: "G-12, Hiranandani Gardens, Powai", lat: 19.1176, lng: 72.906, rating: 4.8, reviews: 702, open: [600, 1140], urgent: false, baseWait: 12, phone: "+91 22 5550 0144", services: ["Dermatoscopy", "Laser", "Patch testing"], blurb: "Skin, hair and allergy specialists." },
  { id: "c5", code: "BW", name: "BoneWell Ortho & Trauma Centre", area: "Andheri East", address: "Opp. Metro Station, Andheri East", lat: 19.1136, lng: 72.8697, rating: 4.6, reviews: 468, open: [540, 1320], urgent: true, baseWait: 18, phone: "+91 22 5550 0155", services: ["X-ray", "Plaster room", "Physiotherapy"], blurb: "Fractures, sprains and joint pain, seen the same day." },
  { id: "c6", code: "LS", name: "Little Steps Children's Clinic", area: "Versova", address: "Ground Floor, Seven Bungalows, Versova", lat: 19.13, lng: 72.812, rating: 4.9, reviews: 1043, open: [480, 1260], urgent: true, baseWait: 9, phone: "+91 22 5550 0166", services: ["Vaccination", "Nebulization", "Growth checks"], blurb: "Pediatric urgent care with child-friendly rooms." },
  { id: "c7", code: "NL", name: "NeuroLife Specialty Clinic", area: "Goregaon East", address: "4th Floor, Westside Plaza, Goregaon East", lat: 19.1663, lng: 72.8526, rating: 4.4, reviews: 256, open: [660, 1140], urgent: false, baseWait: 22, phone: "+91 22 5550 0177", services: ["EEG", "Nerve conduction"], blurb: "Headache, nerve and movement disorders." },
  { id: "c8", code: "SA", name: "SmileArc Dental Studio", area: "Andheri West", address: "Shop 3, Four Bungalows, Andheri West", lat: 19.1308, lng: 72.817, rating: 4.6, reviews: 389, open: [600, 1200], urgent: false, baseWait: 10, phone: "+91 22 5550 0188", services: ["Dental X-ray", "Root canal", "Cleaning"], blurb: "Gentle family dentistry." },
  { id: "c9", code: "AW", name: "Aashray Women's Wellness Clinic", area: "Santacruz West", address: "1st Floor, SV Road, Santacruz West", lat: 19.0849, lng: 72.8362, rating: 4.7, reviews: 611, open: [600, 1080], urgent: false, baseWait: 15, phone: "+91 22 5550 0199", services: ["Ultrasound", "Antenatal care"], blurb: "Women's health from teens to menopause." },
  { id: "c10", code: "CV", name: "ClearVoice ENT Centre", area: "Jogeshwari", address: "Unit 8, Ambolí Plaza, Jogeshwari West", lat: 19.1374, lng: 72.8458, rating: 4.3, reviews: 214, open: [660, 1140], urgent: false, baseWait: 11, phone: "+91 22 5550 0210", services: ["Endoscopy", "Audiometry"], blurb: "Ear, nose and throat care." },
  { id: "c11", code: "MX", name: "Medico 24x7 Urgent Care", area: "Andheri East", address: "Near Chakala Junction, Andheri East", lat: 19.1116, lng: 72.8607, rating: 4.2, reviews: 927, open: [0, 1440], urgent: true, baseWait: 7, phone: "+91 22 5550 0224", services: ["24x7 doctor", "Ambulance bay", "ECG", "Pharmacy"], blurb: "The one that is open at 3 AM." },
  { id: "c12", code: "GW", name: "Westside Family Clinic (Sample)", area: "Goregaon West", address: "Link Road, Goregaon West, Mumbai", lat: 19.1552, lng: 72.8491, rating: 4.5, reviews: 126, open: [480, 1200], urgent: false, baseWait: 16, phone: "+91 22 5550 0231", services: ["General consultation", "Diabetes care", "Blood tests"], blurb: "Sample listing. Verify location and contact details before visiting." },
  { id: "c13", code: "MW", name: "Malad Wellness Centre (Sample)", area: "Malad West", address: "Marve Road, Malad West, Mumbai", lat: 19.1874, lng: 72.8482, rating: 4.4, reviews: 98, open: [540, 1200], urgent: false, baseWait: 18, phone: "+91 22 5550 0232", services: ["General consultation", "Dermatology", "Vaccination"], blurb: "Sample listing. Verify location and contact details before visiting." },
  { id: "c14", code: "ME", name: "East Malad Medical Clinic (Sample)", area: "Malad East", address: "Western Express Highway, Malad East, Mumbai", lat: 19.1876, lng: 72.8646, rating: 4.3, reviews: 84, open: [480, 1320], urgent: true, baseWait: 14, phone: "+91 22 5550 0233", services: ["General consultation", "Minor injuries", "ECG"], blurb: "Sample listing. Verify location and contact details before visiting." },
  { id: "c15", code: "BV", name: "Borivali Family Health (Sample)", area: "Borivali West", address: "Link Road, Borivali West, Mumbai", lat: 19.2307, lng: 72.8567, rating: 4.6, reviews: 142, open: [480, 1260], urgent: false, baseWait: 15, phone: "+91 22 5550 0234", services: ["General consultation", "Pediatrics", "Lab collection"], blurb: "Sample listing. Verify location and contact details before visiting." },
  { id: "c16", code: "BE", name: "Borivali East Urgent Clinic (Sample)", area: "Borivali East", address: "Near National Park, Borivali East, Mumbai", lat: 19.2297, lng: 72.8721, rating: 4.2, reviews: 73, open: [0, 1440], urgent: true, baseWait: 12, phone: "+91 22 5550 0235", services: ["24x7 doctor", "Minor injuries", "Pharmacy"], blurb: "Sample listing. Verify location and contact details before visiting." },
  { id: "c17", code: "KW", name: "Kandivali Community Clinic (Sample)", area: "Kandivali West", address: "SV Road, Kandivali West, Mumbai", lat: 19.2043, lng: 72.8511, rating: 4.4, reviews: 91, open: [540, 1200], urgent: false, baseWait: 17, phone: "+91 22 5550 0236", services: ["General consultation", "Orthopedics", "Physiotherapy"], blurb: "Sample listing. Verify location and contact details before visiting." },
  { id: "c18", code: "DE", name: "Dahisar Health Point (Sample)", area: "Dahisar East", address: "Anand Nagar, Dahisar East, Mumbai", lat: 19.2512, lng: 72.8643, rating: 4.3, reviews: 67, open: [480, 1200], urgent: false, baseWait: 19, phone: "+91 22 5550 0237", services: ["General consultation", "Pediatrics", "Blood tests"], blurb: "Sample listing. Verify location and contact details before visiting." },
  { id: "c19", code: "VP", name: "Vile Parle Care Clinic (Sample)", area: "Vile Parle East", address: "Mahant Road, Vile Parle East, Mumbai", lat: 19.1, lng: 72.85, rating: 4.5, reviews: 113, open: [540, 1200], urgent: false, baseWait: 14, phone: "+91 22 5550 0238", services: ["General consultation", "Gynecology", "Dental care"], blurb: "Sample listing. Verify location and contact details before visiting." },
];

const d = (
  id: string, name: string, specialty: string, clinicId: string, rating: number, reviews: number,
  exp: number, fee: number, shift: [number, number], languages: string[], about: string, treats: string[], avgConsult = 12,
): Doctor => ({ id, name, specialty, clinicId, rating, reviews, exp, fee, shift, avgConsult, languages, about, treats });

export let DOCTORS: Doctor[] = [
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
  d("d20", "Dr. Nisha Rao", "General Physician", "c12", 4.5, 96, 8, 500, [540, 1140], ["English", "Hindi", "Marathi"], "Sample provider profile for the Goregaon West demo clinic.", ["fever", "diabetes", "blood pressure"]),
  d("d21", "Dr. Kabir Shah", "Dermatologist", "c13", 4.4, 78, 7, 700, [600, 1140], ["English", "Hindi", "Marathi"], "Sample provider profile for the Malad West demo clinic.", ["acne", "skin rash", "eczema"]),
  d("d22", "Dr. Isha Menon", "General Physician", "c14", 4.3, 63, 6, 450, [480, 1200], ["English", "Hindi", "Malayalam"], "Sample provider profile for the Malad East demo clinic.", ["fever", "infection", "minor injury"]),
  d("d23", "Dr. Rohan Desai", "Pediatrician", "c15", 4.6, 101, 9, 600, [540, 1140], ["English", "Hindi", "Gujarati"], "Sample provider profile for the Borivali West demo clinic.", ["child fever", "vaccination", "cough"]),
  d("d24", "Dr. Sana Khan", "General Physician", "c16", 4.2, 54, 5, 500, [0, 1440], ["English", "Hindi", "Urdu"], "Sample provider profile for the Borivali East demo clinic.", ["fever", "minor injury", "dehydration"]),
  d("d25", "Dr. Mihir Kulkarni", "Orthopedic", "c17", 4.4, 70, 8, 700, [600, 1200], ["English", "Hindi", "Marathi"], "Sample provider profile for the Kandivali West demo clinic.", ["joint pain", "sprain", "back pain"]),
  d("d26", "Dr. Anjali Patil", "General Physician", "c18", 4.3, 49, 6, 450, [540, 1140], ["English", "Hindi", "Marathi"], "Sample provider profile for the Dahisar East demo clinic.", ["fever", "infection", "blood tests"]),
  d("d27", "Dr. Neil D'Souza", "Gynecologist", "c19", 4.5, 88, 10, 800, [600, 1140], ["English", "Hindi", "Marathi"], "Sample provider profile for the Vile Parle East demo clinic.", ["women's health", "pregnancy", "PCOS"]),
];

export const HOSPITALS: Hospital[] = [
  { id: "h1", name: "Lifeline Multispecialty Hospital", address: "Link Road, Andheri West", lat: 19.135, lng: 72.826, er: true, trauma: "Trauma care, 24x7 ICU", phone: "022 5550 0101", note: "Emergency department open 24 hours", beds: "Beds available" },
  { id: "h2", name: "St. Anthony Emergency Hospital", address: "SV Road, Vile Parle West", lat: 19.1, lng: 72.838, er: true, trauma: "Cardiac and stroke ready", phone: "022 5550 0102", note: "Cath lab on call", beds: "Limited beds" },
  { id: "h3", name: "Metro General Hospital", address: "Western Express Highway, Andheri East", lat: 19.119, lng: 72.875, er: true, trauma: "Level 1 trauma centre", phone: "022 5550 0103", note: "Major accident and burns unit", beds: "Beds available" },
  { id: "h4", name: "Harmony Heart & Critical Care", address: "Hill Road, Bandra West", lat: 19.059, lng: 72.829, er: true, trauma: "Cardiac emergency", phone: "022 5550 0104", note: "24x7 cardiac emergency", beds: "Limited beds" },
  { id: "h5", name: "Government Civil Hospital", address: "Jogeshwari East", lat: 19.137, lng: 72.86, er: true, trauma: "Free emergency care", phone: "022 5550 0105", note: "Casualty ward open 24 hours", beds: "Limited beds" },
];

export const EMERGENCY_CONTACTS = [
  { label: "Ambulance (national)", number: "108", note: "Free, 24x7. Availability varies by state." },
  { label: "All emergencies (police, fire, medical)", number: "112", note: "Single emergency number across India." },
  { label: "Mother and child ambulance", number: "102", note: "Free transport for pregnancy and newborn care in many states." },
  { label: "Private ambulance (sample)", number: "02255500199", display: "022 5550 0199", note: "Sample number. Replace with a verified provider." },
  { label: "Mental health support (Tele-MANAS)", number: "14416", note: "Free, 24x7 counselling helpline." },
];

export function replaceCatalog(clinics: Clinic[], doctors: Doctor[]) {
  CLINICS = clinics;
  DOCTORS = doctors;
}

export const getClinic = (id: string) => CLINICS.find((c) => c.id === id)!;
export const getDoctor = (id: string) => DOCTORS.find((x) => x.id === id)!;
export const doctorsOf = (clinicId: string) => DOCTORS.filter((x) => x.clinicId === clinicId);
export const clinicSpecialties = (clinicId: string) => Array.from(new Set(doctorsOf(clinicId).map((x) => x.specialty)));
export const DEMO_NAMES = ["Anita Kulkarni", "Sohail Khan", "Ritu Verma", "Dev Patel", "Meenal Joshi", "Farhan Ali", "Kavya Reddy", "Nikhil Rao", "Sara Dsouza", "Imran Sayed", "Pooja Shetty", "Yash Mehra"];
