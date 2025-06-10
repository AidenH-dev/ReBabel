# Contributing to ReBabel

## Welcome Contributors!

Welcome to the ReBabel contributor community! This project combines modern web technologies with AI to create an adaptive Japanese language learning platform, and we're excited to collaborate with developers who share our vision. Every contribution, from bug fixes to new features, helps make Japanese language learning more accessible and engaging.

## Getting Started

See READ.ME for detailed installation setup


## Code Guidelines

### File Naming & Structure

- Use **kebab-case** for component files (`progress-bar.js`, `report-issue.js`, `landing-page/`)
- Use **camelCase** for variables and functions
- Organize related components in folders (`landing-page/`, `grammar/`, `vocabulary/`)
- API routes follow descriptive patterns (`fetch-vocabulary.js`, `upload-user-set.js`)

### Styling Guidelines

Use **Tailwind CSS** with our established color palette:
- **Primary colors:** `bg-[#da1c60]`, `bg-[#E30B5C]`, `bg-[#B0104F]`
- **Dark backgrounds:** `bg-[#141f25]`, `bg-[#1c2b35]`, `bg-[#404f7d]`
- **Gradients:** `from-[#404f7d] to-blue-600`, `from-cyan-500 to-blue-500`

Additional styling rules:
- Use responsive breakpoints consistently (`sm:`, `md:`, `lg:`, `xl:`)
- Prefer Tailwind utilities over custom CSS
- Use semantic color classes for states (green for success, red for errors)

### React Component Patterns

- Use functional components with hooks throughout
- Large feature components are acceptable (vocabulary management, translation interfaces)
- Implement consistent loading states using `TbLoader3` spinner icon
- Use `useRef` for form inputs and DOM manipulation
- Handle authentication with Auth0's `withPageAuthRequired` wrapper

### API Development

- Follow existing patterns for OpenAI integration (assistants API with polling)
- Include comprehensive error handling with try/catch blocks
- Use consistent response formats: `{ message: data }` or `{ error: message }`
- Implement request validation (check for required fields)
- Handle different HTTP methods explicitly

### State Management

- Use React's built-in `useState` and `useEffect`
- Store complex form data in component state
- Use router query parameters for sharing data between pages
- Handle Auth0 user profile fetching consistently

### Import Patterns
- Import icons from react-icons with descriptive prefixes (`Tb`, `Fa`, `Fi`)
- Use Next.js built-ins (`Head`, `Link`, `Image`, `Script`)
- Import utilities and components with relative paths

### Commit Messages

Use descriptive formats:

feat: add vocabulary set creation functionality
fix: resolve OpenAI API timeout in translation
style: improve mobile layout for notecards
docs: update environment setup instructions

### Environment Setup

- Include all required API keys (OpenAI, Auth0, Supabase)
- Test with actual API calls to ensure integration works
- Verify responsive design across different screen sizes
- Check authentication flow in development environment

## Making Changes

## Making Changes

### Before You Start
- Check existing [issues](https://github.com/yourusername/rebabel/issues) to see if your idea is already being discussed
- For major features, open an issue first to discuss the approach
- Fork the repository and create a new branch from `main`

### Branch Naming
Use descriptive branch names:

feature/vocabulary-import-system
fix/translation-api-timeout
docs/contributing-guidelines
style/mobile-responsiveness

### Development Workflow
1. **Create a feature branch:** `git checkout -b feature/your-feature-name`
2. **Make your changes** following our code guidelines
3. **Test your changes:**
   - Verify the app runs without errors
   - Test new features with sample data
   - Check responsive design on different screen sizes
   - Ensure API integrations work properly
4. **Commit your changes** using our commit message format
5. **Push to your fork:** `git push origin feature/your-feature-name`

### Testing Your Changes
- **Grammar/Translation features:** Test with actual OpenAI API calls
- **Vocabulary features:** Verify import/export functionality works
- **UI changes:** Check both light and dark mode compatibility
- **Authentication:** Ensure Auth0 flow works in development
- **Database changes:** Test with sample Supabase data

### Common Development Tasks
- **Adding new vocabulary lessons:** Update vocabulary JSON files in `/public/data/`
- **Modifying AI prompts:** Test thoroughly to ensure response quality
- **UI improvements:** Follow existing Tailwind patterns and color scheme
- **API endpoints:** Include proper error handling and validation

### Before Submitting
- [ ] Code follows our style guidelines
- [ ] Changes work in development environment
- [ ] No console errors or warnings
- [ ] Responsive design maintained
- [ ] API keys and sensitive data not committed

