// Portfolio content. Sources: the old portfolio export (PORTFOLIO_DATA.txt) and the LinkedIn profile
// (Profile.pdf + certifications), both supplied by Akilan on 2026-11-08.
// This file holds the content the sections show. src/data/portfolio.js still defines the list of stops
// (used by the route code), but its old placeholder content is no longer read anywhere.

// Whole years since a 'YYYY-MM' date
const yearsSince = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  const now = new Date();
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  return Math.floor(months / 12);
};
export const YEARS = yearsSince('2020-11');

export const profile = {
  name: 'Akilan Selvam',
  role: 'Senior Software Engineer',
  company: 'Accenture',
  location: 'Puducherry, India',
  education: 'MBA (HR) · B.Tech (CSE)',
  interests: ['Travel', 'Adventure', 'Tech'],
  headline: 'Senior Software Engineer · Full Stack',
  tagline: ['Your friendly', 'neighbourhood coder'],
  motto: ['Build', 'Deploy', 'Explore', 'Repeat'],
  stack: ['Java', 'Spring Boot', 'React', 'Angular', 'Node.js', 'MongoDB', 'Azure', 'Docker'],
  // Drop an image into /public/images and set e.g. '/images/me.jpg'
  photo: null,
  bio: [
    `A full stack developer with ${YEARS} years of experience building robust, scalable web applications, now a Senior Software Engineer at Accenture.`,
    'I work across Java and Spring Boot, the MERN stack, and Angular with TypeScript, shipping with Docker and Azure. Alongside the tech, I hold an MBA in Human Resources Management.',
  ],
  story: {
    journey:
      'I started at Cognizant in November 2020 as a full stack Java engineer. Since April 2023 I have been at Accenture, building enterprise applications across Java and the MERN stack, including breaking a legacy monolith into microservices on Azure DevOps.',
    drives:
      'Clean, efficient code that performs well and feels good to use. I care about the people who use what I build and the people who maintain it, and I enjoy fast-paced teams where there is always something new to figure out.',
    beyond:
      'Side projects are how I keep learning: client websites, MERN apps and experiments like this portfolio. Away from the keyboard I am usually planning the next trip or signing up for something a little adventurous.',
  },
};

export const contact = {
  email: 'selvamakilan1@gmail.com',
  linkedin: 'https://www.linkedin.com/in/akilan-selvam-18293a171',
  github: 'https://github.com/akilanselvam',
  instagram: 'https://www.instagram.com/akilan_selvam_/',
  cv: 'https://drive.google.com/uc?export=download&id=1emBbO7b3uln4-2eMg3soAEADUBkxihAv',
  location: 'Puducherry, India',
};

/* ---------- Certifications ---------- */

