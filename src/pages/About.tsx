import PublicLayout from "@/src/components/layout/PublicLayout";
import { motion } from "motion/react";
import { Shield, Target, Landmark, History } from "lucide-react";

export default function About() {
  return (
    <PublicLayout>
      <div className="bg-slate-50 pb-24">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 text-center space-y-6">
            <h1 className="text-6xl font-display font-bold text-slate-900 tracking-tight">Our District Core</h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
              Founded on the principles of transparency and development, we work tirelessly to serve every citizen in the district.
            </p>
            <div className="flex justify-center gap-4 pt-8">
              <div className="h-2 w-2 bg-primary-blue rounded-full" />
              <div className="h-2 w-2 bg-primary-green rounded-full" />
              <div className="h-2 w-12 bg-primary-blue rounded-full" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-24">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-8">
                 <h2 className="text-4xl font-display font-bold text-primary-blue leading-tight uppercase tracking-[0.2em]">Our Mission</h2>
                 <p className="text-lg text-slate-600 leading-relaxed font-light italic">
                   "To bridge the gap between governance and citizens using technology and human-centric policies, ensuring sustainable development across all mandals."
                 </p>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                    <div className="space-y-3">
                       <div className="p-3 bg-primary-blue/5 text-primary-blue rounded-2xl w-fit"><Landmark size={24} /></div>
                       <h4 className="font-bold text-slate-900">Land Governance</h4>
                       <p className="text-sm text-slate-500">Transparent management of land resources and planning.</p>
                    </div>
                    <div className="space-y-3">
                       <div className="p-3 bg-primary-green/5 text-primary-green rounded-2xl w-fit"><Shield size={24} /></div>
                       <h4 className="font-bold text-slate-900">Security & Safety</h4>
                       <p className="text-sm text-slate-500">Ensuring a safe living environment for every family.</p>
                    </div>
                    <div className="space-y-3">
                       <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit"><Target size={24} /></div>
                       <h4 className="font-bold text-slate-900">Goal Driven</h4>
                       <p className="text-sm text-slate-500">Meeting quarterly targets for infrastructure and health.</p>
                    </div>
                    <div className="space-y-3">
                       <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit"><History size={24} /></div>
                       <h4 className="font-bold text-slate-900">Our Heritage</h4>
                       <p className="text-sm text-slate-500">Preserving the rich cultural history of our ancient district.</p>
                    </div>
                 </div>
              </div>
              <div className="relative">
                 <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl relative z-10">
                    <img src="https://images.unsplash.com/photo-1541802645635-11f2286a7482?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover" alt="History" />
                    <div className="absolute inset-0 bg-primary-blue/20" />
                 </div>
                 <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-green/30 rounded-full blur-3xl" />
                 <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary-blue/20 rounded-full blur-3xl shadow-2xl" />
              </div>
           </div>
        </div>
      </div>
    </PublicLayout>
  );
}
