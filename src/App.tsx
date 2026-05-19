import { useState, useEffect, ReactNode, FormEvent, MouseEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Settings, 
  Share2, 
  Plus, 
  Trash2, 
  Edit2, 
  Download, 
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  Phone,
  Mail,
  Briefcase,
  X,
  LayoutDashboard,
  Linkedin,
  Twitter,
  Github,
  Instagram,
  Globe,
  MapPin,
  ExternalLink,
  Copy,
  MessageSquare,
  QrCode,
  User,
  Upload
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { BrowserRouter, Routes, Route, useParams, useNavigate, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

// --- Types ---

interface Contact {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  title: string;
  website: string;
  address: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  github?: string;
  facebook?: string;
  profileImage?: string;
  createdAt?: string;
}

type Tab = "contacts" | "share";

// --- Components ---

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/card/:id" element={<PublicCard />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("contacts");
  const [loading, setLoading] = useState(false);

  // State for global modals
  const [isAdding, setIsAdding] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchContactsRequested = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 font-sans overflow-hidden h-screen">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-100">
            <Share2 className="text-white h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold text-zinc-900 tracking-tight">vCard Pro</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          <SidebarButton 
            active={activeTab === "contacts"} 
            onClick={() => setActiveTab("contacts")}
            icon={<Users className="h-5 w-5" />}
            label="Contacts"
          />
          <SidebarButton 
            active={activeTab === "share"} 
            onClick={() => setActiveTab("share")}
            icon={<Share2 className="h-5 w-5" />}
            label="Share Hub"
          />
        </nav>

        <div className="p-4 border-t border-zinc-100">
           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">vCard Pro v1.0</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-8">
        <header className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
              {activeTab === "contacts" && "Contact Dashboard"}
              {activeTab === "share" && "Sharing Hub"}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              {activeTab === "contacts" && "Manage your professional connections and digital business cards."}
              {activeTab === "share" && "Generate and export high-quality vCards for your network."}
            </p>
          </div>
          
          {activeTab === "contacts" && (
             <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <button
                  onClick={() => { setEditingContact(undefined); setIsAdding(true); }}
                  className="relative px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Contact</span>
                </button>
             </div>
          )}
        </header>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === "contacts" && (
              <ContactsTab 
                key="contacts"
                onEdit={(c) => { setEditingContact(c); setIsAdding(true); }} 
                refreshTrigger={refreshTrigger}
              />
            )}
            {activeTab === "share" && (
              <ShareTab key="share" />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Adding/Editing Modal is outside main but inside App for context */}
      {isAdding && (
        <ContactModal 
          onClose={() => setIsAdding(false)} 
          onSave={() => { setIsAdding(false); fetchContactsRequested(); }}
          editData={editingContact}
        />
      )}
    </div>
  );
}

