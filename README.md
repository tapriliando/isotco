# Astra Isuzu TCO Calculator

Total Cost of Ownership Calculator for Product and Service of Astra Isuzu dealership.

## Tech Stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Getting Started

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run provision:users` - Provision internal Supabase users from username list

## Internal Username Login

The app login form accepts `username + password` and maps it internally to this email pattern:

- `${username}@internal.local` (default)
- Override domain with `VITE_INTERNAL_AUTH_DOMAIN` in frontend and `INTERNAL_AUTH_DOMAIN` in provisioning script if needed.

### Provision 100+ users (admin only)

1. Copy `scripts/usernames.txt.example` to `scripts/usernames.txt`
2. Put one username per line.
3. Run:

```sh
SUPABASE_URL=your-project-url \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
USERNAMES_FILE=scripts/usernames.txt \
npm run provision:users
```

The script auto-confirms email and prints generated username/password pairs in a table.
