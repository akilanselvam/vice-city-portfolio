const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';

// The drive visits these in order; `area`/`sub` show as the GTA-style location name on arrival
export const stops = [
  { id: 'home', label: 'Title', area: 'Vice City', sub: 'Welcome' },
  { id: 'about', label: 'About', area: 'About me', sub: 'My story' },
  { id: 'skills', label: 'Skills', area: 'Skills', sub: 'My arsenal' },
  { id: 'projects', label: 'Projects', area: 'Projects', sub: 'Featured missions' },
  { id: 'experience', label: 'Experience', area: 'Experience', sub: 'Career journey' },
  { id: 'contact', label: 'Contact', area: 'Contact', sub: "Let's connect" },
  { id: 'freeroam', label: 'Driving school', area: 'Free roam', sub: 'Take the wheel' },
];

export const profile = {
  name: 'Akilan Selvam',
  logoMark: 'VI',
  role: 'Senior Software Engineer',
  company: 'Accenture',
  location: 'Puducherry, India',
  education: "Master's Degree",
  interests: ['Travel', 'Adventure', 'Tech'],
  tagline: ['Same cities', 'Different stories'],
  motto: ['Build', 'Deploy', 'Explore', 'Repeat'],
  // Drop images into /public/images and set e.g. '/images/me.jpg'
  photo: null,
  heroImage: null,
  bio: [
    'A Software Engineer who loves building scalable applications, solving complex problems and exploring new technologies.',
    "When I'm not coding, you'll probably find me traveling, exploring new places or trying adventurous experiences.",
  ],
  story: {
    journey:
      'I started out building web applications at Cognizant, shipping product enhancements and helping move systems to the cloud. Today at Accenture I build enterprise applications and scalable solutions alongside global teams.',
    drives:
      'I like turning messy, complex problems into clean, dependable systems. Good code should make life easier for the people who use it and the people who maintain it.',
    beyond:
      "Away from the keyboard I'm usually planning the next trip, exploring somewhere new or signing up for something a little adventurous. Same cities, different stories.",
  },
};

export const contact = {
  email: 'akilan.selvam@example.com',
  linkedin: 'https://www.linkedin.com/in/akilan-selvam',
  github: 'https://github.com/akilan-selvam',
  location: 'Puducherry, India',
};

export const skillCategories = [
  { id: 'all', label: 'All skills' },
  { id: 'backend', label: 'Backend' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'cloud', label: 'Cloud & DevOps' },
  { id: 'database', label: 'Database' },
  { id: 'tools', label: 'Tools' },
];

export const skills = [
  { name: 'Java', logo: `${DEVICON}/java/java-original.svg`, cats: ['backend'] },
  { name: 'Spring Boot', logo: `${DEVICON}/spring/spring-original.svg`, cats: ['backend'] },
  { name: 'Microservices', icon: 'Network', cats: ['backend'] },
  { name: 'JavaScript', logo: `${DEVICON}/javascript/javascript-original.svg`, cats: ['frontend', 'backend'] },
  { name: 'React', logo: `${DEVICON}/react/react-original.svg`, cats: ['frontend'] },
  { name: 'HTML & CSS', logo: `${DEVICON}/html5/html5-original.svg`, cats: ['frontend'] },
  { name: 'Azure', logo: `${DEVICON}/azure/azure-original.svg`, cats: ['cloud'] },
  { name: 'Docker', logo: `${DEVICON}/docker/docker-original.svg`, cats: ['cloud'] },
  { name: 'Kubernetes', logo: `${DEVICON}/kubernetes/kubernetes-original.svg`, cats: ['cloud'] },
  { name: 'SQL', icon: 'Database', cats: ['database'] },
  { name: 'Git', logo: `${DEVICON}/git/git-original.svg`, cats: ['tools'] },
  { name: 'Jenkins', logo: `${DEVICON}/jenkins/jenkins-original.svg`, cats: ['cloud'] },
  { name: 'Linux', logo: `${DEVICON}/linux/linux-original.svg`, cats: ['cloud'] },
  { name: 'Postman', logo: `${DEVICON}/postman/postman-original.svg`, cats: ['tools'] },
  { name: 'Azure DevOps', logo: `${DEVICON}/azuredevops/azuredevops-original.svg`, cats: ['cloud'] },
  { name: 'VS Code', logo: `${DEVICON}/vscode/vscode-original.svg`, cats: ['tools'] },
];

export const projectCategories = [
  { id: 'all', label: 'All projects' },
  { id: 'web', label: 'Web applications' },
  { id: 'microservices', label: 'Microservices' },
  { id: 'automation', label: 'Automation' },
  { id: 'cloud', label: 'Cloud & DevOps' },
];

export const projects = [
  {
    id: 'microservices',
    title: 'Microservices Ecosystem',
    category: 'microservices',
    description:
      'Developed a set of microservices with H2 database, REST APIs, Feign client, health checks and XML support.',
    tech: ['Java', 'Spring Boot', 'Docker', 'Kubernetes', 'Azure'],
    highlights: [
      'Modular microservices architecture',
      'REST APIs with XML and JSON support',
      'Service-to-service calls with Feign client',
      'Health checks for every service',
    ],
    icon: 'Boxes',
    palette: ['#ff2d95', '#2de2ff'],
    image: null,
    links: { github: null, live: null },
  },
  {
    id: 'ems',
    title: 'Employee Management System',
    category: 'web',
    description:
      'Full-stack application to manage employee records, departments and roles through a clean web interface.',
    tech: ['Java', 'Spring Boot', 'React', 'SQL'],
    highlights: [
      'CRUD workflows for employees and departments',
      'Search, filtering and pagination',
      'REST API backed by a relational database',
    ],
    icon: 'Users',
    palette: ['#ff9a3d', '#ff2d95'],
    image: null,
    links: { github: null, live: null },
  },
  {
    id: 'cicd',
    title: 'Cloud CI/CD Pipeline',
    category: 'cloud',
    description:
      'Automated build, test and deployment pipeline that ships containerised services to Azure.',
    tech: ['Azure DevOps', 'Docker', 'Kubernetes', 'Jenkins'],
    highlights: [
      'Build and test on every push',
      'Container images published to a registry',
      'Automated deployments to Kubernetes on Azure',
    ],
    icon: 'Workflow',
    palette: ['#2de2ff', '#8b3dff'],
    image: null,
    links: { github: null, live: null },
  },
  {
    id: 'scraper',
    title: 'Web Scraping Automation',
    category: 'automation',
    description:
      'Scheduled scrapers that collect, clean and export data from websites without manual effort.',
    tech: ['Java', 'JavaScript', 'Linux'],
    highlights: [
      'Scheduled, unattended runs',
      'Cleans and normalises scraped data',
      'Exports results for reporting',
    ],
    icon: 'Bot',
    palette: ['#8b3dff', '#ff2d95'],
    image: null,
    links: { github: null, live: null },
  },
];

export const experience = [
  {
    role: 'Senior Software Engineer',
    org: 'Accenture',
    period: 'Present',
    current: true,
    type: 'work',
    description:
      'Working on enterprise applications, building scalable solutions and collaborating with global teams.',
  },
  {
    role: 'Software Engineer',
    org: 'Cognizant',
    period: 'From Nov 2020',
    type: 'work',
    description:
      'Developed and maintained web applications, contributed to product enhancements and worked on cloud migrations.',
  },
  {
    role: "Master's Degree",
    org: '',
    period: 'Completed',
    type: 'education',
    description: "Completed my master's degree.",
  },
];
