import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  SafeAreaView, StatusBar, StyleSheet, Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { BottomSheet, FAB } from '@/components/ui';
import { SwipeableRow } from '@/components/ui/SwipeableRow';

const C = {
  bg: '#0f0f0f', card: '#1a1a1a', border: '#2a2a2a',
  fg: '#f8f8f8', muted: '#a0a0a0', primary: '#8b5cf6',
  success: '#22c55e', warning: '#f59e0b', danger: '#ef4444',
};

const CATEGORIES = {
  income: ['Lương', 'Freelance', 'Đầu tư', 'Khác'],
  expense: ['Ăn uống', 'Di chuyển', 'Mua sắm', 'Giải trí', 'Hóa đơn', 'Sức khỏe', 'Giáo dục', 'Khác'],
};

const CATEGORY_ICONS: Record<string, string> = {
  'Lương': '💰', 'Freelance': '💻', 'Đầu tư': '📈', 'Ăn uống': '🍜',
  'Di chuyển': '🚗', 'Mua sắm': '🛒', 'Giải trí': '🎬', 'Hóa đơn': '📄',
  'Sức khỏe': '💊', 'Giáo dục': '📚', 'Khác': '📌',
};

function formatMoney(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

export default function FinanceScreen() {
  const transactions = useLifeOSStore(s => s.financeTransactions);
  const addTransaction = useLifeOSStore(s => s.addFinanceTransaction);
  const deleteTransaction = useLifeOSStore(s => s.deleteFinanceTransaction);

  const [showAdd, setShowAdd] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const monthPrefix = todayStr.slice(0, 7);

  const stats = useMemo(() => {
    const monthTxs = transactions.filter(t => t.date.startsWith(monthPrefix));
    const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense, monthTxs };
  }, [transactions, monthPrefix]);

  // Category breakdown (expense)
  const catBreakdown = useMemo(() => {
    const expenseTxs = stats.monthTxs.filter(t => t.type === 'expense');
    const map: Record<string, number> = {};
    expenseTxs.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amt]) => ({ cat, amt, pct: stats.expense > 0 ? Math.round((amt / stats.expense) * 100) : 0 }));
  }, [stats]);

  const recentTxs = useMemo(() =>
    [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [transactions]
  );

  const handleAdd = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) { Alert.alert('Lỗi', 'Nhập số tiền hợp lệ'); return; }
    if (!category) { Alert.alert('Lỗi', 'Chọn danh mục'); return; }
    addTransaction({
      id: `fin-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: todayStr, type: txType, category, amount: value,
      description: description.trim() || undefined,
    });
    setAmount(''); setCategory(''); setDescription(''); setShowAdd(false);
  };

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Xóa', 'Xóa giao dịch này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => deleteTransaction(id) },
    ]);
  }, [deleteTransaction]);

  return (
    <>
      <Stack.Screen options={{ title: 'Tài chính' }} />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Monthly Summary ── */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tháng này</Text>
            <Text style={[styles.summaryBalance, stats.balance >= 0 ? { color: C.success } : { color: C.danger }]}>
              {stats.balance >= 0 ? '+' : ''}{formatMoney(stats.balance)}
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Thu nhập</Text>
                <Text style={[styles.summaryItemValue, { color: C.success }]}>+{formatMoney(stats.income)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>Chi tiêu</Text>
                <Text style={[styles.summaryItemValue, { color: C.danger }]}>-{formatMoney(stats.expense)}</Text>
              </View>
            </View>
          </View>

          {/* ── Category Breakdown ── */}
          {catBreakdown.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chi tiêu theo danh mục</Text>
              {catBreakdown.map(item => (
                <View key={item.cat} style={styles.catRow}>
                  <View style={[styles.catRowIcon, { backgroundColor: C.danger + '20' }]}>
                    <Text style={styles.catRowIconText}>{CATEGORY_ICONS[item.cat] || '📌'}</Text>
                  </View>
                  <View style={styles.catRowInfo}>
                    <View style={styles.catRowHeader}>
                      <Text style={styles.catRowLabel}>{item.cat}</Text>
                      <Text style={styles.catRowAmount}>{formatMoney(item.amt)}</Text>
                    </View>
                    <View style={styles.catBarBg}>
                      <View style={[styles.catBarFill, { width: `${item.pct}%` }]} />
                    </View>
                  </View>
                  <Text style={styles.catRowPct}>{item.pct}%</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Recent Transactions (swipeable) ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
            {recentTxs.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💰</Text>
                <Text style={styles.emptyTitle}>Chưa có giao dịch</Text>
                <TouchableOpacity onPress={() => setShowAdd(true)}>
                  <Text style={styles.emptyAction}>+ Thêm giao dịch</Text>
                </TouchableOpacity>
              </View>
            ) : (
              recentTxs.map(tx => (
                <SwipeableRow
                  key={tx.id}
                  rightActions={[
                    { label: 'Xóa', color: C.danger, icon: '🗑', onPress: () => handleDelete(tx.id) },
                  ]}
                >
                  <View style={styles.txRow}>
                    <View style={[styles.txIcon, { backgroundColor: (tx.type === 'income' ? C.success : C.danger) + '20' }]}>
                      <Text style={styles.txIconText}>{CATEGORY_ICONS[tx.category] || '📌'}</Text>
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txCategory}>{tx.category}</Text>
                      <Text style={styles.txDate}>{tx.date}{tx.description ? ` · ${tx.description}` : ''}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: tx.type === 'income' ? C.success : C.danger }]}>
                      {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                    </Text>
                  </View>
                </SwipeableRow>
              ))
            )}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>

        <FAB onPress={() => setShowAdd(true)} color={C.success} />

        <BottomSheet visible={showAdd} onClose={() => setShowAdd(false)} title="Thêm giao dịch" height={500}>
          <View style={styles.addForm}>
            <View style={styles.typeToggle}>
              <TouchableOpacity onPress={() => { setTxType('expense'); setCategory(''); }} style={[styles.typeBtn, txType === 'expense' && styles.typeBtnActiveExpense]}>
                <Text style={[styles.typeBtnText, txType === 'expense' && { color: C.danger }]}>Chi tiêu</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setTxType('income'); setCategory(''); }} style={[styles.typeBtn, txType === 'income' && styles.typeBtnActiveIncome]}>
                <Text style={[styles.typeBtnText, txType === 'income' && { color: C.success }]}>Thu nhập</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.amountInput} placeholder="0" placeholderTextColor="#444" value={amount} onChangeText={setAmount} keyboardType="numeric" autoFocus />
            <Text style={styles.currencyLabel}>VNĐ</Text>
            <Text style={styles.formLabel}>Danh mục</Text>
            <View style={styles.catGrid}>
              {CATEGORIES[txType].map(cat => (
                <TouchableOpacity key={cat} onPress={() => setCategory(cat)} style={[styles.catChip, category === cat && styles.catChipActive]}>
                  <Text style={styles.catChipIcon}>{CATEGORY_ICONS[cat] || '📌'}</Text>
                  <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.descInput} placeholder="Ghi chú (tùy chọn)" placeholderTextColor="#666" value={description} onChangeText={setDescription} />
            <TouchableOpacity onPress={handleAdd} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  // Summary
  summaryCard: { margin: 20, padding: 20, backgroundColor: C.card, borderRadius: 20 },
  summaryLabel: { color: C.muted, fontSize: 13, marginBottom: 4 },
  summaryBalance: { fontSize: 32, fontWeight: 'bold', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryItemLabel: { color: C.muted, fontSize: 12, marginBottom: 4 },
  summaryItemValue: { fontSize: 15, fontWeight: '600' },
  summaryDivider: { width: 1, height: 30, backgroundColor: C.border },
  // Section
  section: { paddingHorizontal: 20, marginTop: 8 },
  sectionTitle: { color: C.fg, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  // Transaction row
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txIconText: { fontSize: 18 },
  txInfo: { flex: 1 },
  txCategory: { color: C.fg, fontSize: 14, fontWeight: '500' },
  txDate: { color: C.muted, fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '600' },
  // Category Breakdown
  catRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  catRowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catRowIconText: { fontSize: 16 },
  catRowInfo: { flex: 1 },
  catRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catRowLabel: { color: C.fg, fontSize: 14 },
  catRowAmount: { color: C.danger, fontSize: 13, fontWeight: '600' },
  catBarBg: { height: 4, backgroundColor: C.border, borderRadius: 2 },
  catBarFill: { height: 4, borderRadius: 2, backgroundColor: C.danger },
  catRowPct: { color: C.muted, fontSize: 12, width: 36, textAlign: 'right' },
  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { color: C.fg, fontSize: 15 },
  emptyAction: { color: C.primary, fontSize: 14, marginTop: 12, fontWeight: '500' },
  // Add form
  addForm: { paddingVertical: 12 },
  typeToggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  typeBtnActiveExpense: { borderColor: C.danger, backgroundColor: C.danger + '15' },
  typeBtnActiveIncome: { borderColor: C.success, backgroundColor: C.success + '15' },
  typeBtnText: { color: C.muted, fontSize: 14, fontWeight: '500' },
  amountInput: { color: C.fg, fontSize: 36, fontWeight: 'bold', textAlign: 'center', paddingVertical: 8 },
  currencyLabel: { color: C.muted, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  formLabel: { color: C.fg, fontSize: 14, fontWeight: '500', marginBottom: 8 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  catChipActive: { borderColor: C.primary, backgroundColor: C.primary + '15' },
  catChipIcon: { fontSize: 14 },
  catChipText: { color: C.muted, fontSize: 13 },
  catChipTextActive: { color: C.primary },
  descInput: {
    backgroundColor: '#0f0f0f', borderWidth: 1, borderColor: C.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: C.fg, fontSize: 15, marginBottom: 16,
  },
  saveBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
