import '../ui/styles/base.css';
import '../ui/styles/hud.css';
import '../ui/styles/modal.css';
import '../ui/styles/story.css';
import '../ui/styles/journal.css';
import '../ui/styles/admin.css';
import './game.css';
import { assetPath } from '../config/assetPath.ts';

export const metadata = {
  title: 'MarsCraft',
  icons: { icon: assetPath('/favicon.svg') },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
