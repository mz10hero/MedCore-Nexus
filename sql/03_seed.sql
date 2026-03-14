-- ═══════════════════════════════════════════════════════════
-- LABCORE LIS — Seed Data: Tests Catalog
-- Run AFTER 01_schema.sql
-- ═══════════════════════════════════════════════════════════

insert into public.tests_catalog
  (test_name, abbreviation, unit, normal_min, normal_max, category, sort_order)
values
  -- CBC
  ('White Blood Cells',          'WBC',   'x10^3/uL', 4.5,  11.0, 'CBC',         1),
  ('Red Blood Cells',            'RBC',   'x10^6/uL', 4.5,   5.9, 'CBC',         2),
  ('Hemoglobin',                 'HGB',   'g/dL',    13.5,  17.5, 'CBC',         3),
  ('Hematocrit',                 'HCT',   '%',       41.0,  53.0, 'CBC',         4),
  ('Mean Corpuscular Volume',    'MCV',   'fL',      80.0, 100.0, 'CBC',         5),
  ('Mean Corp. Hemoglobin',      'MCH',   'pg',      27.0,  33.0, 'CBC',         6),
  ('MCHC',                       'MCHC',  'g/dL',    32.0,  36.0, 'CBC',         7),
  ('Platelets',                  'PLT',   'x10^3/uL',150., 400.0, 'CBC',         8),
  ('Neutrophils %',              'NEU%',  '%',       50.0,  70.0, 'CBC',         9),
  ('Lymphocytes %',              'LYM%',  '%',       20.0,  40.0, 'CBC',        10),

  -- Coagulation
  ('Prothrombin Time',           'PT',    'sec',     11.0,  15.0, 'Coagulation', 1),
  ('INR',                        'INR',   'ratio',    0.8,   1.2, 'Coagulation', 2),
  ('APTT',                       'APTT',  'sec',     25.0,  35.0, 'Coagulation', 3),
  ('Fibrinogen',                 'FIB',   'g/L',      2.0,   4.0, 'Coagulation', 4),

  -- LFT
  ('ALT (SGPT)',                 'ALT',   'U/L',      7.0,  56.0, 'LFT',         1),
  ('AST (SGOT)',                 'AST',   'U/L',     10.0,  40.0, 'LFT',         2),
  ('Alkaline Phosphatase',       'ALP',   'U/L',     44.0, 147.0, 'LFT',         3),
  ('Total Bilirubin',            'TBIL',  'mg/dL',    0.2,   1.2, 'LFT',         4),
  ('Direct Bilirubin',           'DBIL',  'mg/dL',    0.0,   0.3, 'LFT',         5),
  ('Albumin',                    'ALB',   'g/dL',     3.5,   5.0, 'LFT',         6),
  ('Total Protein',              'TP',    'g/dL',     6.3,   8.2, 'LFT',         7),

  -- RFT
  ('Urea',                       'UREA',  'mg/dL',   15.0,  45.0, 'RFT',         1),
  ('Creatinine',                 'CREAT', 'mg/dL',    0.7,   1.2, 'RFT',         2),
  ('Uric Acid',                  'UA',    'mg/dL',    3.5,   7.2, 'RFT',         3),
  ('eGFR',                       'eGFR',  'mL/min',  60.0, 120.0, 'RFT',         4),

  -- Thyroid
  ('TSH',                        'TSH',   'mIU/L',    0.4,   4.0, 'Thyroid',     1),
  ('Free T4',                    'FT4',   'ng/dL',    0.8,   1.8, 'Thyroid',     2),
  ('Free T3',                    'FT3',   'pg/mL',    2.3,   4.2, 'Thyroid',     3),

  -- Diabetes
  ('Fasting Blood Sugar',        'FBS',   'mg/dL',   70.0,  99.0, 'Diabetes',    1),
  ('Random Blood Sugar',         'RBS',   'mg/dL',   70.0, 140.0, 'Diabetes',    2),
  ('HbA1c',                      'HbA1c', '%',        4.0,   5.7, 'Diabetes',    3),

  -- Lipid
  ('Total Cholesterol',          'CHOL',  'mg/dL',    0.0, 200.0, 'Lipid',       1),
  ('Triglycerides',              'TG',    'mg/dL',    0.0, 150.0, 'Lipid',       2),
  ('HDL Cholesterol',            'HDL',   'mg/dL',   40.0, 999.0, 'Lipid',       3),
  ('LDL Cholesterol',            'LDL',   'mg/dL',    0.0, 100.0, 'Lipid',       4);
