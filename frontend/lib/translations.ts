export type Language = "en" | "so";

export const translations = {
  en: {
    // Navigation
    home: "Home",
    jobs: "Jobs",
    services: "Services",
    trainings: "Training",
    about: "About",
    contact: "Contact",
    login: "Login",
    register: "Register",
    dashboard: "Dashboard",
    logout: "Logout",

    // Auth
    email: "Email",
    password: "Password",
    name: "Name",
    confirmPassword: "Confirm Password",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
    forgotPassword: "Forgot Password?",

    // Jobs
    searchJobs: "Search Jobs",
    jobTitle: "Job Title",
    location: "Location",
    salary: "Salary",
    applyNow: "Apply Now",
    viewDetails: "View Details",
    postedBy: "Posted by",
    applications: "Applications",
    createJob: "Create Job",
    jobDescription: "Job Description",
    requirements: "Requirements",
    benefits: "Benefits",
    // Training
    searchTrainings: "Search Training Programs",
    enroll: "Enroll",
    duration: "Duration",
    cost: "Cost",
    free: "Free",
    provider: "Provider",
    schedule: "Schedule",
    startDate: "Start Date",
    availableSeats: "Available Seats",
    learningOutcomes: "What You Will Learn",
    contactProvider: "Contact Provider",
    whatYouWillLearn: "What You Will Learn",
    aboutProgram: "About This Program",
    providerInformation: "Provider Information",

    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    submit: "Submit",
    search: "Search",
    filter: "Filter",

    firstName: "First Name",
    lastName: "Last Name",
    phoneNumber: "Phone Number",

    // placeholders
    enterFirstName: "Enter your first name",
    enterLastName: "Enter your last name",
    enterEmail: "Enter your email",
    enterPhone: "Enter your phone number",
    enterPassword: "Minimum 6 characters",
    confirmYourPassword: "Re-enter your password",

    // address / location
    address: "Street / Area",
    city: "City / Town",
    region: "State / Region",
    postalCode: "Postal Code (Optional)",
    country: "Country",
    locationOptional: "Location (Optional)",

    // Theme
    theme: {
      light: "Light / Iftiin",
      dark: "Dark / Madow",
    },

    // Language
    language: {
      toggle: "Switch language (English / Soomaali)",
    },
  },
  so: {
    // Navigation
    home: "BoggaHore",
    jobs: "Shaqooyin",
    services: "Adeegyo",
    trainings: "Tababaro",
    about: "Nagu Saabsan",
    contact: "Nagala-Xiriir",
    login: "Gal",
    register: "Isdiiwaangeli",
    dashboard: "Dashboard-ka",
    logout: "Ka-Bax",

    // Auth
    email: "Email",
    password: "Password",
    name: "Magaca",
    confirmPassword: "Confirm Furaha Sirta",
    alreadyHaveAccount: "Aad horeba aad haysatay akoon?",
    dontHaveAccount: "Ma hayso akoon?",
    forgotPassword: "Ilowday Furaha Sirta?",

    // Jobs
    searchJobs: "Raadi Shaqooyin",
    jobTitle: "Magaca Shaqada",
    location: "Goobta",
    salary: "Mushaarka",
    applyNow: "Codso Hadda",
    viewDetails: "Eeg Faahfaahinta",
    postedBy: "Waxa soo geliyay",
    applications: "Codsiyada",
    createJob: "Abuur-Shaqo",
    jobDescription: "Faahfaahinta Shaqada",
    requirements: "Shuruudaha",
    benefits: "Faa'iidooyinka",

    // Training
    searchTrainings: "Raadi Barnaamijyo Tababar",
    enroll: "Isqor",
    duration: "Waqtiga",
    cost: "Qiimaha",
    free: "Bilaash",
    provider: "Bixiyaha",
    schedule: "Jadwalka",
    startDate: "Taariikhda Bilowga",
    availableSeats: "boosaska Weli banaan",
    learningOutcomes: "Waxyaabaha Aad Baran Doonto",
    contactProvider: "La Xiriir Bixiyaha",
    whatYouWillLearn: "Waxaad Baran Doontaa",
    aboutProgram: "Ku Saabsan Barnaamijkan",
    providerInformation: "Macluumaadka Bixiyaha",

    // Common
    loading: "Waa lagu wadaa, Wax yar sug...",
    error: "Qalad",
    success: "Guul",
    save: "Keydso",
    cancel: "Jooji",
    delete: "Tirtir",
    edit: "Wax ka beddel",
    submit: "Dir",
    search: "Raadi",
    filter: "Kala-shaandhee",
    firstName: "Magaca Hore",
    lastName: "Magaca Dambe",
    phoneNumber: "Lambarka Taleefanka",

    // placeholders
    enterFirstName: "Geli magacaaga hore",
    enterLastName: "Geli magacaaga dambe",
    enterEmail: "Geli email-kaaga",
    enterPhone: "Geli lambarkaaga",
    enterPassword: "Ugu yaraan 6 xaraf",
    confirmYourPassword: "Dib u geli furaha",

    // address / location
    address: "Cinwaanka / Aagga",
    city: "Magaalo",
    region: "Gobol",
    postalCode: "Koodhka Boostada (Ikhtiyaari)",
    country: "Waddanka",
    locationOptional: "Goobta (Ikhtiyaari)",

    // Theme
    theme: {
      light: "Iftiin / Light",
      dark: "Madow / Dark",
    },

    // Language
    language: {
      toggle: "Beddel luqadda (English / Soomaali)",
    },
  },
};

export const t = (key: string, lang: Language = "en"): string => {
  const keys = key.split(".");
  let value: any = translations[lang];

  for (const k of keys) {
    value = value?.[k];
  }

  if (value) return value;

  // Fallback to English
  value = translations.en;
  for (const k of keys) {
    value = value?.[k];
  }

  return value || key;
};
