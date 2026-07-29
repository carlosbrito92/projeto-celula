import styles from './ComingSoon.module.css';

export function ComingSoon({ titulo }: { titulo: string }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.titulo}>{titulo}</div>
      <div className={styles.legenda}>Em breve.</div>
    </div>
  );
}
