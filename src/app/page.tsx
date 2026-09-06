import { CatalogSection } from "@/components/home/catalog-section";
import { CtaSection } from "@/components/home/cta-section";
import { HeroSection } from "@/components/home/hero-section";
import { PrinciplesSection } from "@/components/home/principles-section";
import { RealWorldSection } from "@/components/home/real-world-section";
import { PlatformSection } from "@/components/home/platform-section";
import { StorySection } from "@/components/home/story-section";
import { HowItWorks } from "@/components/how-it-works";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StructuredData } from "@/components/structured-data";
import { products, siteConfig } from "@/content/site";

export default function Home() {
  const product = products[0];

  return (
    <>
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: siteConfig.name,
            url: siteConfig.url,
            description: siteConfig.description,
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: siteConfig.name,
            url: siteConfig.url,
            description: siteConfig.description,
          },
        ]}
      />
      <SiteHeader />
      <main>
        <HeroSection product={product} />
        <PrinciplesSection product={product} />
        <HowItWorks product={product} />
        <RealWorldSection />
        <StorySection />
        <PlatformSection product={product} />
        <CatalogSection product={product} />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
