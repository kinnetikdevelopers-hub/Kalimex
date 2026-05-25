-- ============================================================
-- KALIMEX — Complete Supabase Schema
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── SCHOOLS ──────────────────────────────────────────────────────────────────
create table schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  short_name text,
  logo_url text,
  address text,
  county text,
  phone text,
  email text,
  principal_name text,
  subscription_tier text default 'starter' check (subscription_tier in ('starter','growth','pro')),
  subscription_status text default 'trial' check (subscription_status in ('active','trial','suspended','cancelled')),
  subscription_start date,
  subscription_end date,
  max_students int default 150,
  -- Daraja (encrypted at application level)
  daraja_consumer_key text,
  daraja_consumer_secret text,
  daraja_paybill text,
  daraja_passkey text,
  daraja_env text default 'sandbox' check (daraja_env in ('sandbox','production')),
  daraja_configured boolean default false,
  -- SMS
  sms_api_key text,
  sms_sender_id text,
  sms_configured boolean default false,
  created_at timestamptz default now(),
  is_active boolean default true
);

-- ─── USERS ────────────────────────────────────────────────────────────────────
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  role text not null check (role in ('super_admin','school_admin','bursar','parent','receptionist')),
  school_id uuid references schools(id),
  avatar_url text,
  created_at timestamptz default now(),
  is_active boolean default true
);

-- ─── GRADES ───────────────────────────────────────────────────────────────────
create table grades (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  code text,
  sort_order int default 0,
  is_active boolean default true
);

-- ─── STREAMS ──────────────────────────────────────────────────────────────────
create table streams (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  grade_id uuid references grades(id) on delete cascade,
  name text not null,
  class_teacher_id uuid,
  capacity int default 40,
  is_active boolean default true
);

-- ─── ACADEMIC YEARS ───────────────────────────────────────────────────────────
create table academic_years (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  is_current boolean default false
);

-- ─── TERMS ────────────────────────────────────────────────────────────────────
create table terms (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  academic_year_id uuid references academic_years(id),
  name text not null,
  term_number int check (term_number in (1,2,3)),
  start_date date,
  end_date date,
  fee_due_date date,
  is_current boolean default false,
  invoices_generated boolean default false
);

-- ─── VOTEHEADS ────────────────────────────────────────────────────────────────
create table voteheads (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  description text,
  is_mandatory boolean default true,
  is_active boolean default true,
  sort_order int default 0
);

-- ─── FEE STRUCTURES ───────────────────────────────────────────────────────────
create table fee_structures (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  term_id uuid references terms(id) on delete cascade,
  grade_id uuid references grades(id) on delete cascade,
  votehead_id uuid references voteheads(id),
  amount numeric(12,2) not null default 0,
  is_optional boolean default false,
  unique(term_id, grade_id, votehead_id)
);

-- ─── FAMILIES ─────────────────────────────────────────────────────────────────
create table families (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  sibling_discount_tier int default 0
);

-- ─── GUARDIANS ────────────────────────────────────────────────────────────────
create table guardians (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  user_id uuid references auth.users(id),
  full_name text not null,
  phone text not null,
  phone_alt text,
  email text,
  id_number text,
  relationship text,
  is_primary boolean default false,
  is_fee_responsible boolean default true,
  family_id uuid references families(id)
);

-- ─── STUDENTS ─────────────────────────────────────────────────────────────────
create table students (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  admission_number text not null,
  full_name text not null,
  date_of_birth date,
  gender text check (gender in ('male','female')),
  grade_id uuid references grades(id),
  stream_id uuid references streams(id),
  admission_date date,
  status text default 'active' check (status in ('active','graduated','transferred','suspended','withdrawn')),
  photo_url text,
  family_id uuid references families(id),
  created_at timestamptz default now(),
  unique(school_id, admission_number)
);

-- ─── STUDENT GUARDIANS ────────────────────────────────────────────────────────
create table student_guardians (
  student_id uuid references students(id) on delete cascade,
  guardian_id uuid references guardians(id) on delete cascade,
  is_primary boolean default false,
  primary key (student_id, guardian_id)
);

