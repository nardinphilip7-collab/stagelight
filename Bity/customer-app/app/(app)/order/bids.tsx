import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../../constants/colors';
import { StitchButton } from '../../../components/ui/StitchButton';
import { api } from '../../../services/api';
import { useTranslation } from '../../../hooks/useTranslation';

const BIDDING_DURATION = 15 * 60;

export default function BidsScreen() {
  const router = useRouter();
  const t = useTranslation();
  const { orderId, orderNumber } = useLocalSearchParams<{ orderId: string; orderNumber: string }>();
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'distance'>('rating');
  const [timeLeft, setTimeLeft] = useState(BIDDING_DURATION);
  const [accepting, setAccepting] = useState(false);

  const { data: bids = [], isLoading } = useQuery({
    queryKey: ['bids', orderId],
    queryFn: () => api.bids.getForOrder(orderId),
    refetchInterval: 5000,
  });

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.wallet.getBalance(),
  });

  const { data: order } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => api.orders.getById(orderId),
    enabled: !!orderId,
  });

  useEffect(() => {
    if (!order) return;
    
    const calculateTimeLeft = () => {
      const created = new Date(order.createdAt).getTime();
      const expires = created + (order.responseWindow || 15) * 60000;
      const now = Date.now();
      const left = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeft(left);
    };

    calculateTimeLeft();
    const t = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(t);
  }, [order]);

  const sorted = [...bids].sort((a, b) => {
    if (sortBy === 'price')    return parseFloat(String(a.price)) - parseFloat(String(b.price));
    if (sortBy === 'rating')   return b.provider.rating - a.provider.rating;
    if (sortBy === 'distance') return (a.provider.distance ?? 99) - (b.provider.distance ?? 99);
    return 0;
  });

  const isCritical = timeLeft < 120;
  const mm = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const ss = (timeLeft % 60).toString().padStart(2, '0');

  const handleAccept = async () => {
    if (!selectedBidId) return;
    
    const bid = bids.find((b) => b.id === selectedBidId);
    if (!bid) return;

    // ── Wallet Balance Check ──
    const balance = Number(wallet?.available || 0);
    const price   = Number(bid.price);

    if (balance < price) {
      Alert.alert(
        t.bidsInsufficientBalance,
        t.bidsInsufficientBalanceBody,
        [
          { text: t.cancel, style: 'cancel' },
          { text: t.bidsRechargeNow, onPress: () => router.push('/(app)/wallet/recharge') },
        ]
      );
      return;
    }

    setAccepting(true);
    try {
      await api.bids.accept(selectedBidId, orderId);
      const bid = bids.find((b) => b.id === selectedBidId);
      router.replace({
        pathname: '/(app)/order/provider-accepted',
        params: {
          orderId,
          orderNumber: orderNumber ?? '',
          bidId: selectedBidId,
          bidPrice: bid?.price.toString() ?? '0',
          providerName: bid?.provider.name ?? '',
          providerRating: bid?.provider.rating.toString() ?? '0',
          providerOrders: bid?.provider.totalOrders.toString() ?? '0',
          providerBadge: bid?.provider.trustBadge ?? 'VERIFIED',
          providerDistance: bid?.provider.distance?.toString() ?? '',
          visitTime: 'As Soon As Possible',
          notes: bid?.notes ?? '',
        },
      });
    } catch {
      Alert.alert(t.bidsError, t.bidsErrorBody);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(app)/(tabs)');
            }} 
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
             <Text style={styles.headerTitle}>{t.bidsLiveOffers}</Text>
             <Text style={styles.headerSub}>{t.bidsRequest}{orderNumber}</Text>
          </View>
          <View style={[styles.timerBox, isCritical && styles.timerBoxCritical]}>
             <Ionicons name="time-outline" size={14} color={isCritical ? Colors.error : Colors.coral} />
             <Text style={[styles.timerText, isCritical && styles.timerTextCritical]}>{mm}:{ss}</Text>
          </View>
        </View>

        {/* Timer Bar */}
        <View style={styles.timerTrack}>
           <View style={[styles.timerFill, { width: `${(timeLeft / BIDDING_DURATION) * 100}%`, backgroundColor: isCritical ? Colors.error : Colors.coral }]} />
        </View>

        {/* ── Sorting ── */}
        <View style={styles.sortBar}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
             {[
               { id: 'rating',   label: t.bidsSortTopRated,    icon: 'star' },
               { id: 'price',    label: t.bidsSortLowestPrice, icon: 'cash-outline' },
               { id: 'distance', label: t.bidsSortClosest,     icon: 'location-outline' },
             ].map((f) => (
               <TouchableOpacity 
                 key={f.id} 
                 style={[styles.sortPill, sortBy === f.id && styles.sortPillActive]}
                 onPress={() => setSortBy(f.id as any)}
               >
                 <Ionicons name={f.icon as any} size={14} color={sortBy === f.id ? Colors.coral : Colors.textMuted} />
                 <Text style={[styles.sortPillText, sortBy === f.id && styles.sortPillTextActive]}>{f.label}</Text>
               </TouchableOpacity>
             ))}
           </ScrollView>
        </View>

        {isLoading || bids.length === 0 ? (
          <View style={styles.emptyWrap}>
             <View style={styles.pulseContainer}>
                <View style={styles.pulseInner} />
                <MaterialCommunityIcons name="radar" size={40} color={Colors.coral} />
             </View>
             <Text style={styles.emptyTitle}>{t.bidsScanning}</Text>
             <Text style={styles.emptyBody}>{t.bidsScanningBody}</Text>
          </View>
        ) : (
          <FlatList
            data={sorted}
            keyExtractor={(b) => b.id}
            contentContainerStyle={styles.list}
            renderItem={({ item: bid }) => (
              <TouchableOpacity
                style={[styles.bidCard, selectedBidId === bid.id && styles.bidCardSelected]}
                onPress={() => setSelectedBidId(bid.id)}
                activeOpacity={0.9}
              >
                <View style={styles.bidTop}>
                   <View style={styles.avatarBox}>
                      <Image source={{ uri: `https://i.pravatar.cc/100?u=${bid.provider.id}` }} style={styles.avatar} />
                      <View style={styles.statusDot} />
                   </View>
                   <View style={styles.bidMain}>
                      <View style={styles.nameRow}>
                         <Text style={styles.providerName}>{bid.provider.name}</Text>
                         <View style={styles.badge}>
                            <Ionicons name="shield-checkmark" size={10} color={Colors.success} />
                            <Text style={styles.badgeText}>{bid.provider.trustBadge}</Text>
                         </View>
                      </View>
                      <View style={styles.metaRow}>
                         <Text style={styles.ratingText}>★ {bid.provider.rating.toFixed(1)}</Text>
                         <Text style={styles.metaDot}>•</Text>
                         <Text style={styles.orderText}>{bid.provider.totalOrders} {t.bidsOrders}</Text>
                         {bid.provider.distance ? (
                           <>
                             <Text style={styles.metaDot}>•</Text>
                             <Text style={styles.distText}>{bid.provider.distance} km</Text>
                           </>
                         ) : null}
                      </View>
                   </View>
                   <View style={styles.priceBox}>
                      <Text style={styles.priceVal}>{bid.price} EGP</Text>
                      <Text style={styles.priceLbl}>{t.bidsOffer}</Text>
                   </View>
                </View>

                {!!bid.notes && (
                  <View style={styles.notesBox}>
                     <Text style={styles.notesText} numberOfLines={2}>"{bid.notes}"</Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                   <TouchableOpacity
                      style={styles.chatBtn}
                      onPress={() => router.push({
                        pathname: '/(app)/order/chat',
                        params: { orderId, bidPrice: bid.price.toString(), providerName: bid.provider.name, bidId: bid.id.toString() },
                      })}
                    >
                      <Ionicons name="chatbubble-ellipses" size={16} color={Colors.coral} />
                      <Text style={styles.chatBtnText}>{t.bidsNegotiate}</Text>
                   </TouchableOpacity>
                   {selectedBidId === bid.id && (
                     <View style={styles.selectionMark}>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.coral} />
                     </View>
                   )}
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* ── Footer Action ── */}
        <View style={styles.footer}>
           <StitchButton
             label={selectedBidId ? t.bidsAcceptSelected : t.bidsWaiting}
             onPress={handleAccept}
             loading={accepting}
             disabled={!selectedBidId}
             icon="checkmark-circle"
           />
        </View>
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
    paddingHorizontal: 16, height: 64,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitleWrap: { flex: 1, paddingLeft: 8 },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  headerSub:   { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  timerBox: { 
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  timerBoxCritical: { borderColor: 'rgba(255,59,48,0.3)', backgroundColor: 'rgba(255,59,48,0.05)' },
  timerText: { color: Colors.coral, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  timerTextCritical: { color: Colors.error },

  timerTrack: { height: 2, backgroundColor: 'rgba(255,255,255,0.03)' },
  timerFill:  { height: '100%' },

  /* Sort Bar */
  sortBar: { paddingVertical: 12 },
  sortScroll: { paddingHorizontal: 16, gap: 10 },
  sortPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  sortPillActive: { backgroundColor: 'rgba(245,193,0,0.1)', borderColor: Colors.coral },
  sortPillText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  sortPillTextActive: { color: Colors.coral },

  /* Empty State */
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  pulseContainer: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  pulseInner: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(245,193,0,0.08)', borderWidth: 2, borderColor: 'rgba(245,193,0,0.2)' },
  emptyTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  emptyBody:  { color: Colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22, opacity: 0.6 },

  /* List */
  list: { paddingHorizontal: 16, paddingBottom: 100, gap: 12 },
  bidCard: {
    backgroundColor: 'rgba(31,31,31,0.85)', borderRadius: 28, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  bidCardSelected: { borderColor: Colors.coral, backgroundColor: 'rgba(245,193,0,0.04)' },
  bidTop: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatarBox: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)' },
  avatar:    { width: '100%', height: '100%' },
  statusDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, borderWidth: 2, borderColor: '#1F1F1F' },
  bidMain: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  providerName: { color: Colors.textPrimary, fontSize: 17, fontWeight: '800' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(52,199,89,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: Colors.success, fontSize: 9, fontWeight: '900' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { color: '#F5C100', fontSize: 12, fontWeight: '800' },
  metaDot: { color: Colors.textMuted, fontSize: 10 },
  orderText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  distText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  priceBox: { alignItems: 'flex-end' },
  priceVal: { color: Colors.coral, fontSize: 24, fontWeight: '900' },
  priceLbl: { color: Colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  notesBox: { marginTop: 16, padding: 12, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12 },
  notesText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18, fontStyle: 'italic', opacity: 0.8 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: 'rgba(245,193,0,0.06)' },
  chatBtnText: { color: Colors.coral, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  selectionMark: {},

  footer: {
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16,
    backgroundColor: 'rgba(19,19,19,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
});
