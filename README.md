# Japanese Tutor - AI-Powered Language Learning Platform

A modern web application that helps users learn Japanese through interactive AI-powered tutoring sessions. Built with Next.js and leveraging OpenAI's capabilities, this platform provides personalized language learning experiences.

## Features

- AI-powered Japanese language tutoring
- Progress tracking and analytics
- Secure authentication with Auth0
- Responsive design for all devices
- Interactive learning sessions
- Performance monitoring with Vercel Analytics

## Tech Stack

- **Frontend Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Authentication**: Auth0
- **Database**: Supabase
- **AI Integration**: OpenAI API
- **Form Handling**: Formik + Yup
- **Charts**: Chart.js
- **Analytics**: Vercel Analytics & Speed Insights

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/japanese-tutor.git
cd japanese-tutor
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```env
AUTH0_SECRET='your-auth0-secret'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='your-auth0-domain'
AUTH0_CLIENT_ID='your-auth0-client-id'
AUTH0_CLIENT_SECRET='your-auth0-client-secret'
OPENAI_API_KEY='your-openai-api-key'
NEXT_SUPABASE_URL='your-supabase-url'
NEXT_SUPABASE_ANON_KEY='your-supabase-anon-key'
```

## Running the Application

1. Start the development server:
```bash
npm run dev
# or
yarn dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/          # Next.js app directory
├── components/   # React components
├── lib/         # Utility functions and configurations
├── styles/      # Global styles
└── types/       # TypeScript type definitions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- OpenAI for providing the AI capabilities
- Next.js team for the amazing framework
- Auth0 for authentication services
- Supabase for database services
- All contributors and users of the platform
- All my teachers and mentors who have guided me and fostered my passion for development and Japanese 


## Support

If you encounter any issues or have questions, please open an issue in the GitHub repository.
