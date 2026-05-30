import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle, ArrowLeft, AlertCircle } from "lucide-react";
import Navbar from "@/shared/components/common/Navbar";
import Footer from "@/shared/components/common/Footer";
import { STATIC_PAGES } from "@/features/static/data/static-pages-data";

const StaticPage = () => {
  const { pathname } = useLocation();
  const slug = pathname.replace("/", "");
  const page = STATIC_PAGES[slug];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!page) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">Trang không tồn tại</p>
          <Link to="/" className="text-red-600 font-bold hover:underline">Về trang chủ</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#dc2626] to-red-800 pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tight">
            {page.title}
          </h1>
          <p className="text-red-100 text-base md:text-lg">{page.subtitle}</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium mb-10"
        >
          <ArrowLeft size={16} /> Về trang chủ
        </Link>

        <article className="space-y-4">
          {page.content.map((block, i) => {
            if (block.type === "heading") {
              return (
                <h2 key={i} className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white mt-10 mb-2 border-l-4 border-[#dc2626] pl-4">
                  {block.text}
                </h2>
              );
            }
            if (block.type === "list") {
              return (
                <ul key={i} className="space-y-2">
                  {block.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-base">
                      <CheckCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            if (block.type === "note") {
              return (
                <div key={i} className="mt-6 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-xl px-6 py-4">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <span className="font-bold text-red-700 dark:text-red-400 text-sm">{block.text}</span>
                </div>
              );
            }
            return (
              <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed text-base md:text-lg">
                {block.text}
              </p>
            );
          })}
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default StaticPage;
