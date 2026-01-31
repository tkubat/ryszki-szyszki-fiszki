-- migration: initial schema for ryszki-szyszki-fiszki
-- description: creates all tables, indexes, functions, triggers, and rls policies
-- tables affected: profiles, flashcards, ai_generations, study_sessions, study_reviews
-- author: database migration
-- date: 2026-01-31

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 profiles table
-- ----------------------------------------------------------------------------
-- stores user profile data, linked 1:1 with auth.users
-- tracks ai flashcard usage and monthly limit resets
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    ai_flashcards_used integer not null default 0,
    limit_reset_date date not null default (date_trunc('month', current_date) + interval '1 month')::date,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    constraint chk_profiles_ai_limit check (ai_flashcards_used >= 0 and ai_flashcards_used <= 100)
);

comment on table public.profiles is 'user profiles with ai flashcard usage tracking';
comment on column public.profiles.id is 'user id, foreign key to auth.users';
comment on column public.profiles.ai_flashcards_used is 'number of ai flashcards used in current month (0-100)';
comment on column public.profiles.limit_reset_date is 'date when ai flashcard limit resets';

-- ----------------------------------------------------------------------------
-- 1.2 ai_generations table
-- ----------------------------------------------------------------------------
-- stores metadata about ai flashcard generation sessions
-- used for analytics and debugging
create table public.ai_generations (
    id bigserial primary key,
    user_id uuid not null references public.profiles(id) on delete cascade,
    source_text varchar(2000) not null,
    requested_count integer not null,
    generated_count integer not null default 0,
    accepted_count integer not null default 0,
    generation_time_ms integer,
    model_used varchar(100),
    prompt_version varchar(50),
    error_message text,
    created_at timestamptz not null default now(),
    
    constraint chk_ai_generations_source_length check (length(source_text) >= 50 and length(source_text) <= 2000),
    constraint chk_ai_generations_requested check (requested_count >= 1 and requested_count <= 10),
    constraint chk_ai_generations_counts check (
        generated_count >= 0 and 
        accepted_count >= 0 and 
        accepted_count <= generated_count
    ),
    constraint chk_ai_generations_time check (generation_time_ms is null or generation_time_ms >= 0)
);

comment on table public.ai_generations is 'ai flashcard generation session metadata';
comment on column public.ai_generations.source_text is 'source text used for generation (50-2000 chars)';
comment on column public.ai_generations.requested_count is 'number of flashcards requested (1-10)';
comment on column public.ai_generations.generated_count is 'number of flashcards actually generated';
comment on column public.ai_generations.accepted_count is 'number of flashcards accepted by user';

-- ----------------------------------------------------------------------------
-- 1.3 flashcards table
-- ----------------------------------------------------------------------------
-- stores all flashcards (both ai-generated and manually created)
-- includes sm-2 algorithm parameters for spaced repetition
create table public.flashcards (
    id bigserial primary key,
    user_id uuid not null references public.profiles(id) on delete cascade,
    front varchar(100) not null,
    back varchar(500) not null,
    source text not null,
    ai_generation_id bigint references public.ai_generations(id) on delete set null,
    ai_quality_rating smallint,
    easiness_factor decimal(3,2) not null default 2.50,
    repetitions integer not null default 0,
    interval_days integer not null default 0,
    next_review_date date not null default current_date,
    last_reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    
    constraint chk_flashcards_front_length check (length(front) >= 1 and length(front) <= 100),
    constraint chk_flashcards_back_length check (length(back) >= 1 and length(back) <= 500),
    constraint chk_flashcards_source_valid check (source in ('ai', 'manual')),
    constraint chk_flashcards_source_consistency check (
        (source = 'ai' and ai_generation_id is not null) or 
        (source = 'manual' and ai_generation_id is null)
    ),
    constraint chk_flashcards_ai_rating check (ai_quality_rating in (-1, 1) or ai_quality_rating is null),
    constraint chk_flashcards_easiness_factor check (easiness_factor >= 1.30 and easiness_factor <= 2.50),
    constraint chk_flashcards_repetitions check (repetitions >= 0),
    constraint chk_flashcards_interval check (interval_days >= 0)
);

