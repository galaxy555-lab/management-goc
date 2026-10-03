/**
 * Forum Diskusi Tim & Video Meeting Workspace
 * Galaxy Orthodontic Center (GOC)
 * Features:
 * - All Team channels, Private per-division channels, Invited channels
 * - GOC AI Assistant Agent (Toggleable Active / Inactive, Clinical & Operational Solutions)
 * - Video Meeting Virtual Room (WebRTC camera/mic controls, in-meeting chat, AI Meeting Summary)
 * - Audio Chime Notification on new incoming messages
 * - Unread message markers & badges
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { playMessageChime, playMeetingRing, isSoundEnabled, setSoundEnabled } from '../lib/audio.ts';
import {
  ForumChannel,
  ForumMessage,
  VideoMeeting,
  EmployeeWithRelations,
  Department,
} from '../types/index.ts';
import {
  MessageSquare,
  Video,
  Sparkles,
  Bot,
  Send,
  Paperclip,
  Smile,
  Users,
  Lock,
  Building2,
  Volume2,
  VolumeX,
  Plus,
  Search,
  CheckCheck,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  Share2,
  Maximize2,
  X,
  Check,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Shield,
  HelpCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

export function Forum() {
  const { session, isOwner, hasPermission } = useAuth();
  const userId = session?.user.id || '';

  // Mobile layout state: 'CHANNELS' (shows channels list on mobile) or 'CHAT' (shows active chat/meeting)
  const [mobileView, setMobileView] = useState<'CHANNELS' | 'CHAT'>('CHANNELS');

  // Channels & Messages State
  const [channels, setChannels] = useState<ForumChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [messages, setMessages] = useState<ForumMessage[]>([]);
  const [loadingChannels, setLoadingChannels] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);

  // Message Input
  const [inputText, setInputText] = useState<string>('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; url: string; type: 'image' | 'file' } | null>(null);

  // Filters & Tabs
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'UNREAD' | 'MEETINGS'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [soundActive, setSoundActive] = useState<boolean>(isSoundEnabled());

  // Video Meetings State
  const [meetings, setMeetings] = useState<VideoMeeting[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<VideoMeeting | null>(null);
  const [meetingMicOn, setMeetingMicOn] = useState<boolean>(true);
  const [meetingCamOn, setMeetingCamOn] = useState<boolean>(true);
  const [meetingScreenSharing, setMeetingScreenSharing] = useState<boolean>(false);
  const [meetingAiSummary, setMeetingAiSummary] = useState<string>('');
  const [meetingSummaryLoading, setMeetingSummaryLoading] = useState<boolean>(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Modals
  const [showCreateChannelModal, setShowCreateChannelModal] = useState<boolean>(false);
  const [showCreateMeetingModal, setShowCreateMeetingModal] = useState<boolean>(false);
  const [allEmployees, setAllEmployees] = useState<EmployeeWithRelations[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);

  // Create Channel Form
  const [newChanForm, setNewChanForm] = useState({
    name: '',
    description: '',
    type: 'ALL_TEAM' as 'ALL_TEAM' | 'DEPARTMENT' | 'PRIVATE_INVITED',
    department_id: '',
    member_ids: [] as string[],
    ai_enabled: true,
  });

  // Create Meeting Form
  const [newMeetingForm, setNewMeetingForm] = useState({
    title: '',
    description: '',
    scheduled_start: new Date().toISOString().slice(0, 16),
    status: 'LIVE' as 'LIVE' | 'SCHEDULED',
  });

  // Track known message IDs for notification chime
  const knownMsgIdsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Channels & Meetings
  const fetchChannelsAndMeetings = useCallback(async () => {
    try {
      const [chansRes, meetsRes] = await Promise.all([
        apiRequest<ForumChannel[]>('/api/forum/channels'),
        apiRequest<VideoMeeting[]>('/api/meetings'),
      ]);
      setChannels(chansRes);
      setMeetings(meetsRes);

      if (!activeChannelId && chansRes.length > 0) {
        setActiveChannelId(chansRes[0].id);
      }
    } catch (err) {
      console.error('Error fetching forum channels:', err);
    } finally {
      setLoadingChannels(false);
    }
  }, [activeChannelId]);

  // Fetch Messages for Active Channel
  const fetchMessages = useCallback(async (chanId: string, isPoll: boolean = false) => {
    if (!chanId) return;
    if (!isPoll) setLoadingMessages(true);
    try {
      const msgs = await apiRequest<ForumMessage[]>(`/api/forum/channels/${chanId}/messages`);
      setMessages(msgs);

      // Play chime if a new incoming message from someone else arrived
      if (isPoll && knownMsgIdsRef.current.size > 0) {
        const newIncoming = msgs.some(
          m => !knownMsgIdsRef.current.has(m.id) && m.sender_id !== userId
        );
        if (newIncoming) {
          playMessageChime();
        }
      }

      knownMsgIdsRef.current = new Set(msgs.map(m => m.id));

      if (!isPoll) {
        // Auto scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (!isPoll) setLoadingMessages(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    fetchChannelsAndMeetings();
    // Load employees and departments for channel member selection
    apiRequest<EmployeeWithRelations[]>('/api/employees?status=ACTIVE').then(setAllEmployees).catch(() => {});
    apiRequest<Department[]>('/api/departments').then(setAllDepartments).catch(() => {});
  }, [fetchChannelsAndMeetings]);

  // Fetch messages when active channel changes
  useEffect(() => {
    if (activeChannelId) {
      fetchMessages(activeChannelId);
      // Mark as read on channel open
      apiRequest(`/api/forum/channels/${activeChannelId}/read`, { method: 'PATCH' }).then(() => {
        setChannels(prev =>
          prev.map(c => (c.id === activeChannelId ? { ...c, unread_count: 0 } : c))
        );
      }).catch(() => {});
    }
  }, [activeChannelId, fetchMessages]);

  // Background polling for messages and channels (every 4 seconds)
  useEffect(() => {
    if (!activeChannelId) return;
    const interval = setInterval(() => {
      fetchMessages(activeChannelId, true);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeChannelId, fetchMessages]);

  // Audio Toggle
  const toggleSound = () => {
    const nextState = !soundActive;
    setSoundActive(nextState);
    setSoundEnabled(nextState);
    if (nextState) {
      playMessageChime();
    }
  };

  // Active Channel Details
  const activeChannel = channels.find(c => c.id === activeChannelId);

  // Toggle AI Agent in Active Channel
  const handleToggleAiAgent = async () => {
    if (!activeChannel) return;
    const nextState = !activeChannel.ai_enabled;
    try {
      await apiRequest(`/api/forum/channels/${activeChannel.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ai_enabled: nextState }),
      });
      setChannels(prev =>
        prev.map(c => (c.id === activeChannel.id ? { ...c, ai_enabled: nextState } : c))
      );
    } catch (err) {
      console.error('Failed to toggle AI Agent:', err);
    }
  };

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent, forceAi: boolean = false) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !attachedFile) || !activeChannelId) return;

    setSendingMessage(true);
    const content = inputText;
    setInputText('');
    const attachment = attachedFile;
    setAttachedFile(null);

    try {
      const res = await apiRequest<{ message: ForumMessage; aiMessage?: ForumMessage }>(
        `/api/forum/channels/${activeChannelId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            content,
            attachment_url: attachment?.url,
            attachment_name: attachment?.name,
            attachment_type: attachment?.type,
            trigger_ai: forceAi,
          }),
        }
      );

      setMessages(prev => {
        const next = [...prev, res.message];
        if (res.aiMessage) next.push(res.aiMessage);
        return next;
      });

      if (res.aiMessage) {
        playMessageChime();
      }

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Direct Ask AI Agent for Solutions
  const handleAskAiAssist = async (customPrompt?: string) => {
    if (!activeChannelId) return;
    setAiGenerating(true);
    try {
      const res = await apiRequest<{ aiMessage: ForumMessage }>(
        `/api/forum/channels/${activeChannelId}/ai-assist`,
        {
          method: 'POST',
          body: JSON.stringify({
            prompt: customPrompt || 'Mohon berikan analisis dan solusi taktis untuk kendala yang sedang dibahas tim di atas.',
          }),
        }
      );
      if (res.aiMessage) {
        setMessages(prev => [...prev, res.aiMessage]);
        playMessageChime();
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error('Failed to get AI assistance:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  // Mark Active Channel As Read
  const handleMarkAsRead = async () => {
    if (!activeChannelId) return;
    try {
      await apiRequest(`/api/forum/channels/${activeChannelId}/read`, { method: 'PATCH' });
      setChannels(prev =>
        prev.map(c => (c.id === activeChannelId ? { ...c, unread_count: 0 } : c))
      );
      setMessages(prev =>
        prev.map(m => ({ ...m, read_by: Array.from(new Set([...(m.read_by || []), userId])) }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Reaction to Message
  const handleReact = async (msgId: string, emoji: string) => {
    try {
      const res = await apiRequest<{ reactions: Record<string, string[]> }>(
        `/api/forum/messages/${msgId}/react`,
        {
          method: 'POST',
          body: JSON.stringify({ emoji }),
        }
      );
      setMessages(prev =>
        prev.map(m => (m.id === msgId ? { ...m, reactions: res.reactions } : m))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Create Channel Submit
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChanForm.name.trim()) return;

    try {
      const created = await apiRequest<ForumChannel>('/api/forum/channels', {
        method: 'POST',
        body: JSON.stringify(newChanForm),
      });
      setChannels(prev => [created, ...prev]);
      setActiveChannelId(created.id);
      setShowCreateChannelModal(false);
      setNewChanForm({
        name: '',
        description: '',
        type: 'ALL_TEAM',
        department_id: '',
        member_ids: [],
        ai_enabled: true,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Create Meeting Submit
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingForm.title.trim()) return;

    try {
      const created = await apiRequest<VideoMeeting>('/api/meetings', {
        method: 'POST',
        body: JSON.stringify({
          ...newMeetingForm,
          channel_id: activeChannelId || undefined,
        }),
      });
      setMeetings(prev => [created, ...prev]);
      setShowCreateMeetingModal(false);
      if (created.status === 'LIVE') {
        startVideoMeeting(created);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Video Meeting Start / Join
  const startVideoMeeting = async (meeting: VideoMeeting) => {
    setActiveMeeting(meeting);
    setMobileView('CHAT');
    playMeetingRing();
    try {
      await apiRequest(`/api/meetings/${meeting.id}`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'join' }),
      });
      // Try to acquire local user camera & microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        mediaStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch {
        // In iframe environments or if blocked, fallback gracefully
      }
    } catch (err) {
      console.error('Failed to join meeting:', err);
    }
  };

  // End / Leave Video Meeting
  const leaveVideoMeeting = async () => {
    if (!activeMeeting) return;
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      await apiRequest(`/api/meetings/${activeMeeting.id}`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'leave' }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setActiveMeeting(null);
      setMeetingAiSummary('');
    }
  };

  // Generate AI Summary for Meeting
  const handleGenerateMeetingAiSummary = async () => {
    if (!activeMeeting) return;
    setMeetingSummaryLoading(true);
    try {
      const res = await apiRequest<{ summary: string }>(
        `/api/meetings/${activeMeeting.id}/ai-summary`,
        { method: 'POST' }
      );
      setMeetingAiSummary(res.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setMeetingSummaryLoading(false);
    }
  };

  // Quick file attachment mock
  const handleAttachMock = (type: 'image' | 'file') => {
    if (type === 'image') {
      setAttachedFile({
        name: 'foto_radiologi_panoramik.jpg',
        url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&auto=format&fit=crop&q=80',
        type: 'image',
      });
    } else {
      setAttachedFile({
        name: 'SOP_Kalibrasi_Autoclave_GOC.pdf',
        url: '#',
        type: 'file',
      });
    }
  };

  // Filtered Channels
  const filteredChannels = channels.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.description?.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (channelFilter === 'UNREAD') {
      return (c.unread_count || 0) > 0;
    }
    return true;
  });

  const allTeamChannels = filteredChannels.filter(c => c.type === 'ALL_TEAM');
  const deptChannels = filteredChannels.filter(c => c.type === 'DEPARTMENT');
  const privateChannels = filteredChannels.filter(c => c.type === 'PRIVATE_INVITED' || c.type === 'DIRECT');

  const totalUnreadCount = channels.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <div className="flex h-[calc(100dvh-8rem)] sm:h-[calc(100vh-5.5rem)] flex-col rounded-2xl sm:rounded-3xl border border-gray-200/80 bg-white shadow-xs overflow-hidden">
      {/* Top Banner Bar */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-[#FDF2F8]/50 px-3 py-2 sm:px-6 sm:py-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-[#800020] text-white shadow-xs">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-black text-gray-900 leading-tight flex items-center gap-1.5 truncate">
              <span className="truncate">Forum Tim & Meeting GOC</span>
              <span className="hidden xs:inline rounded-full bg-[#800020] px-1.5 py-0.2 text-[9px] font-extrabold text-white shrink-0">
                Live
              </span>
            </h2>
            <p className="text-[10px] sm:text-[11px] text-gray-500 hidden sm:block truncate">
              All Team, Ruang Privat Divisi, Video Meeting, & AI Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1 rounded-xl border p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-bold transition-colors ${
              soundActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}
            title={soundActive ? 'Bunyi Notifikasi Aktif' : 'Bunyi Notifikasi Dimatikan'}
          >
            {soundActive ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{soundActive ? 'Suara Aktif' : 'Mute'}</span>
          </button>

          {/* New Channel Button */}
          <button
            onClick={() => setShowCreateChannelModal(true)}
            className="flex items-center gap-1 rounded-xl bg-[#800020] p-1.5 sm:px-3 sm:py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#6A041C] transition-colors"
            title="Buat Channel Baru"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Channel Baru</span>
          </button>

          {/* New Meeting Button */}
          <button
            onClick={() => setShowCreateMeetingModal(true)}
            className="flex items-center gap-1 rounded-xl border border-pink-300 bg-[#FDF2F8] p-1.5 sm:px-3 sm:py-1.5 text-xs font-bold text-[#800020] hover:bg-[#FCE7F3] transition-colors"
            title="Mulai Video Meeting"
          >
            <Video className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Meeting</span>
          </button>
        </div>
      </div>

      {/* Main Split Body: Channels Sidebar + Chat Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Channels & Direct Rooms */}
        <aside className={`w-full md:w-80 shrink-0 border-r border-gray-100 bg-[#F8F9FA] flex flex-col overflow-hidden ${mobileView === 'CHAT' && !activeMeeting ? 'hidden md:flex' : 'flex'}`}>
          {/* Channel Search & Filter Tabs */}
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari channel atau topik..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-xs text-gray-900 focus:border-[#800020] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold">
              <button
                onClick={() => setChannelFilter('ALL')}
                className={`flex-1 py-1 rounded-lg transition-colors text-center ${
                  channelFilter === 'ALL'
                    ? 'bg-[#800020] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                Semua ({channels.length})
              </button>
              <button
                onClick={() => setChannelFilter('UNREAD')}
                className={`flex-1 py-1 rounded-lg transition-colors text-center relative ${
                  channelFilter === 'UNREAD'
                    ? 'bg-[#800020] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                <span>Belum Dibaca</span>
                {totalUnreadCount > 0 && (
                  <span className="ml-1 rounded-full bg-red-500 text-white px-1.5 py-0.2 text-[9px]">
                    {totalUnreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setChannelFilter('MEETINGS')}
                className={`flex-1 py-1 rounded-lg transition-colors text-center ${
                  channelFilter === 'MEETINGS'
                    ? 'bg-[#800020] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                Meeting ({meetings.filter(m => m.status === 'LIVE').length})
              </button>
            </div>
          </div>

          {/* Channels List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {channelFilter === 'MEETINGS' ? (
              /* Meetings Sublist */
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <span>Ruang Video Meeting Virtual</span>
                </div>
                {meetings.length === 0 ? (
                  <p className="text-xs text-gray-400 px-3 py-4 text-center">Belum ada meeting aktif.</p>
                ) : (
                  meetings.map(m => (
                    <div
                      key={m.id}
                      className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-2xs hover:border-[#800020]/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-gray-900 leading-snug line-clamp-1">
                          {m.title}
                        </span>
                        {m.status === 'LIVE' ? (
                          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-extrabold text-red-700 animate-pulse shrink-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                            LIVE
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-600 shrink-0">
                            Jadwal
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{m.description || 'Koordinasi virtual tim'}</p>
                      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-gray-50">
                        <span className="text-[10px] text-gray-400 font-mono">Kode: {m.room_code}</span>
                        <button
                          onClick={() => startVideoMeeting(m)}
                          className="flex items-center gap-1 rounded-lg bg-[#800020] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#6A041C]"
                        >
                          <Video className="h-3 w-3" />
                          <span>Gabung</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* 1. All Team Channels */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <span>👥 Forum Semua Tim (All Team)</span>
                  </div>
                  {allTeamChannels.map(c => {
                    const isActive = c.id === activeChannelId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveChannelId(c.id);
                          setMobileView('CHAT');
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all ${
                          isActive
                            ? 'bg-[#800020] text-white shadow-xs'
                            : 'hover:bg-white text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Users className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[#800020]'}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate leading-tight">{c.name}</p>
                            <p className={`text-[10px] truncate ${isActive ? 'text-pink-100' : 'text-gray-400'}`}>
                              {c.last_message_preview || c.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {c.ai_enabled && (
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isActive ? 'bg-emerald-300' : 'bg-emerald-500'
                              } ring-2 ring-white`}
                              title="Agent AI Aktif"
                            />
                          )}
                          {(c.unread_count || 0) > 0 && (
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[9px] font-extrabold ${
                                isActive ? 'bg-white text-[#800020]' : 'bg-[#800020] text-white'
                              }`}
                            >
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 2. Department Channels */}
                <div className="space-y-1 pt-2">
                  <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <span>🏢 Divisi Tertentu</span>
                  </div>
                  {deptChannels.map(c => {
                    const isActive = c.id === activeChannelId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveChannelId(c.id);
                          setMobileView('CHAT');
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all ${
                          isActive
                            ? 'bg-[#800020] text-white shadow-xs'
                            : 'hover:bg-white text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate leading-tight">{c.name}</p>
                            <p className={`text-[10px] truncate ${isActive ? 'text-pink-100' : 'text-gray-400'}`}>
                              {c.department_name || c.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {c.ai_enabled && (
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isActive ? 'bg-emerald-300' : 'bg-emerald-500'
                              }`}
                              title="Agent AI Aktif"
                            />
                          )}
                          {(c.unread_count || 0) > 0 && (
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[9px] font-extrabold ${
                                isActive ? 'bg-white text-[#800020]' : 'bg-[#800020] text-white'
                              }`}
                            >
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 3. Private / Invited Channels */}
                <div className="space-y-1 pt-2">
                  <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                    <span>🔒 Privat & Khusus (Invited)</span>
                  </div>
                  {privateChannels.map(c => {
                    const isActive = c.id === activeChannelId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveChannelId(c.id);
                          setMobileView('CHAT');
                        }}
                        className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-left transition-all ${
                          isActive
                            ? 'bg-[#800020] text-white shadow-xs'
                            : 'hover:bg-white text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Lock className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-amber-600'}`} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate leading-tight">{c.name}</p>
                            <p className={`text-[10px] truncate ${isActive ? 'text-pink-100' : 'text-gray-400'}`}>
                              {c.description || 'Privat Terbatas'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {c.ai_enabled && (
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isActive ? 'bg-emerald-300' : 'bg-emerald-500'
                              }`}
                              title="Agent AI Aktif"
                            />
                          )}
                          {(c.unread_count || 0) > 0 && (
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[9px] font-extrabold ${
                                isActive ? 'bg-white text-[#800020]' : 'bg-[#800020] text-white'
                              }`}
                            >
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Right Area: Active Chat or Full Video Meeting */}
        <section className={`flex-1 flex flex-col bg-white overflow-hidden ${mobileView === 'CHANNELS' && !activeMeeting ? 'hidden md:flex' : 'flex'}`}>
          {activeMeeting ? (
            /* Interactive Virtual Video Meeting Room Interface */
            <div className="flex-1 flex flex-col bg-gray-900 text-white overflow-hidden">
              {/* Meeting Top Bar */}
              <div className="flex items-center justify-between px-6 py-3 bg-gray-800/80 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white animate-pulse">
                    <Video className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{activeMeeting.title}</span>
                      <span className="rounded-full bg-red-500/20 text-red-400 px-2 py-0.5 text-[10px] font-bold border border-red-500/30">
                        LIVE ROOM
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-400 font-mono">Kode Ruang: {activeMeeting.room_code}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateMeetingAiSummary}
                    disabled={meetingSummaryLoading}
                    className="flex items-center gap-1.5 rounded-xl bg-[#800020] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#991D3C] transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    <span>{meetingSummaryLoading ? 'Menganalisis...' : 'Rangkuman Solusi AI'}</span>
                  </button>

                  <button
                    onClick={leaveVideoMeeting}
                    className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/30"
                  >
                    <PhoneOff className="h-3.5 w-3.5" />
                    <span>Keluar Meeting</span>
                  </button>
                </div>
              </div>

              {/* Video Grid & Meeting AI Box */}
              <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto">
                {/* 1. Local User Video */}
                <div className="relative rounded-2xl bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center min-h-56">
                  {meetingCamOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="text-center">
                      <img
                        src={session?.user.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt="Local User"
                        className="h-16 w-16 mx-auto rounded-full object-cover border-2 border-[#800020]"
                      />
                      <p className="text-xs text-gray-400 mt-2">Kamera Dimatikan</p>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold">
                    <span>{session?.user.full_name} (Anda)</span>
                    {!meetingMicOn && <MicOff className="h-3 w-3 text-red-400" />}
                  </div>
                </div>

                {/* 2. Drg. Ervina (Simulated Stream) */}
                <div className="relative rounded-2xl bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center min-h-56 group">
                  <img
                    src="https://images.unsplash.com/photo-1594824813576-96b63d91cf37?w=600&auto=format&fit=crop&q=80"
                    alt="drg. Ervina"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500/80 px-2 py-0.5 rounded text-[9px] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    Bicara
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold">
                    <span>drg. Ervina Dewiyanti, Sp.Ort.</span>
                  </div>
                </div>

                {/* 3. Hendri Kurniawan (Owner / Super Admin) */}
                <div className="relative rounded-2xl bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center min-h-56">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"
                    alt="Hendri Kurniawan"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold">
                    <span>Hendri Kurniawan, ST., MMSI (Owner)</span>
                  </div>
                </div>

                {/* 4. AI Meeting Scribe Panel (if generated) */}
                {meetingAiSummary && (
                  <div className="col-span-full rounded-2xl bg-gray-800/90 border border-pink-500/40 p-4 shadow-xl text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                      <div className="flex items-center gap-2 text-pink-300 font-bold">
                        <Sparkles className="h-4 w-4" />
                        <span>Notulensi & Solusi Rapat GOC (AI Assistant)</span>
                      </div>
                      <button onClick={() => setMeetingAiSummary('')} className="text-gray-400 hover:text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-gray-200 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto pr-2">
                      {meetingAiSummary}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Meeting Controls */}
              <div className="h-16 bg-gray-800/90 border-t border-gray-700 flex items-center justify-center gap-3 px-4">
                <button
                  onClick={() => setMeetingMicOn(!meetingMicOn)}
                  className={`h-10 w-10 flex items-center justify-center rounded-xl transition-colors ${
                    meetingMicOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                  title={meetingMicOn ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {meetingMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>

                <button
                  onClick={() => setMeetingCamOn(!meetingCamOn)}
                  className={`h-10 w-10 flex items-center justify-center rounded-xl transition-colors ${
                    meetingCamOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                  title={meetingCamOn ? 'Matikan Kamera' : 'Nyalakan Kamera'}
                >
                  {meetingCamOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>

                <button
                  onClick={() => setMeetingScreenSharing(!meetingScreenSharing)}
                  className={`h-10 w-10 flex items-center justify-center rounded-xl transition-colors ${
                    meetingScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                  title="Bagikan Layar (Screen Share)"
                >
                  <Share2 className="h-5 w-5" />
                </button>

                <button
                  onClick={leaveVideoMeeting}
                  className="h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 ml-2"
                >
                  <PhoneOff className="h-4 w-4" />
                  <span>Akhiri Panggilan</span>
                </button>
              </div>
            </div>
          ) : activeChannel ? (
            /* Active Channel Chat Workspace */
            <>
              {/* Channel Header Bar */}
              <div className="flex items-center justify-between border-b border-gray-100 bg-white px-3 py-2 sm:px-6 sm:py-3 shadow-2xs gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Mobile Back to Channels Button */}
                  <button
                    onClick={() => setMobileView('CHANNELS')}
                    className="md:hidden flex items-center justify-center h-8 w-8 rounded-xl bg-pink-50 text-[#800020] hover:bg-pink-100 border border-pink-200 shrink-0"
                    title="Kembali ke Daftar Channel"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                        {activeChannel.name}
                      </h3>
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-gray-600 shrink-0">
                        {activeChannel.type === 'ALL_TEAM'
                          ? 'All Team'
                          : activeChannel.type === 'DEPARTMENT'
                          ? 'Divisi'
                          : 'Privat'}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 truncate mt-0.5 hidden xs:block">
                      {activeChannel.description || 'Ruang diskusi internal GOC'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  {/* AI Agent Status & Toggle Switch */}
                  <div className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-gray-200 bg-gray-50/80 px-2 py-1">
                    <Bot className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${activeChannel.ai_enabled ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className="text-[11px] font-bold text-gray-700 hidden lg:inline">
                      Agent AI:
                    </span>

                    <button
                      onClick={handleToggleAiAgent}
                      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        activeChannel.ai_enabled ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}
                      title={activeChannel.ai_enabled ? 'Agent AI Aktif' : 'Agent AI Nonaktif'}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          activeChannel.ai_enabled ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    <span className={`text-[9px] sm:text-[10px] font-extrabold hidden md:inline ${activeChannel.ai_enabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {activeChannel.ai_enabled ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>

                  {/* Ask AI Solution Button */}
                  {activeChannel.ai_enabled && (
                    <button
                      onClick={() => handleAskAiAssist()}
                      disabled={aiGenerating}
                      className="flex items-center gap-1 rounded-xl bg-pink-50 border border-pink-200 px-2 sm:px-2.5 py-1 text-xs font-bold text-[#800020] hover:bg-pink-100 transition-colors"
                      title="Minta Rekomendasi / Solusi dari Agent AI berdasarkan diskusi"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span className="hidden sm:inline">{aiGenerating ? '...' : 'Solusi AI'}</span>
                    </button>
                  )}

                  {/* Quick Video Meeting from this Channel */}
                  <button
                    onClick={() => {
                      const instantMeeting: VideoMeeting = {
                        id: `meet-inst-${Date.now().toString(36)}`,
                        title: `Meeting Ruang: ${activeChannel.name}`,
                        host_id: userId,
                        host_name: session?.user.full_name || 'Staff',
                        channel_id: activeChannel.id,
                        status: 'LIVE',
                        room_code: `GOC-${Math.floor(100 + Math.random() * 900)}`,
                        participant_ids: [userId],
                        invited_ids: activeChannel.member_ids,
                        created_at: new Date().toISOString(),
                      };
                      startVideoMeeting(instantMeeting);
                    }}
                    className="flex items-center gap-1 rounded-xl bg-[#800020] px-2 sm:px-2.5 py-1 text-xs font-bold text-white hover:bg-[#6A041C] transition-colors"
                    title="Mulai Video Meeting untuk Channel ini"
                  >
                    <Video className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Meeting</span>
                  </button>

                  {/* Mark As Read */}
                  <button
                    onClick={handleMarkAsRead}
                    className="text-gray-400 hover:text-gray-600 p-1 sm:p-1.5 rounded-lg"
                    title="Tandai semua pesan telah dibaca"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-linear-to-b from-[#FDF2F8]/20 to-white">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#800020] border-t-transparent" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                    <MessageSquare className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="text-xs font-semibold">Belum ada percakapan dalam channel ini.</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Kirim pesan pertama atau panggil Agent AI untuk memulai kolaborasi.
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isSelf = m.sender_id === userId;
                    const isAi = m.is_ai;
                    const hasUnread = !m.read_by?.includes(userId) && !isSelf;

                    // Unread separator marker
                    const showUnreadDivider =
                      hasUnread && (idx === 0 || messages[idx - 1].read_by?.includes(userId));

                    return (
                      <React.Fragment key={m.id}>
                        {showUnreadDivider && (
                          <div className="my-3 flex items-center gap-3">
                            <div className="h-px flex-1 bg-red-300" />
                            <span className="rounded-full bg-red-100 px-3 py-0.5 text-[10px] font-black text-red-700 tracking-wide">
                              🔴 PESAN BELUM DIBACA
                            </span>
                            <div className="h-px flex-1 bg-red-300" />
                          </div>
                        )}

                        <div
                          className={`flex items-start gap-3 group ${
                            isSelf ? 'flex-row-reverse' : ''
                          }`}
                        >
                          {/* Avatar */}
                          <div className="shrink-0 mt-0.5">
                            {isAi ? (
                              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-300">
                                <Bot className="h-5 w-5" />
                              </div>
                            ) : (
                              <img
                                src={m.sender_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                alt={m.sender_name}
                                className="h-9 w-9 rounded-full object-cover border border-gray-200"
                              />
                            )}
                          </div>

                          {/* Message Bubble Container */}
                          <div
                            className={`max-w-xl min-w-[200px] flex flex-col ${
                              isSelf ? 'items-end' : 'items-start'
                            }`}
                          >
                            {/* Sender Info */}
                            <div className="flex items-center gap-2 mb-1 px-1 text-[11px]">
                              <span className="font-bold text-gray-800">
                                {isSelf ? 'Anda' : m.sender_name}
                              </span>
                              {isAi ? (
                                <span className="rounded-md bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[9px] font-black">
                                  AI ASSISTANT
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400">
                                  {m.sender_role}
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 font-mono">
                                {new Date(m.created_at).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            {/* Bubble Body */}
                            <div
                              className={`rounded-2xl p-3.5 text-xs shadow-2xs leading-relaxed ${
                                isAi
                                  ? 'bg-gradient-to-r from-emerald-50/90 to-teal-50/80 border border-emerald-200 text-gray-800 rounded-tl-none'
                                  : isSelf
                                  ? 'bg-[#800020] text-white rounded-tr-none shadow-sm'
                                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                              }`}
                            >
                              <div className="whitespace-pre-line">{m.content}</div>

                              {/* Attachment if present */}
                              {m.attachment_url && (
                                <div className="mt-2.5 pt-2 border-t border-gray-200/50">
                                  {m.attachment_type === 'image' ? (
                                    <div className="rounded-xl overflow-hidden border border-gray-200 max-w-xs">
                                      <img
                                        src={m.attachment_url}
                                        alt={m.attachment_name || 'Lampiran'}
                                        className="w-full h-auto object-cover max-h-48"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-2 text-[11px] font-bold text-gray-700">
                                      <FileText className="h-4 w-4 text-[#800020]" />
                                      <span className="truncate">{m.attachment_name || 'Dokumen.pdf'}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Reactions & Reaction Triggers */}
                              <div className="mt-2 flex items-center justify-between gap-2 pt-1">
                                <div className="flex flex-wrap gap-1">
                                  {m.reactions &&
                                    Object.entries(m.reactions).map(([emoji, userList]) => {
                                      if (userList.length === 0) return null;
                                      const isReacted = userList.includes(userId);
                                      return (
                                        <button
                                          key={emoji}
                                          onClick={() => handleReact(m.id, emoji)}
                                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                                            isReacted
                                              ? 'bg-pink-100 border-pink-300 text-[#800020]'
                                              : 'bg-white/80 border-gray-200 text-gray-600 hover:bg-gray-100'
                                          }`}
                                        >
                                          <span>{emoji}</span>
                                          <span>{userList.length}</span>
                                        </button>
                                      );
                                    })}
                                </div>

                                {/* Emoji Reaction Bar on Hover */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {['👍', '❤️', '👏', '🦷', '💡'].map(emo => (
                                    <button
                                      key={emo}
                                      onClick={() => handleReact(m.id, emo)}
                                      className="hover:scale-125 transition-transform text-xs p-0.5"
                                      title={`Beri reaksi ${emo}`}
                                    >
                                      {emo}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input & Smart Assist Toolbar */}
              <div className="border-t border-gray-100 bg-white p-3 sm:p-4 space-y-2">
                {/* Attached File Preview */}
                {attachedFile && (
                  <div className="flex items-center justify-between rounded-xl bg-pink-50 border border-pink-200 px-3 py-1.5 text-xs text-[#800020]">
                    <div className="flex items-center gap-2">
                      {attachedFile.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      <span className="font-bold truncate max-w-xs">{attachedFile.name}</span>
                    </div>
                    <button onClick={() => setAttachedFile(null)} className="text-gray-400 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* AI Prompt Chips & Shortcuts */}
                {activeChannel.ai_enabled && (
                  <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-bold text-gray-600 scrollbar-none pb-0.5">
                    <span className="text-[#800020] flex items-center gap-1 shrink-0">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      Tanya AI:
                    </span>
                    <button
                      onClick={() => handleAskAiAssist('Bagaimana SOP penanganan bracket kawat gigi lepas atau menusuk pipi pasien?')}
                      className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 hover:border-pink-300 hover:text-[#800020] shrink-0"
                    >
                      🦷 SOP Kawat/Bracket Lepas
                    </button>
                    <button
                      onClick={() => handleAskAiAssist('Berikan tips komunikasi ramah saat pasien menunggu antrean lebih dari 15 menit.')}
                      className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 hover:border-pink-300 hover:text-[#800020] shrink-0"
                    >
                      ⏱️ Komunikasi Pasien Antre
                    </button>
                    <button
                      onClick={() => handleAskAiAssist('Apa ide konten edukasi aligner & behel transparan untuk media sosial minggu ini?')}
                      className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 hover:border-pink-300 hover:text-[#800020] shrink-0"
                    >
                      📢 Ide Konten Edukasi
                    </button>
                  </div>
                )}

                {/* Main Text Input & Actions */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAttachMock('image')}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-[#800020] rounded-xl hover:bg-gray-100 transition-colors"
                      title="Lampirkan Gambar / Foto Pasien"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAttachMock('file')}
                      className="p-1.5 sm:p-2 text-gray-400 hover:text-[#800020] rounded-xl hover:bg-gray-100 transition-colors"
                      title="Lampirkan Dokumen SOP"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder={
                      activeChannel.ai_enabled
                        ? `Ketik pesan (atau sebut @AI)...`
                        : `Ketik pesan ke ${activeChannel.name}...`
                    }
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    className="flex-1 min-w-0 rounded-2xl border border-gray-200 px-3 py-2 sm:px-4 text-xs sm:text-sm text-gray-900 focus:border-[#800020] focus:outline-hidden"
                  />

                  {/* Ask AI Tag Quick Button */}
                  {activeChannel.ai_enabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputText(prev => (prev ? `${prev} @AI` : '@AI Mohon solusi untuk '));
                      }}
                      className="px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] sm:text-xs font-bold shrink-0"
                      title="Sebut @AI"
                    >
                      @AI
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={sendingMessage || (!inputText.trim() && !attachedFile)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#800020] text-white hover:bg-[#6A041C] disabled:opacity-40 transition-all shadow-xs"
                    title="Kirim Pesan (Enter)"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-gray-400">
              <MessageSquare className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-700">Pilih Channel Diskusi</p>
              <p className="text-xs text-gray-400 mt-1">Pilih channel di bilah kiri untuk memulai percakapan tim.</p>
            </div>
          )}
        </section>
      </div>

      {/* Modal: Create Channel */}
      {showCreateChannelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#800020]" />
                <span>Buat Channel Diskusi Baru</span>
              </h3>
              <button onClick={() => setShowCreateChannelModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Nama Channel *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: #evaluasi-alat-ortho atau Diskusi VIP"
                  value={newChanForm.name}
                  onChange={e => setNewChanForm({ ...newChanForm, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-gray-900 focus:border-[#800020] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Deskripsi Channel</label>
                <textarea
                  rows={2}
                  placeholder="Tujuan diskusi channel ini..."
                  value={newChanForm.description}
                  onChange={e => setNewChanForm({ ...newChanForm, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-gray-900 focus:border-[#800020] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Tipe Hak Akses Channel</label>
                <select
                  value={newChanForm.type}
                  onChange={e =>
                    setNewChanForm({
                      ...newChanForm,
                      type: e.target.value as 'ALL_TEAM' | 'DEPARTMENT' | 'PRIVATE_INVITED',
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-gray-900 focus:border-[#800020] focus:outline-hidden font-medium"
                >
                  <option value="ALL_TEAM">👥 Semua Tim (All Team - Seluruh Karyawan)</option>
                  <option value="DEPARTMENT">🏢 Divisi Tertentu (Khusus Divisi Terpilih)</option>
                  <option value="PRIVATE_INVITED">🔒 Privat & Terbatas (Hanya Anggota Diundang)</option>
                </select>
              </div>

              {newChanForm.type === 'DEPARTMENT' && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Pilih Divisi</label>
                  <select
                    value={newChanForm.department_id}
                    onChange={e => setNewChanForm({ ...newChanForm, department_id: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-gray-900 focus:border-[#800020] focus:outline-hidden"
                  >
                    <option value="">-- Pilih Divisi --</option>
                    {allDepartments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {newChanForm.type === 'PRIVATE_INVITED' && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Undang Anggota Spesifik</label>
                  <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1.5">
                    {allEmployees.map(emp => {
                      if (!emp.user_id) return null;
                      const checked = newChanForm.member_ids.includes(emp.user_id);
                      return (
                        <label
                          key={emp.id}
                          className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? newChanForm.member_ids.filter(id => id !== emp.user_id)
                                : [...newChanForm.member_ids, emp.user_id!];
                              setNewChanForm({ ...newChanForm, member_ids: next });
                            }}
                            className="rounded border-gray-300 text-[#800020] focus:ring-[#800020]"
                          />
                          <span className="text-gray-800 font-medium">
                            {emp.full_name} ({emp.position?.name || 'Staff'})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Agent AI Toggle */}
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-emerald-900">Aktifkan GOC AI Assistant</p>
                    <p className="text-[11px] text-emerald-700">Membantu memberikan solusi SOP klinis & operasional</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newChanForm.ai_enabled}
                  onChange={e => setNewChanForm({ ...newChanForm, ai_enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateChannelModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#800020] px-4 py-2 font-bold text-white hover:bg-[#6A041C]"
                >
                  Buat Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Meeting */}
      {showCreateMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Video className="h-5 w-5 text-[#800020]" />
                <span>Buat Ruang Video Meeting</span>
              </h3>
              <button onClick={() => setShowCreateMeetingModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Judul Meeting *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Evaluasi Pasien Orthodonti & Kasus Kompleks"
                  value={newMeetingForm.title}
                  onChange={e => setNewMeetingForm({ ...newMeetingForm, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-gray-900 focus:border-[#800020] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Agenda / Deskripsi</label>
                <textarea
                  rows={2}
                  placeholder="Topik pembahasan meeting..."
                  value={newMeetingForm.description}
                  onChange={e => setNewMeetingForm({ ...newMeetingForm, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-gray-900 focus:border-[#800020] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Status Pelaksanaan</label>
                <select
                  value={newMeetingForm.status}
                  onChange={e =>
                    setNewMeetingForm({
                      ...newMeetingForm,
                      status: e.target.value as 'LIVE' | 'SCHEDULED',
                    })
                  }
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-gray-900 focus:border-[#800020] focus:outline-hidden font-medium"
                >
                  <option value="LIVE">🔴 Langsung Mulai Sekarang (LIVE Room)</option>
                  <option value="SCHEDULED">📅 Jadwalkan Nanti</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateMeetingModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 font-bold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#800020] px-4 py-2 font-bold text-white hover:bg-[#6A041C]"
                >
                  {newMeetingForm.status === 'LIVE' ? 'Mulai Sekarang' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
