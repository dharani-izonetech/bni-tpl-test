import sozoFounder from "@/assets/sponsors/sozo-founder.jpeg";
import sriVannaFounder from "@/assets/sponsors/srivanna-founder.jpeg";
import balaratnaFounder from "@/assets/sponsors/balaratna-founder.jpeg";
import orangeFounder from "@/assets/sponsors/orange-founder.jpeg";
import prasannaFounder from "@/assets/sponsors/prasanna-founder.png";
import mohanFounder from "@/assets/sponsors/mohan-founder.jpeg";
import retnaFounder from "@/assets/sponsors/retna-founder.png";
import anujFounder from "@/assets/sponsors/anuj-founder.jpeg";
import hariFounder from "@/assets/sponsors/hari-founder.jpeg";
import juravisFounder from "@/assets/sponsors/juravis-founder.jpeg";
import blueFounder from "@/assets/sponsors/blue-founder.png";
import arbudhaFounder from "@/assets/sponsors/arbudha-founder.png";
import pkFounder from "@/assets/sponsors/pk-founder.jpeg";
import dmcFounder from "@/assets/sponsors/dmc-founder.jpeg";
import lakhsFounder from "@/assets/sponsors/lakhs-founder.jpeg";

import sozoLogo from "@/assets/sponsors/sozo-logo.jpeg";
import sriVannaLogo from "@/assets/sponsors/srivanna-logo.jpeg";
import balaratnaLogo from "@/assets/sponsors/balaratna-logo.jpeg";
import orangeLogo from "@/assets/sponsors/orange-logo.png";
import prasannaLogo from "@/assets/sponsors/prasanna-logo.png";
import mohanLogo from "@/assets/sponsors/mohan-logo.png";
import retnaLogo from "@/assets/sponsors/retna-logo.jpeg";
import anujLogo from "@/assets/sponsors/anuj-logo.jpeg";
import hariLogo from "@/assets/sponsors/hari-logo.png";
import juravisLogo from "@/assets/sponsors/juravis-logo.png";
import blueLogo from "@/assets/sponsors/blue-logo.png";
import arbuthaLogo from "@/assets/sponsors/arbudha-logo.jpeg";
import pkLogo from "@/assets/sponsors/pk-logo.jpeg";
import dmcLogo from "@/assets/sponsors/dmc-logo.png";
import lakhsLogo from "@/assets/sponsors/lakhs-logo.jpeg";

export type SponsorCategory = "title" | "co" | "associate";

export type SponsorContact = {
  address?: string;
  phones?: string[];
  email?: string;
  website?: string;
  socials?: { label: string; url: string }[];
};

export type Sponsor = {
  name: string;
  tier: string;
  category: SponsorCategory;
  tagline?: string;
  description: string;
  highlight: string;
  logoUrl?: string;
  coverUrl?: string;
  benefits: string[];
  services?: string[];
  offers?: { label: string; value: string }[];
  whyChoose?: string[];
  visibility?: string[];
  focusAreas?: string[];
  owner: {
    name: string;
    role: string;
    photoUrl?: string;
    bio: string;
  };
  company: {
    industry: string;
    location: string;
    summary: string;
    foundedYear?: number;
    logoUrl?: string;
  };
  contact?: SponsorContact;
  relatedTopics: string[];
};

