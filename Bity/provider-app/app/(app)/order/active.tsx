import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '../../../constants/colors';
import { SERVICE_CATEGORIES, getCategoryLabel } from '../../../constants/services';
import { api } from '../../../services/api';
import { StitchButton } from '../../../components/ui/StitchButton';
import QRDisplay from '../../../components/order/QRDisplay';
import type { OrderStatus } from '../../../types';
import { useSettingsStore } from '../../../store/settingsStore';
import { useTranslation } from '../../../hooks/useTranslation';

const CAT_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  AC_SERVICES:     { name: 'thermometer-outline',   color: '#4bd6fe', bg: 'rgba(75,214,254,0.12)'  },
  MAINTENANCE:     { name: 'construct-outline',     color: '#F5C100', bg: 'rgba(245,193,0,0.12)'   },
  CLEANING:        { name: 'sparkles-outline',      color: '#4ADE80', bg: 'rgba(74,222,128,0.12)'  },
  ELECTRONICS:     { name: 'tv-outline',            color: '#4bd6fe', bg: 'rgba(75,214,254,0.12)'  },
  HOME_RENOVATION: { name: 'hammer-outline',        color: '#F5C100', bg: 'rgba(245,193,0,0.12)'   },
  PAINTING:        { name: 'brush-outline',         color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  FURNITURE:       { name: 'bed-outline',           color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
};

export default function ActiveOrderScreen() {
  const router    = useRouter();
  const qc        = useQueryClient();
  const { language } = useSettingsStore();
  const t         = useTranslation();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [updating, setUpdating] = useState(false);
  const [showQR, setShowQR]     = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const STATUS_STEPS: { status: OrderStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { status: 'ACCEPTED',    label: t.statusAccepted,    icon: 'checkmark-circle-outline' as const },
    { status: 'IN_PROGRESS', label: t.statusAtCustomer,  icon: 'location-outline' as const },
    { status: 'STARTED',     label: t.statusWorkStarted, icon: 'construct-outline' as const },
    { status: 'COMPLETED',   label: t.statusJobFinished, icon: 'trophy-outline' as const },
  ];

  const NEXT_STATUS: Record<string, { status: OrderStatus; label: string }> = {
    ACCEPTED:      { status: 'IN_PROGRESS', label: t.actionArrived },
    PICKUP_ON_WAY: { status: 'IN_PROGRESS', label: t.actionArrived },
    PICKED_UP:     { status: 'IN_PROGRESS', label: t.actionReadyToStart },
    IN_PROGRESS:   { status: 'IN_PROGRESS', label: t.actionShowQr },
    STARTED:       { status: 'COMPLETED',   label: t.actionFinishGetOtp },
  };

  const { data: order, isLoading } = useQuery({
    queryKey: ['active-order-detail', orderId],
    queryFn: () => api.orders.getById(orderId),
  });

  // Auto-open QR modal whenever order reaches IN_PROGRESS
  useEffect(() => {
    if (order?.status === 'IN_PROGRESS') {
      setShowQR(true);
    }
  }, [order?.status]);

  // Navigate to dashboard when job is fully complete (order disappears from active)
  useEffect(() => {
    if (!isLoading && order === null) {
      qc.invalidateQueries({ queryKey: ['order-history'] });
      router.replace('/(app)/(tabs)');
    }
  }, [isLoading, order]);

  const handleCancel = () => {
    if (!order) return;

    const onConfirm = async () => {
      setCancelling(true);
      try {
        await api.orders.cancel(order.id);
        await qc.invalidateQueries({ queryKey: ['active-order'] });
        router.replace('/(app)/(tabs)');
      } catch (e: any) {
        if (Platform.OS === 'web') window.alert(e.message ?? t.couldNotCancel);
        else Alert.alert(t.errorTitle ?? 'Error', e.message ?? t.couldNotCancel);
      } finally {
        setCancelling(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t.cancelJobBody)) {
        onConfirm();
      }
      return;
    }

    Alert.alert(
      t.cancelJobTitle,
      t.cancelJobBody,
      [
        { text: t.cancelNo, style: 'cancel' },
        { text: t.cancelYes, onPress: onConfirm, style: 'destructive' }
      ]
    );
  };

  const cat  = order ? SERVICE_CATEGORIES.find((c) => c.id === order.category) : null;
  const conf = order ? (CAT_ICONS[order.category] || { name: 'construct-outline', color: Colors.coral, bg: 'rgba(255,255,255,0.05)' }) : null;

  const currentStepIdx = order ? STATUS_STEPS.findIndex((s) => s.status === order.status) : -1;
  const nextAction     = order ? NEXT_STATUS[order.status] : null;

  const handleUpdateStatus = () => {
    if (!order) return;
    const nextAction = NEXT_STATUS[order.status];
    if (!nextAction) return;

    if (nextAction.status === 'IN_PROGRESS' && order.status === 'IN_PROGRESS') {
      setShowQR(true);
      return;
    }

    if (Platform.OS === 'web') {
      if (window.confirm(`Confirm: ${nextAction.label}?`)) {
        setUpdating(true);
        api.orders.updateStatus(order.id, nextAction.status).then(async () => {
          await qc.invalidateQueries({ queryKey: ['active-order'] });
          await qc.invalidateQueries({ queryKey: ['order-history'] });
          if (nextAction.status === 'IN_PROGRESS') setShowQR(true);
        }).catch((e: any) => {
          window.alert(e.message ?? 'Failed to update status');
        }).finally(() => {
          setUpdating(false);
        });
      }
      return;
    }

    Alert.alert(
      'Update Status',
      `Confirm: ${nextAction.label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            try {
              await api.orders.updateStatus(order.id, nextAction.status);
              await qc.invalidateQueries({ queryKey: ['active-order'] });
              await qc.invalidateQueries({ queryKey: ['order-history'] });
              if (nextAction.status === 'IN_PROGRESS') setShowQR(true);
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Failed to update status');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteJob = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await api.orders.generateCompletionOTP(order.id);
      await qc.invalidateQueries({ queryKey: ['active-order'] });
      const msg = `OTP Generated\n\nGive this code to the customer to release payment:\n\n${res.otp}`;
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('OTP Generated', `Give this code to the customer:\n\n${res.otp}`);
    } catch (e: any) {
      const msg = e.message ?? 'Failed to generate OTP';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <Ionicons name="refresh" size={32} color={Colors.coral} />
        <Text style={styles.loadingText}>Syncing job status...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingWrap}>
        <Ionicons name="checkmark-done-circle" size={56} color={Colors.online} />
        <Text style={styles.emptyTitle}>No Active Jobs</Text>
        <Text style={styles.emptyBody}>Looking for new opportunities? Check the jobs center.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(app)/(tabs)')}>
          <Text style={styles.backBtnText}>BACK TO DASHBOARD</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
            style={styles.backIcon}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{`Active Task #${order.orderNumber}`}</Text>
          <TouchableOpacity 
            style={styles.helpBtn}
            onPress={() => router.push({ 
              pathname: '/(app)/order/chat', 
              params: { orderId: order.id, customerName: order.customerName } 
            })}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.coral} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── Job Details ── */}
          <View style={styles.glassCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: conf?.bg ?? Colors.coralSubtle }]}>
                <Ionicons name={conf?.name ?? 'construct-outline'} size={24} color={conf?.color ?? Colors.coral} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.catName}>{getCategoryLabel(order.category, language)}</Text>
                <Text style={styles.clientName}>{`Client: ${order.customerName}`}</Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={16} color={Colors.coral} />
              <Text style={styles.addressText}>{order.customerAddress}</Text>
            </View>

            <View style={styles.earningsStrip}>
              <View style={styles.earnItem}>
                <Text style={styles.earnLbl}>AGREED PRICE</Text>
                <Text style={styles.earnVal}>{`${order.agreedPrice} EGP`}</Text>
              </View>
              <View style={styles.earnDiv} />
              <View style={styles.earnItem}>
                <Text style={styles.earnLbl}>BITY FEE</Text>
                <Text style={[styles.earnVal, { color: Colors.error }]}>{`-${order.bityFeeProvider} EGP`}</Text>
              </View>
              <View style={styles.earnDiv} />
              <View style={styles.earnItem}>
                <Text style={styles.earnLbl}>NET PAYOUT</Text>
                <Text style={[styles.earnVal, { color: Colors.online }]}>
                  {`${(Number(order.agreedPrice) - Number(order.bityFeeProvider)).toFixed(2)} EGP`}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Progress Tracker ── */}
          <View style={styles.trackerSection}>
            <Text style={styles.sectionTitle}>WORK PROGRESS</Text>
            <View style={styles.trackerBox}>
              {STATUS_STEPS.map((step, idx) => {
                const isDone = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <View key={step.status} style={styles.stepRow}>
                    <View style={styles.stepLeft}>
                      <View style={[
                        styles.stepDot,
                        isDone && styles.stepDotDone,
                        isCurrent && styles.stepDotCurrent,
                      ]}>
                        {isDone ? (
                          <Ionicons name="checkmark" size={12} color="#000" />
                        ) : (
                          <View style={[styles.innerDot, isCurrent && styles.innerDotActive]} />
                        )}
                      </View>
                      {idx < STATUS_STEPS.length - 1 && (
                        <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
                      )}
                    </View>
                    <View style={styles.stepInfo}>
                      <Text style={[
                        styles.stepLabel,
                        isDone && styles.stepLabelDone,
                        isCurrent && styles.stepLabelCurrent,
                      ]}>
                        {step.label.toUpperCase()}
                      </Text>
                      {isCurrent && <Text style={styles.stepStatus}>CURRENT STATUS</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Client Notes ── */}
          {!!order.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>CLIENT INSTRUCTIONS</Text>
              <Text style={styles.notesText}>{order.notes}</Text>
            </View>
          )}

          {/* ── Action QR/OTP ── */}
          {nextAction && (
            <View style={styles.actionContainer}>
              {order.status === 'IN_PROGRESS' && (
                <View style={styles.qrCard}>
                  <Text style={styles.qrHint}>Customer must scan this to start the job</Text>
                  <QRDisplay value={JSON.stringify({ orderId: order.id, action: 'START_JOB' })} size={200} />
                </View>
              )}

              {order.status === 'STARTED' && !!order.completionOtp && (
                <View style={styles.otpCard}>
                  <Ionicons name="key-outline" size={24} color={Colors.gold} />
                  <Text style={styles.otpLabel}>Completion Code</Text>
                  <Text style={styles.otpValue}>{order.completionOtp}</Text>
                  <Text style={styles.otpHint}>Give this code to the customer to release payment</Text>
                </View>
              )}

              <StitchButton
                label={nextAction.label}
                onPress={handleUpdateStatus}
                loading={updating}
                icon={order.status === 'STARTED' ? 'checkmark-done-circle' : 'arrow-forward'}
                style={styles.actionBtn}
              />

              <TouchableOpacity 
                style={styles.cancelLink} 
                onPress={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? <ActivityIndicator size="small" color={Colors.error} /> : <Text style={styles.cancelLinkText}>CANCEL ORDER</Text>}
              </TouchableOpacity>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── QR Modal ── */}
      <Modal visible={showQR} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Show This to Customer</Text>
              <TouchableOpacity onPress={() => setShowQR(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.qrHint}>Ask the customer to scan this QR code to officially start the job</Text>
            {!!order && (
              <QRDisplay
                value={JSON.stringify({ orderId: order.id, action: 'START_JOB' })}
                size={220}
              />
            )}
            <Text style={styles.orderTag}>{`ORDER #${order?.orderNumber}`}</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex:        { flex: 1 },
  container:   { flex: 1, backgroundColor: Colors.bg },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  emptyTitle:  { color: Colors.textPrimary, fontSize: 20, fontWeight: '800', marginTop: 12 },
  emptyBody:   { color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 40, marginTop: 8, opacity: 0.6 },
  
  backBtn: { marginTop: 32, paddingHorizontal: 24, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  backBtnText: { color: Colors.coral, fontSize: 12, fontWeight: '800', letterSpacing: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 64, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backIcon:  { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  helpBtn: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },

  scroll: { padding: 16, gap: 24, paddingBottom: 120 },

  glassCard: {
    backgroundColor: 'rgba(31,31,31,0.85)', borderRadius: 28, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 20,
  },
  cardHeader: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  iconBox:    { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, gap: 2 },
  catName:    { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  clientName: { color: Colors.textSecondary, fontSize: 13, opacity: 0.7 },
  locationRow:{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12 },
  addressText:{ color: Colors.textSecondary, fontSize: 13, flex: 1 },

  earningsStrip: { flexDirection: 'row', gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  earnItem:      { flex: 1, alignItems: 'center', gap: 4 },
  earnLbl:       { color: Colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  earnVal:       { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  earnDiv:       { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.05)' },

  trackerSection: { gap: 16 },
  sectionTitle:   { color: Colors.coral, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginLeft: 4 },
  trackerBox:     { backgroundColor: 'rgba(31,31,31,0.85)', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  
  stepRow:  { flexDirection: 'row', gap: 16, minHeight: 60 },
  stepLeft: { alignItems: 'center', width: 24 },
  stepDot:  { 
    width: 24, height: 24, borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone:    { backgroundColor: Colors.online, borderColor: Colors.online },
  stepDotCurrent: { borderColor: Colors.coral, borderWidth: 2 },
  innerDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  innerDotActive: { backgroundColor: Colors.coral, width: 8, height: 8, borderRadius: 4 },
  
  stepLine:       { width: 2, flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 4 },
  stepLineDone:   { backgroundColor: Colors.online },
  
  stepInfo:       { flex: 1, gap: 2 },
  stepLabel:      { color: Colors.textMuted, fontSize: 13, fontWeight: '700' },
  stepLabelDone:  { color: Colors.textPrimary, opacity: 0.6 },
  stepLabelCurrent:{ color: Colors.coral, fontSize: 14, fontWeight: '800' },
  stepStatus:     { color: Colors.coral, fontSize: 10, fontWeight: '800', opacity: 0.8 },

  notesBox: { backgroundColor: 'rgba(245,193,0,0.05)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(245,193,0,0.15)' },
  notesTitle: { color: Colors.coral, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  notesText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },

  actionContainer: { gap: 20 },
  qrCard: {
    backgroundColor: 'rgba(31,31,31,0.85)', borderRadius: 28, padding: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', gap: 20,
  },
  qrHint: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  otpCard: {
    backgroundColor: 'rgba(31,31,31,0.85)', borderRadius: 28, padding: 24,
    borderWidth: 1, borderColor: 'rgba(245,193,0,0.15)', alignItems: 'center', gap: 20,
  },
  otpLabel: { color: Colors.coral, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  otpValue: { color: Colors.textPrimary, fontSize: 32, fontWeight: '800', letterSpacing: 4 },
  otpHint: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  actionBtn: { height: 64, borderRadius: 32 },

  /* ── QR Modal ── */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', maxWidth: 380,
    backgroundColor: '#1C1C1C', borderRadius: 32, padding: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', gap: 20,
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', width: '100%',
  },
  modalTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  modalClose: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  orderTag: {
    color: Colors.coral, fontSize: 11, fontWeight: '800', letterSpacing: 2,
  },
  cancelLink: { marginTop: 16, height: 48, alignItems: 'center', justifyContent: 'center' },
  cancelLinkText: { color: Colors.error, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
});
