/** ISO-formatted values serialized by FastAPI/Pydantic. */
export type ApiDate = string;
export type ApiDateTime = string;
export type ApiUrl = string;

export type Profile = {
  name: string;
  headline: string | null;
  short_bio: string | null;
  full_bio: string | null;
  profile_image: ApiUrl | null;
  location: string | null;
  email: string | null;
  resume_url: ApiUrl | null;
  created_at: ApiDateTime;
  updated_at: ApiDateTime;
};

export type Project = {
  id: number;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  cover_image: ApiUrl | null;
  github_url: ApiUrl | null;
  live_url: ApiUrl | null;
  featured: boolean;
  display_order: number;
  created_at: ApiDateTime;
  updated_at: ApiDateTime;
};

export type Experience = {
  id: number;
  company: string;
  role: string;
  company_logo: ApiUrl | null;
  location: string | null;
  start_date: ApiDate | null;
  end_date: ApiDate | null;
  currently_working: boolean;
  short_description: string | null;
  description: string | null;
  featured: boolean;
  display_order: number;
  created_at: ApiDateTime;
  updated_at: ApiDateTime;
};

export type Certificate = {
  id: number;
  title: string;
  issuer: string | null;
  issue_date: ApiDate | null;
  credential_url: ApiUrl | null;
  certificate_image: ApiUrl | null;
  certificate_file: ApiUrl | null;
  description: string | null;
  featured: boolean;
  display_order: number;
  created_at: ApiDateTime;
  updated_at: ApiDateTime;
};

export type SkillCategory = {
  id: number;
  name: string;
  display_order: number;
};

export type Skill = {
  id: number;
  name: string;
  category_id: number;
  icon: ApiUrl | null;
  display_order: number;
  created_at: ApiDateTime;
  updated_at: ApiDateTime;
};

export type Achievement = {
  id: number;
  title: string;
  short_description: string | null;
  description: string | null;
  image: ApiUrl | null;
  link: ApiUrl | null;
  date: ApiDate | null;
  featured: boolean;
  display_order: number;
  created_at: ApiDateTime;
  updated_at: ApiDateTime;
};

export type SocialLink = {
  id: number;
  platform: string;
  url: ApiUrl;
  icon: ApiUrl | null;
  display_order: number;
  created_at: ApiDateTime;
  updated_at: ApiDateTime;
};

export type Media = {
  id: number;
  file_url: ApiUrl;
  public_id: string | null;
  file_type: string;
  alt_text: string | null;
  created_at: ApiDateTime;
  updated_at: ApiDateTime;
};
