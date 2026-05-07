import type { Topic } from "./types";

const DEFAULT_TOPICS: Topic[] = [
  {
    id: "hepatitis", label: "Hepatitis", icon: "HeartPulse", color: "#0F766E",
    description: "Liver health & hepatitis risk assessment", visible: true, weight: 1,
    questions: [
      { id: "hep-1", text: "Have you ever been diagnosed with hepatitis A, B, or C?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Yes, Hepatitis A (resolved)", value: "hep-a", severity: 2 },
        { label: "Yes, Hepatitis B", value: "hep-b", severity: 7 },
        { label: "Yes, Hepatitis C", value: "hep-c", severity: 8 },
      ]},
      { id: "hep-2", text: "Do you experience yellowing of skin or eyes (jaundice)?", required: true, options: [
        { label: "Never", value: "never", severity: 0 },
        { label: "Occasionally", value: "occasional", severity: 4 },
        { label: "Currently experiencing it", value: "current", severity: 8 },
      ]},
      { id: "hep-3", text: "How often do you experience persistent fatigue and loss of appetite?", required: true, options: [
        { label: "Rarely or never", value: "never", severity: 0 },
        { label: "Sometimes (1–2 times/month)", value: "sometimes", severity: 2 },
        { label: "Often (weekly)", value: "often", severity: 5 },
        { label: "Almost daily", value: "daily", severity: 8 },
      ]},
      { id: "hep-4", text: "Have you had unprotected blood contact (shared needles, unscreened transfusion)?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Once, long ago", value: "once-old", severity: 3 },
        { label: "Yes, recently", value: "recent", severity: 8 },
      ]},
      { id: "hep-5", text: "Do you have dark-colored urine or pale stools?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Occasionally", value: "occasional", severity: 4 },
        { label: "Yes, frequently", value: "frequent", severity: 7 },
      ]},
    ],
  },
  {
    id: "pregnancy-problems", label: "Pregnancy Problems", icon: "AlertCircle", color: "#065F46",
    description: "Complications & concerns during pregnancy", visible: true, weight: 1,
    questions: [
      { id: "pp-1", text: "Are you currently pregnant?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Yes, 1st trimester (0–12 weeks)", value: "t1", severity: 1 },
        { label: "Yes, 2nd trimester (13–26 weeks)", value: "t2", severity: 1 },
        { label: "Yes, 3rd trimester (27+ weeks)", value: "t3", severity: 1 },
      ]},
      { id: "pp-2", text: "Have you experienced vaginal bleeding during pregnancy?", required: true, options: [
        { label: "No / Not applicable", value: "no", severity: 0 },
        { label: "Light spotting (1–2 times)", value: "light", severity: 4 },
        { label: "Heavy bleeding", value: "heavy", severity: 9 },
      ]},
      { id: "pp-3", text: "Do you have high blood pressure or swelling in hands/feet during pregnancy?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Mild swelling only", value: "mild", severity: 3 },
        { label: "High BP confirmed by doctor", value: "hbp", severity: 7 },
        { label: "Severe headache + high BP + swelling", value: "severe", severity: 10 },
      ]},
      { id: "pp-4", text: "Have you had a previous miscarriage or pregnancy loss?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Once", value: "once", severity: 3 },
        { label: "Two or more times", value: "multiple", severity: 6 },
      ]},
      { id: "pp-5", text: "Are you experiencing severe nausea/vomiting beyond the 1st trimester?", required: true, options: [
        { label: "No / Mild morning sickness", value: "no", severity: 0 },
        { label: "Moderate, affecting daily life", value: "moderate", severity: 4 },
        { label: "Severe, unable to keep food down", value: "severe", severity: 8 },
      ]},
    ],
  },
  {
    id: "arsenic", label: "Arsenic Exposure", icon: "Droplets", color: "#0E7490",
    description: "Water & food arsenic contamination risk", visible: true, weight: 1,
    questions: [
      { id: "ars-1", text: "What is your primary source of drinking water?", required: true, options: [
        { label: "Treated piped water / bottled", value: "treated", severity: 0 },
        { label: "Tube well (tested, safe)", value: "tube-safe", severity: 1 },
        { label: "Tube well (untested)", value: "tube-unknown", severity: 5 },
        { label: "Shallow/open well", value: "open-well", severity: 7 },
      ]},
      { id: "ars-2", text: "Do you have skin patches, hardening, or unusual darkening of skin?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Mild discoloration", value: "mild", severity: 4 },
        { label: "Clear patches/hardening (keratosis)", value: "keratosis", severity: 8 },
      ]},
      { id: "ars-3", text: "Do you experience numbness or tingling in hands/feet?", required: true, options: [
        { label: "Never", value: "never", severity: 0 },
        { label: "Occasionally", value: "occasional", severity: 3 },
        { label: "Frequently", value: "frequent", severity: 6 },
      ]},
      { id: "ars-4", text: "Has anyone in your household been diagnosed with arsenic poisoning?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Yes, a family member", value: "family", severity: 5 },
        { label: "Yes, myself", value: "self", severity: 9 },
      ]},
    ],
  },
  {
    id: "menstrual", label: "Menstrual Health", icon: "Activity", color: "#059669",
    description: "Cycle irregularities & menstrual concerns", visible: true, weight: 1,
    questions: [
      { id: "men-1", text: "How regular is your menstrual cycle?", required: true, options: [
        { label: "Very regular (21–35 day cycle)", value: "regular", severity: 0 },
        { label: "Slightly irregular (varies 1–2 weeks)", value: "slightly", severity: 2 },
        { label: "Very irregular or unpredictable", value: "irregular", severity: 5 },
        { label: "Absent for 3+ months (not pregnant)", value: "absent", severity: 8 },
      ]},
      { id: "men-2", text: "How heavy is your menstrual flow?", required: true, options: [
        { label: "Light to normal", value: "normal", severity: 0 },
        { label: "Heavy (soaks pad in under 2 hours)", value: "heavy", severity: 5 },
        { label: "Extremely heavy with clots", value: "very-heavy", severity: 8 },
      ]},
      { id: "men-3", text: "How would you describe your menstrual pain?", required: true, options: [
        { label: "Mild or no pain", value: "none", severity: 0 },
        { label: "Moderate pain, manageable", value: "moderate", severity: 3 },
        { label: "Severe pain affecting daily activities", value: "severe", severity: 7 },
        { label: "Excruciating, requires medication/bed rest", value: "excruciating", severity: 9 },
      ]},
      { id: "men-4", text: "Do you experience bleeding between periods?", required: true, options: [
        { label: "Never", value: "never", severity: 0 },
        { label: "Occasionally (light spotting)", value: "occasional", severity: 3 },
        { label: "Frequently", value: "frequent", severity: 7 },
      ]},
      { id: "men-5", text: "Have you been diagnosed with PCOS, endometriosis, or fibroids?", required: true, options: [
        { label: "No diagnosis", value: "no", severity: 0 },
        { label: "Suspected but unconfirmed", value: "suspected", severity: 4 },
        { label: "Yes, diagnosed", value: "diagnosed", severity: 7 },
      ]},
    ],
  },
  {
    id: "viral", label: "Viral Infections", icon: "ShieldAlert", color: "#334155",
    description: "Common viral illness risk screening", visible: true, weight: 1,
    questions: [
      { id: "vir-1", text: "How often do you get fever, cold, or flu in a year?", required: true, options: [
        { label: "Rarely (0–1 times)", value: "rarely", severity: 0 },
        { label: "Sometimes (2–3 times)", value: "sometimes", severity: 2 },
        { label: "Frequently (4+ times)", value: "frequent", severity: 5 },
      ]},
      { id: "vir-2", text: "Do you currently have a persistent cough (>2 weeks)?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Yes, mild", value: "mild", severity: 3 },
        { label: "Yes, with blood or mucus", value: "severe", severity: 8 },
      ]},
      { id: "vir-3", text: "Have you been vaccinated for common preventable viral diseases (flu, COVID-19)?", required: true, options: [
        { label: "Yes, up to date", value: "yes", severity: 0 },
        { label: "Partially vaccinated", value: "partial", severity: 2 },
        { label: "No vaccinations", value: "no", severity: 5 },
      ]},
      { id: "vir-4", text: "Do you experience recurring mouth sores or skin rashes?", required: true, options: [
        { label: "Never", value: "never", severity: 0 },
        { label: "Occasionally", value: "occasional", severity: 3 },
        { label: "Frequently (monthly)", value: "frequent", severity: 6 },
      ]},
    ],
  },
  {
    id: "nutrition", label: "Nutrition & Diet", icon: "Apple", color: "#0F766E",
    description: "Dietary habits & nutritional deficiencies", visible: true, weight: 1,
    questions: [
      { id: "nut-1", text: "How many servings of fruits and vegetables do you eat daily?", required: true, options: [
        { label: "5 or more", value: "5plus", severity: 0 },
        { label: "3–4 servings", value: "3-4", severity: 1 },
        { label: "1–2 servings", value: "1-2", severity: 3 },
        { label: "Rarely eat fruits/vegetables", value: "rarely", severity: 6 },
      ]},
      { id: "nut-2", text: "Do you eat protein-rich foods (meat, fish, eggs, lentils) regularly?", required: true, options: [
        { label: "Yes, daily", value: "daily", severity: 0 },
        { label: "A few times a week", value: "few", severity: 2 },
        { label: "Rarely", value: "rarely", severity: 5 },
      ]},
      { id: "nut-3", text: "Do you skip meals regularly?", required: true, options: [
        { label: "Never or rarely", value: "never", severity: 0 },
        { label: "Sometimes (2–3 times/week)", value: "sometimes", severity: 3 },
        { label: "Often (daily)", value: "often", severity: 6 },
      ]},
      { id: "nut-4", text: "Are you currently underweight or significantly overweight?", required: true, options: [
        { label: "Normal weight (healthy BMI)", value: "normal", severity: 0 },
        { label: "Slightly under/overweight", value: "slight", severity: 2 },
        { label: "Significantly underweight", value: "underweight", severity: 6 },
        { label: "Significantly overweight/obese", value: "obese", severity: 5 },
      ]},
    ],
  },
  {
    id: "pregnancy-care", label: "Pregnancy Care", icon: "Heart", color: "#065F46",
    description: "Prenatal care & safe pregnancy guidance", visible: true, weight: 1,
    questions: [
      { id: "pc-1", text: "Are you currently pregnant and receiving antenatal care?", required: true, options: [
        { label: "Not pregnant", value: "no", severity: 0 },
        { label: "Pregnant, regular checkups", value: "regular", severity: 0 },
        { label: "Pregnant, irregular checkups", value: "irregular", severity: 4 },
        { label: "Pregnant, no checkups at all", value: "none", severity: 8 },
      ]},
      { id: "pc-2", text: "Are you taking folic acid or prenatal vitamins?", required: true, options: [
        { label: "Not pregnant / Not applicable", value: "na", severity: 0 },
        { label: "Yes, regularly", value: "yes", severity: 0 },
        { label: "Sometimes / Forgot often", value: "sometimes", severity: 3 },
        { label: "No", value: "no", severity: 6 },
      ]},
      { id: "pc-3", text: "Do you smoke, drink alcohol, or use substances during pregnancy?", required: true, options: [
        { label: "No / Not pregnant", value: "no", severity: 0 },
        { label: "Occasionally alcohol", value: "alcohol-occ", severity: 5 },
        { label: "Smokes regularly", value: "smokes", severity: 8 },
        { label: "Uses other substances", value: "substances", severity: 10 },
      ]},
      { id: "pc-4", text: "Has your doctor identified any high-risk pregnancy conditions (diabetes, twins, etc.)?", required: true, options: [
        { label: "No / Not pregnant", value: "no", severity: 0 },
        { label: "Yes, being monitored", value: "monitored", severity: 4 },
        { label: "Yes, but not receiving special care", value: "unmanaged", severity: 8 },
      ]},
    ],
  },
  {
    id: "birth-control", label: "Birth Control", icon: "Pill", color: "#0E7490",
    description: "Contraception options & suitability", visible: true, weight: 1,
    questions: [
      { id: "bc-1", text: "Are you currently using any form of birth control?", required: true, options: [
        { label: "Yes, consistently", value: "yes", severity: 0 },
        { label: "Sometimes / Inconsistently", value: "sometimes", severity: 3 },
        { label: "No", value: "no", severity: 0 },
        { label: "Trying to conceive", value: "conceive", severity: 0 },
      ]},
      { id: "bc-2", text: "Do you experience side effects from your current birth control (headaches, bleeding, mood changes)?", required: true, options: [
        { label: "No side effects / Not using", value: "none", severity: 0 },
        { label: "Mild side effects", value: "mild", severity: 2 },
        { label: "Significant side effects", value: "significant", severity: 6 },
      ]},
      { id: "bc-3", text: "Have you ever experienced an unintended pregnancy?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Once", value: "once", severity: 2 },
        { label: "More than once", value: "multiple", severity: 4 },
      ]},
      { id: "bc-4", text: "Do you have a chronic condition (clotting disorders, migraines) that affects contraceptive choice?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Yes, doctor is aware", value: "managed", severity: 3 },
        { label: "Yes, not discussed with doctor", value: "unmanaged", severity: 7 },
      ]},
    ],
  },
  {
    id: "hpv-vaccination", label: "HPV Vaccination", icon: "Syringe", color: "#059669",
    description: "HPV vaccine eligibility & status", visible: true, weight: 1,
    questions: [
      { id: "hpv-1", text: "Have you received the HPV vaccine?", required: true, options: [
        { label: "Yes, all doses completed", value: "complete", severity: 0 },
        { label: "Partially vaccinated", value: "partial", severity: 3 },
        { label: "No, never vaccinated", value: "no", severity: 6 },
        { label: "Don't know", value: "unknown", severity: 4 },
      ]},
      { id: "hpv-2", text: "Have you had an abnormal Pap smear result?", required: true, options: [
        { label: "No / Never had one", value: "no", severity: 1 },
        { label: "Normal result", value: "normal", severity: 0 },
        { label: "Abnormal result (mild changes)", value: "mild", severity: 5 },
        { label: "Abnormal result (significant changes)", value: "significant", severity: 9 },
      ]},
      { id: "hpv-3", text: "How old are you?", required: true, options: [
        { label: "Under 26 (ideal vaccination window)", value: "under26", severity: 0 },
        { label: "26–45 (still eligible)", value: "26-45", severity: 1 },
        { label: "Over 45", value: "over45", severity: 2 },
      ]},
      { id: "hpv-4", text: "Do you have a family history of cervical cancer?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Yes, distant relative", value: "distant", severity: 3 },
        { label: "Yes, immediate family (mother/sister)", value: "immediate", severity: 7 },
      ]},
    ],
  },
  {
    id: "breast-cancer", label: "Breast Cancer Screening", icon: "Activity", color: "#334155",
    description: "Early breast cancer risk indicators", visible: true, weight: 1,
    questions: [
      { id: "bc-s1", text: "Have you noticed any new lumps or thickening in your breast?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Yes, soft and movable", value: "soft", severity: 4 },
        { label: "Yes, hard and fixed", value: "hard", severity: 9 },
      ]},
      { id: "bc-s2", text: "Do you have a family history of breast or ovarian cancer?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Yes, distant relative", value: "distant", severity: 3 },
        { label: "Yes, mother or sister", value: "immediate", severity: 7 },
        { label: "Yes, multiple close relatives", value: "multiple", severity: 9 },
      ]},
      { id: "bc-s3", text: "Have you had any nipple discharge (not related to breastfeeding)?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Clear or milky discharge", value: "clear", severity: 3 },
        { label: "Bloody or dark discharge", value: "bloody", severity: 9 },
      ]},
      { id: "bc-s4", text: "When did you last have a breast screening/mammogram?", required: true, options: [
        { label: "Within the last year", value: "recent", severity: 0 },
        { label: "1–3 years ago", value: "1-3yrs", severity: 2 },
        { label: "Over 3 years ago", value: "3plus", severity: 4 },
        { label: "Never had one", value: "never", severity: 5 },
      ]},
      { id: "bc-s5", text: "Do you perform regular self-breast examinations?", required: true, options: [
        { label: "Yes, monthly", value: "monthly", severity: 0 },
        { label: "Occasionally", value: "occasional", severity: 1 },
        { label: "Never", value: "never", severity: 3 },
      ]},
    ],
  },
  {
    id: "thyroid", label: "Thyroid Health", icon: "Activity", color: "#0F766E",
    description: "Thyroid function & hormone screening", visible: true, weight: 1,
    questions: [
      { id: "thy-1", text: "Have you been diagnosed with a thyroid condition?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Hypothyroidism (underactive), managed", value: "hypo-managed", severity: 2 },
        { label: "Hyperthyroidism (overactive), managed", value: "hyper-managed", severity: 2 },
        { label: "Diagnosed but unmanaged", value: "unmanaged", severity: 7 },
      ]},
      { id: "thy-2", text: "Do you experience unexplained weight changes (gain or loss)?", required: true, options: [
        { label: "No significant changes", value: "no", severity: 0 },
        { label: "Mild (2–5 kg without cause)", value: "mild", severity: 3 },
        { label: "Significant (>5 kg without cause)", value: "significant", severity: 7 },
      ]},
      { id: "thy-3", text: "Do you feel unusually cold or hot when others are comfortable?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Sometimes", value: "sometimes", severity: 2 },
        { label: "Frequently", value: "frequent", severity: 5 },
      ]},
      { id: "thy-4", text: "Do you have a visible swelling at the base of your neck (goiter)?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Slight swelling noticed", value: "slight", severity: 5 },
        { label: "Visible goiter confirmed by doctor", value: "confirmed", severity: 8 },
      ]},
      { id: "thy-5", text: "Do you experience persistent hair loss, dry skin, or extreme fatigue?", required: true, options: [
        { label: "None of these", value: "none", severity: 0 },
        { label: "1–2 symptoms, mild", value: "mild", severity: 3 },
        { label: "All or most, significantly", value: "significant", severity: 6 },
      ]},
    ],
  },
  {
    id: "iron-deficiency", label: "Iron Deficiency", icon: "Droplet", color: "#065F46",
    description: "Anemia & iron deficiency risk assessment", visible: true, weight: 1,
    questions: [
      { id: "iro-1", text: "Do you feel excessively tired or weak even after a full night's sleep?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Sometimes", value: "sometimes", severity: 3 },
        { label: "Most days", value: "most-days", severity: 6 },
        { label: "Always", value: "always", severity: 8 },
      ]},
      { id: "iro-2", text: "Do you appear pale (skin, gums, inner eyelids)?", required: true, options: [
        { label: "Normal color", value: "normal", severity: 0 },
        { label: "Slightly pale", value: "slight", severity: 3 },
        { label: "Very pale", value: "very-pale", severity: 7 },
      ]},
      { id: "iro-3", text: "Do you experience shortness of breath during normal activity?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "During heavy activity only", value: "heavy", severity: 2 },
        { label: "During light activity", value: "light", severity: 5 },
        { label: "Even at rest", value: "rest", severity: 9 },
      ]},
      { id: "iro-4", text: "Do you crave unusual non-food items (ice, clay, dirt)?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Occasionally crave ice", value: "ice", severity: 4 },
        { label: "Crave clay, dirt, or other non-food", value: "pica", severity: 8 },
      ]},
      { id: "iro-5", text: "Have you been diagnosed with anemia or low hemoglobin?", required: true, options: [
        { label: "No", value: "no", severity: 0 },
        { label: "Mild anemia (managed)", value: "mild", severity: 3 },
        { label: "Moderate to severe anemia", value: "severe", severity: 8 },
      ]},
    ],
  },
];

export default DEFAULT_TOPICS;