comment on table public.flashcards is 'flashcards with sm-2 spaced repetition data';
comment on column public.flashcards.front is 'front of flashcard (question, 1-100 chars)';
comment on column public.flashcards.back is 'back of flashcard (answer, 1-500 chars)';
comment on column public.flashcards.source is 'flashcard source: ai or manual';
comment on column public.flashcards.ai_quality_rating is 'user quality rating: -1 (thumbs down), 1 (thumbs up), null (no rating)';
comment on column public.flashcards.easiness_factor is 'sm-2 easiness factor (1.30-2.50)';
comment on column public.flashcards.repetitions is 'sm-2 successful repetitions count';
comment on column public.flashcards.interval_days is 'sm-2 interval to next review in days';
comment on column public.flashcards.next_review_date is 'date of next scheduled review';

-- ----------------------------------------------------------------------------
-- 1.4 study_sessions table
-- ----------------------------------------------------------------------------
-- stores information about user study sessions
-- tracks completion and difficulty ratings
create table public.study_sessions (
    id bigserial primary key,
    user_id uuid not null references public.profiles(id) on delete cascade,
    started_at timestamptz not null default now(),
    ended_at timestamptz,
    completed boolean not null default false,
    cards_scheduled integer not null default 0,
    cards_reviewed integer not null default 0,
    cards_easy integer not null default 0,
    cards_medium integer not null default 0,
    cards_hard integer not null default 0,
    
    constraint chk_study_sessions_end_after_start check (ended_at is null or ended_at >= started_at),
    constraint chk_study_sessions_reviewed_count check (cards_reviewed <= cards_scheduled),
    constraint chk_study_sessions_difficulty_sum check (
        cards_easy + cards_medium + cards_hard = cards_reviewed
    ),
    constraint chk_study_sessions_counts check (
        cards_scheduled >= 0 and 
        cards_reviewed >= 0 and 
        cards_easy >= 0 and 
        cards_medium >= 0 and 
        cards_hard >= 0
    )
);

comment on table public.study_sessions is 'user study session tracking';
comment on column public.study_sessions.completed is 'whether session was completed (true) or interrupted (false)';
comment on column public.study_sessions.cards_scheduled is 'number of cards scheduled for review in this session';
comment on column public.study_sessions.cards_reviewed is 'number of cards actually reviewed';
comment on column public.study_sessions.cards_easy is 'number of cards rated as easy (1)';
comment on column public.study_sessions.cards_medium is 'number of cards rated as medium (2)';
comment on column public.study_sessions.cards_hard is 'number of cards rated as hard (3)';

-- ----------------------------------------------------------------------------
-- 1.5 study_reviews table
-- ----------------------------------------------------------------------------
-- stores history of individual flashcard reviews
-- used for sm-2 algorithm and analytics
create table public.study_reviews (
    id bigserial primary key,
    flashcard_id bigint not null references public.flashcards(id) on delete cascade,
    study_session_id bigint not null references public.study_sessions(id) on delete cascade,
    difficulty_rating smallint not null,
    previous_ef decimal(3,2) not null,
    new_ef decimal(3,2) not null,
    previous_interval integer not null,
    new_interval integer not null,
    reviewed_at timestamptz not null default now(),
    
    constraint chk_study_reviews_difficulty check (difficulty_rating between 1 and 3),
    constraint chk_study_reviews_ef check (
        previous_ef >= 1.30 and previous_ef <= 2.50 and
        new_ef >= 1.30 and new_ef <= 2.50
    ),
    constraint chk_study_reviews_interval check (
        previous_interval >= 0 and new_interval >= 0
    )
);

comment on table public.study_reviews is 'individual flashcard review history';
comment on column public.study_reviews.difficulty_rating is 'difficulty rating: 1 (easy), 2 (medium), 3 (hard)';
comment on column public.study_reviews.previous_ef is 'previous sm-2 easiness factor';
comment on column public.study_reviews.new_ef is 'new sm-2 easiness factor after update';
comment on column public.study_reviews.previous_interval is 'previous interval in days';
comment on column public.study_reviews.new_interval is 'new interval in days after update';

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

-- most critical index: queries for flashcards due for review
-- covers the main app functionality of fetching cards to study
create index idx_flashcards_user_next_review 
on public.flashcards(user_id, next_review_date);

-- listing user's flashcards (chronological sorting)
-- used for displaying all flashcards in user's collection
create index idx_flashcards_user_created 
on public.flashcards(user_id, created_at desc);

-- user study session history
-- used for displaying session history and analytics
create index idx_study_sessions_user 
on public.study_sessions(user_id, started_at desc);

