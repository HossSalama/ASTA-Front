/**
 * Temporary demo dataset for the public catalogue.
 *
 * The public site (home, courses, categories, instructors, search, course
 * details, learning player) has no live endpoints yet — the API either
 * requires auth or is not exposed publicly. Until those endpoints ship, the
 * catalogue facade falls back to this dataset so every public page renders a
 * complete, realistic experience.
 *
 * The admin dashboard is already wired to real endpoints and never touches
 * this file.
 */
import { CourseStatus } from '@/@types/adminManagement'
import type {
    AdminCourseSummaryResponse,
    CourseDetailResponse,
    InstructorResponse,
    InstructorDetailResponse,
    AdminCourseSectionDto,
} from '@/@types/adminManagement'
import type { CourseCategoryPublicResponse } from '@/@types/courseCategory'
import { ContentType, ContentItemStatus } from '@/@types/courseContent'

export const demoCategories: CourseCategoryPublicResponse[] = [
    { id: 1, nameEn: 'Web Development & Programming', nameAr: 'تطوير الويب والبرمجة' },
    { id: 2, nameEn: 'Mobile App Development', nameAr: 'تطوير تطبيقات الجوال' },
    { id: 3, nameEn: 'Artificial Intelligence & Machine Learning', nameAr: 'الذكاء الاصطناعي وتعلم الآلة' },
    { id: 4, nameEn: 'Data Science & Analytics', nameAr: 'علم البيانات والتحليل' },
    { id: 5, nameEn: 'Databases', nameAr: 'قواعد البيانات' },
    { id: 6, nameEn: 'UI/UX Design', nameAr: 'تصميم واجهات وتجربة المستخدم' },
    { id: 7, nameEn: 'Digital Marketing', nameAr: 'التسويق الرقمي' },
    { id: 8, nameEn: 'Business Management', nameAr: 'إدارة الأعمال' },
    { id: 9, nameEn: 'English Language', nameAr: 'اللغة الإنجليزية' },
]

const demoCourseThumbnails: Record<number, string> = {
    1: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=1200&q=80',
    2: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1200&q=80',
    3: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    4: 'https://images.unsplash.com/photo-1618477247222-acbdb0e159b3?auto=format&fit=crop&w=1200&q=80',
    5: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&w=1200&q=80',
    6: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    7: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
    8: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    9: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    10: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=1200&q=80',
    11: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    12: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
}

const demoInstructorAvatars: Record<number, string> = {
    1: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
    2: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    3: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    4: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    5: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    6: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
}

export const demoInstructors: InstructorResponse[] = [
    {
        id: 1,
        name: 'Layla Mansour',
        profileImageUrl: demoInstructorAvatars[1] ?? null,
        bio: 'Principal frontend engineer with 12 years building design systems and large-scale React applications for fintech and education products.',
        isActive: true,
        courseCount: 3,
        createdAt: '2024-02-11T09:00:00Z',
        updatedAt: null,
    },
    {
        id: 2,
        name: 'Omar Khalil',
        profileImageUrl: demoInstructorAvatars[2] ?? null,
        bio: 'Data scientist and former analytics lead. Teaches practical statistics, Python and decision-making with data.',
        isActive: true,
        courseCount: 2,
        createdAt: '2024-03-02T09:00:00Z',
        updatedAt: null,
    },
    {
        id: 3,
        name: 'Nour Al-Rashid',
        profileImageUrl: demoInstructorAvatars[3] ?? null,
        bio: 'Product designer focused on research-led interface design, accessibility and bilingual (Arabic/English) product work.',
        isActive: true,
        courseCount: 2,
        createdAt: '2024-04-18T09:00:00Z',
        updatedAt: null,
    },
    {
        id: 4,
        name: 'Yousef Haddad',
        profileImageUrl: demoInstructorAvatars[4] ?? null,
        bio: 'Cloud architect. Helps engineering teams move to containerised, automated delivery pipelines without breaking production.',
        isActive: true,
        courseCount: 1,
        createdAt: '2024-05-06T09:00:00Z',
        updatedAt: null,
    },
    {
        id: 5,
        name: 'Hana Sabri',
        profileImageUrl: demoInstructorAvatars[5] ?? null,
        bio: 'Growth marketer working with early-stage companies on positioning, content strategy and measurable acquisition.',
        isActive: true,
        courseCount: 1,
        createdAt: '2024-06-21T09:00:00Z',
        updatedAt: null,
    },
    {
        id: 6,
        name: 'Karim Fadel',
        profileImageUrl: demoInstructorAvatars[6] ?? null,
        bio: 'Operations director turned educator. Teaches management fundamentals for first-time team leads.',
        isActive: true,
        courseCount: 1,
        createdAt: '2024-07-14T09:00:00Z',
        updatedAt: null,
    },
]