function PublicCard() {
  const { id } = useParams();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await fetch(`/api/contacts/${id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Profile not found");
        }
        const data = await res.json();
        setContact(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchContact();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0c14]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">Initializing vCard Interface</p>
      </div>
    </div>
  );

  if (error || !contact) return (
    <div className="flex h-screen w-full items-center justify-center bg-[#0a0c14] text-white p-8 text-center font-sans">
      <div className="max-w-md">
        <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-rose-500/20">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-3xl font-black mb-4 tracking-tight">Access Error</h2>
        <p className="text-zinc-500 text-sm leading-relaxed mb-10">
          {error?.includes("MongoDB URI") 
            ? "The system connection to the cloud database is not active. Please ensure the host has configured the MongoDB URI in the admin settings."
            : error || "The profile you are looking for does not exist or has been removed from our secure database."}
        </p>
        <button onClick={() => window.location.href = "/"} className="w-full py-4 bg-white text-zinc-900 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all">
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0c14] flex items-center justify-center p-0 sm:p-4 font-sans selection:bg-indigo-500 selection:text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg min-h-screen sm:min-h-0 sm:h-[850px] bg-[#111422] sm:rounded-[3.5rem] overflow-y-auto overflow-x-hidden shadow-2xl relative flex flex-col custom-scrollbar border border-white/5"
      >
        {/* Top Branding / Nav */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-center relative z-20 shrink-0">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-600/20">M</div>
              <span className="text-sm font-black text-white/90 tracking-tight">vCard Pro</span>
           </div>
           <button className="w-10 h-10 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors">
              <QrCode className="h-5 w-5 opacity-60" />
           </button>
        </div>

        {/* Hero Section */}
        <div className="px-8 pt-6 pb-4 relative z-10 flex flex-col items-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-rose-500 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="w-48 h-48 sm:w-56 sm:h-56 bg-zinc-800 rounded-[3rem] p-1.5 relative overflow-hidden shadow-2xl group-hover:scale-[1.02] transition-transform duration-500">
              {contact.profileImage ? (
                <img src={contact.profileImage} alt={`${contact.firstName} ${contact.lastName}`} className="w-full h-full object-cover rounded-[2.8rem]" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-6xl text-white/10 uppercase select-none">
                  {contact.firstName[0]}{contact.lastName[0]}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center px-4 w-full">
            <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
              {contact.firstName} {contact.lastName}
            </h1>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em] mt-3">
              {contact.title || "Industry Professional"}
            </p>
            {contact.organization && (
               <p className="text-[10px] font-black text-indigo-400/80 uppercase tracking-widest mt-1">
                 {contact.organization}
               </p>
            )}
          </div>

          {/* Quick Action Circle Icons */}
          <div className="w-full mt-10 grid grid-cols-4 gap-4 px-2">
            <PublicQuickIcon icon={<Phone className="h-5 w-5" />} label="Call" href={`tel:${contact.phone}`} className="bg-white text-zinc-900" />
            <PublicQuickIcon icon={<Mail className="h-5 w-5" />} label="Email" href={`mailto:${contact.email}`} className="bg-white text-zinc-900" />
            <PublicQuickIcon icon={<MessageSquare className="h-5 w-5" />} label="Text" href={`sms:${contact.phone}`} className="bg-white text-zinc-900" />
            <PublicQuickIcon icon={<MapPin className="h-5 w-5" />} label="Office" href={`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`} className="bg-white text-zinc-900" />
          </div>

          {/* Link Tiles */}
          <div className="w-full mt-10 space-y-4 px-2 pb-10">
             {contact.website && <EnhancedSocialTile icon={<Globe className="h-5 w-5 text-indigo-400" />} label="Official Website" href={contact.website} color="bg-white/5 hover:bg-white/10" textColor="text-white" />}
             {contact.linkedin && <EnhancedSocialTile icon={<Linkedin className="h-5 w-5 text-[#0077b5]" />} label="LinkedIn Connection" href={contact.linkedin} color="bg-white/5 hover:bg-white/10" textColor="text-white" />}
             {contact.twitter && <EnhancedSocialTile icon={<Twitter className="h-5 w-5 text-[#1da1f2]" />} label="Follow on X" href={contact.twitter} color="bg-white/5 hover:bg-white/10" textColor="text-white" />}
             {contact.instagram && <EnhancedSocialTile icon={<Instagram className="h-5 w-5 text-[#e4405f]" />} label="Instagram Profile" href={contact.instagram} color="bg-white/5 hover:bg-white/10" textColor="text-white" />}
             {contact.github && <EnhancedSocialTile icon={<Github className="h-5 w-5 text-white" />} label="GitHub Developer" href={contact.github} color="bg-white/5 hover:bg-white/10" textColor="text-white" />}

             <div className="flex gap-4 pt-6">
                <button 
                  onClick={() => {
                  const vcardData = [
                    "BEGIN:VCARD",
                    "VERSION:3.0",
                    `N:${contact.lastName};${contact.firstName};;;`,
                    `FN:${contact.firstName} ${contact.lastName}`,
                    contact.organization ? `ORG:${contact.organization}` : "",
                    contact.title ? `TITLE:${contact.title}` : "",
                    contact.phone ? `TEL;TYPE=WORK,VOICE:${contact.phone}` : "",
                    contact.email ? `EMAIL;TYPE=PREF,INTERNET:${contact.email}` : "",
                    contact.address ? `ADR;TYPE=WORK:;;${contact.address};;;;` : "",
                    contact.website ? `URL:${contact.website}` : "",
                    "END:VCARD"
                  ].filter(Boolean).join("\n");
                  
                  // If profile image exists and is base64, add it differently
                  let finalVcard = vcardData;
                  if (contact.profileImage && contact.profileImage.startsWith("data:image/")) {
                      const [mime, base64] = contact.profileImage.split(";base64,");
                      const type = mime.split("/")[1].split(";")[0].toUpperCase();
                      finalVcard = finalVcard.replace("END:VCARD", `PHOTO;TYPE=${type};ENCODING=b:${base64}\nEND:VCARD`);
                  } else if (contact.profileImage) {
                      finalVcard = finalVcard.replace("END:VCARD", `PHOTO;VALUE=URI:${contact.profileImage}\nEND:VCARD`);
                  }

                  const blob = new Blob([finalVcard], { type: "text/vcard;charset=utf-8" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${contact.firstName}_${contact.lastName}.vcf`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  }}
                  className="flex-1 py-4.5 bg-white text-zinc-900 rounded-[1.8rem] font-bold text-sm shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add to Contact
                </button>
                <button 
                   onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: `${contact.firstName}'s digital vCard`, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link copied to clipboard!");
                    }
                   }}
                   className="w-16 h-16 bg-white/5 border border-white/10 backdrop-blur-md rounded-[1.8rem] flex items-center justify-center text-white hover:bg-white/10 active:scale-95 transition-all"
                >
                   <Share2 className="h-5 w-5 opacity-80" />
                </button>
             </div>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="mt-auto py-8 text-center text-zinc-600 opacity-40 hover:opacity-100 transition-opacity">
           <p className="text-[10px] font-black uppercase tracking-[0.3em]">Built with vCard Pro</p>
        </div>
      </motion.div>
    </div>
  );
}