-- ─── INVOICES ─────────────────────────────────────────────────────────────────
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  term_id uuid references terms(id),
  invoice_number text not null,
  issued_date date default current_date,
  due_date date,
  subtotal numeric(12,2) default 0,
  discount_amount numeric(12,2) default 0,
  bursary_amount numeric(12,2) default 0,
  net_amount numeric(12,2) default 0,
  paid_amount numeric(12,2) default 0,
  balance numeric(12,2) generated always as (net_amount - paid_amount) stored,
  status text default 'unpaid' check (status in ('unpaid','partial','paid','overpaid','waived')),
  notes text,
  unique(school_id, invoice_number)
);

-- ─── INVOICE ITEMS ────────────────────────────────────────────────────────────
create table invoice_items (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid references invoices(id) on delete cascade,
  votehead_id uuid references voteheads(id),
  description text,
  amount numeric(12,2) default 0,
  discount numeric(12,2) default 0,
  net_amount numeric(12,2) generated always as (amount - discount) stored
);

-- ─── PAYMENTS ─────────────────────────────────────────────────────────────────
create table payments (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  student_id uuid references students(id),
  invoice_id uuid references invoices(id),
  receipt_number text not null,
  payment_method text check (payment_method in ('mpesa_stk','mpesa_paybill','cash','cheque','bank_transfer','bursary','scholarship')),
  amount numeric(12,2) not null,
  mpesa_code text,
  mpesa_phone text,
  mpesa_checkout_id text,
  cheque_number text,
  bank_ref text,
  payment_date timestamptz default now(),
  status text default 'completed' check (status in ('pending','completed','failed','reversed')),
  received_by uuid references users(id),
  notes text,
  receipt_sent boolean default false,
  receipt_pdf_url text,
  created_at timestamptz default now(),
  unique(school_id, receipt_number)
);

-- ─── PAYMENT ALLOCATIONS ──────────────────────────────────────────────────────
create table payment_allocations (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid references payments(id) on delete cascade,
  invoice_id uuid references invoices(id),
  votehead_id uuid references voteheads(id),
  amount numeric(12,2) default 0
);

-- ─── PAYMENT LINKS ────────────────────────────────────────────────────────────
create table payment_links (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  student_id uuid references students(id),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz default (now() + interval '7 days'),
  is_active boolean default true,
  amount_suggested numeric(12,2),
  created_by uuid references users(id),
  created_at timestamptz default now(),
  last_used timestamptz,
  use_count int default 0
);

-- ─── DISCOUNTS ────────────────────────────────────────────────────────────────
create table discounts (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  student_id uuid references students(id),
  invoice_id uuid references invoices(id),
  type text check (type in ('sibling','early_payment','bursary','scholarship','staff_child','custom')),
  name text,
  percentage numeric(5,2),
  fixed_amount numeric(12,2),
  applied_amount numeric(12,2) default 0,
  approved_by uuid references users(id),
  notes text,
  created_at timestamptz default now()
);

-- ─── INSTALMENT PLANS ─────────────────────────────────────────────────────────
create table instalment_plans (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  student_id uuid references students(id),
  invoice_id uuid references invoices(id),
  total_amount numeric(12,2),
  paid_amount numeric(12,2) default 0,
  status text default 'active' check (status in ('active','completed','defaulted','cancelled')),
  approved_by uuid references users(id),
  notes text,
  created_at timestamptz default now()
);

create table instalment_schedule (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid references instalment_plans(id) on delete cascade,
  due_date date,
  amount numeric(12,2),
  paid_amount numeric(12,2) default 0,
  is_paid boolean default false,
  payment_id uuid references payments(id),
  reminder_sent boolean default false
);

-- ─── EXPENSE CATEGORIES ───────────────────────────────────────────────────────
create table expense_categories (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  budget_per_term numeric(12,2),
  is_active boolean default true
);

-- ─── EXPENSES ─────────────────────────────────────────────────────────────────
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  term_id uuid references terms(id),
  category_id uuid references expense_categories(id),
  description text not null,
  amount numeric(12,2) not null,
  vendor text,
  payment_method text check (payment_method in ('cash','cheque','bank_transfer','mpesa')),
  payment_ref text,
  payment_date date,
  status text default 'pending_approval' check (status in ('pending_approval','approved','paid','rejected')),
  approved_by uuid references users(id),
  voucher_number text,
  receipt_url text,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- ─── PETTY CASH ───────────────────────────────────────────────────────────────
create table petty_cash (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  imprest_holder text,
  amount_given numeric(12,2),
  amount_accounted numeric(12,2) default 0,
  given_date date,
  accounted_date date,
  status text default 'open' check (status in ('open','accounted','overdue')),
  notes text
);

