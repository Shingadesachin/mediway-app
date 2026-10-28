import { replaceCatalog, type Clinic, type Doctor } from "../data";
import { getDb } from "./db";

type ClinicRow = {
  id: string; code: string; name: string; area: string; address: string; lat: number; lng: number;
  rating: number; reviews: number; open_json: string; urgent: number; base_wait: number;
  phone: string; services_json: string; blurb: string; status: string;
};
type DoctorRow = {
  id: string; name: string; specialty: string; clinic_id: string; rating: number; reviews: number;
  exp: number; fee: number; shift_start: number; shift_end: number; avg_consult: number;
  languages_json: string; about: string; treats_json: string; status: string;
};

export function refreshCatalog() {
  const db = getDb();
  const clinics = (db.prepare("SELECT * FROM clinics WHERE status='active' ORDER BY id").all() as ClinicRow[]).map((row): Clinic => ({
    id: row.id, code: row.code, name: row.name, area: row.area, address: row.address, lat: row.lat, lng: row.lng,
    rating: row.rating, reviews: row.reviews, open: JSON.parse(row.open_json), urgent: !!row.urgent,
    baseWait: row.base_wait, phone: row.phone, services: JSON.parse(row.services_json), blurb: row.blurb, status: row.status,
  }));
  const doctors = (db.prepare("SELECT d.* FROM doctors d JOIN clinics c ON c.id=d.clinic_id WHERE d.status='active' AND c.status='active' ORDER BY d.id").all() as DoctorRow[]).map((row): Doctor => ({
    id: row.id, name: row.name, specialty: row.specialty, clinicId: row.clinic_id, rating: row.rating,
    reviews: row.reviews, exp: row.exp, fee: row.fee, shift: [row.shift_start, row.shift_end],
    avgConsult: row.avg_consult, languages: JSON.parse(row.languages_json), about: row.about,
    treats: JSON.parse(row.treats_json), status: row.status,
  }));
  replaceCatalog(clinics, doctors);
}