-- ai generation analytics
-- used for tracking ai usage and quality metrics
create index idx_ai_generations_user 
on public.ai_generations(user_id, created_at desc);

-- single flashcard review history
-- used for displaying progress of individual cards
create index idx_study_reviews_flashcard_history 
on public.study_reviews(flashcard_id, reviewed_at desc);

-- fetching reviews from a session
-- used for session detail views
create index idx_study_reviews_session 
on public.study_reviews(study_session_id);

-- ============================================================================
-- 3. FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 create profile for new user
-- ----------------------------------------------------------------------------
-- automatically creates a profile when a new user signs up via auth
-- security definer allows bypassing rls insert policy on profiles
create or replace function public.create_profile_for_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
    insert into public.profiles (id, ai_flashcards_used, limit_reset_date)
    values (
        new.id,
        0,
        (date_trunc('month', current_date) + interval '1 month')::date
    );
    return new;
end;
$$;

comment on function public.create_profile_for_user() is 'trigger function to create profile for new auth user';

-- trigger to automatically create profile after user signup
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.create_profile_for_user();

-- ----------------------------------------------------------------------------
-- 3.2 check and reset ai limit
-- ----------------------------------------------------------------------------
-- checks if ai flashcard limit needs to be reset (monthly)
-- resets the counter if reset_date has passed
-- returns remaining limit (100 - used)
create or replace function public.check_and_reset_ai_limit(p_user_id uuid)
returns table(remaining_limit integer)
security definer
set search_path = public
language plpgsql
as $$
declare
    v_current_used integer;
    v_reset_date date;
    v_needs_reset boolean;
begin
    -- fetch current user data
    select ai_flashcards_used, limit_reset_date
    into v_current_used, v_reset_date
    from public.profiles
    where id = p_user_id;

    -- check if reset is needed
    v_needs_reset := v_reset_date < current_date;

    -- if yes, reset the limit
    if v_needs_reset then
        update public.profiles
        set 
            ai_flashcards_used = 0,
            limit_reset_date = (date_trunc('month', current_date) + interval '1 month')::date,
            updated_at = now()
        where id = p_user_id;
        
        v_current_used := 0;
    end if;

    -- return remaining limit
    return query select (100 - v_current_used)::integer;
end;
$$;

comment on function public.check_and_reset_ai_limit(uuid) is 'checks and resets monthly ai flashcard limit, returns remaining limit';

-- ----------------------------------------------------------------------------
-- 3.3 delete user account (gdpr compliance)
-- ----------------------------------------------------------------------------
-- deletes the authenticated user's account and all associated data
-- cascade delete will remove all related data (flashcards, sessions, etc)
-- fulfills right to be forgotten under gdpr
create or replace function public.delete_user_account()
returns void
security definer
set search_path = public
language plpgsql
as $$
declare
    v_user_id uuid;
begin
    -- get authenticated user id
    v_user_id := auth.uid();
    
    if v_user_id is null then
        raise exception 'user not authenticated';
    end if;

    -- delete user from auth.users
    -- cascade delete will handle all related data in public schema
    delete from auth.users where id = v_user_id;
end;
$$;

comment on function public.delete_user_account() is 'deletes authenticated user account and all data (gdpr compliance)';

-- ----------------------------------------------------------------------------
-- 3.4 increment ai flashcards used counter
-- ----------------------------------------------------------------------------
-- increments the ai flashcard usage counter by specified count
-- called after user accepts ai-generated flashcards
-- returns new counter value
create or replace function public.increment_ai_flashcards_used(
    p_user_id uuid,
    p_count integer default 1
)
returns integer
security definer
set search_path = public
language plpgsql
as $$
declare
    v_new_used integer;
begin
    -- update counter
    update public.profiles
    set 
        ai_flashcards_used = ai_flashcards_used + p_count,
        updated_at = now()
    where id = p_user_id
    returning ai_flashcards_used into v_new_used;

    -- return new value
    return v_new_used;
end;
$$;

comment on function public.increment_ai_flashcards_used(uuid, integer) is 'increments ai flashcard usage counter, returns new value';

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- enable rls on all tables
alter table public.profiles enable row level security;
alter table public.flashcards enable row level security;
alter table public.ai_generations enable row level security;
alter table public.study_sessions enable row level security;
alter table public.study_reviews enable row level security;