// group: which filter it falls under. tier: expert / associate / fundamentals / specialty (badge colour).
// Dates are 'YYYY-MM'; status (valid / expired) is worked out from today's date.
export const certifications = [
  {
    id: 'ccdv-f',
    name: 'Claude Certified Developer – Foundations',
    code: 'CCDV-F',
    issuer: 'Anthropic',
    group: 'anthropic',
    tier: 'fundamentals',
    issued: '2026-09',
    expires: '2027-09',
    credentialId: null,
    url: null,
  },
  {
    id: 'gcp-ace',
    name: 'Google Cloud Certified: Associate Cloud Engineer',
    code: null,
    issuer: 'Google Cloud',
    group: 'google',
    tier: 'associate',
    issued: '2025-08',
    expires: '2028-08',
    credentialId: 'c52ba62dd2f94fa6b17a2a49e50f5697',
    url: null,
  },
  {
    id: 'gh-copilot',
    name: 'GitHub Copilot',
    code: null,
    issuer: 'Microsoft',
    group: 'microsoft',
    tier: 'specialty',
    issued: '2025-07',
    expires: '2027-07',
    credentialId: '640B4046F11481AD',
    url: null,
  },
  {
    id: 'az-400',
    name: 'Microsoft Certified: DevOps Engineer Expert',
    code: 'AZ-400',
    issuer: 'Microsoft',
    group: 'microsoft',
    tier: 'expert',
    issued: '2022-10',
    expires: '2026-10',
    credentialId: '9C875D7639C86AFB',
    url: 'https://www.credly.com/badges/926b8ca6-15e9-4bb8-bc42-78c6f11ed37e/public_url',
  },
  {
    id: 'az-204',
    name: 'Microsoft Certified: Azure Developer Associate',
    code: 'AZ-204',
    issuer: 'Microsoft',
    group: 'microsoft',
    tier: 'associate',
    issued: '2022-10',
    expires: '2026-10',
    credentialId: '9E100F76CD649209',
    url: 'https://www.credly.com/badges/05cfc685-103a-4a11-9ecd-d8d85b77bf8a/public_url',
  },
  {
    id: 'dp-900',
    name: 'Microsoft Certified: Azure Data Fundamentals',
    code: 'DP-900',
    issuer: 'Microsoft',
    group: 'microsoft',
    tier: 'fundamentals',
    issued: '2022-10',
    expires: null,
    credentialId: 'F2AFAB623C22A6D',
    url: 'https://www.credly.com/badges/4a73a07c-4435-4172-b6d1-e67548b15814/public_url',
  },
  {
    id: 'az-900',
    name: 'Microsoft Certified: Azure Fundamentals',
    code: 'AZ-900',
    issuer: 'Microsoft',
    group: 'microsoft',
    tier: 'fundamentals',
    issued: '2022-10',
    expires: null,
    credentialId: '1E4748A361AFBE03',
    url: 'https://www.credly.com/badges/ce68d2dc-cdbb-4ae1-95cb-86078de98060/public_url',
  },
];

// Shorter learning: courses and course completions
export const courses = [
  { id: 'm220j', name: 'MongoDB for Java Developers', code: 'M220J', issuer: 'MongoDB University', url: 'https://university.mongodb.com/course_completion/a516e3db-186e-4c3a-9442-ab7d6899ddaa/printable?format=img' },
  { id: 'm001', name: 'MongoDB Basics', code: 'M001', issuer: 'MongoDB University', url: 'https://university.mongodb.com/course_completion/2fefd522-60b5-4b38-a3c4-9b2177be00ce/printable?format=img' },
  { id: 'node-bootcamp', name: 'Node.js, Express, MongoDB & More: The Complete Bootcamp', issuer: 'Udemy', url: 'https://www.udemy.com/certificate/UC-39ef8736-08a9-4646-b450-2ffaa9c71f45/' },
  { id: 'aws-essentials', name: 'AWS Essentials', issuer: 'Udemy', url: 'https://www.udemy.com/certificate/UC-e9710687-62d9-486b-b03a-18332594ff69/' },
  { id: 'agile-scrum', name: 'The Complete Agile Scrum Fundamentals Course', issuer: 'Udemy', url: 'https://www.udemy.com/certificate/UC-ebec842e-41e2-46f8-81c3-2f62aa03ad37/' },
  { id: 'ztm', name: 'Zero To Mastery Academy', issuer: 'Zero To Mastery', year: 2022, url: null },
];

