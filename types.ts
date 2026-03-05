export interface ContactInfo {
  phone: string;
  email: string;
  website: string;
  location?: string;
  politicalStatus?: string;
}

export type ResumeSectionKey = 'education' | 'projects' | 'work' | 'skills';

export interface Education {
  school: string;
  tags?: string[];
  duration: string;
  degree: string;
  major: string;
  content: string; // Rich text (HTML)
}

export interface Experience {
  company: string;
  role?: string; // e.g. "智能研发实习生"
  title?: string; // Combined title line if structure varies
  duration: string;
  description?: string; // Brief intro
  techStack?: string;
  content: string; // Rich text (HTML)
}

export interface SkillSection {
  title: string;
  items: string[];
}

export interface ResumeData {
  name: string;
  title: string;
  avatarUrl?: string;
  contact: ContactInfo;
  education: Education[];
  projects: Experience[];
  workExperience: Experience[];
  skills: SkillSection;
}

export interface ResumeConfig {
  baseFontSize: number;
  lineHeight: number;
  pagePaddingX: number;
  pagePaddingY: number;
  itemSpacing: number; // mm, spacing between resume items
  sectionSpacing: number; // mm, spacing between sections
  fontFamily: string;
  linkUnderline: boolean;
  avatar: {
    top: number; // mm from top of page
    right: number; // mm from right of page
    width: number; // mm
    height: number; // mm
  };
}
