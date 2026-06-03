import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatUser {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  is_liked: boolean;
  is_deleted: boolean;
}

export interface ConversationPreview {
  id: string;
  otherUser: ChatUser;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

// ─── useConversations ─────────────────────────────────────────────────────────
// Lists all private conversations for the current user.

export function useConversations(currentUserId: string) {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    // 1 — conversation IDs the user participates in
    const { data: mine } = await supabase
      .from('participants')
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (!mine || mine.length === 0) { setLoading(false); return; }

    const convIds = mine.map((r) => r.conversation_id as string);

    // 2 — other participants (user_id only — no FK join possible to profiles)
    const { data: others } = await supabase
      .from('participants')
      .select('conversation_id, user_id')
      .in('conversation_id', convIds)
      .neq('user_id', currentUserId);

    // 3 — fetch profiles for those user_ids explicitly
    const otherUserIds = [...new Set((others ?? []).map((o) => o.user_id as string))];
    const { data: profileRows } = otherUserIds.length > 0
      ? await supabase.from('profiles').select('id, username, avatar_url').in('id', otherUserIds)
      : { data: [] as { id: string; username: string; avatar_url: string | null }[] };

    const profileMap: Record<string, ChatUser> = {};
    for (const p of profileRows ?? []) {
      profileMap[p.id] = { id: p.id, username: p.username ?? '', avatar_url: p.avatar_url };
    }

    // 4 — last message per conversation
    const { data: msgs } = await supabase
      .from('messages')
      .select('conversation_id, content, created_at, is_read, sender_id')
      .in('conversation_id', convIds)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    // — assemble
    const lastMsgMap: Record<string, { content: string; created_at: string; is_read: boolean; sender_id: string }> = {};
    const unreadMap: Record<string, number> = {};
    for (const m of msgs ?? []) {
      if (!lastMsgMap[m.conversation_id]) lastMsgMap[m.conversation_id] = m;
      if (m.sender_id !== currentUserId && !m.is_read) {
        unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] ?? 0) + 1;
      }
    }

    const result: ConversationPreview[] = convIds.map((cid) => {
      const other   = (others ?? []).find((o) => o.conversation_id === cid);
      const profile = other ? (profileMap[other.user_id] ?? { id: other.user_id, username: '', avatar_url: null }) : { id: '', username: '', avatar_url: null };
      const lm = lastMsgMap[cid];
      return {
        id: cid,
        otherUser: profile,
        lastMessage: lm?.content ?? null,
        lastMessageAt: lm?.created_at ?? null,
        unreadCount: unreadMap[cid] ?? 0,
      };
    });

    result.sort((a, b) =>
      (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? '')
    );

    setConversations(result);
    setLoading(false);
  }, [currentUserId]);

  useEffect(() => { load(); }, [load]);

  return { conversations, loading, reload: load };
}

// ─── useMessages ──────────────────────────────────────────────────────────────
// Handles one conversation: fetch, realtime, send, like, delete, read-receipts.

export function useMessages(conversationId: string, currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── fetch ────────────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });
    if (data) setMessages(data as Message[]);
    setLoading(false);
  }, [conversationId]);

  // ── mark all incoming as read ─────────────────────────────────────────────
  const markAsRead = useCallback(async () => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false);
    // reflect locally
    setMessages((prev) =>
      prev.map((m) =>
        m.sender_id !== currentUserId && !m.is_read ? { ...m, is_read: true } : m
      )
    );
  }, [conversationId, currentUserId]);

  // ── send ──────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const { data } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: currentUserId, content: trimmed })
      .select()
      .single();
    if (data) setMessages((prev) => [data as Message, ...prev]);
  }, [conversationId, currentUserId]);

  // ── like (toggle) ─────────────────────────────────────────────────────────
  const likeMessage = useCallback(async (messageId: string, currentlyLiked: boolean): Promise<void> => {
    setMessages((prev) =>
      prev.map((m) => m.id === messageId ? { ...m, is_liked: !currentlyLiked } : m)
    );
    await supabase
      .from('messages')
      .update({ is_liked: !currentlyLiked })
      .eq('id', messageId);
  }, []);

  // ── soft delete ───────────────────────────────────────────────────────────
  const deleteMessage = useCallback(async (messageId: string): Promise<void> => {
    setMessages((prev) =>
      prev.map((m) => m.id === messageId ? { ...m, is_deleted: true } : m)
    );
    await supabase
      .from('messages')
      .update({ is_deleted: true })
      .eq('id', messageId);
  }, []);

  // ── realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMessages().then(markAsRead);

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const incoming = payload.new as Message;
            if (incoming.sender_id !== currentUserId) {
              setMessages((prev) => [{ ...incoming, is_read: true }, ...prev]);
              // mark read on server
              supabase.from('messages').update({ is_read: true }).eq('id', incoming.id);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Message;
            setMessages((prev) => prev.map((m) => m.id === updated.id ? updated : m));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [conversationId, currentUserId, fetchMessages, markAsRead]);

  return { messages, loading, sendMessage, likeMessage, deleteMessage };
}

// ─── useUnreadCount ───────────────────────────────────────────────────────────
// Real-time unread message count for the current user (used by tab badge).

export function useUnreadCount(currentUserId: string): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchCount = async () => {
      // get my conversation ids
      const { data: mine } = await supabase
        .from('participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      const ids = (mine ?? []).map((r) => r.conversation_id as string);
      if (ids.length === 0) { setCount(0); return; }

      const { count: n } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', ids)
        .neq('sender_id', currentUserId)
        .eq('is_read', false)
        .eq('is_deleted', false);

      setCount(n ?? 0);
    };

    fetchCount();

    // subscribe to new messages to keep count live
    const channel = supabase
      .channel(`unread:${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentUserId]);

  return count;
}

// ─── findOrCreateConversation ─────────────────────────────────────────────────

export async function findOrCreateConversation(
  meId: string,
  otherId: string
): Promise<string> {
  // 1 — find existing shared conversation
  const { data: mine, error: mineErr } = await supabase
    .from('participants')
    .select('conversation_id')
    .eq('user_id', meId);

  if (mineErr) throw new Error(`Participants fetch error: ${mineErr.message}`);

  const myIds = (mine ?? []).map((r) => r.conversation_id as string);

  if (myIds.length > 0) {
    const { data: shared } = await supabase
      .from('participants')
      .select('conversation_id')
      .eq('user_id', otherId)
      .in('conversation_id', myIds)
      .limit(1)
      .maybeSingle();

    if (shared) return shared.conversation_id as string;
  }

  // 2 — generate UUID client-side (avoids SELECT-after-INSERT RLS issue)
  const convId = crypto.randomUUID();

  const { error: convErr } = await supabase
    .from('conversations')
    .insert({ id: convId });

  if (convErr) throw new Error(`Conversation insert error: ${convErr.message}`);

  // 3 — insert participants sequentially
  const { error: p1Err } = await supabase
    .from('participants')
    .insert({ conversation_id: convId, user_id: meId });

  if (p1Err) throw new Error(`Participant 1 error: ${p1Err.message}`);

  const { error: p2Err } = await supabase
    .from('participants')
    .insert({ conversation_id: convId, user_id: otherId });

  if (p2Err) throw new Error(`Participant 2 error: ${p2Err.message}`);

  return convId;
}
