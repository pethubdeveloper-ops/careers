/**
 * Starting data for the portal.
 *
 * Clients, pets, transactions and appointments start empty so Clients & Pets
 * and Transaction History begin clean and fill up with real records. Branches,
 * branch veterinarians, staff accounts and promotions are kept because they are
 * real Pet Hub reference data, not samples.
 *
 * This stands in for a real database. When a backend lands, delete this file
 * and have `src/api/` fetch from the server instead — nothing else should need
 * to change, because every consumer goes through the api layer.
 *
 * Changing anything here means browsers still hold the previous values in
 * localStorage, so bump DATA_VERSION in `src/api/persist.ts` to clear them.
 */
import type {
  Account,
  Admin,
  Appointment,
  Branch,
  BranchVets,
  Client,
  Pet,
  Promotion,
  Transaction,
} from "@/types";

export const BRANCHES: Branch[] = [
  { id:1, name:"Pet Hub Veterinary Clinic — Bacoor",        email:"pethub.bacoor@gmail.com",        phone:"+63 917 706 9201", location:"0353 Molino Rd, Bacoor, Philippines",                           lat:14.3928,  lng:120.9779 },
  { id:2, name:"Pet Hub Veterinary Clinic — Baliwag",       email:"pethubbaliwag@gmail.com",         phone:"+63 917 117 9440", location:"AC Building, Benigno Aquino St., Baliwag, Bulacan, Philippines", lat:14.9675,  lng:120.8960 },
  { id:3, name:"Pet Hub Veterinary Clinic — General Trias", email:"pethub.gentrias@gmail.com",       phone:"+63 917 700 9228", location:"Lot 1706-A-1-A, Brgy Navarro, General Trias, 4107 Cavite",       lat:14.3856,  lng:120.8999 },
  { id:4, name:"Pet Hub Veterinary Clinic — Las Piñas",     email:"pethublaspinas@gmail.com",        phone:"+63 917 116 4171", location:"Unit 5, Sahar Building, CAA Road, Las Piñas, Philippines",        lat:14.4486,  lng:120.9939 },
  { id:5, name:"Pet Hub Veterinary Clinic — Mambog",        email:"pethub.bacoorannex@gmail.com",    phone:"+63 917 169 1753", location:"CWFX+MQM, Palico Daanan, Bacoor, Cavite",                         lat:14.4241,  lng:120.9498 },
  { id:6, name:"Pet Hub Veterinary Clinic — Parañaque",     email:"pethubvetclinic@gmail.com",       phone:"+63 917 558 9595", location:"Unit C & D, Morgana Bldg, Multinational Village, Parañaque, 1708", lat:14.4920,  lng:121.0027 },
  { id:7, name:"Pet Hub Veterinary Hospital — Angeles",     email:"pethubangeles@gmail.com",         phone:"+63 917 129 1740", location:"Lot 7A Pandan Rd., Magalang Ave., Angeles City, Pampanga 2009",   lat:15.1463,  lng:120.5996 },
  { id:8, name:"Pet Hub Veterinary Hospital — Bataan",      email:"pethubbataan@gmail.com",          phone:"+63 917 566 2022", location:"29 JP Rizal St, City of Balanga, 2100 Bataan, Philippines",        lat:14.6810,  lng:120.5439 },
];

export const ACCOUNTS: Account[] = [
  { id:1, branch:"Pet Hub Veterinary Clinic — Bacoor",        email:"pethubbacoor@gmail.com",        accountName:"PET HUB BACOOR",         status:"Active", dateCreated:"2025-11-04" },
  { id:2, branch:"Pet Hub Veterinary Clinic — Baliwag",       email:"pethubbaliwag@gmail.com",        accountName:"PET HUB BALIWAG",        status:"Active", dateCreated:"2025-07-20" },
  { id:3, branch:"Pet Hub Veterinary Clinic — General Trias", email:"pethubgeneraltrias@gmail.com",   accountName:"PET HUB GENERAL TRIAS",  status:"Active", dateCreated:"2026-01-15" },
  { id:4, branch:"Pet Hub Veterinary Clinic — Las Piñas",     email:"pethublaspinas@gmail.com",       accountName:"PET HUB LAS PINAS",      status:"Active", dateCreated:"2025-06-10" },
  { id:5, branch:"Pet Hub Veterinary Clinic — Mambog",        email:"pethub.bacoorannex@gmail.com",   accountName:"PET HUB MAMBOG",         status:"Active", dateCreated:"2025-07-28" },
  { id:6, branch:"Pet Hub Veterinary Clinic — Parañaque",     email:"pethubparanaque@gmail.com",      accountName:"PET HUB PARAÑAQUE",      status:"Active", dateCreated:"2026-02-09" },
  { id:7, branch:"Pet Hub Veterinary Hospital — Angeles",     email:"pethubangeles@gmail.com",        accountName:"PET HUB ANGELES",        status:"Active", dateCreated:"2025-05-25" },
  { id:8, branch:"Pet Hub Veterinary Hospital — Bataan",      email:"pethubbataan@gmail.com",         accountName:"PET HUB BATAAN",         status:"Inactive", dateCreated:"2025-12-01" },
];

