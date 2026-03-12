import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

const DEFAULT_DESC = 'Piklab — Yeni nesil kurumsal medya ve prodüksiyon ajansı. Video prodüksiyon, grafik tasarım, sosyal medya yönetimi ve AI entegrasyonları.';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200';

export const SEO = ({ title, description = DEFAULT_DESC, image = DEFAULT_IMAGE, url }: SEOProps) => {
  useEffect(() => {
    // Title
    document.title = `${title} | Piklab`;

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard meta
    setMeta('description', description);
    setMeta('robots', 'index, follow');

    // Open Graph
    setMeta('og:type', 'website', true);
    setMeta('og:title', `${title} | Piklab`, true);
    setMeta('og:description', description, true);
    setMeta('og:image', image, true);
    if (url) setMeta('og:url', url, true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', `${title} | Piklab`);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    if (url) canonical.setAttribute('href', url);
  }, [title, description, image, url]);

  return null;
};

export default SEO;
