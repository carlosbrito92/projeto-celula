import type { ReactNode } from 'react';
import { Link, useRouter } from '../router/Router';
import styles from './AppShell.module.css';

const TABS = [
  { to: '/', label: 'Pregações', shape: 'square' },
  { to: '/quebra-gelos', label: 'Quebra-gelos', shape: 'circle' },
  { to: '/utilitarios', label: 'Utilitários', shape: 'diamond' },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { path } = useRouter();

  return (
    <div className={styles.shell}>
      {children}
      <nav className={styles.tabBar}>
        {TABS.map((tab) => {
          const active = tab.to === '/' ? path === '/' : path.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            >
              <span className={`${styles.icon} ${styles[tab.shape]}`} aria-hidden="true" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
