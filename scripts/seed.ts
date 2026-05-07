import { neon } from "@neondatabase/serverless";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Seeding conditions...");

  // Seed 15 conditions from PRD §5.2
  const conditions = [
    { slug: "malaria", name_en: "Malaria (Plasmodium)", name_bn: "ম্যালেরিয়া", layperson_name_en: "Malaria", layperson_name_bn: "ম্যালেরিয়া", description_en: "Malaria is caused by a Plasmodium parasite transmitted by mosquito bites. It causes cyclical fevers, chills, and sweating.", severity: "high", urgency_label: "Within 24h", specialist_type: "General Physician / Infectious Disease Specialist", next_steps_en: "1. See a doctor immediately.\n2. Blood smear test recommended.\n3. Do not self-medicate.", scoring_threshold: 6 },
    { slug: "dengue", name_en: "Dengue Fever", name_bn: "ডেঙ্গু জ্বর", layperson_name_en: "Dengue", layperson_name_bn: "ডেঙ্গু", description_en: "Dengue is a viral infection spread by Aedes mosquitoes. Symptoms include high fever, severe headache, rash, and joint pain.", severity: "high", urgency_label: "Within 12h", specialist_type: "General Physician / Infectious Disease Specialist", next_steps_en: "1. Seek emergency care immediately.\n2. CBC blood test required.\n3. Stay hydrated, avoid aspirin.", scoring_threshold: 6 },
    { slug: "hyperthyroidism", name_en: "Hyperthyroidism", name_bn: "হাইপারথাইরয়েডিজম", layperson_name_en: "Overactive Thyroid", layperson_name_bn: "থাইরয়েড বেশি সক্রিয়", description_en: "The thyroid gland produces too much hormone, speeding up metabolism. Causes weight loss, heat intolerance, and palpitations.", severity: "moderate", urgency_label: "Within 1 week", specialist_type: "Endocrinologist", next_steps_en: "1. Thyroid function test (TSH, T3, T4).\n2. Consult an endocrinologist.\n3. Avoid excessive iodine intake.", scoring_threshold: 5 },
    { slug: "hypothyroidism", name_en: "Hypothyroidism", name_bn: "হাইপোথাইরয়েডিজম", layperson_name_en: "Underactive Thyroid", layperson_name_bn: "থাইরয়েড কম সক্রিয়", description_en: "The thyroid gland does not produce enough hormone, slowing metabolism. Causes fatigue, weight gain, and cold intolerance.", severity: "moderate", urgency_label: "Within 1-2 weeks", specialist_type: "Endocrinologist", next_steps_en: "1. Thyroid function test (TSH, T4).\n2. Consult an endocrinologist.\n3. Levothyroxine may be prescribed.", scoring_threshold: 5 },
    { slug: "pcos", name_en: "Polycystic Ovary Syndrome (PCOS)", name_bn: "পলিসিস্টিক ওভারি সিনড্রোম", layperson_name_en: "PCOS", layperson_name_bn: "পিসিওএস", description_en: "A hormonal disorder causing irregular periods, excess androgen, and polycystic ovaries. It affects fertility and metabolism.", severity: "moderate", urgency_label: "Within 2 weeks", specialist_type: "Gynaecologist", next_steps_en: "1. Pelvic ultrasound and hormonal blood tests.\n2. Consult a gynaecologist.\n3. Lifestyle changes help manage symptoms.", scoring_threshold: 4 },
    { slug: "jaundice", name_en: "Jaundice (Hepatic)", name_bn: "জন্ডিস", layperson_name_en: "Jaundice", layperson_name_bn: "জন্ডিস", description_en: "Yellowing of skin and eyes caused by elevated bilirubin. Can indicate liver disease, bile duct obstruction, or haemolysis.", severity: "high", urgency_label: "Within 48h", specialist_type: "Gastroenterologist / Hepatologist", next_steps_en: "1. Liver function tests urgently.\n2. Abdominal ultrasound.\n3. Avoid alcohol and fatty foods.", scoring_threshold: 6 },
    { slug: "anaemia", name_en: "Iron-Deficiency Anaemia", name_bn: "আয়রন ঘাটতি রক্তাল্পতা", layperson_name_en: "Anaemia", layperson_name_bn: "রক্তশূন্যতা", description_en: "Low red blood cell count due to iron deficiency. Causes fatigue, pale skin, dizziness, and palpitations.", severity: "moderate", urgency_label: "Within 1 week", specialist_type: "General Physician / Haematologist", next_steps_en: "1. Full blood count (FBC) test.\n2. Iron supplementation may be prescribed.\n3. Increase iron-rich foods in diet.", scoring_threshold: 5 },
    { slug: "uti", name_en: "Urinary Tract Infection (UTI)", name_bn: "মূত্রনালীর সংক্রমণ", layperson_name_en: "UTI", layperson_name_bn: "ইউটিআই", description_en: "A bacterial infection affecting the urinary tract. Causes burning urination, frequency, and pelvic pain.", severity: "moderate", urgency_label: "Within 48h", specialist_type: "General Physician / Urologist", next_steps_en: "1. Urine culture test.\n2. Antibiotic treatment required.\n3. Drink plenty of water.", scoring_threshold: 5 },
    { slug: "haematuria", name_en: "Haematuria (Blood in Urine)", name_bn: "প্রস্রাবে রক্ত", layperson_name_en: "Blood in Urine", layperson_name_bn: "প্রস্রাবে রক্ত", description_en: "Presence of blood in urine, which may indicate kidney stones, infection, or in rare cases, cancer.", severity: "high", urgency_label: "Within 24h", specialist_type: "Urologist / Nephrologist", next_steps_en: "1. Urine and blood tests immediately.\n2. Ultrasound of kidneys.\n3. Do not delay — seek care today.", scoring_threshold: 7 },
    { slug: "diabetes-t2", name_en: "Diabetes Mellitus (Type 2 Risk)", name_bn: "ডায়াবেটিস মেলিটাস ঝুঁকি", layperson_name_en: "Diabetes Risk", layperson_name_bn: "ডায়াবেটিসের ঝুঁকি", description_en: "Elevated blood sugar risk based on your family history and symptoms. Type 2 diabetes is preventable with early lifestyle changes.", severity: "moderate", urgency_label: "Within 1 week", specialist_type: "Endocrinologist / General Physician", next_steps_en: "1. Fasting blood glucose and HbA1c test.\n2. Consult your doctor about diet changes.\n3. Regular exercise helps prevent progression.", scoring_threshold: 5 },
    { slug: "hypercholesterolaemia", name_en: "Hypercholesterolaemia", name_bn: "উচ্চ কোলেস্টেরল", layperson_name_en: "High Cholesterol", layperson_name_bn: "উচ্চ কোলেস্টেরল", description_en: "Elevated cholesterol levels in the blood, increasing risk of heart disease and stroke.", severity: "moderate", urgency_label: "Within 2 weeks", specialist_type: "Cardiologist / General Physician", next_steps_en: "1. Lipid panel blood test.\n2. Dietary modifications recommended.\n3. Statins may be prescribed.", scoring_threshold: 4 },
    { slug: "gi-bleed", name_en: "Gastrointestinal Bleed (Upper)", name_bn: "পরিপাকতন্ত্রে রক্তক্ষরণ", layperson_name_en: "GI Bleed", layperson_name_bn: "পরিপাকতন্ত্রে রক্তক্ষরণ", description_en: "Bleeding in the upper gastrointestinal tract (stomach or oesophagus). A medical emergency requiring immediate attention.", severity: "critical", urgency_label: "Emergency / Immediately", specialist_type: "Gastroenterologist / Emergency Physician", next_steps_en: "1. Go to emergency room immediately.\n2. Do not eat or drink anything.\n3. Call emergency services if vomiting blood.", scoring_threshold: 8 },
    { slug: "tb-risk", name_en: "Pulmonary Tuberculosis Risk", name_bn: "যক্ষ্মার ঝুঁকি", layperson_name_en: "TB Risk", layperson_name_bn: "যক্ষ্মার ঝুঁকি", description_en: "Symptoms suggest possible tuberculosis exposure or infection. TB is treatable but requires early diagnosis.", severity: "high", urgency_label: "Within 24h", specialist_type: "Pulmonologist / Infectious Disease Specialist", next_steps_en: "1. Chest X-ray and sputum test.\n2. TB skin or blood test (Mantoux/IGRA).\n3. Isolate until cleared by doctor.", scoring_threshold: 6 },
    { slug: "platelet-disorder", name_en: "Suspected Platelet Disorder", name_bn: "প্লেটলেট সমস্যার সন্দেহ", layperson_name_en: "Platelet Disorder", layperson_name_bn: "প্লেটলেট সমস্যা", description_en: "Abnormal bleeding from multiple sites may indicate a platelet disorder such as ITP or thrombocytopenia.", severity: "high", urgency_label: "Within 24h", specialist_type: "Haematologist", next_steps_en: "1. Complete blood count (CBC) immediately.\n2. Platelet count and clotting tests.\n3. Avoid aspirin and NSAIDs.", scoring_threshold: 7 },
    { slug: "emergency-injury", name_en: "Emergency Injury (Significant Blood Loss)", name_bn: "জরুরি আঘাত", layperson_name_en: "Emergency Injury", layperson_name_bn: "জরুরি আঘাত", description_en: "Severe injury with significant blood loss requires immediate emergency medical care.", severity: "critical", urgency_label: "Emergency / Immediately", specialist_type: "Emergency Physician / Surgeon", next_steps_en: "1. Call emergency services immediately.\n2. Apply pressure to the wound.\n3. Do not remove embedded objects.", scoring_threshold: 8 },
  ];

  for (const c of conditions) {
    await sql`
      INSERT INTO conditions (slug, name_en, name_bn, layperson_name_en, layperson_name_bn,
        description_en, severity, urgency_label, specialist_type, next_steps_en, scoring_threshold)
      VALUES (
        ${c.slug}, ${c.name_en}, ${c.name_bn}, ${c.layperson_name_en}, ${c.layperson_name_bn},
        ${c.description_en}, ${c.severity as "low" | "moderate" | "high" | "critical"},
        ${c.urgency_label}, ${c.specialist_type ?? null}, ${c.next_steps_en}, ${c.scoring_threshold ?? null}
      )
      ON CONFLICT (slug) DO NOTHING
    `;
  }
  console.log("  ✓ 15 conditions seeded");

  // Update existing topics to set question types
  await sql`UPDATE questions SET type = 'single' WHERE type IS NULL`;
  console.log("  ✓ question types set");

  // Seed score thresholds (idempotent)
  await sql`
    INSERT INTO score_thresholds (level, min, max, label, label_bn, color, emoji, advice, advice_bn)
    VALUES
      ('low',      0,  20,  'Low Risk',      'কম ঝুঁকি',      '#059669', 'CheckCircle', 'You appear to be in good health.', 'আপনি সুস্বাস্থ্যে আছেন।'),
      ('moderate', 21, 50,  'Moderate Risk', 'মাঝারি ঝুঁকি', '#F59E0B', 'AlertTriangle', 'Some concerns identified. See a clinician within 2–4 weeks.', 'কিছু উদ্বেগ। ২–৪ সপ্তাহে চিকিৎসক দেখান।'),
      ('high',     51, 80,  'High Risk',     'উচ্চ ঝুঁকি',   '#EA580C', 'AlertCircle', 'Significant risks detected. See a clinician this week.', 'উল্লেখযোগ্য ঝুঁকি। এই সপ্তাহে চিকিৎসক দেখান।'),
      ('critical', 81, 100, 'Critical',      'গুরুতর',        '#DC2626', 'ShieldAlert', 'Serious concerns. Seek immediate medical attention.', 'গুরুতর। আজই চিকিৎসা নিন।')
    ON CONFLICT (level) DO NOTHING
  `;
  console.log("  ✓ score thresholds seeded");

  // Extra clinicians
  await sql`
    INSERT INTO clinicians (name, specialty, address, lat, lng, phone, verified)
    VALUES
      ('Dr. Fatema Khanam',   'Gynecology',       'Dhanmondi, Dhaka',   23.7461, 90.3742, '+880-1712-345678', true),
      ('Dr. Nasrin Sultana',  'Obstetrics',        'Gulshan, Dhaka',     23.7925, 90.4078, '+880-1811-234567', true),
      ('Dr. Rahela Begum',    'Internal Medicine', 'Motijheel, Dhaka',   23.7334, 90.4182, '+880-1612-456789', true),
      ('Dr. Shirin Akhter',   'Endocrinology',     'Uttara, Dhaka',      23.8759, 90.3795, '+880-1911-567890', true),
      ('Dr. Meherun Nessa',   'Cardiology',        'Mirpur, Dhaka',      23.8041, 90.3660, '+880-1511-678901', true),
      ('Dr. Afroza Begum',    'Dermatology',       'Chittagong',         22.3569, 91.7832, '+880-1711-789012', true),
      ('Dr. Taslima Khatun',  'Haematology',       'Sylhet',             24.8949, 91.8687, '+880-1611-890123', false),
      ('Dr. Razia Sultana',   'Nephrology',        'Rajshahi',           24.3745, 88.6042, '+880-1811-901234', false)
    ON CONFLICT DO NOTHING
  `;
  console.log("  ✓ clinicians seeded");

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch(err => { console.error("❌ Seed failed:", err); process.exit(1); });
