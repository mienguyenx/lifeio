import { useState, useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, CreditCard, Receipt, Plus, BarChart3, Target, Calendar, ChevronLeft, ChevronRight, Lightbulb, Zap, PanelRightClose, PanelRight, Edit, Trash2, MoreVertical } from 'lucide-react';
import { format, subDays, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdaptiveModal } from '@/components/mobile/AdaptiveModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { AreaDashboardSection } from '@/components/area/AreaDashboardSection';
import { ModuleHelpButton } from '@/components/ui/ModuleHelpButton';
import { useFinanceSync, type FinanceTransaction } from '@/hooks/sync/useFinanceSync';

const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Ăn uống', icon: '🍜', color: '#FF6B6B' },
  { id: 'transport', name: 'Di chuyển', icon: '🚗', color: '#4ECDC4' },
  { id: 'entertainment', name: 'Giải trí', icon: '🎮', color: '#45B7D1' },
  { id: 'shopping', name: 'Mua sắm', icon: '🛍️', color: '#96CEB4' },
  { id: 'bills', name: 'Hóa đơn', icon: '📄', color: '#FFEAA7' },
  { id: 'health', name: 'Sức khỏe', icon: '💊', color: '#DDA0DD' },
  { id: 'education', name: 'Học tập', icon: '📚', color: '#98D8C8' },
  { id: 'other', name: 'Khác', icon: '📦', color: '#B8B8B8' },
];

const INCOME_CATEGORIES = [
  { id: 'salary', name: 'Lương', icon: '💰', color: '#2ECC71' },
  { id: 'bonus', name: 'Thưởng', icon: '🎁', color: '#27AE60' },
  { id: 'investment', name: 'Đầu tư', icon: '📈', color: '#1ABC9C' },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#16A085' },
  { id: 'other', name: 'Khác', icon: '📦', color: '#95A5A6' },
];

const FINANCE_TIPS = [
  { icon: '💰', text: 'Tiết kiệm ít nhất 20% thu nhập mỗi tháng' },
  { icon: '📊', text: 'Theo dõi chi tiêu hàng ngày để kiểm soát ngân sách' },
  { icon: '🎯', text: 'Đặt mục tiêu tài chính cụ thể và thời hạn rõ ràng' },
  { icon: '💳', text: 'Hạn chế sử dụng thẻ tín dụng nếu chưa cần thiết' },
  { icon: '📈', text: 'Tìm hiểu về đầu tư để tiền sinh lời' },
];

const QUICK_EXPENSE_PRESETS = [
  { label: 'Ăn sáng 50K', category: 'food', amount: 50000 },
  { label: 'Ăn trưa 80K', category: 'food', amount: 80000 },
  { label: 'Grab 30K', category: 'transport', amount: 30000 },
  { label: 'Cafe 45K', category: 'food', amount: 45000 },
];

