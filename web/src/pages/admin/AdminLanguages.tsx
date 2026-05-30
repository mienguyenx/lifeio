import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  useAdminLanguages, 
  useUpdateLanguage, 
  useCreateLanguage, 
  useDeleteLanguage,
  useAITranslate,
  useTranslations,
  useTranslationNamespaces,
  AdminLanguage,
  Translation
} from '@/hooks/useAdminData';
import { Plus, Edit, Trash2, Languages, Sparkles, ArrowRightLeft, Copy, Check, Globe, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

// Common flags for language selection
const COMMON_FLAGS: Record<string, string> = {
  en: '🇺🇸', vi: '🇻🇳', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳',
  fr: '🇫🇷', de: '🇩🇪', es: '🇪🇸', it: '🇮🇹', pt: '🇵🇹',
  ru: '🇷🇺', ar: '🇸🇦', hi: '🇮🇳', th: '🇹🇭', id: '🇮🇩',
};

// Fallback sample translations if database is empty
const SAMPLE_TRANSLATIONS: Record<string, string> = {
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.search': 'Search',
};

export default function AdminLanguages() {
  const { data: languages, isLoading } = useAdminLanguages();
  const { data: translations, isLoading: isLoadingTranslations } = useTranslations();
  const { data: namespaces } = useTranslationNamespaces();
  const updateLanguage = useUpdateLanguage();
  const createLanguage = useCreateLanguage();
  const deleteLanguage = useDeleteLanguage();
  const aiTranslate = useAITranslate();

  // Dialog states
  const [showNewLanguage, setShowNewLanguage] = useState(false);
  const [showEditLanguage, setShowEditLanguage] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const [showBatchTranslate, setShowBatchTranslate] = useState(false);
  
  // Form states
  const [editingLanguage, setEditingLanguage] = useState<AdminLanguage | null>(null);
  const [newLanguage, setNewLanguage] = useState({ code: '', name: '', native_name: '', flag: '' });
  
  // Translator states
  const [translateText, setTranslateText] = useState('');
  const [translateResult, setTranslateResult] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('English');
  const [targetLanguage, setTargetLanguage] = useState('Vietnamese');
  const [translateContext, setTranslateContext] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ translation: string; context: string; formality: string }>>([]);
  
  // Batch translate states - use database translations or fallback to sample
  const [batchTranslations, setBatchTranslations] = useState<Record<string, string>>({});
  const [translatedBatch, setTranslatedBatch] = useState<Record<string, string>>({});
  const [batchTarget, setBatchTarget] = useState('Vietnamese');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');

  // Update batchTranslations when database translations load
  useEffect(() => {
    if (translations && translations.length > 0) {
      const translationsFromDB = translations
        .filter(t => t.language_code === 'en')
        .reduce((acc, t) => ({ ...acc, [`${t.namespace}.${t.key}`]: t.value }), {} as Record<string, string>);
      
      if (Object.keys(translationsFromDB).length > 0) {
        setBatchTranslations(translationsFromDB);
      } else {
        setBatchTranslations(SAMPLE_TRANSLATIONS);
      }
    } else if (!isLoadingTranslations) {
      // If no translations in DB and not loading, use sample
      setBatchTranslations(SAMPLE_TRANSLATIONS);
    }
  }, [translations, isLoadingTranslations]);

  // Filter translations by namespace
  const filteredTranslations = selectedNamespace === 'all' 
    ? batchTranslations 
    : Object.fromEntries(
        Object.entries(batchTranslations).filter(([key]) => key.startsWith(selectedNamespace + '.'))
      );

  // Stats
  const totalKeys = translations?.length || 0;
  const englishKeys = translations?.filter(t => t.language_code === 'en').length || 0;
  const uniqueNamespaces = namespaces?.length || 0;

  const handleToggle = (id: string, isActive: boolean) => {
    updateLanguage.mutate({ id, is_active: !isActive });
  };

  const handleCreateLanguage = () => {
    if (!newLanguage.code || !newLanguage.name || !newLanguage.native_name) {
      toast.error('Please fill in all required fields');
      return;
    }
    createLanguage.mutate({
      ...newLanguage,
      flag: newLanguage.flag || COMMON_FLAGS[newLanguage.code] || '🌐'
    }, {
      onSuccess: () => {
        setShowNewLanguage(false);
        setNewLanguage({ code: '', name: '', native_name: '', flag: '' });
      }
    });
  };

  const handleUpdateLanguage = () => {
    if (!editingLanguage) return;
    updateLanguage.mutate({
      id: editingLanguage.id,
      name: editingLanguage.name,
      native_name: editingLanguage.native_name,
      code: editingLanguage.code,
      flag: editingLanguage.flag || undefined,
      translation_progress: editingLanguage.translation_progress
    }, {
      onSuccess: () => {
        setShowEditLanguage(false);
        setEditingLanguage(null);
      }
    });
  };

  const handleDeleteLanguage = (id: string) => {
    if (confirm('Are you sure you want to delete this language?')) {
      deleteLanguage.mutate(id);
    }
  };

  const handleTranslate = async () => {
    if (!translateText) return;
    const result = await aiTranslate.mutateAsync({
      type: 'translate',
      content: translateText,
      sourceLanguage,
      targetLanguage,
      context: translateContext
    });
    setTranslateResult(result as string);
  };

  const handleSuggestTranslations = async () => {
    if (!translateText) return;
    const result = await aiTranslate.mutateAsync({
      type: 'suggest-translations',
      content: translateText,
      sourceLanguage,
      targetLanguage,
      context: translateContext
    });
    setSuggestions(result as Array<{ translation: string; context: string; formality: string }>);
  };

  const handleBatchTranslate = async () => {
    const result = await aiTranslate.mutateAsync({
      type: 'batch-translate',
      content: batchTranslations,
      sourceLanguage: 'English',
      targetLanguage: batchTarget
    });
    setTranslatedBatch(result as Record<string, string>);
    toast.success('Batch translation completed!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Languages</h1>
          <p className="text-muted-foreground">Manage app translations and localization</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showTranslator} onOpenChange={setShowTranslator}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Translator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Translator
                </DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="translate" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="translate">Translate</TabsTrigger>
                  <TabsTrigger value="suggest">Suggestions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="translate" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Source Language</Label>
                      <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">🇺🇸 English</SelectItem>
                          <SelectItem value="Vietnamese">🇻🇳 Vietnamese</SelectItem>
                          <SelectItem value="Japanese">🇯🇵 Japanese</SelectItem>
                          <SelectItem value="Korean">🇰🇷 Korean</SelectItem>
                          <SelectItem value="Chinese">🇨🇳 Chinese</SelectItem>
                          <SelectItem value="French">🇫🇷 French</SelectItem>
                          <SelectItem value="German">🇩🇪 German</SelectItem>
                          <SelectItem value="Spanish">🇪🇸 Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Target Language</Label>
                      <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Vietnamese">🇻🇳 Vietnamese</SelectItem>
                          <SelectItem value="English">🇺🇸 English</SelectItem>
                          <SelectItem value="Japanese">🇯🇵 Japanese</SelectItem>
                          <SelectItem value="Korean">🇰🇷 Korean</SelectItem>
                          <SelectItem value="Chinese">🇨🇳 Chinese</SelectItem>
                          <SelectItem value="French">🇫🇷 French</SelectItem>
                          <SelectItem value="German">🇩🇪 German</SelectItem>
                          <SelectItem value="Spanish">🇪🇸 Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Context (optional)</Label>
                    <Input 
                      placeholder="e.g., button label, error message, greeting..."
                      value={translateContext}
                      onChange={e => setTranslateContext(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Source Text</Label>
                      <Textarea 
                        className="min-h-[150px]"
                        placeholder="Enter text to translate..."
                        value={translateText}
                        onChange={e => setTranslateText(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Translation</Label>
                      <div className="relative">
                        <Textarea 
                          className="min-h-[150px]"
                          readOnly
                          value={translateResult}
                          placeholder="Translation will appear here..."
                        />
                        {translateResult && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(translateResult)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleTranslate}
                    disabled={aiTranslate.isPending || !translateText}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    {aiTranslate.isPending ? 'Translating...' : 'Translate'}
                  </Button>
                </TabsContent>
                
                <TabsContent value="suggest" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Source Language</Label>
                      <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="English">🇺🇸 English</SelectItem>
                          <SelectItem value="Vietnamese">🇻🇳 Vietnamese</SelectItem>
                          <SelectItem value="Japanese">🇯🇵 Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Target Language</Label>
                      <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Vietnamese">🇻🇳 Vietnamese</SelectItem>
                          <SelectItem value="English">🇺🇸 English</SelectItem>
                          <SelectItem value="Japanese">🇯🇵 Japanese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Text to Translate</Label>
                    <Textarea 
                      className="min-h-[100px]"
                      placeholder="Enter text to get translation suggestions..."
                      value={translateText}
                      onChange={e => setTranslateText(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleSuggestTranslations}
                    disabled={aiTranslate.isPending || !translateText}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {aiTranslate.isPending ? 'Generating...' : 'Get Suggestions'}
                  </Button>
                  
                  {suggestions.length > 0 && (
                    <div className="space-y-2">
                      <Label>Translation Suggestions</Label>
                      {suggestions.map((s, i) => (
                        <Card key={i}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{s.translation}</p>
                                <p className="text-sm text-muted-foreground">{s.context}</p>
                                <Badge variant="outline" className="mt-1">{s.formality}</Badge>
                              </div>
                              <Button size="icon" variant="ghost" onClick={() => copyToClipboard(s.translation)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <Dialog open={showBatchTranslate} onOpenChange={setShowBatchTranslate}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Languages className="h-4 w-4 mr-2" />
                Batch Translate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Batch Translation
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Namespace</Label>
                    <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
                      <SelectTrigger><SelectValue placeholder="All namespaces" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Namespaces ({Object.keys(batchTranslations).length} keys)</SelectItem>
                        {namespaces?.map(ns => (
                          <SelectItem key={ns} value={ns}>{ns}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Target Language</Label>
                    <Select value={batchTarget} onValueChange={setBatchTarget}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vietnamese">🇻🇳 Vietnamese</SelectItem>
                        <SelectItem value="Japanese">🇯🇵 Japanese</SelectItem>
                        <SelectItem value="Korean">🇰🇷 Korean</SelectItem>
                        <SelectItem value="Chinese">🇨🇳 Chinese</SelectItem>
                        <SelectItem value="French">🇫🇷 French</SelectItem>
                        <SelectItem value="German">🇩🇪 German</SelectItem>
                        <SelectItem value="Spanish">🇪🇸 Spanish</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleBatchTranslate}
                    disabled={aiTranslate.isPending}
                    className="mt-6"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {aiTranslate.isPending ? 'Translating...' : 'Translate All'}
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Showing {Object.keys(filteredTranslations).length} translation keys
                  {isLoadingTranslations && ' (loading from database...)'}
                </p>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Key</TableHead>
                      <TableHead>English</TableHead>
                      <TableHead>Translation</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(filteredTranslations).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-mono text-xs">{key}</TableCell>
                        <TableCell>{value}</TableCell>
                        <TableCell>
                          {translatedBatch[key] || <span className="text-muted-foreground italic">Not translated</span>}
                        </TableCell>
                        <TableCell>
                          {translatedBatch[key] && (
                            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(translatedBatch[key])}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {Object.keys(translatedBatch).length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => copyToClipboard(JSON.stringify(translatedBatch, null, 2))}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy All as JSON
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewLanguage} onOpenChange={setShowNewLanguage}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Language
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Language</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Language Code *</Label>
                    <Input 
                      placeholder="e.g., en, vi, ja"
                      value={newLanguage.code}
                      onChange={e => {
                        const code = e.target.value.toLowerCase();
                        setNewLanguage({
                          ...newLanguage,
                          code,
                          flag: COMMON_FLAGS[code] || newLanguage.flag
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Flag Emoji</Label>
                    <Input 
                      placeholder="🌐"
                      value={newLanguage.flag}
                      onChange={e => setNewLanguage({ ...newLanguage, flag: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Name (English) *</Label>
                  <Input 
                    placeholder="e.g., Vietnamese"
                    value={newLanguage.name}
                    onChange={e => setNewLanguage({ ...newLanguage, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Native Name *</Label>
                  <Input 
                    placeholder="e.g., Tiếng Việt"
                    value={newLanguage.native_name}
                    onChange={e => setNewLanguage({ ...newLanguage, native_name: e.target.value })}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCreateLanguage}
                  disabled={createLanguage.isPending}
                >
                  {createLanguage.isPending ? 'Creating...' : 'Create Language'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{languages?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Languages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{languages?.filter(l => l.is_active).length || 0}</p>
                <p className="text-sm text-muted-foreground">Active Languages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Languages className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.round((languages?.reduce((acc, l) => acc + l.translation_progress, 0) || 0) / (languages?.length || 1))}%
                </p>
                <p className="text-sm text-muted-foreground">Avg. Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{totalKeys}</p>
                <p className="text-sm text-muted-foreground">
                  Total Keys {englishKeys > 0 && `(${englishKeys} EN)`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{uniqueNamespaces}</p>
                <p className="text-sm text-muted-foreground">Namespaces</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Languages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {languages?.map((lang) => (
          <Card key={lang.id} className={lang.is_active ? 'border-primary/50' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{lang.flag || '🌐'}</span>
                  <div>
                    <CardTitle className="text-lg">{lang.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{lang.native_name}</p>
                  </div>
                </div>
                <Switch 
                  checked={lang.is_active} 
                  onCheckedChange={() => handleToggle(lang.id, lang.is_active)} 
                  disabled={updateLanguage.isPending} 
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">{lang.code}</Badge>
                  {lang.is_active && (
                    <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Active
                    </Badge>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Translation Progress</span>
                    <span className="font-medium">{lang.translation_progress}%</span>
                  </div>
                  <Progress value={lang.translation_progress} className="h-2" />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setEditingLanguage(lang);
                      setShowEditLanguage(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteLanguage(lang.id)}
                    disabled={deleteLanguage.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Language Dialog */}
      <Dialog open={showEditLanguage} onOpenChange={setShowEditLanguage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Language</DialogTitle>
          </DialogHeader>
          {editingLanguage && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Language Code</Label>
                  <Input 
                    value={editingLanguage.code}
                    onChange={e => setEditingLanguage({ ...editingLanguage, code: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Flag Emoji</Label>
                  <Input 
                    value={editingLanguage.flag || ''}
                    onChange={e => setEditingLanguage({ ...editingLanguage, flag: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Name (English)</Label>
                <Input 
                  value={editingLanguage.name}
                  onChange={e => setEditingLanguage({ ...editingLanguage, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Native Name</Label>
                <Input 
                  value={editingLanguage.native_name}
                  onChange={e => setEditingLanguage({ ...editingLanguage, native_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Translation Progress (%)</Label>
                <Input 
                  type="number"
                  min="0"
                  max="100"
                  value={editingLanguage.translation_progress}
                  onChange={e => setEditingLanguage({ 
                    ...editingLanguage, 
                    translation_progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  })}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleUpdateLanguage}
                disabled={updateLanguage.isPending}
              >
                {updateLanguage.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
