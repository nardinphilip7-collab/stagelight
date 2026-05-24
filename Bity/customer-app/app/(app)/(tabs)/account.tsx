import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, RefreshControl, Image, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../../constants/colors';
import { StitchButton } from '../../../components/ui/StitchButton';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { useTranslation } from '../../../hooks/useTranslation';
import { api } from '../../../services/api';

function MenuItem({
  icon, label, onPress, danger, info,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  info?: string;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? '#FF453A' : Colors.coral} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: '#FF453A' }]}>{label}</Text>
      <View style={styles.menuRight}>
        {info && <Text style={styles.menuInfo}>{info}</Text>}
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout, setUser, refreshUser } = useAuthStore();
  const { language, setLanguage } = useSettingsStore();
  const [editModal, setEditModal] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const t = useTranslation();

  const { data: orderHistory = [] } = useQuery({
    queryKey: ['order-history'],
    queryFn: api.orders.getHistory,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm(t.logoutConfirm)) {
        await logout();
      }
    } else {
      Alert.alert(t.logout, t.logoutConfirm, [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.logoutAction, style: 'destructive',
          onPress: async () => { 
            await logout(); 
          },
        },
      ]);
    }
  };

  const handleLanguage = () => {
    // Seamlessly toggle between English and Arabic
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView 
          contentContainerStyle={styles.scroll} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.coral} />}
        >
          {/* ── Profile Hero ── */}
          <View style={styles.heroSection}>
            <TouchableOpacity 
              style={styles.avatarWrap} 
              onPress={() => setEditModal(true)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[Colors.coral, '#D4A900']}
                style={styles.avatarBorder}
              >
                <View style={styles.avatarInner}>
                  {user?.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
                  ) : (
                    <View style={[styles.avatarImg, { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.coralSubtle }]}>
                      <Text style={{ color: Colors.coral, fontSize: 36, fontWeight: '800' }}>
                        {(user?.name ?? 'G')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
              <View style={styles.editBadge}>
                 <Ionicons name="camera" size={12} color="#000" />
              </View>
            </TouchableOpacity>

            <View style={styles.profileMeta}>
               <Text style={styles.userName}>{user?.name ?? 'Alex Reed'}</Text>
               <View style={styles.tierPill}>
                  <MaterialCommunityIcons name="crown" size={14} color={Colors.coral} />
                  <Text style={styles.tierText}>{t.goldMembership.toUpperCase()} MEMBER</Text>
               </View>
            </View>
          </View>

          {/* ── Stats ── */}
          <View style={styles.statsStrip}>
             <View style={styles.statBox}>
                <Text style={styles.statValue}>{(user?.loyaltyPoints ?? 0).toLocaleString()}</Text>
                <Text style={styles.statLabel}>{t.pointsLabel}</Text>
             </View>
             <View style={styles.statDivider} />
             <View style={styles.statBox}>
                <Text style={styles.statValue}>{orderHistory.length}</Text>
                <Text style={styles.statLabel}>{t.ordersLabel}</Text>
             </View>
             <View style={styles.statDivider} />
             <View style={styles.statBox}>
                 <Text style={styles.statValue}>{(user?.walletBalance ?? 0).toLocaleString()} {t.egp}</Text>
                 <Text style={styles.statLabel}>{t.digitalWallet.toUpperCase()}</Text>
              </View>
          </View>

          {/* ── Menu Sections ── */}
          <Text style={styles.groupLabel}>{t.activitySection.toUpperCase()}</Text>
          <View style={styles.glassCard}>
            <MenuItem 
              icon="receipt-outline"  
              label={t.ordersHistory}   
              onPress={() => router.push('/(app)/(tabs)/orders')} 
            />
            <MenuItem 
              icon="wallet-outline"   
              label={t.digitalWallet}   
              onPress={() => router.push('/(app)/(tabs)/wallet')} 
            />
            <MenuItem 
              icon="location-outline" 
              label={t.savedAddresses}  
              onPress={() => {}} 
            />
          </View>

          <Text style={styles.groupLabel}>{t.settingsSection.toUpperCase()}</Text>
          <View style={styles.glassCard}>
            <MenuItem 
              icon="language-outline"
              label={t.language}
              onPress={handleLanguage}
              info={language === 'ar' ? t.arabicLanguage : t.englishLanguage}
            />
            <MenuItem
              icon="notifications-outline"
              label={t.notifications}
              onPress={() => router.push('/(app)/notifications')}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              label={t.privacySecurity}
              onPress={() => router.push('/(app)/settings')}
            />
            <MenuItem 
              icon="help-circle-outline"      
              label={t.helpSupport}      
              onPress={() => {}} 
            />
          </View>

          <View style={[styles.glassCard, { marginTop: 12 }]}>
            <MenuItem 
              icon="log-out-outline" 
              label={t.logout} 
              onPress={handleLogout} 
              danger 
            />
          </View>

          <Text style={styles.versionText}>BITY CUSTOMER EDITION • v3.1.0</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Edit Modal */}
      <Modal visible={editModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
           <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>{t.editProfile}</Text>
              <TextInput 
                style={styles.modalInput} 
                value={name} 
                onChangeText={setName}
                placeholder={t.fullName}
                placeholderTextColor={Colors.textMuted}
              />
              <StitchButton 
                label={saving ? "..." : t.save.toUpperCase()} 
                onPress={async () => {
                  setSaving(true);
                  try {
                    const updated = await api.user.updateProfile({ name });
                    setUser(updated);
                    setEditModal(false);
                  } finally { setSaving(false); }
                }} 
              />
              <StitchButton 
                label={t.cancel.toUpperCase()} 
                variant="ghost" 
                onPress={() => setEditModal(false)} 
                style={{ marginTop: 8 }}
              />
           </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  flex:      { flex: 1 },
  scroll:    { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 10 },

  /* Hero */
  heroSection: { alignItems: 'center', paddingVertical: 32 },
  avatarWrap:   { width: 110, height: 110, position: 'relative' },
  avatarBorder: { width: 110, height: 110, borderRadius: 55, padding: 3, alignItems: 'center', justifyContent: 'center' },
  avatarInner:  { width: 104, height: 104, borderRadius: 52, backgroundColor: '#1F1F1F', overflow: 'hidden' },
  avatarImg:    { width: '100%', height: '100%' },
  editBadge:    { position: 'absolute', bottom: 4, right: 4, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.coral, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.bg },
  profileMeta:  { alignItems: 'center', marginTop: 16, gap: 8 },
  userName:     { color: Colors.textPrimary, fontSize: 26, fontWeight: '800' },
  tierPill:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,193,0,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245,193,0,0.2)' },
  tierText:     { color: Colors.coral, fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  /* Stats */
  statsStrip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(31,31,31,0.85)',
    borderRadius: 24, paddingVertical: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 32,
  },
  statBox:     { flex: 1, alignItems: 'center', gap: 4 },
  statValue:   { color: Colors.textPrimary, fontSize: 20, fontWeight: '800' },
  statLabel:   { color: Colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.05)' },

  /* Menu */
  groupLabel: { color: Colors.coral, fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 12, marginLeft: 8 },
  glassCard:  { backgroundColor: 'rgba(31,31,31,0.85)', borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 24 },
  menuItem:   { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  menuIcon:   { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' },
  menuIconDanger: { backgroundColor: 'rgba(255,59,48,0.1)' },
  menuLabel:  { flex: 1, marginLeft: 16, color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  menuRight:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuInfo:   { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },

  versionText: { color: Colors.textMuted, fontSize: 10, fontWeight: '800', textAlign: 'center', letterSpacing: 1, opacity: 0.5 },

  /* Modal */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 },
  modalSheet:   { backgroundColor: '#1C1C1E', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle:   { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 24 },
  modalInput:   { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
});
