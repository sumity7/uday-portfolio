export const profile = {
  name: 'Udayraj Yadav',
  role: 'Senior Engineer, Battery Energy Storage Systems',
  location: 'Ahmedabad, India',
  email: 'uraj9973@gmail.com',
  phone: '+91 88097 63820',
  phoneHref: 'tel:+918809763820',
  linkedin: 'https://www.linkedin.com/in/udayraj-yadav-0a170817a',
};

export type Job = {
  from: string;
  to: string;
  year: string;
  title: string;
  company: string;
  place: string;
  points: string[];
  promoted?: boolean;
};

/** Chronological, so the busbar "charges" toward the present. */
export const jobs: Job[] = [
  {
    from: 'Jun 2022',
    to: 'Jan 2024',
    year: '2022',
    title: 'Graduate Engineer Trainee, Testing & Validation (R&D)',
    company: 'Sieger Robotek Electric Pvt. Ltd.',
    place: 'Haryana',
    points: [
      'BMS and battery pack testing to AIS-156 and UL-1642 safety standards.',
      'Helped achieve AIS-156 Phase-2 safety certification for new pack lines.',
      'Supported prototype development, design verification testing and technical reporting.',
    ],
  },
  {
    from: 'Jan 2024',
    to: 'Mar 2025',
    year: '2024',
    title: 'Jr. Engineer, Testing & Validation (R&D)',
    company: 'Kabra Extrusiontechnik Ltd. (Battrixx)',
    place: 'Pune',
    points: [
      'Cell- and pack-level testing, test plan creation and validation strategy for Li-ion technology.',
      'Electrochemical characterisation, extended lifecycle testing, HPPC and DCIR analysis.',
      'Validated SOC/SOH estimation models; ran FMEA and root cause analysis for NPD cell selection.',
    ],
  },
  {
    from: 'Apr 2025',
    to: 'Apr 2026',
    year: '2025',
    title: 'Engineer, Testing & Validation (R&D)',
    company: 'Grace Renewable Energy Ltd.',
    place: 'Ahmedabad',
    points: [
      'Validated Li-ion packs for BESS, ESS and EV applications across 2W, 3W and 4W.',
      'BMS hardware testing, calibration, SOC/SOH algorithm validation and CAN diagnostics.',
      'Drove plant commissioning, machine installation, process automation and supplier coordination.',
    ],
  },
  {
    from: 'Apr 2026',
    to: 'Present',
    year: '2026',
    title: 'Senior Engineer, Testing & Validation (R&D)',
    company: 'Grace Renewable Energy Ltd.',
    place: 'Ahmedabad',
    promoted: true,
    points: [
      'Leads NPD, testing validation and commissioning of utility-scale and commercial BESS projects.',
      'Led integration and commissioning of liquid-cooled 361.72 kWh and 261.24 kWh platforms and 160.76 kWh packs with PCS, inverters and EMS.',
      'Writes and runs DVP protocols, safety testing and compliance documentation for IEC, UL and UN.',
    ],
  },
];

export const stats = [
  { value: 361.72, decimals: 2, unit: 'kWh', label: 'Largest liquid-cooled BESS platform integrated and commissioned' },
  { value: 4, decimals: 0, unit: '+ yrs', label: 'Hands-on in battery R&D, testing and validation' },
  { value: 3, decimals: 0, unit: 'BESS', label: 'Platforms integrated: 361.72, 261.24 and 160.76 kWh' },
  { value: 3, decimals: 0, unit: 'EV', label: 'Vehicle segments validated: 2W, 3W and 4W' },
];

export const marqueeRows: string[][] = [
  ['BESS integration', 'Commissioning', 'PCS', 'Inverters', 'EMS', 'Liquid cooling', 'New product development'],
  ['SOC / SOH validation', 'BMS calibration', 'CAN diagnostics', 'HPPC', 'DCIR', 'Lifecycle testing', 'Cell balancing'],
  ['IEC', 'UL', 'UN', 'AIS-156 Phase-2', 'UL-1642', 'EMI / EMC', 'FMEA', 'Root cause analysis'],
];

export const skillGroups = [
  { title: 'Systems integration', items: ['BESS 361.72 kWh (liquid-cooled)', 'BESS 261.24 kWh (liquid-cooled)', '160.76 kWh packs', 'Inverter & PCS', 'EMS', 'Commissioning', 'NPD'] },
  { title: 'BMS & battery testing', items: ['Cell & pack validation', 'SOC/SOH algorithms', 'BMS hardware testing', 'Calibration', 'CAN diagnostics', 'Electrochemical characterisation', 'HPPC', 'DCIR', 'Lifecycle testing'] },
  { title: 'On the bench', items: ['Pack & cell cyclers', 'Oscilloscopes', 'Data loggers', 'IR meters', 'BMS testers', 'HV safety gear'] },
  { title: 'Quality', items: ['DVP preparation', 'FMEA', 'RCA', 'Kaizen', '5S', 'Process automation', 'Audit support'] },
];

export const certs = [
  { title: 'BESS Design, Architecture & System Integration', note: 'Certificate of Achievement', code: 'C-01' },
  { title: 'BESS Safety & Quality Standards', note: 'IEC/UL compliance and risk mitigation', code: 'C-02' },
  { title: 'BESS Installation & Commissioning', note: 'Inverter, PCS and EMS integration', code: 'C-03' },
  { title: 'Advanced Battery Management Systems', note: 'SOC/SOH, protection, cell balancing, safety diagnostics', code: 'C-04' },
];

export const education = {
  degree: 'B.Tech (Hons), Electronics & Communication Engineering',
  school: 'IES College of Technology, Bhopal',
  years: '2018 to 2022',
};

export const languages = 'English and Hindi, full professional proficiency';

/** Suggestions the chat assistant offers before the first message. */
export const starterQuestions = [
  'What does Udayraj do?',
  'Tell me about his BESS projects',
  'What are his key skills?',
  'Walk me through his career',
  'How can I contact him?',
];
