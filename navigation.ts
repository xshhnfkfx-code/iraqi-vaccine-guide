import {
  Activity, Baby, BarChart3, BookOpen, Building2, ClipboardList,
  Database, FileText, LayoutDashboard, Map, Settings, Snowflake,
  Syringe, Users, type LucideIcon
} from "lucide-react";
import type { SectionId } from "../types";

export interface NavigationItem {
  id: SectionId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export const navigation: NavigationItem[] = [
  { id: "dashboard", title: "لوحة التحكم", subtitle: "المؤشرات العامة", icon: LayoutDashboard },
  { id: "vaccines", title: "قاعدة اللقاحات", subtitle: "بطاقات ومعلومات اللقاحات", icon: Syringe },
  { id: "administration", title: "دليل إعطاء اللقاحات", subtitle: "طرق ومواضع الإعطاء", icon: BookOpen },
  { id: "cold-chain", title: "سلسلة التبريد", subtitle: "الثلاجات ودرجات الحرارة", icon: Snowflake },
  { id: "vitamins", title: "فيتامين A وK", subtitle: "المعلومات والإرشادات", icon: Activity },
  { id: "microplan", title: "الخطة المصغرة", subtitle: "Microplan", icon: Map },
  { id: "monitor", title: "مراقبة التغطية", subtitle: "Monitor Chart", icon: BarChart3 },
  { id: "defaulters", title: "متابعة المتسربين", subtitle: "Defaulters Tracking", icon: Baby },
  { id: "defaulters-chart", title: "مخطط المتسربين", subtitle: "مؤشرات المتابعة", icon: ClipboardList },
  { id: "centers", title: "المراكز والمستخدمون", subtitle: "إدارة الصلاحيات", icon: Building2 },
  { id: "reports", title: "التقارير", subtitle: "تصدير وطباعة", icon: FileText },
  { id: "settings", title: "الإعدادات", subtitle: "إعدادات النظام", icon: Settings }
];
