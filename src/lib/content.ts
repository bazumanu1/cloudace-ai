export type Question = {
  id: string
  topic: string
  difficulty: 'Beginner' | 'Intermediate'
  prompt: string
  options: string[]
  answer: number[]
  explanation: string
  source: string
  sourceUrl: string
  format: 'single' | 'multiple'
}

export type Flashcard = {
  id: string
  topic: string
  front: string
  back: string
}

export type LearningModule = {
  id: string
  topic: string
  title: string
  description: string
  duration: number
  sourceUrl: string
}

const learn = 'https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-900'

export const topics = [
  'Cloud concepts',
  'Azure architecture and services',
  'Azure management and governance',
]

export const questions: Question[] = [
  {
    id: 'cloud-01',
    topic: topics[0],
    difficulty: 'Beginner',
    prompt: 'A retailer expects a short burst of traffic during a seasonal sale. Which cloud benefit lets it add resources during the sale and release them afterward?',
    options: ['Elasticity', 'Data residency', 'High availability', 'Governance'],
    answer: [0],
    explanation: 'Elasticity is the ability to automatically increase or decrease resources as demand changes. It can help a retailer respond to a sale without keeping peak capacity all year.',
    source: 'Microsoft Learn: Describe cloud computing',
    sourceUrl: 'https://learn.microsoft.com/training/modules/describe-cloud-compute/',
    format: 'single',
  },
  {
    id: 'cloud-02',
    topic: topics[0],
    difficulty: 'Beginner',
    prompt: 'Which two are cloud deployment models? Select all that apply.',
    options: ['Hybrid cloud', 'Private cloud', 'Serverless cloud', 'Relational cloud'],
    answer: [0, 1],
    explanation: 'Public, private, and hybrid are cloud deployment models. Serverless is a cloud computing approach, while relational describes a data model.',
    source: 'Microsoft Learn: Describe cloud computing',
    sourceUrl: 'https://learn.microsoft.com/training/modules/describe-cloud-compute/',
    format: 'multiple',
  },
  {
    id: 'cloud-03',
    topic: topics[0],
    difficulty: 'Beginner',
    prompt: 'In a public cloud, the customer is still responsible for securing their data and identities.',
    options: ['True', 'False'],
    answer: [0],
    explanation: 'Cloud security is a shared responsibility. The provider secures parts of the cloud infrastructure, while customers retain responsibilities such as managing identities and protecting their data.',
    source: 'Microsoft Learn: Shared responsibility in the cloud',
    sourceUrl: 'https://learn.microsoft.com/training/modules/describe-cloud-service-types/',
    format: 'single',
  },
  {
    id: 'arch-01',
    topic: topics[1],
    difficulty: 'Beginner',
    prompt: 'What is an Azure region?',
    options: [
      'A geographic area containing one or more datacenters connected by a low-latency network',
      'A billing profile shared by all subscriptions',
      'A single virtual machine host',
      'A customer-managed firewall rule',
    ],
    answer: [0],
    explanation: 'An Azure region is a geographic area that contains one or more datacenters connected through a dedicated, low-latency network. Region selection can affect latency and data residency.',
    source: 'Microsoft Learn: Describe Azure architecture and services',
    sourceUrl: 'https://learn.microsoft.com/training/modules/describe-core-architectural-components-of-azure/',
    format: 'single',
  },
  {
    id: 'arch-02',
    topic: topics[1],
    difficulty: 'Beginner',
    prompt: 'A team wants to run an application without managing the underlying virtual machines. Which service category best fits?',
    options: ['Platform as a service (PaaS)', 'Infrastructure as a service (IaaS)', 'On-premises hosting', 'A private cloud only'],
    answer: [0],
    explanation: 'PaaS provides a managed platform for building or running applications. The provider manages more of the underlying infrastructure than with IaaS.',
    source: 'Microsoft Learn: Describe cloud service types',
    sourceUrl: 'https://learn.microsoft.com/training/modules/describe-cloud-service-types/',
    format: 'single',
  },
  {
    id: 'arch-03',
    topic: topics[1],
    difficulty: 'Intermediate',
    prompt: 'Which Azure service is designed to provide private network connectivity between Azure resources?',
    options: ['Azure Virtual Network', 'Azure Cost Management', 'Azure Policy', 'Microsoft Purview'],
    answer: [0],
    explanation: 'Azure Virtual Network provides a private network environment for Azure resources to communicate with each other, the internet, and on-premises networks.',
    source: 'Microsoft Learn: Azure Virtual Network',
    sourceUrl: 'https://learn.microsoft.com/azure/virtual-network/virtual-networks-overview',
    format: 'single',
  },
  {
    id: 'gov-01',
    topic: topics[2],
    difficulty: 'Beginner',
    prompt: 'Which tool can help an organization estimate the cost of Azure products before deployment?',
    options: ['Azure Pricing calculator', 'Azure Service Health', 'Azure Monitor', 'Microsoft Entra ID'],
    answer: [0],
    explanation: 'The Azure Pricing calculator helps estimate costs for Azure products and configurations. Actual charges depend on usage and applicable terms.',
    source: 'Microsoft Learn: Describe cost management in Azure',
    sourceUrl: 'https://learn.microsoft.com/training/modules/describe-cost-management-azure/',
    format: 'single',
  },
  {
    id: 'gov-02',
    topic: topics[2],
    difficulty: 'Beginner',
    prompt: 'What is the primary purpose of Azure Policy?',
    options: [
      'To create, assign, and manage rules that help enforce organizational standards',
      'To replace every identity provider',
      'To guarantee that every workload has zero downtime',
      'To automatically set the price of each subscription',
    ],
    answer: [0],
    explanation: 'Azure Policy helps create, assign, and manage policies that enforce organizational standards and assess compliance at scale.',
    source: 'Microsoft Learn: Describe features and tools for governance',
    sourceUrl: 'https://learn.microsoft.com/training/modules/describe-features-tools-governance/',
    format: 'single',
  },
  {
    id: 'gov-03',
    topic: topics[2],
    difficulty: 'Intermediate',
    prompt: 'Which service provides information about Azure service issues that may affect a specific Azure service or region?',
    options: ['Azure Service Health', 'Azure Advisor', 'Azure Policy', 'Azure Resource Manager'],
    answer: [0],
    explanation: 'Azure Service Health provides personalized information about service incidents, planned maintenance, and health advisories relevant to the services and regions a customer uses.',
    source: 'Microsoft Learn: Describe monitoring tools in Azure',
    sourceUrl: 'https://learn.microsoft.com/training/modules/describe-monitoring-tools-azure/',
    format: 'single',
  },
]

