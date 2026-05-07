export const EXPERT_PIN = "femtech2024";

export const TOPICS = [
  { id: "hepatitis",       label: "Hepatitis",              icon: "HeartPulse", color: "#0F766E", description: "Liver health & hepatitis risk assessment" },
  { id: "pregnancy-problems", label: "Pregnancy Problems",  icon: "AlertCircle", color: "#065F46", description: "Complications & concerns during pregnancy" },
  { id: "arsenic",         label: "Arsenic Exposure",       icon: "Droplets",   color: "#0E7490", description: "Water & food arsenic contamination risk" },
  { id: "menstrual",       label: "Menstrual Health",       icon: "Activity",   color: "#059669", description: "Cycle irregularities & menstrual concerns" },
  { id: "viral",           label: "Viral Infections",       icon: "ShieldAlert",color: "#334155", description: "Common viral illness risk screening" },
  { id: "nutrition",       label: "Nutrition & Diet",       icon: "Apple",      color: "#0F766E", description: "Dietary habits & nutritional deficiencies" },
  { id: "pregnancy-care",  label: "Pregnancy Care",         icon: "Heart",      color: "#065F46", description: "Prenatal care & safe pregnancy guidance" },
  { id: "birth-control",   label: "Birth Control",          icon: "Pill",       color: "#0E7490", description: "Contraception options & suitability" },
  { id: "hpv-vaccination", label: "HPV Vaccination",        icon: "Syringe",    color: "#059669", description: "HPV vaccine eligibility & status" },
  { id: "breast-cancer",   label: "Breast Cancer Screening",icon: "Activity",   color: "#334155", description: "Early breast cancer risk indicators" },
  { id: "thyroid",         label: "Thyroid Health",         icon: "Activity",   color: "#0F766E", description: "Thyroid function & hormone screening" },
  { id: "iron-deficiency", label: "Iron Deficiency",        icon: "Droplet",    color: "#065F46", description: "Anemia & iron deficiency risk assessment" },
];

export const DEFAULT_THRESHOLDS = {
  low:      { min: 0,  max: 20, label: "Low Risk",      color: "#059669", emoji: "CheckCircle", advice: "You appear to be in good health. Continue maintaining healthy lifestyle habits and schedule regular check-ups." },
  moderate: { min: 21, max: 50, label: "Moderate Risk", color: "#F59E0B", emoji: "AlertTriangle", advice: "Some health concerns have been identified. We recommend consulting a registered clinician within 2–4 weeks for a professional evaluation." },
  high:     { min: 51, max: 80, label: "High Risk",     color: "#EA580C", emoji: "AlertCircle", advice: "Significant health risks detected. Please see a registered clinician within the next week. Do not ignore these symptoms." },
  critical: { min: 81, max: 100, label: "Critical",     color: "#DC2626", emoji: "ShieldAlert", advice: "Your responses indicate serious health concerns. Please seek immediate medical attention. Contact a healthcare provider today." },
};

export const SEVERITY_LABELS: Record<number, string> = {
  0: "No Risk",
  1: "Very Low",
  2: "Low",
  3: "Mild",
  4: "Mild-Moderate",
  5: "Moderate",
  6: "Moderate-High",
  7: "High",
  8: "Very High",
  9: "Severe",
  10: "Critical",
};
