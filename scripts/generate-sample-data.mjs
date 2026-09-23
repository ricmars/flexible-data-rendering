import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import prettier from 'prettier'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dataDirectory = resolve(root, 'data')
const field = (name, label, type, semanticRole, extra = {}) => ({
  name,
  label,
  type,
  semanticRole,
  ...extra,
})
const rankFields = (fields) => {
  const ranks = new Map()
  return fields.map((entry) => {
    const rank = (ranks.get(entry.semanticRole) ?? 0) + 1
    ranks.set(entry.semanticRole, rank)
    return { ...entry, rank }
  })
}
const semanticRoleFields = [
  field('referenceCode', 'Reference code', 'text', 'identifier'),
  field('objectType', 'Object type', 'text', 'objectType'),
  field('priorityLevel', 'Priority', 'select', 'priority', {
    format: 'ordinal',
  }),
  field('overdue', 'Overdue', 'boolean', 'flags'),
  field('locked', 'Locked', 'boolean', 'flags'),
  field('escalated', 'Escalated', 'boolean', 'flags'),
  field('confidential', 'Confidential', 'boolean', 'flags'),
  field('new', 'New', 'boolean', 'flags'),
  field('serviceLocation', 'Site address', 'text', 'location', {
    format: 'address',
  }),
  field('updatedAt', 'Last updated', 'date', 'temporal', {
    qualifier: 'updated',
  }),
  field('createdAt', 'Created', 'date', 'temporal', {
    qualifier: 'created',
  }),
  field('owner', 'Owner', 'text', 'people', { qualifier: 'owner' }),
  field('reviewer', 'Reviewer', 'text', 'people', {
    qualifier: 'reviewer',
  }),
  field('relatedRecord', 'Related record', 'text', 'relation'),
  field('attachmentCount', 'Attachments', 'number', 'attachment', {
    format: 'fileRef',
  }),
  field('syncNote', 'Sync annotation', 'text', 'annotation', {
    sensitivity: 'internal',
  }),
  field('detailRoute', 'Open record', 'text', 'navigation', {
    format: 'route',
  }),
  field('nextAction', 'Next action', 'text', 'action'),
  field('secondaryAction', 'Secondary action', 'text', 'action'),
  field('sortRank', 'Sort key', 'number', 'sortKey', {
    format: 'collation',
  }),
  field('groupBucket', 'Group', 'text', 'groupKey', { format: 'enumRef' }),
  field('searchIndex', 'Search text', 'text', 'searchText'),
  field('sensitivityLevel', 'Sensitivity', 'select', 'sensitivity', {
    format: 'policy',
  }),
]
const addSemanticRoleSamples = (record, index, definition) => {
  const sensitivityLevels = ['public', 'public', 'internal', 'confidential']
  const sensitivityLevel = sensitivityLevels[index % sensitivityLevels.length]
  return {
    ...record,
    referenceCode: `${record.id.toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
    objectType: definition.name,
    priorityLevel: ['Low', 'Medium', 'High', 'Critical'][index % 4],
    overdue: index % 4 === 1,
    locked: index % 7 === 3,
    escalated: index % 5 === 2,
    confidential: index % 6 === 4,
    new: index % 4 === 1,
    serviceLocation: `${locations[index % locations.length]} · ${['Main St', 'Elm Ave', '4th Ave', 'Harbor Rd'][index % 4]}`,
    updatedAt: `2026-${String((index % 9) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
    createdAt: `2025-${String((index % 9) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
    owner: ['Alex Morgan', 'Jordan Lee', 'Taylor Brooks', 'Morgan Ellis'][
      index % 4
    ],
    reviewer: ['Priya Raman', 'Sam Okafor', 'Casey Nguyen', 'Avery Chen'][
      index % 4
    ],
    relatedRecord: `Related ${record.id.toUpperCase()}`,
    attachmentCount: index % 5,
    syncNote: `Synced from source system · v${(index % 4) + 1} · ${(index % 12) + 1}h ago`,
    detailRoute: `/records/${definition.id}/${record.id}`,
    nextAction: ['Review', 'Contact owner', 'Schedule follow-up', 'Archive'][
      index % 4
    ],
    secondaryAction: [
      'Open details',
      'Request update',
      'Assign reviewer',
      'Defer',
    ][index % 4],
    sortRank: index + 1,
    groupBucket: ['Intake', 'In progress', 'Review', 'Closed'][index % 4],
    searchIndex: `${record.id} ${definition.name}`,
    sensitivityLevel,
  }
}
const image = (photo, id) =>
  `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=1200&q=85&sig=${id}`
const writeJson = async (name, value) => {
  const contents = await prettier.format(JSON.stringify(value), {
    parser: 'json',
  })
  return writeFile(resolve(dataDirectory, name), contents)
}

const locations = [
  'Austin, TX',
  'Miami, FL',
  'Denver, CO',
  'Chicago, IL',
  'Portland, OR',
  'New York, NY',
  'Seattle, WA',
  'Boston, MA',
  'Atlanta, GA',
  'San Diego, CA',
]
const portraits = [
  '1500648767791-00dcc994a43e',
  '1494790108377-be9c29b29330',
  '1507003211169-0a1dd7228f2d',
  '1534528741775-53994a69daeb',
  '1506794778202-cad84cf45f1d',
]

const definitions = [
  {
    id: 'vehicle',
    file: 'vehicles.json',
    name: 'Vehicle',
    description:
      'A flexible vehicle content model for marketplace and catalog experiences.',
    fields: [
      field('make', 'Make', 'text', 'title'),
      field('model', 'Model', 'text', 'subtitle'),
      field('year', 'Year', 'number', 'highlight'),
      field('price', 'Price', 'currency', 'metric'),
      field('mileage', 'Mileage', 'number', 'metric'),
      field('location', 'Location', 'text', 'highlight'),
      field('fuel', 'Fuel type', 'select', 'tags'),
      field('transmission', 'Transmission', 'select', 'tags'),
      field('body', 'Body style', 'select', 'highlight'),
      field('description', 'Description', 'long-text', 'description'),
      field('image', 'Hero image', 'image', 'media'),
      field('status', 'Listing status', 'select', 'status'),
    ],
    bases: [
      ['Volvo', 'XC90 Recharge', 'Hybrid', 'SUV', '1519641471654-76ce0107ad1b'],
      [
        'Porsche',
        '911 Carrera 4 GTS',
        'Gasoline',
        'Coupe',
        '1503376780353-7e6692767b70',
      ],
      [
        'Land Rover',
        'Defender 110',
        'Gasoline',
        'SUV',
        '1533473359331-0135ef1b58bf',
      ],
      ['BMW', 'i5 M60 xDrive', 'Electric', 'Sedan', '1555215695-3004980ad54e'],
      [
        'Rivian',
        'R1S Adventure',
        'Electric',
        'SUV',
        '1619767886558-efdc259cde1a',
      ],
      ['Audi', 'RS 6 Avant', 'Gasoline', 'Wagon', '1606664515524-ed2f786a0bd6'],
      [
        'Lexus',
        'GX 550 Overtrail',
        'Gasoline',
        'SUV',
        '1606016159991-dfe4f2746ad5',
      ],
      [
        'Ford',
        'Bronco Wildtrak',
        'Gasoline',
        'SUV',
        '1537984822441-cff330075342',
      ],
      [
        'Tesla',
        'Model S Plaid',
        'Electric',
        'Sedan',
        '1560958089-b8a1929cea89',
      ],
      ['Toyota', 'Land Cruiser', 'Hybrid', 'SUV', '1594502184342-2e12f877aa73'],
    ],
    record: ([make, model, fuel, body, photo], index) => ({
      id: `v${String(index + 1).padStart(2, '0')}`,
      make,
      model: index >= 10 ? `${model} ${index + 1}` : model,
      year: 2024 - (index % 4),
      price: 39800 + ((index * 7311) % 118000),
      mileage: 2200 + ((index * 1879) % 24000),
      location: locations[index % locations.length],
      fuel,
      transmission: index % 9 === 0 ? 'Manual' : 'Automatic',
      body,
      description: `${make} ${model} combines considered design, everyday usability, and confident performance for its segment.`,
      image: image(photo, `vehicle-${index + 1}`),
      status: index % 3 === 0 ? 'Available' : 'Rented',
    }),
  },
  {
    id: 'phone',
    file: 'phones.json',
    name: 'Phone',
    description:
      'A device catalog model for communications and mobility teams.',
    fields: [
      field('brand', 'Brand', 'text', 'title'),
      field('model', 'Model', 'text', 'subtitle'),
      field('releaseYear', 'Release year', 'number', 'highlight'),
      field('price', 'Price', 'currency', 'metric'),
      field('storage', 'Storage', 'text', 'highlight'),
      field('market', 'Market', 'text', 'highlight'),
      field('os', 'Operating system', 'select', 'tags'),
      field('network', 'Network', 'select', 'tags'),
      field('description', 'Description', 'long-text', 'description'),
      field('image', 'Product image', 'image', 'media'),
      field('status', 'Availability', 'select', 'status'),
    ],
    bases: [
      ['Apple', 'iPhone 16 Pro Max', 'iOS', '1511707171634-5f897ff02aa9'],
      ['Samsung', 'Galaxy S25 Ultra', 'Android', '1610792516307-ea5acd9c3b00'],
      ['Google', 'Pixel 9 Pro Fold', 'Android', '1592286927505-2fd0b9e3f4b3'],
      ['OnePlus', 'OnePlus 13', 'Android', '1598327105666-5b89351aff97'],
      ['Sony', 'Xperia 1 VI', 'Android', '1512941937669-90a1b58e7e9c'],
    ],
    record: ([brand, model, os, photo], index) => ({
      id: `ph${String(index + 1).padStart(2, '0')}`,
      brand,
      model: index >= 5 ? `${model} ${Math.floor(index / 5) + 1}` : model,
      releaseYear: 2026 - (index % 3),
      price: 699 + ((index * 137) % 1100),
      storage: ['128 GB', '256 GB', '512 GB', '1 TB'][index % 4],
      market: ['North America', 'Europe', 'Asia Pacific', 'Latin America'][
        index % 4
      ],
      os,
      network: '5G',
      description: `${model} is configured for demanding mobile workflows, photography, and reliable all-day communication.`,
      image: image(photo, `phone-${index + 1}`),
      status: ['Available', 'Low stock', 'Preorder', 'Discontinued'][index % 4],
    }),
  },
  {
    id: 'organization',
    file: 'organizations.json',
    name: 'Organization',
    description:
      'A sales account model for organizations, segments, and account value.',
    fields: [
      field('name', 'Account name', 'text', 'title'),
      field('accountType', 'Account type', 'text', 'subtitle'),
      field('annualValue', 'Annual value', 'currency', 'metric'),
      field('employees', 'Employees', 'number', 'highlight'),
      field('headquarters', 'Headquarters', 'text', 'highlight'),
      field('sector', 'Sector', 'select', 'tags'),
      field('tier', 'Account tier', 'select', 'tags'),
      field('description', 'Description', 'long-text', 'description'),
      field('image', 'Organization image', 'image', 'media'),
      field('status', 'Lifecycle', 'select', 'status'),
    ],
    bases: [
      [
        'Northstar Health',
        'Strategic account',
        'Healthcare',
        '1556761175-b413da4baf72',
      ],
      [
        'Summit Financial',
        'Enterprise account',
        'Financial services',
        '1556761175-4b46a572b786',
      ],
      [
        'Harbor Logistics',
        'Growth account',
        'Logistics',
        '1497366811353-6870744d04b2',
      ],
      [
        'Pioneer Foods',
        'Mid-market account',
        'Consumer goods',
        '1497366754035-f200968a6e72',
      ],
      [
        'Cedar Technologies',
        'Technology account',
        'Software',
        '1497366216548-37526070297c',
      ],
    ],
    record: ([name, accountType, sector, photo], index) => ({
      id: `org${String(index + 1).padStart(2, '0')}`,
      name:
        index >= 5
          ? `${name} ${['Group', 'International', 'Holdings', 'Partners'][index % 4]}`
          : name,
      accountType,
      annualValue: 85000 + ((index * 48131) % 1400000),
      employees: 240 + ((index * 347) % 12000),
      headquarters: locations[index % locations.length],
      sector,
      tier: ['Enterprise', 'Growth', 'Strategic'][index % 3],
      description: `${name} is an active ${sector.toLowerCase()} account with a coordinated expansion plan and measurable operating goals.`,
      image: image(photo, `organization-${index + 1}`),
      status: ['Active', 'In review', 'Prospect', 'Dormant'][index % 4],
    }),
  },
  {
    id: 'sales-person',
    file: 'sales-people.json',
    name: 'Sales person',
    description:
      'A revenue team model for roles, territories, quota, and pipeline.',
    fields: [
      field('fullName', 'Full name', 'text', 'title'),
      field('role', 'Role', 'text', 'subtitle'),
      field('pipeline', 'Pipeline value', 'currency', 'metric'),
      field('quotaAttainment', 'Quota attainment', 'number', 'progress'),
      field('territory', 'Territory', 'text', 'highlight'),
      field('expertise', 'Expertise', 'tags', 'tags'),
      field('bio', 'Bio', 'long-text', 'description'),
      field('image', 'Portrait', 'image', 'media'),
      field('status', 'Availability', 'select', 'status'),
    ],
    bases: [
      ['Alex Morgan', 'Enterprise account executive'],
      ['Jordan Lee', 'Strategic partnerships lead'],
      ['Taylor Brooks', 'Commercial account executive'],
      ['Morgan Ellis', 'Customer success director'],
      ['Casey Rivera', 'Regional sales manager'],
      ['Riley Chen', 'Solutions consultant'],
      ['Avery Patel', 'Account director'],
      ['Sam Wilson', 'Partner manager'],
      ['Jamie Stone', 'Revenue operations lead'],
      ['Drew Carter', 'Business development manager'],
    ],
    record: ([fullName, role], index) => ({
      id: `sp${String(index + 1).padStart(2, '0')}`,
      fullName:
        index >= 10
          ? `${fullName} ${['Sr.', 'II', 'Lead', 'Principal'][index % 4]}`
          : fullName,
      role,
      pipeline: 180000 + ((index * 67311) % 1800000),
      quotaAttainment: 72 + ((index * 11) % 61),
      territory: locations[index % locations.length],
      expertise: [
        ['Enterprise', 'Healthcare'],
        ['Partnerships', 'EMEA'],
        ['Growth', 'SaaS'],
      ][index % 3],
      bio: `${fullName} builds durable customer relationships through disciplined discovery, clear account planning, and outcome-focused execution.`,
      image: image(
        portraits[index % portraits.length],
        `sales-person-${index + 1}`,
      ),
      status: ['Available', 'In meeting', 'Traveling', 'Out of office'][
        index % 4
      ],
    }),
  },
  {
    id: 'building',
    file: 'buildings.json',
    name: 'Building',
    description:
      'A property model for commercial assets, systems, and operations.',
    fields: [
      field('name', 'Building name', 'text', 'title'),
      field('buildingType', 'Building type', 'text', 'subtitle'),
      field('assetValue', 'Asset value', 'currency', 'metric'),
      field('floorArea', 'Floor area', 'number', 'metric'),
      field('yearBuilt', 'Year built', 'number', 'highlight'),
      field('address', 'Address', 'text', 'highlight'),
      field('energyRating', 'Energy rating', 'select', 'tags'),
      field('systems', 'Systems', 'tags', 'tags'),
      field('description', 'Description', 'long-text', 'description'),
      field('image', 'Exterior image', 'image', 'media'),
      field('status', 'Condition', 'select', 'status'),
    ],
    bases: [
      [
        'One World Trade Center',
        'Commercial tower',
        '1486406146926-c627a92ad1ab',
      ],
      ['The Shard', 'Mixed-use landmark', '1524230572899-a752b3835840'],
      ['Salesforce Tower', 'Class A office', '1487958449943-2429e8be8625'],
      ['Marina Bay Offices', 'Waterfront campus', '1497366811353-6870744d04b2'],
      ['The Edge', 'Sustainable workplace', '1497366754035-f200968a6e72'],
    ],
    record: ([name, buildingType, photo], index) => ({
      id: `bld${String(index + 1).padStart(2, '0')}`,
      name:
        index >= 5
          ? `${name} ${['North', 'Annex', 'Plaza', 'Center'][index % 4]}`
          : name,
      buildingType,
      assetValue: 12000000 + ((index * 3700000) % 180000000),
      floorArea: 48000 + ((index * 19300) % 950000),
      yearBuilt: 1985 + (index % 40),
      address: locations[index % locations.length],
      energyRating: ['A', 'A+', 'B', 'LEED Gold'][index % 4],
      systems: [
        ['HVAC', 'Access control'],
        ['Solar', 'Smart metering'],
        ['Fire safety', 'Elevators'],
      ][index % 3],
      description: `${name} is a professionally operated ${buildingType.toLowerCase()} with modern tenant services and monitored building systems.`,
      image: image(photo, `building-${index + 1}`),
      status: ['Excellent', 'Good', 'Renovation', 'Inspection due'][index % 4],
    }),
  },
  {
    id: 'account',
    file: 'accounts.json',
    name: 'Bank account',
    description:
      'A banking model for customer accounts, balances, and products.',
    fields: [
      field('accountHolder', 'Account holder', 'text', 'title'),
      field('accountType', 'Account type', 'text', 'subtitle'),
      field('balance', 'Balance', 'currency', 'metric'),
      field('openedYear', 'Opened year', 'number', 'highlight'),
      field('branch', 'Branch', 'text', 'highlight'),
      field('products', 'Products', 'tags', 'tags'),
      field('notes', 'Notes', 'long-text', 'description'),
      field('image', 'Avatar', 'image', 'media'),
      field('status', 'Account status', 'select', 'status'),
    ],
    bases: [
      ['Olivia Bennett', 'Premier checking'],
      ['Noah Williams', 'High-yield savings'],
      ['Emma Thompson', 'Business checking'],
      ['Liam Martinez', 'Investment account'],
      ['Sophia Anderson', 'Student checking'],
      ['Ethan Walker', 'Money market'],
      ['Mia Robinson', 'Joint checking'],
      ['Lucas Clark', 'Retirement account'],
      ['Amelia Lewis', 'Private banking'],
      ['James Young', 'Small business savings'],
    ],
    record: ([accountHolder, accountType], index) => ({
      id: `acc${String(index + 1).padStart(2, '0')}`,
      accountHolder:
        index >= 10 ? `${accountHolder} ${index + 1}` : accountHolder,
      accountType,
      balance: 3500 + ((index * 19273) % 480000),
      openedYear: 2004 + (index % 22),
      branch: locations[index % locations.length],
      products: [
        ['Debit card', 'Bill pay'],
        ['Savings', 'Overdraft protection'],
        ['Advisory', 'Investments'],
      ][index % 3],
      notes: `${accountHolder} maintains an established relationship with regular account activity and current customer documentation.`,
      image: image(portraits[index % portraits.length], `account-${index + 1}`),
      status: ['Active', 'Review required', 'Restricted', 'Dormant'][index % 4],
    }),
  },
  {
    id: 'case',
    file: 'cases.json',
    name: 'Service case',
    description:
      'A public service model for requests, programs, and case progress.',
    fields: [
      field('title', 'Case title', 'text', 'title'),
      field('caseType', 'Case type', 'text', 'subtitle'),
      field('priorityScore', 'Priority score', 'number', 'metric'),
      field('openedDate', 'Opened date', 'date', 'highlight'),
      field('district', 'District', 'text', 'highlight'),
      field('programs', 'Programs', 'tags', 'tags'),
      field('summary', 'Summary', 'long-text', 'description'),
      field('image', 'Case image', 'image', 'media'),
      field('status', 'Case status', 'select', 'status'),
    ],
    bases: [
      [
        'Streetlight repair request',
        'Infrastructure',
        '1486406146926-c627a92ad1ab',
      ],
      [
        'Housing support application',
        'Community services',
        '1497366811353-6870744d04b2',
      ],
      ['Business permit review', 'Licensing', '1497366754035-f200968a6e72'],
      ['Waste collection inquiry', 'Sanitation', '1497366216548-37526070297c'],
      [
        'Park maintenance report',
        'Parks and recreation',
        '1441974231531-c6227db76b6e',
      ],
    ],
    record: ([title, caseType, photo], index) => ({
      id: `case${String(index + 1).padStart(2, '0')}`,
      title: `${title} #${2401 + index}`,
      caseType,
      priorityScore: 60 + ((index * 17) % 390),
      openedDate: `2026-${String((index % 9) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
      district: `District ${(index % 8) + 1}`,
      programs: [
        caseType,
        ['Resident services', 'Operations', 'Compliance'][index % 3],
      ],
      summary: `${title} was submitted with complete contact details and is routed to the responsible service team for assessment.`,
      image: image(photo, `case-${index + 1}`),
      status: ['Open', 'In review', 'Scheduled', 'Resolved'][index % 4],
    }),
  },
  {
    id: 'patient',
    file: 'patients.json',
    name: 'Patient',
    description:
      'A healthcare model for care programs, centers, and patient status.',
    fields: [
      field('fullName', 'Patient name', 'text', 'title'),
      field('careType', 'Care type', 'text', 'subtitle'),
      field('careScore', 'Care score', 'number', 'metric'),
      field('lastVisit', 'Last visit', 'date', 'highlight'),
      field('careCenter', 'Care center', 'text', 'highlight'),
      field('programs', 'Programs', 'tags', 'tags'),
      field('notes', 'Care notes', 'long-text', 'description'),
      field('image', 'Profile image', 'image', 'media'),
      field('status', 'Care status', 'select', 'status'),
    ],
    bases: [
      ['Ava Mitchell', 'Primary care'],
      ['Henry Davis', 'Cardiology'],
      ['Isabella Moore', 'Orthopedics'],
      ['Benjamin Taylor', 'Neurology'],
      ['Charlotte Harris', 'Pediatrics'],
      ['Daniel Martin', 'Physical therapy'],
      ['Harper Jackson', 'Dermatology'],
      ['Matthew White', 'Endocrinology'],
      ['Evelyn Thomas', 'Oncology'],
      ['Sebastian Garcia', 'Pulmonology'],
    ],
    record: ([fullName, careType], index) => ({
      id: `pat${String(index + 1).padStart(2, '0')}`,
      fullName: index >= 10 ? `${fullName} ${index + 1}` : fullName,
      careType,
      careScore: 68 + ((index * 7) % 33),
      lastVisit: `2026-${String((index % 9) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
      careCenter: [
        'Northstar Medical Center',
        'Harbor Clinic',
        'Summit Health Pavilion',
        'Cedar Care Center',
      ][index % 4],
      programs: [
        [careType, 'Wellness'],
        [careType, 'Remote monitoring'],
        [careType, 'Follow-up'],
      ][index % 3],
      notes: `${fullName} has an active ${careType.toLowerCase()} plan with documented goals and a scheduled follow-up pathway.`,
      image: image(portraits[index % portraits.length], `patient-${index + 1}`),
      status: ['Stable', 'Follow-up due', 'Monitoring', 'Discharged'][
        index % 4
      ],
    }),
  },
  {
    id: 'policy',
    file: 'policies.json',
    name: 'Insurance policy',
    description:
      'An insurance model for policyholders, coverage, and renewals.',
    fields: [
      field('policyHolder', 'Policy holder', 'text', 'title'),
      field('policyType', 'Policy type', 'text', 'subtitle'),
      field('coverageValue', 'Coverage value', 'currency', 'metric'),
      field('annualPremium', 'Annual premium', 'currency', 'metric'),
      field('renewalDate', 'Renewal date', 'date', 'highlight'),
      field('region', 'Region', 'text', 'highlight'),
      field('coverage', 'Coverage', 'tags', 'tags'),
      field('notes', 'Policy notes', 'long-text', 'description'),
      field('image', 'Profile image', 'image', 'media'),
      field('status', 'Policy status', 'select', 'status'),
    ],
    bases: [
      ['Mason Cooper', 'Homeowners'],
      ['Ella King', 'Automobile'],
      ['Alexander Wright', 'Life'],
      ['Scarlett Lopez', 'Renters'],
      ['Michael Hill', 'Umbrella'],
      ['Grace Scott', 'Travel'],
      ['Jack Green', 'Commercial property'],
      ['Chloe Adams', 'Disability'],
      ['Owen Baker', 'Motorcycle'],
      ['Victoria Nelson', 'Professional liability'],
    ],
    record: ([policyHolder, policyType], index) => ({
      id: `pol${String(index + 1).padStart(2, '0')}`,
      policyHolder: index >= 10 ? `${policyHolder} ${index + 1}` : policyHolder,
      policyType,
      coverageValue: 100000 + ((index * 73117) % 1900000),
      annualPremium: 680 + ((index * 197) % 8400),
      renewalDate: `2027-${String((index % 12) + 1).padStart(2, '0')}-15`,
      region: locations[index % locations.length],
      coverage: [
        [policyType, 'Liability'],
        [policyType, 'Replacement cost'],
        [policyType, 'Emergency assistance'],
      ][index % 3],
      notes: `${policyHolder}'s ${policyType.toLowerCase()} policy has verified coverage selections and a documented renewal path.`,
      image: image(portraits[index % portraits.length], `policy-${index + 1}`),
      status: ['Active', 'Renewal due', 'Under review', 'Lapsed'][index % 4],
    }),
  },
  {
    id: 'plant',
    file: 'plants.json',
    name: 'Manufacturing plant',
    description:
      'A manufacturing model for facilities, capacity, and operations.',
    fields: [
      field('name', 'Plant name', 'text', 'title'),
      field('plantType', 'Plant type', 'text', 'subtitle'),
      field('capacity', 'Annual capacity', 'number', 'metric'),
      field('utilization', 'Utilization', 'number', 'progress'),
      field('commissioned', 'Commissioned', 'number', 'highlight'),
      field('location', 'Location', 'text', 'highlight'),
      field('capabilities', 'Capabilities', 'tags', 'tags'),
      field('overview', 'Overview', 'long-text', 'description'),
      field('image', 'Plant image', 'image', 'media'),
      field('status', 'Operations', 'select', 'status'),
    ],
    bases: [
      ['Riverside Assembly', 'Vehicle assembly', '1486406146926-c627a92ad1ab'],
      [
        'Summit Components',
        'Electronics manufacturing',
        '1497366811353-6870744d04b2',
      ],
      ['Harbor Processing', 'Food processing', '1497366754035-f200968a6e72'],
      ['Pioneer Materials', 'Advanced materials', '1497366216548-37526070297c'],
      ['Cedar Packaging', 'Packaging facility', '1487958449943-2429e8be8625'],
    ],
    record: ([name, plantType, photo], index) => ({
      id: `plt${String(index + 1).padStart(2, '0')}`,
      name:
        index >= 5
          ? `${name} ${['North', 'East', 'Campus', 'Line'][index % 4]}`
          : name,
      plantType,
      capacity: 85000 + ((index * 17291) % 720000),
      utilization: 61 + ((index * 7) % 39),
      commissioned: 1988 + (index % 37),
      location: locations[index % locations.length],
      capabilities: [
        [plantType, 'Quality assurance'],
        ['Automation', 'Distribution'],
        ['Fabrication', 'Sustainability'],
      ][index % 3],
      overview: `${name} is a monitored ${plantType.toLowerCase()} site with established quality controls and active production planning.`,
      image: image(photo, `plant-${index + 1}`),
      status: ['Operational', 'Maintenance', 'Ramp-up', 'Inspection'][
        index % 4
      ],
    }),
  },
]

await mkdir(dataDirectory, { recursive: true })
await Promise.all(
  definitions.flatMap((definition) => {
    const records = Array.from({ length: 50 }, (_, index) =>
      definition.record(
        definition.bases[index % definition.bases.length],
        index,
      ),
    )
    return [
      writeJson(`${definition.id}-model.json`, {
        name: definition.name,
        description: definition.description,
        fields: rankFields([...definition.fields, ...semanticRoleFields]),
      }),
      writeJson(
        definition.file,
        records.map((record, index) =>
          addSemanticRoleSamples(record, index, definition),
        ),
      ),
    ]
  }),
)

console.log(
  `Generated ${definitions.length} schemas and ${definitions.length * 50} sample records.`,
)
