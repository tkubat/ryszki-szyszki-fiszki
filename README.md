# Ryszki Szyszki Fiszki

An AI-powered flashcard application that helps students learn more efficiently by automatically generating high-quality flashcards from their notes and leveraging the proven SM-2 spaced repetition algorithm.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-22.14.0-brightgreen.svg)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/Astro-5.13.7-FF5D01.svg)](https://astro.build/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB.svg)](https://react.dev/)

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

**Ryszki Szyszki Fiszki** is a web-based educational application designed to eliminate the time-consuming process of manually creating flashcards. The application combines the power of artificial intelligence (GPT-3.5-turbo) with the scientifically proven SM-2 spaced repetition algorithm to help students efficiently learn and retain information long-term.

### The Problem

Students understand the effectiveness of spaced repetition for long-term memorization, but manually creating high-quality educational flashcards is extremely time-consuming. Preparing a flashcard set can take as much or more time than the actual studying, which discourages students from using this effective method.

### The Solution

Ryszki Szyszki Fiszki allows students to:
- **Paste their notes** (50-2000 characters) and generate up to 10 flashcards instantly using AI
- **Manually create** unlimited flashcards when needed
- **Study efficiently** using the SM-2 spaced repetition algorithm
- **Track progress** with intelligent scheduling that adapts to their learning pace

### Key Features

- 🤖 **AI-Powered Generation**: Generate flashcards automatically from text using GPT-3.5-turbo
- 📚 **Spaced Repetition**: SM-2 algorithm ensures optimal review timing
- ✍️ **Manual Creation**: Create unlimited flashcards manually when needed
- 📊 **Flashcard Management**: Edit, delete, and organize your flashcard collection
- 🔐 **Secure Authentication**: User accounts managed by Supabase Auth
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 🌙 **Minimalist Dark Theme**: Clean, distraction-free interface

## Tech Stack

### Frontend
- **[Astro](https://astro.build/)** v5.13.7 - Modern web framework with SSR/SSG capabilities
- **[React](https://react.dev/)** v19.1.1 - UI library for interactive components
- **[TypeScript](https://www.typescriptlang.org/)** v5 - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** v4.1.13 - Utility-first CSS framework

### Backend & Services
- **[Supabase](https://supabase.com/)** - PostgreSQL database, authentication, and edge functions
- **[OpenAI API](https://openai.com/api/)** - GPT-3.5-turbo for flashcard generation

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit validation
- **lint-staged** - Run linters on staged files

### Algorithms
- **SM-2 (SuperMemo 2)** - Spaced repetition algorithm for optimal learning

## Getting Started Locally

You can run this project either with Docker (recommended) or directly on your local machine.

### Option 1: Using Docker (Recommended)

This is the easiest way to get started as it includes everything you need, including Supabase.

#### Prerequisites

- **Docker Desktop** installed and running
- **OpenAI API key** (for AI flashcard generation)

#### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd ryszki-szyszki-fiszki
```

2. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (will be auto-configured by Supabase local)
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

You can also copy from the example file:

```bash
cp .env.example .env
```

3. **Build and start the Docker container**

```bash
docker-compose up --build
```

This will:
- Build the Docker image with Node.js and Supabase CLI
- Start Supabase locally inside the container
- Start the Astro development server

4. **Initialize Supabase (first time only)**

Once the container is running, in a new terminal, execute:

```bash
docker exec -it ryszki-szyszki-fiszki-dev supabase start
```

After Supabase starts, you'll see output with your credentials:

```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
anon key: eyJh...
service_role key: eyJh...
```

Copy the `anon key` and `service_role key` to your `.env` file.

5. **Access the application**

- **Application**: http://localhost:4321
- **Supabase Studio**: http://localhost:54323 (database management UI)
- **Email Testing**: http://localhost:54324 (view test emails)

6. **Apply database migrations**

Run the seed script to create the required tables:

```bash
docker exec -it ryszki-szyszki-fiszki-dev supabase db reset
```

#### Useful Docker Commands

```bash
# Stop the container
docker-compose down

# View logs
docker-compose logs -f

# Restart the container
docker-compose restart

# Access container shell
docker exec -it ryszki-szyszki-fiszki-dev /bin/bash

# Stop and remove everything (including volumes)
docker-compose down -v
```

### Option 2: Local Installation (Without Docker)

#### Prerequisites

- **Node.js** v22.14.0 (specified in `.nvmrc`)
- **npm** (comes with Node.js)
- **Docker Desktop** (required for Supabase local development)
- **OpenAI API key** (for AI flashcard generation)

#### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd ryszki-szyszki-fiszki
```

2. **Install Node.js version**

Using [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm use
```

Or manually install Node.js v22.14.0 from [nodejs.org](https://nodejs.org/)

3. **Install dependencies**

```bash
npm install
```

4. **Install Supabase CLI**

```bash
npm install -g supabase
```

5. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

6. **Start Supabase locally**

```bash
supabase start
```

This will start Supabase services in Docker containers. Copy the `anon key` and `service_role key` from the output to your `.env` file.

7. **Set up Supabase database**

Run the database migrations to create the required tables:
- `users` - User accounts and AI flashcard limits
- `flashcards` - Flashcard data with front/back content
- `study_sessions` - Study session tracking
- `study_reviews` - Individual flashcard reviews with SM-2 parameters
- `ai_generations` - AI generation history and analytics

```bash
supabase db reset
```

8. **Start the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server with hot-reloading |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check for code issues |
| `npm run lint:fix` | Automatically fix ESLint issues |
| `npm run format` | Format code using Prettier |

## Project Scope

### MVP Features (Included)

#### 1. Authentication Module (AUTH)
- User registration with email and password
- Login and logout functionality
- Password reset via email
- Account deletion (GDPR compliant)
- No email verification required in MVP

#### 2. AI Flashcard Generation (AI-GEN)
- Text input form (50-2000 characters)
- Generate 1-10 flashcards per request
- Monthly limit: 100 AI-generated flashcards per user
- Automatic validation and regeneration of invalid flashcards
- Review and edit generated flashcards before saving
- Accept/reject individual flashcards
- Quality rating system (thumbs up/down)

#### 3. Manual Flashcard Creation (MANUAL)
- Create unlimited flashcards manually
- Front: max 100 characters
- Back: max 500 characters
- Immediate saving without review screen

#### 4. Flashcard Management (CARDS)
- View all flashcards in a list
- Edit flashcard content
- Delete flashcards
- See source (AI or manual)
- View next review date

#### 5. Study Sessions (STUDY)
- SM-2 spaced repetition algorithm
- Three difficulty ratings: Easy, Medium, Hard
- Progress tracking during session
- Session summary with statistics
- Ability to pause/resume sessions
- Newly created flashcards immediately available

#### 6. Landing Page (LANDING)
- Product value proposition
- Feature highlights
- Login and registration CTAs
- Minimalist dark theme design

### MVP Limitations (Excluded)

- ❌ Advanced repetition algorithms (only standard SM-2)
- ❌ File imports (PDF, DOCX, OCR)
- ❌ Flashcard sharing and social features
- ❌ External integrations (Notion, Evernote, Moodle)
- ❌ Native mobile apps (web-only, responsive)
- ❌ Decks/tags/categories organization
- ❌ Advanced statistics and gamification
- ❌ Interactive onboarding tutorial
- ❌ Social authentication (Google, Facebook)
- ❌ Two-factor authentication (2FA)
- ❌ Multimedia flashcards (images, audio)

### Technical Constraints

- **AI Limits**: 100 flashcards/month per user, max 2000 chars input, max 10 cards per generation
- **Flashcard Limits**: 100 chars front, 500 chars back
- **Model**: GPT-3.5-turbo (not GPT-4)
- **Algorithm**: Standard SM-2 with 3-point difficulty scale (not 5-point)
- **Offline Mode**: Not supported (requires internet connection)
- **Browser Support**: Chrome, Firefox, Safari, Edge (last 2 versions)

## Project Status

🚧 **MVP in Development**

This project is currently in active development with an estimated MVP completion timeline of 1 week (developed 100% with AI assistance).

### Success Metrics

The MVP will be considered successful after 4 weeks from deployment if:

1. **AI Acceptance Rate**: ≥75% of generated flashcards are accepted by users
2. **AI Utilization**: ≥75% of all flashcards are created via AI
3. **30-Day Retention**: ≥30% of users return after 30 days
4. **Daily Active Users (DAU)**: Shows upward trend
5. **Error Rate**: <2% technical failures

### Roadmap

- [x] Project setup and tech stack configuration
- [ ] Supabase database schema and migrations
- [ ] User authentication implementation
- [ ] AI flashcard generation with OpenAI integration
- [ ] Manual flashcard creation
- [ ] Flashcard management (CRUD operations)
- [ ] SM-2 algorithm implementation
- [ ] Study session interface
- [ ] Landing page and navigation
- [ ] Responsive design optimization
- [ ] Testing and bug fixes
- [ ] Deployment to production

## License

MIT © 2026

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This application is designed for educational purposes. The AI-generated flashcards should be reviewed and verified by users to ensure accuracy and relevance to their learning materials.
