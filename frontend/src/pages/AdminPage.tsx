import { FormEvent, useEffect, useMemo, useState } from "react";
import { BarChart3, Edit3, Eye, Languages, Link, MapPin, Newspaper, PlusCircle, Save, Trash2, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  addNewsItem,
  deleteNewsItem,
  emptyNewsForm,
  getNewsItems,
  subscribeToNewsItems,
  updateNewsItem,
  type Language,
  type LocalizedText,
  type NewsFormValues,
  type NewsItem,
} from "@/lib/newsStorage";

const cloneForm = (values: NewsFormValues): NewsFormValues => JSON.parse(JSON.stringify(values)) as NewsFormValues;

const labels = {
  en: {
    adminPanel: "Admin Panel",
    dashboardTitle: "News Dashboard",
    dashboardDesc: "Add, edit, delete, and publish English/Tamil cricket news with YouTube video stories.",
    totalNews: "Total News",
    totalViews: "Total Views",
    tamilReady: "Tamil Ready",
    videoPosts: "Video Posts",
    editNews: "Edit News",
    createNews: "Create News",
    englishContent: "English Content",
    tamilContent: "Tamil Content",
    cancelEdit: "Cancel edit",
    newsTitle: "News Title",
    newsDescription: "News Description",
    venue: "Venue",
    time: "Time",
    status: "Status",
    audienceViewCount: "Audience View Count",
    mediaYoutubeEmbedLink: "Media YouTube Embed Link",
    matchStoryTitle: "Match Story Title",
    matchStoryDescription: "Match Story Description",
    updateNews: "Update News",
    addNews: "Add News",
    clear: "Clear",
    publishedNews: "Published News",
    video: "Video",
    edit: "Edit",
    delete: "Delete",
    viewNewsPage: "View news page",
    updated: "News updated successfully.",
    added: "News added successfully.",
    editing: "Editing selected news.",
    deleted: "News deleted.",
    confirmDelete: "Delete",
  },
  ta: {
    adminPanel: "நிர்வாக பகுதி",
    dashboardTitle: "செய்தி டாஷ்போர்டு",
    dashboardDesc: "ஆங்கிலம்/தமிழ் கிரிக்கெட் செய்திகள், YouTube வீடியோ கதைகள் ஆகியவற்றை சேர்க்க, திருத்த, நீக்க, வெளியிடலாம்.",
    totalNews: "மொத்த செய்திகள்",
    totalViews: "மொத்த பார்வைகள்",
    tamilReady: "தமிழ் தயார்",
    videoPosts: "வீடியோ பதிவுகள்",
    editNews: "செய்தி திருத்தம்",
    createNews: "செய்தி உருவாக்கம்",
    englishContent: "ஆங்கில உள்ளடக்கம்",
    tamilContent: "தமிழ் உள்ளடக்கம்",
    cancelEdit: "திருத்தத்தை ரத்து செய்",
    newsTitle: "செய்தி தலைப்பு",
    newsDescription: "செய்தி விளக்கம்",
    venue: "இடம்",
    time: "நேரம்",
    status: "நிலை",
    audienceViewCount: "பார்வையாளர் எண்ணிக்கை",
    mediaYoutubeEmbedLink: "YouTube வீடியோ இணைப்பு",
    matchStoryTitle: "போட்டி கதை தலைப்பு",
    matchStoryDescription: "போட்டி கதை விளக்கம்",
    updateNews: "செய்தியை புதுப்பி",
    addNews: "செய்தி சேர்க்க",
    clear: "அழி",
    publishedNews: "வெளியிடப்பட்ட செய்திகள்",
    video: "வீடியோ",
    edit: "திருத்து",
    delete: "நீக்கு",
    viewNewsPage: "செய்தி பக்கத்தை பார்க்க",
    updated: "செய்தி வெற்றிகரமாக புதுப்பிக்கப்பட்டது.",
    added: "செய்தி வெற்றிகரமாக சேர்க்கப்பட்டது.",
    editing: "தேர்ந்தெடுத்த செய்தி திருத்தப்படுகிறது.",
    deleted: "செய்தி நீக்கப்பட்டது.",
    confirmDelete: "நீக்க வேண்டுமா",
  },
} satisfies Record<Language, Record<string, string>>;