-- ─── SMS LOGS ─────────────────────────────────────────────────────────────────
create table sms_logs (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade,
  recipient_phone text,
  recipient_name text,
  message text,
  type text check (type in ('receipt','reminder','balance','general','instalment_due')),
  status text default 'pending' check (status in ('sent','failed','pending')),
  cost numeric(8,4),
  sent_at timestamptz default now()
);

-- ─── AUDIT LOG ────────────────────────────────────────────────────────────────
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id),
  user_id uuid references users(id),
  user_name text,
  action text,
  entity_type text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table schools enable row level security;
alter table users enable row level security;
alter table grades enable row level security;
alter table streams enable row level security;
alter table students enable row level security;
alter table guardians enable row level security;
alter table families enable row level security;
alter table student_guardians enable row level security;
alter table terms enable row level security;
alter table academic_years enable row level security;
alter table voteheads enable row level security;
alter table fee_structures enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table payments enable row level security;
alter table payment_allocations enable row level security;
alter table payment_links enable row level security;
alter table discounts enable row level security;
alter table instalment_plans enable row level security;
alter table instalment_schedule enable row level security;
alter table expense_categories enable row level security;
alter table expenses enable row level security;
alter table petty_cash enable row level security;
alter table sms_logs enable row level security;
alter table audit_logs enable row level security;

-- Super admin sees everything
create policy "super_admin_all" on schools for all using (
  exists (select 1 from users where id = auth.uid() and role = 'super_admin')
);

-- School staff see only their school's data
create policy "school_staff_own_school" on students for all using (
  school_id in (select school_id from users where id = auth.uid())
);
create policy "school_staff_invoices" on invoices for all using (
  school_id in (select school_id from users where id = auth.uid())
);
create policy "school_staff_payments" on payments for all using (
  school_id in (select school_id from users where id = auth.uid())
);
create policy "school_staff_expenses" on expenses for all using (
  school_id in (select school_id from users where id = auth.uid())
);

-- Parents see only their children's data via payment_links token
create policy "payment_links_public_read" on payment_links for select using (
  is_active = true and expires_at > now()
);

-- ============================================================
-- EDGE FUNCTION: Daraja STK Callback (deploy separately)
-- ============================================================
-- This runs as a Supabase Edge Function at:
-- /functions/v1/daraja-callback
-- 
-- It receives Safaricom's callback POST, verifies the payment,
-- finds the student by checkout_request_id or payment link token,
-- inserts into payments, updates invoice paid_amount & status,
-- generates a PDF receipt, and sends an SMS.
--
-- See /supabase/functions/daraja-callback/index.ts in the repo.

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Student ledger view
create or replace view student_ledger as
select
  s.id as student_id,
  s.full_name,
  s.admission_number,
  s.school_id,
  g.name as grade_name,
  t.name as term_name,
  t.id as term_id,
  i.invoice_number,
  i.net_amount,
  i.paid_amount,
  i.balance,
  i.status,
  i.due_date
from students s
join grades g on g.id = s.grade_id
join invoices i on i.student_id = s.id
join terms t on t.id = i.term_id
order by s.full_name, t.term_number;

-- Term collection summary view
create or replace view term_collection_summary as
select
  i.school_id,
  i.term_id,
  t.name as term_name,
  count(distinct i.student_id) as total_students,
  sum(i.net_amount) as total_expected,
  sum(i.paid_amount) as total_collected,
  sum(i.balance) as total_outstanding,
  count(case when i.status = 'paid' then 1 end) as paid_in_full,
  count(case when i.status = 'partial' then 1 end) as partial_payers,
  count(case when i.status = 'unpaid' then 1 end) as defaulters,
  round(sum(i.paid_amount) / nullif(sum(i.net_amount),0) * 100, 1) as collection_rate
from invoices i
join terms t on t.id = i.term_id
group by i.school_id, i.term_id, t.name;

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index idx_students_school on students(school_id);
create index idx_students_grade on students(grade_id);
create index idx_invoices_student on invoices(student_id);
create index idx_invoices_term on invoices(term_id);
create index idx_invoices_school_status on invoices(school_id, status);
create index idx_payments_student on payments(student_id);
create index idx_payments_school on payments(school_id);
create index idx_payments_mpesa_code on payments(mpesa_code);
create index idx_payment_links_token on payment_links(token);
create index idx_expenses_school_term on expenses(school_id, term_id);
create index idx_audit_logs_school on audit_logs(school_id);
