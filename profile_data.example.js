/**
 * JobFlow Automation Extension - Profile Configuration Template
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to `profile_data.js` in the same directory:
 *    cp profile_data.example.js profile_data.js
 * 2. Customize with your personal qualifications, languages, and answers.
 * 3. Never commit `profile_data.js` (it is gitignored by default).
 */

const USER_PROFILE = {
  firstName: "Alex",
  lastName: "Taylor",
  fullName: "Alex Taylor",
  email: "candidate@example.com",
  phone: "600000000",
  phoneFull: "+34600000000",
  countryCode: "Spain (+34)",
  city: "Valencia, Spain",
  address: "Valencia, Spain",
  postalCode: "46001",
  portfolio: "https://your-portfolio.example.com",
  linkedin: "https://www.linkedin.com/in/your-profile/",

  // Keyword-to-numeric experience answers (in years)
  experienceMap: {
    "continuous improvement": "8",
    "mejora continua": "8",
    "lean six sigma": "8",
    "six sigma": "8",
    "operations": "8",
    "operaciones": "8",
    "process": "8",
    "procesos": "8",
    "quality": "6",
    "calidad": "6",
    "supply chain": "6",
    "cadena de suministro": "6",
    "manufacturing": "6",
    "manufactura": "6",
    "fabricación": "6",
    "automotive": "5",
    "automoción": "5",
    "cleanroom": "4",
    "sala blanca": "4",
    "iso 9001": "6",
    "root cause": "6",
    "8d": "6",
    "dmaic": "8",
    "default": "5"
  },

  // Yes / No screening rules
  booleanAnswers: [
    { patterns: ["authorized to work", "legally authorized", "autorizado para trabajar", "derecho a trabajar", "permiso de trabajo"], answer: "yes" },
    { patterns: ["require sponsorship", "require visa", "necesita patrocinio", "requiere visado"], answer: "no" },
    { patterns: ["driver's license", "driving licence", "licencia de conducir", "permiso de conducir", "carnet"], answer: "yes" },
    { patterns: ["commute", "relocate", "desplazarte", "reubicarte"], answer: "yes" },
    { patterns: ["travel", "viajar", "willing to travel", "disponibilidad para viajar"], answer: "yes" },
    { patterns: ["background check", "antecedentes", "verificación"], answer: "yes" },
    { patterns: ["black belt", "green belt", "six sigma certified", "certificado"], answer: "yes" },
    { patterns: ["degree", "título universitario", "licenciatura", "grado"], answer: "yes" },
    { patterns: ["fluent in english", "inglés", "english"], answer: "yes" },
    { patterns: ["spanish", "español"], answer: "yes" }
  ],

  // Dropdown text matches
  dropdownMap: {
    "english": ["professional", "fluent", "advanced", "c1", "c2", "full professional", "bilingüe", "alto"],
    "spanish": ["native", "bilingual", "nativo", "c2", "materno"],
    "portuguese": ["professional", "fluent", "advanced", "c1", "alto"],
    "education": ["bachelor", "degree", "universidad", "licenciatura", "grado", "master"],
    "notice": ["immediate", "1 month", "inmediata", "1 mes", "menos de 1 mes"],
    "travel": ["25%", "50%", "yes", "sí", "willing"]
  }
};

window.USER_PROFILE = USER_PROFILE;
