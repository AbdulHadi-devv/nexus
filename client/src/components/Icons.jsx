import {
  // Nav & branding
  Brain,
  BookOpen,
  Network,
  BarChart3,
  Tags,
  Bot,
  Sparkles,
  LogOut,
  Sun,
  Moon,
  
  // Item types
  FileText,
  Link2,
  Code2,
  Lightbulb,
  Library,
  
  // Actions
  Plus,
  Search,
  X,
  Edit3,
  Trash2,
  Share2,
  Star,
  Download,
  Upload,
  RefreshCw,
  Maximize,
  Zap,
  Keyboard,
  BookMarked,
  Save,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowRight,
  ArrowUpRight,
  
  // Status & feedback
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Loader2,
  
  // Features
  History,
  Tags as TagsIcon,
  FolderOpen,
  Link as LinkIcon,
  Lightbulb as LightbulbIcon,
  Wand2,
  Shuffle,
  Filter,
  Palette,
} from 'lucide-react';

// ============================================
// ITEM TYPE ICONS
// ============================================
export const ItemTypeIcons = {
  NOTE: FileText,
  BOOKMARK: Link2,
  CODE: Code2,
  IDEA: Lightbulb,
  RESOURCE: Library,
};

// ============================================
// NAVIGATION ICONS
// ============================================
export const NavIcons = {
  AIBuilder: Bot,
  Dashboard: BookOpen,
  Graph: Network,
  Stats: BarChart3,
  Tags: TagsIcon,
  Knowledge: Brain,
};

// ============================================
// TYPE ICON HELPER
// ============================================
export function ItemTypeIcon({ type, size = 16, className = '' }) {
  const Icon = ItemTypeIcons[type] || FileText;
  return <Icon size={size} className={className} strokeWidth={2} />;
}

// ============================================
// RE-EXPORTS
// ============================================
export {
  Brain, BookOpen, Network, BarChart3, Tags, Bot, Sparkles, LogOut, Sun, Moon,
  FileText, Link2, Code2, Lightbulb, Library,
  Plus, Search, X, Edit3, Trash2, Share2, Star, Download, Upload, RefreshCw,
  Maximize, Zap, Keyboard, BookMarked, Save, Copy, Check,
  ChevronRight, ChevronLeft, ArrowUp, ArrowRight, ArrowUpRight,
  AlertTriangle, CheckCircle2, Info, XCircle, Loader2,
  History, FolderOpen, Wand2, Shuffle, Filter, Palette,
};