import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { HeroSlider } from "@/components/site/HeroSlider";
import { Products } from "@/components/site/Products";
import { NewModels } from "@/components/site/NewModels";
import { WhyUs } from "@/components/site/WhyUs";
import { Footer } from "@/components/site/Footer";
import { NotificationBanner } from "@/components/site/NotificationBanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "پارس گلس | فروش عمده گلس و محافظ صفحه گوشی" },
      {
        name: "description",
        content:
          "پارس گلس - عرضه‌کننده‌ی تخصصی گلس و محافظ صفحه گوشی موبایل به صورت عمده با بهترین کیفیت و قیمت برای همکاران سراسر کشور.",
      },
      { property: "og:title", content: "پارس گلس | فروش عمده گلس موبایل" },
      {
        property: "og:description",
        content: "فروش عمده گلس معمولی، مات، پرایوسی، نانو و محافظ لنز.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen">
      <Navbar cartCount={0} />
      <NotificationBanner />
      <main className="pb-6">
        <HeroSlider />
        <Products />
        <NewModels />
        <WhyUs />
      </main>
      <Footer />
    </div>
  );
}