function PublicQuickIcon({ icon, label, href, className }: { icon: ReactNode, label: string, href: string, className: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-2 group flex-1"
    >
      <div className={cn("w-full aspect-square rounded-[1.5rem] flex items-center justify-center shadow-lg transition-all group-hover:scale-105 active:scale-95 group-hover:-translate-y-1", className)}>
        {icon}
      </div>
      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em]">{label}</span>
    </a>
  );
}

function EnhancedSocialTile({ icon, label, href, color, textColor }: { icon: ReactNode, label: string, href: string, color: string, textColor: string }) {
  return (
    <a 
      href={href.startsWith("http") ? href : `https://${href}`}
      target="_blank"
      rel="noopener noreferrer" 
      className={cn("flex items-center justify-between p-5 rounded-[1.8rem] transition-all hover:scale-[1.02] active:scale-95 group border border-white/5", color, textColor)}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-md">
          {icon}
        </div>
        <span className="font-bold text-sm tracking-tight">{label}</span>
      </div>
      <div className="bg-white/5 p-2 rounded-xl group-hover:bg-white/10 transition-colors">
        <ExternalLink className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
      </div>
    </a>
  );
}

// Global hook/emulation to share refresh logic
let globalRefresh: (() => void) | null = null;
let globalEdit: ((c: Contact) => void) | null = null;

function SidebarButton({ active, onClick, icon, label, disabled = false }: { active: boolean, onClick: () => void, icon: ReactNode, label: string, disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer",
        active 
          ? "bg-zinc-100 text-indigo-600 shadow-sm" 
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {icon}
      <span>{label}</span>
      {active && <motion.div layoutId="pill" className="ml-auto w-1 h-4 bg-indigo-600 rounded-full" />}
    </button>
  );
}