export default function FinancePage() {
  const { goals, lifeWheelScores, financeTransactions, addFinanceTransaction, updateFinanceTransaction, deleteFinanceTransaction } = useLifeOSStore();
  const { saveTransaction, updateTransaction: syncUpdateTransaction, deleteTransaction: syncDeleteTransaction } = useFinanceSync();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('finance-sidebar-open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense',
    category: 'food',
    amount: '',
    description: '',
  });

  // Use transactions from store
  const transactions = financeTransactions;

  const toggleSidebar = () => {
    const newValue = !isSidebarOpen;
    setIsSidebarOpen(newValue);
    localStorage.setItem('finance-sidebar-open', JSON.stringify(newValue));
  };

  // Finance-related goals
  const financeGoals = useMemo(() => 
    goals.filter(g => g.area === 'finance' && !g.deletedAt),
    [goals]
  );

  // Finance score from life wheel
  const financeScore = lifeWheelScores['finance'] || 5;

  // This month's stats
  const monthStats = useMemo(() => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
    
    const monthTransactions = transactions.filter(t => t.date >= monthStart && t.date <= monthEnd);
    
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return { income, expense, balance: income - expense };
  }, [transactions]);

  // Today's transactions
  const todayTransactions = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return transactions.filter(t => t.date === today);
  }, [transactions]);

  // Expense by category
  const expenseByCategory = useMemo(() => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    
    const monthExpenses = transactions.filter(t => 
      t.type === 'expense' && t.date >= monthStart
    );
    
    const grouped = monthExpenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return EXPENSE_CATEGORIES.map(cat => ({
      name: cat.name,
      value: grouped[cat.id] || 0,
      color: cat.color,
    })).filter(item => item.value > 0);
  }, [transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) return;
    
    const transaction: FinanceTransaction = {
      id: crypto.randomUUID(),
      date: format(new Date(), 'yyyy-MM-dd'),
      type: newTransaction.type,
      category: newTransaction.category,
      amount: parseFloat(newTransaction.amount),
      description: newTransaction.description,
    };
    
    // Add to store immediately for optimistic update
    addFinanceTransaction(transaction);
    
    // Sync to database
    const success = await saveTransaction(transaction);
    if (!success) {
      toast.error('Không thể lưu vào database');
    } else {
      toast.success(newTransaction.type === 'income' ? 'Đã ghi nhận thu nhập!' : 'Đã ghi nhận chi tiêu!');
    }
    
    setNewTransaction({ type: 'expense', category: 'food', amount: '', description: '' });
    setIsAddDialogOpen(false);
  };

  const handleQuickExpense = async (preset: typeof QUICK_EXPENSE_PRESETS[0]) => {
    const transaction: FinanceTransaction = {
      id: crypto.randomUUID(),
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'expense',
      category: preset.category,
      amount: preset.amount,
      description: preset.label.split(' ')[0] + ' ' + preset.label.split(' ')[1],
    };
    
    // Add to store immediately for optimistic update
    addFinanceTransaction(transaction);
    
    // Sync to database
    const success = await saveTransaction(transaction);
    if (!success) {
      toast.error('Không thể lưu vào database');
    } else {
      toast.success(`Đã ghi nhận: ${preset.label}`);
    }
  };

  const handleEditTransaction = (transaction: FinanceTransaction) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount.toString(),
      description: transaction.description,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction || !newTransaction.amount || !newTransaction.description) return;
    
    const updates: Partial<FinanceTransaction> = {
      type: newTransaction.type,
      category: newTransaction.category,
      amount: parseFloat(newTransaction.amount),
      description: newTransaction.description,
    };
    
    // Update store immediately for optimistic update
    updateFinanceTransaction(editingTransaction.id, updates);
    
    // Sync to database
    const success = await syncUpdateTransaction(editingTransaction.id, updates);
    if (!success) {
      toast.error('Không thể cập nhật vào database');
    } else {
      toast.success('Đã cập nhật giao dịch!');
    }
    
    setNewTransaction({ type: 'expense', category: 'food', amount: '', description: '' });
    setEditingTransaction(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa giao dịch này?')) return;
    
    // Delete from store immediately for optimistic update
    deleteFinanceTransaction(id);
    
    // Sync to database
    const success = await syncDeleteTransaction(id);
    if (!success) {
      toast.error('Không thể xóa khỏi database');
    } else {
      toast.success('Đã xóa giao dịch!');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Wallet className="w-7 h-7 text-emerald-500" />
            Tài chính
          </h1>
          <p className="text-muted-foreground mt-1">Quản lý thu chi và ngân sách</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button className="gap-2" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm giao dịch</span>
          </Button>
          <AdaptiveModal open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} title="Thêm giao dịch">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={newTransaction.type === 'expense' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setNewTransaction(prev => ({ ...prev, type: 'expense', category: 'food' }))}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Chi tiêu
                </Button>
                <Button
                  variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setNewTransaction(prev => ({ ...prev, type: 'income', category: 'salary' }))}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Thu nhập
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select 
                  value={newTransaction.category} 
                  onValueChange={(v) => setNewTransaction(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(newTransaction.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Số tiền (VND)</Label>
                <Input
                  type="number"
                  placeholder="Nhập số tiền"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input
                  placeholder="Mô tả giao dịch..."
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <Button className="w-full" onClick={handleAddTransaction}>Lưu</Button>
            </div>
          </AdaptiveModal>
          <AdaptiveModal open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} title="Chỉnh sửa giao dịch">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={newTransaction.type === 'expense' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setNewTransaction(prev => ({ ...prev, type: 'expense', category: 'food' }))}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Chi tiêu
                </Button>
                <Button
                  variant={newTransaction.type === 'income' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setNewTransaction(prev => ({ ...prev, type: 'income', category: 'salary' }))}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Thu nhập
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select 
                  value={newTransaction.category} 
                  onValueChange={(v) => setNewTransaction(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(newTransaction.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Số tiền (VND)</Label>
                <Input
                  type="number"
                  placeholder="Nhập số tiền"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input
                  placeholder="Mô tả giao dịch..."
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <Button className="w-full" onClick={handleUpdateTransaction}>Cập nhật</Button>
            </div>
          </AdaptiveModal>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="h-8 px-2 gap-1 hidden xl:flex"
        >
          {isSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
        </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Finance Score */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Điểm tài chính</h3>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {financeScore}/10
                </Badge>
              </div>
              <Progress value={financeScore * 10} className="h-3" />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-emerald-500/10 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">Thu nhập</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(monthStats.income)}</p>
                <p className="text-xs text-muted-foreground mt-1">Tháng này</p>
              </CardContent>
            </Card>
            
            <Card className="bg-rose-500/10 border-rose-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
                  <TrendingDown className="w-5 h-5" />
                  <span className="font-medium">Chi tiêu</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(monthStats.expense)}</p>
                <p className="text-xs text-muted-foreground mt-1">Tháng này</p>
              </CardContent>
            </Card>
            
            <Card className={cn(
              monthStats.balance >= 0 ? "bg-blue-500/10 border-blue-500/20" : "bg-amber-500/10 border-amber-500/20"
            )}>
              <CardContent className="p-4">
                <div className={cn(
                  "flex items-center gap-2 mb-2",
                  monthStats.balance >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600 dark:text-amber-400"
                )}>
                  <PiggyBank className="w-5 h-5" />
                  <span className="font-medium">Còn lại</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(monthStats.balance)}</p>
                <p className="text-xs text-muted-foreground mt-1">Tháng này</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
              <TabsTrigger value="linked">Liên kết</TabsTrigger>
              <TabsTrigger value="budget">Ngân sách</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Expense Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Chi tiêu theo danh mục
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {expenseByCategory.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {expenseByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Chưa có chi tiêu trong tháng này
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Lịch sử giao dịch
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {transactions.slice().reverse().map(transaction => {
                      const categories = transaction.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
                      const category = categories.find(c => c.id === transaction.category);
                      
                      return (
                        <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xl shrink-0">{category?.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {category?.name} • {format(parseISO(transaction.date), 'dd/MM/yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditTransaction(transaction)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Xóa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="linked" className="space-y-4">
              <AreaDashboardSection area="finance" />
            </TabsContent>

            <TabsContent value="budget" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Mục tiêu tài chính ({financeGoals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {financeGoals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Chưa có mục tiêu tài chính nào. Tạo mục tiêu mới trong module Goals!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {financeGoals.map(goal => (
                        <div key={goal.id} className="p-3 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{goal.title}</p>
                            <Badge variant={goal.status === 'active' ? "default" : "secondary"}>
                              {goal.progress}%
                            </Badge>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className={cn(
          "hidden lg:block transition-all duration-300",
          isSidebarOpen ? "w-80" : "w-0"
        )}>
          {isSidebarOpen && (
            <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {/* Help Button */}
              <div className="flex justify-end">
                <ModuleHelpButton module="finance" />
              </div>

              {/* Quick Expense */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Chi tiêu nhanh
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {QUICK_EXPENSE_PRESETS.map((preset, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => handleQuickExpense(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Finance Tips */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Mẹo tài chính
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {FINANCE_TIPS.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                      <span>{tip.icon}</span>
                      <span className="text-muted-foreground">{tip.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Today Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Hôm nay
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {todayTransactions.map(t => {
                        const categories = t.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
                        const category = categories.find(c => c.id === t.category);
                        return (
                          <div key={t.id} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <span>{category?.icon}</span>
                              {t.description}
                            </span>
                            <span className={cn("font-medium", t.type === 'income' ? 'text-emerald-500' : 'text-rose-500')}>
                              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </span>
                          </div>
                        );
                      })}
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm font-medium">
                          <span>Tổng chi hôm nay</span>
                          <span className="text-rose-500">
                            {formatCurrency(todayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Chưa có giao dịch nào hôm nay
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Finance Goals */}
              {financeGoals.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      Mục tiêu tài chính
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {financeGoals.slice(0, 3).map(goal => (
                      <div key={goal.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate">{goal.title}</span>
                          <span className="text-muted-foreground">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-1" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex fixed right-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background border shadow-sm"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
