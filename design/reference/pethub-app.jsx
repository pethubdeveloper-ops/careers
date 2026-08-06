// v31 — account date created and expiration
const { useState, useMemo, useRef, useEffect } = React;

/* ─── DESIGN TOKENS ──────────────────────────────────────────────────────── */
const T = {
  sidebar:   "#155f45",
  sidebarHov:"#1d7a58",
  accent:    "#1eb87f",
  accentDark:"#149a6a",
  accentLite:"#8ef0c8",
  bg:        "#2a7d5f",
  surface:   "#328b6a",
  surfaceAlt:"#2e8464",
  border:    "#47a380",
  borderMid: "#5cb896",
  text:      "#f8fffb",
  muted:     "#d3f0e4",
  subtle:    "#a5d3c1",
  danger:    "#fca5a5",
  warn:      "#fcd34d",
  info:      "#93c5fd",
};

/* ─── GOOGLE FONT INJECTION ──────────────────────────────────────────────── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
document.head.appendChild(fontLink);

// Load Leaflet map
if (!window._leafletLoaded) {
  window._leafletLoaded = true;
  const lCSS = document.createElement("link");
  lCSS.rel = "stylesheet";
  lCSS.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
  document.head.appendChild(lCSS);
  const lJS = document.createElement("script");
  lJS.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
  document.head.appendChild(lJS);
}

// Load QRCode library
if (!window._qrScriptLoaded) {
  window._qrScriptLoaded = true;
  const qrScript = document.createElement("script");
  qrScript.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
  document.head.appendChild(qrScript);
}

const BASE_STYLE = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; background: ${T.bg}; color: ${T.text}; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #26775b; border-radius: 99px; }
  input, select, textarea { font-family: inherit; }
  input::placeholder, textarea::placeholder { color: ${T.subtle}; }
  option { background: ${T.surface}; color: ${T.text}; }
  @keyframes ph-fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
  @keyframes ph-pop { 0% { transform:scale(.92); opacity:0; } 100% { transform:scale(1); opacity:1; } }
  @keyframes ph-float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-7px); } }
  main > div { animation: ph-fadeUp .35s ease both; }
  button { transition: transform .12s ease, box-shadow .15s ease, background .15s ease, opacity .15s ease; }
  button:active { transform: scale(.97); }
  tbody tr { transition: background .15s ease; }
  tbody tr:hover { background: rgba(34,197,138,.10) !important; }
  .ph-stat { transition: transform .18s ease, box-shadow .18s ease; position: relative; overflow: hidden; }
  .ph-stat:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(15,23,42,.10); }
  .ph-lift { transition: transform .18s ease, box-shadow .18s ease; }
  .ph-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(15,23,42,.09); }
  input:focus, select:focus, textarea:focus { outline: none; border-color: ${T.accent} !important; box-shadow: 0 0 0 3px ${T.accent}22; }
`;
const styleEl = document.createElement("style");
styleEl.textContent = BASE_STYLE;
document.head.appendChild(styleEl);

/* ─── SEED DATA ──────────────────────────────────────────────────────────── */
const BRANCHES = [
  { id:1, name:"Pet Hub Veterinary Clinic — Bacoor",        email:"pethub.bacoor@gmail.com",        phone:"+63 917 706 9201", location:"0353 Molino Rd, Bacoor, Philippines",                           lat:14.3928,  lng:120.9779 },
  { id:2, name:"Pet Hub Veterinary Clinic — Baliwag",       email:"pethubbaliwag@gmail.com",         phone:"+63 917 117 9440", location:"AC Building, Benigno Aquino St., Baliwag, Bulacan, Philippines", lat:14.9675,  lng:120.8960 },
  { id:3, name:"Pet Hub Veterinary Clinic — General Trias", email:"pethub.gentrias@gmail.com",       phone:"+63 917 700 9228", location:"Lot 1706-A-1-A, Brgy Navarro, General Trias, 4107 Cavite",       lat:14.3856,  lng:120.8999 },
  { id:4, name:"Pet Hub Veterinary Clinic — Las Piñas",     email:"pethublaspinas@gmail.com",        phone:"+63 917 116 4171", location:"Unit 5, Sahar Building, CAA Road, Las Piñas, Philippines",        lat:14.4486,  lng:120.9939 },
  { id:5, name:"Pet Hub Veterinary Clinic — Mambog",        email:"pethub.bacoorannex@gmail.com",    phone:"+63 917 169 1753", location:"CWFX+MQM, Palico Daanan, Bacoor, Cavite",                         lat:14.4241,  lng:120.9498 },
  { id:6, name:"Pet Hub Veterinary Clinic — Parañaque",     email:"pethubvetclinic@gmail.com",       phone:"+63 917 558 9595", location:"Unit C & D, Morgana Bldg, Multinational Village, Parañaque, 1708", lat:14.4920,  lng:121.0027 },
  { id:7, name:"Pet Hub Veterinary Hospital — Angeles",     email:"pethubangeles@gmail.com",         phone:"+63 917 129 1740", location:"Lot 7A Pandan Rd., Magalang Ave., Angeles City, Pampanga 2009",   lat:15.1463,  lng:120.5996 },
  { id:8, name:"Pet Hub Veterinary Hospital — Bataan",      email:"pethubbataan@gmail.com",          phone:"+63 917 566 2022", location:"29 JP Rizal St, City of Balanga, 2100 Bataan, Philippines",        lat:14.6810,  lng:120.5439 },
];
const ACCOUNTS = [
  { id:1, branch:"Pet Hub Veterinary Clinic — Bacoor",        email:"pethubbacoor@gmail.com",        accountName:"PET HUB BACOOR",         status:"Active", dateCreated:"2025-11-04" },
  { id:2, branch:"Pet Hub Veterinary Clinic — Baliwag",       email:"pethubbaliwag@gmail.com",        accountName:"PET HUB BALIWAG",        status:"Active", dateCreated:"2025-07-20" },
  { id:3, branch:"Pet Hub Veterinary Clinic — General Trias", email:"pethubgeneraltrias@gmail.com",   accountName:"PET HUB GENERAL TRIAS",  status:"Active", dateCreated:"2026-01-15" },
  { id:4, branch:"Pet Hub Veterinary Clinic — Las Piñas",     email:"pethublaspinas@gmail.com",       accountName:"PET HUB LAS PINAS",      status:"Active", dateCreated:"2025-06-10" },
  { id:5, branch:"Pet Hub Veterinary Clinic — Mambog",        email:"pethub.bacoorannex@gmail.com",   accountName:"PET HUB MAMBOG",         status:"Active", dateCreated:"2025-07-28" },
  { id:6, branch:"Pet Hub Veterinary Clinic — Parañaque",     email:"pethubparanaque@gmail.com",      accountName:"PET HUB PARAÑAQUE",      status:"Active", dateCreated:"2026-02-09" },
  { id:7, branch:"Pet Hub Veterinary Hospital — Angeles",     email:"pethubangeles@gmail.com",        accountName:"PET HUB ANGELES",        status:"Active", dateCreated:"2025-05-25" },
  { id:8, branch:"Pet Hub Veterinary Hospital — Bataan",      email:"pethubbataan@gmail.com",         accountName:"PET HUB BATAAN",         status:"Inactive", dateCreated:"2025-12-01" },
];
// Portal staff who can sign in (clients are NOT admins and cannot log in here)
const ADMINS = [
  { email:"admin@pethub.ph",            name:"Jeremiah Munoz",   role:"Administrator" },
  { email:"pethubangeles@gmail.com",    name:"PET HUB ANGELES",  role:"Branch Manager" },
  { email:"pethubbacoor@gmail.com",     name:"PET HUB BACOOR",   role:"Branch Manager" },
  { email:"pethubbaliwag@gmail.com",    name:"PET HUB BALIWAG",  role:"Branch Manager" },
];
const CLIENTS = [
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
const PETS = [
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
const PROMOTIONS = [
  { id:1, title:"Big Pet Hub Sale — 20% Off Grooming",   details:"Enjoy 20% off all grooming packages this month. Valid at all branches until July 31, 2026.", status:"Active",   sendings:0, logs:[] },
  { id:2, title:"Dental Care Month",                       details:"Free dental check-up with any consultation. Book before the slots run out!", status:"Active",   sendings:0, logs:[] },
  { id:3, title:"Free Grooming Session",                   details:"Collect 50 loyalty points and redeem a complimentary basic grooming session.", status:"Active",   sendings:0, logs:[] },
  { id:4, title:"Anti-Rabies Vaccination Drive",           details:"Discounted anti-rabies shots every Saturday of July. Walk-ins welcome.", status:"Active",   sendings:0, logs:[] },
  { id:5, title:"Senior Pet Wellness Package",             details:"Complete bloodwork + physical exam bundle for pets 7 years and older.", status:"Inactive", sendings:0, logs:[] },
  { id:6, title:"New Member Welcome Bonus",                details:"Sign up for a loyalty card this month and get 10 bonus points instantly.", status:"Active",   sendings:0, logs:[] },
];

const SERVICES = ["Consultation","Vaccination","Grooming","Deworming","Dental Cleaning","Surgery","Laboratory / Bloodwork","Confinement","Ultrasound","Check-up"];
const VETS = ["Dr. Ramirez","Dr. Cordova","Dr. Bautista","Dr. Lim","Dr. Tan","Dr. Alonzo"];
// Veterinarians per branch — booking shows the chosen branch's doctors
const BRANCH_VETS = {
  "Pet Hub Veterinary Clinic — Bacoor":        ["Dr. Grace Mary Fogata","Dr. Ian Carlo Antonio"],
  "Pet Hub Veterinary Clinic — Baliwag":       ["Dr. Alonzo","Dr. Paolo Santiago"],
  "Pet Hub Veterinary Clinic — General Trias": ["Dr. Alonzo","Dr. Rica Fernandez"],
  "Pet Hub Veterinary Clinic — Las Piñas":     ["Dr. Tan","Dr. Cordova"],
  "Pet Hub Veterinary Clinic — Mambog":        ["Dr. Bautista","Dr. Leo Manalo"],
  "Pet Hub Veterinary Clinic — Parañaque":     ["Dr. Tan","Dr. Ana Villareal"],
  "Pet Hub Veterinary Hospital — Angeles":     ["Dr. Ramirez","Dr. Cordova","Dr. Celia Roque"],
  "Pet Hub Veterinary Hospital — Bataan":      ["Dr. Lim","Dr. Ben Aguilar"],
};
const vetsForBranch = (branch, map)=> (map||BRANCH_VETS)[branch] || [];

// Appointments — spread across recent past + upcoming so the calendar & reminders feel real
const APPOINTMENTS = [
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

/* ─── SVG ICONS ──────────────────────────────────────────────────────────── */
const Icon = ({ d, size=16, color="currentColor", stroke=false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={stroke?"none":color}
    stroke={stroke?color:"none"} strokeWidth={stroke?2:0} strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);
const Icons = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  transaction:"M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  branch:    "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  account:   "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  clients:   "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  promo:     "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
  edit:      "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  search:    "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  plus:      "M12 4v16m8-8H4",
  check:     "M5 13l4 4L19 7",
  x:         "M6 18L18 6M6 6l12 12",
  chevronD:  "M19 9l-7 7-7-7",
  chevronR:  "M9 5l7 7-7 7",
  chevronL:  "M15 19l-7-7 7-7",
  paw:       "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z",
  camera:    "M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.899L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z",
  eye:       "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  collapse:  "M11 19l-7-7 7-7m8 14l-7-7 7-7",
  expand:    "M13 5l7 7-7 7M5 5l7 7-7 7",
  bell:      "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  calendar:  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  chart:     "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  clock:     "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  peso:      "M6 4h5.5a4 4 0 010 8H6m0 0v8m0-8V4m0 6h9M4 14h11",
  alert:     "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
};

/* ─── BASE UI COMPONENTS ─────────────────────────────────────────────────── */
const css = {
  input: {
    width:"100%", padding:"9px 12px", borderRadius:8, border:`1.5px solid ${T.border}`,
    fontSize:13.5, outline:"none", color:T.text, background:T.surface,
    transition:"border-color .15s",
  },
  btnPrimary: {
    padding:"9px 18px", borderRadius:8, border:"none", background:T.accent, color:"#fff",
    fontWeight:600, fontSize:13.5, cursor:"pointer", display:"inline-flex", alignItems:"center",
    gap:7, transition:"background .15s",
  },
  btnSecondary: {
    padding:"9px 18px", borderRadius:8, border:`1.5px solid ${T.border}`, background:T.surface,
    color:T.text, fontWeight:600, fontSize:13.5, cursor:"pointer", display:"inline-flex",
    alignItems:"center", gap:7, transition:"all .15s",
  },
  btnSmall: {
    padding:"5px 12px", borderRadius:6, border:"none", background:T.accent, color:"#fff",
    fontWeight:600, fontSize:12, cursor:"pointer", whiteSpace:"nowrap",
  },
  card: {
    background:"rgba(255,255,255,.10)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
    borderRadius:18, border:"1px solid rgba(255,255,255,.22)",
    boxShadow:"0 8px 32px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.18)", overflow:"hidden",
  },
  sectionLabel: {
    fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase",
    letterSpacing:".08em", marginBottom:16,
  },
};

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", fontSize:12.5, fontWeight:600, color:T.muted, marginBottom:6 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize:11.5, color:T.subtle, marginTop:4 }}>{hint}</p>}
    </div>
  );
}

function Modal({ title, onClose, children, width=480 }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(6,32,23,.55)",zIndex:300,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:20,backdropFilter:"blur(6px)",overflowY:"auto" }}>
      <div style={{ ...css.card, width:"100%", maxWidth:width, margin:"auto", padding:28, background:"rgba(255,255,255,.14)", boxShadow:"0 24px 70px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.22)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24 }}>
          <h3 style={{ fontSize:17,fontWeight:700,color:T.text }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:T.muted,padding:4,borderRadius:6,display:"flex",alignItems:"center" }}>
            <Icon d={Icons.x} size={18} color={T.muted} stroke />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Badge({ label, color=T.accent }) {
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:99,fontSize:12,fontWeight:600,background:`${color}18`,color }}>
      <span style={{ width:5,height:5,borderRadius:"50%",background:color,flexShrink:0 }}/>
      {label}
    </span>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return ()=>clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed",bottom:28,right:28,background:T.text,color:"#fff",padding:"12px 20px",borderRadius:10,fontSize:13.5,fontWeight:500,zIndex:999,display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 30px rgba(0,0,0,.25)",animation:"slideUp .2s ease" }}>
      <Icon d={Icons.check} size={16} color={T.accent} stroke /> {msg}
    </div>
  );
}

