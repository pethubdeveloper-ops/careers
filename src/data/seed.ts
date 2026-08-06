/**
 * Seed data lifted verbatim from the design prototype.
 *
 * This stands in for a real database. When a backend lands, delete this file
 * and have `src/api/` fetch from the server instead — nothing else should need
 * to change, because every consumer goes through the api layer.
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
  { id:1,  branch:"Pet Hub Veterinary Hospital — Angeles",     email:"janjan00x@gmail.com",              contact:"0918 771 8368", name:"Jan Enrico Resurreccion", status:"Active" },
  { id:2,  branch:"Pet Hub Veterinary Hospital — Angeles",     email:"sofia.navarro@gmail.com",          contact:"0917 220 4471", name:"Sofia Navarro",           status:"Active" },
  { id:3,  branch:"Pet Hub Veterinary Clinic — Bacoor",        email:"maria.santos@gmail.com",           contact:"0916 553 1180", name:"Maria Santos",            status:"Active" },
  { id:4,  branch:"Pet Hub Veterinary Clinic — Bacoor",        email:"josefina.reyes@yahoo.com",         contact:"0905 118 7742", name:"Josefina Reyes",          status:"Active" },
  { id:5,  branch:"Pet Hub Veterinary Clinic — Baliwag",       email:"ramon.villanueva@gmail.com",       contact:"0928 447 9021", name:"Ramon Villanueva",        status:"Active" },
  { id:6,  branch:"Pet Hub Veterinary Clinic — General Trias", email:"angelica.delacruz@gmail.com",      contact:"0917 902 3345", name:"Angelica dela Cruz",      status:"Active" },
  { id:7,  branch:"Pet Hub Veterinary Clinic — Las Piñas",     email:"christian.bautista@gmail.com",     contact:"0999 330 5567", name:"Christian Bautista",      status:"Active" },
  { id:8,  branch:"Pet Hub Veterinary Clinic — Las Piñas",     email:"patricia.gonzales@outlook.com",    contact:"0926 771 4408", name:"Patricia Gonzales",       status:"Active" },
  { id:9,  branch:"Pet Hub Veterinary Clinic — Mambog",        email:"eduardo.ramos@gmail.com",          contact:"0908 665 2213", name:"Eduardo Ramos",           status:"Active" },
  { id:10, branch:"Pet Hub Veterinary Clinic — Parañaque",     email:"katrina.mercado@gmail.com",        contact:"0917 448 9902", name:"Katrina Mercado",         status:"Active" },
  { id:11, branch:"Pet Hub Veterinary Clinic — Parañaque",     email:"miguel.torres@gmail.com",          contact:"0921 550 7781", name:"Miguel Torres",           status:"Inactive" },
  { id:12, branch:"Pet Hub Veterinary Hospital — Bataan",      email:"liza.aquino@gmail.com",            contact:"0918 223 6650", name:"Liza Aquino",             status:"Active" },
  { id:13, branch:"Pet Hub Veterinary Clinic — Bacoor",        email:"nathaniel.cruz@gmail.com",         contact:"0995 112 8834", name:"Nathaniel Cruz",          status:"Active" },
  { id:14, branch:"Pet Hub Veterinary Clinic — General Trias", email:"bianca.domingo@yahoo.com",         contact:"0917 668 1902", name:"Bianca Domingo",          status:"Active" },
  { id:15, branch:"Pet Hub Veterinary Clinic — Baliwag",       email:"diego.salvador@gmail.com",         contact:"0926 003 4419", name:"Diego Salvador",          status:"Inactive" },
  { id:16, branch:"Pet Hub Veterinary Hospital — Angeles",     email:"pethub.marketingdepartment@gmail.com", contact:"0917 100 2020", name:"Grace Villamor",       status:"Active" },
];

export const PETS: Pet[] = [
  { id:1,  clientId:1,  name:"Koohii",   membershipNo:"PH-0001", photo:null, species:"Dog",    breed:"Shiba Inu",        gender:"Male",   age:"3", weight:"8 kg",   color:"Brown",       birthday:"2023-01-15", notes:"Allergic to chicken",     hasCard:true,  branch:"Pet Hub Veterinary Hospital — Angeles",     email:"janjan00x@gmail.com",          membershipDate:"05/26/2025", printStatus:"Printed" },
  { id:2,  clientId:1,  name:"Jupi",     membershipNo:"PH-0002", photo:null, species:"Cat",    breed:"Persian",          gender:"Female", age:"2", weight:"4 kg",   color:"White",       birthday:"2024-03-10", notes:"",                        hasCard:true,  branch:"Pet Hub Veterinary Hospital — Angeles",     email:"janjan00x@gmail.com",          membershipDate:"05/26/2025", printStatus:"Printed" },
  { id:3,  clientId:2,  name:"Bella",    membershipNo:"PH-0003", photo:null, species:"Dog",    breed:"Golden Retriever", gender:"Female", age:"4", weight:"27 kg",  color:"Golden",      birthday:"2022-06-20", notes:"Hip dysplasia — monitor", hasCard:true,  branch:"Pet Hub Veterinary Hospital — Angeles",     email:"sofia.navarro@gmail.com",      membershipDate:"01/12/2026", printStatus:"Pending" },
  { id:4,  clientId:3,  name:"Max",      membershipNo:"PH-0004", photo:null, species:"Dog",    breed:"Aspin",            gender:"Male",   age:"2", weight:"12 kg",  color:"Brown & White", birthday:"2024-02-01", notes:"",                        hasCard:true,  branch:"Pet Hub Veterinary Clinic — Bacoor",        email:"maria.santos@gmail.com",       membershipDate:"11/03/2025", printStatus:"Printed" },
  { id:5,  clientId:3,  name:"Luna",     membershipNo:"PH-0005", photo:null, species:"Cat",    breed:"Siamese",          gender:"Female", age:"3", weight:"3.6 kg", color:"Cream",       birthday:"2023-05-14", notes:"Indoor only",             hasCard:false, branch:"Pet Hub Veterinary Clinic — Bacoor",        email:"maria.santos@gmail.com",       membershipDate:"11/03/2025", printStatus:"N/A" },
  { id:6,  clientId:4,  name:"Chico",    membershipNo:"PH-0006", photo:null, species:"Dog",    breed:"Chihuahua",        gender:"Male",   age:"5", weight:"2.4 kg", color:"Tan",         birthday:"2021-09-09", notes:"Dental cleaning due",     hasCard:true,  branch:"Pet Hub Veterinary Clinic — Bacoor",        email:"josefina.reyes@yahoo.com",     membershipDate:"08/22/2025", printStatus:"Printed" },
  { id:7,  clientId:5,  name:"Rocky",    membershipNo:"PH-0007", photo:null, species:"Dog",    breed:"German Shepherd",  gender:"Male",   age:"4", weight:"34 kg",  color:"Black & Tan", birthday:"2022-04-30", notes:"",                        hasCard:true,  branch:"Pet Hub Veterinary Clinic — Baliwag",       email:"ramon.villanueva@gmail.com",   membershipDate:"02/18/2026", printStatus:"Pending" },
  { id:8,  clientId:6,  name:"Milo",     membershipNo:"PH-0008", photo:null, species:"Cat",    breed:"Domestic Shorthair",gender:"Male",  age:"1", weight:"3.1 kg", color:"Orange",      birthday:"2025-01-20", notes:"",                        hasCard:true,  branch:"Pet Hub Veterinary Clinic — General Trias", email:"angelica.delacruz@gmail.com",  membershipDate:"03/01/2026", printStatus:"Printed" },
  { id:9,  clientId:6,  name:"Coco",     membershipNo:"PH-0009", photo:null, species:"Bird",   breed:"African Grey",     gender:"Female", age:"6", weight:"0.4 kg", color:"Grey",        birthday:"2020-07-11", notes:"Wing clip requested",     hasCard:false, branch:"Pet Hub Veterinary Clinic — General Trias", email:"angelica.delacruz@gmail.com",  membershipDate:"03/01/2026", printStatus:"N/A" },
  { id:10, clientId:7,  name:"Buddy",    membershipNo:"PH-0010", photo:null, species:"Dog",    breed:"Labrador",         gender:"Male",   age:"3", weight:"30 kg",  color:"Chocolate",   birthday:"2023-03-03", notes:"",                        hasCard:true,  branch:"Pet Hub Veterinary Clinic — Las Piñas",     email:"christian.bautista@gmail.com", membershipDate:"12/15/2025", printStatus:"Printed" },
  { id:11, clientId:7,  name:"Nala",     membershipNo:"PH-0011", photo:null, species:"Cat",    breed:"Ragdoll",          gender:"Female", age:"2", weight:"4.5 kg", color:"Seal Point",  birthday:"2024-08-08", notes:"",                        hasCard:true,  branch:"Pet Hub Veterinary Clinic — Las Piñas",     email:"christian.bautista@gmail.com", membershipDate:"12/15/2025", printStatus:"Pending" },
  { id:12, clientId:8,  name:"Simba",    membershipNo:"PH-0012", photo:null, species:"Dog",    breed:"Pomeranian",       gender:"Male",   age:"4", weight:"3.2 kg", color:"Orange",      birthday:"2022-11-25", notes:"Grooming monthly",        hasCard:true,  branch:"Pet Hub Veterinary Clinic — Las Piñas",     email:"patricia.gonzales@outlook.com",membershipDate:"09/30/2025", printStatus:"Printed" },
  { id:13, clientId:9,  name:"Daisy",    membershipNo:"PH-0013", photo:null, species:"Dog",    breed:"Beagle",           gender:"Female", age:"5", weight:"11 kg",  color:"Tricolor",    birthday:"2021-02-14", notes:"",                        hasCard:true,  branch:"Pet Hub Veterinary Clinic — Mambog",        email:"eduardo.ramos@gmail.com",      membershipDate:"07/07/2025", printStatus:"Printed" },
  { id:14, clientId:9,  name:"Whiskers", membershipNo:"PH-0014", photo:null, species:"Cat",    breed:"Tabby",            gender:"Male",   age:"3", weight:"4.1 kg", color:"Grey Tabby",  birthday:"2023-06-18", notes:"",                        hasCard:false, branch:"Pet Hub Veterinary Clinic — Mambog",        email:"eduardo.ramos@gmail.com",      membershipDate:"07/07/2025", printStatus:"N/A" },
  { id:15, clientId:10, name:"Bruno",    membershipNo:"PH-0015", photo:null, species:"Dog",    breed:"Rottweiler",       gender:"Male",   age:"3", weight:"48 kg",  color:"Black & Tan", birthday:"2023-09-01", notes:"Behavioral training",     hasCard:true,  branch:"Pet Hub Veterinary Clinic — Parañaque",     email:"katrina.mercado@gmail.com",    membershipDate:"04/05/2026", printStatus:"Pending" },
  { id:16, clientId:10, name:"Mochi",    membershipNo:"PH-0016", photo:null, species:"Rabbit", breed:"Holland Lop",      gender:"Female", age:"2", weight:"1.6 kg", color:"White & Grey",birthday:"2024-04-22", notes:"",                        hasCard:true,  branch:"Pet Hub Veterinary Clinic — Parañaque",     email:"katrina.mercado@gmail.com",    membershipDate:"04/05/2026", printStatus:"Printed" },
  { id:17, clientId:11, name:"Tiger",    membershipNo:"PH-0017", photo:null, species:"Cat",    breed:"Bengal",           gender:"Male",   age:"4", weight:"5.2 kg", color:"Spotted",     birthday:"2022-01-05", notes:"",                        hasCard:false, branch:"Pet Hub Veterinary Clinic — Parañaque",     email:"miguel.torres@gmail.com",      membershipDate:"06/10/2025", printStatus:"N/A" },
  { id:18, clientId:12, name:"Rex",      membershipNo:"PH-0018", photo:null, species:"Dog",    breed:"Dalmatian",        gender:"Male",   age:"2", weight:"25 kg",  color:"Spotted",     birthday:"2024-05-19", notes:"",                        hasCard:true,  branch:"Pet Hub Veterinary Hospital — Bataan",      email:"liza.aquino@gmail.com",        membershipDate:"01/28/2026", printStatus:"Printed" },
  { id:19, clientId:12, name:"Pearl",    membershipNo:"PH-0019", photo:null, species:"Cat",    breed:"Persian",          gender:"Female", age:"6", weight:"4.3 kg", color:"White",       birthday:"2020-12-12", notes:"Senior — annual bloodwork",hasCard:true, branch:"Pet Hub Veterinary Hospital — Bataan",      email:"liza.aquino@gmail.com",        membershipDate:"01/28/2026", printStatus:"Pending" },
  { id:20, clientId:13, name:"Bantay",   membershipNo:"PH-0020", photo:null, species:"Dog",    breed:"Aspin",            gender:"Male",   age:"7", weight:"15 kg",  color:"Brown",       birthday:"2019-03-27", notes:"Arthritis management",    hasCard:true,  branch:"Pet Hub Veterinary Clinic — Bacoor",        email:"nathaniel.cruz@gmail.com",     membershipDate:"10/19/2025", printStatus:"Printed" },
  { id:21, clientId:14, name:"Ginger",   membershipNo:"PH-0021", photo:null, species:"Cat",    breed:"Munchkin",         gender:"Female", age:"1", weight:"2.8 kg", color:"Ginger",      birthday:"2025-02-28", notes:"",                        hasCard:true,  branch:"Pet Hub Veterinary Clinic — General Trias", email:"bianca.domingo@yahoo.com",     membershipDate:"03/22/2026", printStatus:"Pending" },
  { id:22, clientId:14, name:"Peanut",   membershipNo:"PH-0022", photo:null, species:"Dog",    breed:"Dachshund",        gender:"Male",   age:"3", weight:"6 kg",   color:"Red",         birthday:"2023-08-15", notes:"",                        hasCard:true,  branch:"Pet Hub Veterinary Clinic — General Trias", email:"bianca.domingo@yahoo.com",     membershipDate:"03/22/2026", printStatus:"Printed" },
  { id:23, clientId:15, name:"Shadow",   membershipNo:"PH-0023", photo:null, species:"Dog",    breed:"Belgian Malinois", gender:"Male",   age:"4", weight:"28 kg",  color:"Fawn",        birthday:"2022-07-07", notes:"",                        hasCard:false, branch:"Pet Hub Veterinary Clinic — Baliwag",       email:"diego.salvador@gmail.com",     membershipDate:"05/01/2025", printStatus:"N/A" },
  { id:24, clientId:16, name:"Snowy",    membershipNo:"PH-0024", photo:null, species:"Dog",    breed:"Samoyed",          gender:"Female", age:"2", weight:"20 kg",  color:"White",       birthday:"2024-01-11", notes:"Coat grooming",           hasCard:true,  branch:"Pet Hub Veterinary Hospital — Angeles",     email:"pethub.marketingdepartment@gmail.com", membershipDate:"02/09/2026", printStatus:"Printed" },
  { id:25, clientId:16, name:"Cleo",     membershipNo:"PH-0025", photo:null, species:"Cat",    breed:"Sphynx",           gender:"Female", age:"3", weight:"3.4 kg", color:"Pink",        birthday:"2023-10-30", notes:"Sensitive skin",          hasCard:true,  branch:"Pet Hub Veterinary Hospital — Angeles",     email:"pethub.marketingdepartment@gmail.com", membershipDate:"02/09/2026", printStatus:"Pending" },
  { id:26, clientId:2,  name:"Oreo",     membershipNo:"PH-0026", photo:null, species:"Dog",    breed:"Border Collie",    gender:"Male",   age:"1", weight:"14 kg",  color:"Black & White",birthday:"2025-04-04",notes:"",                        hasCard:true,  branch:"Pet Hub Veterinary Hospital — Angeles",     email:"sofia.navarro@gmail.com",      membershipDate:"04/12/2026", printStatus:"Printed" },
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
  { id:1,  petId:1,  clientId:1,  branch:"Pet Hub Veterinary Hospital — Angeles",     service:"Vaccination",         vet:"Dr. Ramirez", date:"2026-07-02", time:"09:30", status:"Scheduled", notes:"Annual booster" },
  { id:2,  petId:3,  clientId:2,  branch:"Pet Hub Veterinary Hospital — Angeles",     service:"Grooming",            vet:"Dr. Cordova", date:"2026-07-02", time:"11:00", status:"Scheduled", notes:"Full package" },
  { id:3,  petId:6,  clientId:4,  branch:"Pet Hub Veterinary Clinic — Bacoor",        service:"Dental Cleaning",     vet:"Dr. Grace Mary Fogata",date:"2026-07-03", time:"14:00", status:"Scheduled", notes:"" },
  { id:4,  petId:19, clientId:12, branch:"Pet Hub Veterinary Hospital — Bataan",      service:"Laboratory / Bloodwork",vet:"Dr. Lim",   date:"2026-07-04", time:"10:15", status:"Scheduled", notes:"Senior panel" },
  { id:5,  petId:15, clientId:10, branch:"Pet Hub Veterinary Clinic — Parañaque",     service:"Consultation",        vet:"Dr. Tan",     date:"2026-07-05", time:"13:30", status:"Scheduled", notes:"Behavioral follow-up" },
  { id:6,  petId:7,  clientId:5,  branch:"Pet Hub Veterinary Clinic — Baliwag",       service:"Check-up",            vet:"Dr. Alonzo",  date:"2026-07-06", time:"09:00", status:"Scheduled", notes:"" },
  { id:7,  petId:11, clientId:7,  branch:"Pet Hub Veterinary Clinic — Las Piñas",     service:"Vaccination",         vet:"Dr. Ramirez", date:"2026-07-08", time:"15:45", status:"Scheduled", notes:"" },
  { id:8,  petId:24, clientId:16, branch:"Pet Hub Veterinary Hospital — Angeles",     service:"Grooming",            vet:"Dr. Cordova", date:"2026-07-09", time:"10:30", status:"Scheduled", notes:"Coat trim" },
  { id:9,  petId:20, clientId:13, branch:"Pet Hub Veterinary Clinic — Bacoor",        service:"Consultation",        vet:"Dr. Ian Carlo Antonio",date:"2026-07-10", time:"16:00", status:"Scheduled", notes:"Arthritis review" },
  { id:10, petId:2,  clientId:1,  branch:"Pet Hub Veterinary Hospital — Angeles",     service:"Deworming",           vet:"Dr. Ramirez", date:"2026-06-28", time:"09:30", status:"Completed", notes:"" },
  { id:11, petId:4,  clientId:3,  branch:"Pet Hub Veterinary Clinic — Bacoor",        service:"Vaccination",         vet:"Dr. Grace Mary Fogata",date:"2026-06-27", time:"11:15", status:"Completed", notes:"5-in-1" },
  { id:12, petId:10, clientId:7,  branch:"Pet Hub Veterinary Clinic — Las Piñas",     service:"Surgery",             vet:"Dr. Tan",     date:"2026-06-25", time:"08:00", status:"Completed", notes:"Neutering" },
  { id:13, petId:12, clientId:8,  branch:"Pet Hub Veterinary Clinic — Las Piñas",     service:"Grooming",            vet:"Dr. Cordova", date:"2026-06-24", time:"13:00", status:"Completed", notes:"" },
  { id:14, petId:18, clientId:12, branch:"Pet Hub Veterinary Hospital — Bataan",      service:"Ultrasound",          vet:"Dr. Lim",     date:"2026-06-23", time:"14:30", status:"Completed", notes:"" },
  { id:15, petId:8,  clientId:6,  branch:"Pet Hub Veterinary Clinic — General Trias", service:"Consultation",        vet:"Dr. Alonzo",  date:"2026-06-22", time:"10:00", status:"Cancelled", notes:"Client rescheduled" },
  { id:16, petId:13, clientId:9,  branch:"Pet Hub Veterinary Clinic — Mambog",        service:"Check-up",            vet:"Dr. Bautista",date:"2026-06-20", time:"15:00", status:"No-show",   notes:"" },
  { id:17, petId:21, clientId:14, branch:"Pet Hub Veterinary Clinic — General Trias", service:"Vaccination",         vet:"Dr. Ramirez", date:"2026-07-11", time:"09:45", status:"Scheduled", notes:"First shots" },
  { id:18, petId:25, clientId:16, branch:"Pet Hub Veterinary Hospital — Angeles",     service:"Consultation",        vet:"Dr. Cordova", date:"2026-07-12", time:"11:30", status:"Scheduled", notes:"Skin condition" },
  { id:19, petId:16, clientId:10, branch:"Pet Hub Veterinary Clinic — Parañaque",     service:"Check-up",            vet:"Dr. Tan",     date:"2026-07-13", time:"14:15", status:"Scheduled", notes:"" },
  { id:20, petId:22, clientId:14, branch:"Pet Hub Veterinary Clinic — General Trias", service:"Deworming",           vet:"Dr. Alonzo",  date:"2026-07-15", time:"10:00", status:"Scheduled", notes:"" },
];

export const SEED_TRANSACTIONS: Transaction[] = [
  { id:1,  petId:1,  transactionId:"1",  amount:4800, pointsGained:16, pointsUsed:0,  transactBy:"Jeremiah Munoz",  receipt:"receipt_1.pdf",  date:"2026-04-01" },
  { id:2,  petId:1,  transactionId:"2",  amount:300,  pointsGained:1,  pointsUsed:0,  transactBy:"PET HUB ANGELES", receipt:"receipt_2.pdf",  date:"2026-05-10" },
  { id:3,  petId:1,  transactionId:"3",  amount:1515, pointsGained:5,  pointsUsed:0,  transactBy:"Jeremiah Munoz",  receipt:"receipt_3.pdf",  date:"2026-06-20" },
  { id:4,  petId:2,  transactionId:"4",  amount:2100, pointsGained:7,  pointsUsed:0,  transactBy:"PET HUB ANGELES", receipt:"receipt_4.pdf",  date:"2026-03-14" },
  { id:5,  petId:2,  transactionId:"5",  amount:900,  pointsGained:3,  pointsUsed:5,  transactBy:"Jeremiah Munoz",  receipt:"receipt_5.pdf",  date:"2026-05-28" },
  { id:6,  petId:3,  transactionId:"6",  amount:6200, pointsGained:20, pointsUsed:0,  transactBy:"Sofia Navarro",   receipt:"receipt_6.pdf",  date:"2026-02-11" },
  { id:7,  petId:3,  transactionId:"7",  amount:1800, pointsGained:6,  pointsUsed:0,  transactBy:"PET HUB ANGELES", receipt:"receipt_7.pdf",  date:"2026-06-02" },
  { id:8,  petId:4,  transactionId:"8",  amount:3300, pointsGained:11, pointsUsed:0,  transactBy:"PET HUB BACOOR",  receipt:"receipt_8.pdf",  date:"2025-12-05" },
  { id:9,  petId:4,  transactionId:"9",  amount:1200, pointsGained:4,  pointsUsed:0,  transactBy:"PET HUB BACOOR",  receipt:"receipt_9.pdf",  date:"2026-04-19" },
  { id:10, petId:6,  transactionId:"10", amount:2500, pointsGained:8,  pointsUsed:0,  transactBy:"PET HUB BACOOR",  receipt:"receipt_10.pdf", date:"2026-01-22" },
  { id:11, petId:6,  transactionId:"11", amount:600,  pointsGained:2,  pointsUsed:10, transactBy:"PET HUB BACOOR",  receipt:"receipt_11.pdf", date:"2026-05-30" },
  { id:12, petId:7,  transactionId:"12", amount:8900, pointsGained:29, pointsUsed:0,  transactBy:"PET HUB BALIWAG", receipt:"receipt_12.pdf", date:"2026-03-08" },
  { id:13, petId:8,  transactionId:"13", amount:1500, pointsGained:5,  pointsUsed:0,  transactBy:"PET HUB GENERAL TRIAS", receipt:"receipt_13.pdf", date:"2026-04-27" },
  { id:14, petId:10, transactionId:"14", amount:4200, pointsGained:14, pointsUsed:0,  transactBy:"PET HUB LAS PINAS",receipt:"receipt_14.pdf", date:"2026-02-16" },
  { id:15, petId:10, transactionId:"15", amount:2700, pointsGained:9,  pointsUsed:12, transactBy:"PET HUB LAS PINAS",receipt:"receipt_15.pdf", date:"2026-06-11" },
  { id:16, petId:11, transactionId:"16", amount:1950, pointsGained:6,  pointsUsed:0,  transactBy:"PET HUB LAS PINAS",receipt:"receipt_16.pdf", date:"2026-05-04" },
  { id:17, petId:12, transactionId:"17", amount:3600, pointsGained:12, pointsUsed:0,  transactBy:"PET HUB LAS PINAS",receipt:"receipt_17.pdf", date:"2025-11-29" },
  { id:18, petId:13, transactionId:"18", amount:2200, pointsGained:7,  pointsUsed:0,  transactBy:"PET HUB MAMBOG",  receipt:"receipt_18.pdf", date:"2026-01-09" },
  { id:19, petId:15, transactionId:"19", amount:5400, pointsGained:18, pointsUsed:0,  transactBy:"PET HUB PARAÑAQUE",receipt:"receipt_19.pdf", date:"2026-04-15" },
  { id:20, petId:15, transactionId:"20", amount:1100, pointsGained:3,  pointsUsed:0,  transactBy:"PET HUB PARAÑAQUE",receipt:"receipt_20.pdf", date:"2026-06-25" },
  { id:21, petId:16, transactionId:"21", amount:800,  pointsGained:2,  pointsUsed:0,  transactBy:"PET HUB PARAÑAQUE",receipt:"receipt_21.pdf", date:"2026-05-18" },
  { id:22, petId:18, transactionId:"22", amount:4500, pointsGained:15, pointsUsed:0,  transactBy:"PET HUB BATAAN",  receipt:"receipt_22.pdf", date:"2026-02-24" },
  { id:23, petId:19, transactionId:"23", amount:6800, pointsGained:22, pointsUsed:15, transactBy:"PET HUB BATAAN",  receipt:"receipt_23.pdf", date:"2026-03-30" },
  { id:24, petId:20, transactionId:"24", amount:1350, pointsGained:4,  pointsUsed:0,  transactBy:"PET HUB BACOOR",  receipt:"receipt_24.pdf", date:"2025-12-19" },
  { id:25, petId:21, transactionId:"25", amount:700,  pointsGained:2,  pointsUsed:0,  transactBy:"PET HUB GENERAL TRIAS", receipt:"receipt_25.pdf", date:"2026-04-08" },
  { id:26, petId:22, transactionId:"26", amount:2900, pointsGained:9,  pointsUsed:0,  transactBy:"PET HUB GENERAL TRIAS", receipt:"receipt_26.pdf", date:"2026-05-21" },
  { id:27, petId:24, transactionId:"27", amount:3100, pointsGained:10, pointsUsed:0,  transactBy:"PET HUB ANGELES", receipt:"receipt_27.pdf", date:"2026-03-17" },
  { id:28, petId:25, transactionId:"28", amount:1600, pointsGained:5,  pointsUsed:0,  transactBy:"PET HUB ANGELES", receipt:"receipt_28.pdf", date:"2026-06-14" },
  { id:29, petId:26, transactionId:"29", amount:2400, pointsGained:8,  pointsUsed:0,  transactBy:"Sofia Navarro",   receipt:"receipt_29.pdf", date:"2026-05-09" },
  { id:30, petId:1,  transactionId:"30", amount:3000, pointsGained:10, pointsUsed:8,  transactBy:"Jeremiah Munoz",  receipt:"receipt_30.pdf", date:"2026-06-28" },
  { id:31, petId:3,  transactionId:"31", amount:4100, pointsGained:13, pointsUsed:0,  transactBy:"Sofia Navarro",   receipt:"receipt_31.pdf", date:"2026-06-22" },
  { id:32, petId:7,  transactionId:"32", amount:1750, pointsGained:5,  pointsUsed:0,  transactBy:"PET HUB BALIWAG", receipt:"receipt_32.pdf", date:"2026-06-18" },
  { id:33, petId:12, transactionId:"33", amount:5200, pointsGained:17, pointsUsed:20, transactBy:"PET HUB LAS PINAS",receipt:"receipt_33.pdf", date:"2026-06-26" },
  { id:34, petId:18, transactionId:"34", amount:2050, pointsGained:6,  pointsUsed:0,  transactBy:"PET HUB BATAAN",  receipt:"receipt_34.pdf", date:"2026-06-29" },
];
