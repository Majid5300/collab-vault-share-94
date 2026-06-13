import { ShieldCheck, Truck, Wallet } from "lucide-react";

const items = [
  {
    Icon: ShieldCheck,
    title: "کیفیت تضمینی",
    desc: "تمامی محصولات دارای گارانتی کیفیت هستند",
    hue: "from-sky-500/30 to-indigo-500/30",
  },
  {
    Icon: Truck,
    title: "ارسال سریع",
    desc: "ارسال به سراسر کشور در کمتر از ۴۸ ساعت",
    hue: "from-emerald-500/30 to-cyan-500/30",
  },
  {
    Icon: Wallet,
    title: "قیمت عمده",
    desc: "بهترین قیمت برای خریدهای عمده همکاران",
    hue: "from-purple-500/30 to-fuchsia-500/30",
  },
];

export function WhyUs() {
  return (
    <section id="about" className="mx-auto mt-16 max-w-7xl px-4">
      <h2 className="mb-6 text-xl font-extrabold md:text-2xl">چرا پارس گلس؟</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {items.map(({ Icon, title, desc, hue }) => (
          <div
            key={title}
            className="flex items-start gap-4 rounded-2xl glass p-5 transition hover:-translate-y-1 hover:border-white/20"
          >
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${hue} border border-black/10`}
            >
              <Icon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold md:text-lg">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