/* ─── TABLE COMPONENT ────────────────────────────────────────────────────── */
function DataTable({ data, columns, actions, rowsPerPage=10 }) {
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [sortKey, setSortKey]   = useState(null);
  const [sortDir, setSortDir]   = useState("asc");
  const [hovRow, setHovRow]     = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter(r => columns.some(c => String(r[c.key]||"").toLowerCase().includes(q)));
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a,b) => {
      const av = String(a[sortKey]||""), bv = String(b[sortKey]||"");
      return sortDir==="asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortKey, sortDir]);

  const pages   = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const safePage = Math.min(page, pages);
  const slice   = sorted.slice((safePage-1)*rowsPerPage, safePage*rowsPerPage);
  const from    = sorted.length ? (safePage-1)*rowsPerPage+1 : 0;
  const to      = Math.min(safePage*rowsPerPage, sorted.length);

  function toggleSort(key) {
    if (sortKey===key) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  return (
    <div>
      {/* Controls */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:12,flexWrap:"wrap" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,fontSize:13,color:T.muted }}>
          Show
          <select defaultValue={10} style={{ ...css.input,width:"auto",padding:"5px 10px",fontSize:13 }}>
            <option>10</option><option>25</option><option>50</option>
          </select>
          entries
        </div>
        <div style={{ position:"relative" }}>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
            placeholder="Search…"
            style={{ ...css.input, width:220, paddingLeft:36 }} />
          <span style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)" }}>
            <Icon d={Icons.search} size={15} color={T.subtle} stroke />
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ borderRadius:10, border:`1px solid ${T.border}`, overflow:"auto" }}>
        <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13.5 }}>
          <thead>
            <tr style={{ background:T.surfaceAlt, borderBottom:`2px solid ${T.border}` }}>
              {columns.map(c=>(
                <th key={c.key} onClick={c.sortable!==false?()=>toggleSort(c.key):undefined}
                  style={{ padding:"11px 16px",textAlign:"left",fontWeight:600,color:T.muted,fontSize:12,whiteSpace:"nowrap",userSelect:"none",cursor:c.sortable!==false?"pointer":"default",letterSpacing:".03em" }}>
                  <span style={{ display:"inline-flex",alignItems:"center",gap:4 }}>
                    {c.label}
                    {c.sortable!==false && <span style={{ color:sortKey===c.key?T.accent:T.subtle,fontSize:9 }}>
                      {sortKey===c.key ? (sortDir==="asc"?"▲":"▼") : "⇅"}
                    </span>}
                  </span>
                </th>
              ))}
              {actions && <th style={{ padding:"11px 16px",textAlign:"left",fontWeight:600,color:T.muted,fontSize:12 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {slice.length===0
              ? <tr><td colSpan={columns.length+(actions?1:0)} style={{ padding:40,textAlign:"center",color:T.subtle,fontSize:13 }}>No matching records found.</td></tr>
              : slice.map((row,i) => (
                <tr key={row.id??i}
                  onMouseEnter={()=>setHovRow(i)} onMouseLeave={()=>setHovRow(null)}
                  style={{ borderBottom:`1px solid ${T.border}`, background:hovRow===i?T.surfaceAlt:i%2===0?T.surface:T.surfaceAlt, transition:"background .1s" }}>
                  {columns.map(c=>(
                    <td key={c.key} style={{ padding:"11px 16px",color:T.text,verticalAlign:"middle" }}>
                      {c.render ? c.render(row) : <span style={{ color:c.muted?T.muted:T.text }}>{row[c.key]}</span>}
                    </td>
                  ))}
                  {actions && <td style={{ padding:"11px 16px",verticalAlign:"middle" }}>{actions(row)}</td>}
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,flexWrap:"wrap",gap:8 }}>
        <span style={{ fontSize:13,color:T.muted }}>
          Showing <strong style={{ color:T.text }}>{from}–{to}</strong> of <strong style={{ color:T.text }}>{sorted.length}</strong> entries
        </span>
        <div style={{ display:"flex",gap:4 }}>
          {[{label:"← Prev",v:safePage-1,dis:safePage<=1},{label:"Next →",v:safePage+1,dis:safePage>=pages}].map(btn=>
            !btn.dis && <button key={btn.label} onClick={()=>setPage(btn.v)} style={{ ...css.btnSecondary,padding:"5px 14px",fontSize:12.5,borderColor:T.border }}>{btn.label}</button>
          )}
          {Array.from({length:pages},(_,i)=>i+1).slice(Math.max(0,safePage-2),safePage+1).map(p=>(
            <button key={p} onClick={()=>setPage(p)} style={{ width:34,height:34,borderRadius:7,border:"none",background:p===safePage?T.accent:"transparent",color:p===safePage?"#fff":T.muted,fontWeight:p===safePage?700:500,cursor:"pointer",fontSize:13 }}>{p}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── DONUT CHART ────────────────────────────────────────────────────────── */
function DonutChart({ segments }) {
  const [hov, setHov] = useState(null);
  const r=56, cx=70, cy=70, sw=18, circ=2*Math.PI*r;
  let offset=0;
  const total = segments.reduce((s,sg)=>s+sg.value,0);
  const arcs = segments.map(sg=>{
    const pct = total ? sg.value/total : 0;
    const arc = { ...sg, pct, offset, dash:pct*circ, gap:(1-pct)*circ };
    offset += pct*circ;
    return arc;
  });

  return (
    <div style={{ display:"flex",alignItems:"center",gap:24,flexWrap:"wrap" }}>
      <div style={{ position:"relative",flexShrink:0 }}>
        <svg width={140} height={140} style={{ overflow:"visible" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border} strokeWidth={sw}/>
          {arcs.map((a,i)=>(
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={hov===i?a.hoverColor||a.color:a.color}
              strokeWidth={hov===i?sw+3:sw} strokeDasharray={`${a.dash} ${circ}`}
              strokeDashoffset={-a.offset} opacity={hov!==null&&hov!==i?.4:1}
              style={{ cursor:"pointer",transform:"rotate(-90deg)",transformOrigin:`${cx}px ${cy}px`,transition:"all .2s" }}
              onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}/>
          ))}
          <text x={cx} y={cy-8} textAnchor="middle" fontSize={11} fill={T.muted} fontFamily="Inter,sans-serif">Total</text>
          <text x={cx} y={cy+14} textAnchor="middle" fontSize={26} fontWeight={800} fill={T.text} fontFamily="Inter,sans-serif">{total}</text>
        </svg>
        {hov!==null && (
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none",textAlign:"center" }}>
          </div>
        )}
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        {arcs.map((a,i)=>(
          <div key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
            style={{ display:"flex",alignItems:"center",gap:10,cursor:"default",opacity:hov!==null&&hov!==i?.5:1,transition:"opacity .15s" }}>
            <span style={{ width:10,height:10,borderRadius:3,background:a.color,flexShrink:0 }}/>
            <span style={{ fontSize:13,color:T.muted }}>{a.label}</span>
            <span style={{ fontSize:14,fontWeight:700,color:T.text,marginLeft:4 }}>{a.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── BAR CHART (monthly trend) ──────────────────────────────────────────── */
function BarChart({ data, height=150, color=T.accent, prefix="", valueFmt }) {
  const [hov, setHov] = useState(null);
  const max = Math.max(1, ...data.map(d=>d.value));
  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:10, height, paddingTop:20 }}>
        {data.map((d,i)=>{
          const h = Math.max(3, Math.round((d.value/max)*(height-24)));
          const active = hov===i;
          return (
            <div key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-end", height:"100%", cursor:"default", position:"relative" }}>
              {active && (
                <div style={{ position:"absolute", top:-4, background:T.text, color:"#fff", fontSize:11.5, fontWeight:600, padding:"3px 8px", borderRadius:6, whiteSpace:"nowrap", zIndex:2 }}>
                  {valueFmt ? valueFmt(d.value) : `${prefix}${d.value.toLocaleString()}`}
                </div>
              )}
              <div style={{ width:"100%", maxWidth:34, height:h, borderRadius:"6px 6px 2px 2px", background:active?color:`${color}bb`, transition:"all .15s" }}/>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:10, marginTop:8 }}>
        {data.map((d,i)=>(
          <div key={i} style={{ flex:1, textAlign:"center", fontSize:11, color:T.muted, fontWeight:500 }}>{d.label}</div>
        ))}
      </div>
    </div>
  );
}

/* ─── QR CODE COMPONENT (real, scannable) ────────────────────────────────── */
function PetQRCode({ pet, size=120 }) {
  const containerRef = useRef(null);
  const qrRef = useRef(null);
  // Encode membershipNo (or fallback to id) — Transaction page looks up by either
  const value = pet?.membershipNo || String(pet?.id || "");

  useEffect(() => {
    if (!containerRef.current || !value) return;
    let cancelled = false;
    function generate() {
      if (cancelled) return;
      if (!window.QRCode) { setTimeout(generate, 200); return; }
      // Always destroy and recreate to avoid double-render bug
      if (qrRef.current) {
        try { qrRef.current.clear(); } catch(e) {}
        qrRef.current = null;
      }
      if (containerRef.current) containerRef.current.innerHTML = "";
      if (!cancelled && containerRef.current) {
        qrRef.current = new window.QRCode(containerRef.current, {
          text: value,
          width: size,
          height: size,
          colorDark: "#0f172a",
          colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.H,
        });
      }
    }
    generate();
    return () => {
      cancelled = true;
      if (qrRef.current) { try { qrRef.current.clear(); } catch(e) {} qrRef.current = null; }
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [value, size]);

  if (!pet) return null;
  return (
    <div style={{ display:"inline-block", padding:6, background:"#fff", borderRadius:8, border:"1px solid #e2e8f0" }}>
      <div ref={containerRef} style={{ width:size, height:size }}/>
    </div>
  );
}

// Small inline QR for tables (uses same component, smaller size)
function QRCode({ size=52, pet }) {
  return <PetQRCode pet={pet} size={size}/>;
}

/* ─── STAT CARD ──────────────────────────────────────────────────────────── */
function useCountUp(target) {
  const [val, setVal] = useState(target);
  const prev = useRef(null);
  useEffect(()=>{
    const str = String(target);
    const num = parseFloat(str.replace(/[^0-9.]/g,""));
    if(isNaN(num) || prev.current===str) { setVal(target); return; }
    prev.current = str;
    const prefix = str.match(/^[^0-9]*/)[0];
    const hasComma = str.includes(",") || num>=1000;
    const t0 = performance.now(), dur = 700;
    let raf;
    const tick = (t)=>{
      const p = Math.min(1,(t-t0)/dur), e = 1-Math.pow(1-p,3);
      const n = Math.round(num*e);
      setVal(prefix + (hasComma ? n.toLocaleString() : n));
      if(p<1) raf=requestAnimationFrame(tick);
    };
    raf=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf);
  },[target]);
  return val;
}

function StatCard({ label, value, iconD, accent, sublabel, onClick }) {
  const shown = useCountUp(value);
  return (
    <div className="ph-stat" onClick={onClick} style={{ ...css.card, padding:"20px 22px", borderTop:`3px solid ${accent}`, flex:1, minWidth:160, cursor:onClick?"pointer":"default" }}>
      <div style={{ position:"absolute", top:-34, right:-34, width:110, height:110, borderRadius:"50%", background:`${accent}0a`, pointerEvents:"none" }}/>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12 }}>
        <p style={{ fontSize:11.5,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:".07em",lineHeight:1.3 }}>{label}</p>
        <div style={{ width:36,height:36,borderRadius:10,background:`linear-gradient(135deg, ${accent}25, ${accent}0d)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`1px solid ${accent}25` }}>
          <Icon d={iconD} size={17} color={accent} stroke />
        </div>
      </div>
      <p style={{ fontSize:26,fontWeight:800,color:T.text,letterSpacing:"-.02em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{shown}</p>
      {sublabel && <p style={{ fontSize:12,color:T.muted,marginTop:4 }}>{sublabel}</p>}
      {onClick && <p style={{ fontSize:11,color:accent,fontWeight:700,marginTop:6 }}>View →</p>}
    </div>
  );
}

/* ─── PAGE HEADER ────────────────────────────────────────────────────────── */
function PageHeader({ title, children }) {
  return (
    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:4, height:38, borderRadius:99, background:`linear-gradient(180deg, ${T.accent}, ${T.info})`, flexShrink:0 }}/>
        <div>
          <p style={{ fontSize:11.5,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:3 }}>Management</p>
          <h1 style={{ fontSize:22,fontWeight:800,color:T.text,letterSpacing:"-.02em" }}>{title}</h1>
        </div>
      </div>
      <div style={{ display:"flex",gap:10 }}>{children}</div>
    </div>
  );
}

/* ─── DASHBOARD PAGE ─────────────────────────────────────────────────────── */
function Dashboard({ db }) {
  const { pets, setPets, clients, transactions, appointments, accounts, branches, registrations = [], user, setPage } = db;
  const [toast, setToast] = useState(null);
  const [fBranch, setFBranch] = useState("All");
  const TODAY_STR = "2026-07-01";

  // Client-based counts
  const activeClients      = clients.filter(c=>c.status==="Active").length;
  const inactiveClients    = clients.filter(c=>c.status!=="Active").length;
  // Loyalty card expiry (membership date + 1 year) — only pets with a card
  const TODAY_D = new Date(TODAY_STR);
  const cardExp = p => { if(!p.membershipDate) return null; const pr=String(p.membershipDate).split("/"); if(pr.length!==3) return null; const e=new Date(`${pr[2]}-${pr[0]}-${pr[1]}`); e.setFullYear(e.getFullYear()+1); return e; };
  const cardDays = p => { const e=cardExp(p); return e? Math.ceil((e-TODAY_D)/(1000*60*60*24)) : null; };
  const cardPets = pets.filter(p=>p.hasCard);
  const nearExpiring = cardPets.filter(p=>{ const d=cardDays(p); return d!==null && d>0 && d<=60; }).length;
  const expiredAccts = cardPets.filter(p=>{ const d=cardDays(p); return d!==null && d<=0; }).length;
  const [acctModal, setAcctModal] = useState(null); // "near" | "expired"
  const [listModal, setListModal] = useState(null); // pets|clients|withcard|nocard|active|inactive
  const clientHasCard = c => pets.some(p=>p.clientId===c.id&&p.hasCard);
  const listConfig = {
    pets:     { title:"All Pets", kind:"pet",    items: pets },
    clients:  { title:"All Clients", kind:"client", items: clients },
    withcard: { title:"Clients With Loyalty Card", kind:"client", items: clients.filter(c=>pets.some(p=>p.clientId===c.id&&p.hasCard)) },
    nocard:   { title:"Clients With Pets Missing a Card", kind:"client", items: clients.filter(c=>pets.some(p=>p.clientId===c.id&&!p.hasCard)) },
    active:   { title:"Active Clients", kind:"client", items: clients.filter(c=>c.status==="Active") },
    inactive: { title:"Inactive Clients", kind:"client", items: clients.filter(c=>c.status!=="Active") },
    approved: { title:"Approved Client Accounts", kind:"client", items: registrations.filter(r=>r.status==="Approved" && r.accountType==="Client") },
  };
  const lc = listModal ? listConfig[listModal] : null;
  const acctList = acctModal==="near"
    ? cardPets.filter(p=>{ const d=cardDays(p); return d!==null && d>0 && d<=60; })
    : acctModal==="expired"
    ? cardPets.filter(p=>{ const d=cardDays(p); return d!==null && d<=0; })
    : [];
  const clientsWithCard    = clients.filter(c=>pets.some(p=>p.clientId===c.id&&p.hasCard)).length;
  const clientsWithoutCard = clients.filter(c=>!pets.some(p=>p.clientId===c.id&&p.hasCard)).length;
  const withCard           = pets.filter(p=>p.hasCard).length;
  const withoutCard        = pets.filter(p=>!p.hasCard).length;
  const approvedClients    = (registrations||[]).filter(r=>r.status==="Approved" && r.accountType==="Client").length;
  const approvedClientRegs = (registrations||[]).filter(r=>r.status==="Approved" && r.accountType==="Client");

  // ── Analytics (respect branch filter) ──
  const inBranch = (b) => fBranch==="All" || b===fBranch;
  const fTxns = useMemo(()=>transactions.filter(t=>{
    const pet = pets.find(p=>p.id===t.petId);
    return pet && inBranch(pet.branch);
  }), [transactions, pets, fBranch]);
  const revenue      = fTxns.reduce((s,t)=>s+(t.amount||0),0);
  const pointsIssued = fTxns.reduce((s,t)=>s+(t.pointsGained||0),0);
  const pointsUsed   = fTxns.reduce((s,t)=>s+(t.pointsUsed||0),0);
  const apptUpcoming = appointments.filter(a=>a.status==="Scheduled" && a.date>=TODAY_STR && inBranch(a.branch)).length;

  // Monthly revenue trend (last 6 months up to Jul 2026)
  const MONTHS = [
    {label:"Feb", key:"2026-02"},{label:"Mar", key:"2026-03"},{label:"Apr", key:"2026-04"},
    {label:"May", key:"2026-05"},{label:"Jun", key:"2026-06"},{label:"Jul", key:"2026-07"},
  ];
  const revTrend = MONTHS.map(m=>({ label:m.label, value: fTxns.filter(t=>String(t.date).startsWith(m.key)).reduce((s,t)=>s+(t.amount||0),0) }));

  // Revenue per branch (top branches)
  const branchRevenue = useMemo(()=>{
    const map = {};
    transactions.forEach(t=>{
      const pet = pets.find(p=>p.id===t.petId);
      if(!pet) return;
      map[pet.branch] = (map[pet.branch]||0) + (t.amount||0);
    });
    return Object.entries(map).map(([branch,value])=>({ branch, value })).sort((a,b)=>b.value-a.value).slice(0,5);
  }, [transactions, pets]);
  const maxBranchRev = Math.max(1, ...branchRevenue.map(b=>b.value));

  // ── Reminders / alerts ──
  const reminders = useMemo(()=>{
    const list = [];
    // New account requests awaiting approval (super-admin only)
    const pendingRegs = registrations.filter(r=>r.status==="Pending");
    if(pendingRegs.length>0 && user?.email==="admin@pethub.ph"){
      list.push({ type:"reg", tone:"danger", title:`${pendingRegs.length} new account request${pendingRegs.length!==1?"s":""}`, sub:"Review & approve in Accounts" });
    }
    // Expiring / expired loyalty cards
    cardPets.forEach(p=>{
      const d = cardDays(p);
      if(d===null) return;
      const owner = clients.find(c=>c.id===p.clientId);
      if(d<=0) list.push({ type:"account", tone:"danger", title:`${p.name}'s loyalty card expired`, sub:`${owner?.name||""} · expired ${Math.abs(d)}d ago` });
      else if(d<=60) list.push({ type:"account", tone:"warn", title:`${p.name}'s card expiring soon`, sub:`${owner?.name||""} · ${d} day${d!==1?"s":""} left` });
    });
    // Pending card prints
    const pendingPrints = pets.filter(p=>p.printStatus==="Pending").length;
    if(pendingPrints>0) list.unshift({ type:"print", tone:"warn", title:`${pendingPrints} loyalty card${pendingPrints!==1?"s":""} to print`, sub:"Physical card printing queue" });
    return list;
  }, [accounts, appointments, pets, registrations, user]);
  const toneColor = { danger:T.danger, warn:T.warn, info:T.info, accent:T.accent };

  // Posts feed
  const [posts, setPosts]       = useState([]);
  const [postText, setPostText] = useState("");
  const [postMedia, setPostMedia] = useState([]); // [{type,url,name}]
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  function addMedia(files) {
    const newMedia = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        newMedia.push({ type: file.type.startsWith("video")?"video":"image", url: ev.target.result, name: file.name });
        if (newMedia.length === Array.from(files).length) {
          setPostMedia(prev => [...prev, ...newMedia]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function submitPost() {
    if (!postText.trim() && postMedia.length === 0) return;
    const newPost = {
      id: Date.now(),
      text: postText.trim(),
      media: [...postMedia],
      author: "Jeremiah Munoz",
      avatar: null,
      date: new Date().toLocaleString("en-PH", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }),
      likes: 0,
      liked: false,
    };
    setPosts(prev => [newPost, ...prev]);
    setPostText(""); setPostMedia([]);
    setToast("Post published!");
  }

  function toggleLike(id) {
    setPosts(prev => prev.map(p => p.id===id ? {...p, liked:!p.liked, likes:p.liked?p.likes-1:p.likes+1} : p));
  }
  function deletePost(id) { setPosts(prev => prev.filter(p => p.id!==id)); }
  function removeMedia(i) { setPostMedia(prev => prev.filter((_,j)=>j!==i)); }

  function markPrinted(id) {
    setPets(prev=>prev.map(p=>p.id===id?{...p,printStatus:"Printed"}:p));
    setToast("Card marked as printed.");
  }

  const cols = [
    { key:"branch",         label:"Branch" },
    { key:"email",          label:"Email", muted:true },
    { key:"client",         label:"Client", render:r=>clients.find(c=>c.id===r.clientId)?.name||"—" },
    { key:"name",           label:"Pet" },
    { key:"membershipDate", label:"Membership Date" },
    { key:"qr",             label:"QR Code", sortable:false, render:r=><QRCode size={52} pet={r}/> },
    { key:"printStatus",    label:"Print Status", render:r=>(
      <Badge label={r.printStatus} color={r.printStatus==="Printed"?T.accent:T.warn}/>
    )},
  ];

  return (
    <div>
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
      {lc && (
        <Modal title={lc.title} onClose={()=>setListModal(null)} width={520}>
          <p style={{ fontSize:12.5, color:T.muted, marginBottom:14 }}>{lc.items.length} {lc.kind==="pet"?"pet":"client"}{lc.items.length!==1?"s":""}</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:400, overflowY:"auto" }}>
            {lc.items.map(it=>{
              const sub = lc.kind==="pet"
                ? `${it.breed||it.species} · ${clients.find(c=>c.id===it.clientId)?.name||"—"}`
                : `${(it.branch||"").replace("Pet Hub Veterinary ","")} · ${it.email}`;
              return (
                <div key={it.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:`${T.accent}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon d={lc.kind==="pet"?Icons.paw:Icons.account} size={16} color={T.accent} stroke/></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13.5, fontWeight:700, color:T.text }}>{it.name}</p>
                    <p style={{ fontSize:11.5, color:T.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{sub}</p>
                  </div>
                  {lc.kind==="pet" && <Badge label={it.hasCard?"Has Card":"No Card"} color={it.hasCard?T.accent:T.warn}/>}
                  {lc.kind==="client" && <Badge label={it.status} color={it.status==="Active"?T.accent:T.danger}/>}
                </div>
              );
            })}
          </div>
        </Modal>
      )}
      {acctModal && (
        <Modal title={acctModal==="near"?"Near-Expiring Loyalty Cards":"Expired Loyalty Cards"} onClose={()=>setAcctModal(null)} width={520}>
          <p style={{ fontSize:12.5, color:T.muted, marginBottom:14 }}>{acctList.length} loyalty card{acctList.length!==1?"s":""} · {acctModal==="near"?"expiring within 60 days":"past expiry — renew at the branch"}</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {acctList.map(p=>{ const d=cardDays(p); const e=cardExp(p); const owner=clients.find(c=>c.id===p.clientId); return (
              <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 14px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>
                <div style={{ width:34, height:34, borderRadius:9, background:`${(acctModal==="near"?T.warn:T.danger)}1f`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon d={Icons.paw} size={16} color={acctModal==="near"?T.warn:T.danger} stroke/></div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13.5, fontWeight:700, color:T.text }}>{p.name} <span style={{ color:T.muted, fontWeight:400, fontSize:12 }}>· {p.membershipNo||""}</span></p>
                  <p style={{ fontSize:11.5, color:T.muted }}>{owner?.name||"—"} · {(p.branch||"").replace("Pet Hub Veterinary ","")}</p>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <p style={{ fontSize:12.5, fontWeight:700, color:acctModal==="near"?T.warn:T.danger }}>{d<=0?`Expired ${Math.abs(d)}d ago`:`${d}d left`}</p>
                  <p style={{ fontSize:11, color:T.muted }}>Exp. {e.toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}</p>
                </div>
              </div>
            );})}
          </div>
        </Modal>
      )}
      <PageHeader title="Dashboard">
        <select value={fBranch} onChange={e=>setFBranch(e.target.value)} style={{ ...css.input, width:"auto", padding:"9px 14px", fontSize:13, fontWeight:600 }}>
          <option value="All">All Branches</option>
          {branches.map(b=><option key={b.id} value={b.name}>{b.name.replace("Pet Hub Veterinary ","").replace("Clinic — ","").replace("Hospital — ","")}</option>)}
        </select>
      </PageHeader>

      {/* ── KPI strip ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        <StatCard label="Total Revenue"     value={`₱${revenue.toLocaleString()}`} iconD={Icons.peso}        accent={T.accent} sublabel={fBranch==="All"?"All branches":"Filtered branch"}/>
        <StatCard label="Points Issued"     value={pointsIssued.toLocaleString()}  iconD={Icons.check}       accent={T.info}   sublabel="Loyalty points earned"/>
        <StatCard label="Points Redeemed"   value={pointsUsed.toLocaleString()}    iconD={Icons.transaction} accent={T.warn}   sublabel="Points used by clients"/>
        <StatCard label="Upcoming Visits"   value={apptUpcoming}                   iconD={Icons.calendar}    accent={T.accent} sublabel="Upcoming appointments"/>
      </div>

      {/* ── Newly Approved Clients (cards to prepare) ── */}
      <div style={{ ...css.card, padding:"22px 24px", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <p style={{ ...css.sectionLabel, marginBottom:2 }}>Newly Approved Clients</p>
            <p style={{ fontSize:12.5, color:T.muted }}>New client accounts — cards to prepare.</p>
          </div>
          <span style={{ fontSize:12, fontWeight:700, color:"#fff", background:approvedClientRegs.length?T.accent:T.subtle, borderRadius:99, padding:"3px 12px" }}>{approvedClientRegs.length} approved</span>
        </div>
        {approvedClientRegs.length===0
          ? <div style={{ padding:"30px", textAlign:"center", color:T.subtle }}>No newly approved clients yet.</div>
          : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {approvedClientRegs.map(r=>{
                const rec = clients.find(c=>(c.email||"").toLowerCase()===r.email.toLowerCase());
                const theirPets = rec ? pets.filter(p=>p.clientId===rec.id) : [];
                return (
                <div key={r.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 16px", borderRadius:12, border:`1px solid ${T.accent}33`, background:`${T.accent}0d` }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:`${T.accent}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon d={Icons.account} size={19} color={T.accent} stroke/></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:700, color:T.text }}>{r.name} <span style={{ color:T.muted, fontWeight:400, fontSize:12.5 }}>· {r.email}</span></p>
                    <p style={{ fontSize:12, color:T.muted }}>{(r.branch||"").replace("Pet Hub Veterinary ","").replace("Clinic — ","").replace("Hospital — ","")}{theirPets.length?` · ${theirPets.length} pet${theirPets.length!==1?"s":""}: ${theirPets.map(p=>p.name).join(", ")}`:" · no pets yet"}</p>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:T.accentDark, background:`${T.accent}18`, borderRadius:99, padding:"4px 10px", flexShrink:0 }}>{theirPets.filter(p=>p.hasCard).length}/{theirPets.length} card{theirPets.length!==1?"s":""}</span>
                </div>
              );})}
            </div>
        }
      </div>

      {/* ── Trend chart + Reminders ── */}
      <div style={{ display:"flex", gap:16, marginBottom:16, flexWrap:"wrap", alignItems:"stretch" }}>
        <div style={{ ...css.card, padding:"22px 24px", flex:"1 1 460px", minWidth:340 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:4 }}>
            <p style={{ ...css.sectionLabel, marginBottom:0 }}>Revenue — Last 6 Months</p>
            <p style={{ fontSize:20, fontWeight:800, color:T.text }}>₱{revenue.toLocaleString()}</p>
          </div>
          <BarChart data={revTrend} prefix="₱" color={T.accent}/>
          <div style={{ borderTop:`1px solid ${T.border}`, marginTop:18, paddingTop:16 }}>
            <p style={{ ...css.sectionLabel, marginBottom:12 }}>Revenue by Branch (Top 5)</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {branchRevenue.map(b=>(
                <div key={b.branch} style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:12.5, color:T.muted, width:110, flexShrink:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{b.branch.replace("Pet Hub Veterinary ","").replace("Clinic — ","").replace("Hospital — ","")}</span>
                  <div style={{ flex:1, height:8, borderRadius:99, background:T.bg, overflow:"hidden" }}>
                    <div style={{ width:`${Math.round((b.value/maxBranchRev)*100)}%`, height:"100%", borderRadius:99, background:T.accent }}/>
                  </div>
                  <span style={{ fontSize:12.5, fontWeight:700, color:T.text, width:70, textAlign:"right", flexShrink:0 }}>₱{b.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ ...css.card, padding:"22px 24px", flex:"1 1 320px", minWidth:280, display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <p style={{ ...css.sectionLabel, marginBottom:0 }}>Reminders & Alerts</p>
            <span style={{ fontSize:11, fontWeight:700, color:"#fff", background:T.danger, borderRadius:99, padding:"2px 9px" }}>{reminders.length}</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10, overflowY:"auto", maxHeight:340 }}>
            {reminders.length===0
              ? <p style={{ fontSize:13, color:T.subtle, padding:"20px 0", textAlign:"center" }}>All caught up — no alerts.</p>
              : reminders.map((r,i)=>(
                <div key={i} style={{ display:"flex", gap:11, alignItems:"flex-start", padding:"11px 13px", borderRadius:10, background:`${toneColor[r.tone]}0d`, border:`1px solid ${toneColor[r.tone]}22` }}>
                  <span style={{ width:30, height:30, borderRadius:8, background:`${toneColor[r.tone]}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon d={r.type==="appt"?Icons.calendar:r.type==="print"?Icons.transaction:r.type==="reg"?Icons.account:Icons.alert} size={15} color={toneColor[r.tone]} stroke/>
                  </span>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:T.text, lineHeight:1.3 }}>{r.title}</p>
                    <p style={{ fontSize:11.5, color:T.muted, marginTop:2 }}>{r.sub}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display:"flex", gap:16, marginBottom:20, flexWrap:"wrap" }}>
        <div style={{ ...css.card, padding:"22px 24px", flex:"0 0 auto" }}>
          <p style={css.sectionLabel}>Loyalty Card Overview</p>
          <DonutChart segments={[
            { label:"With Loyalty Card",    value:clientsWithCard,    color:T.accent },
            { label:"Without Loyalty Card", value:clientsWithoutCard, color:"#93c5fd" },
          ]}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, flex:1, minWidth:280, alignContent:"start" }}>
          <StatCard label="Total Pets"           value={pets.length}         iconD={Icons.paw}     accent={T.accent} sublabel="All registered pets" onClick={()=>setListModal("pets")}/>
          <StatCard label="Total Clients"        value={clients.length}      iconD={Icons.clients} accent={T.info}   sublabel="Registered clients" onClick={()=>setListModal("clients")}/>
          <StatCard label="Approved Accounts"    value={approvedClients}     iconD={Icons.check}   accent={T.accent} sublabel="Approved client sign-ups" onClick={approvedClients?()=>setListModal("approved"):undefined}/>
          <StatCard label="With Loyalty Card"    value={withCard}     iconD={Icons.check}   accent={T.accent} sublabel="Pets with card" onClick={withCard?()=>setListModal("withcard"):undefined}/>
          <StatCard label="Without Loyalty Card" value={withoutCard}  iconD={Icons.account} accent={T.warn}   sublabel="Pets pending card" onClick={withoutCard?()=>setListModal("nocard"):undefined}/>
          <StatCard label="Active Clients"       value={activeClients}       iconD={Icons.account} accent={T.accent} sublabel="Currently active" onClick={activeClients?()=>setListModal("active"):undefined}/>
          <StatCard label="Inactive Clients"     value={inactiveClients}     iconD={Icons.bell}    accent={T.danger} sublabel="Inactive accounts" onClick={inactiveClients?()=>setListModal("inactive"):undefined}/>
          <StatCard label="Near Expiring"        value={nearExpiring}        iconD={Icons.clock}   accent={T.warn}   sublabel="Cards ≤ 60 days left" onClick={nearExpiring?()=>setAcctModal("near"):undefined}/>
          <StatCard label="Expired Cards"        value={expiredAccts}        iconD={Icons.alert}   accent={T.danger} sublabel="Loyalty cards to renew" onClick={expiredAccts?()=>setAcctModal("expired"):undefined}/>
        </div>
      </div>

      {/* ── Post Composer + Feed ── */}
      <div style={{ display:"flex", gap:16, marginBottom:20, alignItems:"flex-start", flexWrap:"wrap" }}>

        {/* ── Composer Card ── */}
        <div style={{ flex:1, minWidth:300 }}>
          <div style={{ ...css.card, padding:"20px 22px", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
              <div style={{ width:40, height:40, borderRadius:"50%", background:`${T.accent}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon d={Icons.account} size={19} color={T.accent} stroke/>
              </div>
              <textarea
                value={postText}
                onChange={e=>setPostText(e.target.value)}
                placeholder="What's on your mind? Share updates, announcements..."
                style={{ ...css.input, flex:1, height:72, resize:"none", borderRadius:20, padding:"10px 16px", fontSize:13.5, lineHeight:1.6 }}
              />
            </div>

            {/* Media preview */}
            {postMedia.length > 0 && (
              <div style={{ display:"grid", gridTemplateColumns: postMedia.length===1?"1fr":"1fr 1fr", gap:8, marginBottom:14, borderRadius:12, overflow:"hidden", border:`1px solid ${T.border}` }}>
                {postMedia.map((m,i)=>(
                  <div key={i} style={{ position:"relative", background:"#000", aspectRatio: postMedia.length===1?"16/9":"1" }}>
                    {m.type==="video"
                      ? <video src={m.url} controls style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                      : <img src={m.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    }
                    <button onClick={()=>removeMedia(i)} style={{ position:"absolute", top:6, right:6, width:24, height:24, borderRadius:"50%", background:"rgba(0,0,0,.6)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Icon d={Icons.x} size={12} color="#fff" stroke/>
                    </button>
                    {postMedia.length > 3 && i===3 && (
                      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ color:"#fff", fontSize:22, fontWeight:800 }}>+{postMedia.length-3}</span>
                      </div>
                    )}
                  </div>
                )).slice(0, postMedia.length > 4 ? 4 : postMedia.length)}
              </div>
            )}

            {/* Drag & Drop zone */}
            <div
              onDragOver={e=>{e.preventDefault();setDragging(true);}}
              onDragLeave={()=>setDragging(false)}
              onDrop={e=>{ e.preventDefault(); setDragging(false); addMedia(e.dataTransfer.files); }}
              style={{ border:`2px dashed ${dragging?T.accent:T.border}`, borderRadius:12, padding:"14px 0", textAlign:"center", marginBottom:14, background:dragging?`${T.accent}06`:"transparent", transition:"all .15s", cursor:"pointer" }}
              onClick={()=>fileRef.current?.click()}>
              <p style={{ fontSize:13, color:dragging?T.accent:T.muted, fontWeight:500 }}>
                {dragging ? "Drop files here" : "Drag & drop photos/videos or click to browse"}
              </p>
              <p style={{ fontSize:11.5, color:T.subtle, marginTop:3 }}>Supports JPG, PNG, GIF, MP4, MOV</p>
            </div>
            <input ref={fileRef} type="file" multiple accept="image/*,video/*" style={{ display:"none" }} onChange={e=>addMedia(e.target.files)}/>

            {/* Action bar */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>fileRef.current?.click()} style={{ ...css.btnSecondary, padding:"7px 14px", fontSize:12.5, gap:6, borderColor:T.border }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth={2} strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Photo
                </button>
                <button onClick={()=>fileRef.current?.click()} style={{ ...css.btnSecondary, padding:"7px 14px", fontSize:12.5, gap:6, borderColor:T.border }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  Video
                </button>
              </div>
              <button onClick={submitPost} disabled={!postText.trim()&&postMedia.length===0}
                style={{ ...css.btnPrimary, padding:"8px 22px", fontSize:13.5, opacity:(!postText.trim()&&postMedia.length===0)?.4:1 }}>
                Post
              </button>
            </div>
          </div>

          {/* ── Feed ── */}
          {posts.length===0 && (
            <div style={{ ...css.card, padding:"40px 24px", textAlign:"center", color:T.subtle }}>
              <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={T.subtle} strokeWidth={1.5} strokeLinecap="round" style={{ marginBottom:10 }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <p style={{ fontSize:13.5, marginBottom:4, fontWeight:500 }}>No posts yet</p>
              <p style={{ fontSize:12.5 }}>Share updates, announcements or photos above</p>
            </div>
          )}

          {posts.map(post=>(
            <div key={post.id} style={{ ...css.card, marginBottom:14, overflow:"hidden" }}>
              {/* Post Header */}
              <div style={{ padding:"16px 20px 12px", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ display:"flex", gap:11, alignItems:"center" }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", background:`${T.accent}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon d={Icons.account} size={18} color={T.accent} stroke/>
                  </div>
                  <div>
                    <p style={{ fontWeight:700, fontSize:14, color:T.text }}>{post.author}</p>
                    <p style={{ fontSize:12, color:T.subtle }}>{post.date}</p>
                  </div>
                </div>
                <button onClick={()=>deletePost(post.id)} style={{ background:"none", border:"none", cursor:"pointer", color:T.subtle, padding:4, borderRadius:6 }}>
                  <Icon d={Icons.x} size={15} color={T.subtle} stroke/>
                </button>
              </div>

              {/* Post Text */}
              {post.text && <p style={{ padding:"0 20px 14px", fontSize:14, color:T.text, lineHeight:1.65, whiteSpace:"pre-wrap" }}>{post.text}</p>}

              {/* Post Media */}
              {post.media.length > 0 && (
                <div style={{ display:"grid", gridTemplateColumns: post.media.length===1?"1fr":"1fr 1fr", gap:2, marginBottom:0 }}>
                  {post.media.slice(0, 4).map((m,i)=>(
                    <div key={i} style={{ position:"relative", background:"#000", aspectRatio: post.media.length===1?"16/9":"1", overflow:"hidden" }}>
                      {m.type==="video"
                        ? <video src={m.url} controls style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                        : <img src={m.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                      }
                      {post.media.length > 4 && i===3 && (
                        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.55)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ color:"#fff", fontSize:26, fontWeight:800 }}>+{post.media.length-4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Post Actions */}
              <div style={{ padding:"10px 20px 12px", borderTop:`1px solid ${T.border}`, marginTop: post.media.length>0?0:0, display:"flex", gap:20, alignItems:"center" }}>
                <button onClick={()=>toggleLike(post.id)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:post.liked?T.danger:T.muted, fontSize:13.5, fontWeight:post.liked?600:400, padding:0 }}>
                  <svg width={17} height={17} viewBox="0 0 24 24" fill={post.liked?"#ef4444":"none"} stroke={post.liked?"#ef4444":T.muted} strokeWidth={2} strokeLinecap="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                  </svg>
                  {post.likes > 0 && <span>{post.likes}</span>} Like
                </button>
                <span style={{ fontSize:12, color:T.subtle }}>{post.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Physical Card Printing (right column) ── */}
        <div style={{ width:440, flexShrink:0 }}>
          <div style={{ ...css.card, padding:"22px 24px" }}>
            <p style={css.sectionLabel}>Physical Card Printing Queue</p>
            <DataTable
              data={pets}
              columns={cols}
              actions={row=>
                row.printStatus==="Printed"
                  ? <span style={{ fontSize:12,color:T.accent,fontWeight:600,display:"flex",alignItems:"center",gap:5 }}><Icon d={Icons.check} size={13} color={T.accent} stroke/>Done</span>
                  : <button onClick={()=>markPrinted(row.id)} style={{ ...css.btnSmall }}>Set as Printed</button>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}


const SEED_TRANSACTIONS = [
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

/* ─── TRANSACTION PAGE ───────────────────────────────────────────────────── */
function Transaction({ db }) {
  const { pets: localPets, setPets: setLocalPets, clients, transactions, setTransactions } = db;
  const [scanning, setScanning]   = useState(false);
  const [code, setCode]           = useState("");
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(false);
  const [toast, setToast]         = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [showHistory, setShowHistory]     = useState(false);
  const [showTxnForm, setShowTxnForm]     = useState(false);
  const [txnType, setTxnType]     = useState("gain");
  const [txnAmount, setTxnAmount] = useState("");
  const [txnFile, setTxnFile]     = useState(null); // {name, data, type}
  const [viewReceipt, setViewReceipt] = useState(null); // txn whose receipt is open
  const inputRef = useRef();

  function pickReceiptFile(file){
    if(!file){ setTxnFile(null); return; }
    const reader = new FileReader();
    reader.onload = ()=> setTxnFile({ name:file.name, data:reader.result, type:file.type });
    reader.readAsDataURL(file);
  }

  useEffect(()=>{ inputRef.current?.focus(); }, []);
  useEffect(()=>{ if(scanning && inputRef.current) inputRef.current.focus(); }, [scanning]);

  const POINTS_RATE = 300; // ₱300 = 1 point

  function lookup(val) {
    setError(false);
    const v = val.trim().replace(/\s+/g,""); const found = localPets.find(p => String(p.id)===v || p.name.toLowerCase()===v.toLowerCase() || (p.membershipNo && p.membershipNo.replace(/\s+/g,"").toLowerCase()===v.toLowerCase()));
    if (found) {
      setResult({ pet:found, client: clients.find(c=>c.id===found.clientId) });
      setTxnAmount(""); setTxnFile(null); setTxnType("gain"); setShowHistory(false); setShowTxnForm(false);
    } else { setResult(null); setError(true); }
  }

  function clearResult() { setResult(null); setError(false); setCode(""); inputRef.current?.focus(); }

  function deleteRecord() {
    setLocalPets(p => p.filter(x => x.id !== result.pet.id));
    setResult(null); setConfirmDel(false); setCode("");
    setToast("Loyalty card record deleted.");
    inputRef.current?.focus();
  }

  const petTxns = result ? transactions.filter(t => t.petId === result.pet.id).sort((a,b)=>b.id-a.id) : [];
  const totalPoints = petTxns.reduce((s,t) => s + t.pointsGained - t.pointsUsed, 0);

  // Gain mode: amount in pesos → points (₱300 = 1 pt)
  // Redeem mode: user enters points directly
  const pointsToGain   = txnType==="gain"   && txnAmount ? Math.floor(Number(txnAmount) / POINTS_RATE) : 0;
  const pointsToRedeem = txnType==="redeem" && txnAmount ? Number(txnAmount) : 0;
  const redeemError    = txnType==="redeem" && pointsToRedeem > totalPoints;

  function saveTxn() {
    if (!txnAmount || !result) return;
    if (redeemError) return; // block over-redemption
    const newTxn = {
      id: Date.now(),
      petId: result.pet.id,
      transactionId: String(transactions.length + 1),
      amount: txnType==="gain" ? Number(txnAmount) : 0,
      pointsGained: txnType==="gain" ? pointsToGain : 0,
      pointsUsed:   txnType==="redeem" ? pointsToRedeem : 0,
      transactBy: "Jeremiah Munoz",
      receipt: txnFile ? txnFile.name : "—",
      receiptData: txnFile ? txnFile.data : null,
      receiptType: txnFile ? txnFile.type : null,
      date: new Date().toISOString().slice(0,10),
    };
    setTransactions(p => [newTxn, ...p]);
    setTxnAmount(""); setTxnFile(null);
    setToast(txnType==="gain"
      ? `+${pointsToGain} points gained! New total: ${totalPoints + pointsToGain}`
      : `${pointsToRedeem} points redeemed. Remaining: ${totalPoints - pointsToRedeem}`
    );
  }

  // Expiry = membership date + 2 years
  function getExpiry(dateStr) {
    if (!dateStr) return "—";
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const d = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
      d.setFullYear(d.getFullYear() + 1);
      return d.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
    }
    return "—";
  }

  function downloadCard(p, c, points) {
    const W=600, H=380, r=34;
    const cv=document.createElement("canvas"); cv.width=W; cv.height=H;
    const x=cv.getContext("2d");
    const rr=(a,b,w,h,rad)=>{ x.beginPath(); x.moveTo(a+rad,b); x.arcTo(a+w,b,a+w,b+h,rad); x.arcTo(a+w,b+h,a,b+h,rad); x.arcTo(a,b+h,a,b,rad); x.arcTo(a,b,a+w,b,rad); x.closePath(); };
    const g=x.createLinearGradient(0,0,W,H); g.addColorStop(0,"#0a4d37"); g.addColorStop(.5,"#0f6b4a"); g.addColorStop(1,"#073d2b");
    rr(0,0,W,H,r); x.fillStyle=g; x.fill();
    x.save(); rr(0,0,W,H,r); x.clip();
    x.fillStyle="rgba(212,175,55,.10)"; x.beginPath(); x.arc(W-40,-30,240,0,7); x.fill();
    x.fillStyle="rgba(255,255,255,.05)"; x.beginPath(); x.arc(120,H+50,320,0,7); x.fill();
    x.restore();
    // gold frame
    x.strokeStyle="rgba(212,175,55,.55)"; x.lineWidth=2; rr(14,14,W-28,H-28,r-8); x.stroke();
    const gold=x.createLinearGradient(40,0,300,0); gold.addColorStop(0,"#f4e2a1"); gold.addColorStop(1,"#d4af37");
    const draw=()=>{
      x.textBaseline="top";
      // highlighted PET HUB REWARDS badge
      x.font="800 18px Inter,sans-serif"; const bt="★ PET HUB REWARDS ★"; const btw=x.measureText(bt).width;
      rr(44,42,btw+24,30,7); x.fillStyle=gold; x.fill();
      x.fillStyle="#0a4d37"; x.fillText(bt, 56, 49);
      x.fillStyle="#fff"; x.font="800 46px Inter,sans-serif"; x.fillText((p.name||"").toUpperCase(), 44, 86);
      x.fillStyle="#e9d9a0"; x.font="700 22px Inter,sans-serif"; x.fillText((p.breed||p.species||"").toUpperCase(), 44, 140);
      const lg=x.createLinearGradient(44,0,260,0); lg.addColorStop(0,"rgba(212,175,55,.7)"); lg.addColorStop(1,"rgba(212,175,55,0)");
      x.fillStyle=lg; x.fillRect(44,180,216,2);
      x.fillStyle="rgba(255,255,255,.92)"; x.font="400 21px Inter,sans-serif";
      x.fillText(`Owner: ${c?.name||"—"}`, 44, 198);
      x.fillText("Points: ", 44, 234); const pw=x.measureText("Points: ").width;
      x.fillStyle="#f4e2a1"; x.font="700 21px Inter,sans-serif"; x.fillText(String(points), 44+pw, 234);
      x.fillStyle="rgba(255,255,255,.92)"; x.font="400 21px Inter,sans-serif"; x.fillText(`Expires: ${getExpiry(p.membershipDate)}`, 44, 270);
      if(p.membershipNo){ x.fillStyle="rgba(233,217,160,.8)"; x.font="600 15px Inter,sans-serif"; x.fillText(p.membershipNo, 44, 310); }
      const a=document.createElement("a"); a.href=cv.toDataURL("image/png"); a.download=`VIP-LoyaltyCard-${(p.name||"pet").replace(/\s+/g,"-")}.png`; a.click();
      setToast("VIP loyalty card downloaded.");
    };
    if(p.photo){ const im=new Image(); im.onload=()=>{ x.save(); x.beginPath(); x.arc(W-86,96,52,0,7); x.closePath(); x.strokeStyle="rgba(212,175,55,.7)"; x.lineWidth=3; x.stroke(); x.clip(); x.drawImage(im,W-138,44,104,104); x.restore(); draw(); }; im.onerror=draw; im.src=p.photo; } else draw();
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
      {viewReceipt && (
        <Modal title={`Receipt — Transaction #${viewReceipt.transactionId}`} onClose={()=>setViewReceipt(null)} width={560}>
          <p style={{ fontSize:12.5, color:T.muted, marginBottom:12 }}>{viewReceipt.receipt} · {new Date(viewReceipt.date).toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"})} · ₱{(viewReceipt.amount||0).toLocaleString()}</p>
          {String(viewReceipt.receiptType||"").includes("pdf")
            ? <iframe src={viewReceipt.receiptData} title="Receipt PDF" style={{ width:"100%", height:420, border:`1px solid ${T.border}`, borderRadius:10, background:"#fff" }}/>
            : <img src={viewReceipt.receiptData} alt="Receipt" style={{ width:"100%", maxHeight:460, objectFit:"contain", borderRadius:10, border:`1px solid ${T.border}`, background:T.bg }}/>
          }
          <div style={{ display:"flex", gap:10, marginTop:14 }}>
            <a href={viewReceipt.receiptData} download={viewReceipt.receipt} style={{ ...css.btnSecondary, flex:1, justifyContent:"center", textDecoration:"none" }}>Download</a>
            <button onClick={()=>setViewReceipt(null)} style={{ ...css.btnPrimary, flex:1, justifyContent:"center" }}>Close</button>
          </div>
        </Modal>
      )}
      <PageHeader title="Transaction Scanner"/>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-start" }}>

        {/* ── Left: Scanner + Transaction Form — hidden after scan ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16, width: result ? 0 : 300, flexShrink:0, overflow: result ? "hidden" : "visible", transition:"width .3s ease", opacity: result ? 0 : 1 }}>

          {/* Scanner */}
          <div style={{ ...css.card, padding:"20px 22px" }}>
            <p style={css.sectionLabel}>Scanner</p>
            <button onClick={()=>setScanning(s=>!s)} style={{ ...css.btnPrimary, width:"100%", justifyContent:"center", marginBottom:16, background:scanning?T.accentDark:T.accent }}>
              <Icon d={Icons.camera} size={15} color="#fff" stroke/>
              {scanning ? "Stop Scanning" : "Start Camera Scanning"}
            </button>
            {scanning && (
              <div style={{ background:"rgba(34,197,138,.12)", border:`2px dashed ${T.accent}`, borderRadius:10, padding:20, textAlign:"center", marginBottom:14, color:T.muted, fontSize:13 }}>
                <Icon d={Icons.camera} size={28} color={T.accent} stroke/>
                <p style={{ marginTop:8 }}>Camera preview active</p>
              </div>
            )}
            <p style={{ fontSize:12, fontWeight:600, color:T.muted, marginBottom:6 }}>QR Scanner Device</p>
            <div style={{ position:"relative" }}>
              <input
                ref={inputRef}
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter" && code.trim()) { lookup(code); } }}
                placeholder="Scan QR Code Here"
                autoComplete="off"
                style={{
                  ...css.input,
                  borderColor: error ? T.danger : result ? T.accent : T.border,
                  marginBottom: 4,
                  // Hide typed/scanned value — show only placeholder or dots
                  color: "transparent",
                  caretColor: T.accent,
                  textShadow: code ? "0 0 6px rgba(0,0,0,0)" : "none",
                }}
              />
              {/* Visual overlay — shows scanning indicator instead of raw value */}
              <div style={{
                position:"absolute", top:0, left:0, right:0, bottom:4,
                padding:"9px 12px", pointerEvents:"none",
                fontSize:13.5, display:"flex", alignItems:"center", gap:6,
              }}>
                {code
                  ? <span style={{ color:T.accent, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:T.accent, display:"inline-block", animation:"pulse 1s infinite" }}/>
                      Scanning…
                    </span>
                  : <span style={{ color:T.subtle }}>Scan QR Code Here</span>
                }
              </div>
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
            <p style={{ fontSize:11, color:T.subtle, marginBottom:12 }}>Compatible with USB QR Scanner Devices</p>
            {error && (
              <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:10,padding:"7px 11px",borderRadius:7,background:"rgba(248,113,113,.12)",border:"1px solid #fecaca" }}>
                <Icon d={Icons.x} size={13} color={T.danger} stroke/>
                <p style={{ fontSize:12.5, color:T.danger, fontWeight:600 }}>No record found. Please try again.</p>
              </div>
            )}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{ if(code.trim()) lookup(code); }} style={{ ...css.btnPrimary, flex:1, justifyContent:"center" }}>
                <Icon d={Icons.search} size={14} color="#fff" stroke/> Look Up
              </button>
              {(result || code) && <button onClick={clearResult} style={{ ...css.btnSecondary, padding:"9px 11px" }}>
                <Icon d={Icons.x} size={14} color={T.muted} stroke/>
              </button>}
            </div>
          </div>


        </div>

        {/* ── Right: Loyalty Card Details + Pet Info + History ── */}
        <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:16, transition:"all .3s ease" }}>

          {/* Empty state */}
          {!result && !error && (
            <div style={{ ...css.card, padding:"60px 0", textAlign:"center", color:T.subtle }}>
              <Icon d={Icons.eye} size={40} color={T.subtle} stroke/>
              <p style={{ marginTop:14, fontSize:13.5, lineHeight:1.6 }}>Scan a QR code or enter a pet name<br/>to view loyalty card details.</p>
            </div>
          )}

          {result && !confirmDel && (() => {
            const p = result.pet;
            const c = result.client;
            return (
              <>
                {/* ── Loyalty Card Visual + Header ── */}
                <div style={{ ...css.card, padding:"22px 24px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:T.accent, textTransform:"uppercase", letterSpacing:".06em" }}>Loyalty Card Details</p>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={clearResult}
                        style={{ ...css.btnSecondary, padding:"6px 14px", fontSize:12, gap:6 }}>
                        <Icon d={Icons.search} size={13} color={T.muted} stroke/> Scan Again
                      </button>
                      <button onClick={()=>setConfirmDel(true)}
                        style={{ ...css.btnSecondary, padding:"6px 12px", fontSize:12, gap:5, borderColor:"rgba(248,113,113,.4)", color:T.danger }}>
                        <Icon d={Icons.x} size={12} color={T.danger} stroke/> Delete
                      </button>
                    </div>
                  </div>

                  <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                    {/* Card Visual */}
                    <div style={{ display:"flex", flexDirection:"column", gap:10, flexShrink:0 }}>
                      <div id={`loyalty-card-${p.id}`} style={{ width:300, minHeight:190, borderRadius:16, background:"linear-gradient(135deg, #0a4d37 0%, #0f6b4a 50%, #073d2b 100%)", padding:"18px 20px", color:"#fff", position:"relative", overflow:"hidden", boxShadow:"0 10px 30px rgba(6,50,35,.5)", border:"1.5px solid rgba(212,175,55,.45)" }}>
                        {/* Decorative foliage circles */}
                        <div style={{ position:"absolute", top:-30, right:-30, width:130, height:130, borderRadius:"50%", background:"rgba(212,175,55,.10)" }}/>
                        <div style={{ position:"absolute", bottom:-40, left:40, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,.05)" }}/>
                        <img src="logo-gold.png" alt="" style={{ position:"absolute", bottom:-16, right:-12, width:104, height:104, objectFit:"contain", opacity:.22 }}/>
                        {/* Gold corner frame */}
                        <div style={{ position:"absolute", inset:7, borderRadius:11, border:"1px solid rgba(212,175,55,.35)", pointerEvents:"none" }}/>
                        {/* Pet photo */}
                        {p.photo && (
                          <div style={{ position:"absolute", top:16, right:18, width:58, height:58, borderRadius:"50%", overflow:"hidden", border:"2px solid rgba(212,175,55,.7)", boxShadow:"0 2px 8px rgba(0,0,0,.3)" }}>
                            <img src={p.photo} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                          </div>
                        )}
                        <div style={{ position:"relative" }}>
                          <p style={{ display:"inline-block", fontSize:9.5, fontWeight:800, letterSpacing:".18em", marginBottom:8, padding:"3px 9px", borderRadius:5, background:"linear-gradient(90deg,#f4e2a1,#d4af37)", color:"#0a4d37", boxShadow:"0 2px 8px rgba(212,175,55,.4)" }}>★ PET HUB REWARDS ★</p>
                          <p style={{ fontSize:23, fontWeight:800, letterSpacing:".03em", lineHeight:1.05, maxWidth: p.photo ? 180 : "100%", textShadow:"0 1px 4px rgba(0,0,0,.35)" }}>{p.name?.toUpperCase()}</p>
                          <p style={{ fontSize:12, fontWeight:700, letterSpacing:".08em", marginBottom:12, color:"#e9d9a0" }}>{p.breed?.toUpperCase() || p.species?.toUpperCase() || ""}</p>
                          <div style={{ height:1, background:"linear-gradient(90deg, rgba(212,175,55,.6), rgba(212,175,55,0))", marginBottom:10, maxWidth:200 }}/>
                          <p style={{ fontSize:11, opacity:.9, lineHeight:1.8 }}>
                            Owner: {c?.name || "—"}<br/>
                            Points: <strong style={{ color:"#f4e2a1" }}>{totalPoints}</strong><br/>
                            Expires: {getExpiry(p.membershipDate)}
                          </p>
                          {p.membershipNo && <p style={{ fontSize:10, letterSpacing:".14em", marginTop:8, color:"rgba(233,217,160,.75)", fontWeight:600 }}>{p.membershipNo}</p>}
                        </div>
                      </div>
                      <button onClick={()=>downloadCard(p, c, totalPoints)} style={{ ...css.btnPrimary, justifyContent:"center", padding:"9px 0", fontSize:13, gap:7 }}>
                        <Icon d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" size={15} color="#fff" stroke/> Download Card
                      </button>
                      {/* Photo Upload Button */}
                      <label style={{ cursor:"pointer" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"9px 0", borderRadius:9, border:`1.5px dashed ${T.border}`, background:T.surface, fontSize:13, color:T.muted, fontWeight:600, transition:"all .15s" }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent;}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted;}}>
                          <Icon d={Icons.camera} size={15} color="currentColor" stroke/>
                          {p.photo ? "Change Pet Photo" : "Upload Pet Photo"}
                        </div>
                        <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = ev => {
                            setLocalPets(prev => prev.map(x => x.id===p.id ? {...x, photo:ev.target.result} : x));
                            setResult(r => ({ ...r, pet: {...r.pet, photo:ev.target.result} }));
                          };
                          reader.readAsDataURL(file);
                        }}/>
                      </label>
                      {p.photo && (
                        <button onClick={()=>{
                          setLocalPets(prev=>prev.map(x=>x.id===p.id?{...x,photo:null}:x));
                          setResult(r=>({...r,pet:{...r.pet,photo:null}}));
                        }} style={{ ...css.btnSecondary, justifyContent:"center", padding:"7px 0", fontSize:12, color:T.danger, borderColor:"rgba(248,113,113,.4)" }}>
                          Remove Photo
                        </button>
                      )}
                    </div>

                    {/* Pet Info Grid */}
                    <div style={{ flex:1, minWidth:200 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".07em", marginBottom:12 }}>Pet Information</p>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px 24px" }}>
                        {[
                          ["Branch", p.branch],
                          ["Owner", c?.name||"—"],
                          ["Contact Info", c?.email||"—"],
                          ["Pet's Name", p.name],
                          ["Card Expiration Date", getExpiry(p.membershipDate)],
                          ["Total Points", totalPoints],
                          ["Used Points", petTxns.reduce((s,t)=>s+t.pointsUsed,0)],
                          ["Species (Dog/Cat)", p.species||"—"],
                          ["Breed", p.breed||"—"],
                          ["Color/Markings", p.color||"—"],
                          ["Gender", p.gender||"—"],
                          ["Date of Birth", p.birthday||"—"],
                          ["Weight", p.weight||"—"],
                          ["Spayed/Neutered", p.spayed||"No"],
                        ].map(([label,val])=>(
                          <div key={label} style={{ paddingBottom:10, borderBottom:`1px solid ${T.border}` }}>
                            <p style={{ fontSize:11, color:T.muted, marginBottom:3 }}>{label}:</p>
                            <p style={{ fontSize:13, fontWeight:600, color:T.text, wordBreak:"break-word" }}>{val||"—"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Transaction Button + Collapsible Form ── */}
                {!confirmDel && (
                  <div style={{ ...css.card, padding:"16px 24px" }}>
                    <button
                      onClick={()=>{ setShowTxnForm(f=>!f); setTxnAmount(""); setTxnFile(null); setTxnType("gain"); }}
                      style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:9, background:`${T.accent}15`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Icon d={Icons.transaction} size={16} color={T.accent} stroke/>
                        </div>
                        <div style={{ textAlign:"left" }}>
                          <p style={{ fontSize:13.5, fontWeight:700, color:T.text }}>Transaction</p>
                          <p style={{ fontSize:12, color:T.muted, marginTop:1 }}>Gain or redeem loyalty points</p>
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:12, color:T.muted, fontWeight:500 }}>{showTxnForm ? "Hide" : "Open"}</span>
                        <Icon d={showTxnForm ? Icons.chevronD : Icons.chevronR} size={16} color={T.muted} stroke/>
                      </div>
                    </button>

                    {showTxnForm && (
                      <div style={{ marginTop:18, borderTop:`1px solid ${T.border}`, paddingTop:18 }}>
                        {/* Transaction Type */}
                        <p style={{ fontSize:12, fontWeight:600, color:T.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:".06em" }}>Transaction Type</p>
                        <div style={{ display:"flex", gap:12, marginBottom:16 }}>
                          {[["gain","Gain Points",T.accent],["redeem","Redeem Points",T.info]].map(([val,label,col])=>(
                            <label key={val} onClick={()=>setTxnType(val)} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:13.5, cursor:"pointer", padding:"9px 0", borderRadius:8, border:`2px solid ${txnType===val?col:T.border}`, background:txnType===val?`${col}10`:"#fff", fontWeight:txnType===val?700:400, color:txnType===val?col:T.muted, transition:"all .15s" }}>
                              <input type="radio" name="txnType" value={val} checked={txnType===val} onChange={()=>setTxnType(val)} style={{ display:"none" }}/>
                              {label}
                            </label>
                          ))}
                        </div>

                        {/* Receipt Upload */}
                        <p style={{ fontSize:12, fontWeight:600, color:T.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Transaction Receipt</p>
                        <label style={{ display:"block", marginBottom:14, cursor:"pointer" }}>
                          <div style={{ border:`1.5px solid ${T.border}`, borderRadius:8, padding:"8px 12px", fontSize:13, color:txnFile?T.text:T.subtle, background:T.surface, display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:5, padding:"3px 10px", fontSize:12, fontWeight:600, color:T.text, flexShrink:0 }}>Choose File</span>
                            <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{txnFile ? txnFile.name : "No file chosen"}</span>
                          </div>
                          <input type="file" accept="image/*,.pdf" onChange={e=>pickReceiptFile(e.target.files[0]||null)} style={{ display:"none" }}/>
                        </label>

                        {/* Amount / Points */}
                        <p style={{ fontSize:12, fontWeight:600, color:T.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>
                          {txnType==="gain" ? "Transaction Amount (₱)" : "Points to Redeem"}
                        </p>
                        <input type="number" value={txnAmount} onChange={e=>setTxnAmount(e.target.value)} min={0}
                          placeholder={txnType==="gain" ? "e.g. 1500" : `Max ${totalPoints} pts`}
                          style={{ ...css.input, marginBottom:6, borderColor: redeemError ? T.danger : T.border }}/>

                        {redeemError && (
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, padding:"7px 11px", borderRadius:7, background:"rgba(248,113,113,.12)", border:"1px solid #fecaca" }}>
                            <Icon d={Icons.x} size={13} color={T.danger} stroke/>
                            <p style={{ fontSize:12.5, color:T.danger, fontWeight:600 }}>Not enough points. Available: <strong>{totalPoints}</strong></p>
                          </div>
                        )}
                        {txnType==="redeem" && !redeemError && txnAmount && (
                          <p style={{ fontSize:12, color:T.accent, marginBottom:10, fontWeight:500 }}>
                            ✓ Remaining after redeem: <strong>{totalPoints - pointsToRedeem} pts</strong>
                          </p>
                        )}

                        {/* Points Preview */}
                        <p style={{ fontSize:12, fontWeight:600, color:T.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:".06em", marginTop:4 }}>
                          {txnType==="gain" ? "Points to Gain" : "Points Used"}
                        </p>
                        <div style={{ padding:"10px 14px", borderRadius:8, background:T.surfaceAlt, marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between", border:`1px solid ${T.border}` }}>
                          <span style={{ fontWeight:800, fontSize:18, color: txnType==="gain" ? T.accent : T.danger }}>
                            {txnType==="gain"
                              ? (txnAmount ? `+${pointsToGain}` : "—")
                              : (txnAmount ? `-${pointsToRedeem}` : "—")
                            } pts
                          </span>
                          {txnAmount && !redeemError && (
                            <span style={{ fontSize:12.5, color:T.muted }}>
                              New total: <strong style={{ color:T.text }}>{txnType==="gain" ? totalPoints+pointsToGain : totalPoints-pointsToRedeem} pts</strong>
                            </span>
                          )}
                        </div>

                        <button onClick={saveTxn} disabled={!txnAmount || redeemError}
                          style={{ ...css.btnPrimary, width:"100%", justifyContent:"center", fontSize:14, padding:"11px 0", opacity:(!txnAmount||redeemError)?.4:1, background:txnType==="redeem"?T.info:T.accent, gap:8 }}>
                          <Icon d={Icons.check} size={15} color="#fff" stroke/>
                          {txnType==="gain" ? "Save & Gain Points" : "Save & Redeem Points"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Transaction History Button ── */}
                <div style={{ ...css.card, padding:"16px 24px" }}>
                  <button
                    onClick={()=>setShowHistory(h=>!h)}
                    style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", background:"none", border:"none", cursor:"pointer", padding:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:`${T.accent}15`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Icon d={Icons.transaction} size={16} color={T.accent} stroke/>
                      </div>
                      <div style={{ textAlign:"left" }}>
                        <p style={{ fontSize:13.5, fontWeight:700, color:T.text }}>Pet Transactions History</p>
                        <p style={{ fontSize:12, color:T.muted, marginTop:1 }}>{p.name} &nbsp;·&nbsp; {petTxns.length} transaction{petTxns.length!==1?"s":""} &nbsp;·&nbsp; Total: <strong style={{color:T.accent}}>{totalPoints} pts</strong></p>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:12, color:T.muted, fontWeight:500 }}>{showHistory?"Hide":"View"}</span>
                      <Icon d={showHistory ? Icons.chevronD : Icons.chevronR} size={16} color={T.muted} stroke/>
                    </div>
                  </button>

                  {/* Expanded history table */}
                  {showHistory && (
                    <div style={{ marginTop:16, borderTop:`1px solid ${T.border}`, paddingTop:16 }}>
                      {petTxns.length === 0
                        ? <p style={{ color:T.subtle, fontSize:13, padding:"12px 0", textAlign:"center" }}>No transactions yet.</p>
                        : (
                          <div style={{ overflowX:"auto", borderRadius:9, border:`1px solid ${T.border}` }}>
                            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13.5 }}>
                              <thead>
                                <tr style={{ background:T.surfaceAlt, borderBottom:`2px solid ${T.border}` }}>
                                  {["Transaction ID","Attachment","Amount","Points Gained","Points Used","Transact By"].map(h=>(
                                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontWeight:600, color:T.muted, fontSize:12, whiteSpace:"nowrap" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {petTxns.map((t,i)=>(
                                  <tr key={t.id} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.surface:T.surfaceAlt }}>
                                    <td style={{ padding:"10px 14px", fontWeight:600 }}>{t.transactionId}</td>
                                    <td style={{ padding:"10px 14px" }}>
                                      {t.receiptData
                                        ? <span onClick={()=>setViewReceipt(t)} style={{ color:T.accent, fontWeight:600, cursor:"pointer", fontSize:13, textDecoration:"underline" }}>View Receipt</span>
                                        : <span title="No receipt file was attached to this transaction" style={{ color:T.subtle, fontSize:13 }}>{t.receipt && t.receipt!=="—" ? t.receipt : "No receipt"}</span>
                                      }
                                    </td>
                                    <td style={{ padding:"10px 14px", fontWeight:600 }}>{t.amount>0?`₱${t.amount.toLocaleString()}`:"—"}</td>
                                    <td style={{ padding:"10px 14px", color:T.accent, fontWeight:700 }}>{t.pointsGained>0?`+${t.pointsGained}`:0}</td>
                                    <td style={{ padding:"10px 14px", color:t.pointsUsed>0?T.danger:T.muted, fontWeight:t.pointsUsed>0?700:400 }}>{t.pointsUsed>0?`-${t.pointsUsed}`:0}</td>
                                    <td style={{ padding:"10px 14px", color:T.muted }}>{t.transactBy}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      }
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* Delete Confirmation */}
          {confirmDel && result && (
            <div style={{ ...css.card, padding:"48px 32px", textAlign:"center" }}>
              <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(248,113,113,.12)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <Icon d={Icons.x} size={26} color={T.danger} stroke/>
              </div>
              <p style={{ fontWeight:700, fontSize:16, color:T.text, marginBottom:8 }}>Delete this record?</p>
              <p style={{ fontSize:13.5, color:T.muted, marginBottom:24, lineHeight:1.6 }}>
                You are about to permanently delete the loyalty card record for <strong>{result.pet.name}</strong>. This cannot be undone.
              </p>
              <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                <button onClick={()=>setConfirmDel(false)} style={{ ...css.btnSecondary, padding:"9px 24px" }}>Cancel</button>
                <button onClick={deleteRecord} style={{ ...css.btnPrimary, padding:"9px 24px", background:T.danger, gap:7 }}>
                  <Icon d={Icons.x} size={14} color="#fff" stroke/> Yes, Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── BRANCH MAP ─────────────────────────────────────────────────────────── */
function BranchMap({ branches, selectedId, onSelect }) {
  const mapRef    = useRef(null);
  const mapObj    = useRef(null);
  const markers   = useRef({});

  useEffect(() => {
    function init() {
      if (!window.L) { setTimeout(init, 300); return; }
      if (mapObj.current) return;

      mapObj.current = window.L.map(mapRef.current, { zoomControl:true, scrollWheelZoom:true }).setView([14.5, 121.0], 8);

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:'© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom:19,
      }).addTo(mapObj.current);

      // Custom logo marker icon
      // (logo served from logo.png)
      const icon = window.L.divIcon({
        className:"",
        html:`<div style="width:42px;height:42px;border-radius:50%;overflow:hidden;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.35);background:#fff;display:flex;align-items:center;justify-content:center;">
          <img src="logo-gold.png" style="width:36px;height:36px;object-fit:contain;border-radius:50%;"/>
        </div>
        <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid #fff;margin:0 auto;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2));margin-top:-1px;width:14px;display:flex;justify-content:center;"></div>`,
        iconSize:[42,52], iconAnchor:[21,52], popupAnchor:[0,-54],
      });

      branches.forEach(b => {
        if (!b.lat || !b.lng) return;
        const marker = window.L.marker([b.lat, b.lng], { icon })
          .addTo(mapObj.current)
          .bindPopup(`
            <div style="font-family:Inter,sans-serif;min-width:200px">
              <p style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:4px">${b.name}</p>
              <p style="font-size:11.5px;color:#64748b;margin-bottom:3px">📍 ${b.location}</p>
              ${b.phone ? `<p style="font-size:11.5px;color:#64748b">📞 ${b.phone}</p>` : ""}
              ${b.email ? `<p style="font-size:11.5px;color:#10b981">${b.email}</p>` : ""}
              <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((b.name+", "+(b.location||"")).trim())}" target="_blank" rel="noopener" style="display:inline-block;margin-top:7px;font-size:11.5px;font-weight:700;color:#fff;background:#10b981;border-radius:7px;padding:5px 10px;text-decoration:none">Open in Google Maps ↗</a>
            </div>
          `, { maxWidth:260 });
        marker.on("click", () => onSelect && onSelect(b.id));
        markers.current[b.id] = marker;
      });
    }
    init();
    return () => {
      if (mapObj.current) { mapObj.current.remove(); mapObj.current = null; }
    };
  }, []);

  // Pan to selected branch
  useEffect(() => {
    if (!mapObj.current || !selectedId) return;
    const b = branches.find(x => x.id === selectedId);
    if (b?.lat && b?.lng) {
      mapObj.current.flyTo([b.lat, b.lng], 14, { duration:1 });
      markers.current[selectedId]?.openPopup();
    }
  }, [selectedId]);

  return (
    <div ref={mapRef} style={{ width:"100%", height:420, borderRadius:12, overflow:"hidden", zIndex:0 }}/>
  );
}

/* ─── BRANCHES PAGE ──────────────────────────────────────────────────────── */
function BranchesPage({ db, readOnly }) {
  const { branches, setBranches } = db;
  const [editingId, setEditingId]     = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [search, setSearch]           = useState("");
  const [toast, setToast]             = useState(null);
  const [addingNew, setAddingNew]     = useState(false);
  const [newRow, setNewRow]           = useState({ name:"", email:"", contact:"", location:"" });
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showMap, setShowMap]         = useState(true);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return branches.filter(b =>
      b.name.toLowerCase().includes(q) ||
      (b.email||"").toLowerCase().includes(q) ||
      (b.location||"").toLowerCase().includes(q)
    );
  }, [branches, search]);

  function startEdit(b) { setEditingId(b.id); setEditForm({...b}); }
  function cancelEdit() { setEditingId(null); setEditForm({}); }
  function saveEdit() {
    if (!editForm.name) return;
    setBranches(p => p.map(b => b.id === editingId ? {...editForm} : b));
    setEditingId(null); setEditForm({});
    setToast("Branch updated.");
  }
  function deleteBranch(id) {
    setBranches(p => p.filter(b => b.id !== id));
    setToast("Branch removed.");
  }
  function saveNew() {
    if (!newRow.name) return;
    setBranches(p => [...p, { ...newRow, id: Date.now() }]);
    setNewRow({ name:"", email:"", contact:"", location:"" });
    setAddingNew(false);
    setToast("Branch added.");
  }

  const cellInput = (val, onChange, placeholder="", type="text") => (
    <input value={val} onChange={e=>onChange(e.target.value)} type={type} placeholder={placeholder}
      style={{ ...css.input, fontSize:13, padding:"6px 10px", minWidth:120 }}
      onKeyDown={e=>{ if(e.key==="Enter") saveEdit(); if(e.key==="Escape") cancelEdit(); }}
      autoFocus={false}
    />
  );

  const cols = ["Branch Name","Email","Contact","Location","Actions"];

  return (
    <div>
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
      <PageHeader title="Branches">
        {!readOnly && <button onClick={()=>{ setAddingNew(true); setEditingId(null); }} style={css.btnPrimary} disabled={addingNew}>
          <Icon d={Icons.plus} size={15} color="#fff" stroke/> Add Branch
        </button>}
      </PageHeader>

      {/* ── Map Card ── */}
      <div style={{ ...css.card, padding:"20px 24px", marginBottom:16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:showMap?16:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:`${T.accent}15`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon d={Icons.branch} size={16} color={T.accent} stroke/>
            </div>
            <div>
              <p style={{ fontSize:13.5, fontWeight:700, color:T.text }}>Branch Locations</p>
              <p style={{ fontSize:12, color:T.muted }}>Philippines · {branches.filter(b=>b.lat).length} locations pinned</p>
            </div>
          </div>
          <button onClick={()=>setShowMap(v=>!v)} style={{ ...css.btnSecondary, padding:"6px 14px", fontSize:12.5, gap:6 }}>
            <Icon d={showMap?Icons.chevronD:Icons.chevronR} size={13} color={T.muted} stroke/>
            {showMap?"Hide Map":"Show Map"}
          </button>
        </div>
        {showMap && (
          <BranchMap branches={branches} selectedId={selectedBranch} onSelect={setSelectedBranch}/>
        )}
      </div>

      <div style={{ ...css.card, padding:"22px 24px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 }}>
          <p style={css.sectionLabel}>All Branches — <span style={{ color:T.accent }}>{branches.length}</span></p>
          <div style={{ position:"relative" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search branches…"
              style={{ ...css.input, width:220, paddingLeft:36, fontSize:13 }}/>
            <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }}>
              <Icon d={Icons.search} size={15} color={T.subtle} stroke/>
            </span>
          </div>
        </div>

        <div style={{ borderRadius:10, border:`1px solid ${T.border}`, overflow:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13.5 }}>
            <thead>
              <tr style={{ background:T.surfaceAlt, borderBottom:`2px solid ${T.border}` }}>
                {cols.map(c => (
                  <th key={c} style={{ padding:"11px 14px", textAlign:"left", fontWeight:600, color:T.muted, fontSize:12, whiteSpace:"nowrap", letterSpacing:".03em" }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>

              {/* ── New Row ── */}
              {addingNew && (
                <tr style={{ background:"rgba(34,197,138,.12)", borderBottom:`1px solid ${T.border}` }}>
                  <td style={{ padding:"10px 14px" }}>
                    <input value={newRow.name} onChange={e=>setNewRow(r=>({...r,name:e.target.value}))}
                      placeholder="Branch name *" autoFocus
                      style={{ ...css.input, fontSize:13, padding:"6px 10px", borderColor: T.accent }}
                      onKeyDown={e=>{ if(e.key==="Escape"){ setAddingNew(false); }}}
                    />
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <input value={newRow.email} onChange={e=>setNewRow(r=>({...r,email:e.target.value}))}
                      placeholder="Email address" type="email"
                      style={{ ...css.input, fontSize:13, padding:"6px 10px" }}/>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <input value={newRow.contact} onChange={e=>setNewRow(r=>({...r,contact:e.target.value}))}
                      placeholder="09XXXXXXXXX"
                      style={{ ...css.input, fontSize:13, padding:"6px 10px" }}/>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <input value={newRow.location} onChange={e=>setNewRow(r=>({...r,location:e.target.value}))}
                      placeholder="Full address"
                      style={{ ...css.input, fontSize:13, padding:"6px 10px" }}/>
                  </td>
                  <td style={{ padding:"10px 14px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={saveNew}
                        style={{ ...css.btnPrimary, padding:"5px 14px", fontSize:12, gap:5, opacity: newRow.name ? 1 : .5 }}>
                        <Icon d={Icons.check} size={13} color="#fff" stroke/> Save
                      </button>
                      <button onClick={()=>{ setAddingNew(false); setNewRow({name:"",email:"",contact:"",location:""}); }}
                        style={{ ...css.btnSecondary, padding:"5px 10px", fontSize:12 }}>
                        <Icon d={Icons.x} size={13} color={T.muted} stroke/>
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* ── Existing Rows ── */}
              {filtered.length === 0 && !addingNew && (
                <tr><td colSpan={5} style={{ padding:40, textAlign:"center", color:T.subtle }}>No branches found.</td></tr>
              )}
              {filtered.map((b, i) => {
                const isEditing = editingId === b.id;
                return (
                  <tr key={b.id}
                    onClick={()=>{ if(!isEditing){ setSelectedBranch(b.id); if(!showMap) setShowMap(true); window.scrollTo({top:0,behavior:"smooth"}); }}}
                    style={{ borderBottom:`1px solid ${T.border}`, background: isEditing ? "rgba(34,197,138,.12)" : selectedBranch===b.id ? `${T.accent}08` : i%2===0 ? T.surface : T.surfaceAlt, transition:"background .1s", cursor:isEditing?"default":"pointer" }}>

                    {/* Branch Name */}
                    <td style={{ padding:"10px 14px", fontWeight: isEditing ? 400 : 600, color:T.text, minWidth:220 }}>
                      {isEditing
                        ? <input value={editForm.name||""} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))}
                            autoFocus style={{ ...css.input, fontSize:13, padding:"6px 10px", borderColor:T.accent }}
                            onKeyDown={e=>{ if(e.key==="Enter") saveEdit(); if(e.key==="Escape") cancelEdit(); }}/>
                        : b.name
                      }
                    </td>

                    {/* Email */}
                    <td style={{ padding:"10px 14px", color:T.muted, minWidth:180 }}>
                      {isEditing
                        ? <input value={editForm.email||""} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))}
                            type="email" style={{ ...css.input, fontSize:13, padding:"6px 10px" }}
                            onKeyDown={e=>{ if(e.key==="Enter") saveEdit(); if(e.key==="Escape") cancelEdit(); }}/>
                        : b.email || <span style={{ color:T.subtle }}>—</span>
                      }
                    </td>

                    {/* Contact */}
                    <td style={{ padding:"10px 14px", color:T.muted, minWidth:130 }}>
                      {isEditing
                        ? <input value={editForm.contact||""} onChange={e=>setEditForm(f=>({...f,contact:e.target.value}))}
                            placeholder="09XXXXXXXXX" style={{ ...css.input, fontSize:13, padding:"6px 10px" }}
                            onKeyDown={e=>{ if(e.key==="Enter") saveEdit(); if(e.key==="Escape") cancelEdit(); }}/>
                        : b.contact || <span style={{ color:T.subtle }}>—</span>
                      }
                    </td>

                    {/* Location */}
                    <td style={{ padding:"10px 14px", color:T.muted, minWidth:200, maxWidth:300 }}>
                      {isEditing
                        ? <input value={editForm.location||""} onChange={e=>setEditForm(f=>({...f,location:e.target.value}))}
                            style={{ ...css.input, fontSize:13, padding:"6px 10px" }}
                            onKeyDown={e=>{ if(e.key==="Enter") saveEdit(); if(e.key==="Escape") cancelEdit(); }}/>
                        : <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((b.name+", "+(b.location||"")).trim())}`} target="_blank" rel="noopener" title={`Open "${b.location}" in Google Maps`} style={{ display:"inline-flex", alignItems:"center", gap:6, maxWidth:280, color:T.info, textDecoration:"none", fontWeight:500 }}
                            onMouseEnter={e=>e.currentTarget.style.textDecoration="underline"} onMouseLeave={e=>e.currentTarget.style.textDecoration="none"}>
                            <Icon d={Icons.branch} size={13} color={T.info} stroke/>
                            <span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{b.location || "—"}</span>
                          </a>
                      }
                    </td>

                    {/* Actions */}
                    <td style={{ padding:"10px 14px", whiteSpace:"nowrap" }}>
                      {isEditing ? (
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={saveEdit}
                            style={{ ...css.btnPrimary, padding:"5px 14px", fontSize:12, gap:5 }}>
                            <Icon d={Icons.check} size={13} color="#fff" stroke/> Save
                          </button>
                          <button onClick={cancelEdit}
                            style={{ ...css.btnSecondary, padding:"5px 10px", fontSize:12 }}>
                            <Icon d={Icons.x} size={13} color={T.muted} stroke/>
                          </button>
                        </div>
                      ) : readOnly ? null : (
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={()=>startEdit(b)}
                            style={{ ...css.btnSecondary, padding:"5px 12px", fontSize:12, gap:5 }}>
                            <Icon d={Icons.edit} size={13} color={T.muted} stroke/> Edit
                          </button>
                          <button onClick={()=>deleteBranch(b.id)}
                            style={{ ...css.btnSecondary, padding:"5px 10px", fontSize:12, borderColor:"rgba(248,113,113,.4)", color:T.danger }}>
                            <Icon d={Icons.x} size={13} color={T.danger} stroke/>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop:12, fontSize:12, color:T.subtle }}>
          Tip: Click <strong>Edit</strong> to edit inline. Press <kbd style={{ background:T.border, borderRadius:4, padding:"1px 5px", fontSize:11 }}>Enter</kbd> to save or <kbd style={{ background:T.border, borderRadius:4, padding:"1px 5px", fontSize:11 }}>Esc</kbd> to cancel.
        </p>
      </div>
    </div>
  );
}

/* ─── ACCOUNTS PAGE ──────────────────────────────────────────────────────── */
function AccountsPage({ db }) {
  const { accounts, setAccounts } = db;
  const { registrations = [], setRegistrations, setClients, user, branchVets, setBranchVets } = db;
  const [newVet, setNewVet] = useState("");
  function addVet(branch){
    const name = newVet.trim();
    if(!name || !branch) return;
    const label = /^dr\.?\s/i.test(name) ? name.replace(/^dr\.?\s/i,"Dr. ") : `Dr. ${name}`;
    setBranchVets(p=>({ ...p, [branch]: [ ...(p[branch]||[]), label ] }));
    setNewVet(""); setToast(`${label} added to ${branch.replace("Pet Hub Veterinary ","")}.`);
  }
  function removeVet(branch, v){
    setBranchVets(p=>({ ...p, [branch]: (p[branch]||[]).filter(x=>x!==v) }));
    setToast(`${v} removed.`);
  }
  const isSuperAdmin = user?.email === "admin@pethub.ph";
  const pendingRegs = registrations.filter(r=>r.status==="Pending");
  const reviewedRegs = registrations.filter(r=>r.status!=="Pending");
  function approveReg(reg){
    setRegistrations && setRegistrations(p=>p.map(r=>r.id===reg.id?{...r,status:"Approved"}:r));
    if(reg.accountType==="Client"){
      setClients && setClients(p=> p.some(c=>(c.email||"").toLowerCase()===reg.email.toLowerCase()) ? p : [...p, { id:Date.now(), branch:reg.branch, email:reg.email, contact:reg.contact||"", name:reg.name, status:"Active" }]);
      setToast("Client approved — added to Clients & Pets.");
    } else {
      setAccounts(p=> p.some(a=>(a.email||"").toLowerCase()===reg.email.toLowerCase()) ? p : [...p, { id:Date.now(), branch:reg.branch, email:reg.email, accountName:reg.name.toUpperCase(), status:"Active", dateCreated:new Date().toISOString().slice(0,10) }]);
      setToast("Staff approved — added to Accounts and can now sign in.");
    }
  }
  function denyReg(id){ setRegistrations && setRegistrations(p=>p.map(r=>r.id===id?{...r,status:"Denied"}:r)); setToast("Account request denied."); }
  const [modal, setModal]       = useState(null); // null | "add" | "edit"
  const [form, setForm]         = useState({});
  const [toast, setToast]       = useState(null);

  function autoSave(updated) {
    if(!updated.branch||!updated.email) return;
    setAccounts(p=>p.map(a=>a.id===updated.id?{...updated}:a));
  }
  function setField(key, val) {
    const updated = {...form, [key]:val};
    setForm(updated);
    if(modal==="edit") autoSave(updated);
  }
  function save() {
    if(!form.branch||!form.email) return;
    if(modal==="add") setAccounts(p=>[...p,{...form,id:Date.now()}]);
    else setAccounts(p=>p.map(a=>a.id===form.id?{...form}:a));
    setModal(null); setToast(modal==="add"?"Account added.":"Account saved.");
  }
  function del(id) { setAccounts(p=>p.filter(a=>a.id!==id)); setToast("Account removed."); }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
      <PageHeader title="Accounts">
        <button onClick={()=>{setForm({branch:"",email:"",accountName:"",status:"Active",dateCreated:new Date().toISOString().slice(0,10)});setModal("add");}} style={css.btnPrimary}>
          <Icon d={Icons.plus} size={15} color="#fff" stroke/> Add Account
        </button>
      </PageHeader>
      {isSuperAdmin && (
        <div style={{ ...css.card, padding:"22px 24px", marginBottom:16, borderTop:`3px solid ${pendingRegs.length?T.warn:T.accent}` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:8 }}>
            <div>
              <p style={{ ...css.sectionLabel, marginBottom:2 }}>Account Access Requests</p>
              <p style={{ fontSize:12.5, color:T.muted }}>New sign-ups need your approval before they can access the portal.</p>
            </div>
            {pendingRegs.length>0
              ? <span style={{ fontSize:12, fontWeight:700, color:"#fff", background:T.warn, borderRadius:99, padding:"4px 12px" }}>{pendingRegs.length} pending</span>
              : <span style={{ fontSize:12, fontWeight:700, color:T.accent, background:`${T.accent}15`, borderRadius:99, padding:"4px 12px" }}>All reviewed</span>
            }
          </div>

          {pendingRegs.length===0 && reviewedRegs.length===0 && (
            <div style={{ background:T.bg, borderRadius:10, padding:"22px", textAlign:"center", color:T.subtle, fontSize:13 }}>
              No registration requests yet. When someone requests access from the login screen, they'll appear here.
            </div>
          )}

          {pendingRegs.map(r=>(
            <div key={r.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 16px", borderRadius:10, border:`1px solid ${T.warn}33`, background:`${T.warn}0a`, marginBottom:10, flexWrap:"wrap" }}>
              <div style={{ width:38, height:38, borderRadius:10, background:`${T.warn}1f`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon d={Icons.account} size={18} color={T.warn} stroke/>
              </div>
              <div style={{ flex:1, minWidth:180 }}>
                <p style={{ fontSize:14, fontWeight:700, color:T.text }}>{r.name}</p>
                <p style={{ fontSize:12.5, color:T.muted }}>{r.email}</p>
              </div>
              <div style={{ minWidth:150 }}>
                <p style={{ fontSize:12.5, color:T.text, fontWeight:600 }}>{r.accountType==="Client"?"Client":r.role}</p>
                <p style={{ fontSize:11.5, color:T.muted }}>{(r.branch||"").replace("Pet Hub Veterinary ","").replace("Clinic — ","").replace("Hospital — ","")}</p>
              </div>
              <span style={{ fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:".05em", borderRadius:6, padding:"4px 9px", color:r.accountType==="Client"?T.info:T.accentDark, background:r.accountType==="Client"?`${T.info}15`:`${T.accent}15`, flexShrink:0 }}>{r.accountType==="Client"?"→ Clients":"→ Accounts"}</span>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>approveReg(r)} style={{ ...css.btnPrimary, padding:"7px 16px", fontSize:12.5, gap:6 }}><Icon d={Icons.check} size={14} color="#fff" stroke/> Approve</button>
                <button onClick={()=>denyReg(r.id)} style={{ ...css.btnSecondary, padding:"7px 14px", fontSize:12.5, gap:6, borderColor:"rgba(248,113,113,.4)", color:T.danger }}><Icon d={Icons.x} size={14} color={T.danger} stroke/> Deny</button>
              </div>
            </div>
          ))}

          {reviewedRegs.length>0 && (
            <div style={{ marginTop:pendingRegs.length?8:0 }}>
              <p style={{ fontSize:11.5, fontWeight:700, color:T.subtle, textTransform:"uppercase", letterSpacing:".06em", margin:"6px 0 10px" }}>Reviewed</p>
              {reviewedRegs.map(r=>(
                <div key={r.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:9, border:`1px solid ${T.border}`, marginBottom:8 }}>
                  <div style={{ flex:1, minWidth:160 }}>
                    <p style={{ fontSize:13.5, fontWeight:600, color:T.text }}>{r.name} <span style={{ color:T.muted, fontWeight:400 }}>· {r.email}</span></p>
                    <p style={{ fontSize:11.5, color:T.muted }}>{r.accountType==="Client"?"Client":r.role}</p>
                  </div>
                  <Badge label={r.status} color={r.status==="Approved"?T.accent:T.danger}/>
                  {r.status==="Denied" && <button onClick={()=>approveReg(r)} style={{ ...css.btnSecondary, padding:"5px 12px", fontSize:12 }}>Approve</button>}
                  {r.status==="Approved" && <button onClick={()=>denyReg(r.id)} style={{ ...css.btnSecondary, padding:"5px 12px", fontSize:12, borderColor:"rgba(248,113,113,.4)", color:T.danger }}>Revoke</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ ...css.card, padding:"22px 24px" }}>
        <p style={css.sectionLabel}>Branch Accounts</p>
        <DataTable
          data={accounts}
          columns={[
            { key:"branch",      label:"Branch" },
            { key:"email",       label:"Email", muted:true },
            { key:"accountName", label:"Account Name" },
            { key:"vets", label:"Veterinarians", render:r=>(
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, maxWidth:220 }}>
                {vetsForBranch(r.branch, db.branchVets).map(v=>(
                  <span key={v} style={{ fontSize:11, fontWeight:600, color:"#fff", background:"rgba(255,255,255,.16)", border:"1px solid rgba(255,255,255,.35)", borderRadius:99, padding:"3px 9px", whiteSpace:"nowrap" }}>{v}</span>
                ))}
              </div>
            )},
            { key:"dateCreated", label:"Date Created", render:r=>{
              if(!r.dateCreated) return <span style={{color:T.subtle}}>—</span>;
              return <span style={{color:T.muted,fontSize:13}}>{new Date(r.dateCreated).toLocaleDateString("en-PH",{year:"numeric",month:"short",day:"numeric"})}</span>;
            }},
            { key:"status",      label:"Status", render:r=><Badge label={r.status} color={r.status==="Active"?T.accent:T.warn}/> },
          ]}
          actions={row=>(
            <div style={{ display:"flex",gap:6 }}>
              <button onClick={()=>{setForm({...row});setModal("edit");}}
                style={{...css.btnSecondary,padding:"5px 12px",fontSize:12,gap:5}}>
                <Icon d={Icons.edit} size={13} color={T.muted} stroke/> Edit
              </button>
              <button onClick={()=>del(row.id)}
                style={{...css.btnSecondary,padding:"5px 10px",fontSize:12,borderColor:"rgba(248,113,113,.4)",color:T.danger}}>
                <Icon d={Icons.x} size={13} color={T.danger} stroke/>
              </button>
            </div>
          )}
        />
      </div>
      {modal && (
        <Modal title={modal==="add"?"Add Account":"Edit Account"} onClose={()=>setModal(null)}>
          <Field label="Branch">
            <select value={form.branch||""} onChange={e=>setField("branch",e.target.value)} style={css.input}>
              <option value="">Select branch…</option>
              {db.branches.map(b=><option key={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Email Address"><input value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={css.input}/></Field>
          <Field label="Account Name"><input value={form.accountName||""} onChange={e=>setForm(f=>({...f,accountName:e.target.value}))} style={css.input}/></Field>
          <Field label="Veterinarians" hint="Doctors clients can choose when booking at this branch.">
            {!form.branch
              ? <p style={{ fontSize:12.5, color:T.subtle, padding:"8px 0" }}>Select a branch first to manage its doctors.</p>
              : <div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:10, minHeight:28 }}>
                    {(branchVets[form.branch]||[]).length===0 && <p style={{ fontSize:12.5, color:T.subtle }}>No veterinarians yet — add one below.</p>}
                    {(branchVets[form.branch]||[]).map(v=>(
                      <span key={v} style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, fontWeight:600, color:"#fff", background:"rgba(255,255,255,.16)", border:"1px solid rgba(255,255,255,.35)", borderRadius:99, padding:"4px 6px 4px 11px" }}>
                        {v}
                        <button type="button" onClick={()=>removeVet(form.branch, v)} title={`Remove ${v}`}
                          style={{ width:17, height:17, borderRadius:"50%", border:"none", background:`${T.danger}15`, color:T.danger, cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center", padding:0 }}>
                          <Icon d={Icons.x} size={10} color={T.danger} stroke/>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <input value={newVet} onChange={e=>setNewVet(e.target.value)}
                      onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); addVet(form.branch); } }}
                      placeholder="e.g. Dr. Maria Santos" style={{ ...css.input, fontSize:13 }}/>
                    <button type="button" onClick={()=>addVet(form.branch)} disabled={!newVet.trim()}
                      style={{ ...css.btnPrimary, padding:"8px 16px", fontSize:13, opacity:newVet.trim()?1:.5, flexShrink:0 }}>
                      <Icon d={Icons.plus} size={13} color="#fff" stroke/> Add
                    </button>
                  </div>
                </div>
            }
          </Field>
          <Field label="Date Created">
            <input type="date" value={form.dateCreated||new Date().toISOString().slice(0,10)}
              onChange={e=>setField("dateCreated", e.target.value)} style={css.input}/>
          </Field>
          <Field label="Status">
            <select value={form.status||"Active"} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={css.input}>
              <option>Active</option><option>Inactive</option>
            </select>
          </Field>
          <div style={{ display:"flex",gap:10,marginTop:4 }}>
            <button onClick={()=>setModal(null)} style={{...css.btnSecondary,flex:1,justifyContent:"center"}}>Cancel</button>
            <button onClick={save} style={{...css.btnPrimary,flex:1,justifyContent:"center"}}>Save Changes</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── PET DETAILS MODAL ──────────────────────────────────────────────────── */
function PetDetailsModal({ client, pets, setPets, db, onClose }) {
  const clientPets = pets.filter(p => p.clientId === client.id);
  const [selectedPet, setSelectedPet] = useState(clientPets[0] || null);
  const [editing, setEditing]         = useState(false);
  const [editForm, setEditForm]       = useState({});
  const [addingPet, setAddingPet]     = useState(false);
  const [newPet, setNewPet]           = useState({ name:"", species:"Dog", breed:"", gender:"Male", age:"", weight:"", color:"", birthday:"", notes:"", hasCard:false });
  const [toast, setToast]             = useState(null);

  const SPECIES = ["Dog","Cat","Bird","Rabbit","Fish","Hamster","Guinea Pig","Reptile","Other"];
  const GENDERS = ["Male","Female"];

  function startEdit() { setEditForm({...selectedPet}); setEditing(true); }
  function cancelEdit() { setEditing(false); setEditForm({}); }
  function saveEdit() {
    if (!editForm.name) return;
    setPets(prev => prev.map(p => p.id === editForm.id ? {...editForm} : p));
    setSelectedPet({...editForm});
    setEditing(false);
    setToast("Pet details updated.");
  }
  function deletePet(id) {
    setPets(prev => prev.filter(p => p.id !== id));
    const remaining = clientPets.filter(p => p.id !== id);
    setSelectedPet(remaining[0] || null);
    setToast("Pet removed.");
  }
  function saveNewPet() {
    if (!newPet.name.trim()) return;
    const created = {
      ...newPet,
      id: Date.now(),
      clientId: client.id,
      branch: client.branch,
      email: client.email,
      membershipDate: new Date().toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"}),
      printStatus: newPet.hasCard ? "Pending" : "N/A",
    };
    setPets(prev => [...prev, created]);
    setSelectedPet(created);
    setAddingPet(false);
    setNewPet({ name:"", species:"Dog", breed:"", gender:"Male", age:"", weight:"", color:"", birthday:"", notes:"", hasCard:false });
    setToast("Pet registered.");
  }

  const inpSm = { ...css.input, fontSize:13, padding:"7px 10px" };
  const currentPets = pets.filter(p => p.clientId === client.id);

  function InfoRow({ label, value }) {
    return (
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid ${T.border}`, fontSize:13.5 }}>
        <span style={{ color:T.muted, fontWeight:500, minWidth:120 }}>{label}</span>
        <span style={{ fontWeight:600, color:T.text, textAlign:"right" }}>{value || <span style={{ color:T.subtle }}>—</span>}</span>
      </div>
    );
  }

  function EditField({ label, field, type="text", options }) {
    function handleChange(val) {
      const updated = {...editForm, [field]: val};
      setEditForm(updated);
      // Auto-save immediately on every change
      if (updated.name) {
        setPets(prev => prev.map(p => p.id === updated.id ? {...updated} : p));
        setSelectedPet({...updated});
      }
    }
    return (
      <Field label={label}>
        {options
          ? <select value={editForm[field]||""} onChange={e=>handleChange(e.target.value)} style={inpSm}>
              {options.map(o=><option key={o}>{o}</option>)}
            </select>
          : <input type={type} value={editForm[field]||""} onChange={e=>handleChange(e.target.value)} style={inpSm}/>
        }
      </Field>
    );
  }

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(15,23,42,.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(2px)" }}>
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
      <div style={{ ...css.card, width:"100%", maxWidth:720, maxHeight:"92vh", display:"flex", flexDirection:"column", boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>

        {/* ── Header ── */}
        <div style={{ padding:"18px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".08em" }}>Client</p>
            <h3 style={{ fontSize:17, fontWeight:700, color:T.text, marginTop:2 }}>{client.name}</h3>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{ setAddingPet(true); setSelectedPet(null); setEditing(false); }}
              style={{ ...css.btnPrimary, padding:"7px 14px", fontSize:12.5, gap:6 }}>
              <Icon d={Icons.plus} size={13} color="#fff" stroke/> Add Pet
            </button>
            <button onClick={onClose} style={{ ...css.btnSecondary, padding:"7px 10px" }}>
              <Icon d={Icons.x} size={15} color={T.muted} stroke/>
            </button>
          </div>
        </div>

        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

          {/* ── Pet List Sidebar ── */}
          <div style={{ width:180, borderRight:`1px solid ${T.border}`, overflowY:"auto", flexShrink:0, padding:"12px 0" }}>
            {currentPets.length === 0 && !addingPet && (
              <p style={{ fontSize:12.5, color:T.subtle, padding:"12px 16px", lineHeight:1.5 }}>No pets yet.<br/>Click Add Pet.</p>
            )}
            {currentPets.map(p => (
              <button key={p.id} onClick={()=>{ setSelectedPet(p); setEditing(false); setAddingPet(false); }}
                style={{ width:"100%", padding:"10px 16px", border:"none", textAlign:"left", cursor:"pointer",
                  background: selectedPet?.id===p.id ? `${T.accent}12` : "transparent",
                  borderLeft: selectedPet?.id===p.id ? `3px solid ${T.accent}` : "3px solid transparent",
                  transition:"all .1s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                  <div style={{ width:30, height:30, borderRadius:8, background:`${T.accent}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon d={Icons.paw} size={14} color={T.accent} stroke/>
                  </div>
                  <div>
                    <p style={{ fontSize:13.5, fontWeight:600, color:T.text }}>{p.name}</p>
                    <p style={{ fontSize:11, color:T.muted }}>{p.species||"Pet"}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── Pet Detail / Edit Panel ── */}
          <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>

            {/* Add New Pet Form */}
            {addingPet && (
              <div>
                <p style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:16 }}>Register New Pet</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <Field label="Pet Name *"><input value={newPet.name} onChange={e=>setNewPet(p=>({...p,name:e.target.value}))} placeholder="e.g. Buddy" style={inpSm} autoFocus/></Field>
                  <Field label="Species">
                    <select value={newPet.species} onChange={e=>setNewPet(p=>({...p,species:e.target.value}))} style={inpSm}>
                      {SPECIES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Breed"><input value={newPet.breed} onChange={e=>setNewPet(p=>({...p,breed:e.target.value}))} placeholder="e.g. Golden Retriever" style={inpSm}/></Field>
                  <Field label="Gender">
                    <select value={newPet.gender} onChange={e=>setNewPet(p=>({...p,gender:e.target.value}))} style={inpSm}>
                      {GENDERS.map(g=><option key={g}>{g}</option>)}
                    </select>
                  </Field>
                  <Field label="Age"><input value={newPet.age} onChange={e=>setNewPet(p=>({...p,age:e.target.value}))} placeholder="e.g. 2" style={inpSm}/></Field>
                  <Field label="Weight"><input value={newPet.weight} onChange={e=>setNewPet(p=>({...p,weight:e.target.value}))} placeholder="e.g. 8 kg" style={inpSm}/></Field>
                  <Field label="Color / Markings"><input value={newPet.color} onChange={e=>setNewPet(p=>({...p,color:e.target.value}))} placeholder="e.g. Brown & White" style={inpSm}/></Field>
                  <Field label="Birthday"><input type="date" value={newPet.birthday} onChange={e=>setNewPet(p=>({...p,birthday:e.target.value}))} style={inpSm}/></Field>
                </div>
                <Field label="Notes / Medical History">
                  <textarea value={newPet.notes} onChange={e=>setNewPet(p=>({...p,notes:e.target.value}))} placeholder="Allergies, medications, special conditions…" style={{...inpSm,height:70,resize:"vertical"}}/>
                </Field>
                <Field label="Loyalty Card">
                  <select value={newPet.hasCard?"yes":"no"} onChange={e=>setNewPet(p=>({...p,hasCard:e.target.value==="yes"}))} style={inpSm}>
                    <option value="no">No Loyalty Card</option>
                    <option value="yes">With Loyalty Card</option>
                  </select>
                </Field>
                <div style={{ display:"flex", gap:10, marginTop:8 }}>
                  <button onClick={()=>setAddingPet(false)} style={{...css.btnSecondary,flex:1,justifyContent:"center"}}>Cancel</button>
                  <button onClick={saveNewPet} style={{...css.btnPrimary,flex:1,justifyContent:"center",opacity:newPet.name.trim()?1:.5}}>Register Pet</button>
                </div>
              </div>
            )}

            {/* No pet selected */}
            {!addingPet && !selectedPet && (
              <div style={{ padding:"48px 0", textAlign:"center", color:T.subtle }}>
                <Icon d={Icons.paw} size={40} color={T.subtle} stroke/>
                <p style={{ marginTop:14, fontSize:13.5 }}>Select a pet from the list to view details.</p>
              </div>
            )}

            {/* Pet Detail View */}
            {!addingPet && selectedPet && !editing && (
              <div>
                {/* Pet Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                    <label style={{ cursor:"pointer", position:"relative", flexShrink:0 }} title="Click to upload pet photo">
                      <div style={{ width:60, height:60, borderRadius:14, overflow:"hidden", background:`${T.accent}18`, display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${selectedPet.photo?T.accent:T.border}` }}>
                        {selectedPet.photo
                          ? <img src={selectedPet.photo} alt={selectedPet.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                          : <Icon d={Icons.paw} size={26} color={T.accent} stroke/>
                        }
                      </div>
                      <div style={{ position:"absolute", bottom:-4, right:-4, width:20, height:20, borderRadius:"50%", background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 1px 4px rgba(0,0,0,.2)" }}>
                        <Icon d={Icons.plus} size={11} color="#fff" stroke/>
                      </div>
                      <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => {
                          const updated = {...selectedPet, photo:ev.target.result};
                          setSelectedPet(updated);
                          setPets(prev=>prev.map(p=>p.id===selectedPet.id?updated:p));
                        };
                        reader.readAsDataURL(file);
                      }}/>
                    </label>
                    <div>
                      <h4 style={{ fontSize:19, fontWeight:800, color:T.text }}>{selectedPet.name}</h4>
                      <p style={{ fontSize:13, color:T.muted, marginTop:2 }}>{selectedPet.species}{selectedPet.breed ? ` · ${selectedPet.breed}` : ""}</p>
                      <p style={{ fontSize:11, color:selectedPet.photo?T.accent:T.subtle, marginTop:3 }}>{selectedPet.photo?"Photo uploaded":"Click photo to upload"}</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={startEdit} style={{...css.btnSecondary,padding:"6px 14px",fontSize:12.5,gap:6}}>
                      <Icon d={Icons.edit} size={13} color={T.muted} stroke/> Edit
                    </button>
                    <button onClick={()=>deletePet(selectedPet.id)} style={{...css.btnSecondary,padding:"6px 10px",borderColor:"rgba(248,113,113,.4)",color:T.danger}}>
                      <Icon d={Icons.x} size={13} color={T.danger} stroke/>
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
                  <Badge label={selectedPet.hasCard?"Has Loyalty Card":"No Loyalty Card"} color={selectedPet.hasCard?T.accent:T.warn}/>
                  <Badge label={`Print: ${selectedPet.printStatus}`} color={selectedPet.printStatus==="Printed"?T.accent:T.warn}/>
                </div>

                {/* QR Code */}
                <div style={{ display:"flex", alignItems:"flex-start", gap:20, marginBottom:20, padding:"16px 20px", background:T.bg, borderRadius:12, border:`1px solid ${T.border}` }}>
                  <div>
                    <p style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".07em", marginBottom:10 }}>Scannable QR Code</p>
                    <PetQRCode pet={selectedPet} size={130}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".07em", marginBottom:8 }}>How to use</p>
                    <p style={{ fontSize:13, color:T.muted, lineHeight:1.7 }}>
                      Print or show this QR code to staff.<br/>
                      Scan it on the <strong style={{ color:T.text }}>Transaction</strong> page using a USB scanner or camera to instantly pull up this pet's loyalty card and process points.
                    </p>
                    <div style={{ marginTop:12, display:"flex", gap:8, flexWrap:"wrap" }}>
                      <Badge label={`No: ${selectedPet.membershipNo||selectedPet.id}`} color={T.info}/>
                      <Badge label={selectedPet.hasCard?"Has Card":"No Card"} color={selectedPet.hasCard?T.accent:T.warn}/>
                    </div>
                    <div style={{ marginTop:14 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>Membership Number</p>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <input
                          value={selectedPet.membershipNo||""}
                          onChange={e=>{
                            const val = e.target.value;
                            setPets(prev=>prev.map(p=>p.id===selectedPet.id?{...p,membershipNo:val}:p));
                            setSelectedPet(prev=>({...prev,membershipNo:val}));
                          }}
                          placeholder="e.g. PH-0001"
                          style={{...css.input, fontSize:13, padding:"7px 10px", maxWidth:160, fontFamily:"monospace", fontWeight:700, letterSpacing:".05em"}}
                        />
                        <span style={{ fontSize:12, color:T.muted }}>← QR updates as you type</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div style={{ background:T.bg, borderRadius:10, padding:"4px 16px", marginBottom:16 }}>
                  <p style={{ ...css.sectionLabel, paddingTop:14 }}>Basic Information</p>
                  <InfoRow label="Gender"   value={selectedPet.gender}/>
                  <InfoRow label="Age"      value={selectedPet.age ? `${selectedPet.age} year(s)` : null}/>
                  <InfoRow label="Birthday" value={selectedPet.birthday}/>
                  <InfoRow label="Weight"   value={selectedPet.weight}/>
                  <InfoRow label="Color / Markings" value={selectedPet.color}/>
                </div>

                <div style={{ background:T.bg, borderRadius:10, padding:"4px 16px", marginBottom:16 }}>
                  <p style={{ ...css.sectionLabel, paddingTop:14 }}>Membership</p>
                  <InfoRow label="Membership No."  value={selectedPet.membershipNo}/>
                  <InfoRow label="Branch"          value={selectedPet.branch}/>
                  <InfoRow label="Membership Date" value={selectedPet.membershipDate}/>
                </div>

                {selectedPet.notes && (
                  <div style={{ background:"#fffbeb", borderRadius:10, padding:"14px 16px", border:`1px solid #fde68a` }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"#92400e", textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>Notes / Medical History</p>
                    <p style={{ fontSize:13.5, color:"#78350f", lineHeight:1.6 }}>{selectedPet.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Pet Edit Form */}
            {!addingPet && selectedPet && editing && (
              <div>
                <p style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom:16 }}>Edit — {selectedPet.name}</p>
                <div style={{ background:`${T.accent}08`, borderRadius:9, padding:"12px 14px", marginBottom:14, border:`1px solid ${T.accent}22` }}>
                  <p style={{ fontSize:11, fontWeight:700, color:T.accent, textTransform:"uppercase", letterSpacing:".07em", marginBottom:8 }}>QR / Membership Number</p>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <input value={editForm.membershipNo||""} onChange={e=>setEditForm(f=>({...f,membershipNo:e.target.value}))}
                      placeholder="e.g. PH-0001"
                      style={{...css.input, fontSize:13, padding:"7px 10px", maxWidth:180, fontFamily:"monospace", fontWeight:700, letterSpacing:".05em"}}/>
                    <span style={{ fontSize:12, color:T.muted }}>This number is encoded in the QR code</span>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <EditField label="Pet Name *"  field="name"/>
                  <EditField label="Species"     field="species" options={SPECIES}/>
                  <EditField label="Breed"       field="breed"/>
                  <EditField label="Gender"      field="gender" options={GENDERS}/>
                  <EditField label="Age"         field="age"/>
                  <EditField label="Weight"      field="weight"/>
                  <EditField label="Color"       field="color"/>
                  <EditField label="Birthday"    field="birthday" type="date"/>
                </div>
                <Field label="Notes / Medical History">
                  <textarea value={editForm.notes||""} onChange={e=>{
                    const updated = {...editForm, notes:e.target.value};
                    setEditForm(updated);
                    if(updated.name){ setPets(prev=>prev.map(p=>p.id===updated.id?{...updated}:p)); setSelectedPet({...updated}); }
                  }} style={{...inpSm,height:70,resize:"vertical"}}/>
                </Field>
                <Field label="Loyalty Card">
                  <select value={editForm.hasCard?"yes":"no"} onChange={e=>setEditForm(f=>({...f,hasCard:e.target.value==="yes"}))} style={inpSm}>
                    <option value="no">No Loyalty Card</option>
                    <option value="yes">With Loyalty Card</option>
                  </select>
                </Field>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginTop:8,padding:"10px 14px",background:"rgba(34,197,138,.12)",borderRadius:9,border:`1px solid ${T.accent}30` }}>
                  <Icon d={Icons.check} size={14} color={T.accent} stroke/>
                  <p style={{ fontSize:12.5,color:T.accent,fontWeight:600,flex:1 }}>Changes are saved automatically</p>
                  <button onClick={()=>setEditing(false)} style={{...css.btnPrimary,padding:"6px 16px",fontSize:12.5}}>Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── CLIENTS PAGE ───────────────────────────────────────────────────────── */
function ClientsPage({ db }) {
  const { clients, setClients, pets, setPets } = db;
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({});
  const [petsFor, setPetsFor]   = useState(null);
  const [toast, setToast]       = useState(null);

  function autoSave(updated) {
    if(!updated.name) return;
    setClients(p=>p.map(c=>c.id===updated.id?{...updated}:c));
  }
  function setField(key, val) {
    const updated = {...form, [key]:val};
    setForm(updated);
    if(modal==="edit") autoSave(updated);
  }
  function save() {
    if(!form.name) return;
    if(modal==="add") {
      const newId = Date.now();
      const newClient = { branch:form.branch, email:form.email, contact:form.contact, name:form.name, status:form.status||"Active", id:newId };
      setClients(p=>[...p, newClient]);
      // Register pets linked to this new client
      const newPets = (form.pets||[]).filter(p=>p.name.trim()).map((p,i)=>({
        id: newId + i + 1,
        clientId: newId,
        name: p.name.trim(),
        hasCard: p.hasCard||false,
        branch: form.branch||"",
        email: form.email||"",
        membershipDate: new Date().toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"}),
        printStatus: p.hasCard ? "Pending" : "N/A",
      }));
      if(newPets.length > 0) setPets(p=>[...p, ...newPets]);
    } else {
      setClients(p=>p.map(c=>c.id===form.id?{...form}:c));
    }
    setModal(null); setToast(modal==="add"?"Client registered successfully.":"Client updated.");
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
      <PageHeader title="Clients">
        <button onClick={()=>{setForm({branch:"",email:"",contact:"",name:"",status:"Active",pets:[]});setModal("add");}} style={css.btnPrimary}>
          <Icon d={Icons.plus} size={15} color="#fff" stroke/> Add Client
        </button>
      </PageHeader>
      <div style={{ ...css.card, padding:"22px 24px" }}>
        <p style={css.sectionLabel}>Client List</p>
        <DataTable
          data={clients}
          columns={[
            { key:"branch",  label:"Branch" },
            { key:"email",   label:"Email",   muted:true },
            { key:"contact", label:"Contact", muted:true },
            { key:"name",    label:"Client Name" },
            { key:"status",  label:"Status",  render:r=><Badge label={r.status} color={r.status==="Active"?T.accent:T.warn}/> },
          ]}
          actions={row=>(
            <div style={{ display:"flex",gap:6 }}>
              <button onClick={()=>setPetsFor(row)} title="View Pets"
                style={{...css.btnSmall,background:`${T.accent}18`,color:T.accent,border:`1px solid ${T.accent}30`,padding:"5px 10px"}}>
                <Icon d={Icons.paw} size={13} color={T.accent} stroke/>
              </button>
              <button onClick={()=>{setForm({...row});setModal("edit");}}
                style={{...css.btnSecondary,padding:"5px 12px",fontSize:12,gap:5}}>
                <Icon d={Icons.edit} size={13} color={T.muted} stroke/> Edit
              </button>
              <button onClick={()=>{ setClients(p=>p.filter(c=>c.id!==row.id)); setPets(p=>p.filter(p=>p.clientId!==row.id)); setToast("Client and their pets removed."); }}
                style={{...css.btnSecondary,padding:"5px 10px",fontSize:12,borderColor:"rgba(248,113,113,.4)",color:T.danger}}>
                <Icon d={Icons.x} size={13} color={T.danger} stroke/>
              </button>
            </div>
          )}
        />
      </div>

      {(modal==="add"||modal==="edit") && (
        <Modal title={modal==="add"?"Add Client":"Edit Client"} onClose={()=>setModal(null)} width={520}>
          {/* ── Divider: Client Info ── */}
          <p style={{ fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:12,paddingBottom:8,borderBottom:`1px solid ${T.border}` }}>Client Information</p>
          <Field label="Branch">
            <select value={form.branch||""} onChange={e=>setForm(f=>({...f,branch:e.target.value}))} style={css.input}>
              <option value="">Select branch…</option>
              {db.branches.map(b=><option key={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Full Name"><input value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Juan Dela Cruz" style={css.input}/></Field>
            <Field label="Contact Number"><input value={form.contact||""} onChange={e=>setForm(f=>({...f,contact:e.target.value}))} placeholder="09XXXXXXXXX" style={css.input}/></Field>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Email Address"><input value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com" style={css.input}/></Field>
            <Field label="Status">
              <select value={form.status||"Active"} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={css.input}>
                <option>Active</option><option>Inactive</option>
              </select>
            </Field>
          </div>

          {/* ── Divider: Pet Registration ── */}
          <div style={{ marginTop:8,marginBottom:12,paddingTop:16,borderTop:`1px solid ${T.border}` }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
              <p style={{ fontSize:11,fontWeight:700,color:T.muted,textTransform:"uppercase",letterSpacing:".08em" }}>Pet Registration</p>
              {modal==="add" && (
                <button onClick={()=>setForm(f=>({...f,pets:[...(f.pets||[]),{name:"",species:"Dog",breed:"",gender:"Male",age:"",weight:"",color:"",birthday:"",notes:"",hasCard:false,expanded:true,tempId:Date.now()+Math.random()}]}))}
                  style={{...css.btnPrimary,padding:"4px 12px",fontSize:12,gap:5}}>
                  <Icon d={Icons.plus} size={12} color="#fff" stroke/> Add Pet
                </button>
              )}
            </div>
            {modal==="add" && (form.pets||[]).length===0 && (
              <div style={{ background:T.bg,borderRadius:8,padding:"14px 16px",textAlign:"center",color:T.subtle,fontSize:13 }}>
                No pets added yet. Click <strong>Add Pet</strong> to register a pet for this client.
              </div>
            )}
            {modal==="add" && (form.pets||[]).map((pet,i)=>{
              const isExp = pet.expanded;
              function upd(field, val) { setForm(f=>({...f,pets:f.pets.map((p,j)=>j===i?{...p,[field]:val}:p)})); }
              const inpP = {...css.input,fontSize:12.5,padding:"6px 9px"};
              const SPEC = ["Dog","Cat","Bird","Rabbit","Fish","Hamster","Guinea Pig","Reptile","Other"];
              return (
                <div key={pet.tempId} style={{ background:T.bg,borderRadius:10,marginBottom:10,border:`1px solid ${T.border}`,overflow:"hidden" }}>
                  {/* ── Collapsed Header ── */}
                  <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px" }}>
                    <div style={{ width:30,height:30,borderRadius:8,background:`${T.accent}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <Icon d={Icons.paw} size={14} color={T.accent} stroke/>
                    </div>
                    <input value={pet.name} onChange={e=>upd("name",e.target.value)}
                      placeholder="Pet name *" style={{...inpP,flex:1,fontWeight:600,background:"#fff"}}/>
                    <select value={pet.species||"Dog"} onChange={e=>upd("species",e.target.value)} style={{...inpP,width:110,background:"#fff"}}>
                      {SPEC.map(s=><option key={s}>{s}</option>)}
                    </select>
                    <button onClick={()=>upd("expanded",!isExp)}
                      title={isExp?"Collapse":"Expand details"}
                      style={{...css.btnSecondary,padding:"5px 10px",fontSize:12,gap:5,background:"#fff",flexShrink:0}}>
                      <Icon d={isExp?Icons.chevronD:Icons.chevronR} size={13} color={T.muted} stroke/>
                      {isExp?"Less":"More"}
                    </button>
                    <button onClick={()=>setForm(f=>({...f,pets:f.pets.filter((_,j)=>j!==i)}))}
                      style={{background:"none",border:"none",cursor:"pointer",color:T.danger,padding:4,flexShrink:0}}>
                      <Icon d={Icons.x} size={15} color={T.danger} stroke/>
                    </button>
                  </div>

                  {/* ── Expanded Details ── */}
                  {isExp && (
                    <div style={{ padding:"0 14px 14px",borderTop:`1px solid ${T.border}`,paddingTop:12 }}>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10 }}>
                        <div>
                          <label style={{ display:"block",fontSize:11,fontWeight:600,color:T.muted,marginBottom:4 }}>Breed</label>
                          <input value={pet.breed||""} onChange={e=>upd("breed",e.target.value)} placeholder="e.g. Shiba Inu" style={inpP}/>
                        </div>
                        <div>
                          <label style={{ display:"block",fontSize:11,fontWeight:600,color:T.muted,marginBottom:4 }}>Gender</label>
                          <select value={pet.gender||"Male"} onChange={e=>upd("gender",e.target.value)} style={inpP}>
                            <option>Male</option><option>Female</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display:"block",fontSize:11,fontWeight:600,color:T.muted,marginBottom:4 }}>Age</label>
                          <input value={pet.age||""} onChange={e=>upd("age",e.target.value)} placeholder="e.g. 2" style={inpP}/>
                        </div>
                        <div>
                          <label style={{ display:"block",fontSize:11,fontWeight:600,color:T.muted,marginBottom:4 }}>Weight</label>
                          <input value={pet.weight||""} onChange={e=>upd("weight",e.target.value)} placeholder="e.g. 8 kg" style={inpP}/>
                        </div>
                        <div>
                          <label style={{ display:"block",fontSize:11,fontWeight:600,color:T.muted,marginBottom:4 }}>Color</label>
                          <input value={pet.color||""} onChange={e=>upd("color",e.target.value)} placeholder="e.g. Brown" style={inpP}/>
                        </div>
                        <div>
                          <label style={{ display:"block",fontSize:11,fontWeight:600,color:T.muted,marginBottom:4 }}>Birthday</label>
                          <input type="date" value={pet.birthday||""} onChange={e=>upd("birthday",e.target.value)} style={inpP}/>
                        </div>
                      </div>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                        <div>
                          <label style={{ display:"block",fontSize:11,fontWeight:600,color:T.muted,marginBottom:4 }}>Loyalty Card</label>
                          <select value={pet.hasCard?"yes":"no"} onChange={e=>upd("hasCard",e.target.value==="yes")} style={inpP}>
                            <option value="no">No Loyalty Card</option>
                            <option value="yes">With Loyalty Card</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display:"block",fontSize:11,fontWeight:600,color:T.muted,marginBottom:4 }}>Notes / Medical</label>
                          <input value={pet.notes||""} onChange={e=>upd("notes",e.target.value)} placeholder="Allergies, conditions…" style={inpP}/>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {modal==="edit" && (
              <div style={{ background:T.bg,borderRadius:8,padding:"12px 16px",fontSize:13,color:T.muted }}>
                {pets.filter(p=>p.clientId===form.id).length===0
                  ? "No pets registered for this client."
                  : pets.filter(p=>p.clientId===form.id).map(p=>(
                    <div key={p.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${T.border}` }}>
                      <Icon d={Icons.paw} size={14} color={T.accent} stroke/>
                      <span style={{ fontWeight:600,color:T.text }}>{p.name}</span>
                      <Badge label={p.hasCard?"Has Card":"No Card"} color={p.hasCard?T.accent:T.warn}/>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          <div style={{ display:"flex",gap:10,marginTop:4 }}>
            {modal==="edit"
              ? <>
                  <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(34,197,138,.12)",borderRadius:9,border:`1px solid ${T.accent}30`,flex:1 }}>
                    <Icon d={Icons.check} size={14} color={T.accent} stroke/>
                    <p style={{ fontSize:12.5,color:T.accent,fontWeight:600 }}>Auto-saved</p>
                  </div>
                  <button onClick={()=>setModal(null)} style={{...css.btnPrimary,padding:"9px 20px",justifyContent:"center"}}>Done</button>
                </>
              : <>
                  <button onClick={()=>setModal(null)} style={{...css.btnSecondary,flex:1,justifyContent:"center"}}>Cancel</button>
                  <button onClick={save} style={{...css.btnPrimary,flex:1,justifyContent:"center"}}>Register Client</button>
                </>
            }
          </div>
        </Modal>
      )}

      {petsFor && (
        <PetDetailsModal
          client={petsFor}
          pets={pets}
          setPets={setPets}
          db={db}
          onClose={()=>setPetsFor(null)}
        />
      )}
    </div>
  );
}

/* ─── PROMOTIONS PAGE ────────────────────────────────────────────────────── */
function PromotionsPage({ db }) {
  const { promotions: promos, setPromotions: setPromos, clients, branches } = db;
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState({});
  const [sendModal, setSendModal] = useState(null); // promo being sent
  const [selectedIds, setSelectedIds] = useState([]); // client ids to send to
  const [recipSearch, setRecipSearch] = useState("");
  const [recipBranch, setRecipBranch] = useState([]); // [] = all branches
  const [sending, setSending]     = useState(false);
  const [sentLog, setSentLog]     = useState(null);  // {promo, emails}
  const [toast, setToast]         = useState(null);

  function setField(key, val) {
    const updated = {...form, [key]:val};
    setForm(updated);
    if(modal==="edit" && updated.title) setPromos(p=>p.map(pr=>pr.id===updated.id?{...updated}:pr));
  }
  function save() {
    if(!form.title) return;
    if(modal==="add") setPromos(p=>[...p,{...form,id:Date.now(),sendings:0,logs:[]}]);
    setModal(null); setToast("Promotion saved.");
  }

  function handleSend(promo) {
    setSelectedIds(clients.map(c=>c.id)); // default: everyone selected
    setRecipSearch(""); setRecipBranch([]);
    setSendModal(promo);
  }

  function toggleRecipient(id){ setSelectedIds(p=> p.includes(id) ? p.filter(x=>x!==id) : [...p, id]); }

  function confirmSend() {
    if(!sendModal) return;
    setSending(true);
    const recipients = clients.filter(c=>selectedIds.includes(c.id));
    const emails = recipients.map(c=>c.email).filter(Boolean);
    // Simulate sending (in real app this calls an email API)
    setTimeout(()=>{
      setPromos(p=>p.map(pr=>{
        if(pr.id!==sendModal.id) return pr;
        const newLog = {
          id: Date.now(),
          date: new Date().toLocaleString(),
          recipients: emails.length,
          emails,
        };
        return {
          ...pr,
          sendings: clients.length,
          logs: [...(pr.logs||[]), newLog],
        };
      }));
      setSentLog({ promo:sendModal, emails });
      setSendModal(null);
      setSending(false);
      setToast(`Promotion sent to ${emails.length} client${emails.length!==1?"s":""}!`);
    }, 1500);
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
      <PageHeader title="Promotions">
        <button onClick={()=>{setForm({title:"",details:"",status:"Active"});setModal("add");}} style={css.btnPrimary}>
          <Icon d={Icons.plus} size={15} color="#fff" stroke/> New Promotion
        </button>
      </PageHeader>

      <div style={{ ...css.card, padding:"22px 24px" }}>
        <p style={css.sectionLabel}>All Promotions</p>
        <DataTable
          data={promos}
          columns={[
            { key:"title",    label:"Promotion Title" },
            { key:"details",  label:"Details", render:r=>(
              r.details
                ? <span style={{ color:T.text, fontSize:13, maxWidth:220, display:"block", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }} title={r.details}>{r.details}</span>
                : <span style={{ color:T.subtle, fontSize:12, fontStyle:"italic" }}>No details</span>
            )},
            { key:"status",   label:"Status",   render:r=><Badge label={r.status} color={r.status==="Active"?T.accent:T.warn}/> },
            { key:"sendings", label:"Total Sent", render:r=>(
              <span style={{ fontWeight:700, color:T.text }}>{(r.sendings||0).toLocaleString()} <span style={{ fontWeight:400, color:T.muted, fontSize:12 }}>/ {clients.length} clients</span></span>
            )},
          ]}
          actions={row=>(
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={()=>handleSend(row)}
                disabled={row.status!=="Active"}
                style={{ ...css.btnPrimary, padding:"5px 14px", fontSize:12, gap:6, opacity:row.status==="Active"?1:.4 }}>
                <Icon d={Icons.promo} size={13} color="#fff" stroke/> Send
              </button>
              <button onClick={()=>{setForm({...row});setModal("edit");}}
                style={{...css.btnSecondary,padding:"5px 12px",fontSize:12,gap:5}}>
                <Icon d={Icons.edit} size={13} color={T.muted} stroke/>
              </button>
              <button onClick={()=>{ setPromos(p=>p.filter(pr=>pr.id!==row.id)); setToast("Promotion removed."); }}
                style={{...css.btnSecondary,padding:"5px 10px",fontSize:12,borderColor:"rgba(248,113,113,.4)",color:T.danger}}>
                <Icon d={Icons.x} size={13} color={T.danger} stroke/>
              </button>
            </div>
          )}
        />
      </div>

      {/* ── Add/Edit Modal ── */}
      {modal && (
        <Modal title={modal==="add"?"New Promotion":"Edit Promotion"} onClose={()=>setModal(null)}>
          <Field label="Promotion Title">
            <input value={form.title||""} onChange={e=>setField("title",e.target.value)} style={css.input} placeholder="e.g. Free Grooming Month"/>
          </Field>
          <Field label="Details" hint="This message will be included in the promotion email sent to clients.">
            <textarea value={form.details||""} onChange={e=>setField("details",e.target.value)}
              placeholder="e.g. Get 20% off on all grooming services this month! Valid until June 30, 2026."
              style={{...css.input, height:90, resize:"vertical"}}/>
          </Field>
          <Field label="Status">
            <select value={form.status||"Active"} onChange={e=>setField("status",e.target.value)} style={css.input}>
              <option>Active</option><option>Inactive</option>
            </select>
          </Field>
          {modal==="edit"
            ? <div style={{ display:"flex",alignItems:"center",gap:10,marginTop:8,padding:"10px 14px",background:"rgba(34,197,138,.12)",borderRadius:9,border:`1px solid ${T.accent}30` }}>
                <Icon d={Icons.check} size={14} color={T.accent} stroke/>
                <p style={{ fontSize:12.5,color:T.accent,fontWeight:600,flex:1 }}>Changes are saved automatically</p>
                <button onClick={()=>setModal(null)} style={{...css.btnPrimary,padding:"6px 16px",fontSize:12.5}}>Done</button>
              </div>
            : <div style={{ display:"flex",gap:10,marginTop:4 }}>
                <button onClick={()=>setModal(null)} style={{...css.btnSecondary,flex:1,justifyContent:"center"}}>Cancel</button>
                <button onClick={save} style={{...css.btnPrimary,flex:1,justifyContent:"center"}}>Add Promotion</button>
              </div>
          }
        </Modal>
      )}

      {/* ── Send Confirmation Modal ── */}
      {sendModal && (
        <Modal title="Send Promotion" onClose={()=>!sending&&setSendModal(null)} width={460}>
          <div style={{ background:`${T.accent}0e`, borderRadius:10, padding:"16px 18px", marginBottom:18, border:`1px solid ${T.accent}20` }}>
            <p style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".07em", marginBottom:4 }}>Promotion</p>
            <p style={{ fontSize:15, fontWeight:700, color:T.text, marginBottom: sendModal.details ? 10 : 0 }}>{sendModal.title}</p>
            {sendModal.details && (
              <div style={{ borderTop:`1px solid ${T.accent}20`, paddingTop:10, marginTop:4 }}>
                <p style={{ fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".07em", marginBottom:6 }}>Message / Details</p>
                <p style={{ fontSize:13.5, color:T.text, lineHeight:1.6, background:"#fff", borderRadius:8, padding:"10px 12px", border:`1px solid ${T.border}` }}>{sendModal.details}</p>
              </div>
            )}
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:10, flexWrap:"wrap" }}>
            <p style={{ fontSize:13, color:T.muted, lineHeight:1.6 }}>
              Sending to <strong style={{ color:T.text }}>{selectedIds.length} of {clients.length} client{clients.length!==1?"s":""}</strong>
            </p>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setSelectedIds(clients.filter(c=>recipBranch.length===0||recipBranch.includes(c.branch)).map(c=>c.id))} style={{ ...css.btnSecondary, padding:"4px 10px", fontSize:12 }}>Select all</button>
              <button onClick={()=>setSelectedIds([])} style={{ ...css.btnSecondary, padding:"4px 10px", fontSize:12 }}>Clear</button>
            </div>
          </div>

          <div style={{ marginBottom:10 }}>
            <input value={recipSearch} onChange={e=>setRecipSearch(e.target.value)} placeholder="Search clients…" style={{ ...css.input, fontSize:13, marginBottom:8 }}/>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {(()=>{ const all=recipBranch.length===0; return (
                <button onClick={()=>{ setRecipBranch([]); setSelectedIds(clients.map(c=>c.id)); }} style={{ fontSize:11.5, fontWeight:600, borderRadius:99, padding:"5px 12px", cursor:"pointer", border:`1px solid ${all?T.accent:T.border}`, background:all?T.accent:"transparent", color:all?"#fff":T.muted }}>All Branches</button>
              ); })()}
              {branches.map(b=>{ const on=recipBranch.includes(b.name); return (
                <button key={b.id} onClick={()=>{ const next=on?recipBranch.filter(x=>x!==b.name):[...recipBranch,b.name]; setRecipBranch(next); setSelectedIds(clients.filter(c=>next.length===0||next.includes(c.branch)).map(c=>c.id)); }}
                  style={{ fontSize:11.5, fontWeight:600, borderRadius:99, padding:"5px 12px", cursor:"pointer", border:`1px solid ${on?T.accent:T.border}`, background:on?T.accent:"transparent", color:on?"#fff":T.muted }}>
                  {b.name.replace("Pet Hub Veterinary ","").replace("Clinic — ","").replace("Hospital — ","")}
                </button>
              ); })}
            </div>
          </div>

          {/* Recipient selection list */}
          <div style={{ maxHeight:180, overflowY:"auto", borderRadius:9, border:`1px solid ${T.border}`, marginBottom:18 }}>
            {clients.length===0
              ? <p style={{ padding:"16px", color:T.subtle, fontSize:13, textAlign:"center" }}>No registered clients found.</p>
              : clients.filter(c=>{ const q=recipSearch.toLowerCase(); return (recipBranch.length===0||recipBranch.includes(c.branch)) && (!q || c.name.toLowerCase().includes(q) || (c.email||"").toLowerCase().includes(q)); }).map((c,i,arr)=>{
                const checked = selectedIds.includes(c.id);
                return (
                <label key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none", fontSize:13, cursor:"pointer", background:checked?"transparent":T.surfaceAlt }}>
                  <input type="checkbox" checked={checked} onChange={()=>toggleRecipient(c.id)} style={{ accentColor:T.accent, width:16, height:16, flexShrink:0, cursor:"pointer" }}/>
                  <div style={{ width:28, height:28, borderRadius:7, background:`${T.accent}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, opacity:checked?1:.45 }}>
                    <Icon d={Icons.account} size={13} color={T.accent} stroke/>
                  </div>
                  <div style={{ opacity:checked?1:.55 }}>
                    <p style={{ fontWeight:600, color:T.text, fontSize:13 }}>{c.name}</p>
                    <p style={{ color:T.muted, fontSize:11.5 }}>{c.email}</p>
                  </div>
                </label>
              );})
            }
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={()=>setSendModal(null)} disabled={sending}
              style={{...css.btnSecondary, flex:1, justifyContent:"center", opacity:sending?.5:1}}>
              Cancel
            </button>
            <button onClick={confirmSend} disabled={sending||selectedIds.length===0}
              style={{...css.btnPrimary, flex:1, justifyContent:"center", gap:8, opacity:(sending||selectedIds.length===0)?.5:1}}>
              {sending
                ? <><span style={{ display:"inline-block", width:14, height:14, border:"2px solid rgba(255,255,255,.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .7s linear infinite" }}/> Sending…</>
                : <><Icon d={Icons.promo} size={14} color="#fff" stroke/> {selectedIds.length===clients.length ? "Send to All Clients" : `Send to ${selectedIds.length} Selected`}</>
              }
            </button>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </Modal>
      )}

      {/* ── Sent Success Modal ── */}
      {sentLog && (
        <Modal title="Promotion Sent!" onClose={()=>setSentLog(null)} width={460}>
          <div style={{ textAlign:"center", padding:"8px 0 20px" }}>
            <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(34,197,138,.12)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
              <Icon d={Icons.check} size={28} color={T.accent} stroke/>
            </div>
            <p style={{ fontSize:17, fontWeight:800, color:T.text, marginBottom:6 }}>Successfully Sent!</p>
            <p style={{ fontSize:13.5, color:T.muted, marginBottom: sentLog.promo.details ? 10 : 0 }}>
              <strong style={{ color:T.text }}>{sentLog.promo.title}</strong> was sent to <strong style={{ color:T.accent }}>{sentLog.emails.length}</strong> client{sentLog.emails.length!==1?"s":""}.
            </p>
            {sentLog.promo.details && (
              <p style={{ fontSize:12.5, color:T.muted, fontStyle:"italic", background:T.bg, borderRadius:8, padding:"8px 12px", border:`1px solid ${T.border}` }}>"{sentLog.promo.details}"</p>
            )}
          </div>
          <div style={{ background:T.bg, borderRadius:9, padding:"12px 16px", marginBottom:18, maxHeight:160, overflowY:"auto" }}>
            {sentLog.emails.map((email,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:i<sentLog.emails.length-1?`1px solid ${T.border}`:"none", fontSize:13 }}>
                <Icon d={Icons.check} size={12} color={T.accent} stroke/>
                <span style={{ color:T.muted }}>{email}</span>
              </div>
            ))}
          </div>
          <button onClick={()=>setSentLog(null)} style={{...css.btnPrimary,width:"100%",justifyContent:"center"}}>Done</button>
        </Modal>
      )}
    </div>
  );
}


/* ─── TRANSACTION HISTORY PAGE ───────────────────────────────────────────── */
function AppointmentsPage({ db }) {
  const { transactions, setTransactions, pets, clients, branches } = db;
  const [toast, setToast]     = useState(null);
  const [fBranch, setFBranch] = useState("All");
  const [fType, setFType]     = useState("All");
  const [fMonth, setFMonth]   = useState("All");
  const [fSearch, setFSearch] = useState("");
  const [viewReceipt, setViewReceipt] = useState(null);
  const [groupMode, setGroupMode] = useState("pet"); // pet | list
  const [openGroup, setOpenGroup] = useState(null);

  const petOf    = id => pets.find(p=>p.id===id);
  const clientOf = pid => { const p=petOf(pid); return p ? clients.find(c=>c.id===p.clientId) : null; };

  const enriched = useMemo(()=>transactions.map(t=>{
    const p = petOf(t.petId), c = clientOf(t.petId);
    return { ...t, petLabel:p?.name||"—", clientLabel:c?.name||"—", branch:p?.branch||"—",
      type: (t.pointsUsed||0)>0 ? "Redeemed" : "Earned" };
  }), [transactions, pets, clients]);

  const filtered = useMemo(()=>{
    const q = fSearch.toLowerCase();
    return enriched.filter(t=>
      (fBranch==="All" || t.branch===fBranch) &&
      (fType==="All" || t.type===fType) &&
      (fMonth==="All" || String(t.date).slice(0,7)===fMonth) &&
      (!q || t.petLabel.toLowerCase().includes(q) || t.clientLabel.toLowerCase().includes(q) || String(t.transactionId).includes(q) || (t.transactBy||"").toLowerCase().includes(q))
    ).sort((a,b)=> (a.date<b.date?1:-1));
  }, [enriched, fBranch, fType, fMonth, fSearch]);

  const monthOptions = useMemo(()=>{
    const set = new Set(transactions.map(t=>String(t.date).slice(0,7)).filter(Boolean));
    return [...set].sort().reverse();
  }, [transactions]);
  const monthLabel = m => new Date(m+"-01").toLocaleDateString("en-PH",{month:"long",year:"numeric"});

  const totalRevenue = filtered.reduce((s,t)=>s+(t.amount||0),0);
  const totalEarned  = filtered.reduce((s,t)=>s+(t.pointsGained||0),0);
  const totalRedeemed= filtered.reduce((s,t)=>s+(t.pointsUsed||0),0);

  function removeTxn(id){ setTransactions(p=>p.filter(t=>t.id!==id)); setToast("Transaction deleted."); }

  function exportCSV(){
    const esc = v => `"${String(v??"").replace(/"/g,'""')}"`;
    const scope = (fBranch==="All" ? "All-Branches" : shortBranch(fBranch).replace(/\s+/g,"-")) + (fMonth==="All" ? "" : "-"+fMonth) + (groupMode==="pet"?"-ByPet":"");
    const totalRev = filtered.reduce((s,t)=>s+(t.amount||0),0);
    const totalG = filtered.reduce((s,t)=>s+(t.pointsGained||0),0);
    const totalU = filtered.reduce((s,t)=>s+(t.pointsUsed||0),0);
    const header = [`PetHub Transaction Report`, `View:,${groupMode==="pet"?"Grouped by Pet / Client":"All Transactions (List)"}`, `Branch:,${fBranch==="All"?"All Branches":shortBranch(fBranch)}`, `Month:,${fMonth==="All"?"All Months":monthLabel(fMonth)}`, `Generated:,${new Date().toLocaleString("en-PH")}`, ""];
    let lines;
    if(groupMode==="pet"){
      const cols = ["Pet","Client","Branch","Date","Transaction ID","Amount","Points Gained","Points Used","Type","Handled By"];
      lines = [...header, cols.map(esc).join(",")];
      groups.forEach(g=>{
        g.txns.forEach(t=>{ lines.push([g.petLabel,g.clientLabel,shortBranch(g.branch),t.date,t.transactionId,t.amount||0,t.pointsGained||0,t.pointsUsed||0,t.type,t.transactBy].map(esc).join(",")); });
        lines.push([`${g.petLabel} — Subtotal`,g.clientLabel,shortBranch(g.branch),"",`${g.count} txns`,g.spent,g.txns.reduce((s,t)=>s+(t.pointsGained||0),0),g.txns.reduce((s,t)=>s+(t.pointsUsed||0),0),`${g.points} pts balance`,""].map(esc).join(","));
        lines.push("");
      });
      lines.push(["GRAND TOTAL","",fBranch==="All"?"All Branches":shortBranch(fBranch),"",`${filtered.length} txns · ${groups.length} pets`,totalRev,totalG,totalU,"",""].map(esc).join(","));
    } else {
      const cols = ["Date","Transaction ID","Pet","Client","Branch","Amount","Points Gained","Points Used","Type","Handled By"];
      const rows = filtered.map(t=>[t.date,t.transactionId,t.petLabel,t.clientLabel,shortBranch(t.branch),t.amount||0,t.pointsGained||0,t.pointsUsed||0,t.type,t.transactBy].map(esc).join(","));
      lines = [...header, cols.map(esc).join(","), ...rows, "", ["TOTAL","",`${filtered.length} txns`,"",fBranch==="All"?"All Branches":shortBranch(fBranch),totalRev,totalG,totalU,"",""].map(esc).join(",")];
    }
    const csv = lines.join("\n");
    const blob = new Blob(["\uFEFF"+csv], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `PetHub-Transactions-${scope}-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setToast(`Exported ${filtered.length} transaction${filtered.length!==1?"s":""} (${groupMode==="pet"?"grouped by pet":"list"}) to CSV.`);
  }

  // Group filtered transactions by pet
  const groups = useMemo(()=>{
    const m = new Map();
    filtered.forEach(t=>{
      if(!m.has(t.petId)) m.set(t.petId, { petId:t.petId, petLabel:t.petLabel, clientLabel:t.clientLabel, branch:t.branch, txns:[] });
      m.get(t.petId).txns.push(t);
    });
    return [...m.values()].map(g=>({
      ...g,
      count: g.txns.length,
      spent: g.txns.reduce((s,t)=>s+(t.amount||0),0),
      points: g.txns.reduce((s,t)=>s+(t.pointsGained||0)-(t.pointsUsed||0),0),
    })).sort((a,b)=>b.count-a.count);
  }, [filtered]);

  const selWrap = { ...css.input, width:"auto", padding:"7px 12px", fontSize:13 };
  const shortBranch = b => (b||"").replace("Pet Hub Veterinary ","").replace("Clinic — ","").replace("Hospital — ","");

  return (
    <div>
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
      {viewReceipt && (
        <Modal title={`Receipt — Transaction #${viewReceipt.transactionId}`} onClose={()=>setViewReceipt(null)} width={560}>
          <p style={{ fontSize:12.5, color:T.muted, marginBottom:12 }}>{viewReceipt.receipt} · {new Date(viewReceipt.date).toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"})} · ₱{(viewReceipt.amount||0).toLocaleString()}</p>
          {String(viewReceipt.receiptType||"").includes("pdf")
            ? <iframe src={viewReceipt.receiptData} title="Receipt PDF" style={{ width:"100%", height:420, border:`1px solid ${T.border}`, borderRadius:10, background:"#fff" }}/>
            : <img src={viewReceipt.receiptData} alt="Receipt" style={{ width:"100%", maxHeight:460, objectFit:"contain", borderRadius:10, border:`1px solid ${T.border}`, background:T.bg }}/>
          }
          <div style={{ display:"flex", gap:10, marginTop:14 }}>
            <a href={viewReceipt.receiptData} download={viewReceipt.receipt} style={{ ...css.btnSecondary, flex:1, justifyContent:"center", textDecoration:"none" }}>Download</a>
            <button onClick={()=>setViewReceipt(null)} style={{ ...css.btnPrimary, flex:1, justifyContent:"center" }}>Close</button>
          </div>
        </Modal>
      )}
      <PageHeader title="Transaction History">
        <button onClick={exportCSV} disabled={filtered.length===0} style={{ ...css.btnPrimary, opacity:filtered.length===0?.5:1 }}>
          <Icon d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" size={15} color="#fff" stroke/> Export CSV{fBranch!=="All"?` — ${shortBranch(fBranch)}`:""}
        </button>
      </PageHeader>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
        <StatCard label="Total Transactions" value={filtered.length}          iconD={Icons.transaction} accent={T.info}   sublabel={fMonth==="All"&&fBranch==="All"?"All recorded":"Matching filters"}/>
        <StatCard label="Total Revenue"      value={`₱${totalRevenue.toLocaleString()}`} iconD={Icons.peso} accent={T.accent} sublabel={fBranch==="All"?"Across all branches":shortBranch(fBranch)}/>
        <StatCard label="Points Earned"      value={totalEarned}                  iconD={Icons.check}       accent={T.accent} sublabel="Loyalty points issued"/>
        <StatCard label="Points Redeemed"    value={totalRedeemed}                iconD={Icons.promo}       accent={T.warn}   sublabel="Points used"/>
      </div>

      <div style={{ ...css.card, padding:"22px 24px" }}>
        {/* Filters */}
        <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
          <p style={{ ...css.sectionLabel, margin:0, marginRight:"auto" }}>{groupMode==="pet"?"Grouped by Pet / Client":"All Transactions"}</p>
          <div style={{ display:"flex", borderRadius:9, border:`1px solid ${T.border}`, overflow:"hidden" }}>
            {[["pet","By Pet"],["list","List"]].map(([v,l])=>(
              <button key={v} onClick={()=>setGroupMode(v)} style={{ padding:"7px 14px", fontSize:12.5, fontWeight:600, border:"none", cursor:"pointer", background:groupMode===v?T.accent:"transparent", color:groupMode===v?"#fff":T.muted }}>{l}</button>
            ))}
          </div>
          <div style={{ position:"relative" }}>
            <input value={fSearch} onChange={e=>setFSearch(e.target.value)} placeholder="Search pet, client, ID…" style={{ ...css.input, width:220, paddingLeft:34, fontSize:13 }}/>
            <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }}><Icon d={Icons.search} size={14} color={T.subtle} stroke/></span>
          </div>
          <select value={fBranch} onChange={e=>setFBranch(e.target.value)} style={selWrap}>
            <option value="All">All Branches</option>
            {branches.map(b=><option key={b.id} value={b.name}>{shortBranch(b.name)}</option>)}
          </select>
          <select value={fType} onChange={e=>setFType(e.target.value)} style={selWrap}>
            {["All","Earned","Redeemed"].map(s=><option key={s}>{s}</option>)}
          </select>
          <select value={fMonth} onChange={e=>setFMonth(e.target.value)} style={selWrap}>
            <option value="All">All Months</option>
            {monthOptions.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
        </div>

        {groupMode==="pet" ? (
          /* ── Grouped by pet ── */
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {groups.length===0
              ? <p style={{ padding:40, textAlign:"center", color:T.subtle }}>No transactions match your filters.</p>
              : groups.map(g=>{
                const open = openGroup===g.petId;
                return (
                <div key={g.petId} style={{ borderRadius:12, border:`1px solid ${T.border}`, overflow:"hidden", background:T.surface }}>
                  <button onClick={()=>setOpenGroup(open?null:g.petId)} style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"13px 16px", background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
                    <span style={{ width:36, height:36, borderRadius:9, background:`${T.accent}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon d={Icons.paw} size={17} color={T.accent} stroke/></span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:14, fontWeight:700, color:T.text }}>{g.petLabel}</p>
                      <p style={{ fontSize:12, color:T.muted }}>{g.clientLabel} · {shortBranch(g.branch)}</p>
                    </div>
                    <div style={{ display:"flex", gap:18, alignItems:"center", flexShrink:0 }}>
                      <div style={{ textAlign:"right" }}><p style={{ fontSize:13.5, fontWeight:700, color:T.text }}>₱{g.spent.toLocaleString()}</p><p style={{ fontSize:10.5, color:T.muted }}>{g.count} txn{g.count!==1?"s":""}</p></div>
                      <div style={{ textAlign:"right" }}><p style={{ fontSize:13.5, fontWeight:700, color:T.accent }}>{g.points} pts</p><p style={{ fontSize:10.5, color:T.muted }}>balance</p></div>
                      <Icon d={open?Icons.chevronD:Icons.chevronR} size={16} color={T.muted} stroke/>
                    </div>
                  </button>
                  {open && (
                    <div style={{ borderTop:`1px solid ${T.border}`, overflowX:"auto" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                        <thead><tr style={{ background:T.surfaceAlt }}>
                          {["Date","Txn ID","Amount","Points","Handled By","Receipt",""].map(h=><th key={h} style={{ padding:"9px 14px", textAlign:"left", fontWeight:600, color:T.muted, fontSize:11.5, whiteSpace:"nowrap" }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {g.txns.map((t,i)=>(
                            <tr key={t.id} style={{ borderTop:`1px solid ${T.border}`, background:i%2===0?T.surface:T.surfaceAlt }}>
                              <td style={{ padding:"9px 14px", whiteSpace:"nowrap", color:T.text, fontWeight:600 }}>{new Date(t.date).toLocaleDateString("en-PH",{year:"2-digit",month:"short",day:"numeric"})}</td>
                              <td style={{ padding:"9px 14px", color:T.muted }}>#{t.transactionId}</td>
                              <td style={{ padding:"9px 14px", color:T.text, fontWeight:700, whiteSpace:"nowrap" }}>₱{(t.amount||0).toLocaleString()}</td>
                              <td style={{ padding:"9px 14px", whiteSpace:"nowrap" }}>
                                {(t.pointsGained||0)>0 && <span style={{ color:T.accent, fontWeight:700 }}>+{t.pointsGained}</span>}
                                {(t.pointsUsed||0)>0 && <span style={{ color:T.danger, fontWeight:700, marginLeft:6 }}>−{t.pointsUsed}</span>}
                                {!(t.pointsGained||0) && !(t.pointsUsed||0) && <span style={{ color:T.subtle }}>—</span>}
                              </td>
                              <td style={{ padding:"9px 14px", color:T.muted, fontSize:12 }}>{t.transactBy}</td>
                              <td style={{ padding:"9px 14px" }}>{t.receiptData ? <span onClick={()=>setViewReceipt(t)} style={{ color:T.accent, fontWeight:600, cursor:"pointer", textDecoration:"underline" }}>View</span> : <span style={{ color:T.subtle }}>—</span>}</td>
                              <td style={{ padding:"9px 14px" }}><button onClick={()=>removeTxn(t.id)} title="Delete" style={{ ...css.btnSecondary, padding:"4px 8px", fontSize:11.5, borderColor:T.border, color:T.muted }}><Icon d={Icons.x} size={12} color={T.muted} stroke/></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );})
            }
          </div>
        ) : (
        /* ── Flat list ── */
        <div style={{ borderRadius:10, border:`1px solid ${T.border}`, overflow:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13.5 }}>
            <thead>
              <tr style={{ background:T.surfaceAlt, borderBottom:`2px solid ${T.border}` }}>
                {["Date","Txn ID","Pet","Client","Branch","Amount","Points","Handled By","Receipt",""].map(h=>(
                  <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontWeight:600, color:T.muted, fontSize:12, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0
                ? <tr><td colSpan={10} style={{ padding:40, textAlign:"center", color:T.subtle }}>No transactions match your filters.</td></tr>
                : filtered.map((t,i)=>(
                  <tr key={t.id} style={{ borderBottom:`1px solid ${T.border}`, background:i%2===0?T.surface:T.surfaceAlt }}>
                    <td style={{ padding:"11px 16px", whiteSpace:"nowrap", color:T.text, fontWeight:600 }}>{new Date(t.date).toLocaleDateString("en-PH",{year:"2-digit",month:"short",day:"numeric"})}</td>
                    <td style={{ padding:"11px 16px", color:T.muted }}>#{t.transactionId}</td>
                    <td style={{ padding:"11px 16px" }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:7 }}>
                        <span style={{ width:26, height:26, borderRadius:7, background:`${T.accent}18`, display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon d={Icons.paw} size={12} color={T.accent} stroke/></span>
                        <span style={{ fontWeight:600, color:T.text }}>{t.petLabel}</span>
                      </span>
                    </td>
                    <td style={{ padding:"11px 16px", color:T.muted }}>{t.clientLabel}</td>
                    <td style={{ padding:"11px 16px", color:T.muted, fontSize:12.5 }}>{shortBranch(t.branch)}</td>
                    <td style={{ padding:"11px 16px", color:T.text, fontWeight:700, whiteSpace:"nowrap" }}>₱{(t.amount||0).toLocaleString()}</td>
                    <td style={{ padding:"11px 16px", whiteSpace:"nowrap" }}>
                      {(t.pointsGained||0)>0 && <span style={{ color:T.accent, fontWeight:700 }}>+{t.pointsGained}</span>}
                      {(t.pointsUsed||0)>0 && <span style={{ color:T.danger, fontWeight:700, marginLeft:6 }}>−{t.pointsUsed}</span>}
                      {!(t.pointsGained||0) && !(t.pointsUsed||0) && <span style={{ color:T.subtle }}>—</span>}
                    </td>
                    <td style={{ padding:"11px 16px", color:T.muted, fontSize:12.5 }}>{t.transactBy}</td>
                    <td style={{ padding:"11px 16px" }}>
                      {t.receiptData
                        ? <span onClick={()=>setViewReceipt(t)} style={{ color:T.accent, fontWeight:600, cursor:"pointer", fontSize:13, textDecoration:"underline" }}>View</span>
                        : <span style={{ color:T.subtle, fontSize:12.5 }}>—</span>}
                    </td>
                    <td style={{ padding:"11px 16px" }}>
                      <button onClick={()=>removeTxn(t.id)} title="Delete" style={{ ...css.btnSecondary, padding:"5px 9px", fontSize:12, borderColor:T.border, color:T.muted }}><Icon d={Icons.x} size={13} color={T.muted} stroke/></button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        )}
        <p style={{ fontSize:12.5, color:T.muted, marginTop:12 }}>Showing <strong style={{color:T.text}}>{filtered.length}</strong> of {transactions.length} transactions{groupMode==="pet"?` across ${groups.length} pet${groups.length!==1?"s":""}`:""}</p>
      </div>
    </div>
  );
}

/* ─── SIDEBAR NAV ────────────────────────────────────────────────────────── */
/* ─── CARD REQUESTS PAGE ─────────────────────────────────────────────────── */
function CardRequestsPage({ db }) {
  const { pets, setPets, clients, branches, registrations = [] } = db;
  const [toast, setToast]     = useState(null);
  const [fBranch, setFBranch] = useState("All");
  const [relModal, setRelModal] = useState(null); // pet being released
  const [relForm, setRelForm] = useState({});
  const qrInput = useRef();
  const shortBranch = b => (b||"").replace("Pet Hub Veterinary ","").replace("Clinic — ","").replace("Hospital — ","");
  const clientOf = id => clients.find(c=>c.id===id);

  const pending = useMemo(()=> pets
    .filter(p=>p.hasCard && p.printStatus==="Pending")
    .filter(p=> fBranch==="All" || p.branch===fBranch)
    .map(p=>({ ...p, owner:clientOf(p.clientId) }))
  , [pets, clients, fBranch]);

  function openRelease(p){ setRelForm({ membershipNo:p.membershipNo||"", qr:p.qr||null }); setRelModal(p); }
  function confirmRelease(){
    if(!relModal) return;
    const id=relModal.id;
    setPets(prev=>prev.map(p=>p.id===id?{...p,printStatus:"Printed",membershipNo:relForm.membershipNo||p.membershipNo,qr:relForm.qr||p.qr}:p));
    setRelModal(null); setToast("Loyalty card released.");
  }
  function uploadQR(file){ if(!file) return; const r=new FileReader(); r.onload=()=>setRelForm(f=>({...f,qr:r.result})); r.readAsDataURL(file); }
  function decline(id){ setPets(prev=>prev.map(p=>p.id===id?{...p,hasCard:false,printStatus:"N/A",membershipNo:""}:p)); setToast("Request declined."); }

  const approvedClients = useMemo(()=> registrations
    .filter(r=>r.status==="Approved" && r.accountType==="Client")
    .filter(r=> fBranch==="All" || r.branch===fBranch)
  , [registrations, fBranch]);

  const selWrap = { ...css.input, width:"auto", padding:"7px 12px", fontSize:13 };

  return (
    <div>
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
      <PageHeader title="Card Requests">
        <select value={fBranch} onChange={e=>setFBranch(e.target.value)} style={{ ...css.input, width:"auto", padding:"9px 14px", fontSize:13, fontWeight:600 }}>
          <option value="All">All Branches</option>
          {branches.map(b=><option key={b.id} value={b.name}>{shortBranch(b.name)}</option>)}
        </select>
      </PageHeader>

      <div style={{ ...css.card, padding:"22px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <p style={{ ...css.sectionLabel, marginBottom:0 }}>Pending Loyalty Card Requests</p>
          <span style={{ fontSize:12, fontWeight:700, color:"#fff", background:pending.length?T.warn:T.accent, borderRadius:99, padding:"3px 12px" }}>{pending.length} pending</span>
        </div>

        {pending.length===0
          ? <div style={{ padding:"48px", textAlign:"center", color:T.subtle }}>
              <div style={{ width:56, height:56, borderRadius:14, background:`${T.accent}18`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}><Icon d={Icons.check} size={26} color={T.accent} stroke/></div>
              No pending card requests. When a client avails a loyalty card, it appears here for release.
            </div>
          : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {pending.map(p=>(
                <div key={p.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 16px", borderRadius:12, border:`1px solid ${T.warn}33`, background:`${T.warn}0d` }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:`${T.accent}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon d={Icons.paw} size={19} color={T.accent} stroke/></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:700, color:T.text }}>{p.name} <span style={{ color:T.muted, fontWeight:400, fontSize:12.5 }}>· {p.breed||p.species} · {p.membershipNo||"—"}</span></p>
                    <p style={{ fontSize:12, color:T.muted }}>{p.owner?.name||"—"} · {shortBranch(p.branch)}</p>
                  </div>
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    <button onClick={()=>openRelease(p)} style={{ ...css.btnPrimary, padding:"7px 16px", fontSize:12.5, gap:6 }}><Icon d={Icons.check} size={14} color="#fff" stroke/> Release Card</button>
                    <button onClick={()=>decline(p.id)} style={{ ...css.btnSecondary, padding:"7px 14px", fontSize:12.5, gap:6, borderColor:"rgba(248,113,113,.4)", color:T.danger }}><Icon d={Icons.x} size={14} color={T.danger} stroke/> Decline</button>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      <div style={{ ...css.card, padding:"22px 24px", marginTop:16 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <p style={{ ...css.sectionLabel, marginBottom:2 }}>Newly Approved Clients</p>
            <p style={{ fontSize:12.5, color:T.muted }}>New client accounts — prepare their loyalty cards.</p>
          </div>
          <span style={{ fontSize:12, fontWeight:700, color:"#fff", background:approvedClients.length?T.accent:T.subtle, borderRadius:99, padding:"3px 12px" }}>{approvedClients.length} approved</span>
        </div>
        {approvedClients.length===0
          ? <div style={{ padding:"36px", textAlign:"center", color:T.subtle }}>No newly approved clients yet.</div>
          : <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {approvedClients.map(r=>{
                const rec = clients.find(c=>(c.email||"").toLowerCase()===r.email.toLowerCase());
                const theirPets = rec ? pets.filter(p=>p.clientId===rec.id) : [];
                return (
                <div key={r.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 16px", borderRadius:12, border:`1px solid ${T.accent}33`, background:`${T.accent}0d` }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:`${T.accent}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon d={Icons.account} size={19} color={T.accent} stroke/></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, fontWeight:700, color:T.text }}>{r.name} <span style={{ color:T.muted, fontWeight:400, fontSize:12.5 }}>· {r.email}</span></p>
                    <p style={{ fontSize:12, color:T.muted }}>{shortBranch(r.branch)}{theirPets.length?` · ${theirPets.length} pet${theirPets.length!==1?"s":""}: ${theirPets.map(p=>p.name).join(", ")}`:" · no pets yet"}</p>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:T.accentDark, background:`${T.accent}18`, borderRadius:99, padding:"4px 10px", flexShrink:0 }}>{theirPets.filter(p=>p.hasCard).length}/{theirPets.length} card{theirPets.length!==1?"s":""}</span>
                </div>
              );})}
            </div>
        }
      </div>

      {relModal && (()=>{ const owner=clientOf(relModal.clientId); return (
        <Modal title="Release Loyalty Card" onClose={()=>setRelModal(null)} width={500}>
          <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:10, background:T.surfaceAlt, border:`1px solid ${T.border}`, marginBottom:16 }}>
            <div style={{ width:44, height:44, borderRadius:11, background:`${T.accent}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon d={Icons.paw} size={22} color={T.accent} stroke/></div>
            <div><p style={{ fontSize:15, fontWeight:700, color:T.text }}>{relModal.name}</p><p style={{ fontSize:12.5, color:T.muted }}>{relModal.breed||relModal.species} · {relModal.gender}{relModal.age?` · ${relModal.age} yr`:""}</p></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 18px", marginBottom:16 }}>
            <div><p style={{ fontSize:11, color:T.muted, marginBottom:2 }}>Owner</p><p style={{ fontSize:13, fontWeight:600, color:T.text }}>{owner?.name||"—"}</p></div>
            <div><p style={{ fontSize:11, color:T.muted, marginBottom:2 }}>Branch</p><p style={{ fontSize:13, fontWeight:600, color:T.text }}>{shortBranch(relModal.branch)}</p></div>
            <div><p style={{ fontSize:11, color:T.muted, marginBottom:2 }}>Contact</p><p style={{ fontSize:13, fontWeight:600, color:T.text }}>{owner?.contact||"—"}</p></div>
            <div><p style={{ fontSize:11, color:T.muted, marginBottom:2 }}>Requested</p><p style={{ fontSize:13, fontWeight:600, color:T.text }}>{relModal.membershipDate||"—"}</p></div>
          </div>
          <Field label="Membership Number"><input value={relForm.membershipNo} onChange={e=>setRelForm(f=>({...f,membershipNo:e.target.value}))} placeholder="e.g. PH-0027" style={css.input} autoFocus/></Field>
          <Field label="QR Code">
            <input ref={qrInput} type="file" accept="image/*" onChange={e=>uploadQR(e.target.files[0])} style={{ display:"none" }}/>
            {relForm.qr
              ? <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <img src={relForm.qr} alt="QR" style={{ width:72, height:72, borderRadius:9, objectFit:"cover", border:`1px solid ${T.border}`, background:"#fff" }}/>
                  <div style={{ display:"flex", gap:8 }}>
                    <button type="button" onClick={()=>qrInput.current&&qrInput.current.click()} style={{ ...css.btnSecondary, padding:"7px 14px", fontSize:12.5 }}>Replace</button>
                    <button type="button" onClick={()=>setRelForm(f=>({...f,qr:null}))} style={{ ...css.btnSecondary, padding:"7px 14px", fontSize:12.5, borderColor:"rgba(248,113,113,.4)", color:T.danger }}>Remove</button>
                  </div>
                </div>
              : <button type="button" onClick={()=>qrInput.current&&qrInput.current.click()} style={{ ...css.btnSecondary, width:"100%", justifyContent:"center", gap:7, padding:"14px 0", borderStyle:"dashed" }}><Icon d={Icons.camera} size={16} color={T.muted} stroke/> Upload QR Code Image</button>
            }
          </Field>
          <div style={{ display:"flex", gap:10, marginTop:6 }}>
            <button onClick={()=>setRelModal(null)} style={{ ...css.btnSecondary, flex:1, justifyContent:"center" }}>Cancel</button>
            <button onClick={confirmRelease} disabled={!relForm.membershipNo} style={{ ...css.btnPrimary, flex:1, justifyContent:"center", gap:6, opacity:relForm.membershipNo?1:.5 }}><Icon d={Icons.check} size={14} color="#fff" stroke/> Release Card</button>
          </div>
        </Modal>
      ); })()}
    </div>
  );
}

/* ─── SIDEBAR NAV ────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id:"dashboard",   label:"Dashboard",       iconD:Icons.dashboard,   group:"Overview" },
  { id:"transaction", label:"Loyalty Scanner", iconD:Icons.transaction, group:"Operations" },
  { id:"history",     label:"Transaction History", iconD:Icons.clock,   group:"Operations" },
  { id:"cardrequests",label:"Card Requests",   iconD:Icons.transaction, group:"Operations" },
  { id:"clients",     label:"Clients & Pets",  iconD:Icons.clients,     group:"Directory" },
  { id:"branches",    label:"Branches",        iconD:Icons.branch,      group:"Directory" },
  { id:"accounts",    label:"Accounts",        iconD:Icons.account,     group:"Directory" },
  { id:"promotions",  label:"Promotions",      iconD:Icons.promo,       group:"Marketing" },
];

/* ─── LOGIN SCREEN ───────────────────────────────────────────────────────── */
function LoginScreen({ onLogin, onRegister, admins, registrations, clientEmails, clients, branches }) {
  const [mode, setMode]     = useState("signin"); // signin | register
  const [email, setEmail]   = useState("admin@pethub.ph");
  const [pw, setPw]         = useState("");
  const [show, setShow]     = useState(false);
  const [err, setErr]       = useState("");
  const [ok, setOk]         = useState("");
  // register fields
  const [rName, setRName]   = useState("");
  const [rEmail, setREmail] = useState("");
  const [rBranch, setRBranch] = useState("");
  const [rRole, setRRole]   = useState("Branch Staff");
  const [rContact, setRContact] = useState("");
  const [rType, setRType]   = useState("Staff"); // Staff | Client
  const [rPw, setRPw]       = useState("");

  function switchMode(m){ setMode(m); setErr(""); setOk(""); }

  function submit(e) {
    if(e) e.preventDefault();
    const mail = email.trim().toLowerCase();
    if(!mail || !pw.trim()) { setErr("Please enter your email and password."); return; }
    const admin = admins.find(a=>a.email.toLowerCase()===mail);
    if(admin) { setErr(""); onLogin({ email:admin.email, name:admin.name, role:admin.role }); return; }
    const client = (clients||[]).find(c=>(c.email||"").toLowerCase()===mail);
    if(client) { setErr(""); onLogin({ email:client.email, name:client.name, role:"Client", clientId:client.id }); return; }
    const reg = registrations.find(r=>r.email.toLowerCase()===mail);
    if(reg) {
      if(reg.status==="Pending")  { setErr("Your account is still awaiting admin approval. You'll be able to sign in once admin@pethub.ph approves it."); return; }
      if(reg.status==="Denied")   { setErr("Your registration request was denied by the administrator. Please contact admin@pethub.ph."); return; }
      if(reg.status==="Approved") { setErr(""); onLogin({ email:reg.email, name:reg.name, role:reg.role, clientId:null }); return; }
    }
    setErr("No account found for this email. Create an account to request access.");
  }

  function register(e) {
    if(e) e.preventDefault();
    const mail = rEmail.trim().toLowerCase();
    if(!rName.trim() || !mail || !rBranch || !rPw.trim()) { setErr("Please complete all fields."); setOk(""); return; }
    if(!/^\S+@\S+\.\S+$/.test(mail)) { setErr("Please enter a valid email address."); setOk(""); return; }
    if(clientEmails.includes(mail)) { setErr("This email already belongs to a client account."); setOk(""); return; }
    if(admins.some(a=>a.email.toLowerCase()===mail)) { setErr("This email already has admin access — just sign in."); setOk(""); return; }
    if(registrations.some(r=>r.email.toLowerCase()===mail)) { setErr("A registration request already exists for this email."); setOk(""); return; }
    setErr("");
    onRegister({ id:Date.now(), name:rName.trim(), email:mail, branch:rBranch, accountType:rType, role:rType==="Client"?"Client":rRole, contact:rContact, password:rPw, status:"Pending", requestedAt:new Date().toISOString() });
    setOk(rType==="Client"
      ? "Request submitted! Once approved by admin@pethub.ph, this client will be added to the Clients directory."
      : "Request submitted! Once approved by admin@pethub.ph, this staff account will be added under Accounts and can sign in.");
    setRName(""); setREmail(""); setRBranch(""); setRPw(""); setRRole("Branch Staff"); setRContact(""); setRType("Staff");
  }

  const brandStat = mode==="signin" ? [["8","Branches"],["16","Clients"],["26","Pets"]] : [["8","Branches"],["6","Services"],["24/7","Support"]];

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"'Inter',system-ui,sans-serif", background:T.bg }}>
      <div style={{ flex:"1 1 46%", background:`linear-gradient(150deg, ${T.sidebar} 0%, #0c4d38 55%, ${T.accentDark} 140%)`, color:"#fff", padding:"56px 60px", display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, right:-60, width:260, height:260, borderRadius:"50%", background:"rgba(255,255,255,.05)" }}/>
        <div style={{ position:"absolute", bottom:-70, left:-40, width:220, height:220, borderRadius:"50%", background:"rgba(16,185,129,.12)" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:12, position:"relative" }}>
          <div style={{ width:50, height:50, borderRadius:14, background:"linear-gradient(135deg,#0f6b4a,#073d2b)", display:"flex", alignItems:"center", justifyContent:"center", padding:5, boxShadow:"0 4px 16px rgba(0,0,0,.35)", border:"1px solid rgba(212,175,55,.4)" }}>
            <img src="logo-gold.png" alt="Pet Hub" style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
          </div>
          <div>
            <p style={{ fontWeight:800, fontSize:18, letterSpacing:".03em" }}>PetHub</p>
            <p style={{ fontSize:11.5, color:"rgba(255,255,255,.5)", fontWeight:500, letterSpacing:".05em" }}>Rewards Admin Portal</p>
          </div>
        </div>
        <div style={{ position:"relative" }}>
          <h1 style={{ fontSize:34, fontWeight:800, lineHeight:1.15, letterSpacing:"-.02em", marginBottom:16 }}>Manage your clinics,<br/>clients & loyalty rewards<br/>in one place.</h1>
          <p style={{ fontSize:15, color:"rgba(255,255,255,.65)", lineHeight:1.6, maxWidth:420 }}>Track appointments, scan loyalty cards, run promotions and monitor revenue across all 8 Pet Hub branches.</p>
          <div style={{ display:"flex", gap:28, marginTop:34 }}>
            {brandStat.map(([n,l])=>(
              <div key={l}>
                <p style={{ fontSize:26, fontWeight:800 }}>{n}</p>
                <p style={{ fontSize:12.5, color:"rgba(255,255,255,.55)" }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize:12, color:"rgba(255,255,255,.4)", position:"relative" }}>Cafecircuit © 2025 · PetHub Rewards</p>
      </div>

      <div style={{ flex:"1 1 54%", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 32px" }}>
        {mode==="signin" ? (
          <form onSubmit={submit} style={{ width:"100%", maxWidth:380 }}>
            <p style={{ fontSize:11.5, fontWeight:700, color:T.accent, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>Welcome back</p>
            <h2 style={{ fontSize:26, fontWeight:800, color:T.text, letterSpacing:"-.02em", marginBottom:6 }}>Sign in to your account</h2>
            <p style={{ fontSize:13.5, color:T.muted, marginBottom:28 }}>Enter your staff credentials to continue.</p>

            {err && <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:16, padding:"9px 13px", borderRadius:9, background:"rgba(248,113,113,.12)", border:"1px solid #fecaca" }}>
              <Icon d={Icons.x} size={14} color={T.danger} stroke/><p style={{ fontSize:12.5, color:T.danger, fontWeight:600, lineHeight:1.4 }}>{err}</p>
            </div>}

            <Field label="Email Address">
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@pethub.ph" style={css.input} autoFocus/>
            </Field>
            <Field label="Password">
              <div style={{ position:"relative" }}>
                <input value={pw} onChange={e=>setPw(e.target.value)} type={show?"text":"password"} placeholder="Enter your password" style={{ ...css.input, paddingRight:44 }}/>
                <button type="button" onClick={()=>setShow(s=>!s)} style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", padding:6, display:"flex" }}>
                  <Icon d={Icons.eye} size={16} color={show?T.accent:T.subtle} stroke/>
                </button>
              </div>
            </Field>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"4px 0 22px" }}>
              <label style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, color:T.muted, cursor:"pointer" }}>
                <input type="checkbox" defaultChecked style={{ accentColor:T.accent, width:15, height:15 }}/> Remember me
              </label>
              <span style={{ fontSize:13, color:T.accent, fontWeight:600, cursor:"pointer" }}>Forgot password?</span>
            </div>

            <button type="submit" style={{ ...css.btnPrimary, width:"100%", justifyContent:"center", fontSize:14.5, padding:"12px 0" }}>Sign In</button>

            <p style={{ fontSize:13, color:T.muted, textAlign:"center", marginTop:20 }}>
              Don't have an account? <span onClick={()=>switchMode("register")} style={{ color:T.accent, fontWeight:700, cursor:"pointer" }}>Request access</span>
            </p>
            <p style={{ fontSize:12, color:T.subtle, textAlign:"center", marginTop:10, lineHeight:1.6 }}>
              Demo — sign in with <span style={{ color:T.text, fontWeight:600 }}>admin@pethub.ph</span> and any password.
            </p>
          </form>
        ) : (
          <form onSubmit={register} style={{ width:"100%", maxWidth:400 }}>
            <p style={{ fontSize:11.5, fontWeight:700, color:T.accent, textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>New account</p>
            <h2 style={{ fontSize:26, fontWeight:800, color:T.text, letterSpacing:"-.02em", marginBottom:6 }}>Request portal access</h2>
            <p style={{ fontSize:13.5, color:T.muted, marginBottom:24 }}>Your request will be reviewed by <strong style={{ color:T.text }}>admin@pethub.ph</strong>. You can sign in once it's approved.</p>

            {err && <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:16, padding:"9px 13px", borderRadius:9, background:"rgba(248,113,113,.12)", border:"1px solid #fecaca" }}>
              <Icon d={Icons.x} size={14} color={T.danger} stroke/><p style={{ fontSize:12.5, color:T.danger, fontWeight:600, lineHeight:1.4 }}>{err}</p>
            </div>}
            {ok && <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:16, padding:"11px 13px", borderRadius:9, background:"rgba(34,197,138,.12)", border:`1px solid ${T.accent}44` }}>
              <Icon d={Icons.check} size={15} color={T.accent} stroke/><p style={{ fontSize:12.5, color:T.accentDark, fontWeight:600, lineHeight:1.5 }}>{ok}</p>
            </div>}

            <Field label="Full Name"><input value={rName} onChange={e=>setRName(e.target.value)} placeholder="e.g. Juan Dela Cruz" style={css.input}/></Field>
            <Field label="Account Type">
              <div style={{ display:"flex", gap:10 }}>
                {[["Staff","Staff / Admin"],["Client","Client"]].map(([val,label])=>(
                  <label key={val} onClick={()=>setRType(val)} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontSize:13.5, cursor:"pointer", padding:"10px 0", borderRadius:8, border:`2px solid ${rType===val?T.accent:T.border}`, background:rType===val?`${T.accent}10`:"#fff", fontWeight:rType===val?700:500, color:rType===val?T.accentDark:T.muted }}>
                    <input type="radio" name="rtype" checked={rType===val} onChange={()=>setRType(val)} style={{ display:"none" }}/>
                    {label}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Email Address"><input value={rEmail} onChange={e=>setREmail(e.target.value)} type="email" placeholder="you@pethub.ph" style={css.input}/></Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Field label="Branch">
                <select value={rBranch} onChange={e=>setRBranch(e.target.value)} style={css.input}>
                  <option value="">Select…</option>
                  {branches.map(b=><option key={b.id} value={b.name}>{b.name.replace("Pet Hub Veterinary ","").replace("Clinic — ","").replace("Hospital — ","")}</option>)}
                </select>
              </Field>
              {rType==="Staff"
                ? <Field label="Requested Role">
                    <select value={rRole} onChange={e=>setRRole(e.target.value)} style={css.input}>
                      <option>Branch Staff</option><option>Branch Manager</option><option>Veterinarian</option>
                    </select>
                  </Field>
                : <Field label="Contact Number">
                    <input value={rContact} onChange={e=>setRContact(e.target.value)} placeholder="09XXXXXXXXX" style={css.input}/>
                  </Field>
              }
            </div>
            <Field label="Password"><input value={rPw} onChange={e=>setRPw(e.target.value)} type="password" placeholder="Create a password" style={css.input}/></Field>

            <button type="submit" style={{ ...css.btnPrimary, width:"100%", justifyContent:"center", fontSize:14.5, padding:"12px 0", marginTop:4 }}>Submit Request</button>
            <p style={{ fontSize:13, color:T.muted, textAlign:"center", marginTop:20 }}>
              Already have access? <span onClick={()=>switchMode("signin")} style={{ color:T.accent, fontWeight:700, cursor:"pointer" }}>Back to sign in</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── CLIENT PORTAL (restricted view for client accounts) ────────────────── */
function ClientPortal({ user, db, onLogout }) {
  const { clients, setClients, pets, setPets, transactions, branches, appointments } = db;
  const coverInput = useRef(); const avatarInput = useRef();
  const [petModal, setPetModal] = useState(false);
  const [petForm, setPetForm] = useState({});
  function savePet(){
    if(!petForm.name || !petForm.species){ return; }
    setPets(prev=>[...prev, {
      id: Date.now(),
      clientId: user.clientId,
      name: petForm.name,
      species: petForm.species,
      breed: petForm.breed||"",
      gender: petForm.gender||"Male",
      age: petForm.age||"",
      weight: petForm.weight||"",
      color: petForm.color||"",
      birthday: petForm.birthday||"",
      notes: petForm.notes||"",
      photo: petForm.photo||null,
      membershipNo: "",
      membershipDate: "",
      hasCard: false,
      branch: me.branch||"",
      email: me.email||"",
      printStatus: "N/A",
    }]);
    setPetModal(false); setPetForm({});
  }
  function uploadPhoto(field, file){
    if(!file || !setClients) return;
    const reader = new FileReader();
    reader.onload = ()=> setClients(p=>p.map(c=>c.id===user.clientId?{...c,[field]:reader.result}:c));
    reader.readAsDataURL(file);
  }
  const [page, setPage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const me = clients.find(c=>c.id===user.clientId) || { name:user.name, email:user.email, branch:"", contact:"", status:"Active" };
  const myPets = pets.filter(p=>p.clientId===user.clientId);
  const petPoints = (pid)=> transactions.filter(t=>t.petId===pid).reduce((s,t)=>s+(t.pointsGained||0)-(t.pointsUsed||0),0);
  const myAppts = appointments.filter(a=>a.clientId===user.clientId).sort((a,b)=>a.date<b.date?1:-1);
  const NAV = [["dashboard","Dashboard",Icons.dashboard],["branches","Branches",Icons.branch],["pets","My Pets",Icons.paw]];

  function Info({label,value}){ return <div style={{ paddingBottom:10, borderBottom:`1px solid ${T.border}` }}><p style={{ fontSize:11, color:T.muted, marginBottom:3 }}>{label}</p><p style={{ fontSize:13.5, fontWeight:600, color:T.text }}>{value||"—"}</p></div>; }

  function availCard(petId){
    setPets(prev=>prev.map(p=>{
      if(p.id!==petId) return p;
      const seq = String(p.id).slice(-4);
      return { ...p, hasCard:true, membershipNo:p.membershipNo||`PH-${seq}`, membershipDate: p.membershipDate || new Date().toLocaleDateString("en-US"), printStatus:"Pending" };
    }));
  }

  function PetCard({p}){
    return (
      <div className="ph-lift" style={{ ...css.card, padding:"18px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg, ${T.accent}30, ${T.accent}0d)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, border:`1px solid ${T.accent}25` }}><Icon d={Icons.paw} size={22} color={T.accent} stroke/></div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:16, fontWeight:800, color:T.text }}>{p.name}</p>
            <p style={{ fontSize:12.5, color:T.muted }}>{p.breed||p.species} · {p.gender}</p>
          </div>
          {p.hasCard
            ? <span style={{ textAlign:"right" }}><p style={{ fontSize:20, fontWeight:800, color:T.accent, lineHeight:1 }}>{petPoints(p.id)}</p><p style={{ fontSize:10.5, color:T.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:".05em" }}>Points</p></span>
            : <Badge label="No Card" color={T.warn}/>
          }
        </div>
        {!p.hasCard && (
          <button onClick={()=>availCard(p.id)} style={{ ...css.btnPrimary, width:"100%", justifyContent:"center", marginBottom:14, gap:7 }}>
            <Icon d={Icons.transaction} size={15} color="#fff" stroke/> Avail Loyalty Card
          </button>
        )}
        {p.hasCard && p.printStatus==="Pending" && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:9, background:`${T.warn}18`, border:`1px solid ${T.warn}33`, marginBottom:14 }}>
            <Icon d={Icons.clock} size={14} color={T.warn} stroke/>
            <p style={{ fontSize:12, color:T.text, fontWeight:600 }}>Card requested — pending release at your branch.</p>
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 18px" }}>
          <Info label="Species" value={p.species}/>
          <Info label="Age" value={p.age?`${p.age} yr`:"—"}/>
          <Info label="Weight" value={p.weight}/>
          <Info label="Color" value={p.color}/>
          <Info label="Birthday" value={p.birthday}/>
          <Info label="Membership No." value={p.membershipNo}/>
        </div>
        {p.notes && <div style={{ marginTop:12, padding:"10px 12px", borderRadius:9, background:T.bg, fontSize:12.5, color:T.muted }}><strong style={{ color:T.text }}>Notes: </strong>{p.notes}</div>}
      </div>
    );
  }

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif", background:T.bg }}>
      {petModal && (
        <Modal title="Add a Pet" onClose={()=>setPetModal(false)} width={520}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="Pet Name"><input value={petForm.name||""} onChange={e=>setPetForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Koohii" style={css.input} autoFocus/></Field>
            <Field label="Species"><select value={petForm.species||"Dog"} onChange={e=>setPetForm(f=>({...f,species:e.target.value}))} style={css.input}>{["Dog","Cat","Bird","Rabbit","Other"].map(s=><option key={s}>{s}</option>)}</select></Field>
            <Field label="Breed"><input value={petForm.breed||""} onChange={e=>setPetForm(f=>({...f,breed:e.target.value}))} placeholder="e.g. Shiba Inu" style={css.input}/></Field>
            <Field label="Gender"><select value={petForm.gender||"Male"} onChange={e=>setPetForm(f=>({...f,gender:e.target.value}))} style={css.input}>{["Male","Female"].map(s=><option key={s}>{s}</option>)}</select></Field>
            <Field label="Age (years)"><input value={petForm.age||""} onChange={e=>setPetForm(f=>({...f,age:e.target.value}))} placeholder="e.g. 3" style={css.input}/></Field>
            <Field label="Weight"><input value={petForm.weight||""} onChange={e=>setPetForm(f=>({...f,weight:e.target.value}))} placeholder="e.g. 8 kg" style={css.input}/></Field>
            <Field label="Color"><input value={petForm.color||""} onChange={e=>setPetForm(f=>({...f,color:e.target.value}))} placeholder="e.g. Brown" style={css.input}/></Field>
            <Field label="Birthday"><input type="date" value={petForm.birthday||""} onChange={e=>setPetForm(f=>({...f,birthday:e.target.value}))} style={css.input}/></Field>
          </div>
          <Field label="Notes"><textarea value={petForm.notes||""} onChange={e=>setPetForm(f=>({...f,notes:e.target.value}))} placeholder="Allergies, reminders…" style={{ ...css.input, height:64, resize:"vertical" }}/></Field>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", borderRadius:9, background:`${T.accent}12`, border:`1px solid ${T.accent}22`, marginBottom:8 }}>
            <Icon d={Icons.alert} size={14} color={T.accent} stroke/>
            <p style={{ fontSize:12, color:T.muted }}>A loyalty card will be issued by your branch on your next visit.</p>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:4 }}>
            <button onClick={()=>setPetModal(false)} style={{ ...css.btnSecondary, flex:1, justifyContent:"center" }}>Cancel</button>
            <button onClick={savePet} disabled={!petForm.name} style={{ ...css.btnPrimary, flex:1, justifyContent:"center", opacity:petForm.name?1:.5 }}>Add Pet</button>
          </div>
        </Modal>
      )}
      <aside style={{ width:210, background:T.sidebar, flexShrink:0, display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", zIndex:50 }}>
        <div style={{ padding:"16px 18px", display:"flex", alignItems:"center", gap:11, borderBottom:"1px solid rgba(255,255,255,.07)", minHeight:72 }}>
          <img src="logo-gold.png" alt="Pet Hub" style={{ width:44, height:44, borderRadius:"50%", objectFit:"contain", background:"linear-gradient(135deg,#0f6b4a,#073d2b)", padding:5, flexShrink:0, border:"1px solid rgba(212,175,55,.4)" }}/>
          <div><p style={{ color:"#fff", fontWeight:800, fontSize:14.5 }}>PetHub</p><p style={{ color:"rgba(255,255,255,.4)", fontSize:10.5, fontWeight:500 }}>Client Portal</p></div>
        </div>
        <nav style={{ flex:1, padding:"14px 0" }}>
          {NAV.map(([id,label,ic])=>{
            const active=page===id;
            return <button key={id} onClick={()=>setPage(id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:11, padding:"11px 18px", background:active?"rgba(16,185,129,.15)":"transparent", border:"none", borderLeft:active?`3px solid ${T.accent}`:"3px solid transparent", cursor:"pointer", color:active?"#fff":"rgba(255,255,255,.55)", fontSize:13.5, fontWeight:active?600:400 }}><Icon d={ic} size={17} color={active?T.accent:"rgba(255,255,255,.45)"} stroke/>{label}</button>;
          })}
        </nav>
        <div style={{ padding:14, borderTop:"1px solid rgba(255,255,255,.07)" }}>
          <button onClick={onLogout} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"9px 0", borderRadius:8, background:"rgba(255,255,255,.06)", border:"none", cursor:"pointer", color:"rgba(255,255,255,.7)", fontSize:13, fontWeight:600 }}><Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={15} color="rgba(255,255,255,.7)" stroke/>Log out</button>
        </div>
      </aside>

      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <header style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"0 28px", display:"flex", alignItems:"center", justifyContent:"flex-end", height:60, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:`${T.accent}18`, border:`1.5px solid ${T.accent}30`, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon d={Icons.account} size={17} color={T.accent} stroke/></div>
            <div><p style={{ fontSize:13, fontWeight:600, color:T.text, lineHeight:1.2 }}>{me.name}</p><p style={{ fontSize:11, color:T.muted }}>Client</p></div>
          </div>
        </header>

        <main style={{ flex:1, padding:28, overflowY:"auto" }}>
          {page==="branches" ? <BranchesPage db={db} readOnly/> : page==="pets" ? (
            <div>
              <PageHeader title="My Pets">
                <button onClick={()=>{ setPetForm({ gender:"Male", species:"Dog" }); setPetModal(true); }} style={css.btnPrimary}>
                  <Icon d={Icons.plus} size={15} color="#fff" stroke/> Add Pet
                </button>
              </PageHeader>
              {myPets.length===0
                ? <div style={{ ...css.card, padding:"50px", textAlign:"center", color:T.subtle }}>No pets registered under your account yet. Click <strong style={{color:T.text}}>Add Pet</strong> to register your first one.</div>
                : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>{myPets.map(p=><PetCard key={p.id} p={p}/>)}</div>
              }
            </div>
          ) : (
            <div>
              <div style={{ borderRadius:16, marginBottom:20, position:"relative", overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,.18)", minHeight:230, display:"flex", alignItems:"flex-end", background: me.cover ? `center/cover no-repeat url(${me.cover})` : `linear-gradient(120deg, ${T.sidebar} 0%, #0d5b40 70%, ${T.accent} 135%)` }}>
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.15) 40%, rgba(0,0,0,.62) 100%)" }}/>
                <input ref={coverInput} type="file" accept="image/*" onChange={e=>uploadPhoto("cover", e.target.files[0])} style={{ display:"none" }}/>
                <button onClick={()=>coverInput.current&&coverInput.current.click()} style={{ position:"absolute", top:14, right:14, display:"flex", alignItems:"center", gap:6, padding:"7px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,.4)", background:"rgba(0,0,0,.4)", backdropFilter:"blur(6px)", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", zIndex:2 }}>
                  <Icon d={Icons.camera} size={14} color="#fff" stroke/> {me.cover?"Change cover":"Add cover photo"}
                </button>
                <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"flex-end", gap:18, flexWrap:"wrap", padding:"0 30px 24px" }}>
                  <div style={{ position:"relative", flexShrink:0 }}>
                    <div style={{ width:86, height:86, borderRadius:"50%", background:"#fff", padding:4, boxShadow:"0 6px 18px rgba(0,0,0,.35)", overflow:"hidden" }}>
                      {me.avatar
                        ? <img src={me.avatar} alt="" style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }}/>
                        : <div style={{ width:"100%", height:"100%", borderRadius:"50%", background:`${T.accent}22`, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon d={Icons.account} size={38} color={T.accentDark} stroke/></div>
                      }
                    </div>
                    <input ref={avatarInput} type="file" accept="image/*" onChange={e=>uploadPhoto("avatar", e.target.files[0])} style={{ display:"none" }}/>
                    <button onClick={()=>avatarInput.current&&avatarInput.current.click()} title="Upload profile photo" style={{ position:"absolute", bottom:2, right:2, width:28, height:28, borderRadius:"50%", border:"2px solid #fff", background:T.accent, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                      <Icon d={Icons.camera} size={13} color="#fff" stroke/>
                    </button>
                  </div>
                  <div style={{ paddingBottom:4, textShadow:"0 1px 10px rgba(0,0,0,.6)" }}>
                    <p style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.75)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:4 }}>Client Portal</p>
                    <h1 style={{ fontSize:24, fontWeight:800, letterSpacing:"-.02em", color:"#fff" }}>Welcome back, {me.name.split(" ")[0]}! </h1>
                    <p style={{ fontSize:13.5, color:"rgba(255,255,255,.85)", marginTop:4 }}>Here's how your furry family is doing today.</p>
                  </div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:18 }}>
                <StatCard label="My Pets" value={myPets.length} iconD={Icons.paw} accent={T.accent} sublabel="Registered pets"/>
                <StatCard label="Total Points" value={myPets.reduce((s,p)=>s+petPoints(p.id),0)} iconD={Icons.check} accent={T.info} sublabel="Across all cards"/>
                <StatCard label="Loyalty Cards" value={myPets.filter(p=>p.hasCard && p.printStatus!=="Pending").length} iconD={Icons.transaction} accent={T.accent} sublabel="Active cards"/>
                <StatCard label="Upcoming Visits" value={myAppts.filter(a=>a.status==="Scheduled"&&a.date>="2026-07-01").length} iconD={Icons.calendar} accent={T.warn} sublabel="Appointments"/>
              </div>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-start" }}>
                <div style={{ ...css.card, padding:"22px 24px", flex:"1 1 300px", minWidth:280 }}>
                  <p style={css.sectionLabel}>My Details</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 18px" }}>
                    <Info label="Full Name" value={me.name}/>
                    <Info label="Status" value={me.status}/>
                    <Info label="Email" value={me.email}/>
                    <Info label="Contact" value={me.contact}/>
                    <Info label="Home Branch" value={(me.branch||"").replace("Pet Hub Veterinary ","")}/>
                  </div>
                </div>
                <div style={{ ...css.card, padding:"22px 24px", flex:"1 1 320px", minWidth:280 }}>
                  <p style={css.sectionLabel}>My Pets</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {myPets.length===0 ? <p style={{ fontSize:13, color:T.subtle }}>No pets yet.</p> : myPets.map(p=>(
                      <div key={p.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, border:`1px solid ${T.border}` }}>
                        <div style={{ width:34, height:34, borderRadius:9, background:`${T.accent}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Icon d={Icons.paw} size={16} color={T.accent} stroke/></div>
                        <div style={{ flex:1, minWidth:0 }}><p style={{ fontSize:13.5, fontWeight:700, color:T.text }}>{p.name}</p><p style={{ fontSize:11.5, color:T.muted }}>{p.breed||p.species}</p></div>
                        {p.hasCard ? <span style={{ fontSize:13, fontWeight:700, color:T.accent }}>{petPoints(p.id)} pts</span> : <Badge label="No Card" color={T.warn}/>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ─── ROOT APP ───────────────────────────────────────────────────────────── */
function App() {
  const [page,      setPage]      = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [hovNav,    setHovNav]    = useState(null);
  const [searchQ,   setSearchQ]   = useState("");
  const [searchOpen,setSearchOpen]= useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authed, setAuthed] = useState(()=>{ try { return localStorage.getItem("pethub_auth")==="1"; } catch(e){ return false; } });
  const [user, setUser]     = useState(()=>{ try { return JSON.parse(localStorage.getItem("pethub_user")||"null"); } catch(e){ return null; } });
  const [registrations, setRegistrations] = useState(()=>{ try { return JSON.parse(localStorage.getItem("pethub_regs")||"[]"); } catch(e){ return []; } });
  useEffect(()=>{ try { localStorage.setItem("pethub_regs", JSON.stringify(registrations)); } catch(e){} }, [registrations]);

  // Global data — lives here so switching pages never resets it.
  // Persisted to localStorage so edits survive refresh.
  const usePersist = (key, initial) => {
    const [val, setVal] = useState(()=>{ try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch(e){ return initial; } });
    useEffect(()=>{ try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){} }, [val]);
    return [val, setVal];
  };
  const [branches,   setBranches]   = usePersist("pethub_branches", BRANCHES);
  const [branchVets, setBranchVets] = usePersist("pethub_branchvets", BRANCH_VETS);
  const [accounts,   setAccounts]   = usePersist("pethub_accounts", ACCOUNTS);
  const [clients,    setClients]    = usePersist("pethub_clients", CLIENTS);
  const [pets,       setPets]       = usePersist("pethub_pets", PETS);
  const [promotions, setPromotions] = usePersist("pethub_promotions", PROMOTIONS);
  const [appointments, setAppointments] = usePersist("pethub_appointments", APPOINTMENTS);
  const [transactions, setTransactions] = usePersist("pethub_transactions", SEED_TRANSACTIONS);

  const db = { branches, setBranches, branchVets, setBranchVets, accounts, setAccounts, clients, setClients, pets, setPets, promotions, setPromotions, appointments, setAppointments, transactions, setTransactions, registrations, setRegistrations, user };

  const SUPER_ADMIN = "admin@pethub.ph";

  const TODAY = "2026-07-01";

  // ── Global search across clients, pets, appointments, branches ──
  const searchResults = useMemo(()=>{
    const q = searchQ.trim().toLowerCase();
    if(!q) return [];
    const out = [];
    clients.forEach(c=>{ const elocal=(c.email||"").split("@")[0].toLowerCase(); if(c.name.toLowerCase().includes(q)||elocal.includes(q)||(c.contact||"").toLowerCase().includes(q)) out.push({ type:"Client", label:c.name, sub:c.email, page:"clients" }); });
    pets.forEach(p=>{ if(p.name.toLowerCase().includes(q)||(p.breed||"").toLowerCase().includes(q)||(p.membershipNo||"").toLowerCase().includes(q)) out.push({ type:"Pet", label:p.name, sub:`${p.breed||p.species} · ${p.membershipNo||""}`, page:"clients" }); });
    branches.forEach(b=>{ if(b.name.toLowerCase().includes(q)) out.push({ type:"Branch", label:b.name.replace("Pet Hub Veterinary ",""), sub:b.location, page:"branches" }); });
    appointments.forEach(a=>{ const pet=pets.find(p=>p.id===a.petId); if((pet&&pet.name.toLowerCase().includes(q))||a.service.toLowerCase().includes(q)||a.vet.toLowerCase().includes(q)) out.push({ type:"Appointment", label:`${a.service} — ${pet?.name||""}`, sub:`${a.date} · ${a.vet}`, page:"appointments" }); });
    return out.slice(0,8);
  }, [searchQ, clients, pets, branches, appointments]);

  // ── Notifications (mirror dashboard reminders) ──
  const notifications = useMemo(()=>{
    const list = [];
    pets.filter(p=>p.hasCard).forEach(p=>{
      if(!p.membershipDate) return;
      const pr=String(p.membershipDate).split("/"); if(pr.length!==3) return;
      const exp=new Date(`${pr[2]}-${pr[0]}-${pr[1]}`); exp.setFullYear(exp.getFullYear()+1);
      const days = Math.ceil((exp-new Date(TODAY))/(1000*60*60*24));
      const owner = clients.find(c=>c.id===p.clientId);
      if(days<=0) list.push({ tone:T.danger, title:`${p.name}'s loyalty card expired`, sub:`${owner?.name||""} · expired ${Math.abs(days)} days ago`, page:"clients" });
      else if(days<=60) list.push({ tone:T.warn, title:`${p.name}'s card expiring soon`, sub:`${owner?.name||""} · ${days} days left`, page:"clients" });
    });
    const pendingPrints = pets.filter(p=>p.printStatus==="Pending").length;
    if(pendingPrints>0) list.unshift({ tone:T.warn, title:`${pendingPrints} loyalty cards to print`, sub:"Physical card printing queue", page:"dashboard" });
    const pendingRegs = registrations.filter(r=>r.status==="Pending").length;
    if(pendingRegs>0 && user?.email===SUPER_ADMIN) list.unshift({ tone:T.danger, title:`${pendingRegs} account request${pendingRegs!==1?"s":""} to review`, sub:"Approve or deny new sign-ups", page:"accounts" });
    appointments.filter(a=>false).forEach(a=>{});
    return list;
  }, [accounts, pets, clients, appointments, registrations, user]);

  function goSearch(r){ setPage(r.page); setSearchQ(""); setSearchOpen(false); }

  function login(u){ try{ localStorage.setItem("pethub_auth","1"); localStorage.setItem("pethub_user",JSON.stringify(u)); }catch(e){} setUser(u); setAuthed(true); }
  function logout(){ try{ localStorage.removeItem("pethub_auth"); localStorage.removeItem("pethub_user"); }catch(e){} setProfileOpen(false); setAuthed(false); setPage("dashboard"); }
  function registerRequest(reg){ setRegistrations(p=>[...p, reg]); }

  function renderPage() {
    if (page === "dashboard")   return <Dashboard   db={db}/>;
    if (page === "transaction") return <Transaction db={db}/>;
    if (page === "history") return <AppointmentsPage db={db}/>;
    if (page === "cardrequests") return <CardRequestsPage db={db}/>;
    if (page === "branches")    return <BranchesPage db={db}/>;
    if (page === "accounts")    return <AccountsPage db={db}/>;
    if (page === "clients")     return <ClientsPage  db={db}/>;
    if (page === "promotions")  return <PromotionsPage db={db}/>;
    return <Dashboard db={db}/>;
  }

  if (!authed) return <LoginScreen onLogin={login} onRegister={registerRequest} admins={ADMINS} registrations={registrations} branches={branches} clients={clients} clientEmails={clients.map(c=>(c.email||"").toLowerCase())}/>;
  if (user?.role === "Client") return <ClientPortal user={user} db={db} onLogout={logout}/>;

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif", background:T.bg }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width:collapsed?64:210, background:T.sidebar, flexShrink:0, display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh", overflowY:"auto", transition:"width .2s ease", zIndex:50 }}>

        {/* Logo */}
        <div style={{ padding:collapsed?"12px 0":"14px 18px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid rgba(255,255,255,.07)", justifyContent:collapsed?"center":"flex-start", minHeight:72 }}>
          <img
            src="logo-gold.png"
            alt="Pet Hub Logo"
            style={{ width:collapsed?40:46, height:collapsed?40:46, borderRadius:"50%", objectFit:"contain", background:"linear-gradient(135deg,#0f6b4a,#073d2b)", padding:5, flexShrink:0, border:"1px solid rgba(212,175,55,.4)", transition:"all .2s" }}
          />
          {!collapsed && (
            <div>
              <p style={{ color:"#fff", fontWeight:800, fontSize:14.5, letterSpacing:".04em", lineHeight:1.1 }}>PET HUB REWARDS</p>
              <p style={{ color:"rgba(255,255,255,.4)", fontSize:10.5, fontWeight:500, letterSpacing:".05em" }}>Admin Portal</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px 0" }}>
          {NAV_ITEMS.map((item, idx) => {
            const isActive = page===item.id;
            const isHov    = hovNav===idx;
            const showGroup = item.group && (idx===0 || NAV_ITEMS[idx-1].group!==item.group);
            return (
              <div key={item.id}>
                {showGroup && !collapsed && (
                  <p style={{ padding:"16px 18px 6px", fontSize:10, fontWeight:700, color:"rgba(255,255,255,.3)", textTransform:"uppercase", letterSpacing:".12em" }}>
                    {item.group}
                  </p>
                )}
                <button
                  onClick={()=>setPage(item.id)}
                  onMouseEnter={()=>setHovNav(idx)}
                  onMouseLeave={()=>setHovNav(null)}
                  style={{
                    width:"100%", display:"flex", alignItems:"center", gap:11,
                    padding:collapsed?"13px 0":"10px 18px",
                    background:isActive?"rgba(16,185,129,.15)":(isHov?"rgba(255,255,255,.05)":"transparent"),
                    border:"none", borderLeft:isActive?`3px solid ${T.accent}`:"3px solid transparent",
                    cursor:"pointer", color:isActive?"#fff":(isHov?"rgba(255,255,255,.85)":"rgba(255,255,255,.5)"),
                    fontSize:13.5, fontWeight:isActive?600:400, transition:"all .15s",
                    justifyContent:collapsed?"center":"flex-start",
                  }}>
                  <Icon d={item.iconD} size={17} color={isActive?T.accent:(isHov?"rgba(255,255,255,.85)":"rgba(255,255,255,.4)")} stroke/>
                  {!collapsed && item.label}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button onClick={()=>setCollapsed(c=>!c)} style={{ padding:"14px 0", display:"flex", justifyContent:"center", alignItems:"center", background:"none", border:"none", borderTop:"1px solid rgba(255,255,255,.07)", cursor:"pointer", color:"rgba(255,255,255,.35)", transition:"color .15s" }}
          onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,.7)"}
          onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.35)"}>
          <Icon d={collapsed?Icons.expand:Icons.collapse} size={16} color="currentColor" stroke/>
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, overflow:"hidden" }}>

        {/* Top Bar */}
        <header style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"0 28px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, position:"sticky", top:0, zIndex:40, height:60, flexShrink:0 }}>
          <div style={{ position:"relative", maxWidth:340, flex:1 }}>
            <input value={searchQ}
              onChange={e=>{ setSearchQ(e.target.value); setSearchOpen(true); }}
              onFocus={()=>setSearchOpen(true)}
              onBlur={()=>setTimeout(()=>setSearchOpen(false),150)}
              placeholder="Search clients, pets, transactions…" style={{ ...css.input, paddingLeft:38, fontSize:13 }}/>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
              <Icon d={Icons.search} size={15} color={T.subtle} stroke/>
            </span>
            {searchOpen && searchQ.trim() && (
              <div style={{ position:"absolute", top:"calc(100% + 8px)", left:0, right:0, background:"rgba(255,255,255,.12)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", borderRadius:14, border:"1px solid rgba(255,255,255,.22)", boxShadow:"0 16px 44px rgba(0,0,0,.35)", overflow:"hidden", zIndex:60, maxHeight:380, overflowY:"auto" }}>
                {searchResults.length===0
                  ? <p style={{ padding:"18px", fontSize:13, color:T.subtle, textAlign:"center" }}>No results for “{searchQ}”.</p>
                  : searchResults.map((r,i)=>(
                    <button key={i} onMouseDown={()=>goSearch(r)} style={{ width:"100%", display:"flex", alignItems:"center", gap:11, padding:"10px 14px", border:"none", borderBottom:i<searchResults.length-1?`1px solid ${T.border}`:"none", background:"transparent", cursor:"pointer", textAlign:"left" }}
                      onMouseEnter={e=>e.currentTarget.style.background=T.surfaceAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{ fontSize:10, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:".05em", background:T.bg, borderRadius:6, padding:"3px 7px", flexShrink:0, minWidth:74, textAlign:"center" }}>{r.type}</span>
                      <span style={{ minWidth:0 }}>
                        <span style={{ display:"block", fontSize:13.5, fontWeight:600, color:T.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.label}</span>
                        <span style={{ display:"block", fontSize:11.5, color:T.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.sub}</span>
                      </span>
                    </button>
                  ))
                }
              </div>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ position:"relative" }}>
              <button onClick={()=>setNotifOpen(o=>!o)} style={{ background:notifOpen?T.bg:"none", border:"none", cursor:"pointer", color:T.muted, padding:6, borderRadius:8, position:"relative" }}>
                <Icon d={Icons.bell} size={19} color={T.muted} stroke/>
                {notifications.length>0 && <span style={{ position:"absolute", top:1, right:1, minWidth:15, height:15, borderRadius:99, background:T.danger, border:`2px solid ${T.surface}`, color:"#fff", fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" }}>{notifications.length}</span>}
              </button>
              {notifOpen && (
                <>
                  <div onClick={()=>setNotifOpen(false)} style={{ position:"fixed", inset:0, zIndex:55 }}/>
                  <div style={{ position:"absolute", top:"calc(100% + 10px)", right:0, width:320, background:"rgba(255,255,255,.12)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", borderRadius:14, border:"1px solid rgba(255,255,255,.22)", boxShadow:"0 16px 44px rgba(0,0,0,.35)", overflow:"hidden", zIndex:60 }}>
                    <div style={{ padding:"13px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <p style={{ fontSize:13.5, fontWeight:700, color:T.text }}>Notifications</p>
                      <span style={{ fontSize:11, fontWeight:700, color:"#fff", background:T.danger, borderRadius:99, padding:"2px 8px" }}>{notifications.length}</span>
                    </div>
                    <div style={{ maxHeight:360, overflowY:"auto" }}>
                      {notifications.length===0
                        ? <p style={{ padding:"24px 16px", fontSize:13, color:T.subtle, textAlign:"center" }}>You're all caught up.</p>
                        : notifications.map((n,i)=>(
                          <button key={i} onClick={()=>{ setPage(n.page); setNotifOpen(false); }} style={{ width:"100%", display:"flex", gap:11, alignItems:"flex-start", padding:"11px 16px", border:"none", borderBottom:i<notifications.length-1?`1px solid ${T.border}`:"none", background:"transparent", cursor:"pointer", textAlign:"left" }}
                            onMouseEnter={e=>e.currentTarget.style.background=T.surfaceAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <span style={{ width:8, height:8, borderRadius:"50%", background:n.tone, marginTop:5, flexShrink:0 }}/>
                            <span style={{ minWidth:0 }}>
                              <span style={{ display:"block", fontSize:13, fontWeight:600, color:T.text, lineHeight:1.35 }}>{n.title}</span>
                              <span style={{ display:"block", fontSize:11.5, color:T.muted, marginTop:1 }}>{n.sub}</span>
                            </span>
                          </button>
                        ))
                      }
                    </div>
                  </div>
                </>
              )}
            </div>
            <div style={{ width:1, height:28, background:T.border }}/>
            <div style={{ position:"relative" }}>
              <div onClick={()=>setProfileOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"4px 6px", borderRadius:9, background:profileOpen?T.bg:"transparent" }}>
                <div style={{ width:34, height:34, borderRadius:9, background:`${T.accent}18`, border:`1.5px solid ${T.accent}30`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon d={Icons.account} size={17} color={T.accent} stroke/>
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:T.text, lineHeight:1.2 }}>{user?.name || "Jeremiah Munoz"}</p>
                  <p style={{ fontSize:11, color:T.muted }}>{user?.role || "Administrator"}</p>
                </div>
                <Icon d={Icons.chevronD} size={14} color={T.subtle} stroke/>
              </div>
              {profileOpen && (
                <>
                  <div onClick={()=>setProfileOpen(false)} style={{ position:"fixed", inset:0, zIndex:55 }}/>
                  <div style={{ position:"absolute", top:"calc(100% + 10px)", right:0, width:230, background:"rgba(255,255,255,.12)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", borderRadius:14, border:"1px solid rgba(255,255,255,.22)", boxShadow:"0 16px 44px rgba(0,0,0,.35)", overflow:"hidden", zIndex:60 }}>
                    <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}` }}>
                      <p style={{ fontSize:13.5, fontWeight:700, color:T.text }}>{user?.name || "Jeremiah Munoz"}</p>
                      <p style={{ fontSize:11.5, color:T.muted, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user?.email || "admin@pethub.ph"}</p>
                      <span style={{ display:"inline-block", marginTop:8, fontSize:10.5, fontWeight:700, color:T.accent, background:`${T.accent}15`, borderRadius:6, padding:"3px 8px", textTransform:"uppercase", letterSpacing:".05em" }}>{user?.role || "Administrator"}</span>
                    </div>
                    <div style={{ padding:6 }}>
                      {[["Account settings",Icons.edit],["Notification preferences",Icons.bell]].map(([label,ic])=>(
                        <button key={label} onClick={()=>setProfileOpen(false)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px", border:"none", background:"transparent", cursor:"pointer", borderRadius:8, fontSize:13, color:T.text, textAlign:"left" }}
                          onMouseEnter={e=>e.currentTarget.style.background=T.surfaceAlt} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <Icon d={ic} size={15} color={T.muted} stroke/> {label}
                        </button>
                      ))}
                    </div>
                    <div style={{ padding:6, borderTop:`1px solid ${T.border}` }}>
                      <button onClick={logout} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 10px", border:"none", background:"transparent", cursor:"pointer", borderRadius:8, fontSize:13, fontWeight:600, color:T.danger, textAlign:"left" }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(248,113,113,.12)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={16} color={T.danger} stroke/> Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main key={page} style={{ flex:1, padding:28, overflowY:"auto" }}>
          {renderPage()}
        </main>

        {/* Footer */}
        <footer style={{ padding:"12px 28px", borderTop:`1px solid ${T.border}`, background:T.surface, display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12, color:T.subtle }}>
          <span>PetHub Rewards Admin</span>
          <span>Cafecircuit © 2025</span>
        </footer>
      </div>
    </div>
  );
}

window.PetHubApp = App;
if (typeof module !== "undefined") { try { module.exports = { PetHubApp: App }; } catch(e){} }