/** Portal staff who can sign in. Clients are not admins. */
export const ADMINS: Admin[] = [
  { email:"admin@pethub.ph",            name:"Jeremiah Munoz",   role:"Administrator" },
  { email:"pethubangeles@gmail.com",    name:"PET HUB ANGELES",  role:"Branch Manager" },
  { email:"pethubbacoor@gmail.com",     name:"PET HUB BACOOR",   role:"Branch Manager" },
  { email:"pethubbaliwag@gmail.com",    name:"PET HUB BALIWAG",  role:"Branch Manager" },
];

export const CLIENTS: Client[] = [
];

export const PETS: Pet[] = [
];

export const PROMOTIONS: Promotion[] = [
  { id:1, title:"Big Pet Hub Sale — 20% Off Grooming",   details:"Enjoy 20% off all grooming packages this month. Valid at all branches until July 31, 2026.", status:"Active",   sendings:0, logs:[] },
  { id:2, title:"Dental Care Month",                       details:"Free dental check-up with any consultation. Book before the slots run out!", status:"Active",   sendings:0, logs:[] },
  { id:3, title:"Free Grooming Session",                   details:"Collect 50 loyalty points and redeem a complimentary basic grooming session.", status:"Active",   sendings:0, logs:[] },
  { id:4, title:"Anti-Rabies Vaccination Drive",           details:"Discounted anti-rabies shots every Saturday of July. Walk-ins welcome.", status:"Active",   sendings:0, logs:[] },
  { id:5, title:"Senior Pet Wellness Package",             details:"Complete bloodwork + physical exam bundle for pets 7 years and older.", status:"Inactive", sendings:0, logs:[] },
  { id:6, title:"New Member Welcome Bonus",                details:"Sign up for a loyalty card this month and get 10 bonus points instantly.", status:"Active",   sendings:0, logs:[] },
];

export const SERVICES = ["Consultation","Vaccination","Grooming","Deworming","Dental Cleaning","Surgery","Laboratory / Bloodwork","Confinement","Ultrasound","Check-up"];
export const VETS = ["Dr. Ramirez","Dr. Cordova","Dr. Bautista","Dr. Lim","Dr. Tan","Dr. Alonzo"];

/** Veterinarians per branch. */
export const BRANCH_VETS: BranchVets = {
  "Pet Hub Veterinary Clinic — Bacoor":        ["Dr. Grace Mary Fogata","Dr. Ian Carlo Antonio"],
  "Pet Hub Veterinary Clinic — Baliwag":       ["Dr. Alonzo","Dr. Paolo Santiago"],
  "Pet Hub Veterinary Clinic — General Trias": ["Dr. Alonzo","Dr. Rica Fernandez"],
  "Pet Hub Veterinary Clinic — Las Piñas":     ["Dr. Tan","Dr. Cordova"],
  "Pet Hub Veterinary Clinic — Mambog":        ["Dr. Bautista","Dr. Leo Manalo"],
  "Pet Hub Veterinary Clinic — Parañaque":     ["Dr. Tan","Dr. Ana Villareal"],
  "Pet Hub Veterinary Hospital — Angeles":     ["Dr. Ramirez","Dr. Cordova","Dr. Celia Roque"],
  "Pet Hub Veterinary Hospital — Bataan":      ["Dr. Lim","Dr. Ben Aguilar"],
};

export const APPOINTMENTS: Appointment[] = [
];

export const SEED_TRANSACTIONS: Transaction[] = [
];