export const getSponsorSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const sponsors: Sponsor[] = [
  // -->TITLE SPONSOR <--

  //Sozo Solar Zolutions
  {
    name: "Sozo Solar Zolutions",
    tier: "Title Sponsor",
    category: "title",
    tagline: "Affordable Solar Power Today for a Sustainable Tomorrow.",
    description:
      "Sozo Solar Zolutions is a renewable energy company based in Tiruchirappalli, Tamil Nadu, delivering sustainable and cost-effective solar energy solutions for residential, commercial, agricultural, and industrial sectors. Inspired by the Greek word 'Sozo' — to save, heal, and empower — the company provides rooftop installations to large-scale projects with expert service, government support, and reliable clean energy.",
    highlight:
      "Official Renewable Energy Partner — clean power for the league.",
    logoUrl: sozoLogo,
    benefits: [
      "Government-approved solar solutions",
      "Loan & subsidy assistance",
      "End-to-end EPC services",
      "Installation, maintenance & consultation",
    ],
    services: [
      "Rooftop solar panel installation",
      "Residential solar systems",
      "Commercial solar power systems",
      "Industrial solar solutions",
      "Agricultural solar applications",
      "Annual Maintenance Contracts (AMC)",
    ],
    offers: [
      { label: "1 KW Solar System", value: "Starting ₹30,000" },
      { label: "2 KW Solar System", value: "Starting ₹60,000" },
      { label: "3 KW Solar System", value: "Starting ₹78,000" },
    ],
    whyChoose: [
      "Affordable, customized solar solutions",
      "Expert consultation & project planning",
      "Quality panels & equipment",
      "Government subsidy guidance",
      "Loan assistance support",
      "Dedicated after-sales service",
    ],
    visibility: [
      "Tournament digital banners",
      "Official sponsor listings",
      "Match-day branding",
      "Social media promotions",
      "Event marketing materials",
    ],
    focusAreas: [
      "Renewable Energy",
      "Solar Power Systems",
      "Sustainability",
      "Green Technology",
      "Energy Efficiency",
    ],
    owner: {
      name: "Naveen Kathavarayan",
      role: "Founder & Director",
      photoUrl: sozoFounder,
      bio: "Leads Sozo Solar's mission to make clean, affordable solar energy accessible across Tamil Nadu and India.",
    },
    company: {
      industry: "Renewable Energy / Solar EPC",
      location: "Tiruchirappalli, Tamil Nadu",
      summary:
        "Sustainable, cost-effective solar solutions for homes, businesses, farms, and industries.",
      logoUrl: sozoLogo,
    },
    contact: {
      address:
        "7/3, Srinivasapuram, Shastri Road, Thennur, Tiruchirappalli, Tamil Nadu",
      phones: ["+91 70557 07040"],
      email: "sozosolarzolutions@gmail.com",
      website: "https://sozosolar.in/",
      socials: [
        {
          label: "Instagram",
          url: "https://www.instagram.com/sozo_solar_zolutions/",
        },
        {
          label: "Facebook",
          url: "https://www.facebook.com/people/Sozo-solar-zolutions/61571767576641/",
        },
      ],
    },
    relatedTopics: ["Renewable Energy", "Solar EPC", "Sustainability"],
  },

  // -->CO SPONSOR <--

  //Balarathna Civil & Interiors
  {
    name: "Balarathna Civil & Interiors",
    tier: "CO Sponsor",
    category: "co",
    tagline: "Building Strong Foundations, Creating Beautiful Spaces.",
    description:
      "Balarathna Civil & Interiors is a construction and interior design service provider based in Tiruchirappalli, Tamil Nadu. The company delivers high-quality civil construction and interior execution services for residential and commercial projects with a focus on durability, functionality, and modern aesthetics.",
    highlight: "CO Civil & Interiors Partner.",
    logoUrl: balaratnaLogo,
    benefits: [
      "Strong regional construction expertise",
      "End-to-end civil & interior execution",
      "Reliable workmanship",
      "Quality-focused project delivery",
    ],
    services: [
      "Residential building construction",
      "Commercial construction projects",
      "Interior design & execution",
      "Renovation & remodeling",
      "Turnkey civil solutions",
      "Flooring, finishing & structural works",
    ],
    whyChoose: [
      "Trusted local construction brand",
      "Modern interior expertise",
      "Quality-focused execution",
      "Experienced project handling",
      "Reliable workmanship",
      "Customer-centric service",
    ],
    visibility: [
      "Match sponsorship branding",
      "Digital banner visibility",
      "Official sponsor listings",
      "Tournament website branding",
      "Promotional match content",
    ],
    focusAreas: [
      "Construction",
      "Interior Design",
      "Infrastructure Development",
      "Real Estate Services",
    ],
    owner: {
      name: "Vigneswaran B",
      role: "Founder",
      photoUrl: balaratnaFounder,
      bio: "Leading civil construction and interior solutions with a commitment to quality and customer satisfaction.",
    },
    company: {
      industry: "Civil Construction & Interior Design",
      location: "Tiruchirappalli, Tamil Nadu",
      summary:
        "Specialized in residential and commercial construction along with modern interior execution services.",
      logoUrl: balaratnaLogo,
    },
    contact: { website: "https://www.balarathnacivilandinteriors.com/" },
    relatedTopics: [
      "Construction",
      "Interiors",
      "Infrastructure",
      "Civil Engineering",
    ],
  },

  //Sri Vannamayil Chits Pvt. Ltd.
  {
    name: "Sri Vannamayil Chits Pvt. Ltd.",
    tier: "CO Sponsor",
    category: "co",
    tagline: "Saving Today, Securing Tomorrow.",
    description:
      "Sri Vannamayil Chits Pvt. Ltd. is a trusted chit fund and financial savings company headquartered in Tiruchirappalli, Tamil Nadu. Established in 2009, the company helps individuals, families, and businesses achieve financial goals through secure and structured chit fund schemes — blending traditional financial values with modern digital convenience.",
    highlight: "CO Financial Services & Savings Partner.",
    logoUrl: sriVannaLogo,
    benefits: [
      "15+ years of trusted service",
      "Transparent chit operations",
      "Mobile app for customers",
      "Flexible schemes for every need",
    ],
    services: [
      "Chit Fund Management",
      "Savings & Investment Solutions",
      "Financial Planning Assistance",
      "Business Funding Support",
      "Family Savings Programs",
      "Digital Account Management",
    ],
    offers: [
      { label: "12-Month Chit Plans", value: "Flexible value tiers" },
      { label: "20-Month Chit Plans", value: "Long-term savings" },
      { label: "Custom Schemes", value: "For families & business" },
    ],
    whyChoose: [
      "15+ years of trusted service",
      "Transparent, ethical practices",
      "Customer-focused solutions",
      "Secure & structured savings",
      "Easy digital access",
      "Reliable customer support",
    ],
    visibility: [
      "Tournament digital banners",
      "Official sponsor listing",
      "Match-day branding",
      "Social media promotions",
      "Financial awareness campaigns",
    ],
    focusAreas: [
      "Financial Services",
      "Chit Funds",
      "Savings & Investments",
      "Financial Literacy",
      "Community Development",
    ],
    owner: {
      name: "Pandiyan",
      role: "Managing Director",
      photoUrl: sriVannaFounder,
      bio: "Drives Sri Vannamayil's commitment to transparent chit operations and customer-first financial growth.",
    },
    company: {
      industry: "Financial Services / Chit Funds",
      location: "Tiruchirappalli, Tamil Nadu",
      summary:
        "Trusted chit fund company empowering disciplined savings since 2009.",
      foundedYear: 2009,
      logoUrl: sriVannaLogo,
    },
    contact: {
      address: "No. 1, Sivakumar Arcade, Vayalur Main Road, Renga Nagar, Rettai Vaikal, Tiruchirappalli, Tamil Nadu",
      phones: ["+91 88835 81221", "+91 97515 11221"],
      email: "info@srivannamayil.com",
      website: "https://srivannamayilchits.com/",
      socials: [
        {
          label: "Facebook",
          url: "https://www.facebook.com/SriVannamayilChits",
        },
        {
          label: "Instagram",
          url: "https://www.instagram.com/srivannamayilchits",
        },
        {
          label: "YouTube",
          url: "https://youtube.com/@srivannamayilchits-n9i",
        },
      ],
    },
    relatedTopics: ["Chit Funds", "Savings", "Financial Planning"],
  },

  //Sri Prasanna Properties Private Limited
  {
    name: "Sri Prasanna Properties Private Limited",
    tier: "CO Sponsor",
    category: "co",
    tagline: "Your Trusted Partner in Smart Property Investments",
    description:
      "Sri Prasanna Properties Private Limited is a trusted real estate partner with over 10 years of industry experience. Specializing in buying and selling residential and commercial properties, the company provides reliable real estate solutions for lands, buildings, plots, and flats. With an experienced team of professionals, Sri Prasanna Properties delivers personalized service, helping customers make secure and profitable property investments.",
    highlight: "Trusted Real Estate & Property Development Partner.",
    logoUrl: prasannaLogo,
    benefits: [
      "10+ Years of trusted real estate experience",
      "35+ Successful Projects completed",
      "700+ Happy Customers",
      "Trusted partner for buying and selling properties",
      "Personalized service for residential and commercial investments",
      "Transparent and customer-focused approach",
    ],
    services: [
      "Residential Land & Plot Sales",
      "Commercial Property Solutions",
      "Flats & Building Investments",
      "Property Buying & Selling Assistance",
      "Real Estate Consultation",
      "Investment Guidance",
    ],
    offers: [
      {
        label: "Sri Prasanna Perumal Avenue",
        value: "Zero Cost Registration, Free Patta & 5 Years Maintenance",
      },
      {
        label: "Sri Prasanna Venkateshwara Nagar",
        value: "Low Budget Investment, Free Patta & 8 Years Maintenance",
      },
    ],
    whyChoose: [
      "DTCP & RERA Approved Projects",
      "Secure and legal property investments",
      "Transparent and customer-friendly service",
      "Zero cost registration offers",
      "Professional investment guidance",
      "Long-term maintenance support",
    ],
    visibility: [
      "Tournament branding visibility",
      "Official sponsor listings",
      "Digital promotions",
      "Community engagement activities",
      "Match-day branding",
    ],
    focusAreas: [
      "Residential Plots & Lands",
      "Commercial Properties",
      "Real Estate Investments",
      "DTCP Approved Projects",
      "RERA Approved Projects",
      "Property Development & Sales",
    ],
    owner: {
      name: "Prasanna Thirugnanasambandham",
      role: "Managing Director",
      photoUrl: prasannaFounder,
      bio: "Dedicated real estate professionals committed to helping customers make secure and profitable property investments with complete transparency and legal reliability.",
    },
    company: {
      industry: "Real Estate & Property Development",
      location: "Tamil Nadu, India",
      summary:
        "Trusted real estate company providing residential and commercial property solutions with over a decade of experience.",
    },
    contact: {
      phones: ["+91 76676 87888"],
      email: "mailsriprasanna@gmail.com",
      socials: [
        {
          label: "Instagram",
          url: "https://www.instagram.com/insta.sriprasannaproperties/",
        },
      ],
    },
    relatedTopics: [
      "Real Estate",
      "Property Development",
      "Residential Plots",
      "Commercial Properties",
      "Property Investments",
    ],
  },

  //Orange Surgicals
  {
    name: "Orange Surgicals",
    tier: "CO Sponsor",
    category: "co",
    tagline: "Complete Medical Solutions – Quality Products, Trusted Service.",
    description:
      "Orange Surgicals is a trusted wholesale and retail medical supplier providing complete healthcare and surgical solutions. Founded by Mr. Rajeshwaran S, the company supplies quality medical products, hospital equipment, surgical instruments, and healthcare solutions to hospitals, clinics, laboratories, pharmacies, and healthcare institutions.",
    highlight:
      "Healthcare & Medical Solutions Provider (Wholesale & Retail Surgical Distributor).",
    logoUrl: orangeLogo,
    benefits: [
      "Trusted healthcare brands",
      "Affordable pricing",
      "Reliable service support",
      "Wide range of medical products",
    ],
    services: [
      "Hospital Equipment Supply",
      "Surgical Instruments Distribution",
      "Hospital Disposables & Consumables",
      "Dialysis Products Supply",
      "Ortho Care Products",
      "OT Sterilization & Fumigation Solutions",
      "Complete OT Setup Services",
      "Hospital Furniture Supply",
      "Home Care Medical Equipment",
    ],
    offers: [
      { label: "Hospital Equipment", value: "Complete Supply Solutions" },
      { label: "OT Setup", value: "End-to-End Operation Theatre Setup" },
      { label: "Medical Consumables", value: "Wholesale & Retail Supply" },
    ],
    whyChoose: [
      "Trusted healthcare distribution partner",
      "Quality products from reputed brands",
      "Expertise in medical supplies",
      "End-to-end hospital setup support",
      "Customer-centric service",
      "Reliable institutional support",
    ],
    visibility: [
      "Healthcare branding support",
      "Sponsor listings",
      "Medical community engagement",
      "Regional visibility",
      "Healthcare awareness activities",
    ],
    focusAreas: [
      "Healthcare Distribution",
      "Surgical Instruments",
      "Hospital Infrastructure",
      "Operation Theatre Solutions",
      "Medical Consumables",
      "Home Healthcare Equipment",
    ],
    owner: {
      name: "Rajeshwaran S",
      role: "Founder",
      photoUrl: orangeFounder,
      bio: "Committed to delivering reliable healthcare products and medical infrastructure solutions across Tamil Nadu.",
    },
    company: {
      industry: "Healthcare & Medical Distribution",
      location: "Tiruchirappalli, Tamil Nadu",
      summary:
        "Trusted wholesale and retail provider of healthcare products, hospital equipment, surgical instruments, and OT solutions.",
      logoUrl: orangeLogo,
    },
    contact: {
      address: "7th Cross, Thillai Nagar (East), Tiruchirappalli - 620018",
      phones: ["+91 97863 78739"],
      socials: [
        {
          label: "Instagram",
          url: "https://www.instagram.com/orangesurgicals_trichy",
        },
      ],
    },
    relatedTopics: [
      "Healthcare",
      "Medical Distribution",
      "Hospital Equipment",
      "Surgical Products",
    ],
  },

  // -->ASSOCIATE SPONSOR <--

  //SSG Loans
  {
    name: "SSG Loans",
    tier: "Associate Sponsor",
    category: "associate",
    tagline: "Empowering Financial Growth Through Smart Lending Solutions.",
    description:
      "SSG Loans is a trusted financial services company dedicated to helping individuals, professionals, entrepreneurs, and businesses access suitable loan solutions through a simplified and customer-focused approach. The company collaborates with leading banks and financial institutions to provide customized funding options, ensuring faster approvals, competitive interest rates, and hassle-free processing while guiding customers through every stage of the loan journey.",
    highlight: "Trusted Financial Services & Loan Consultancy Partner.",
    logoUrl: mohanLogo,
    benefits: [
      "Multiple Banking & NBFC Partnerships",
      "Quick Loan Approval Assistance",
      "Personalized Financial Consultation",
      "Minimal Documentation Process",
      "End-to-End Loan Support",
      "Transparent & Reliable Loan Solutions",
    ],
    services: [
      "Personal Loans",
      "Business Loans",
      "Home Loans",
      "Loan Against Property (LAP)",
      "Working Capital Finance",
      "Mortgage Loans",
      "Commercial Property Loans",
      "Education Loans",
      "Car Loans",
    ],
    offers: [
      {
        label: "Personal Loans",
        value: "Up to ₹2 Crore | From 9.9% Interest | Up to 7 Years",
      },
      {
        label: "Home Loans",
        value: "Up to ₹50 Crore | From 7.15% Interest | Up to 30 Years",
      },
      {
        label: "Loan Against Property",
        value: "Up to ₹100 Crore | From 8% Interest | Up to 15 Years",
      },
      {
        label: "Business Loans",
        value: "Up to ₹2 Crore | From 12% Interest | Up to 5 Years",
      },
      {
        label: "Education & Car Loans",
        value: "Up to ₹1 Crore & ₹5 Crore with Flexible Repayment",
      },
    ],
    whyChoose: [
      "Strong Network of Banking Partners",
      "Professional Consultation Services",
      "Quick Response & Approval Support",
      "Transparent Loan Processing",
      "Reliable Documentation Guidance",
      "Customer-Centric Financial Solutions",
    ],
    visibility: [
      "Tournament Digital Banners",
      "Official Sponsor Listings",
      "Event Branding Opportunities",
      "Social Media Promotions",
      "Marketing & Promotional Campaigns",
    ],
    focusAreas: [
      "Business Funding",
      "Home Finance",
      "Personal Finance",
      "Loan Consultancy",
      "Financial Inclusion",
      "Entrepreneurship Support",
    ],
    owner: {
      name: "Mohan Gurumurthy",
      role: "Financial Consultants",
      photoUrl: mohanFounder,
      bio: "Dedicated finance professionals helping individuals and businesses access funding opportunities through trusted banking partnerships and personalized financial guidance.",
    },
    company: {
      industry: "Financial Services / Loan Consultancy & Banking Solutions",
      location: "Tiruchirappalli, Tamil Nadu",
      summary:
        "Professional loan consultancy and financial services provider offering home loans, business loans, personal loans, LAP, education loans, and funding solutions through leading banking partners.",
    },
    contact: {
      address:
        "D-59, North East Extension, 6th Cross, Thillai Nagar, Tiruchirappalli - 620018, Tamil Nadu, India",
      phones: ["+91 98943 37117"],
      email: "mohaavishwa@gmail.com",
      website: "https://www.ssgloans.in/",
      socials: [
        {
          label: "Instagram",
          url: "https://www.instagram.com/srisaigroups_loanmadeeasy/",
        },
        {
          label: "Facebook",
          url: "https://www.facebook.com/srisaigroups",
        },
      ],
    },
    relatedTopics: [
      "Financial Services",
      "Loan Consultancy",
      "Business Loans",
      "Home Loans",
      "Personal Loans",
      "Mortgage Loans",
      "Financial Inclusion",
    ],
  },

  //Retna Global Hospital
  {
    name: "Retna Global Hospital",
    tier: "Associate Sponsor",
    category: "associate",
    tagline: "Your Health, Our Priority",
    description:
      "Retna Global Hospital is a multi-specialty healthcare hospital located in Tennur, Tiruchirappalli, Tamil Nadu. The hospital provides comprehensive healthcare services under one roof with a focus on ethical, compassionate, and advanced medical care. It offers emergency services, diagnostics, surgeries, maternity care, fertility treatments, and multiple specialty departments.",
    highlight: "Multi-Specialty Healthcare & Emergency Care Partner.",
    logoUrl: retnaLogo,
    benefits: [
      "24×7 Emergency & Trauma Care",
      "50+ Specialist Doctors",
      "Advanced Diagnostic & Surgical Facilities",
      "Fertility & IVF Treatment Centre",
      "Robotic Hip & Knee Replacement Services",
      "24×7 Ambulance Services",
    ],
    services: [
      "24 Hours ECG Testing Lab",
      "24 Hours Laboratory Services",
      "24 Hours CT Scan Centre",
      "Diagnostic Services",
      "Gastroenterology",
      "Laparoscopic Surgery",
      "Dialysis Services",
      "Physiotherapy & Rehabilitation",
      "Orthotics & Prosthetics",
      "Fracture Treatment",
      "Emergency Medical Services",
      "Gynecology & Maternity Care",
      "Neurology",
      "Urology",
      "Dermatology",
      "Dental Care",
      "Orthopaedic Trauma Care",
      "Ambulance Services",
    ],
    offers: [
      {
        label: "24×7 Emergency Care",
        value: "Round-the-clock medical support",
      },
      {
        label: "Ambulance Services",
        value: "24×7 Emergency Transportation",
      },
      {
        label: "Pharmacy",
        value: "Complete Healthcare Support",
      },
    ],
    whyChoose: [
      "24×7 Emergency & Trauma Care",
      "Multidisciplinary Specialist Team",
      "Modern Infrastructure & Diagnostics",
      "Compassionate and Ethical Healthcare",
      "Advanced Surgical Facilities",
      "Personalized Patient Care",
    ],
    visibility: [
      "Hospital Branding at Events",
      "Healthcare Awareness Campaigns",
      "Community Medical Camps",
      "Health Check-up Promotions",
      "Regional Healthcare Outreach Programs",
    ],
    focusAreas: [
      "Healthcare & Wellness",
      "Women's Health",
      "Fertility & IVF",
      "Emergency Care",
      "Orthopedics",
      "Cardiac Care",
      "Community Health Programs",
      "Preventive Healthcare",
    ],
    owner: {
      name: "Dr. Praveen Das",
      role: "Healthcare Leadership Team",
      photoUrl: retnaFounder,
      bio: "Dedicated healthcare professionals committed to delivering advanced, compassionate, and patient-centered medical services to the community.",
    },
    company: {
      industry: "Healthcare / Hospital / Medical Services",
      location: "Tennur, Tiruchirappalli, Tamil Nadu",
      summary:
        "Multi-specialty hospital offering comprehensive healthcare, emergency care, diagnostics, fertility treatments, surgeries, and rehabilitation services.",
    },
    contact: {
      address:
        "95/1, Pattabiraman Street, Tennur, Tiruchirappalli, Tamil Nadu – 620017, India",
      phones: [
        "+91 82486 13433",
        "+91 0431 2791450",
        "+91 0431 2791460",
        "+91 0431 2793928",
        "+91 84899 49904",
      ],
      email: "rghospital@gmail.com",
      website: "http://www.retnaglobalhospital.co.in/",
      socials: [
        {
          label: "Instagram",
          url: "https://www.instagram.com/retna_global_hospital_trichy/?hl=en",
        },
        {
          label: "Facebook",
          url: "https://www.facebook.com/rghtrichy/",
        },
      ],
    },
    relatedTopics: [
      "Healthcare",
      "Hospital",
      "Emergency Care",
      "Women's Health",
      "Fertility & IVF",
      "Orthopedics",
      "Cardiac Care",
      "Preventive Healthcare",
    ],
  },

  //ANUJ Tiles
  {
    name: "ANUJ Tiles",
    tier: "Associate Sponsor",
    category: "associate",
    tagline: "Transforming Spaces, Enhancing Luxury",
    description:
      "ANUJ Tiles, owned by Aravind Ceramics Pvt. Ltd., is one of South India's leading tile manufacturers. Established in 1996, the company specializes in premium tiles, sanitary ware, bath fittings, faucets, and home improvement products. With over 30 years of ceramic industry expertise, ANUJ Tiles serves residential, commercial, and infrastructure projects across South India through an extensive dealer and distributor network.",
    highlight:
      "South India's Leading Tile & Home Improvement Solutions Partner.",
      logoUrl: anujLogo,
    benefits: [
      "30+ Years of Ceramic Industry Excellence",
      "No. 1 Tile Brand in South India",
      "Best Prices on Premium Tiles",
      "1,500+ Dealers & Distributors Nationwide",
      "6,000+ Unique Tile Designs",
      "Production Capacity of 52,500 sqm/day",
      "1,000+ Professionals Delivering Excellence",
    ],
    services: [
      "Floor Tiles",
      "Kitchen Tiles",
      "Bathroom Tiles",
      "Faucets",
      "Sanitary Ware",
      "Bath Fittings",
      "Home Improvement Solutions",
    ],
    offers: [
      {
        label: "Premium Tile Collections",
        value: "6,000+ Unique Tile Designs",
      },
      {
        label: "Factory Outlet Products",
        value: "Best Value & Competitive Pricing",
      },
      {
        label: "Home Improvement Solutions",
        value: "Tiles, Sanitary Ware & Bath Fittings",
      },
    ],
    whyChoose: [
      "South India's Leading Tile Manufacturer",
      "Exclusive Manufacturer of Vitrified Tiles in Tamil Nadu",
      "30+ Years of Expertise and Trust",
      "Largest Tile Showrooms in Tamil Nadu",
      "Factory Outlet Products",
      "6,000+ Unique Designs",
      "1,500+ Dealers & Distributors Across South India",
      "1,000+ Professionals Delivering Excellence",
    ],
    visibility: [
      "Largest Tile Showrooms in Tamil Nadu",
      "1,500+ Dealers & Distributors Network",
      "Strong Presence Across South India",
      "Residential & Commercial Project Visibility",
      "Extensive Distribution Network",
    ],
    focusAreas: [
      "Tiles",
      "Sanitary Ware",
      "Bath Fittings",
      "Kitchen Accessories",
      "Home Improvement Solutions",
      "Building Materials",
    ],
    owner: {
      name: "Damodharan S",
      role: "Managing Director",
      photoUrl: anujFounder,
      bio: "Leading the vision of delivering premium-quality tiles, sanitary ware, and home improvement solutions across South India through innovation, quality, and customer satisfaction.",
    },
    company: {
      industry:
        "Building Materials Manufacturer / Tile Manufacturer / Home Improvement Solutions",
      location: "Tiruchirappalli, Tamil Nadu",
      summary:
        "One of South India's leading tile manufacturers offering premium tiles, sanitary ware, bath fittings, faucets, and home improvement products.",
      foundedYear: 1996,
    },
    contact: {
      address: "113/2, chennai ByPass Road, near The Hindu Office, Senthaneerpuram, Ariyamangalam Area, Tiruchirappalli, Tamilnadu - 620004",
      phones: ["+91 73737 14565"],
      email: "aravindjananiceramics@gmail.com",
      website: "https://www.aravindjananiceramics.com/",
      socials: [
        {
          label: "Instagram",
          url: "https://www.instagram.com/anujtiles/",
        },
        {
          label: "Facebook",
          url: "https://www.facebook.com/AravindCeramicPvtLtd",
        },
        {
          label: "X",
          url: "https://x.com/tiles_anuj",
        },
        {
          label: "YouTube",
          url: "http://youtube.com/@AnujTiles_AravindCeramics",
        },
      ],
    },
    relatedTopics: [
      "Tiles",
      "Sanitary Ware",
      "Bath Fittings",
      "Home Improvement",
      "Building Materials",
      "Ceramics",
      "Interior Design",
    ],
  },

  //Hari Haran Traders
  {
    name: "Hari Haran Traders",
    tier: "Associate Sponsor",
    category: "associate",
    tagline:
      "Provides you the best range of Ultratech Cement, TMT Bars & other products with effective & timely delivery.",
    description:
      "Hari Haran Traders is a construction material supplier and trader based in S Kannanur, Tamil Nadu. The company specializes in supplying cement, TMT bars, steel products, and other essential building materials for residential, commercial, and infrastructure projects. As a GST-verified and IndiaMART-registered supplier, Hari Haran Traders is committed to delivering quality construction materials with reliability, efficiency, and timely service.",
    highlight: "Trusted Construction Materials & Building Supply Partner.",
    logoUrl: hariLogo,
    benefits: [
      "GST Verified Business",
      "IndiaMART Registered Supplier",
      "Timely Delivery Commitment",
      "Quality Branded Construction Materials",
      "Trusted Supplier for Construction Projects",
      "Retail & Bulk Supply Support",
    ],
    services: [
      "Cement Supply",
      "TMT Bar Supply",
      "Steel Product Distribution",
      "Construction Material Supply",
      "Building Material Trading",
      "Retail & Bulk Orders",
      "Project Delivery Support",
    ],
    // offers: [
    //   {
    //     label: "Dalmia Infra Pro Cement",
    //     value: "53 Grade PPC Cement",
    //   },
    //   {
    //     label: "Dalmia Future Today Cement",
    //     value: "53 Grade OPC Cement",
    //   },
    //   {
    //     label: "UltraTech Cement",
    //     value: "43 Grade Ordinary Portland Cement",
    //   },
    //   {
    //     label: "JSW Neosteel TMT Bars",
    //     value: "Fe 550D 6mm Reinforcement Bars",
    //   },
    //   {
    //     label: "Pulkit TMT Bars",
    //     value: "8mm Construction Reinforcement Bars",
    //   },
    // ],
    offers: [
    {
      label: "Tata Tiscon",
      value: "Fe 550D TMT Bars",
    },
    {
      label: "JSW Neosteel",
      value: "High Strength TMT Bars",
    },
    {
      label: "ARS",
      value: "Construction Reinforcement Bars",
    },
    {
      label: "Pulkit",
      value: "Construction Reinforcement Bars",
    },
    {
      label: "Sumangala",
      value: "Premium TMT Bars",
    },
    {
      label: "Kaaveri",
      value: "TMT Reinforcement Bars",
    },
    {
      label: "Durga",
      value: "TMT Reinforcement Bars",
    },
    {
      label: "UltraTech Cement",
      value: "Ordinary Portland Cement",
    },
  ],
    whyChoose: [
      "Supplies trusted construction brands",
      "GST Registered Business",
      "Timely Delivery Service",
      "Wide Range of Construction Products",
      "Verified IndiaMART Seller Profile",
      "Suitable for Small & Large Projects",
      "Easy Ordering & Customer Support",
    ],
    visibility: [
      "IndiaMART Business Profile",
      "Construction Material Marketplace Presence",
      "Online Customer Enquiries",
      "Product Catalog Listings",
      "Regional Construction Industry Network",
    ],
    focusAreas: [
      "Cement Supply",
      "TMT Bars",
      "Steel Products",
      "Building Materials",
      "Construction Supplies",
      "Infrastructure Projects",
    ],
    owner: {
      name: "Hariharan",
      role: "Construction Material Specialists",
      photoUrl: hariFounder,
      bio: "Committed to supplying quality construction materials from trusted brands while ensuring timely delivery and dependable service for every project.",
    },
    company: {
      industry: "Construction Material Supplier & Trader",
      location: "S Kannanur, Tamil Nadu",
      summary:
        "Supplier of cement, TMT bars, steel products, and building materials for residential, commercial, and infrastructure projects.",
    },
    contact: {
      address: "S Kannanur, Tamil Nadu, India",
      phones: ["+91 79493 51314"],
      website: "https://www.indiamart.com/hariharantraders/",
      socials: [
        {
          label: "Instagram",
          url: "https://www.instagram.com/hariharantraders/",
        },
      ],
    },
    relatedTopics: [
      "Construction Materials",
      "Cement",
      "TMT Bars",
      "Steel Products",
      "Building Materials",
      "Infrastructure",
      "Construction Supply",
    ],
  },

  //Juravis Technologies
  {
    name: "Juravis Technologies",
    tier: "Associate Sponsor",
    category: "associate",
    tagline: "Smart Security. Reliable Protection.",
    description:
      "Juravis Technologies is a trusted provider of security, surveillance, and automation solutions that help organizations enhance safety, monitor operations, and improve access management. The company delivers integrated technology solutions for businesses, institutions, industries, healthcare facilities, and residential communities through advanced security and automation systems.",
    highlight: "Trusted Security, Surveillance & Automation Solutions Partner.",
    logoUrl: juravisLogo,
    benefits: [
      "Comprehensive security and surveillance expertise",
      "Customized solutions for multiple industries",
      "Professional installation and implementation",
      "Advanced monitoring and access management systems",
      "Reliable maintenance and technical support",
      "Technology-driven security innovation",
    ],
    services: [
      "Security Surveillance Solutions",
      "Attendance & Workforce Management Systems",
      "Access Control & Entry Management",
      "Vehicle Monitoring & Tracking Solutions",
      "Intrusion Detection Systems",
      "Communication & Intercom Solutions",
      "Security Infrastructure Deployment",
      "System Integration & Technical Support",
    ],
    offers: [
      {
        label: "Security Solutions",
        value: "CCTV, Alarm Systems & Surveillance Technologies",
      },
      {
        label: "Access Management",
        value: "Turnstiles, Smart Locks & Barrier Systems",
      },
      {
        label: "Automation Solutions",
        value: "Home Automation & Building Management Systems",
      },
      {
        label: "Enterprise Solutions",
        value: "Attendance, GPS Tracking & Networking Systems",
      },
    ],
    whyChoose: [
      "Industry-focused security expertise",
      "Tailored solutions for different business needs",
      "Quality products and professional implementation",
      "Strong technical support and maintenance services",
      "Commitment to customer satisfaction",
      "Technology-driven security management approach",
    ],
    visibility: [
      "Corporate Security Projects",
      "Industrial Infrastructure Solutions",
      "Educational Institution Partnerships",
      "Healthcare Security Implementations",
      "Commercial Facility Management Solutions",
      "Technology & Business Networking Platforms",
    ],
    focusAreas: [
      "Security Solutions",
      "Surveillance Technologies",
      "Access Management Systems",
      "Workforce Monitoring Solutions",
      "Automation Technologies",
      "Infrastructure & Network Security",
    ],
    owner: {
      name: "Justin A",
      role: "Security & Automation Specialists",
      photoUrl: juravisFounder,
      bio: "Dedicated professionals delivering innovative security, surveillance, automation, and access management solutions with a focus on reliability, safety, and customer satisfaction.",
    },
    company: {
      industry: "Security & Automation Solutions Provider",
      location: "Tiruchirappalli, Tamil Nadu",
      summary:
        "Provider of advanced security, surveillance, automation, workforce management, and access control solutions for businesses, institutions, and residential communities.",
    },
    contact: {
      address:
        "No.8, Second Floor, TVS Toll Gate Rd, TVS Tolgate, Sangillyandapuram, Tiruchirappalli, Tamil Nadu 620020",
      phones: ["+91 87540 08771", "+91 87540 08772"],
      email: "juravistech@gmail.com",
      website: "https://juravis.com",
      socials: [
        {
          label: "Website",
          url: "https://juravis.com",
        },
      ],
    },
    relatedTopics: [
      "Security Solutions",
      "CCTV Systems",
      "Access Control",
      "Automation",
      "GPS Tracking",
      "Surveillance",
      "Workforce Management",
      "Network Security",
    ],
  },

  //Blue Whale Doorstep Laundry Services
  {
    name: "Blue Whale Doorstep Laundry Services",
    tier: "Associate Sponsor",
    category: "associate",
    tagline: "Professional Laundry Care Delivered to Your Doorstep.",
    description:
      "Blue Whale Doorstep Laundry Services is a trusted professional laundry and garment care company providing high-quality washing, dry cleaning, ironing, and doorstep pickup & delivery services. The company helps individuals, families, businesses, hotels, and institutions maintain clean, fresh, and professionally cared-for garments while saving valuable time and effort through reliable and convenient laundry solutions.",
    highlight: "Trusted Laundry & Garment Care Solutions Partner.",
    logoUrl: blueLogo,
    benefits: [
      "Professional laundry and dry-cleaning solutions",
      "Convenient doorstep pickup and delivery",
      "Specialized care for delicate and premium fabrics",
      "Timely service with quality assurance",
      "Hygienic and fabric-friendly cleaning processes",
      "Reliable support for residential and commercial clients",
    ],
    services: [
      "Laundry Services",
      "Dry Cleaning Services",
      "Steam Ironing Services",
      "Stain Removal Treatment",
      "Saree & Ethnic Wear Care",
      "Suit, Blazer & Uniform Cleaning",
      "Hotel & Corporate Laundry Solutions",
      "Doorstep Pickup & Delivery",
    ],
    offers: [
      {
        label: "Wash & Fold Packages",
        value: "Convenient Everyday Laundry Solutions",
      },
      {
        label: "Wash & Iron Services",
        value: "Freshly Cleaned & Professionally Pressed Garments",
      },
      {
        label: "Premium Garment Care",
        value: "Specialized Fabric & Delicate Wear Treatment",
      },
      {
        label: "Express Laundry Solutions",
        value: "Fast Turnaround for Urgent Needs",
      },
      {
        label: "Commercial Laundry Contracts",
        value: "Customized Solutions for Businesses",
      },
    ],
    whyChoose: [
      "Consistent quality and customer satisfaction",
      "Professional garment handling expertise",
      "Convenient pickup and delivery support",
      "Quick turnaround time",
      "Trusted by residential and business clients",
      "Focus on hygiene, fabric care, and reliability",
    ],
    visibility: [
      "Local Business Networking Events",
      "Business Referral Communities",
      "Corporate Collaborations",
      "Community Engagement Programs",
      "Brand Awareness Campaigns",
    ],
    focusAreas: [
      "Laundry & Dry Cleaning",
      "Garment Care Solutions",
      "Corporate Laundry Services",
      "Hospitality Laundry Support",
      "Fabric Maintenance Services",
      "Customer Convenience Solutions",
    ],
    owner: {
      name: "Bala MK",
      role: "Laundry & Garment Care Specialists",
      photoUrl: blueFounder,
      bio: "Dedicated professionals providing reliable laundry, dry cleaning, and garment care services with a strong focus on quality, hygiene, convenience, and customer satisfaction.",
    },
    company: {
      industry: "Laundry & Garment Care Solutions Provider",
      location: "Tamil Nadu, India",
      summary:
        "Professional laundry and dry-cleaning service provider offering doorstep pickup, garment care, ironing, stain removal, and commercial laundry solutions.",
    },
    contact: {
      phones: ["+91 89841 69777", "+91 94436 83000"],
      email: "service@bwlaundry.in",
      socials: [
        {
          label: "Instagram",
          url: "https://www.instagram.com/doorsteplaundry25",
        },
      ],
    },
    relatedTopics: [
      "Laundry Services",
      "Dry Cleaning",
      "Garment Care",
      "Doorstep Delivery",
      "Corporate Laundry",
      "Hospitality Services",
      "Fabric Care",
    ],
  },

  //Sri Arbutha Sweets and Snacks
  {
    name: "Sri Arbutha Sweets and Snacks",
    tier: "Associate Sponsor",
    category: "associate",
    tagline: "Taste of Tradition, Quality in Every Bite",
    description:
      "Sri Arbutha Sweets and Snacks is a trusted destination for premium sweets, snacks, savouries, and delicious food varieties in Trichy. Known for quality, taste, hygiene, and customer satisfaction, the brand offers a wide range of traditional and modern sweets, snacks, bakery items, and food products. Located in the heart of Thillai Nagar, the store is a preferred choice for families, celebrations, festivals, gifting, and everyday snack cravings.",
    highlight: "Trusted Traditional Sweets, Snacks & Food Partner.",
    logoUrl: arbuthaLogo,
    benefits: [
      "Trusted sweets & snacks destination in Trichy",
      "Wide range of traditional and premium sweets",
      "Freshly prepared savouries and snacks",
      "Hygienic preparation with quality ingredients",
      "Perfect for festivals, celebrations, and gifting",
      "Customer-focused service and quality commitment",
    ],
    services: [
      "Traditional Indian Sweets",
      "Premium Sweets & Dry Fruit Sweets",
      "Savouries & Snacks",
      "Festival Special Sweets",
      "Fresh Bakery & Dessert Items",
      "Customized Sweet & Snack Orders",
      "Takeaway Services",
      "Family & Celebration Orders",
    ],
    offers: [
      {
        label: "Traditional Sweets",
        value: "Authentic Indian Sweet Collections",
      },
      {
        label: "Premium Savouries",
        value: "Fresh Murukku, Mixture & Snack Varieties",
      },
      {
        label: "Festival Specials",
        value: "Bulk Orders & Celebration Packages",
      },
      {
        label: "Bakery & Desserts",
        value: "Freshly Prepared Premium Treats",
      },
    ],
    whyChoose: [
      "Authentic taste and traditional recipes",
      "Premium quality ingredients",
      "Freshly prepared products daily",
      "Wide variety of sweets and snacks",
      "Reliable customer service",
      "Perfect for gifting and celebrations",
    ],
    visibility: [
      "Strong Local Brand Presence in Trichy",
      "Festival & Celebration Orders",
      "Family & Community Events",
      "Takeaway Food Services",
      "Corporate & Bulk Order Support",
    ],
    focusAreas: [
      "Traditional Indian Sweets",
      "Premium Savouries & Snacks",
      "Festival Sweet Collections",
      "Bakery & Dessert Products",
      "Food & Takeaway Services",
      "Family & Bulk Orders",
    ],
    owner: {
      name: "Chellaram Manoharan",
      role: "Food & Hospitality Specialists",
      photoUrl: arbudhaFounder,
      bio: "Dedicated to delivering authentic sweets, savouries, and snack varieties prepared with quality ingredients, traditional recipes, and a commitment to customer satisfaction.",
    },
    company: {
      industry: "Sweets, Snacks & Food Retail Brand",
      location: "Thillai Nagar, Tiruchirappalli, Tamil Nadu",
      summary:
        "Premium sweets, savouries, snacks, bakery items, and takeaway food products serving families, celebrations, and festival occasions.",
      // Add logo import if available
    },
    contact: {
      address:
        "Thillai Nagar, 5, Astalakshmi Colony, Vayalur Main Road, Tiruchirappalli, Tamil Nadu",
      website: "https://instagram.com/shreearbutha/",
      socials: [
        {
          label: "Instagram",
          url: "https://instagram.com/shreearbutha/",
        },
      ],
    },
    relatedTopics: [
      "Traditional Sweets",
      "Indian Snacks",
      "Savouries",
      "Bakery Products",
      "Festival Collections",
      "Food Retail",
      "Takeaway Services",
    ],
  },

  //P.K Engineering
  {
    name: "P.K Engineering",
    tier: "Associate Sponsor",
    category: "associate",
    tagline: "Excellent Solutions for Noise & Vibration Control",
    description:
      "P.K Engineering is a leading industrial engineering company specializing in noise and vibration control solutions for industries across India. The company delivers high-quality engineering solutions including industrial silencers, acoustic enclosures, expansion joints, and soundproof systems that help reduce industrial noise pollution, improve operational efficiency, and ensure long-term performance. Backed by engineering expertise, innovation, and quality assurance, P.K Engineering serves major industrial sectors with customized and reliable solutions.",
    highlight:
      "Trusted Industrial Noise & Vibration Control Solutions Partner.",
    logoUrl: pkLogo,
    benefits: [
      "ISO 9001:2015 Certified Company",
      "Specialized Industrial Noise Control Expertise",
      "Customized Engineering Solutions",
      "High-Quality & Durable Products",
      "Reliable Technical Support",
      "Timely Project Delivery",
      "Cost-Effective Engineering Solutions",
    ],
    services: [
      "Industrial Noise Control Solutions",
      "Vibration Control Systems",
      "Industrial Silencer Manufacturing",
      "Acoustic Enclosures",
      "Expansion Bellows & Expansion Joints",
      "Soundproof Engineering Solutions",
      "Industrial Fabrication Services",
      "Noise Pollution Reduction Systems",
    ],
    offers: [
      {
        label: "Industrial Silencers",
        value: "Vent, Exhaust, Compressor & Gas Turbine Silencers",
      },
      {
        label: "Acoustic Solutions",
        value: "Acoustic Enclosures & Soundproof Doors",
      },
      {
        label: "Expansion Systems",
        value: "Expansion Bellows & Expansion Joints",
      },
      {
        label: "Industrial Engineering",
        value: "Noise Reduction & Safety Solutions",
      },
    ],
    whyChoose: [
      "Engineering Excellence & Industry Expertise",
      "Advanced Noise & Vibration Control Technology",
      "Customized Industrial Solutions",
      "Durable & Reliable Engineering Products",
      "Quality-Driven Manufacturing Standards",
      "Strong Focus on Customer Satisfaction",
      "Proven Experience Across Industrial Sectors",
    ],
    visibility: [
      "Power Plant Engineering Projects",
      "Steel Industry Solutions",
      "Petrochemical Industry Partnerships",
      "Oil & Gas Sector Projects",
      "Industrial Manufacturing Networks",
      "Engineering & Infrastructure Platforms",
    ],
    focusAreas: [
      "Industrial Noise Control",
      "Vibration Control Solutions",
      "Industrial Silencers",
      "Acoustic Engineering",
      "Industrial Safety",
      "Soundproofing Solutions",
      "Engineering Fabrication",
    ],
    owner: {
      name: "Dhanraj Perumal",
      role: "Industrial Engineering Specialists",
      photoUrl: pkFounder,
      bio: "Dedicated engineering professionals delivering innovative, reliable, and customized noise and vibration control solutions for industrial sectors across India.",
    },
    company: {
      industry: "Industrial Engineering & Noise Control Solution Provider",
      location: "Tiruchirappalli, Tamil Nadu",
      summary:
        "Specialized provider of industrial silencers, acoustic solutions, vibration control systems, soundproofing products, and engineering fabrication services for major industries.",
    },
    contact: {
      address:
        "P.No.90, Ashok Nagar, Karumandapam, Tiruchirappalli – 620001, Tamil Nadu, India",
      phones: ["0431-4024044"],
      email: "sales@pkengg.net",
      website: "https://pkengg.net/",
      socials: [
        {
          label: "Facebook",
          url: "https://www.facebook.com/p/PK-Engineering-100080336661029/",
        },
        {
          label: "WhatsApp",
          url: "https://web.whatsapp.com/send?phone=+918220564888&text=Enquiry%20For%20Pulse%20Kinetics%20Engineering%20Company",
        },
      ],
    },
    relatedTopics: [
      "Industrial Engineering",
      "Noise Control",
      "Vibration Control",
      "Industrial Silencers",
      "Acoustic Engineering",
      "Soundproofing",
      "Industrial Safety",
      "Engineering Fabrication",
    ],
  },

  // //DMC dental clinic
  // {
  //   name: "DMC Dental Clinic",
  //   tier: "Associate Sponsor",
  //   category: "associate",
  //   tagline: "Shaping Skilled Dental Professionals for Tomorrow.",
  //   description:
  //     "DMC dental clinic is a premier dental education and advanced clinical training institute in Trichy, dedicated to enhancing practical dental knowledge and professional excellence. The academy focuses on advanced dental education, hands-on training, and skill development for dental professionals and students, helping them stay updated with modern dental technologies and treatment methodologies.",
  //   highlight: "Accredited to ICOI",
  //   logoUrl: dmcLogo,
  //   benefits: [
  //     "Practical hands-on dental learning",
  //     "Exposure to modern dental technologies",
  //     "Professional skill enhancement opportunities",
  //     "Expert mentoring and clinical guidance",
  //     "Career-focused training programs",
  //     "Improved confidence in advanced dental procedures",
  //   ],
  //   services: [
  //     "Clinical Dental Training",
  //     "Advanced Dental Skill Development",
  //     "Hands-on Practical Sessionss",
  //     "Cosmetic Dentistry Learning",
  //     "Dental Implant Training",
  //     "Root Canal & Endodontic Training",
  //     "Orthodontic and Smile Designing Concepts",
  //     "Professional Dental Workshops & Programs",
  //   ],
  //   offers: [
  //     {
  //       label: "",
  //       value: "Practical Workshops for Dental Professionals",
  //     },
  //   ],
  //   whyChoose: [
  //     "Quality Dental Education",
  //     "Practical Clinical Exposure",
  //     "Advanced Professional Training",
  //     "Hands-on Experience",
  //     "Commitment to Excellence",
  //   ],
  //   visibility: [
  //     "Advanced dental learning programs in Trichy",
  //     "Official Sponsor Listings",
  //     "Event Branding Opportunities",
  //     "Social Media Promotions",
  //     "Marketing & Promotional Campaigns",
  //   ],
  //   focusAreas: [
  //     "Dental Education",
  //     "Clinical Skill Development",
  //     "Advanced Dental Training",
  //     "Cosmetic Dentistry Learning",
  //     "Implant & Endodontic Training",
  //     "Professional Dental Workshops",
  //   ],
  //   owner: {
  //     name: "Kiruthiga Manohar",
  //     role: "Founder & Director",
  //     photoUrl: dmcFounder,
  //     bio: "At DMC, we believe dentistry is not just a profession but a responsibility that demands precision, empathy, and integrity",
  //   },
  //   company: {
  //     industry: "Excellence in Dental Education",
  //     location: "Tiruchirappalli, Tamil Nadu",
  //     summary:
  //       "Empowering dental professionals through clinical mastery and hands-on mentorship. We bridge the gap between academic knowledge and world-class practice since 2010",
  //   },
  //   contact: {
  //     address:
  //       "1st floor, Asha Arcade, Promenade Road, Cantonment, Tiruchirappalli, TamilNadu - 620001",
  //     phones: ["+91 99955 08438"],
  //     email: "",
  //     website: "",
  //     socials: [
  //       {
  //         label: "Instagram",
  //         url: "https://www.instagram.com/dmcdentaltrichy",
  //       },
  //       {
  //         label: "Facebook",
  //         url: "https://www.facebook.com/dmcdentaltrichy/",
  //       },
  //     ],
  //   },
  //   relatedTopics: [
  //     "Dental Skill Development",
  //     "Dental Workshops",
  //     "Hands-on Clinical Practice",
  //     "Professional Dental Training",
  //     "Exam Courses",
  //   ],
  // },
  


// DMC Dental Clinic
{
  name: "DMC Dental Clinic",
  tier: "Associate Sponsor",
  category: "associate",
  tagline: "World Class Super Speciality Dental Network",
  description:
    "DMC Dental Clinic is a leading super speciality dental network in Trichy, committed to delivering world-class dental care with advanced technology and personalized treatment. The clinic specializes in aesthetic dentistry, laser dentistry, Invisalign treatment, and board-certified implant dentistry, ensuring exceptional oral healthcare for patients of all ages.",
  highlight: "Certified Invisalign Provider",
  logoUrl: dmcLogo,

  benefits: [
    "Advanced and painless dental treatments",
    "World-class super speciality dental care",
    "Certified Invisalign treatment options",
    "Modern laser dentistry procedures",
    "Board-certified implant dentistry",
    "Personalized treatment with expert care",
  ],

  services: [
    "Aesthetic Dentistry",
    "Laser Dentistry",
    "Certified Invisalign Treatment",
    "Board Certified Implant Dentistry",
    "Smile Designing",
    "Cosmetic Dental Procedures",
    "Advanced Oral Care",
    "Preventive & Restorative Dentistry",
  ],

  offers: [
    {
      label: "",
      value: "World-Class Super Speciality Dental Care",
    },
  ],

  whyChoose: [
    "Certified Invisalign Provider",
    "Advanced Laser Dentistry",
    "Board-Certified Implant Expertise",
    "Modern Dental Technology",
    "Personalized Patient Care",
  ],

  visibility: [
    "Trusted Dental Care in Trichy",
    "Official Sponsor Listings",
    "Event Branding Opportunities",
    "Social Media Promotions",
    "Marketing & Promotional Campaigns",
  ],

  focusAreas: [
    "Aesthetic Dentistry",
    "Laser Dentistry",
    "Dental Implants",
    "Invisalign Treatment",
    "Smile Designing",
    "Advanced Oral Healthcare",
  ],

  owner: {
    name: "Kiruthiga Manohar",
    role: "Founder & Director",
    photoUrl: dmcFounder,
    bio: "At DMC, we believe dentistry is not just a profession but a responsibility that demands precision, empathy, and integrity.",
  },

  company: {
    industry: "Super Speciality Dental Care",
    location: "Tiruchirappalli, Tamil Nadu",
    summary:
      "Providing advanced dental treatments through aesthetic dentistry, laser dentistry, Invisalign, and board-certified implant care with a patient-first approach.",
  },

  contact: {
    address:
      "1st floor, Asha Arcade, Promenade Road, Cantonment, Tiruchirappalli, TamilNadu - 620001",
    phones: ["+91 99955 08438"],
    email: "",
    website: "",
    socials: [
      {
        label: "Instagram",
        url: "https://www.instagram.com/dmcdentaltrichy",
      },
      {
        label: "Facebook",
        url: "https://www.facebook.com/dmcdentaltrichy/",
      },
    ],
  },

  relatedTopics: [
    "Aesthetic Dentistry",
    "Laser Dentistry",
    "Dental Implants",
    "Invisalign Treatment",
    "Smile Designing",
    "Cosmetic Dentistry",
    "Advanced Oral Care",
  ],
},

  //Lakhs Elevators
  {
    name: "Lakhs Elevators",
    tier: "Associate Sponsor",
    category: "associate",
    tagline: "Safe, Reliable & Efficient Vertical Transportation Solutions.",
    description:
      "Lakhs Elevators is an elevator installation, maintenance, and service provider located in Thondaman Nagar, Tiruchirappalli. The company focuses on supplying vertical transportation solutions for residential, commercial, industrial, and institutional buildings.",
    highlight: "Safety Feature Enhancements",
    logoUrl: lakhsLogo,
    benefits: [
      "Reliable vertical transportation solutions",
      "Improved safety and compliance",
      "Reduced downtime through maintenance support",
      "Customized lift configurations",
      "Energy-efficient operations",
      "Professional installation and servicing",
      "Long-term operational reliability",
    ],
    services: [
      "Installation Services",
      "Preventive Maintenance",
      "Lift Inspection Services",
      "Emergency Breakdown Support",
      "Annual Maintenance Contracts",
    ],
    offers: [
      {
        label: "",
        value: "Competitive pricing",
      },
    ],
    whyChoose: [
      "Experienced elevator installation team",
      "Customized project execution",
      "Maintenance and after-sales support",
      "Safety-oriented approach",
      "Suitable solutions for residential and commercial projects",
    ],
    visibility: [
      "Company Logo Placement",
      "Website Recognition",
      "Event Banners and Posters",
      "Social Media Mentions",
      "Digital Marketing Campaigns",
    ],
    focusAreas: [
      "Elevator Installation",
      "Elevator Maintenance",
      "Lift Modernization",
      "Residential Lift Solutions",
      "Commercial Lift Solutions",
      "Industrial Vertical Transportation",
    ],
    owner: {
      name: "Kanagaraj",
      role: "Founder",
      photoUrl: lakhsFounder,
      bio: "Lakhs Elevators is a Tiruchirappalli-based elevator company providing installation, maintenance, repair, and modernization services for residential, commercial, and industrial buildings. The company focuses on delivering safe, reliable, and efficient vertical transportation solutions supported by professional service, technical expertise, and customer satisfaction.",
    },
    company: {
      industry: "Engineering Services & Building Infrastructure Solutions",
      location: "Tiruchirappalli, Tamil Nadu",
      summary:
        "Lakhs Elevators is a trusted elevator service provider serving customers in and around Tiruchirappalli. The company offers a comprehensive range of lift solutions, including passenger elevators, goods lifts, home lifts, maintenance services, and modernization projects. By combining technical expertise with customer-focused service, Lakhs Elevators helps improve accessibility, convenience, and building efficiency. The company caters to residential apartments, commercial complexes, offices, hospitals, educational institutions, and industrial facilities, delivering dependable elevator solutions that prioritize safety, performance, and long-term value.",
    },
    contact: {
      address:
        "Wireless Road, Thondaman Nagar, Tiruchirappalli, Tamil Nadu, India",
      phones: ["+91 79471 06108"],
      email: "",
      website: "",
      socials: [
        {
          label: "Instagram",
          url: "https://www.instagram.com/lakhs_elevators/",
        },
      ],
    },
    relatedTopics: [
      "Lift modernization and upgrades",
    ],
  },
];