const AdminPage = () => {
  const [formValues, setFormValues] = useState<NewsFormValues>(() => cloneForm(emptyNewsForm));
  const [newsItems, setNewsItems] = useState<NewsItem[]>(() => getNewsItems());
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const t = labels[language];

  useEffect(() => subscribeToNewsItems(() => setNewsItems(getNewsItems())), []);

  const dashboard = useMemo(
    () => ({
      totalNews: newsItems.length,
      totalViews: newsItems.reduce((total, item) => total + item.audience, 0),
      tamilReady: newsItems.filter((item) => item.newsTitle.ta.trim() && item.matchStoryDescription.ta.trim()).length,
      videoPosts: newsItems.filter((item) => item.mediaEmbedUrl.trim()).length,
    }),
    [newsItems]
  );

  const updateLocalizedField = (
    field: keyof Pick<NewsFormValues, "newsTitle" | "newsDescription" | "venue" | "matchTime" | "status" | "matchStoryTitle" | "matchStoryDescription">,
    value: string
  ) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: {
        ...(currentValues[field] as LocalizedText),
        [language]: value,
      },
    }));
  };

  const updateField = <Key extends keyof Pick<NewsFormValues, "audience" | "mediaEmbedUrl">>(
    field: Key,
    value: NewsFormValues[Key]
  ) => {
    setFormValues((currentValues) => ({ ...currentValues, [field]: value }));
  };

  const resetForm = () => {
    setFormValues(cloneForm(emptyNewsForm));
    setEditingId(null);
    setMessage("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingId) {
      updateNewsItem(editingId, formValues);
      setMessage(t.updated);
    } else {
      addNewsItem(formValues);
      setMessage(t.added);
    }

    setFormValues(cloneForm(emptyNewsForm));
    setEditingId(null);
    setNewsItems(getNewsItems());
  };

  const startEdit = (item: NewsItem) => {
    setFormValues({
      newsTitle: { ...item.newsTitle },
      newsDescription: { ...item.newsDescription },
      venue: { ...item.venue },
      matchTime: { ...item.matchTime },
      status: { ...item.status },
      category: item.category ?? "",
      audience: item.audience,
      mediaEmbedUrl: item.mediaEmbedUrl,
      matchStoryTitle: { ...item.matchStoryTitle },
      matchStoryDescription: { ...item.matchStoryDescription },
      matchStoryImageUrl: item.matchStoryImageUrl ?? "",
    });
    setEditingId(item.id);
    setMessage(t.editing);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeNews = (item: NewsItem) => {
    const confirmed = window.confirm(`${t.confirmDelete} "${item.newsTitle[language] || item.newsTitle.en}"?`);

    if (!confirmed) {
      return;
    }

    deleteNewsItem(item.id);
    setNewsItems(getNewsItems());
    if (editingId === item.id) {
      resetForm();
    }
    setMessage(t.deleted);
  };

  const inputClass =
    "mt-2 w-full rounded-md border border-primary/25 bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-16">
        <section className="px-4 py-8 md:py-12">
          <div className="container mx-auto">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-primary">{t.adminPanel}</p>
                <h1 className="mt-2 font-heading text-4xl font-bold uppercase text-foreground md:text-5xl">
                  {t.dashboardTitle}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">{t.dashboardDesc}</p>
              </div>
              <div className="inline-flex rounded-lg border border-primary/30 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${
                    language === "en" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary/10"
                  }`}
                  onClick={() => setLanguage("en")}
                >
                  <Languages className="h-4 w-4" aria-hidden="true" />
                  English
                </button>
                <button
                  type="button"
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                    language === "ta" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary/10"
                  }`}
                  onClick={() => setLanguage("ta")}
                >
                  தமிழ்
                </button>
              </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: t.totalNews, value: dashboard.totalNews.toLocaleString("en-IN"), icon: Newspaper },
                { label: t.totalViews, value: dashboard.totalViews.toLocaleString("en-IN"), icon: Eye },
                { label: t.videoPosts, value: dashboard.videoPosts.toLocaleString("en-IN"), icon: BarChart3 },
              ].map((metric) => {
                const Icon = metric.icon;

                return (
                  <div key={metric.label} className="rounded-lg border border-primary/25 bg-white p-5 shadow-sm">
                    <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    <p className="mt-4 text-xs font-semibold uppercase text-primary">{metric.label}</p>
                    <p className="mt-1 font-heading text-3xl font-bold text-foreground">{metric.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
              <form className="rounded-lg border border-primary/25 bg-white p-5 shadow-sm md:p-6" onSubmit={handleSubmit}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-primary">{editingId ? t.editNews : t.createNews}</p>
                    <h2 className="font-heading text-3xl font-bold text-foreground">
                      {language === "ta" ? t.tamilContent : t.englishContent}
                    </h2>
                  </div>
                  {editingId && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-primary/25 px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-primary/10"
                      onClick={resetForm}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      {t.cancelEdit}
                    </button>
                  )}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="md:col-span-2">
                    <span className="text-sm font-semibold text-foreground">{t.newsTitle}</span>
                    <input className={inputClass} value={formValues.newsTitle[language]} onChange={(event) => updateLocalizedField("newsTitle", event.target.value)} required={language === "en"} />
                  </label>

                  <label className="md:col-span-2">
                    <span className="text-sm font-semibold text-foreground">{t.newsDescription}</span>
                    <textarea className={`${inputClass} min-h-28`} value={formValues.newsDescription[language]} onChange={(event) => updateLocalizedField("newsDescription", event.target.value)} required={language === "en"} />
                  </label>

                  <label>
                    <span className="text-sm font-semibold text-foreground">{t.venue}</span>
                    <input className={inputClass} value={formValues.venue[language]} onChange={(event) => updateLocalizedField("venue", event.target.value)} required={language === "en"} />
                  </label>

                  <label>
                    <span className="text-sm font-semibold text-foreground">{t.time}</span>
                    <input className={inputClass} value={formValues.matchTime[language]} onChange={(event) => updateLocalizedField("matchTime", event.target.value)} required={language === "en"} />
                  </label>

                  <label>
                    <span className="text-sm font-semibold text-foreground">{t.status}</span>
                    <input className={inputClass} value={formValues.status[language]} onChange={(event) => updateLocalizedField("status", event.target.value)} required={language === "en"} />
                  </label>

                  <label>
                    <span className="text-sm font-semibold text-foreground">{t.audienceViewCount}</span>
                    <input className={inputClass} min={0} type="number" value={formValues.audience} onChange={(event) => updateField("audience", Number(event.target.value))} required />
                  </label>

                  <label className="md:col-span-2">
                    <span className="text-sm font-semibold text-foreground">{t.mediaYoutubeEmbedLink}</span>
                    <input className={inputClass} placeholder="https://www.youtube.com/embed/VIDEO_ID" value={formValues.mediaEmbedUrl} onChange={(event) => updateField("mediaEmbedUrl", event.target.value)} required />
                  </label>

                  <label className="md:col-span-2">
                    <span className="text-sm font-semibold text-foreground">{t.matchStoryTitle}</span>
                    <input className={inputClass} value={formValues.matchStoryTitle[language]} onChange={(event) => updateLocalizedField("matchStoryTitle", event.target.value)} required={language === "en"} />
                  </label>

                  <label className="md:col-span-2">
                    <span className="text-sm font-semibold text-foreground">{t.matchStoryDescription}</span>
                    <textarea className={`${inputClass} min-h-36`} value={formValues.matchStoryDescription[language]} onChange={(event) => updateLocalizedField("matchStoryDescription", event.target.value)} required={language === "en"} />
                  </label>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button type="submit" className="gold-button inline-flex items-center gap-2">
                    <Save className="h-4 w-4" aria-hidden="true" />
                    {editingId ? t.updateNews : t.addNews}
                  </button>
                  <button type="button" className="gold-outline-button inline-flex items-center gap-2" onClick={resetForm}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t.clear}
                  </button>
                  {message && <p className="text-sm font-semibold text-primary">{message}</p>}
                </div>
              </form>

              <aside className="rounded-lg border border-primary/25 bg-white p-5 shadow-sm lg:self-start">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-primary">
                  <Newspaper className="h-4 w-4" aria-hidden="true" />
                  {t.publishedNews}
                </p>
                <div className="mt-4 max-h-[780px] space-y-3 overflow-y-auto pr-1">
                  {newsItems.map((item) => (
                    <article key={item.id} className="rounded-lg border border-primary/20 bg-background p-4">
                      <h2 className="font-heading text-xl font-bold leading-6 text-foreground">{item.newsTitle[language]}</h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.newsDescription[language]}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                          {item.venue[language]}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
                          {item.audience.toLocaleString("en-IN")}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Link className="h-4 w-4 text-primary" aria-hidden="true" />
                          {t.video}
                        </span>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-primary/25 bg-white px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-primary/10"
                          onClick={() => startEdit(item)}
                        >
                          <Edit3 className="h-4 w-4" aria-hidden="true" />
                          {t.edit}
                        </button>
                        <button
                          type="button"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                          onClick={() => removeNews(item)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          {t.delete}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <a href="/news" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-foreground">
                  <PlusCircle className="h-4 w-4" aria-hidden="true" />
                  {t.viewNewsPage}
                </a>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AdminPage;
