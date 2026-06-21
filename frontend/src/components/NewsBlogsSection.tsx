// import { useEffect, useState } from "react";
// import { ArrowRight, MapPin, Newspaper } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import {
//   getNewsItems,
//   getNewsItemsAsync,
//   subscribeToNewsItems,
//   type NewsItem,
// } from "@/lib/newsStorage";
// import cricketBanner from "@/assets/images/bg1.png";

// const NewsBlogsSection = () => {
//   const navigate = useNavigate();
//   const [newsItems, setNewsItems] = useState<NewsItem[]>(() => getNewsItems());

//   useEffect(() => {
//     void getNewsItemsAsync();
//     return subscribeToNewsItems(() => setNewsItems(getNewsItems()));
//   }, []);

//   const featuredNews = newsItems.slice(0, 3);

//   const getCardImage = (item: NewsItem) => {
//     return item.matchStoryImageUrl?.trim() || cricketBanner;
//   };

//   return (
//     <section id="news-blogs" className="px-4 py-12 md:py-16">
//       <div className="container mx-auto">
//         <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-end md:justify-between">
//           <div>
//             <p className="text-sm font-semibold uppercase text-primary">
//               Latest Updates
//             </p>
//             <h2 className="font-heading text-3xl font-bold uppercase text-foreground md:text-4xl">
//               News & Blogs
//             </h2>
//             <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
//               Tournament news, match stories, venue updates, and YouTube media
//               added from the admin panel.
//             </p>
//           </div>

//           <button
//             type="button"
//             className="gold-button inline-flex items-center gap-2 self-start"
//             onClick={() => navigate("/news")}
//           >
//             <Newspaper className="h-4 w-4" aria-hidden="true" />
//             View All
//           </button>
//         </div>

//         {featuredNews.length === 0 ? (
//           <p className="text-sm text-muted-foreground">
//             No news yet. Check back soon!
//           </p>
//         ) : (
//           <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
//             {featuredNews.map((item, index) => (
//               <button
//                 key={item.id}
//                 type="button"
//                 className="group overflow-hidden rounded-lg border border-primary/25 bg-white text-left shadow-[0_16px_34px_rgba(52,48,39,0.13)] transition hover:-translate-y-1 hover:shadow-[0_22px_42px_rgba(52,48,39,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
//                 onClick={() => navigate(`/news?id=${encodeURIComponent(item.id)}`)}
//               >
//                 <div className="relative aspect-video overflow-hidden bg-[#1F1B13]">
//                   <img
//                     className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
//                     src={getCardImage(item)}
//                     alt={item.newsTitle.en}
//                     loading="lazy"
//                     onError={(e) => {
//                       e.currentTarget.src = cricketBanner;
//                     }}
//                   />

//                   {index === 0 && (
//                     <span className="absolute bottom-3 left-3 rounded-md bg-primary px-3 py-1 text-xs font-semibold uppercase text-primary-foreground">
//                       Latest
//                     </span>
//                   )}
//                 </div>

//                 <div className="p-5">
//                   <h3 className="font-heading text-2xl font-bold leading-7 text-foreground">
//                     {item.newsTitle.en}
//                   </h3>

//                   <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
//                     {item.newsDescription.en}
//                   </p>

//                   <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
//                     {item.venue.en && (
//                       <span className="flex items-center gap-1">
//                         <MapPin className="h-3.5 w-3.5" />
//                         {item.venue.en}
//                       </span>
//                     )}

//                     {item.matchTime.en && (
//                       <span className="ml-auto font-medium text-primary">
//                         {item.matchTime.en}
//                       </span>
//                     )}
//                   </div>

//                   <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-primary">
//                     Read More
//                     <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
//                   </div>
//                 </div>
//               </button>
//             ))}
//           </div>
//         )}
//       </div>
//     </section>
//   );
// };

// export default NewsBlogsSection;




































import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Newspaper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getNewsItems,
  getNewsItemsAsync,
  subscribeToNewsItems,
  type NewsItem,
} from "@/lib/newsStorage";
import cricketBanner from "@/assets/images/bg1.png";

const NewsBlogsSection = () => {
  const navigate = useNavigate();

  const [newsItems, setNewsItems] = useState<NewsItem[]>(() =>
    getNewsItems()
  );

  useEffect(() => {
    void getNewsItemsAsync();

    return subscribeToNewsItems(() => {
      setNewsItems(getNewsItems());
    });
  }, []);

  const featuredNews = newsItems.slice(0, 3);

  const getCardImage = (item: NewsItem) => {
    return item.matchStoryImageUrl?.trim() || cricketBanner;
  };

  return (
    <section
      id="news-blogs"
      className="px-4 py-10 sm:px-6 md:px-8 md:py-14 lg:py-16"
    >
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary sm:text-sm">
              Latest Updates
            </p>

            <h2 className="font-heading text-2xl font-bold uppercase text-foreground sm:text-3xl md:text-4xl">
              News & Blogs
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Tournament news, match stories, venue updates, and YouTube media
              added from the admin panel.
            </p>
          </div>

          <button
            type="button"
            className="gold-button inline-flex items-center gap-2 self-start"
            onClick={() => navigate("/news")}
          >
            <Newspaper className="h-4 w-4" />
            View All
          </button>
        </div>

        {featuredNews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No news yet. Check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredNews.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-primary/20 bg-white text-left shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() =>
                  navigate(`/news?id=${encodeURIComponent(item.id)}`)
                }
              >
                {/* Image */}
                <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-[#1F1B13] p-2">
                  <img
                    src={getCardImage(item)}
                    alt={item.newsTitle.en}
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = cricketBanner;
                    }}
                  />

                  {index === 0 && (
                    <span className="absolute bottom-3 left-3 rounded-md bg-primary px-3 py-1 text-xs font-semibold uppercase text-primary-foreground">
                      Latest
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="font-heading text-lg font-bold leading-6 text-foreground sm:text-xl md:text-2xl">
                    {item.newsTitle.en}
                  </h3>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {item.newsDescription.en}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {item.venue.en && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {item.venue.en}
                      </span>
                    )}

                    {item.matchTime.en && (
                      <span className="font-medium text-primary sm:ml-auto">
                        {item.matchTime.en}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-4">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                      Read More
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsBlogsSection;