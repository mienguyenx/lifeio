import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  useTranslations,
  useTranslationNamespaces,
  useUpdateTranslation,
  useCreateTranslation,
  useDeleteTranslation,
  Translation,
} from '@/hooks/useAdminData';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Languages,
  Filter,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

export default function AdminTranslations() {
  const { data: translations, isLoading: isLoadingTranslations } = useTranslations();
  const { data: namespaces } = useTranslationNamespaces();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterNamespace, setFilterNamespace] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');

  // Pagination
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Translation | null>(null);

  // Form states
  const [formData, setFormData] = useState<Translation>({
    language_code: 'en',
    namespace: '',
    key: '',
    value: '',
  });

  const updateTranslation = useUpdateTranslation();
  const createTranslation = useCreateTranslation();
  const deleteTranslation = useDeleteTranslation();

  // Derive unique languages from data
  const languages = useMemo(() => {
    if (!translations) return [];
    return [...new Set(translations.map((t) => t.language_code))].sort();
  }, [translations]);

  // Filter and search
  const filteredData = useMemo(() => {
    if (!translations) return [];
    return translations.filter((t) => {
      const matchesNamespace = filterNamespace === 'all' || t.namespace === filterNamespace;
      const matchesLanguage = filterLanguage === 'all' || t.language_code === filterLanguage;
      const matchesSearch =
        !searchQuery ||
        t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.namespace.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesNamespace && matchesLanguage && matchesSearch;
    });
  }, [translations, filterNamespace, filterLanguage, searchQuery]);

  // Pagination calculations
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterNamespace('all');
    setFilterLanguage('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || filterNamespace !== 'all' || filterLanguage !== 'all';

  // CRUD handlers
  const handleCreate = () => {
    if (!formData.namespace || !formData.key || !formData.value) {
      toast.error('Please fill all required fields');
      return;
    }
    createTranslation.mutate(formData, {
      onSuccess: () => {
        setShowAddDialog(false);
        setFormData({ language_code: 'en', namespace: '', key: '', value: '' });
      },
    });
  };

  const handleUpdate = () => {
    if (!formData.namespace || !formData.key || !formData.value) {
      toast.error('Please fill all required fields');
      return;
    }
    updateTranslation.mutate(formData, {
      onSuccess: () => {
        setShowEditDialog(false);
        setEditingItem(null);
      },
    });
  };

  const handleDelete = (item: Translation) => {
    if (confirm(`Delete translation "${item.namespace}.${item.key}" for ${item.language_code}?`)) {
      deleteTranslation.mutate({
        language_code: item.language_code,
        namespace: item.namespace,
        key: item.key,
      });
    }
  };

  const openEditDialog = (item: Translation) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowEditDialog(true);
  };

  if (isLoadingTranslations) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Languages className="h-6 w-6" />
            Translation Manager
          </h1>
          <p className="text-muted-foreground">
            Manage all translations ({translations?.length || 0} total records)
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Translation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Translation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Language Code *</Label>
                  <Input
                    placeholder="en, vi, ja..."
                    value={formData.language_code}
                    onChange={(e) => setFormData({ ...formData, language_code: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Namespace *</Label>
                  <Input
                    placeholder="common, auth, errors..."
                    value={formData.namespace}
                    onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Key *</Label>
                <Input
                  placeholder="save, cancel, login..."
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                />
              </div>
              <div>
                <Label>Value *</Label>
                <Textarea
                  placeholder="Translation value..."
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={createTranslation.isPending}>
                {createTranslation.isPending ? 'Creating...' : 'Create Translation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{translations?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Total Translations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{languages.length}</p>
            <p className="text-sm text-muted-foreground">Languages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{namespaces?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Namespaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{filteredData.length}</p>
            <p className="text-sm text-muted-foreground">Filtered Results</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by key, value, or namespace..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>
            <div className="w-40">
              <Label className="text-xs">Namespace</Label>
              <Select value={filterNamespace} onValueChange={handleFilterChange(setFilterNamespace)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Namespaces</SelectItem>
                  {namespaces?.map((ns) => (
                    <SelectItem key={ns} value={ns}>
                      {ns}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-32">
              <Label className="text-xs">Language</Label>
              <Select value={filterLanguage} onValueChange={handleFilterChange(setFilterLanguage)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Lang</TableHead>
                <TableHead className="w-32">Namespace</TableHead>
                <TableHead className="w-48">Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No translations found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, idx) => (
                  <TableRow key={`${item.language_code}-${item.namespace}-${item.key}-${idx}`}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.language_code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{item.namespace}</TableCell>
                    <TableCell className="font-mono text-xs">{item.key}</TableCell>
                    <TableCell className="max-w-md truncate" title={item.value}>
                      {item.value}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item)}
                          disabled={deleteTranslation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {startIndex + 1}-{endIndex} of {totalItems}
          </span>
          <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>per page</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Translation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Language Code</Label>
                <Input value={formData.language_code} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Namespace</Label>
                <Input value={formData.namespace} disabled className="bg-muted" />
              </div>
            </div>
            <div>
              <Label>Key</Label>
              <Input value={formData.key} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Value *</Label>
              <Textarea
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={handleUpdate} disabled={updateTranslation.isPending}>
              {updateTranslation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