type DemoCourseSeed = {
    id: number
    name: string
    shortDescription: string
    description: string
    categoryId: number
    instructorId: number
    price: number
    duration: number
    language: string
    ratingCount: number
    averageRating: number
    createdAt: string
    targetJobs: string[]
    requirements: string[]
    outline: { title: string; lessons: string[] }[]
}

const seeds: DemoCourseSeed[] = [
    {
        id: 1,
        name: 'Modern React: From Components to Production',
        shortDescription:
            'Build, test and ship maintainable React applications with hooks, routing and state management.',
        description:
            'A practical, project-driven course covering the way React is written on real teams today. You will build a full application from an empty folder to a deployed product: component architecture, hooks and derived state, routing, data fetching and caching, forms and validation, testing, and performance work. Each module ends with a hands-on task reviewed against a reference implementation.',
        categoryId: 1,
        instructorId: 1,
        price: 0,
        duration: 640,
        language: 'English',
        ratingCount: 412,
        averageRating: 4.8,
        createdAt: '2025-11-02T09:00:00Z',
        targetJobs: ['Frontend Engineer', 'Full-stack Developer', 'UI Engineer'],
        requirements: [
            'Comfortable with JavaScript fundamentals',
            'Basic HTML and CSS',
            'A code editor and Node.js installed',
        ],
        outline: [
            {
                title: 'Foundations',
                lessons: [
                    'How this course works',
                    'Rendering and the component model',
                    'Props, composition and children',
                    'Thinking in state',
                ],
            },
            {
                title: 'Hooks in depth',
                lessons: [
                    'useState and derived values',
                    'useEffect without the footguns',
                    'Custom hooks',
                    'Workshop: refactoring a messy component',
                ],
            },
            {
                title: 'Data and routing',
                lessons: [
                    'Client-side routing patterns',
                    'Fetching, caching and revalidation',
                    'Loading, empty and error states',
                ],
            },
            {
                title: 'Shipping',
                lessons: [
                    'Testing what matters',
                    'Performance budgets',
                    'Deploying and monitoring',
                ],
            },
        ],
    },
    {
        id: 2,
        name: 'Design Systems for Bilingual Products',
        shortDescription:
            'Create a token-driven design system that works equally well in Arabic and English.',
        description:
            'Design systems fail when they assume one language, one direction and one team. This course walks through building a system that survives contact with reality: naming and token structure, typography for Arabic and Latin scripts, mirroring layouts for RTL, component API design, documentation, and the governance needed to keep it alive after launch.',
        categoryId: 6,
        instructorId: 3,
        price: 79,
        duration: 420,
        language: 'English',
        ratingCount: 168,
        averageRating: 4.7,
        createdAt: '2025-10-12T09:00:00Z',
        targetJobs: ['Product Designer', 'Design Systems Lead', 'UI Engineer'],
        requirements: [
            'Working knowledge of a design tool such as Figma',
            'Familiarity with basic interface patterns',
        ],
        outline: [
            {
                title: 'Before the components',
                lessons: [
                    'What a design system is actually for',
                    'Auditing an existing interface',
                    'Token architecture',
                ],
            },
            {
                title: 'Type and direction',
                lessons: [
                    'Arabic and Latin typography together',
                    'Mirroring: what flips and what does not',
                    'Spacing and rhythm across scripts',
                ],
            },
            {
                title: 'Components and governance',
                lessons: [
                    'Designing component APIs',
                    'Documentation people will read',
                    'Contribution and review process',
                ],
            },
        ],
    },
    {
        id: 3,
        name: 'Practical Data Analysis with Python',
        shortDescription:
            'Turn raw spreadsheets into decisions using pandas, statistics and clear visual reporting.',
        description:
            'A hands-on introduction to analysis work as it is done on the job. Load messy data, clean it, ask precise questions, validate your answers, and present findings that a non-technical stakeholder can act on. Every module uses a real anonymised dataset.',
        categoryId: 4,
        instructorId: 2,
        price: 59,
        duration: 520,
        language: 'English',
        ratingCount: 297,
        averageRating: 4.6,
        createdAt: '2025-09-20T09:00:00Z',
        targetJobs: ['Data Analyst', 'Business Analyst', 'Operations Analyst'],
        requirements: [
            'No prior Python experience required',
            'Comfort with spreadsheets is helpful',
        ],
        outline: [
            {
                title: 'Getting to grips with data',
                lessons: [
                    'Setting up your environment',
                    'Loading and inspecting datasets',
                    'Cleaning: nulls, types and duplicates',
                ],
            },
            {
                title: 'Asking better questions',
                lessons: [
                    'Aggregation and grouping',
                    'Distributions and outliers',
                    'Correlation without confusion',
                ],
            },
            {
                title: 'Communicating findings',
                lessons: [
                    'Charts that answer a question',
                    'Writing the summary',
                    'Capstone analysis',
                ],
            },
        ],
    },
    {
        id: 4,
        name: 'TypeScript for Working Developers',
        shortDescription:
            'Add types to real codebases without fighting the compiler.',
        description:
            'A focused course on using TypeScript pragmatically: structural typing, generics where they earn their keep, narrowing, working with third-party types, and migrating an existing JavaScript project incrementally.',
        categoryId: 1,
        instructorId: 1,
        price: 49,
        duration: 300,
        language: 'English',
        ratingCount: 221,
        averageRating: 4.9,
        createdAt: '2025-08-05T09:00:00Z',
        targetJobs: ['Frontend Engineer', 'Backend Developer'],
        requirements: ['Day-to-day JavaScript experience'],
        outline: [
            {
                title: 'The type system',
                lessons: [
                    'Structural typing explained',
                    'Unions, narrowing and guards',
                    'Utility types you will actually use',
                ],
            },
            {
                title: 'In practice',
                lessons: [
                    'Generics that stay readable',
                    'Typing API boundaries',
                    'Migrating a JavaScript project',
                ],
            },
        ],
    },
    {
        id: 5,
        name: 'Containers and CI/CD with Docker and GitHub Actions',
        shortDescription:
            'Package, test and deploy applications through an automated pipeline.',
        description:
            'From a Dockerfile to a production deploy. Build reproducible images, compose local environments, write pipelines that fail fast, manage secrets, and roll out changes safely with health checks and rollbacks.',
        categoryId: 1,
        instructorId: 4,
        price: 89,
        duration: 480,
        language: 'English',
        ratingCount: 143,
        averageRating: 4.5,
        createdAt: '2025-07-11T09:00:00Z',
        targetJobs: ['DevOps Engineer', 'Platform Engineer', 'Backend Developer'],
        requirements: [
            'Command-line familiarity',
            'Experience deploying at least one application',
        ],
        outline: [
            {
                title: 'Containers',
                lessons: [
                    'Images, layers and caching',
                    'Writing a lean Dockerfile',
                    'Local environments with Compose',
                ],
            },
            {
                title: 'Pipelines',
                lessons: [
                    'Workflow anatomy',
                    'Testing and build stages',
                    'Secrets and environments',
                    'Deploying with rollback',
                ],
            },
        ],
    },
    {
        id: 6,
        name: 'Product Research and Usability Testing',
        shortDescription:
            'Run studies that change product decisions, not studies that decorate slides.',
        description:
            'Learn to plan and run lightweight research: choosing a method, recruiting participants, writing non-leading tasks, moderating sessions, synthesising findings, and reporting in a way that leads to a decision.',
        categoryId: 6,
        instructorId: 3,
        price: 0,
        duration: 260,
        language: 'English',
        ratingCount: 96,
        averageRating: 4.4,
        createdAt: '2025-06-28T09:00:00Z',
        targetJobs: ['Product Designer', 'UX Researcher', 'Product Manager'],
        requirements: ['None — suitable for anyone working on a product'],
        outline: [
            {
                title: 'Planning',
                lessons: [
                    'Picking the right method',
                    'Recruiting and screening',
                    'Writing tasks and scripts',
                ],
            },
            {
                title: 'Running and synthesising',
                lessons: [
                    'Moderating without leading',
                    'From notes to findings',
                    'Reporting for decisions',
                ],
            },
        ],
    },
    {
        id: 7,
        name: 'SQL for Analysts',
        shortDescription:
            'Query, join and aggregate confidently across production databases.',
        description:
            'Everything an analyst needs from SQL: selecting and filtering, joins that do what you expect, window functions, CTEs for readable queries, and performance basics so your reports do not time out.',
        categoryId: 5,
        instructorId: 2,
        price: 39,
        duration: 340,
        language: 'English',
        ratingCount: 184,
        averageRating: 4.7,
        createdAt: '2025-05-15T09:00:00Z',
        targetJobs: ['Data Analyst', 'Business Intelligence Developer'],
        requirements: ['Basic understanding of tables and spreadsheets'],
        outline: [
            {
                title: 'Core SQL',
                lessons: [
                    'Select, filter, sort',
                    'Joins and relationships',
                    'Grouping and aggregation',
                ],
            },
            {
                title: 'Beyond the basics',
                lessons: [
                    'Common table expressions',
                    'Window functions',
                    'Reading a query plan',
                ],
            },
        ],
    },
    {
        id: 8,
        name: 'Content Strategy That Drives Growth',
        shortDescription:
            'Plan, produce and measure content tied to real acquisition goals.',
        description:
            'A systems approach to content: mapping topics to demand, building a publishing cadence a small team can sustain, distribution beyond search, and measuring contribution instead of vanity metrics.',
        categoryId: 7,
        instructorId: 5,
        price: 45,
        duration: 240,
        language: 'English',
        ratingCount: 74,
        averageRating: 4.3,
        createdAt: '2025-04-09T09:00:00Z',
        targetJobs: ['Content Marketer', 'Growth Marketer', 'Founder'],
        requirements: ['Some exposure to marketing or running a product'],
        outline: [
            {
                title: 'Strategy',
                lessons: [
                    'Audience and demand mapping',
                    'Positioning your content',
                    'Building the calendar',
                ],
            },
            {
                title: 'Execution and measurement',
                lessons: [
                    'Production workflow',
                    'Distribution channels',
                    'Attribution basics',
                ],
            },
        ],
    },
    {
        id: 9,
        name: 'Leading a Team for the First Time',
        shortDescription:
            'The practical skills of management: one-to-ones, feedback, priorities and delegation.',
        description:
            'A calm, practical guide for new managers. Structure your first ninety days, run useful one-to-ones, give feedback that lands, set priorities you can defend, delegate without abandoning, and handle the difficult conversations that come with the role.',
        categoryId: 8,
        instructorId: 6,
        price: 65,
        duration: 280,
        language: 'English',
        ratingCount: 118,
        averageRating: 4.6,
        createdAt: '2025-03-19T09:00:00Z',
        targetJobs: ['Team Lead', 'Engineering Manager', 'Operations Manager'],
        requirements: ['Recently promoted or preparing for a lead role'],
        outline: [
            {
                title: 'The first ninety days',
                lessons: [
                    'Shifting from doing to leading',
                    'Meeting your team',
                    'Setting expectations',
                ],
            },
            {
                title: 'The recurring work',
                lessons: [
                    'One-to-ones with substance',
                    'Feedback and difficult conversations',
                    'Prioritisation and delegation',
                ],
            },
        ],
    },
    {
        id: 10,
        name: 'أساسيات تطوير الويب',
        shortDescription:
            'ابدأ من الصفر: HTML و CSS و JavaScript لبناء أول موقع كامل لك.',
        description:
            'دورة عملية باللغة العربية تأخذك من أول سطر HTML حتى نشر موقع متكامل. تتعلم بناء الصفحات، التنسيق باستخدام CSS، التعامل مع التفاعل عبر JavaScript، ثم تنشر مشروعك على الإنترنت مع مراجعة لكل خطوة.',
        categoryId: 1,
        instructorId: 1,
        price: 0,
        duration: 380,
        language: 'Arabic',
        ratingCount: 205,
        averageRating: 4.8,
        createdAt: '2026-01-08T09:00:00Z',
        targetJobs: ['مطور واجهات أمامية', 'مطور ويب'],
        requirements: ['لا توجد متطلبات سابقة', 'جهاز كمبيوتر واتصال بالإنترنت'],
        outline: [
            {
                title: 'البداية',
                lessons: [
                    'كيف يعمل الويب',
                    'بنية صفحة HTML',
                    'النصوص والروابط والصور',
                ],
            },
            {
                title: 'التنسيق',
                lessons: [
                    'أساسيات CSS',
                    'التخطيط باستخدام Flexbox',
                    'التصميم المتجاوب',
                ],
            },
            {
                title: 'التفاعل والنشر',
                lessons: [
                    'مقدمة في JavaScript',
                    'التعامل مع الأحداث',
                    'نشر المشروع',
                ],
            },
        ],
    },
    {
        id: 11,
        name: 'تحليل البيانات لاتخاذ القرار',
        shortDescription:
            'حوّل الأرقام إلى قرارات واضحة باستخدام جداول البيانات ولوحات المتابعة.',
        description:
            'دورة موجهة لمن يعمل مع البيانات دون خلفية برمجية. تتعلم تنظيف البيانات، بناء المؤشرات المناسبة، تصميم لوحة متابعة مفهومة، وعرض النتائج بطريقة تقود إلى قرار.',
        categoryId: 4,
        instructorId: 2,
        price: 55,
        duration: 300,
        language: 'Arabic',
        ratingCount: 88,
        averageRating: 4.5,
        createdAt: '2025-12-14T09:00:00Z',
        targetJobs: ['محلل بيانات', 'محلل أعمال'],
        requirements: ['إلمام بسيط بجداول البيانات'],
        outline: [
            {
                title: 'تجهيز البيانات',
                lessons: ['مصادر البيانات', 'التنظيف والتحقق', 'بناء المؤشرات'],
            },
            {
                title: 'العرض والقرار',
                lessons: [
                    'تصميم لوحة المتابعة',
                    'اختيار الرسم البياني المناسب',
                    'مشروع ختامي',
                ],
            },
        ],
    },
    {
        id: 12,
        name: 'Accessible Interfaces in Practice',
        shortDescription:
            'Meet WCAG in real products: semantics, keyboard flows and assistive technology.',
        description:
            'Accessibility as an engineering practice rather than a checklist. Semantic structure, focus management, keyboard-only flows, colour and contrast, ARIA when it is genuinely needed, and testing with screen readers.',
        categoryId: 6,
        instructorId: 3,
        price: 69,
        duration: 260,
        language: 'English',
        ratingCount: 61,
        averageRating: 4.7,
        createdAt: '2026-02-02T09:00:00Z',
        targetJobs: ['Frontend Engineer', 'Product Designer', 'QA Engineer'],
        requirements: ['Basic HTML and CSS'],
        outline: [
            {
                title: 'Foundations',
                lessons: [
                    'Why semantics come first',
                    'Keyboard navigation and focus',
                    'Colour, contrast and motion',
                ],
            },
            {
                title: 'Verification',
                lessons: [
                    'ARIA: when and when not',
                    'Testing with a screen reader',
                    'Building accessibility into review',
                ],
            },
        ],
    },
]

