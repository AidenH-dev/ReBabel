import '@/styles/globals.css'; // Your Tailwind CSS file
import { Fredoka } from '@next/font/google';

const fredoka = Fredoka({
  subsets: ['latin'], // Specify character subsets
  weight: ['400', '500', '600', '700'], // Choose the weights you need
});

export default function MyApp({ Component, pageProps }) {
  return (
    <div className={fredoka.className}>
      <Component {...pageProps} />
    </div>
  );
}