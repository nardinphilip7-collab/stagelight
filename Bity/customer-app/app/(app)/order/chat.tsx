import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Image, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { useTranslation } from '../../../hooks/useTranslation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../services/api';

interface ChatMsg { id: string; text: string; fromMe: boolean; time: string }

export default function ChatScreen() {
  const router = useRouter();
  const t = useTranslation();
  const { orderId, bidPrice, providerName, bidId } = useLocalSearchParams<{
    orderId: string;
    bidPrice?: string;
    providerName?: string;
    bidId?: string;
  }>();

  const listRef = useRef<FlatList>(null);
  const [input, setInput] = useState('');

  const QUICK_REPLIES = [t.chatQr1, t.chatQr2, t.chatQr3, t.chatQr4];

  const qc = useQueryClient();
  const { data: msgs = [] } = useQuery({
    queryKey: ['messages', orderId],
    queryFn: () => api.orders.getMessages(orderId),
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => api.orders.sendMessage(orderId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', orderId] });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: (e: any) => {
      if (Platform.OS === 'web') window.alert(e?.message ?? t.error);
      else Alert.alert(t.error, e?.message ?? t.error);
    },
  });

  const acceptMutation = useMutation({
    mutationFn: () => api.bids.accept(bidId!, orderId),
    onSuccess: () => {
      router.replace({ pathname: '/(app)/order/tracking', params: { orderId } });
    },
    onError: (e: any) => {
      if (Platform.OS === 'web') window.alert(e?.message ?? t.error);
      else Alert.alert(t.error, e?.message ?? t.error);
    },
  });

  const send = (text: string) => {
    if (!text.trim()) return;
    sendMutation.mutate(text);
    setInput('');
  };

  // Auto-scroll on new messages
  React.useEffect(() => {
    if (msgs.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 300);
    }
  }, [msgs.length]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#131313', '#1C1B1B']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(app)/(tabs)/orders');
            }} 
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.providerInfo}>
            <View style={styles.avatarBox}>
               <Image source={{ uri: 'https://i.pravatar.cc/100?u=expert' }} style={styles.avatar} />
               <View style={styles.onlineBadge} />
            </View>
            <View>
              <Text style={styles.provName}>{providerName ?? ''}</Text>
              <Text style={styles.onlineText}>{t.chatOnlineNow}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callBtn}>
             <Ionicons name="call" size={20} color={Colors.coral} />
          </TouchableOpacity>
        </View>

        {bidPrice && (
          <View style={styles.negotiationBanner}>
            <View style={styles.negInfo}>
               <Text style={styles.negLabel}>{t.chatCurrentOffer}</Text>
               <Text style={styles.negPrice}>${bidPrice}</Text>
            </View>
            <TouchableOpacity
              style={[styles.acceptBtn, acceptMutation.isPending && { opacity: 0.6 }]}
              onPress={() => { if (bidId) acceptMutation.mutate(); }}
              disabled={acceptMutation.isPending || !bidId}
            >
              <Text style={styles.acceptText}>
                {acceptMutation.isPending ? '...' : t.chatAcceptOffer}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.flex} 
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <FlatList
            ref={listRef}
            data={msgs}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.msgsList}
            renderItem={({ item: msg }) => (
              <View style={[styles.bubble, msg.fromMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, msg.fromMe && styles.bubbleTextMe]}>{msg.text}</Text>
                <View style={styles.bubbleMeta}>
                  <Text style={[styles.bubbleTime, msg.fromMe && styles.bubbleTimeMe]}>
                    {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {msg.fromMe && <Ionicons name="checkmark-done" size={14} color={Colors.textOnPrimary} opacity={0.7} />}
                </View>
              </View>
            )}
          />

          <View style={styles.footerArea}>
             {input.length === 0 && (
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickReplies} contentContainerStyle={styles.quickScroll}>
                 {QUICK_REPLIES.map((r) => (
                   <TouchableOpacity key={r} style={styles.quickChip} onPress={() => send(r)}>
                     <Text style={styles.quickText}>{r}</Text>
                   </TouchableOpacity>
                 ))}
               </ScrollView>
             )}

             <View style={styles.inputRow}>
               <TouchableOpacity style={styles.attachBtn}>
                  <Ionicons name="add" size={24} color={Colors.textSecondary} />
               </TouchableOpacity>
               <TextInput
                 style={styles.input}
                 placeholder={t.chatTypePlaceholder}
                 placeholderTextColor="rgba(255,255,255,0.2)"
                 value={input}
                 onChangeText={setInput}
                 multiline
               />
               <TouchableOpacity 
                 style={[styles.sendBtn, !input.trim() && styles.sendDisabled]} 
                 onPress={() => send(input)}
                 disabled={!input.trim()}
               >
                 <LinearGradient colors={[Colors.coral, Colors.coralDark]} style={styles.sendGrad}>
                   <Ionicons name="send" size={18} color={Colors.textOnPrimary} />
                 </LinearGradient>
               </TouchableOpacity>
             </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex:      { flex: 1 },
  
  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 64, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  providerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarBox: { width: 40, height: 40, borderRadius: 20, position: 'relative' },
  avatar:    { width: '100%', height: '100%', borderRadius: 20 },
  onlineBadge: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, borderWidth: 2, borderColor: '#131313' },
  provName:  { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  onlineText: { color: Colors.success, fontSize: 11, fontWeight: '600' },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },

  /* Negotiation */
  negotiationBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(245,193,0,0.08)', paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(245,193,0,0.2)',
  },
  negInfo:  { gap: 2 },
  negLabel: { color: Colors.coral, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  negPrice: { color: Colors.textPrimary, fontSize: 18, fontWeight: '900' },
  acceptBtn: { backgroundColor: Colors.coral, paddingHorizontal: 16, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  acceptText: { color: Colors.textOnPrimary, fontSize: 11, fontWeight: '900' },

  /* Messages */
  msgsList: { padding: 20, gap: 12 },
  bubble:   { maxWidth: '85%', padding: 16, borderRadius: 24 },
  bubbleMe: { 
    alignSelf: 'flex-end', backgroundColor: Colors.coral, 
    borderBottomRightRadius: 4,
    boxShadow: `0 4px 12px ${Colors.coral}33`,
  },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: 'rgba(31,31,31,0.85)', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  bubbleText: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600', lineHeight: 22 },
  bubbleTextMe: { color: Colors.textOnPrimary },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, justifyContent: 'flex-end' },
  bubbleTime: { color: Colors.textMuted, fontSize: 10, fontWeight: '600' },
  bubbleTimeMe: { color: Colors.textOnPrimary, opacity: 0.7 },

  /* Footer Area */
  footerArea: {
    backgroundColor: 'rgba(19,19,19,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
  },
  quickReplies: { paddingVertical: 12 },
  quickScroll:  { paddingHorizontal: 16, gap: 10 },
  quickChip:    { backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 16, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  quickText:    { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, gap: 10, paddingTop: 4 },
  attachBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 22,
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, color: '#fff', fontSize: 15, fontWeight: '600', maxHeight: 120,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendDisabled: { opacity: 0.5 },
  sendGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