function ContactsTab({ onEdit, refreshTrigger }: { onEdit: (c: Contact) => void, refreshTrigger: number, key?: any }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    globalRefresh = fetchContacts;
  }, [refreshTrigger]);

  const handleDelete = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this contact permanently?")) return;
    try {
      await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      setContacts(contacts.filter(c => c._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {loading ? (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-6 lg:col-span-4 h-64 bg-white animate-pulse rounded-[2rem] border border-zinc-100" />
          <div className="col-span-12 md:col-span-6 lg:col-span-8 h-64 bg-white animate-pulse rounded-[2rem] border border-zinc-100" />
          <div className="col-span-12 lg:col-span-12 h-48 bg-white animate-pulse rounded-[2rem] border border-zinc-100" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="w-full flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-zinc-100 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner rotate-3">
              <Users className="text-zinc-300 h-10 w-10" />
            </div>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Your rolodex is empty</h3>
            <p className="text-zinc-500 mt-2 max-w-sm mx-auto">Click "Add New Contact" in the top right to start building your digital network.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6 auto-rows-max">
           {/* Summary Stats Bento Tile */}
           <div className="col-span-12 lg:col-span-4 bg-zinc-900 rounded-[2rem] p-8 text-white flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div>
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Total Contacts</p>
                 <h4 className="text-6xl font-black tabular-nums tracking-tighter">{contacts.length}</h4>
              </div>
              <div className="mt-8 flex items-center gap-2">
                 <div className="flex -space-x-2">
                    {contacts.slice(0, 4).map((c, idx) => (
                       <div key={idx} className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                          {c.firstName[0]}
                       </div>
                    ))}
                 </div>
                 <p className="text-xs font-bold text-zinc-500">
                    {contacts.length > 4 ? `+${contacts.length - 4} more` : "In your network"}
                 </p>
              </div>
           </div>

           {/* Contacts List Area */}
           <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {contacts.map((contact, idx) => (
                <ContactCard 
                  key={contact._id} 
                  contact={contact} 
                  onDelete={(e) => handleDelete(contact._id!, e)}
                  onEdit={() => onEdit(contact)}
                  index={idx}
                />
              ))}
           </div>
        </div>
      )}
    </motion.div>
  );
}

function ContactCard({ contact, onDelete, onEdit, index }: { contact: Contact, onDelete: (e: any) => void, onEdit: () => void, index: number, key?: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: MouseEvent) => {
    e.stopPropagation();
    const link = `${window.location.origin}/card/${contact._id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-[2rem] border border-zinc-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-default relative overflow-hidden group"
    >
      <div className={cn(
        "absolute top-0 left-0 w-full h-1.5 bg-indigo-600 transform origin-left transition-transform duration-500 scale-x-0 group-hover:scale-x-100"
      )}></div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="h-14 w-14 bg-zinc-50 text-zinc-900 shadow-inner rounded-2xl flex items-center justify-center font-black text-xl border border-zinc-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors overflow-hidden">
          {contact.profileImage ? (
            <img src={contact.profileImage} className="w-full h-full object-cover" />
          ) : (
            <>{contact.firstName[0]}{contact.lastName[0]}</>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button 
             onClick={handleCopyLink}
             title="Copy Digital Card Link"
             className={cn(
               "p-2.5 rounded-xl transition-all cursor-pointer",
               copied ? "text-emerald-600 bg-emerald-50" : "text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100"
             )}
          >
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
          <button 
            onClick={onEdit} 
            className="p-2.5 text-zinc-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={onDelete} 
            className="p-2.5 text-zinc-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-xl font-extrabold text-zinc-900 truncate tracking-tight">
          {contact.firstName} {contact.lastName}
        </h3>
        <p className="text-sm font-bold text-indigo-600 truncate opacity-80 uppercase tracking-widest text-[10px]">
          {contact.title || "Professional"}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
         {contact.linkedin && <Linkedin className="h-4 w-4 text-zinc-300" />}
         {contact.twitter && <Twitter className="h-4 w-4 text-zinc-300" />}
         {contact.instagram && <Instagram className="h-4 w-4 text-zinc-300" />}
         {contact.github && <Github className="h-4 w-4 text-zinc-300" />}
      </div>
      
      <div className="mt-6 space-y-3 pt-6 border-t border-zinc-50">
        {contact.email && (
          <div className="flex items-center gap-3 text-sm text-zinc-500 font-medium">
            <Mail className="h-4 w-4 shrink-0 text-zinc-300" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-3 text-sm text-zinc-500 font-medium">
            <Phone className="h-4 w-4 shrink-0 text-zinc-300" />
            <span>{contact.phone}</span>
          </div>
        )}
      </div>
      
      <Link 
        to={`/card/${contact._id}`}
        target="_blank"
        className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-zinc-50 rounded-xl text-xs font-bold text-zinc-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all group/btn"
      >
        <ExternalLink className="h-3 w-3" />
        View Public Card
      </Link>
    </motion.div>
  );
}

function ContactModal({ onClose, onSave, editData }: { onClose: () => void, onSave: () => void, editData?: Contact }) {
  const [formData, setFormData] = useState<Partial<Contact>>(editData || {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organization: "",
    title: "",
    website: "",
    address: "",
    linkedin: "",
    twitter: "",
    instagram: "",
    github: "",
    profileImage: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editData ? `/api/contacts/${editData._id}` : "/api/contacts";
      const method = editData ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        onSave();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) { // 1.5MB Limit for Base64 (approx 1MB binary)
        alert("Image too large. Please select a file under 1.5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md" 
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden z-10 border border-zinc-200 flex flex-col lg:flex-row max-h-[90vh]"
      >
        {/* Form Section */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-100">
          <div className="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 shrink-0">
            <div>
               <h3 className="text-xl font-black text-zinc-900 tracking-tight">{editData ? "Update Connection" : "New Contact"}</h3>
               <p className="text-zinc-500 text-xs">Real-time sync to your MongoDB cluster.</p>
            </div>
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-zinc-100 rounded-2xl transition-all cursor-pointer text-zinc-400">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar flex-1">
            <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-6 border-b border-zinc-50 pb-2">Appearance</h4>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 mb-8">
              <div className="flex items-center gap-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div className="w-20 h-20 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-zinc-200" />
                  )}
                  <label className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Upload className="h-5 w-5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-zinc-900 mb-1">Profile Photo</p>
                  <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                    Click the image to upload. Recommendation: Square aspect ratio, under 1MB.
                  </p>
                </div>
                {formData.profileImage && (
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, profileImage: ""})}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-6 border-b border-zinc-50 pb-2">Basic Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-8">
              <InputField label="First Name" name="firstName" value={formData.firstName} onChange={(v: string) => setFormData({...formData, firstName: v})} required />
              <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={(v: string) => setFormData({...formData, lastName: v})} required />
              <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} />
              <InputField label="Phone Number" name="phone" value={formData.phone} onChange={(v: string) => setFormData({...formData, phone: v})} />
              <InputField label="Job Title" name="title" value={formData.title} onChange={(v: string) => setFormData({...formData, title: v})} />
              <InputField label="Organization" name="organization" value={formData.organization} onChange={(v: string) => setFormData({...formData, organization: v})} />
              <InputField label="Website URL" name="website" value={formData.website} onChange={(v: string) => setFormData({...formData, website: v})} />
              <InputField label="Full Address" name="address" value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} className="sm:col-span-2" />
            </div>

            <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-6 border-b border-zinc-50 pb-2">Social Profiles</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <InputField label="LinkedIn URL" name="linkedin" value={formData.linkedin} onChange={(v: string) => setFormData({...formData, linkedin: v})} placeholder="linkedin.com/in/username" />
              <InputField label="Twitter URL" name="twitter" value={formData.twitter} onChange={(v: string) => setFormData({...formData, twitter: v})} placeholder="twitter.com/username" />
              <InputField label="Instagram URL" name="instagram" value={formData.instagram} onChange={(v: string) => setFormData({...formData, instagram: v})} placeholder="instagram.com/username" />
              <InputField label="Github URL" name="github" value={formData.github} onChange={(v: string) => setFormData({...formData, github: v})} placeholder="github.com/username" />
            </div>

            <div className="mt-10 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 border border-zinc-200 rounded-2xl font-bold text-zinc-600 hover:bg-zinc-50 transition cursor-pointer text-sm"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[1.5] py-3.5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                {editData ? "Update Record" : "Create Contact"}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Section */}
        <div className="hidden lg:flex w-[400px] bg-zinc-900 p-10 flex-col items-center justify-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
          
          <p className="absolute top-8 left-10 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Live Visual Preview</p>
          <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-xl transition-all cursor-pointer text-zinc-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>

          <motion.div 
            layout
            className="w-full bg-white rounded-[2.5rem] p-8 shadow-2xl relative group overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-[0.05]"></div>
            
            <div className="flex flex-col items-center text-center relative z-10 pt-4">
              <div className="w-20 h-20 bg-zinc-100 text-zinc-900 shadow-inner rounded-3xl flex items-center justify-center font-black text-2xl border border-zinc-200 mb-6 group-hover:scale-105 transition-transform duration-500 overflow-hidden">
                 {formData.profileImage ? (
                   <img src={formData.profileImage} className="w-full h-full object-cover" />
                 ) : (
                    <>{formData.firstName?.[0] || "?"}{formData.lastName?.[0] || ""}</>
                 )}
              </div>
              
              <h4 className="text-xl font-black text-zinc-900 tracking-tight leading-tight">
                {formData.firstName || "First"} {formData.lastName || "Last"}
              </h4>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-1 opacity-80">
                {formData.title || "Job Title"}
              </p>

              <div className="w-full mt-6 flex justify-center gap-2">
                 {formData.linkedin && <Linkedin className="h-4 w-4 text-indigo-500" />}
                 {formData.twitter && <Twitter className="h-4 w-4 text-zinc-900" />}
                 {formData.instagram && <Instagram className="h-4 w-4 text-rose-500" />}
                 {formData.github && <Github className="h-4 w-4 text-zinc-900" />}
              </div>

              <div className="w-full mt-8 space-y-4 pt-6 border-t border-zinc-50 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-50 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-zinc-400" />
                  </div>
                  <span className="text-xs font-bold text-zinc-500 truncate">{formData.email || "email@example.com"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-50 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-zinc-400" />
                  </div>
                  <span className="text-xs font-bold text-zinc-500">{formData.phone || "+1 (555) 000-0000"}</span>
                </div>
              </div>

              <div className="mt-8 w-full h-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 flex items-center justify-center">
                 <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">QR Code Placeholder</span>
              </div>
            </div>
          </motion.div>

          <p className="mt-8 text-[10px] font-medium text-zinc-600 max-w-[200px] text-center italic">
            "Your profile is updated instantly across the dashboard and share links."
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function InputField({ label, name, value, onChange, type = "text", required = false, className = "" }: any) {
  return (
    <div className={className}>
      <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">{label}</label>
      <div className="bg-zinc-50 rounded-xl border border-zinc-100 focus-within:border-indigo-400 focus-within:bg-white transition-all h-12 flex items-center px-4">
         <input
           type={type}
           name={name}
           value={value || ""}
           onChange={(e) => onChange(e.target.value)}
           required={required}
           className="w-full bg-transparent outline-none font-semibold text-zinc-900"
         />
      </div>
    </div>
  );
}

function ShareTab({ key }: { key?: any } = {}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch("/api/contacts");
        const data = await res.json();
        setContacts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const generateVCard = (contact: Contact) => {
    const vCardString = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${contact.lastName};${contact.firstName};;;`,
      `FN:${contact.firstName} ${contact.lastName}`,
      contact.organization ? `ORG:${contact.organization}` : "",
      contact.title ? `TITLE:${contact.title}` : "",
      contact.phone ? `TEL;TYPE=WORK,VOICE:${contact.phone}` : "",
      contact.email ? `EMAIL;TYPE=PREF,INTERNET:${contact.email}` : "",
      contact.address ? `ADR;TYPE=WORK:;;${contact.address};;;;` : "",
      contact.website ? `URL:${contact.website}` : "",
      contact.profileImage ? `PHOTO;VALUE=URI:${contact.profileImage}` : "",
      "END:VCARD"
    ].filter(Boolean).join("\n");
    return vCardString;
  };

  const handleDownload = () => {
    const contact = contacts.find(c => c._id === selectedId);
    if (!contact) return;
    
    const vCard = generateVCard(contact);
    const blob = new Blob([vCard], { type: "text/vcard;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${contact.firstName}_${contact.lastName}.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedContact = contacts.find(c => c._id === selectedId);
  const publicUrl = selectedContact ? `${window.location.origin}/card/${selectedContact._id}` : "";

  if (loading) return <div className="text-center py-20 px-8 bg-white rounded-[2rem] border border-zinc-200"><Loader2 className="animate-spin inline mr-2 text-indigo-600" /> Loading share options...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full"
    >
      <div className="grid grid-cols-12 gap-6 h-full">
        {/* Selection Sidebar Bento */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-[2rem] p-8 border border-zinc-200 shadow-sm flex flex-col">
          <div className="flex items-center gap-4 mb-8">
             <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Share2 className="h-6 w-6" />
             </div>
             <h2 className="text-2xl font-black text-zinc-900">Share Hub</h2>
          </div>
          
          <div className="space-y-6 flex-1">
            <div>
              <label className="block text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-4">Choose Contact</label>
              <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[400px] custom-scrollbar pr-2 text-left">
                {contacts.map(c => (
                  <button
                    key={c._id}
                    onClick={() => setSelectedId(c._id!)}
                    className={cn(
                      "w-full p-4 rounded-2xl flex items-center gap-4 border transition-all text-left group",
                      selectedId === c._id 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100" 
                        : "bg-white border-zinc-100 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 overflow-hidden",
                      selectedId === c._id ? "bg-white/20" : "bg-zinc-100 text-zinc-900"
                    )}>
                      {c.profileImage ? (
                        <img src={c.profileImage} className="w-full h-full object-cover" />
                      ) : (
                        <>{c.firstName[0]}{c.lastName[0]}</>
                      )}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{c.firstName} {c.lastName}</p>
                        <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest opacity-60 truncate",
                            selectedId === c._id ? "text-white" : "text-zinc-400"
                        )}>{c.title || "Contact"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Box Bento */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {selectedContact ? (
            <div className="grid grid-cols-2 gap-6">
               {/* Digital Link Tile */}
               <div className="col-span-2 md:col-span-1 bg-white rounded-[2rem] p-8 border border-zinc-200 shadow-sm flex flex-col">
                  <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-6">Digital Card Link</p>
                  <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100 flex-1 flex flex-col justify-center">
                     <p className="text-zinc-400 text-xs font-medium mb-3">Share this URL via social or messaging apps</p>
                     <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-zinc-100 overflow-hidden">
                        <span className="flex-1 text-xs font-bold text-zinc-500 truncate px-2">{publicUrl}</span>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(publicUrl);
                                alert("Link copied!");
                            }}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                            <Copy className="h-4 w-4" />
                        </button>
                     </div>
                     <Link to={`/card/${selectedContact._id}`} target="_blank" className="mt-6 w-full py-4 bg-zinc-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all text-center">
                        <ExternalLink className="h-4 w-4" />
                        Open Public Card
                     </Link>
                  </div>
               </div>

               {/* QR Code Tile */}
               <div className="col-span-2 md:col-span-1 bg-white rounded-[2rem] p-8 border border-zinc-200 shadow-sm flex flex-col items-center">
                  <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-6 w-full text-left px-1">Quick Scan QR</p>
                  <div className="p-4 bg-white border border-zinc-100 rounded-[2.5rem] shadow-xl shadow-zinc-100 mb-6">
                    <QRCodeSVG value={publicUrl} size={160} />
                  </div>
                  <p className="text-xs font-bold text-zinc-400 text-center max-w-[200px]">Let your client scan this to instantly save your contact</p>
               </div>

               {/* vCard Export Tile */}
               <div className="col-span-2 bg-indigo-600 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl shadow-indigo-100 gap-8">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] backdrop-blur-md flex items-center justify-center shrink-0">
                        <Download className="h-8 w-8 text-white" />
                     </div>
                     <div>
                        <h4 className="text-xl font-black mb-1">Export Static vCard</h4>
                        <p className="text-indigo-100 text-sm opacity-80 max-w-sm">Download the raw contact file compatible with all mobile phone default contacts apps.</p>
                     </div>
                  </div>
                  <button 
                    onClick={handleDownload}
                    className="w-full md:w-auto px-10 py-5 bg-white text-indigo-600 rounded-[1.8rem] font-bold shadow-xl hover:scale-105 transition-all text-sm whitespace-nowrap cursor-pointer"
                  >
                    Generate & Download (.vcf)
                  </button>
               </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-zinc-200 p-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-zinc-50 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner">
                <Users className="h-10 w-10 text-zinc-300" />
              </div>
              <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Select a Contact</h3>
              <p className="text-zinc-500 mt-2 max-w-xs">Pick a contact from the sidebar to view sharing options and digital card assets.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