const categoryById = (id: number) => {
    const category = demoCategories.find((item) => item.id === id)
    return category
        ? { id: category.id, nameAr: category.nameAr, nameEn: category.nameEn }
        : null
}

const instructorById = (id: number) => {
    const instructor = demoInstructors.find((item) => item.id === id)
    return instructor
        ? {
              id: instructor.id,
              name: instructor.name,
              profileImageUrl:
                  instructor.profileImageUrl ??
                  demoInstructorAvatars[instructor.id] ??
                  null,
          }
        : null
}

const toSummary = (seed: DemoCourseSeed): AdminCourseSummaryResponse => ({
    id: seed.id,
    name: seed.name,
    shortDescription: seed.shortDescription,
    price: seed.price,
    duration: seed.duration,
    language: seed.language,
    ratingCount: seed.ratingCount,
    averageRating: seed.averageRating,
    createdAt: seed.createdAt,
    thumbnailFileId: null,
    thumbnailUrl: demoCourseThumbnails[seed.id] ?? null,
    category: categoryById(seed.categoryId),
    instructor: instructorById(seed.instructorId),
    status: CourseStatus.Published,
})

const buildSections = (seed: DemoCourseSeed): AdminCourseSectionDto[] => {
    let itemId = seed.id * 1000
    const lessonCount = seed.outline.reduce(
        (total, section) => total + section.lessons.length,
        0,
    )
    const perLesson = Math.max(4, Math.round(seed.duration / lessonCount))

    return seed.outline.map((section, sectionIndex) => {
        const sectionId = seed.id * 100 + sectionIndex + 1
        return {
            id: sectionId,
            courseId: seed.id,
            title: section.title,
            createdAt: seed.createdAt,
            updatedAt: null,
            items: section.lessons.map((title, lessonIndex) => {
                itemId += 1
                return {
                    id: itemId,
                    sectionId,
                    title,
                    type:
                        lessonIndex === section.lessons.length - 1 &&
                        sectionIndex === seed.outline.length - 1
                            ? ContentType.File
                            : ContentType.Video,
                    fileId: null,
                    duration: perLesson,
                    isPreview: sectionIndex === 0 && lessonIndex === 0,
                    status: ContentItemStatus.Published,
                    orderIndex: lessonIndex + 1,
                    createdAt: seed.createdAt,
                    updatedAt: null,
                }
            }),
        }
    })
}

