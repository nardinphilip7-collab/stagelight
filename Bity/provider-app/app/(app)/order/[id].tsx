import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../../constants/colors';
import { SERVICE_CATEGORIES, getCategoryLabel } from '../../../constants/services';
import { api } from '../../../services/api';
import { StitchButton } from '../../../components/ui/StitchButton';
import { useSettingsStore } from '../../../store/settingsStore';

const CAT_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  AC_SERVICES:     { name: 'thermometer-outline',   color: '#4bd6fe', bg: 'rgba(75,214,254,0.12)'  },
  MAINTENANCE:     { name: 'construct-outline',     color: '#F5C100', bg: 'rgba(245,193,0,0.12)'   },
  CLEANING:        { name: 'sparkles-outline',      color: '#4ADE80', bg: 'rgba(74,222,128,0.12)'  },
  LAUNDRY:         { name: 'water-outline',         color: '#60A5FA', bg: 'rgba(96,165,250,0.12)'  },
  BEAUTY:          { name: 'cut-outline',           color: '#F472B6', bg: 'rgba(244,114,182,0.12)' },
  HEALTH_CARE:     { name: 'medkit-outline',        color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  PET_CARE:        { name: 'paw-outline',           color: '#FB923C', bg: 'rgba(251,146,60,0.12)'  },
  TUTORING:        { name: 'book-outline',          color: '#34D399', bg: 'rgba(52,211,153,0.12)'  },
  DIGITAL_SERVICES:{ name: 'laptop-outline',        color: '#38BDF8', bg: 'rgba(56,189,248,0.12)'  },
  CAR_SERVICES:    { name: 'car-outline',           color: '#FBBF24', bg: 'rgba(251,191,36,0.12)'  },
  EVENTS:          { name: 'balloon-outline',       color: '#E879F9', bg: 'rgba(232,121,249,0.12)' },
  HOME_RENOVATION: { name: 'hammer-outline',        color: '#F5C100', bg: 'rgba(245,193,0,0.12)'   },
  ELECTRONICS:     { name: 'tv-outline',            color: '#4bd6fe', bg: 'rgba(75,214,254,0.12)'  },
  PAINTING:        { name: 'brush-outline',         color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  FURNITURE:       { name: 'bed-outline',           color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
};

const DURATION_OPTIONS = [
  { label: '30 MIN', value: 30 },
  { label: '1 HR',   value: 60 },
  { label: '2 HRS',  value: 120 },
  { label: '3 HRS',  value: 180 },
  { label: 'FULL DAY', value: 480 },
];

export default function OrderDetailScreen() {
  const router = useRouter();
  const qc     = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [price, setPrice]       = useState('');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { language } = useSettingsStore();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => api.orders.getById(id),
  });

  const cat  = order ? SERVICE_CATEGORIES.find((c) => c.id === order.category) : null;
  const conf = order ? (CAT_ICONS[order.category] || { name: 'construct-outline', color: Colors.coral, bg: 'rgba(255,255,255,0.05)' }) : null;

  const handleSubmit = async () => {
    const p = parseFloat(price);
    if (!price || isNaN(p) || p <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid amount for your bid.');
      return;
    }
    setSubmitting(true);
    try {
      await api.orders.submitBid(id, p, duration, notes.trim() || undefined);
      await qc.invalidateQueries({ queryKey: ['available-orders'] });
      
      const onSuccess = () => {
        if (router.canGoBack()) router.back();
        else router.replace('/(app)/(tabs)/orders');
      };

      if (Platform.OS === 'web') {
        window.alert('Bid Submitted! We will notify you once the customer reviews and accepts your offer.');
        onSuccess();
      } else {
        Alert.alert('Bid Submitted!', 'We will notify you once the customer reviews and accepts your offer.', [
          { text: 'Got it', onPress: onSuccess },
        ]);
      }
    } catch (e: any) {
      if (Platform.OS === 'web') {
        window.alert(e.message ?? 'Could not send your bid. Please try again.');
      } else {
        Alert.alert('Submission Failed', e.message ?? 'Could not send your bid. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleWithdraw = async () => {
    if (!order?.myBid) return;
    
    const onConfirm = async () => {
      setSubmitting(true);
      try {
        await api.orders.withdrawBid(id, order.myBid!.id);
        await qc.invalidateQueries({ queryKey: ['order-detail', id] });
        await qc.invalidateQueries({ queryKey: ['available-orders'] });
        
        if (Platform.OS === 'web') {
          window.alert('Bid Withdrawn successfully.');
        }
      } catch (e: any) {
        if (Platform.OS === 'web') {
          window.alert(e.message ?? 'Could not withdraw bid.');
        } else {
          Alert.alert('Withdrawal Failed', e.message ?? 'Could not withdraw bid.');
        }
      } finally {
        setSubmitting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to withdraw your bid?')) {
        onConfirm();
      }
    } else {
      Alert.alert('Withdraw Bid', 'Are you sure you want to withdraw your bid?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Withdraw', style: 'destructive', onPress: onConfirm },
      ]);
    }
  };

  if (isLoading || !order || !conf) {
    return (
      <View style={styles.loadingWrap}>
        <View style={styles.loaderBox}>
           <Ionicons name="cog-outline" size={32} color={Colors.coral} />
        </View>
        <Text style={styles.loadingText}>Fetching request details...</Text>
      </View>
    );
  }

  const specs = order.specs ? Object.entries(order.specs) : [];
  
  // Calculate remaining time for a request
  const getRemainingTime = () => {
    const startTime = order.postedAt || order.createdAt;
    if (!startTime) return '0:00';
    
    if (order.requestType === 'SCHEDULED') {
      if (!order.scheduledAt) return 'Scheduled';
      const date = new Date(order.scheduledAt);
      return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    const expiresAt = new Date(startTime).getTime() + (order.responseWindow || 15) * 60000;
    const now = Date.now();
    const diff = expiresAt - now;
    if (diff <= 0) return 'Expired';
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const [tick, setTick] = useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.flex} edges={['top']}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(app)/(tabs)/orders');
                }
              }} 
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Job Opportunity</Text>
            <TouchableOpacity style={styles.shareBtn}>
              <Ionicons name="share-outline" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* ── Job Overview Card ── */}
            <View style={styles.glassCard}>
              <View style={styles.cardTop}>
                <View style={[styles.iconBox, { backgroundColor: conf.bg }]}>
                  <Ionicons name={conf.name} size={28} color={conf.color} />
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.catRow}>
                    <Text style={styles.catName}>{getCategoryLabel(order.category, language)}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: order.requestType === 'SCHEDULED' ? 'rgba(129,140,248,0.1)' : 'rgba(245,193,0,0.1)' }]}>
                      <Text style={[styles.typeBadgeText, { color: order.requestType === 'SCHEDULED' ? '#818CF8' : Colors.coral }]}>
                        {order.requestType === 'SCHEDULED' ? 'SCHEDULED' : 'ON-DEMAND'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.orderNum}>JOB ID #{order.orderNumber}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name={order.requestType === 'SCHEDULED' ? 'calendar-outline' : 'time-outline'} size={12} color={Colors.coral} />
                    <Text style={[styles.metaText, { color: Colors.coral, fontWeight: '700' }]}>
                      {getRemainingTime()}
                    </Text>
                    <View style={styles.metaDot} />
                    <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{`${order.distance ? order.distance.toFixed(1) : '0.0'} km away`}</Text>
                  </View>
                </View>
              </View>

              {order.description && (
                <Text style={styles.description}>{order.description}</Text>
              )}

              {/* Specifications Grid */}
              {specs.length > 0 && (
                <View style={styles.specsGrid}>
                  {specs.map(([key, val]) => (
                    <View key={key} style={styles.specChip}>
                      <Text style={styles.specKey}>{key.toUpperCase()}</Text>
                      <Text style={styles.specVal}>{String(val)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Location Badge */}
              <View style={styles.locationBanner}>
                <Ionicons name="map-outline" size={14} color={Colors.coral} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {order.address}
                </Text>
              </View>
            </View>

            {/* ── Platform Fee Info ── */}
            {!order.myBid && (
              <View style={styles.feeBanner}>
                <Ionicons name="information-circle" size={18} color={Colors.coral} />
                <Text style={styles.feeBody}>
                  Bity Platform Fee: <Text style={styles.feeAmount}>{order.bityFeeProvider || '0.00'} EGP</Text> will be deducted from your payout upon completion.
                </Text>
              </View>
            )}

            {/* ── Bid Submission / Status / Summary ── */}
            <View style={styles.bidSection}>
              {order.status === 'COMPLETED' ? (
                <View style={styles.completedCard}>
                   <View style={styles.completedHeader}>
                      <Ionicons name="checkmark-done-circle" size={24} color={Colors.online} />
                      <Text style={styles.completedTitle}>SERVICE COMPLETE</Text>
                   </View>
                   
                   <View style={styles.summaryBox}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total Earnings</Text>
                        <Text style={styles.summaryVal}>{(order.agreedPrice - (order.bityFeeProvider || 0)).toFixed(2)} EGP</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Base Price</Text>
                        <Text style={styles.summaryVal}>{order.agreedPrice} EGP</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Bity Fee</Text>
                        <Text style={styles.feeVal}>-{(order.bityFeeProvider || 0).toFixed(2)} EGP</Text>
                      </View>
                   </View>

                   {order.rating ? (
                     <View style={styles.feedbackSection}>
                        <Text style={styles.sectionLabel}>CUSTOMER FEEDBACK</Text>
                        <View style={styles.feedbackCard}>
                           <View style={styles.starsRow}>
                              {[1,2,3,4,5].map(s => (
                                <Ionicons key={s} name={s <= order.rating! ? 'star' : 'star-outline'} size={18} color={s <= order.rating! ? '#F5C100' : 'rgba(255,255,255,0.1)'} />
                              ))}
                           </View>
                           {order.review && (
                             <Text style={styles.reviewText}>"{order.review}"</Text>
                           )}
                        </View>
                     </View>
                   ) : (
                     <View style={styles.pendingFeedback}>
                        <Ionicons name="hourglass-outline" size={16} color={Colors.textMuted} />
                        <Text style={styles.pendingText}>Waiting for customer rating...</Text>
                     </View>
                   )}

                   <TouchableOpacity 
                     style={styles.doneBtn} 
                     onPress={() => router.replace('/(app)/(tabs)/orders')}
                   >
                      <Text style={styles.doneBtnText}>BACK TO ORDERS</Text>
                   </TouchableOpacity>
                </View>
              ) : order.myBid ? (
                <View style={styles.bidSubmittedCard}>
                  <View style={styles.bidStatusHeader}>
                    <View style={styles.statusBadge}>
                      <View style={[styles.statusDot, { backgroundColor: order.myBid.status === 'PENDING' ? Colors.gold : Colors.coral }]} />
                      <Text style={styles.statusText}>{order.myBid.status.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.bidTime}>Submitted</Text>
                  </View>
                  
                  <View style={styles.bidDataRow}>
                    <View>
                      <Text style={styles.bidDataLabel}>Price</Text>
                      <Text style={styles.bidDataVal}>{`${order.myBid.price} EGP`}</Text>
                    </View>
                    <View>
                      <Text style={styles.bidDataLabel}>Duration</Text>
                      <Text style={styles.bidDataVal}>{`${order.myBid.estimatedDuration} min`}</Text>
                    </View>
                  </View>
                  
                  {order.myBid.notes && (
                    <View style={styles.bidNotesBox}>
                      <Text style={styles.bidNotesLabel}>Your Note:</Text>
                      <Text style={styles.bidNotesText}>{order.myBid.notes}</Text>
                    </View>
                  )}

                  <View style={styles.waitingBanner}>
                    <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.waitingText}>Waiting for customer approval...</Text>
                  </View>

                  <TouchableOpacity 
                    style={[styles.withdrawBtn, { backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 12, flexDirection: 'row' }]} 
                    onPress={() => router.push({ 
                      pathname: '/(app)/order/chat', 
                      params: { orderId: order.id, customerName: order.customerName } 
                    })}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.coral} style={{ marginRight: 8 }} />
                    <Text style={[styles.withdrawBtnText, { color: Colors.textPrimary }]}>CHAT WITH CUSTOMER</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.withdrawBtn} 
                    onPress={handleWithdraw}
                    disabled={submitting}
                  >
                    <Text style={styles.withdrawBtnText}>WITHDRAW BID</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.bidForm}>
                  <Text style={styles.fieldLabel}>Proposed Price</Text>
                  <View style={styles.inputGroup}>
                    <Text style={styles.currency}>EGP</Text>
                    <TextInput
                      style={styles.priceInput}
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                    />
                  </View>

                  {price !== '' && !isNaN(parseFloat(price)) && (
                    <View style={styles.netPayout}>
                      <Text style={styles.payoutText}>Est. Net Payout:</Text>
                      <Text style={styles.payoutVal}>{(parseFloat(price) - order.bityFeeProvider).toFixed(2)} EGP</Text>
                    </View>
                  )}

                  <Text style={[styles.fieldLabel, { marginTop: 24 }]}>Estimated Duration</Text>
                  <View style={styles.durationRow}>
                    {DURATION_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.durBtn, duration === opt.value && styles.durBtnActive]}
                        onPress={() => setDuration(opt.value)}
                      >
                        <Text style={[styles.durText, duration === opt.value && styles.durTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: 24 }]}>Cover Note (Optional)</Text>
                  <TextInput
                    style={styles.noteInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Introduce yourself or ask a clarifying question..."
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    multiline
                    numberOfLines={3}
                  />

                  <StitchButton
                    label="SUBMIT PROPOSAL"
                    onPress={handleSubmit}
                    loading={submitting}
                    style={{ marginTop: 32 }}
                  />
                </View>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingWrap:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loaderBox:  { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(245,193,0,0.05)', alignItems: 'center', justifyContent: 'center' },
  loadingText:{ color: Colors.textMuted, fontSize: 13, fontWeight: '600' },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 64, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn:  { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  shareBtn: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },

  scroll: { padding: 16, gap: 20, paddingBottom: 60 },

  /* Job Card */
  glassCard: {
    backgroundColor: 'rgba(31,31,31,0.85)', borderRadius: 28, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 20,
  },
  cardTop: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  cardInfo: { flex: 1, gap: 4 },
  iconBox: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  catRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catName:  { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  typeBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  orderNum: { color: Colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaText: { color: Colors.textMuted, fontSize: 12, fontWeight: '500' },
  metaDot:  { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textMuted },
  description: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, opacity: 0.8 },

  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specChip:  {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  specKey: { color: Colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  specVal: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600', marginTop: 2 },

  locationBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(245,193,0,0.06)', borderRadius: 16, padding: 12,
  },
  locationText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', flex: 1 },

  /* Fee Banner */
  feeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(31,31,31,0.85)', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: 'rgba(245,193,0,0.15)',
  },
  feeBody:   { color: Colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },
  feeAmount: { color: Colors.coral, fontWeight: '800' },

  /* Bid Section */
  bidSection: { gap: 16 },
  sectionLabel: { color: Colors.coral, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginLeft: 4 },
  bidForm: {
    backgroundColor: 'rgba(31,31,31,0.85)', borderRadius: 28, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  fieldLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 12 },
  inputGroup: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16, height: 64,
  },
  currency: { color: Colors.coral, fontSize: 16, fontWeight: '800', marginRight: 8 },
  priceInput: { flex: 1, color: Colors.textPrimary, fontSize: 24, fontWeight: '800' },
  
  netPayout: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 },
  payoutText:{ color: Colors.textMuted, fontSize: 13, fontWeight: '500' },
  payoutVal: { color: Colors.online, fontSize: 16, fontWeight: '900' },
  
  completedCard: { backgroundColor: 'rgba(52,211,153,0.05)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(52,211,153,0.1)' },
  completedHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  completedTitle: { color: Colors.online, fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  
  summaryBox: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, gap: 12, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: Colors.textSecondary, fontSize: 13, opacity: 0.7 },
  summaryVal: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  feeVal: { color: Colors.error, fontSize: 15, fontWeight: '700' },
  
  feedbackSection: { marginTop: 10 },
  feedbackCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, gap: 12, marginTop: 10 },
  starsRow: { flexDirection: 'row', gap: 4 },
  reviewText: { color: Colors.textSecondary, fontSize: 14, fontStyle: 'italic', lineHeight: 22 },
  
  pendingFeedback: { flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.5, justifyContent: 'center', paddingVertical: 10 },
  pendingText: { color: Colors.textMuted, fontSize: 13 },
  
  doneBtn: { 
    backgroundColor: 'rgba(255,255,255,0.05)', height: 50, borderRadius: 16, 
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' 
  },
  doneBtnText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '800', letterSpacing: 1 },

  durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  durBtnActive: { backgroundColor: 'rgba(245,193,0,0.1)', borderColor: Colors.coral },
  durText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
  durTextActive: { color: Colors.coral },

  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16,
    color: Colors.textPrimary, fontSize: 14, minHeight: 100, textAlignVertical: 'top',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  
  /* Bid Submitted View Styles */
  bidSubmittedCard: {
    backgroundColor: 'rgba(31,31,31,0.85)', borderRadius: 28, padding: 24,
    borderWidth: 1, borderColor: 'rgba(245,193,0,0.2)', gap: 20,
  },
  bidStatusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: Colors.textPrimary, fontSize: 10, fontWeight: '800' },
  bidTime: { color: Colors.textMuted, fontSize: 12, fontWeight: '500' },
  bidDataRow: { flexDirection: 'row', gap: 40 },
  bidDataLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  bidDataVal: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  bidNotesBox: { 
    backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, 
    borderLeftWidth: 3, borderLeftColor: Colors.coral 
  },
  bidNotesLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 4 },
  bidNotesText: { color: Colors.textSecondary, fontSize: 13, fontStyle: 'italic' },
  waitingBanner: { 
    flexDirection: 'row', alignItems: 'center', gap: 8, 
    backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12 
  },
  waitingText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  withdrawBtn: {
    height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,69,58,0.2)', backgroundColor: 'rgba(255,69,58,0.05)',
    marginTop: 8,
  },
  withdrawBtnText: { color: Colors.error, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
});
