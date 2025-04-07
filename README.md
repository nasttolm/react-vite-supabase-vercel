# 🥗 SafeBites — Web App for Recipe Management & Meal Planning

> Built with the [React Vite Supabase Vercel](https://github.com/juancarlosjr97/react-vite-supabase-vercel) template.

SafeBites is a recipe creation and meal planning web application designed to help users manage their meals, accommodate dietary restrictions, and generate shopping lists. It was developed as a university team project using React, Vite, Supabase, and Vercel.

## 🔗 Demo
[Try SafeBites](https://react-vite-supabase-vercel-nasttolm-gmailcoms-projects.vercel.app/)

## 📦 Key Features
- 🔍 **Recipe search with filters**:
  - dietary tags (vegan, gluten-free, etc.)
  - categories
  - cooking time
  - favourites
  - "My Recipes"
- 🛒 **Shopping list generation** based on meal plans
- ✅ **User authentication** (email/password and Facebook)
- 📆 **Meal planning** with automatic generation
- 🔔 **Notification system** (partially implemented, "Coming Soon" features)
- ❤️ **Favourites system** for saved recipes
- 👤 **User profile** (partially functional; Facebook login bug prevents full access)

## ⚙️ Tech Stack

| Area | Technology |
|------|------------|
| Frontend | React + Vite |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| UI Framework | Tailwind CSS |
| Authentication | Supabase (email/password, Facebook) |
| Deployment | Vercel |

## ✅ Feature Status

### Fully Implemented
- Recipe filtering and search
- Recipe creation and deletion
- Shopping list generation
- Authentication via email/password and Facebook
- Toast-based user feedback system

### Partially Implemented
- Meal plan generator: users can create plans automatically, but cannot manually edit them
- User profile: visible but inaccessible after Facebook login due to redirect bug

### Not Implemented
- Comment system for recipes
- Full notification system
- Social interaction features (sharing, subscriptions)
- Complete user profile functionality

## 🧠 Team Reflections

The project scope was too ambitious. We focused on delivering the core features and postponed optional or advanced ones.

Academic feedback helped refine:
- our problem statement (now backed by references)
- objectives (more specific and measurable)
- methodology structure (linked methods to evaluation)
- requirement specifications (clearer, measurable)
- accessibility documentation (project-specific details)
- technology choices (clear justification for React, Vite, Supabase)

Consistent design and user personas guided our decisions and were positively received.

## 🚀 Future Work

### Authentication
- Fix redirect issue after Facebook login
- Add Google, Apple, and other social login options

### User Interaction
- Add recipe comments and feedback
- Implement subscriptions and recipe privacy controls

### Nutrition & Filtering
- Add allergen detection and warnings
- Support metric/imperial unit switching and conversion
- Add "Exclude Ingredients" filter

### UI/UX Enhancements
- Display ingredient images on recipe and shopping pages
- Improve responsive design and visual polish

### Communication & Notifications
- Complete in-app notification system for meal reminders
- Add a newsletter/email updates feature

### Technical Enhancements
- Refactor codebase to improve structure and reduce repetition

## 🧑‍💻 Getting Started

```bash
git clone https://github.com/nasttolm/react-vite-supabase-vercel.git
cd react-vite-supabase-vercel
npm install
```

Create a `.env` file:

```plaintext
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Run the app:

```shellscript
npm run dev
```

## 📃 License

This project was developed for educational purposes.

## 👥 Team Members

- **Aymene Benmansour** — [BENMANSOURbn](https://github.com/BENMANSOURbn)
- **Shakhzod Sharifov** — [shvkhzod](https://github.com/shvkhzod)
- **Anastasia Tolmacheva** — [nasttolm](https://github.com/nasttolm)

