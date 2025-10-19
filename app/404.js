
'use client';

import Link from 'next/link';
import Layout from '@/components/Layout';
import styles from './NotFound.module.css';

export default function Custom404() {
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Animated Icon */}
          <div className={styles.icon}>
            <div className={styles.searchIcon}>🔍</div>
            <div className={styles.glow}></div>
          </div>

          {/* Title */}
          <h1 className={styles.title}>
            404
            <span className={styles.subtitle}>Page Not Found</span>
          </h1>

          {/* Description */}
          <p className={styles.description}>
            Oops! The page you're looking for doesn't exist. 
            It might have been moved, deleted, or you typed the wrong URL.
          </p>

          {/* Action Buttons */}
          <div className={styles.actions}>
            <Link href="/" className={styles.btnPrimary}>
              🏠 Go Home
            </Link>
            <Link href="/products" className={styles.btnSecondary}>
              📦 Browse Products
            </Link>
            <button 
              onClick={() => window.history.back()} 
              className={styles.btnTertiary}
            >
              ↩️ Go Back
            </button>
          </div>

          {/* Search */}
          <div className={styles.searchSection}>
            <p className={styles.searchLabel}>Or try searching:</p>
            <form action="/products" method="GET" className={styles.searchForm}>
              <input
                type="text"
                name="search"
                placeholder="Search laptops, gaming, business..."
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchBtn}>
                🔍
              </button>
            </form>
          </div>

          {/* Fun Stats */}
          <div className={styles.stats}>
            <span>🚀 99.9% pages found</span>
            <span>📊 This is page #{Math.floor(Math.random() * 1000)}</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}