-- ----------------------------------------------------------------------------
-- 4.1 profiles rls policies
-- ----------------------------------------------------------------------------

-- select: authenticated users can read their own profile
create policy profiles_select_policy_authenticated on public.profiles
    for select
    to authenticated
    using (auth.uid() = id);

-- update: authenticated users can update their own profile
create policy profiles_update_policy_authenticated on public.profiles
    for update
    to authenticated
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- delete: authenticated users can delete their own profile
create policy profiles_delete_policy_authenticated on public.profiles
    for delete
    to authenticated
    using (auth.uid() = id);

-- insert: block direct inserts (only trigger can create profiles)
-- this ensures profiles are only created through the auth trigger
create policy profiles_insert_policy_authenticated on public.profiles
    for insert
    to authenticated
    with check (false);

create policy profiles_insert_policy_anon on public.profiles
    for insert
    to anon
    with check (false);

-- ----------------------------------------------------------------------------
-- 4.2 flashcards rls policies
-- ----------------------------------------------------------------------------

-- select: authenticated users can read their own flashcards
create policy flashcards_select_policy_authenticated on public.flashcards
    for select
    to authenticated
    using (auth.uid() = user_id);

-- insert: authenticated users can create flashcards for themselves
create policy flashcards_insert_policy_authenticated on public.flashcards
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- update: authenticated users can update their own flashcards
create policy flashcards_update_policy_authenticated on public.flashcards
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- delete: authenticated users can delete their own flashcards
create policy flashcards_delete_policy_authenticated on public.flashcards
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4.3 ai_generations rls policies
-- ----------------------------------------------------------------------------

-- select: authenticated users can read their own ai generation records
create policy ai_generations_select_policy_authenticated on public.ai_generations
    for select
    to authenticated
    using (auth.uid() = user_id);

-- insert: authenticated users can create ai generation records for themselves
create policy ai_generations_insert_policy_authenticated on public.ai_generations
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- update: authenticated users can update their own ai generation records
create policy ai_generations_update_policy_authenticated on public.ai_generations
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- delete: authenticated users can delete their own ai generation records
create policy ai_generations_delete_policy_authenticated on public.ai_generations
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4.4 study_sessions rls policies
-- ----------------------------------------------------------------------------

-- select: authenticated users can read their own study sessions
create policy study_sessions_select_policy_authenticated on public.study_sessions
    for select
    to authenticated
    using (auth.uid() = user_id);

-- insert: authenticated users can create study sessions for themselves
create policy study_sessions_insert_policy_authenticated on public.study_sessions
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- update: authenticated users can update their own study sessions
create policy study_sessions_update_policy_authenticated on public.study_sessions
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- delete: authenticated users can delete their own study sessions
create policy study_sessions_delete_policy_authenticated on public.study_sessions
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4.5 study_reviews rls policies
-- ----------------------------------------------------------------------------

-- select: authenticated users can read reviews of their own flashcards
-- uses exists subquery to verify flashcard ownership
create policy study_reviews_select_policy_authenticated on public.study_reviews
    for select
    to authenticated
    using (
        exists (
            select 1 from public.flashcards
            where flashcards.id = study_reviews.flashcard_id
            and flashcards.user_id = auth.uid()
        )
    );

-- insert: authenticated users can create reviews for their own flashcards
-- prevents users from creating reviews for other users' flashcards
create policy study_reviews_insert_policy_authenticated on public.study_reviews
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.flashcards
            where flashcards.id = study_reviews.flashcard_id
            and flashcards.user_id = auth.uid()
        )
    );

-- update: authenticated users can update reviews of their own flashcards
create policy study_reviews_update_policy_authenticated on public.study_reviews
    for update
    to authenticated
    using (
        exists (
            select 1 from public.flashcards
            where flashcards.id = study_reviews.flashcard_id
            and flashcards.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.flashcards
            where flashcards.id = study_reviews.flashcard_id
            and flashcards.user_id = auth.uid()
        )
    );

-- delete: authenticated users can delete reviews of their own flashcards
create policy study_reviews_delete_policy_authenticated on public.study_reviews
    for delete
    to authenticated
    using (
        exists (
            select 1 from public.flashcards
            where flashcards.id = study_reviews.flashcard_id
            and flashcards.user_id = auth.uid()
        )
    );

-- ============================================================================
-- migration complete
-- ============================================================================
