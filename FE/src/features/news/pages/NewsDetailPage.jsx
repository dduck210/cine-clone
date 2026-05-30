import React, { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, User, Tag } from "lucide-react";
import Navbar from "@/shared/components/common/Navbar";
import Footer from "@/shared/components/common/Footer";
import { NEWS_LIST } from "@/features/news/data/news-data";

const NewsDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const article = NEWS_LIST.find((n) => n.id === parseInt(id));
  const related = NEWS_LIST.filter((n) => n.id !== parseInt(id)).slice(0, 3);

  if (!article) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">Không tìm thấy bài viết</p>
          <Link to="/" className="text-red-600 font-bold hover:underline">Về trang chủ</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      <Navbar />

      <main className="pt-20">
        {/* Hero image */}
        <div className="w-full h-[40vh] md:h-[55vh] overflow-hidden relative">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-4xl mx-auto">
            <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
              {article.category}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
              {article.title}
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
          {/* Back button + meta */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium"
            >
              <ArrowLeft size={16} /> Quay lại
            </button>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <User size={14} className="text-red-500" />
                <span className="font-semibold text-gray-700 dark:text-gray-300">{article.author}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-red-500" />
                {article.date}
              </span>
            </div>
          </div>

          {/* Excerpt */}
          <p className="text-lg text-gray-500 dark:text-gray-400 italic mb-8 leading-relaxed border-l-4 border-red-600 pl-4">
            {article.excerpt}
          </p>

          {/* Article content */}
          <article className="prose prose-lg max-w-none">
            {article.content.map((block, i) => {
              if (block.type === "heading") {
                return (
                  <h2 key={i} className="text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white mt-8 mb-3">
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "rating") {
                return (
                  <div key={i} className="mt-8 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl px-6 py-4">
                    <Tag size={20} className="text-red-600 dark:text-red-400 shrink-0" />
                    <span className="font-bold text-gray-700 dark:text-gray-300">Điểm đánh giá:</span>
                    <span className="text-2xl font-extrabold text-red-600 dark:text-red-400">{block.score}</span>
                  </div>
                );
              }
              return (
                <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-base md:text-lg">
                  {block.text}
                </p>
              );
            })}
          </article>

          {/* Related articles */}
          {related.length > 0 && (
            <div className="mt-16 pt-10 border-t border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-extrabold text-gray-800 dark:text-white mb-6 border-l-4 border-red-600 pl-4 uppercase tracking-wide">
                Bài viết liên quan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className="group block rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="h-40 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800">
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">{item.category}</span>
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 mt-1 text-sm line-clamp-2 group-hover:text-red-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{item.timeAgo}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NewsDetailPage;
