import './styles/main.css';
import { Router } from './components/Router';
import { renderInboxPage } from './pages/InboxPage';
import { renderSourcePage } from './pages/SourcePage';
import { renderClaimsPage } from './pages/ClaimsPage';
import { renderTopicsPage } from './pages/TopicsPage';
import { renderStudioPage } from './pages/StudioPage';

const router = new Router();

router
  .add('/', renderInboxPage.bind(null, router))
  .add('/source/:id', (params) => renderSourcePage(router, params.id))
  .add('/claims', renderClaimsPage.bind(null, router))
  .add('/topics', renderTopicsPage.bind(null, router))
  .add('/studio', renderStudioPage.bind(null, router));

// Global navigation helper
(window as any).navigate = (path: string) => router.navigate(path);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelector('.modal-overlay')?.remove();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    const modal = document.querySelector('.modal-overlay');
    if (!modal) {
      // Could open command palette
    }
  }
});

router.start();

console.log('Wise frontend initialized');