export const demoCourses: AdminCourseSummaryResponse[] = seeds.map(toSummary)

export const demoCourseDetails: CourseDetailResponse[] = seeds.map((seed) => ({
    ...toSummary(seed),
    description: seed.description,
    targetJobs: seed.targetJobs.map((title, index) => ({
        id: seed.id * 10 + index,
        title,
    })),
    requirements: seed.requirements.map((description, index) => ({
        id: seed.id * 10 + index,
        description,
    })),
    sections: buildSections(seed),
    updatedAt: null,
    isDeleted: false,
    deletedAt: null,
}))

export const getDemoCourse = (id: number) =>
    demoCourseDetails.find((course) => course.id === id) ?? null

export const getDemoInstructor = (id: number): InstructorDetailResponse | null => {
    const instructor = demoInstructors.find((item) => item.id === id)
    if (!instructor) {
        return null
    }
    const courses = demoCourses
        .filter((course) => course.instructor?.id === id)
        .map((course) => ({
            id: course.id,
            name: course.name,
            thumbnailUrl: course.thumbnailUrl ?? null,
        }))

    return {
        ...instructor,
        courseCount: courses.length,
        isDeleted: false,
        deletedAt: null,
        courses,
    }
}

export const filterDemoCourses = (params?: {
    pageNumber?: number
    pageSize?: number
    searchTerm?: string
    categoryId?: number
    instructorId?: number
}) => {
    const {
        pageNumber = 1,
        pageSize = 12,
        searchTerm,
        categoryId,
        instructorId,
    } = params ?? {}

    let items = [...demoCourses]

    if (searchTerm) {
        const term = searchTerm.trim().toLowerCase()
        items = items.filter(
            (course) =>
                course.name.toLowerCase().includes(term) ||
                course.shortDescription.toLowerCase().includes(term) ||
                (course.instructor?.name || '').toLowerCase().includes(term),
        )
    }

    if (categoryId) {
        items = items.filter((course) => course.category?.id === categoryId)
    }

    if (instructorId) {
        items = items.filter((course) => course.instructor?.id === instructorId)
    }

    const totalCount = items.length
    const start = (pageNumber - 1) * pageSize

    return {
        items: items.slice(start, start + pageSize),
        totalCount,
        pageNumber,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    }
}

export const filterDemoInstructors = (params?: {
    pageNumber?: number
    pageSize?: number
    searchTerm?: string
}) => {
    const { pageNumber = 1, pageSize = 12, searchTerm } = params ?? {}

    let items = demoInstructors.map((instructor) => ({
        ...instructor,
        courseCount: demoCourses.filter(
            (course) => course.instructor?.id === instructor.id,
        ).length,
    }))

    if (searchTerm) {
        const term = searchTerm.trim().toLowerCase()
        items = items.filter(
            (instructor) =>
                instructor.name.toLowerCase().includes(term) ||
                instructor.bio.toLowerCase().includes(term),
        )
    }

    const totalCount = items.length
    const start = (pageNumber - 1) * pageSize

    return {
        items: items.slice(start, start + pageSize),
        totalCount,
        pageNumber,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    }
}
