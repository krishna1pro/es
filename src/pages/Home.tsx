import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/src/db/firebase";
import { CMSPage, CMSSection } from "@/src/types";
import PublicLayout from "@/src/components/layout/PublicLayout";
import SectionRenderer from "@/src/components/cms/SectionRenderer";

export default function Home() {
  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const q = query(collection(db, "pages"), where("slug", "==", "home"));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setPage(snapshot.docs[0].data() as CMSPage);
        } else {
          // Default content if page not found
          setPage({
            id: "home",
            title: "Home",
            slug: "home",
            description: "MLA Public Representative Portal",
            sections: [
              { id: "s1", type: "hero", order: 0, content: { title: "People First • Development Always" } },
              { id: "s2", type: "stats", order: 1, content: {} },
              { id: "s3", type: "about_leader", order: 2, content: {} },
              { id: "s4", type: "leadership_journey", order: 3, content: {} },
              { id: "s5", type: "daily_activities", order: 4, content: {} },
              { id: "s6", type: "development_projects", order: 5, content: {} },
              { id: "s7", type: "peoples_voice", order: 6, content: {} },
              { id: "s8", type: "media_center", order: 7, content: {} },
              { id: "s9", type: "upcoming_events", order: 8, content: {} },
            ],
            updatedAt: new Date().toISOString(),
            updatedBy: "system"
          });
        }
      } catch (error) {
        console.error("Error fetching home page:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-blue"></div>
      </div>
    );
  }

  return (
    <PublicLayout>
      <div className="flex flex-col">
        {page?.sections.sort((a, b) => a.order - b.order).map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>
    </PublicLayout>
  );
}