export const flashcards: Flashcard[] = [
  { id: 'fc-cloud-1', topic: topics[0], front: 'What does elasticity mean in cloud computing?', back: 'Resources can scale up or down to match changing demand. For example, a shop can add capacity for a sale and release it afterward.' },
  { id: 'fc-cloud-2', topic: topics[0], front: 'What is the shared responsibility model?', back: 'Cloud security responsibilities are divided between the provider and customer. The exact split varies by service type; customers always retain responsibility for their data and identities.' },
  { id: 'fc-cloud-3', topic: topics[0], front: 'How do IaaS, PaaS, and SaaS differ?', back: 'IaaS gives you more infrastructure control; PaaS manages more of the platform; SaaS provides a ready-to-use application. The provider manages more as you move toward SaaS.' },
  { id: 'fc-arch-1', topic: topics[1], front: 'What is an Azure region?', back: 'A geographic area containing one or more datacenters connected by a low-latency network.' },
  { id: 'fc-arch-2', topic: topics[1], front: 'What is an availability zone?', back: 'A physically separate location within an Azure region, with independent power, cooling, and networking.' },
  { id: 'fc-arch-3', topic: topics[1], front: 'What is Azure Virtual Network for?', back: 'It provides a private network environment for Azure resources to communicate securely with each other and other networks.' },
  { id: 'fc-gov-1', topic: topics[2], front: 'What does Azure Policy help organizations do?', back: 'Create, assign, and manage rules that enforce organizational standards and assess compliance.' },
  { id: 'fc-gov-2', topic: topics[2], front: 'Which tool estimates Azure product costs?', back: 'The Azure Pricing calculator helps estimate the cost of planned configurations. Actual charges depend on usage and applicable terms.' },
]

export const modules: LearningModule[] = [
  { id: 'module-cloud', topic: topics[0], title: 'Describe cloud computing', description: 'Explore cloud benefits, deployment models, and the shared responsibility model.', duration: 18, sourceUrl: 'https://learn.microsoft.com/training/modules/describe-cloud-compute/' },
  { id: 'module-service', topic: topics[0], title: 'Describe cloud service types', description: 'Compare IaaS, PaaS, and SaaS with practical examples.', duration: 22, sourceUrl: 'https://learn.microsoft.com/training/modules/describe-cloud-service-types/' },
  { id: 'module-architecture', topic: topics[1], title: 'Describe Azure architecture', description: 'Learn about regions, availability zones, resources, and subscriptions.', duration: 25, sourceUrl: 'https://learn.microsoft.com/training/modules/describe-core-architectural-components-of-azure/' },
  { id: 'module-network', topic: topics[1], title: 'Explore core Azure services', description: 'Meet common compute, networking, and storage building blocks.', duration: 30, sourceUrl: 'https://learn.microsoft.com/training/modules/describe-azure-compute-networking-services/' },
  { id: 'module-governance', topic: topics[2], title: 'Describe governance tools', description: 'Understand Azure Policy, resource locks, and governance organization.', duration: 24, sourceUrl: 'https://learn.microsoft.com/training/modules/describe-features-tools-governance/' },
  { id: 'module-cost', topic: topics[2], title: 'Describe cost management', description: 'Learn about factors that affect costs and the tools that help manage them.', duration: 20, sourceUrl: 'https://learn.microsoft.com/training/modules/describe-cost-management-azure/' },
]

export const examGuideUrl = learn
