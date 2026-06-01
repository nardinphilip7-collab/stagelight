"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { 
  Search, Video, Info, Paperclip, Smile, Send, FileText, ArrowDownToLine, X, 
  MessageCircle, Clock, Calendar, Check, CheckCheck, Play, ArrowLeft
} from "lucide-react";
import Link from "next/link";

interface Message {
  id: number;
  sender: number;
  sender_email: string;
  recipient: number;
  recipient_email: string;
  body: string;
  sent_at: string;
  read: boolean;
}

interface Conversation {
  userId: number;
  email: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  avatarInitials: string;
  role?: string;
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = getUser();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileBase64, setSelectedFileBase64] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [myGigs, setMyGigs] = useState<any[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    opportunity: '',
    amount: '',
    currency: 'USD',
    start_date: '',
    end_date: '',
    message: '',
    submitting: false,
    success: false,
    error: ''
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatCanvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) { router.replace("/login"); return; }
    fetchConversations();
    const int1 = setInterval(fetchConversations, 5000);
    return () => clearInterval(int1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep link: /messages?with=<userId> opens (or starts) a thread with that user.
  useEffect(() => {
    const w = searchParams.get("with");
    if (w && !Number.isNaN(Number(w))) setActiveId(Number(w));
  }, [searchParams]);

  useEffect(() => {
    if (activeId) {
      fetchActiveMessages();
      const int2 = setInterval(fetchActiveMessages, 3000);
      return () => clearInterval(int2);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (chatCanvasRef.current) {
      chatCanvasRef.current.scrollTop = chatCanvasRef.current.scrollHeight;
    }
  }, [activeMessages]);

  async function fetchConversations() {
    try {
      const [messages, gigs] = await Promise.all([
        apiClient.get<Message[]>("/messages/"),
        apiClient.get<any[]>('/opportunities/?mine=true').catch(() => null)
      ]);
      
      if (gigs) setMyGigs(gigs);

      const map = new Map<number, Conversation>();

      const sorted = [...messages].sort(
        (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
      );

      for (const m of sorted) {
        // Prevent user from messaging themselves / skip self messages
        if (String(m.sender) === String(m.recipient)) continue;
        
        const isMine = String(m.sender) === String(currentUser?.user_id);
        const otherId = isMine ? m.recipient : m.sender;
        const otherEmail = isMine ? m.recipient_email : m.sender_email;
        const initials = otherEmail.split("@")[0].slice(0, 2).toUpperCase();
        const name = otherEmail.split("@")[0];

        let msgBody = m.body;
        try {
          if (msgBody.trim().startsWith("{")) {
            const parsed = JSON.parse(msgBody);
            if (parsed && parsed.sl_attachment) {
              const typeLabel = parsed.type === "image" ? "📷 Image" : "📄 Document";
              msgBody = parsed.body ? `${typeLabel} (${parsed.body})` : typeLabel;
            }
          }
        } catch(e){}

        if (!map.has(otherId)) {
          map.set(otherId, {
            userId: otherId,
            email: otherEmail,
            name: name,
            lastMessage: msgBody,
            lastTime: m.sent_at,
            unread: 0,
            avatarInitials: initials,
            role: "Professional",
          });
        }

        if (!m.read && String(m.recipient) === String(currentUser?.user_id)) {
          const existing = map.get(otherId)!;
          map.set(otherId, { ...existing, unread: existing.unread + 1 });
        }
      }

      setConversations(Array.from(map.values()));
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setLoadingList(false);
    }
  }

  async function fetchActiveMessages() {
    if (!activeId) return;
    try {
      const msgs = await apiClient.get<Message[]>(`/messages/?with=${activeId}`);
      setActiveMessages(msgs);
    } catch (error) {
      console.error("Failed to fetch messages for active chat", error);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || (!body.trim() && !selectedFile)) return;
    
    setSending(true);
    try {
      let finalBody = body.trim();
      if (selectedFile && selectedFileBase64) {
        const payload = {
          sl_attachment: true,
          type: selectedFile.type.startsWith("image/") ? "image" : "file",
          name: selectedFile.name,
          url: selectedFileBase64,
          size: selectedFile.size,
          body: body.trim()
        };
        finalBody = JSON.stringify(payload);
      }

      await apiClient.post("/messages/", {
        recipient: activeId,
        body: finalBody,
      });
      
      setBody("");
      setSelectedFile(null);
      setSelectedFileBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchActiveMessages();
      fetchConversations();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // When deep-linked to a user we have no message history with yet, surface a
  // synthetic conversation so the thread pane opens and the first message can be sent.
  const nameParam = searchParams.get("name") || "";
  const syntheticActive: Conversation | null =
    activeId != null && !conversations.some(c => c.userId === activeId)
      ? {
          userId: activeId,
          email: "",
          name: nameParam || "New conversation",
          lastMessage: "Say hello 👋",
          lastTime: new Date().toISOString(),
          unread: 0,
          avatarInitials: (nameParam || "NM").slice(0, 2).toUpperCase(),
          role: "Professional",
        }
      : null;
  const allConversations = syntheticActive ? [syntheticActive, ...conversations] : conversations;

  const filteredConversations = allConversations.filter(conv =>
    conv.email.toLowerCase().includes(search.toLowerCase()) ||
    conv.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeConv = allConversations.find(c => c.userId === activeId);

  // Group active messages by date
  const groupedMessages: { [key: string]: Message[] } = {};
  activeMessages.forEach(msg => {
    const date = new Date(msg.sent_at).toLocaleDateString();
    if (!groupedMessages[date]) groupedMessages[date] = [];
    groupedMessages[date].push(msg);
  });

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-[var(--as-bg)] text-[var(--as-text)] font-outfit" style={{ "--font-body-md": "Outfit", "--font-display-lg": "Syne" } as any}>
      
      <style>{`
        .glass-panel {
            background: rgba(22, 22, 24, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(77, 71, 50, 0.3);
        }
        .spotlight-hover:hover {
            box-shadow: 0 0 15px rgba(233, 196, 0, 0.2);
            border-color: #e9c400;
        }
        ::-webkit-scrollbar {
            width: 4px;
        }
        ::-webkit-scrollbar-track {
            background: #131314;
        }
        ::-webkit-scrollbar-thumb {
            background: #353436;
            border-radius: 10px;
        }
        .active-thread {
            background: rgba(233, 196, 0, 0.1);
            border-left: 3px solid #e9c400;
        }
      `}</style>

      {/* Conversation List (Left) */}
      <section className={`w-full md:w-80 border-r border-[rgba(77,71,50,0.2)] flex flex-col bg-[var(--as-surface)] shrink-0 h-full ${activeId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-[rgba(77,71,50,0.2)]">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#d0c6ab] w-5 h-5" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#353436] border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-[#ffd700] transition-all text-[var(--as-text)] outline-none" 
              placeholder="Search conversations..." 
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map(conv => (
            <div 
              key={conv.userId} 
              onClick={() => setActiveId(conv.userId)}
              className={`p-4 flex gap-4 cursor-pointer transition-all ${activeId === conv.userId ? 'active-thread' : 'hover:bg-[#353436]/30 border-l-4 border-transparent'}`}
            >
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#353436] flex items-center justify-center font-bold text-[#ffd700] border border-[rgba(77,71,50,0.3)]">
                  {conv.avatarInitials}
                </div>
                {conv.unread > 0 && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#1c1b1c] rounded-full"></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-start mb-0.5">
                  <h4 className="font-bold text-[var(--as-text)] truncate">{conv.name}</h4>
                  <span className="text-[10px] text-[#d0c6ab] uppercase tracking-tighter">
                    {new Date(conv.lastTime).toLocaleDateString() === new Date().toLocaleDateString() 
                      ? new Date(conv.lastTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                      : new Date(conv.lastTime).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                  </span>
                </div>
                <p className="text-xs text-[#d0c6ab] truncate">{conv.role}</p>
                <p className={`text-sm truncate mt-1 ${conv.unread > 0 ? 'text-[#e9c400] font-medium' : 'text-[#d0c6ab]'}`}>
                  {conv.lastMessage}
                </p>
              </div>
            </div>
          ))}
          {filteredConversations.length === 0 && (
            <p className="text-center text-sm text-[#d0c6ab] mt-10">No conversations found.</p>
          )}
        </div>
      </section>

      {/* Active Chat (Center) */}
      <section className={`flex-1 flex flex-col h-full bg-[var(--as-bg)] min-w-0 md:min-w-[400px] ${!activeId ? 'hidden md:flex' : 'flex'}`}>
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#d0c6ab] p-6 text-center">
            <MessageCircle className="w-16 h-16 text-[rgba(255,215,0,0.2)] mb-4" />
            <h3 className="font-syne text-2xl font-bold text-[#fff6df] mb-2">StageLight Messages</h3>
            <p className="text-sm">Select a conversation to start messaging or explore the network.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-6 md:px-8 py-5 border-b border-[rgba(77,71,50,0.2)] flex justify-between items-center bg-[rgba(19,19,20,0.5)] backdrop-blur-md shrink-0">
              <div className="flex items-center gap-4">
                <button className="md:hidden text-[#d0c6ab]" onClick={() => setActiveId(null)}>
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h3 className="font-syne text-lg font-bold text-[var(--as-text)]">{activeConv?.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-xs text-[#d0c6ab] font-outfit font-semibold">{activeConv?.role}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Messages Canvas */}
            <div ref={chatCanvasRef} className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6">
              {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date} className="flex flex-col gap-6">
                  <div className="flex justify-center">
                    <span className="bg-[#353436]/30 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest text-[#d0c6ab] font-bold">
                      {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  
                  {dateMessages.map((msg, idx) => {
                    const isMine = String(msg.sender) === String(currentUser?.user_id);
                    const showAvatar = !isMine && (idx === 0 || dateMessages[idx - 1]?.sender !== msg.sender);
                    
                    let attachment: any = null;
                    let isAttachment = false;
                    try {
                      if (msg.body.trim().startsWith("{")) {
                        const parsed = JSON.parse(msg.body);
                        if (parsed && parsed.sl_attachment) {
                          attachment = parsed;
                          isAttachment = true;
                        }
                      }
                    } catch(e){}

                    return (
                      <div key={msg.id} className={`flex gap-4 max-w-[85%] md:max-w-[80%] ${isMine ? 'flex-row-reverse self-end' : ''}`}>
                        {!isMine && (
                          <div className="w-8 shrink-0">
                            {showAvatar && (
                              <div className="w-8 h-8 rounded-full bg-[#353436] flex items-center justify-center font-bold text-[#ffd700] text-xs border border-[rgba(77,71,50,0.3)]">
                                {activeConv?.avatarInitials}
                              </div>
                            )}
                          </div>
                        )}

                        <div className={`flex flex-col gap-2 ${isMine ? 'items-end' : ''}`}>
                          {isAttachment && attachment ? (
                            <div className={`p-2 rounded-2xl border ${isMine ? 'bg-gradient-to-br from-[#544600] to-[#3a3000] border-[#ffd700]/30 rounded-tr-none' : 'glass-panel rounded-tl-none border-[#fff6df]/20'}`}>
                              {attachment.type === "image" ? (
                                <div className="relative aspect-video rounded-xl overflow-hidden mb-2 cursor-pointer group" onClick={() => setLightboxUrl(attachment.url)}>
                                  <img src={attachment.url} className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-500" alt="Attachment" />
                                </div>
                              ) : (
                                <a href={attachment.url} download={attachment.name} className={`p-4 rounded-xl flex items-center gap-4 cursor-pointer transition-all ${isMine ? 'bg-white/10 hover:bg-white/20' : 'bg-[#353436]/50 hover:bg-[#353436]/80'}`}>
                                  <div className={`w-10 h-10 rounded flex items-center justify-center ${isMine ? 'bg-[#ffd700]/20' : 'bg-[#353436]'}`}>
                                    <FileText className={`w-5 h-5 ${isMine ? 'text-[#ffd700]' : 'text-[#fff6df]'}`} />
                                  </div>
                                  <div>
                                    <p className={`text-sm font-bold ${isMine ? 'text-[#fff6df]' : 'text-[var(--as-text)]'}`}>{attachment.name}</p>
                                    <p className={`text-[10px] uppercase tracking-widest ${isMine ? 'text-[#d0c6ab]' : 'text-[#d0c6ab]'}`}>
                                      {(attachment.size / 1024).toFixed(1)} KB
                                    </p>
                                  </div>
                                  <ArrowDownToLine className={`w-5 h-5 transition-colors ${isMine ? 'text-[#ffd700] hover:text-[#fff6df]' : 'text-[#d0c6ab] hover:text-[#fff6df]'}`} />
                                </a>
                              )}
                              {attachment.body && (
                                <p className={`text-sm leading-relaxed px-2 pb-1 text-[var(--as-text)] font-medium`}>
                                  {attachment.body}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className={`p-4 rounded-2xl border ${isMine ? 'bg-gradient-to-br from-[#544600] to-[#3a3000] border-[#ffd700]/30 rounded-tr-none shadow-lg' : 'glass-panel rounded-tl-none border-[#fff6df]/10'}`}>
                              <p className={`text-sm leading-relaxed text-[var(--as-text)] font-medium`}>
                                {msg.body}
                              </p>
                            </div>
                          )}
                          <span className="text-[10px] text-[#d0c6ab] mx-1">
                            {isMine ? (msg.read ? 'Read • ' : 'Sent • ') : `${activeConv?.name} • `} 
                            {new Date(msg.sent_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 md:p-6 border-t border-[rgba(77,71,50,0.2)] bg-[var(--as-bg)] shrink-0">
              
              {selectedFile && (
                <div className="mb-3 p-3 glass-panel rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#ffd700]" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#fff6df] truncate">{selectedFile.name}</p>
                      <p className="text-xs text-[#d0c6ab] font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedFile(null); setSelectedFileBase64(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="p-1 hover:bg-[#353436] rounded-full transition-colors text-[#d0c6ab]">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSend} className="glass-panel rounded-2xl p-2 flex items-end gap-2 focus-within:border-[#fff6df]/50 transition-all">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-[#d0c6ab] hover:text-[#fff6df] transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <textarea 
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-sm text-[var(--as-text)] placeholder-[#d0c6ab]/50 outline-none max-h-32" 
                  placeholder="Type your message..." 
                  rows={1}
                />
                <button type="button" className="p-3 text-[#d0c6ab] hover:text-[#fff6df] transition-colors">
                  <Smile className="w-5 h-5" />
                </button>
                <button 
                  type="submit" 
                  disabled={sending || (!body.trim() && !selectedFile)}
                  className="bg-[#ffd700] text-[#3a3000] p-3 rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        )}
      </section>

      {/* Context Sidebar (Right) - No Mock Data */}
      {activeId && activeConv && (
        <section className="hidden xl:flex w-80 border-l border-[rgba(77,71,50,0.2)] flex-col bg-[var(--as-surface)] shrink-0 h-full">
          <div className="p-6 border-b border-[rgba(77,71,50,0.2)]">
            <h4 className="font-outfit text-xs text-[#d0c6ab] uppercase tracking-widest mb-6 font-semibold">User Context</h4>
            <div className="glass-panel p-5 rounded-xl border-l-4 border-l-[#fff6df] relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-[0.05] rotate-12 group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                <Info className="w-24 h-24" />
              </div>
              <h5 className="font-syne text-lg text-[#fff6df] mb-1 font-bold">{activeConv.name}</h5>
              <p className="text-xs text-[#d0c6ab] leading-relaxed mb-3">{activeConv.email}</p>
              <button 
                onClick={async () => {
                  try {
                    const talents = await apiClient.get<any[]>(`/talents/?owner=${activeConv.userId}`);
                    if (talents && talents.length > 0) {
                      router.push(`/profile/${talents[0].id}`);
                    } else {
                      alert("This user does not have a public talent profile.");
                    }
                  } catch (e) {
                    console.error("Failed to load profile", e);
                  }
                }} 
                className="px-4 py-2 bg-[#353436] hover:bg-[#353436]/80 text-[var(--as-text)] rounded-lg text-xs font-semibold mt-4 transition-colors block w-fit"
              >
                View Profile
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div>
              <h4 className="font-outfit text-xs text-[#d0c6ab] uppercase tracking-widest mb-4 font-semibold">Quick Actions</h4>
              <div className="grid grid-cols-1 gap-3">
                {(currentUser?.role === "HIRER" || currentUser?.role === "AGENCY") && (
                  <button onClick={() => setShowBookingModal(true)} className="flex items-center gap-3 w-full p-3 glass-panel rounded-xl text-sm hover:bg-white/5 text-left transition-all spotlight-hover text-[var(--as-text)]">
                    <Calendar className="w-4 h-4 text-[#fff6df]" />
                    Book {activeConv.name.split(' ')[0]}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Lightbox for attachments */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setLightboxUrl(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setLightboxUrl(null)}>
            <X className="w-8 h-8" />
          </button>
          <img src={lightboxUrl} alt="" className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
      {/* Booking Modal */}
      {showBookingModal && activeConv && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={() => setShowBookingModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#201f20] border border-white/10 rounded-2xl p-6 z-[110] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-syne text-xl text-[#fff6df] font-bold">Book {activeConv.name}</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-[#d0c6ab] hover:text-[#fff6df]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingForm.success && (
              <div className="mb-4 p-3 rounded-lg bg-[#E8F5EF] text-[#1D9E75] text-sm">
                Booking offer sent successfully!
              </div>
            )}
            {bookingForm.error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                {bookingForm.error}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#d0c6ab] mb-1.5 uppercase">Amount</label>
                  <input 
                    type="number" 
                    value={bookingForm.amount}
                    onChange={e => setBookingForm(p => ({ ...p, amount: e.target.value }))}
                    className="w-full bg-[var(--as-bg)] border border-white/10 rounded-lg p-3 text-sm text-[var(--as-text)] focus:border-[#ffd700] outline-none"
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-semibold text-[#d0c6ab] mb-1.5 uppercase">Currency</label>
                  <select 
                    value={bookingForm.currency}
                    onChange={e => setBookingForm(p => ({ ...p, currency: e.target.value }))}
                    className="w-full bg-[var(--as-bg)] border border-white/10 rounded-lg p-3 text-sm text-[var(--as-text)] focus:border-[#ffd700] outline-none"
                  >
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#d0c6ab] mb-1.5 uppercase">Start Date</label>
                  <input 
                    type="date" 
                    value={bookingForm.start_date}
                    onChange={e => setBookingForm(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full bg-[var(--as-bg)] border border-white/10 rounded-lg p-3 text-sm text-[var(--as-text)] focus:border-[#ffd700] outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#d0c6ab] mb-1.5 uppercase">End Date</label>
                  <input 
                    type="date" 
                    value={bookingForm.end_date}
                    onChange={e => setBookingForm(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full bg-[var(--as-bg)] border border-white/10 rounded-lg p-3 text-sm text-[var(--as-text)] focus:border-[#ffd700] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#d0c6ab] mb-1.5 uppercase">Message (Optional)</label>
                <textarea 
                  rows={2}
                  value={bookingForm.message}
                  onChange={e => setBookingForm(p => ({ ...p, message: e.target.value }))}
                  className="w-full bg-[var(--as-bg)] border border-white/10 rounded-lg p-3 text-sm text-[var(--as-text)] focus:border-[#ffd700] outline-none resize-none"
                  placeholder="Include a short message with your offer..."
                />
              </div>

              <button 
                disabled={!bookingForm.amount || bookingForm.submitting}
                onClick={async () => {
                  setBookingForm(p => ({ ...p, submitting: true, error: '', success: false }));
                  try {
                    // 1. Get the talent profile ID for the user we are chatting with
                    const talents = await apiClient.get<any[]>(`/talents/?owner=${activeConv.userId}`);
                    if (!talents || talents.length === 0) {
                      throw new Error('This user does not have a talent profile and cannot be booked.');
                    }
                    const targetTalentId = talents[0].id;

                    // 2. Submit the booking offer using the talent ID
                    await apiClient.post('/bookings/', {
                      to_talent: targetTalentId,
                      amount: bookingForm.amount,
                      currency: bookingForm.currency,
                      message: bookingForm.message,
                      start_date: bookingForm.start_date || null,
                      end_date: bookingForm.end_date || null,
                    });
                    setBookingForm(p => ({ ...p, submitting: false, success: true }));
                    setTimeout(() => setShowBookingModal(false), 2000);
                  } catch (err) {
                    setBookingForm(p => ({ ...p, submitting: false, error: err instanceof Error ? err.message : 'Failed to send offer.' }));
                  }
                }}
                className="w-full mt-4 bg-[#ffd700] text-[#3a3000] font-bold py-3 rounded-xl hover:bg-[#ffc100] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bookingForm.submitting ? 'Sending...' : 'Send Booking Offer'}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-80px)] bg-[var(--as-bg)]" />}>
      <MessagesContent />
    </Suspense>
  );
}