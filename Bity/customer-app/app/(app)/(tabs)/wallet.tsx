import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '../../../constants/colors';
import { api } from '../../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../../../hooks/useTranslation';
import type { TransactionType } from '../../../types';

const TX_CFG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  CREDIT:   { icon: 'arrow-down-circle-outline', color: Colors.success   },
  REWARD:   { icon: 'gift-outline',              color: Colors.coral     },
  REFUND:   { icon: 'refresh-circle-outline',    color: Colors.success   },
  RELEASE:  { icon: 'checkmark-circle-outline',  color: Colors.success   },
  DEBIT:    { icon: 'arrow-up-circle-outline',   color: Colors.error     },
  HOLD:     { icon: 'pause-circle-outline',      color: Colors.warning   },
  PENALTY:  { icon: 'alert-circle-outline',      color: Colors.error     },
  BITY_FEE: { icon: 'remove-circle-outline',     color: Colors.textMuted },
};

export default function WalletScreen() {
  const router = useRouter();
  const t = useTranslation();

  const TX_LABELS: Record<string, string> = {
    CREDIT:   t.txDeposit,
    REWARD:   t.txReward,
    REFUND:   t.txRefund,
    RELEASE:  t.txHoldReleased,
    DEBIT:    t.txCharge,
    HOLD:     t.txOnHold,
    PENALTY:  t.txPenalty,
    BITY_FEE: t.txServiceFee,
  };
  const { data: balance = { available: 0, hold: 0 } } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: api.wallet.getBalance,
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: api.wallet.getTransactions,
  });

  const available = balance.available ?? 0;
  const pending   = balance.hold ?? 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t.walletTitle}</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(app)/wallet/recharge')}
          >
            <Ionicons name="add-circle" size={24} color={Colors.coral} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Branded Card ── */}
          <LinearGradient colors={['#1F1F1F', '#131313']} style={styles.balanceCard}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.balanceLbl}>{t.totalBalance}</Text>
                <Text style={styles.balanceVal}>{available.toLocaleString()} {t.egp}</Text>
              </View>
              <MaterialCommunityIcons name="integrated-circuit-chip" size={40} color={Colors.coral} opacity={0.6} />
            </View>
            <View style={styles.cardBottom}>
              {pending > 0 && (
                <Text style={styles.pendingText}>{pending.toLocaleString()} {t.egp} {t.pendingBalance}</Text>
              )}
              <View style={styles.bityLogo}>
                <Text style={styles.logoText}>BITY</Text>
              </View>
            </View>
          </LinearGradient>

          {/* ── Quick Actions ── */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push('/(app)/wallet/recharge')}
            >
              <View style={styles.actionIconBox}>
                <Ionicons name="arrow-down" size={22} color={Colors.coral} />
              </View>
              <Text style={styles.actionText}>{t.topUp}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Alert.alert(t.withdraw, t.withdrawComingSoon)}
            >
              <View style={styles.actionIconBox}>
                <Ionicons name="arrow-up" size={22} color={Colors.coral} />
              </View>
              <Text style={styles.actionText}>{t.withdraw}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Transactions ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.recentActivity}</Text>
            <TouchableOpacity onPress={() => Alert.alert(t.viewStatements, t.statementsComingSoon)}>
              <Text style={styles.seeAll}>{t.viewStatements}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.txList}>
            {transactions.length === 0 ? (
              <View style={styles.emptyTx}>
                <Ionicons name="receipt-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyTxText}>{t.noTransactions}</Text>
              </View>
            ) : (
              transactions.map((tx) => {
                const cfg     = TX_CFG[tx.type] ?? { icon: 'ellipse-outline' as const, color: Colors.textMuted };
                const isCredit = tx.amount > 0;
                const dateStr  = new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <View key={tx.id} style={styles.txItem}>
                    <View style={[styles.txIcon, { backgroundColor: cfg.color + '15' }]}>
                      <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle}>{TX_LABELS[tx.type] || tx.type}</Text>
                      <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                      <Text style={styles.txDate}>{dateStr}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isCredit ? Colors.success : Colors.error }]}>
                      {isCredit ? '+' : ''}{Math.abs(tx.amount).toLocaleString()} {t.egp}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex:      { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, height: 60,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  addBtn:      { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },

  scroll: { paddingHorizontal: 20, paddingBottom: 100, gap: 24 },

  balanceCard: {
    height: 190, borderRadius: 28, padding: 24, justifyContent: 'space-between',
    borderWidth: 1, borderColor: 'rgba(245,193,0,0.2)',
  },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  balanceLbl: { color: Colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  balanceVal: { color: Colors.textPrimary, fontSize: 32, fontWeight: '800' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  pendingText:{ color: Colors.textMuted, fontSize: 12, fontWeight: '600', opacity: 0.7 },
  bityLogo:   { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(245,193,0,0.1)' },
  logoText:   { color: Colors.coral, fontSize: 12, fontWeight: '900', letterSpacing: 2 },

  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1, height: 90, borderRadius: 24, backgroundColor: 'rgba(31,31,31,0.85)',
    alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  actionIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(245,193,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  actionText:    { color: Colors.textPrimary, fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  sectionTitle:  { color: Colors.textPrimary, fontSize: 18, fontWeight: '800' },
  seeAll:        { color: Colors.coral, fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  txList: { gap: 10 },
  txItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    backgroundColor: 'rgba(31,31,31,0.85)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  txIcon:   { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txInfo:   { flex: 1, gap: 1 },
  txTitle:  { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  txDesc:   { color: Colors.textSecondary, fontSize: 12, opacity: 0.7 },
  txDate:   { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  txAmount: { fontSize: 15, fontWeight: '800' },

  emptyTx: {
    padding: 40, alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(31,31,31,0.85)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyTxText: { color: Colors.textMuted, fontSize: 14, fontWeight: '500' },
});
