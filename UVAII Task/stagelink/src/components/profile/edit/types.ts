import {
  Ruler, GraduationCap, Star, Shield, Image as ImageIcon,
  Trophy, Eye, Sliders, Calendar, Wrench, User, Layers, MapPin
} from "lucide-react";

export const SECTIONS = [
  { id: "identity", label: "Identity", icon: User },
  { id: "disciplines", label: "Disciplines & Skills", icon: Layers },
  { id: "location", label: "Location & Travel", icon: MapPin },
  { id: "physical", label: "Physical Attributes", icon: Ruler },
  { id: "training", label: "Training", icon: GraduationCap },
  { id: "credits", label: "Credits", icon: Star },
  { id: "unions", label: "Unions & Representation", icon: Shield },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "awards", label: "Awards & Press", icon: Trophy },
  { id: "availability", label: "Availability", icon: Calendar },
  { id: "equipment", label: "Equipment & Tech", icon: Wrench },
  { id: "visibility", label: "Visibility", icon: Eye },
  { id: "discipline_details", label: "Discipline Details", icon: Sliders },
] as const;

export type SectionId = typeof SECTIONS[number]["id"];

export interface SkillEntry { id?: number; category: string; name: string; proficiency: string; }
export interface TrainingEntry { school: string; program: string; start_year?: string; end_year?: string; degree?: string; type?: string; instructor?: string; ongoing?: boolean; certificate_url?: string; certificate_name?: string; }
export interface AwardEntry { name: string; project?: string; year?: string; festival?: string; award_type?: string; url?: string; }
export interface PressMention { publication: string; headline: string; date?: string; url?: string; }
export interface CreditEntry { id?: number; title: string; role: string; production_type?: string; year?: number; billing?: string; director?: string; collaborators?: string[]; }
export interface UnionEntry { id?: number; union: string; status?: string; joined_year?: number; }
export interface ReelEntry { id?: number; title: string; type: string; video_url: string; thumbnail_url?: string; description?: string; visibility: string; }