export const certGroups = [
  { id: 'all', label: 'All' },
  { id: 'microsoft', label: 'Microsoft' },
  { id: 'google', label: 'Google' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'courses', label: 'Courses' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthYear = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};
export const isExpired = (cert) => {
  if (!cert.expires) return false;
  const [y, m] = cert.expires.split('-').map(Number);
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth() >= y * 12 + (m - 1);
};
// Current certifications first (newest first), expired ones after
export const sortedCerts = () =>
  [...certifications].sort((a, b) => Number(isExpired(a)) - Number(isExpired(b)) || b.issued.localeCompare(a.issued));

/* ---------- Projects ---------- */

export const projectCategories = [
  { id: 'all', label: 'All projects' },
  { id: 'work', label: 'Work highlights' },
  { id: 'client', label: 'Client websites' },
  { id: 'side', label: 'Side projects' },
];

// Project screenshots live in public/images/projects (copied from the old portfolio's image host)
const shot = (name) => `${import.meta.env.BASE_URL}images/projects/${name}.jpg`;

// icon: one of the names in src/components/icons.js (shown when there is no image).
// The client-site and side-project descriptions are short drafts written from the project names, the
// live sites and the GitHub repos; Akilan to review and expand.
export const projects = [
  {
    id: 'ai-categorisation',
    title: 'AI-Driven Data Categorisation',
    category: 'work',
    description:
      'An application that sorts data automatically with a fine-tuned BERT model, trained on a Kaggle dataset and served from Hugging Face for real-time classification over an API.',
    tech: ['BERT', 'Hugging Face', 'Kaggle', 'REST API'],
    highlights: [
      'Fine-tuned BERT model for text classification',
      'Trained on a public Kaggle dataset',
      'Deployed on Hugging Face for real-time predictions',
      'Called from the application through an API',
      'Better-organised data without manual sorting',
    ],
    icon: 'Bot',
    palette: ['#8b3dff', '#2de2ff'],
    image: null,
    links: { github: null, live: null },
  },
  {
    id: 'legacy-modernisation',
    title: 'Modernised Legacy System',
    category: 'work',
    description:
      'Turned a monolithic application into microservices deployed through Azure DevOps, with automated pipelines that cut build times.',
    tech: ['Microservices', 'Azure DevOps', 'CI/CD', 'MVC'],
    highlights: [
      'Split a monolith into independent microservices',
      'Deployed and integrated through Azure DevOps',
      'Custom pipeline scripts automate the build and release',
      'Shorter build times',
      'Clean MVC structure, with hard-coded dependencies removed',
    ],
    icon: 'Boxes',
    palette: ['#ff2d95', '#2de2ff'],
    image: null,
    links: { github: null, live: null },
  },
  {
    id: 'spins-now',
    title: 'Spins Now App',
    category: 'client',
    description: 'A web app built around one idea: instant help at your fingertips.',
    tech: ['Web app', 'Firebase'],
    highlights: ['Live web app on Firebase Hosting', 'Built to get people help quickly'],
    icon: 'Rocket',
    palette: ['#ff9a3d', '#ff2d95'],
    image: null, // the only screenshot available was a 180 px thumbnail
    links: { github: null, live: 'https://spinsnowapp.web.app/' },
  },
  {
    id: 'ravi-plumbing',
    title: 'Ravi Plumbing Services',
    category: 'client',
    description: 'The website for a local plumbing business, presenting its services and making it easy for customers to get in touch.',
    tech: ['JavaScript', 'HTML & CSS'],
    highlights: ['Live business website', 'Services and contact details up front', 'Front-end source on GitHub'],
    icon: 'Workflow',
    palette: ['#2de2ff', '#8b3dff'],
    image: shot('ravi-plumbing'),
    links: { github: 'https://github.com/akilanselvam/RaviPlumbingServices-FrontEnd', live: 'https://raviplumbingservices.com/' },
  },
  {
    id: 'jaanavi-constructions',
    title: 'Jaanavi Constructions',
    category: 'client',
    description: 'The website for a construction company, showcasing its work and services.',
    tech: ['Website'],
    highlights: ['Live business website', 'Showcases projects and services'],
    icon: 'Boxes',
    palette: ['#ffd36b', '#ff9a3d'],
    image: shot('jaanavi-constructions'),
    links: { github: null, live: 'https://jaanaviconstructions.com/' },
  },
  {
    id: 'life-hack-hub',
    title: 'Life Hack Hub',
    category: 'client',
    description: 'A web app collecting practical life hacks for everyday problems.',
    tech: ['Web app', 'Firebase'],
    highlights: ['Live web app on Firebase Hosting', 'Quick, practical tips in one place'],
    icon: 'Rocket',
    palette: ['#7dff7a', '#2de2ff'],
    image: shot('life-hack-hub'),
    links: { github: null, live: 'https://lifehacksforall.web.app/' },
  },
  {
    id: 'lets-tweet-everyone',
    title: "Let's Tweet Everyone",
    category: 'side',
    description: 'A Twitter-style social app for posting short updates, built on the MERN stack.',
    tech: ['MongoDB', 'Express', 'React', 'Node.js'],
    highlights: ['Full MERN stack', 'Post and browse short updates'],
    icon: 'Users',
    palette: ['#2de2ff', '#8b3dff'],
    image: shot('lets-tweet-everyone'),
    links: { github: 'https://github.com/akilanselvam/Lets-Tweet-Everyone', live: null },
  },
  {
    id: 'find-your-dog',
    title: 'Find Your Dog',
    category: 'side',
    description: 'A React app for finding dogs.',
    tech: ['React', 'JavaScript', 'CSS'],
    highlights: ['Built with React'],
    icon: 'Rocket',
    palette: ['#ffd36b', '#ff2d95'],
    image: shot('find-your-dog'),
    links: { github: 'https://github.com/akilanselvam/Find-Your-Dog', live: null },
  },
  {
    id: 'student-info',
    title: 'Student Info Management',
    category: 'side',
    description: 'A management system for student details, built on the MERN stack.',
    tech: ['MongoDB', 'Express', 'React', 'Node.js'],
    highlights: ['Full MERN stack', 'Create, view and update student records'],
    icon: 'Database',
    palette: ['#8b3dff', '#ff2d95'],
    image: shot('student-info'),
    links: { github: 'https://github.com/akilanselvam/Student-Info-Management', live: null },
  },
  {
    id: 'anime-merch',
    title: 'Anime Merch',
    category: 'side',
    description: 'An online store for anime merchandise, built on the MERN stack.',
    tech: ['MongoDB', 'Express', 'React', 'Node.js', 'SCSS'],
    highlights: ['Full MERN stack', 'Store front for anime merchandise'],
    icon: 'Boxes',
    palette: ['#ff4fa8', '#7a4dff'],
    image: shot('anime-merch'),
    links: { github: 'https://github.com/akilanselvam/anime_merch', live: null },
  },
  {
    id: 'farm-store',
    title: 'Farm Store',
    category: 'side',
    description: 'A small farm produce store served by Node.js.',
    tech: ['Node.js', 'HTML'],
    highlights: ['Server-rendered pages from Node.js'],
    icon: 'Workflow',
    palette: ['#7dff7a', '#ffd36b'],
    image: shot('farm-store'),
    links: { github: 'https://github.com/akilanselvam/Farm-Store', live: null },
  },
  {
    id: 'natours',
    title: 'Natours Tour Booking',
    category: 'side',
    description: 'A tour booking site with a Node.js and Express back end, MongoDB and Pug templates.',
    tech: ['Node.js', 'Express', 'MongoDB', 'Pug'],
    highlights: ['REST API with Node.js and Express', 'MongoDB data models', 'Server-rendered Pug templates'],
    icon: 'Rocket',
    palette: ['#2de2ff', '#7dff7a'],
    image: shot('natours'),
    links: { github: 'https://github.com/akilanselvam/Natours-Tour-Booking', live: null },
  },
];

/* ---------- Experience and education ---------- */

export const experience = [
  {
    role: 'Senior Software Engineer',
    org: 'Accenture',
    place: 'Chennai',
    period: 'Apr 2023 – Present',
    current: true,
    type: 'work',
    description:
      'Full stack development across Java and the MERN stack on enterprise applications, including modernising a legacy monolith into microservices on Azure DevOps.',
  },
  {
    role: 'Software Engineer (FSE)',
    org: 'Cognizant',
    place: 'Chennai',
    period: 'Nov 2020 – Apr 2023',
    type: 'work',
    description: 'Full stack Java development: building and maintaining web applications and integrating APIs.',
  },
  {
    role: 'MBA, Human Resources Management',
    org: 'Pondicherry University',
    period: 'Jan 2022 – Jan 2024',
    type: 'education',
    description: 'Master of Business Administration in Human Resources Management and Services, completed alongside full-time work.',
  },
  {
    role: 'B.Tech, Computer Science',
    org: 'Christ College of Engineering and Technology',
    place: 'Puducherry',
    period: '2016 – 2020',
    type: 'education',
    description: 'Bachelor of Technology in Computer Science and Engineering.',
  },
];
