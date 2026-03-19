import { useState, useMemo } from 'react';
import { GraduationCap, BookOpen, Trophy, Clock, Target, Plus, Star, CheckCircle2, Circle, Play, Pause, BarChart3, ChevronLeft, ChevronRight, Lightbulb, Zap, PanelRightClose, PanelRight, Edit, Trash2, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { toast } from 'sonner';
import { AreaDashboardSection } from '@/components/area/AreaDashboardSection';
import { ModuleHelpButton } from '@/components/ui/ModuleHelpButton';
import { useLearningSync, type Course, type Book } from '@/hooks/sync/useLearningSync';

const LEARNING_CATEGORIES = [
  { id: 'programming', name: 'Lập trình', icon: '💻' },
  { id: 'language', name: 'Ngôn ngữ', icon: '🌐' },
  { id: 'design', name: 'Thiết kế', icon: '🎨' },
  { id: 'business', name: 'Kinh doanh', icon: '📊' },
  { id: 'personal', name: 'Phát triển bản thân', icon: '🧠' },
  { id: 'other', name: 'Khác', icon: '📦' },
];

const LEARNING_TIPS = [
  { icon: '📚', text: 'Học ít nhất 30 phút mỗi ngày để duy trì thói quen' },
  { icon: '🎯', text: 'Đặt mục tiêu cụ thể cho từng khóa học' },
  { icon: '📝', text: 'Ghi chú lại những điểm quan trọng' },
  { icon: '🔄', text: 'Ôn tập định kỳ để nhớ lâu hơn' },
  { icon: '💡', text: 'Thực hành ngay sau khi học lý thuyết' },
];

const BOOK_RECOMMENDATIONS = [
  { title: 'Atomic Habits', author: 'James Clear' },
  { title: 'Deep Work', author: 'Cal Newport' },
  { title: 'The Psychology of Money', author: 'Morgan Housel' },
];

export default function LearningPage() {
  const { goals, habits, lifeWheelScores, learningCourses, learningBooks, addLearningCourse, updateLearningCourse, deleteLearningCourse, addLearningBook, updateLearningBook, deleteLearningBook } = useLifeOSStore();
  const { saveCourse, updateCourse: syncUpdateCourse, deleteCourse: syncDeleteCourse, saveBook, updateBook: syncUpdateBook, deleteBook: syncDeleteBook } = useLearningSync();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'course' | 'book', item: Course | Book } | null>(null);
  const [activeTab, setActiveTab] = useState('courses');
  const [addType, setAddType] = useState<'course' | 'book'>('course');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('learning-sidebar-open');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Use data from store
  const courses = learningCourses;
  const books = learningBooks;

  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'programming',
    totalLessons: '',
  });

  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    totalPages: '',
  });

  const toggleSidebar = () => {
    const newValue = !isSidebarOpen;
    setIsSidebarOpen(newValue);
    localStorage.setItem('learning-sidebar-open', JSON.stringify(newValue));
  };

  // Learning-related goals & habits
  const learningGoals = useMemo(() => 
    goals.filter(g => g.area === 'learning' && !g.deletedAt),
    [goals]
  );

  const learningHabits = useMemo(() => 
    habits.filter(h => h.area === 'learning' && !h.deletedAt && !h.archivedAt),
    [habits]
  );

  // Learning score
  const learningScore = lifeWheelScores['learning'] || 5;

  // Stats
  const stats = useMemo(() => {
    const activeCourses = courses.filter(c => c.status === 'in_progress').length;
    const completedCourses = courses.filter(c => c.status === 'completed').length;
    const readingBooks = books.filter(b => b.status === 'reading').length;
    const completedBooks = books.filter(b => b.status === 'completed').length;
    
    const totalLearningHours = courses.reduce((sum, c) => sum + c.completedLessons * 0.5, 0);
    
    return { activeCourses, completedCourses, readingBooks, completedBooks, totalLearningHours };
  }, [courses, books]);

  const handleAddCourse = async () => {
    if (!newCourse.title || !newCourse.totalLessons) return;
    
    const course: Course = {
      id: crypto.randomUUID(),
      title: newCourse.title,
      description: newCourse.description || undefined,
      category: newCourse.category,
      totalLessons: parseInt(newCourse.totalLessons),
      completedLessons: 0,
      status: 'not_started',
    };
    
    // Add to store immediately for optimistic update
    addLearningCourse(course);
    
    // Sync to database
    const success = await saveCourse(course);
    if (!success) {
      toast.error('Không thể lưu vào database');
    } else {
      toast.success('Đã thêm khóa học!');
    }
    
    setNewCourse({ title: '', description: '', category: 'programming', totalLessons: '' });
    setIsAddDialogOpen(false);
  };

  const handleAddBook = async () => {
    if (!newBook.title || !newBook.author || !newBook.totalPages) return;
    
    const book: Book = {
      id: crypto.randomUUID(),
      title: newBook.title,
      author: newBook.author,
      totalPages: parseInt(newBook.totalPages),
      currentPage: 0,
      status: 'want_to_read',
    };
    
    // Add to store immediately for optimistic update
    addLearningBook(book);

    // Sync to database
    const success = await saveBook(book);
    
    if (!success) {
      toast.error('Không thể lưu vào database');
    } else {
      toast.success('Đã thêm sách!');
    }
    
    setNewBook({ title: '', author: '', totalPages: '' });
    setIsAddDialogOpen(false);
  };

  const updateCourseProgress = async (id: string, completedLessons: number) => {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    
    const status = completedLessons >= course.totalLessons ? 'completed' : 
                   completedLessons > 0 ? 'in_progress' : 'not_started';
    
    const updates: Partial<Course> = {
      completedLessons,
      status,
      startedAt: course.startedAt || (completedLessons > 0 ? format(new Date(), 'yyyy-MM-dd') : undefined),
      completedAt: status === 'completed' ? format(new Date(), 'yyyy-MM-dd') : undefined,
    };
    
    // Update store immediately for optimistic update
    updateLearningCourse(id, updates);
    
    // Sync to database
    await syncUpdateCourse(id, updates);
  };

  const updateBookProgress = async (id: string, currentPage: number) => {
    const book = books.find(b => b.id === id);
    if (!book) return;
    
    const status = currentPage >= book.totalPages ? 'completed' : 
                   currentPage > 0 ? 'reading' : 'want_to_read';
    
    const updates: Partial<Book> = {
      currentPage,
      status,
      startedAt: book.startedAt || (currentPage > 0 ? format(new Date(), 'yyyy-MM-dd') : undefined),
      completedAt: status === 'completed' ? format(new Date(), 'yyyy-MM-dd') : undefined,
    };
    
    // Update store immediately for optimistic update
    updateLearningBook(id, updates);
    
    // Sync to database
    await syncUpdateBook(id, updates);
  };

  const handleEditCourse = (course: Course) => {
    setEditingItem({ type: 'course', item: course });
    setNewCourse({
      title: course.title,
      description: course.description || '',
      category: course.category,
      totalLessons: course.totalLessons.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleEditBook = (book: Book) => {
    setEditingItem({ type: 'book', item: book });
    setNewBook({
      title: book.title,
      author: book.author,
      totalPages: book.totalPages.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCourse = async () => {
    if (!editingItem || editingItem.type !== 'course' || !newCourse.title || !newCourse.totalLessons) return;
    
    const course = editingItem.item as Course;
    const updates: Partial<Course> = {
      title: newCourse.title,
      description: newCourse.description || undefined,
      category: newCourse.category,
      totalLessons: parseInt(newCourse.totalLessons),
    };
    
    // Update store immediately for optimistic update
    updateLearningCourse(course.id, updates);
    
    // Sync to database
    const success = await syncUpdateCourse(course.id, updates);
    if (!success) {
      toast.error('Không thể cập nhật vào database');
    } else {
      toast.success('Đã cập nhật khóa học!');
    }
    
    setNewCourse({ title: '', description: '', category: 'programming', totalLessons: '' });
    setEditingItem(null);
    setIsEditDialogOpen(false);
  };

  const handleUpdateBook = async () => {
    if (!editingItem || editingItem.type !== 'book' || !newBook.title || !newBook.author || !newBook.totalPages) return;
    
    const book = editingItem.item as Book;
    const updates: Partial<Book> = {
      title: newBook.title,
      author: newBook.author,
      totalPages: parseInt(newBook.totalPages),
    };
    
    // Update store immediately for optimistic update
    updateLearningBook(book.id, updates);
    
    // Sync to database
    const success = await syncUpdateBook(book.id, updates);
    if (!success) {
      toast.error('Không thể cập nhật vào database');
    } else {
      toast.success('Đã cập nhật sách!');
    }
    
    setNewBook({ title: '', author: '', totalPages: '' });
    setEditingItem(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa khóa học này?')) return;
    
    // Delete from store immediately for optimistic update
    deleteLearningCourse(id);
    
    // Sync to database
    const success = await syncDeleteCourse(id);
    if (!success) {
      toast.error('Không thể xóa khỏi database');
    } else {
      toast.success('Đã xóa khóa học!');
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sách này?')) return;
    
    // Delete from store immediately for optimistic update
    deleteLearningBook(id);
    
    // Sync to database
    const success = await syncDeleteBook(id);
    if (!success) {
      toast.error('Không thể xóa khỏi database');
    } else {
      toast.success('Đã xóa sách!');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-500" />
            Học tập
          </h1>
          <p className="text-muted-foreground mt-1">Theo dõi khóa học và sách đọc</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Thêm mới</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm {addType === 'course' ? 'khóa học' : 'sách'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={addType === 'course' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setAddType('course')}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Khóa học
                </Button>
                <Button
                  variant={addType === 'book' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setAddType('book')}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Sách
                </Button>
              </div>
              
              {addType === 'course' ? (
                <>
                  <div className="space-y-2">
                    <Label>Tên khóa học</Label>
                    <Input
                      placeholder="VD: React Advanced..."
                      value={newCourse.title}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả (tùy chọn)</Label>
                    <Textarea
                      placeholder="Mô tả khóa học..."
                      value={newCourse.description}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Danh mục</Label>
                    <Select 
                      value={newCourse.category} 
                      onValueChange={(v) => setNewCourse(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEARNING_CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tổng số bài học</Label>
                    <Input
                      type="number"
                      placeholder="VD: 20"
                      value={newCourse.totalLessons}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, totalLessons: e.target.value }))}
                    />
                  </div>
                  <Button className="w-full" onClick={handleAddCourse}>Thêm khóa học</Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Tên sách</Label>
                    <Input
                      placeholder="VD: Atomic Habits..."
                      value={newBook.title}
                      onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tác giả</Label>
                    <Input
                      placeholder="VD: James Clear"
                      value={newBook.author}
                      onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tổng số trang</Label>
                    <Input
                      type="number"
                      placeholder="VD: 320"
                      value={newBook.totalPages}
                      onChange={(e) => setNewBook(prev => ({ ...prev, totalPages: e.target.value }))}
                    />
                  </div>
                  <Button className="w-full" onClick={handleAddBook}>Thêm sách</Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa {editingItem?.type === 'course' ? 'khóa học' : 'sách'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {editingItem?.type === 'course' ? (
                <>
                  <div className="space-y-2">
                    <Label>Tên khóa học</Label>
                    <Input
                      placeholder="VD: React Advanced..."
                      value={newCourse.title}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả (tùy chọn)</Label>
                    <Textarea
                      placeholder="Mô tả khóa học..."
                      value={newCourse.description}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Danh mục</Label>
                    <Select 
                      value={newCourse.category} 
                      onValueChange={(v) => setNewCourse(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEARNING_CATEGORIES.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tổng số bài học</Label>
                    <Input
                      type="number"
                      placeholder="VD: 20"
                      value={newCourse.totalLessons}
                      onChange={(e) => setNewCourse(prev => ({ ...prev, totalLessons: e.target.value }))}
                    />
                  </div>
                  <Button className="w-full" onClick={handleUpdateCourse}>Cập nhật khóa học</Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Tên sách</Label>
                    <Input
                      placeholder="VD: Atomic Habits..."
                      value={newBook.title}
                      onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tác giả</Label>
                    <Input
                      placeholder="VD: James Clear"
                      value={newBook.author}
                      onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tổng số trang</Label>
                    <Input
                      type="number"
                      placeholder="VD: 320"
                      value={newBook.totalPages}
                      onChange={(e) => setNewBook(prev => ({ ...prev, totalPages: e.target.value }))}
                    />
                  </div>
                  <Button className="w-full" onClick={handleUpdateBook}>Cập nhật sách</Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
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
          {/* Learning Score */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Điểm học tập</h3>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {learningScore}/10
                </Badge>
              </div>
              <Progress value={learningScore * 10} className="h-3" />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 text-blue-500 mb-2">
                  <Play className="w-4 h-4" />
                  <span className="text-sm font-medium">Đang học</span>
                </div>
                <p className="text-2xl font-bold">{stats.activeCourses}</p>
                <p className="text-xs text-muted-foreground">khóa học</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm font-medium">Hoàn thành</span>
                </div>
                <p className="text-2xl font-bold">{stats.completedCourses}</p>
                <p className="text-xs text-muted-foreground">khóa học</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 text-amber-500 mb-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">Đang đọc</span>
                </div>
                <p className="text-2xl font-bold">{stats.readingBooks}</p>
                <p className="text-xs text-muted-foreground">cuốn sách</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 text-purple-500 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Tổng giờ học</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalLearningHours.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">giờ</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="courses">Khóa học</TabsTrigger>
              <TabsTrigger value="books">Sách</TabsTrigger>
              <TabsTrigger value="linked">Liên kết</TabsTrigger>
              <TabsTrigger value="goals">Mục tiêu</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Khóa học ({courses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {courses.map(course => {
                      const category = LEARNING_CATEGORIES.find(c => c.id === course.category);
                      const progress = Math.round((course.completedLessons / course.totalLessons) * 100);
                      
                      return (
                        <div key={course.id} className="p-3 rounded-lg border">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-lg shrink-0">{category?.icon}</span>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{course.title}</p>
                                <p className="text-xs text-muted-foreground">{category?.name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={
                                course.status === 'completed' ? 'default' : 
                                course.status === 'in_progress' ? 'secondary' : 'outline'
                              }>
                                {course.status === 'completed' ? 'Hoàn thành' : 
                                 course.status === 'in_progress' ? 'Đang học' : 'Chưa bắt đầu'}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditCourse(course)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Chỉnh sửa
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDeleteCourse(course.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Xóa
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="flex-1 h-2" />
                            <span className="text-xs text-muted-foreground shrink-0">
                              {course.completedLessons}/{course.totalLessons}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => updateCourseProgress(course.id, Math.max(0, course.completedLessons - 1))}
                              disabled={course.completedLessons === 0}
                            >
                              -1
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => updateCourseProgress(course.id, Math.min(course.totalLessons, course.completedLessons + 1))}
                              disabled={course.completedLessons >= course.totalLessons}
                            >
                              +1 bài
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="books" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Sách ({books.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {books.map(book => {
                      const progress = Math.round((book.currentPage / book.totalPages) * 100);
                      
                      return (
                        <div key={book.id} className="p-3 rounded-lg border">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{book.title}</p>
                              <p className="text-xs text-muted-foreground">{book.author}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={
                                book.status === 'completed' ? 'default' : 
                                book.status === 'reading' ? 'secondary' : 'outline'
                              }>
                                {book.status === 'completed' ? 'Đã đọc' : 
                                 book.status === 'reading' ? 'Đang đọc' : 'Muốn đọc'}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditBook(book)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Chỉnh sửa
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDeleteBook(book.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Xóa
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          {book.rating && (
                            <div className="flex items-center gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star 
                                  key={i} 
                                  className={cn(
                                    "w-3 h-3", 
                                    i <= book.rating! ? "text-yellow-500 fill-yellow-500" : "text-muted"
                                  )} 
                                />
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="flex-1 h-2" />
                            <span className="text-xs text-muted-foreground shrink-0">
                              {book.currentPage}/{book.totalPages} trang
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => updateBookProgress(book.id, Math.min(book.totalPages, book.currentPage + 10))}
                              disabled={book.currentPage >= book.totalPages}
                            >
                              +10 trang
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs"
                              onClick={() => updateBookProgress(book.id, book.totalPages)}
                              disabled={book.currentPage >= book.totalPages}
                            >
                              Hoàn thành
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="linked" className="space-y-4">
              <AreaDashboardSection area="learning" />
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Mục tiêu học tập ({learningGoals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {learningGoals.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Chưa có mục tiêu học tập nào. Tạo mục tiêu mới trong module Goals!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {learningGoals.map(goal => (
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
                <ModuleHelpButton module="learning" />
              </div>

              {/* Currently Learning */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Play className="w-4 h-4 text-blue-500" />
                    Đang học
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {courses.filter(c => c.status === 'in_progress').slice(0, 3).map(course => {
                    const progress = Math.round((course.completedLessons / course.totalLessons) * 100);
                    return (
                      <div key={course.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate">{course.title}</span>
                          <span className="text-muted-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1" />
                      </div>
                    );
                  })}
                  {courses.filter(c => c.status === 'in_progress').length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Chưa có khóa học nào đang học
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Currently Reading */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    Đang đọc
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {books.filter(b => b.status === 'reading').map(book => {
                    const progress = Math.round((book.currentPage / book.totalPages) * 100);
                    return (
                      <div key={book.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate">{book.title}</span>
                          <span className="text-muted-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1" />
                      </div>
                    );
                  })}
                  {books.filter(b => b.status === 'reading').length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Chưa có sách nào đang đọc
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Learning Tips */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Mẹo học tập
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {LEARNING_TIPS.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                      <span>{tip.icon}</span>
                      <span className="text-muted-foreground">{tip.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Book Recommendations */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-500" />
                    Sách gợi ý
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {BOOK_RECOMMENDATIONS.map((book, index) => (
                    <div key={index} className="p-2 rounded-lg bg-muted/50 text-xs">
                      <p className="font-medium">{book.title}</p>
                      <p className="text-muted-foreground">{book.author}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Learning Goals */}
              {learningGoals.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-500" />
                      Mục tiêu học tập
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {learningGoals.slice(0, 3).map(goal => (
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
