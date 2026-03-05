import React, { useState, useRef, useCallback, useEffect } from 'react';
import ResumeDocument from './components/ResumeDocument';
import { ResumeData, ResumeConfig, ResumeSectionKey } from './types';
import { Printer, Settings, Sliders, Layout, Type, Upload, Download, User, GraduationCap, Briefcase, Trash2, Bold, Italic, List, ListOrdered, ListIndentDecrease, ListIndentIncrease, Edit3, Plus, ChevronDown, ChevronRight, Code, Link as LinkIcon, RemoveFormatting, Undo2, Redo2, X } from 'lucide-react';

// --- Components ---

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  linkUnderline?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className, linkUnderline = true }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeState, setActiveState] = useState({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
    orderedList: false,
  });

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;

    const html = el.innerHTML.trim();
    if (html === '<br>' || html === '<div><br></div>' || html === '<p><br></p>') {
      onChange('');
      return;
    }

    onChange(html);
  }, [onChange]);

  const refreshActiveState = useCallback(() => {
    setActiveState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      unorderedList: document.queryCommandState('insertUnorderedList'),
      orderedList: document.queryCommandState('insertOrderedList'),
    });
  }, []);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const next = value || '';
    if (el.innerHTML !== next) {
      el.innerHTML = next;
    }
    refreshActiveState();
  }, [value, refreshActiveState]);

  const runCommand = (command: string, commandValue?: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    if (command === 'removeFormat') {
      document.execCommand('removeFormat', false);
      document.execCommand('unlink', false);
    } else {
      document.execCommand(command, false, commandValue);
    }
    emitChange();
    refreshActiveState();
  };

  const handleInsertLink = () => {
    const urlInput = window.prompt('请输入链接地址（如 https://example.com）', 'https://');
    if (!urlInput) return;
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    const normalizedUrl = /^(https?:\/\/|mailto:|tel:)/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    runCommand('createLink', normalizedUrl);
  };

  const handleToolbarMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  const toolbarButtonClass = (active?: boolean) =>
    `p-1.5 rounded text-gray-700 hover:bg-gray-200 shrink-0 ${active ? 'bg-gray-200' : ''}`;

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1.5 border-b border-gray-200">
        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => runCommand('undo')} className={toolbarButtonClass()} title="撤销"><Undo2 className="w-4 h-4" /></button>
        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => runCommand('redo')} className={toolbarButtonClass()} title="重做"><Redo2 className="w-4 h-4" /></button>

        <div className="w-px h-4 bg-gray-300 mx-1"></div>

        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => runCommand('bold')} className={toolbarButtonClass(activeState.bold)} title="加粗"><Bold className="w-4 h-4" /></button>
        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => runCommand('italic')} className={toolbarButtonClass(activeState.italic)} title="斜体"><Italic className="w-4 h-4" /></button>
        <button
          type="button"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => runCommand('underline')}
          className={toolbarButtonClass(activeState.underline)}
          title="下划线（再次点击可取消）"
        >
          <span className="text-sm font-semibold underline leading-none">U</span>
        </button>

        <div className="w-px h-4 bg-gray-300 mx-1"></div>

        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => runCommand('insertUnorderedList')} className={toolbarButtonClass(activeState.unorderedList)} title="无序列表"><List className="w-4 h-4" /></button>
        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => runCommand('insertOrderedList')} className={toolbarButtonClass(activeState.orderedList)} title="有序列表"><ListOrdered className="w-4 h-4" /></button>
        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => runCommand('outdent')} className={toolbarButtonClass()} title="减少缩进"><ListIndentDecrease className="w-4 h-4" /></button>
        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => runCommand('indent')} className={toolbarButtonClass()} title="增加缩进"><ListIndentIncrease className="w-4 h-4" /></button>

        <div className="w-px h-4 bg-gray-300 mx-1"></div>

        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={handleInsertLink} className={toolbarButtonClass()} title="插入链接"><LinkIcon className="w-4 h-4" /></button>
        <button type="button" onMouseDown={handleToolbarMouseDown} onClick={() => runCommand('removeFormat')} className={toolbarButtonClass()} title="清除格式"><RemoveFormatting className="w-4 h-4" /></button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder || '请输入内容...'}
        onInput={emitChange}
        onBlur={emitChange}
        onMouseUp={refreshActiveState}
        onKeyUp={refreshActiveState}
        className={`w-full min-h-32 max-h-72 overflow-auto p-3 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-100 outline-none whitespace-pre-wrap break-words [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-gray-400 [&:empty:before]:pointer-events-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-0.5 [&_p]:my-1 [&_a]:text-gray-900 [&_u]:underline ${linkUnderline ? '[&_a]:underline' : '[&_a]:no-underline'}`}
      />
    </div>
  );
};

interface TagManagerProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

const TagManager: React.FC<TagManagerProps> = ({ tags, onChange }) => {
  const [inputVal, setInputVal] = useState('');

  const addTag = () => {
    const trimmed = inputVal.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInputVal('');
    }
  };

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <span key={idx} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
            {tag}
            <button onClick={() => removeTag(idx)} className="hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入标签 (如 211)"
          className="flex-1 min-w-0 p-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 bg-white"
        />
        <button onClick={addTag} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-medium transition-colors">
          添加
        </button>
      </div>
    </div>
  );
};

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
}

interface ResumeThumbnailProps {
  data: ResumeData;
  config: ResumeConfig;
  sectionOrder: SectionId[];
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, children, isOpen, onToggle, action }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
      <div
        className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 text-gray-700 font-bold">
          {icon}
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {action && <div onClick={e => e.stopPropagation()}>{action}</div>}
          {isOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-gray-100 bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

const THUMB_BASE_WIDTH_PX = 794; // A4 width at 96dpi approx

const ResumeThumbnail: React.FC<ResumeThumbnailProps> = ({ data, config, sectionOrder }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.32);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      if (!width) return;
      setScale(Math.max(0.18, Math.min(1, width / THUMB_BASE_WIDTH_PX)));
    };

    updateScale();

    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const observer = new ResizeObserver(() => updateScale());
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div ref={containerRef} className="relative aspect-[210/297] overflow-hidden bg-transparent">
      <div
        className="absolute left-0 top-0 origin-top-left pointer-events-none"
        style={{
          transform: `scale(${scale})`,
          width: `${100 / scale}%`,
        }}
      >
        <ResumeDocument
          data={data}
          config={config}
          sectionOrder={sectionOrder}
          showOnlyFirstPage
          isThumbnail
          isPrintMode={false}
        />
      </div>
    </div>
  );
};

const FONT_OPTIONS = [
  { name: "微软雅黑 (Microsoft YaHei)", value: '"Microsoft YaHei", "SimHei", "PingFang SC", sans-serif' },
  { name: "宋体 (SimSun)", value: '"SimSun", "STSong", "Songti SC", serif' },
  { name: "仿宋 (FangSong)", value: '"FangSong", "STFangsong", serif' },
  { name: "楷体 (KaiTi)", value: '"KaiTi", "STKaiti", serif' },
];

type SectionId = ResumeSectionKey;
type ItemSectionId = 'education' | 'projects' | 'work';

interface SavedResumeDocument {
  id: string;
  name: string;
  updatedAt: string;
  data: ResumeData;
  config: ResumeConfig;
  sectionOrder: SectionId[];
}

interface ResumeBackupPayload {
  version: 1;
  exportedAt: string;
  resumes: SavedResumeDocument[];
  activeResumeId: string | null;
}

const DEFAULT_SECTION_ORDER: SectionId[] = ['education', 'projects', 'work', 'skills'];
const STORAGE_KEY = 'resume_builder_saved_resumes_v2';
const ACTIVE_RESUME_ID_KEY = 'resume_builder_active_id_v2';

const DEFAULT_CONFIG: ResumeConfig = {
  baseFontSize: 9.5,
  lineHeight: 1.5,
  pagePaddingX: 12,
  pagePaddingY: 12,
  itemSpacing: 3,
  sectionSpacing: 4,
  linkUnderline: true,
  fontFamily: FONT_OPTIONS[0].value,
  avatar: {
    top: 15,
    right: 20,
    width: 25,
    height: 35,
  },
};

const EMPTY_RESUME_DATA: ResumeData = {
  name: '',
  title: '',
  avatarUrl: '',
  contact: {
    phone: '',
    email: '',
    website: '',
    politicalStatus: '',
  },
  education: [],
  projects: [],
  workExperience: [],
  skills: {
    title: '专业技能',
    items: [''],
  },
};

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const MIN_PREVIEW_ZOOM = 0.7;
const MAX_PREVIEW_ZOOM = 2;
const ZOOM_STEP = 0.08;
const clampPreviewZoom = (value: number) => Math.min(MAX_PREVIEW_ZOOM, Math.max(MIN_PREVIEW_ZOOM, value));

const moveInArray = <T,>(arr: T[], fromIndex: number, toIndex: number): T[] => {
  const next = [...arr];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringValue = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const toNumberValue = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const normalizeEducationItem = (value: unknown): ResumeData['education'][number] => {
  const source = isRecord(value) ? value : {};
  const rawTags = Array.isArray(source.tags) ? source.tags : [];
  return {
    school: toStringValue(source.school),
    degree: toStringValue(source.degree),
    major: toStringValue(source.major),
    duration: toStringValue(source.duration),
    tags: rawTags.filter((tag): tag is string => typeof tag === 'string'),
    content: toStringValue(source.content),
  };
};

const normalizeExperienceItem = (value: unknown): ResumeData['projects'][number] => {
  const source = isRecord(value) ? value : {};
  return {
    company: toStringValue(source.company),
    role: toStringValue(source.role),
    title: toStringValue(source.title),
    duration: toStringValue(source.duration),
    description: toStringValue(source.description),
    techStack: toStringValue(source.techStack),
    content: toStringValue(source.content),
  };
};

const normalizeResumeData = (value: unknown): ResumeData => {
  const source = isRecord(value) ? value : {};
  const contact = isRecord(source.contact) ? source.contact : {};
  const skills = isRecord(source.skills) ? source.skills : {};
  const rawSkillItems = Array.isArray(skills.items) ? skills.items : [];

  return {
    name: toStringValue(source.name),
    title: toStringValue(source.title),
    avatarUrl: toStringValue(source.avatarUrl),
    contact: {
      phone: toStringValue(contact.phone),
      email: toStringValue(contact.email),
      website: toStringValue(contact.website),
      politicalStatus: toStringValue(contact.politicalStatus),
    },
    education: Array.isArray(source.education) ? source.education.map(normalizeEducationItem) : [],
    projects: Array.isArray(source.projects) ? source.projects.map(normalizeExperienceItem) : [],
    workExperience: Array.isArray(source.workExperience) ? source.workExperience.map(normalizeExperienceItem) : [],
    skills: {
      title: toStringValue(skills.title, EMPTY_RESUME_DATA.skills.title),
      items: rawSkillItems.filter((item): item is string => typeof item === 'string'),
    },
  };
};

const normalizeResumeConfig = (value: unknown): ResumeConfig => {
  const source = isRecord(value) ? value : {};
  const avatar = isRecord(source.avatar) ? source.avatar : {};

  return {
    baseFontSize: toNumberValue(source.baseFontSize, DEFAULT_CONFIG.baseFontSize),
    lineHeight: toNumberValue(source.lineHeight, DEFAULT_CONFIG.lineHeight),
    pagePaddingX: toNumberValue(source.pagePaddingX, DEFAULT_CONFIG.pagePaddingX),
    pagePaddingY: toNumberValue(source.pagePaddingY, DEFAULT_CONFIG.pagePaddingY),
    itemSpacing: toNumberValue(source.itemSpacing, DEFAULT_CONFIG.itemSpacing),
    sectionSpacing: toNumberValue(source.sectionSpacing, DEFAULT_CONFIG.sectionSpacing),
    linkUnderline: typeof source.linkUnderline === 'boolean' ? source.linkUnderline : DEFAULT_CONFIG.linkUnderline,
    fontFamily: toStringValue(source.fontFamily, DEFAULT_CONFIG.fontFamily),
    avatar: {
      top: toNumberValue(avatar.top, DEFAULT_CONFIG.avatar.top),
      right: toNumberValue(avatar.right, DEFAULT_CONFIG.avatar.right),
      width: toNumberValue(avatar.width, DEFAULT_CONFIG.avatar.width),
      height: toNumberValue(avatar.height, DEFAULT_CONFIG.avatar.height),
    },
  };
};

const ensureSectionOrder = (value?: string[]): SectionId[] => {
  if (!value || value.length === 0) return [...DEFAULT_SECTION_ORDER];
  const cleaned = value.filter((s): s is SectionId => DEFAULT_SECTION_ORDER.includes(s as SectionId));
  const dedup = Array.from(new Set(cleaned));
  for (const key of DEFAULT_SECTION_ORDER) {
    if (!dedup.includes(key)) dedup.push(key);
  }
  return dedup;
};

const normalizeSavedResumeDocument = (value: unknown, index: number): SavedResumeDocument | null => {
  if (!isRecord(value)) return null;

  const now = new Date().toISOString();
  const id = toStringValue(value.id, `${Date.now()}-import-${index}`);

  return {
    id,
    name: toStringValue(value.name, '导入简历'),
    updatedAt: toStringValue(value.updatedAt, now),
    data: normalizeResumeData(value.data),
    config: normalizeResumeConfig(value.config),
    sectionOrder: ensureSectionOrder(
      Array.isArray(value.sectionOrder)
        ? value.sectionOrder.filter((item): item is string => typeof item === 'string')
        : undefined
    ),
  };
};

const extractBackupDocuments = (value: unknown): unknown[] | null => {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return null;

  if (Array.isArray(value.resumes)) return value.resumes;
  if (isRecord(value.resume)) return [value.resume];

  if ('data' in value && 'config' in value) return [value];
  return null;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content');
  const [view, setView] = useState<'home' | 'editor'>('home');
  const [savedResumes, setSavedResumes] = useState<SavedResumeDocument[]>([]);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData>(deepClone(EMPTY_RESUME_DATA));
  const [config, setConfig] = useState<ResumeConfig>(deepClone(DEFAULT_CONFIG));
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>([...DEFAULT_SECTION_ORDER]);
  const [zoom, setZoom] = useState(1);
  const [isPanningPreview, setIsPanningPreview] = useState(false);
  const [pdfRefreshToken, setPdfRefreshToken] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const resumeRef = useRef<HTMLDivElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSystemPrinting, setIsSystemPrinting] = useState(false);

  // Collapsible State
  const [sectionsOpen, setSectionsOpen] = useState({
    basic: false,
    education: false,
    work: false,
    projects: false,
    skills: false,
  });
  const [itemOpen, setItemOpen] = useState({
    education: [] as boolean[],
    projects: [] as boolean[],
    work: [] as boolean[],
  });
  const [isSectionOrderOpen, setIsSectionOrderOpen] = useState(false);
  const [draggingSection, setDraggingSection] = useState<SectionId | null>(null);
  const [sectionDropTarget, setSectionDropTarget] = useState<SectionId | null>(null);
  const [activeItemSortPanel, setActiveItemSortPanel] = useState<ItemSectionId | null>(null);
  const [draggingItem, setDraggingItem] = useState<{ section: ItemSectionId; index: number } | null>(null);
  const [itemDropTarget, setItemDropTarget] = useState<{ section: ItemSectionId; index: number } | null>(null);
  const orderMenuRef = useRef<HTMLDivElement>(null);
  const itemSortPanelRef = useRef<HTMLDivElement>(null);

  const sectionLabels: Record<SectionId, string> = {
    education: '教育背景',
    projects: '项目经历',
    work: '实习/工作经历',
    skills: '专业技能',
  };

  const toggleSection = (key: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleItemOpen = (section: ItemSectionId, index: number) => {
    setItemOpen((prev) => {
      const nextSection = [...prev[section]];
      nextSection[index] = !nextSection[index];
      return { ...prev, [section]: nextSection };
    });
  };

  const createSavedResume = (name?: string): SavedResumeDocument => {
    const now = new Date().toISOString();
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name || '我的简历',
      updatedAt: now,
      data: deepClone(EMPTY_RESUME_DATA),
      config: deepClone(DEFAULT_CONFIG),
      sectionOrder: [...DEFAULT_SECTION_ORDER],
    };
  };

  const openResume = (doc: SavedResumeDocument) => {
    setResumeData(deepClone(doc.data));
    setConfig(deepClone(doc.config));
    setSectionOrder(ensureSectionOrder(doc.sectionOrder));
    setSectionsOpen({
      basic: false,
      education: false,
      work: false,
      projects: false,
      skills: false,
    });
    setItemOpen({
      education: Array.from({ length: doc.data.education.length }, () => false),
      projects: Array.from({ length: doc.data.projects.length }, () => false),
      work: Array.from({ length: doc.data.workExperience.length }, () => false),
    });
    setCurrentResumeId(doc.id);
    setActiveTab('content');
    setView('editor');
  };

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const activeId = localStorage.getItem(ACTIVE_RESUME_ID_KEY);

    if (!raw) {
      const initialDoc = createSavedResume('我的简历');
      setSavedResumes([initialDoc]);
      setCurrentResumeId(initialDoc.id);
      setResumeData(deepClone(initialDoc.data));
      setConfig(deepClone(initialDoc.config));
      setSectionOrder([...initialDoc.sectionOrder]);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as SavedResumeDocument[];
      const normalized = parsed.map((item) => ({
        ...item,
        sectionOrder: ensureSectionOrder(item.sectionOrder),
      }));
      setSavedResumes(normalized);

      const target = normalized.find((item) => item.id === activeId) || normalized[0];
      if (target) {
        setCurrentResumeId(target.id);
        setResumeData(deepClone(target.data));
        setConfig(deepClone(target.config));
        setSectionOrder([...target.sectionOrder]);
      }
    } catch (err) {
      console.error('Failed to load saved resumes:', err);
      const fallback = createSavedResume('我的简历');
      setSavedResumes([fallback]);
      setCurrentResumeId(fallback.id);
      setResumeData(deepClone(fallback.data));
      setConfig(deepClone(fallback.config));
      setSectionOrder([...fallback.sectionOrder]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedResumes));
  }, [savedResumes]);

  useEffect(() => {
    if (!currentResumeId) return;
    localStorage.setItem(ACTIVE_RESUME_ID_KEY, currentResumeId);
  }, [currentResumeId]);

  const persistCurrentResume = useCallback(() => {
    if (!currentResumeId) return;
    const now = new Date().toISOString();
    const name = resumeData.name?.trim() || '未命名简历';
    const title = resumeData.title?.trim();
    const displayName = title ? `${name} - ${title}` : name;

    setSavedResumes((prev) => {
      let found = false;
      const next = prev.map((item) => {
        if (item.id !== currentResumeId) return item;
        found = true;
        return {
          ...item,
          name: displayName,
          updatedAt: now,
          data: deepClone(resumeData),
          config: deepClone(config),
          sectionOrder: [...sectionOrder],
        };
      });
      if (!found) {
        next.unshift({
          id: currentResumeId,
          name: displayName,
          updatedAt: now,
          data: deepClone(resumeData),
          config: deepClone(config),
          sectionOrder: [...sectionOrder],
        });
      }
      return next;
    });
  }, [currentResumeId, resumeData, config, sectionOrder]);

  useEffect(() => {
    persistCurrentResume();
  }, [persistCurrentResume]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!isSectionOrderOpen) return;
      if (!orderMenuRef.current) return;
      const target = e.target as Node;
      if (!orderMenuRef.current.contains(target)) {
        setIsSectionOrderOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isSectionOrderOpen]);

  useEffect(() => {
    if (!activeItemSortPanel) return;

    const handleItemSortOutsideClick = (e: MouseEvent) => {
      if (draggingItem) return;
      if (!itemSortPanelRef.current) return;
      const target = e.target as Node;
      if (!itemSortPanelRef.current.contains(target)) {
        setActiveItemSortPanel(null);
        setItemDropTarget(null);
      }
    };

    document.addEventListener('mousedown', handleItemSortOutsideClick);
    return () => document.removeEventListener('mousedown', handleItemSortOutsideClick);
  }, [activeItemSortPanel, draggingItem]);

  useEffect(() => {
    setItemOpen((prev) => ({
      education: Array.from({ length: resumeData.education.length }, (_, i) => prev.education[i] ?? false),
      projects: Array.from({ length: resumeData.projects.length }, (_, i) => prev.projects[i] ?? false),
      work: Array.from({ length: resumeData.workExperience.length }, (_, i) => prev.work[i] ?? false),
    }));
  }, [resumeData.education.length, resumeData.projects.length, resumeData.workExperience.length]);

  useEffect(() => {
    const handleSaveShortcut = (e: KeyboardEvent) => {
      const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's';
      if (!isSave) return;
      e.preventDefault();
      if (view !== 'editor') return;

      persistCurrentResume();
      setPdfRefreshToken((prev) => prev + 1);
    };

    window.addEventListener('keydown', handleSaveShortcut);
    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, [view, persistCurrentResume]);

  // Ctrl + 滚轮缩放
  useEffect(() => {
    if (view !== 'editor') return;
    const el = previewRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      const shouldZoom = e.ctrlKey || e.metaKey;
      if (!shouldZoom) return;
      e.preventDefault();
      e.stopPropagation();
      setZoom(prev => {
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        return clampPreviewZoom(prev + delta);
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [view]);

  // 放大后可按住左键拖拽预览区域平移
  useEffect(() => {
    if (view !== 'editor') return;
    const el = previewRef.current;
    if (!el) return;

    const endPan = () => {
      panStartRef.current = null;
      setIsPanningPreview(false);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (zoom <= 1) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('.avatar-drag-target')) return;

      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      };
      setIsPanningPreview(true);
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const start = panStartRef.current;
      if (!start) return;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      el.scrollLeft = start.scrollLeft - dx;
      el.scrollTop = start.scrollTop - dy;
    };

    el.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', endPan);
    window.addEventListener('blur', endPan);
    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', endPan);
      window.removeEventListener('blur', endPan);
    };
  }, [view, zoom]);

  useEffect(() => {
    if (zoom <= 1 && isPanningPreview) {
      panStartRef.current = null;
      setIsPanningPreview(false);
    }
  }, [zoom, isPanningPreview]);

  useEffect(() => {
    const handleBeforePrint = () => {
      setIsSystemPrinting(true);
      setIsExporting(true);
    };

    const handleAfterPrint = () => {
      setIsSystemPrinting(false);
      setIsExporting(false);
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handlePrint = async () => {
    if (!resumeRef.current || isExporting) return;
    setIsExporting(true);
    setIsSystemPrinting(true);

    try {
      const fontSet = (document as Document & { fonts?: FontFaceSet }).fonts;
      if (fontSet) {
        await fontSet.ready;
      }
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      window.print();
      // Fallback for browsers that do not fire afterprint reliably.
      setTimeout(() => setIsExporting(false), 800);
    } catch (err) {
      console.error('System print failed:', err);
      setIsSystemPrinting(false);
      setIsExporting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResumeData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Data Helpers ---

  const handleSectionDrop = (targetSection: SectionId) => {
    if (!draggingSection || draggingSection === targetSection) return;
    setSectionOrder((prev) => {
      const from = prev.indexOf(draggingSection);
      const to = prev.indexOf(targetSection);
      if (from < 0 || to < 0) return prev;
      return moveInArray(prev, from, to);
    });
    setDraggingSection(null);
    setSectionDropTarget(null);
  };

  const moveItemTo = (section: ItemSectionId, fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;

    if (section === 'education') {
      setResumeData((prev) => {
        if (fromIndex >= prev.education.length || toIndex >= prev.education.length) return prev;
        return { ...prev, education: moveInArray(prev.education, fromIndex, toIndex) };
      });
      setItemOpen((prev) => {
        if (fromIndex >= prev.education.length || toIndex >= prev.education.length) return prev;
        return { ...prev, education: moveInArray(prev.education, fromIndex, toIndex) };
      });
      return;
    }

    if (section === 'projects') {
      setResumeData((prev) => {
        if (fromIndex >= prev.projects.length || toIndex >= prev.projects.length) return prev;
        return { ...prev, projects: moveInArray(prev.projects, fromIndex, toIndex) };
      });
      setItemOpen((prev) => {
        if (fromIndex >= prev.projects.length || toIndex >= prev.projects.length) return prev;
        return { ...prev, projects: moveInArray(prev.projects, fromIndex, toIndex) };
      });
      return;
    }

    setResumeData((prev) => {
      if (fromIndex >= prev.workExperience.length || toIndex >= prev.workExperience.length) return prev;
      return { ...prev, workExperience: moveInArray(prev.workExperience, fromIndex, toIndex) };
    });
    setItemOpen((prev) => {
      if (fromIndex >= prev.work.length || toIndex >= prev.work.length) return prev;
      return { ...prev, work: moveInArray(prev.work, fromIndex, toIndex) };
    });
  };

  const getItemTitles = (section: ItemSectionId): string[] => {
    if (section === 'education') {
      return resumeData.education.map((item) => `${item.school} ${item.degree} ${item.major}`.trim() || '教育条目');
    }
    if (section === 'projects') {
      return resumeData.projects.map((item) => item.company?.trim() || '项目条目');
    }
    return resumeData.workExperience.map((item) => `${item.company}${item.role ? ` - ${item.role}` : ''}`.trim() || '经历条目');
  };

  const handleItemDrop = (section: ItemSectionId, targetIndex: number) => {
    if (!draggingItem || draggingItem.section !== section) return;
    moveItemTo(section, draggingItem.index, targetIndex);
    setDraggingItem(null);
    setItemDropTarget(null);
  };

  const createResumeAndEdit = () => {
    const doc = createSavedResume(`我的简历 ${savedResumes.length + 1}`);
    setSavedResumes((prev) => [doc, ...prev]);
    openResume(doc);
  };

  const downloadBackup = (payload: ResumeBackupPayload, filePrefix: string) => {
    const stamp = payload.exportedAt.replace(/[:.]/g, '-');
    const fileName = `${filePrefix}-${stamp}.json`;

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(blobUrl);
  };

  const handleExportAllBackups = () => {
    downloadBackup(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        resumes: savedResumes,
        activeResumeId: currentResumeId,
      },
      'resume-backup-all'
    );
  };

  const handleExportSingleResume = (doc: SavedResumeDocument) => {
    downloadBackup(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        resumes: [doc],
        activeResumeId: doc.id,
      },
      `resume-backup-${doc.name || 'single'}`
    );
  };

  const triggerImportBackup = () => {
    backupFileInputRef.current?.click();
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);

      const rawDocuments = extractBackupDocuments(parsed);

      if (!rawDocuments) {
        throw new Error('Invalid backup payload.');
      }

      const normalized = rawDocuments
        .map((item, index) => normalizeSavedResumeDocument(item, index))
        .filter((item): item is SavedResumeDocument => item !== null);

      if (normalized.length === 0) {
        throw new Error('Backup has no resumes.');
      }

      const usedIds = new Set<string>();
      const importedDocs = normalized.map((doc, index) => {
        const baseId = doc.id || `${Date.now()}-import-${index}`;
        if (!usedIds.has(baseId)) {
          usedIds.add(baseId);
          return { ...doc, id: baseId };
        }

        let suffix = 1;
        let candidate = `${baseId}-${suffix}`;
        while (usedIds.has(candidate)) {
          suffix += 1;
          candidate = `${baseId}-${suffix}`;
        }
        usedIds.add(candidate);
        return { ...doc, id: candidate };
      });

      const existingById = new Map(savedResumes.map((item) => [item.id, item]));
      let replacedCount = 0;
      importedDocs.forEach((doc) => {
        if (existingById.has(doc.id)) replacedCount += 1;
      });

      const mergedResumes = [
        ...importedDocs,
        ...savedResumes.filter((item) => !importedDocs.some((doc) => doc.id === item.id)),
      ];

      const importedActiveId =
        isRecord(parsed) && typeof parsed.activeResumeId === 'string' ? parsed.activeResumeId : null;

      const currentStillExists =
        currentResumeId !== null && mergedResumes.some((item) => item.id === currentResumeId);
      const targetId = currentStillExists
        ? currentResumeId
        : importedActiveId && mergedResumes.some((item) => item.id === importedActiveId)
          ? importedActiveId
          : mergedResumes[0].id;
      const targetResume = mergedResumes.find((item) => item.id === targetId) || mergedResumes[0];

      setSavedResumes(mergedResumes);
      setCurrentResumeId(targetResume.id);
      setResumeData(deepClone(targetResume.data));
      setConfig(deepClone(targetResume.config));
      setSectionOrder(ensureSectionOrder(targetResume.sectionOrder));
      setPdfRefreshToken((prev) => prev + 1);

      const addedCount = importedDocs.length - replacedCount;
      window.alert(`已自动识别并导入 ${importedDocs.length} 份简历（新增 ${addedCount}，覆盖 ${replacedCount}）。`);
    } catch (err) {
      console.error('Failed to import resume backup:', err);
      window.alert('恢复失败：备份文件格式不正确或内容已损坏。');
    }
  };

  const removeSavedResume = (id: string) => {
    setSavedResumes((prev) => prev.filter((item) => item.id !== id));
    if (currentResumeId === id) {
      setCurrentResumeId(null);
    }
  };

  const sectionAction = (section?: ItemSectionId) => {
    if (!section) return null;
    const labels = getItemTitles(section);

    return (
      <div className="flex items-center gap-1">
        <div
          className="relative"
          ref={activeItemSortPanel === section ? itemSortPanelRef : null}
        >
          <button
            type="button"
            onClick={() => {
              setItemDropTarget(null);
              setActiveItemSortPanel((prev) => (prev === section ? null : section));
            }}
            className={`p-1 rounded transition-colors ${activeItemSortPanel === section ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'}`}
            title="条目排序"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          {activeItemSortPanel === section && (
            <div className="absolute right-0 top-full mt-2 z-20 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-3 origin-top-right">
              <div className="text-gray-800 font-semibold mb-2">经历排序</div>
              {labels.length === 0 ? (
                <div className="text-sm text-gray-400 px-2 py-3">暂无条目可排序</div>
              ) : (
                <div className="space-y-2">
                  {labels.map((label, index) => (
                    (() => {
                      const isDraggingThis = draggingItem?.section === section && draggingItem.index === index;
                      const isDropTargetThis = itemDropTarget?.section === section && itemDropTarget.index === index && !isDraggingThis;
                      return (
                        <div
                          key={`${section}-${index}-${label}`}
                          draggable
                          onDragStart={() => {
                            setActiveItemSortPanel(section);
                            setDraggingItem({ section, index });
                            setItemDropTarget(null);
                          }}
                          onDragEnd={() => {
                            setDraggingItem(null);
                            setItemDropTarget(null);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (!draggingItem || draggingItem.section !== section || draggingItem.index === index) return;
                            setItemDropTarget({ section, index });
                          }}
                          onDrop={() => handleItemDrop(section, index)}
                          className={`rounded-lg px-3 py-2 flex items-center gap-2 text-gray-700 transform-gpu transition-all duration-200 ease-out select-none ${
                            isDraggingThis
                              ? 'bg-white ring-2 ring-orange-200 shadow-md scale-[1.02] cursor-grabbing opacity-75'
                              : isDropTargetThis
                                ? 'bg-orange-50 ring-2 ring-orange-200 translate-x-1 cursor-move'
                                : 'bg-gray-100 hover:bg-gray-50 hover:shadow-sm cursor-grab'
                          }`}
                        >
                          <List className={`w-4 h-4 shrink-0 transition-colors ${isDropTargetThis ? 'text-orange-500' : 'text-gray-500'}`} />
                          <span className="truncate text-sm">{label}</span>
                        </div>
                      );
                    })()
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { school: '新学校', degree: '学位', major: '专业', duration: '202X.09 - 202X.06', tags: [], content: '<ul><li>主修课程...</li></ul>' }]
    }));
    setItemOpen((prev) => ({ ...prev, education: [...prev.education, false] }));
    if (!sectionsOpen.education) toggleSection('education');
  };

  const removeEducation = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
    setItemOpen((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const updateEducation = (index: number, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const addProject = () => {
    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, {
        company: '新项目',
        duration: '202X.01 - 202X.05',
        content: '<p><b>项目介绍：</b></p><p><b>技术栈：</b></p><p><b>主要贡献：</b></p><ul><li></li></ul>'
      }]
    }));
    setItemOpen((prev) => ({ ...prev, projects: [...prev.projects, false] }));
    if (!sectionsOpen.projects) toggleSection('projects');
  };

  const removeProject = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
    setItemOpen((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  const updateProject = (index: number, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const addWork = () => {
    setResumeData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, { company: '新公司', role: '职位', duration: '202X.01 - 202X.05', content: '<ul><li>工作内容...</li></ul>' }]
    }));
    setItemOpen((prev) => ({ ...prev, work: [...prev.work, false] }));
    if (!sectionsOpen.work) toggleSection('work');
  };

  const removeWork = (index: number) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index)
    }));
    setItemOpen((prev) => ({
      ...prev,
      work: prev.work.filter((_, i) => i !== index),
    }));
  };

  const updateWork = (index: number, field: string, value: any) => {
    setResumeData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const skillsEditorValue = resumeData.skills.items.length <= 1
    ? (resumeData.skills.items[0] || '')
    : `<ul>${resumeData.skills.items.map((item) => `<li>${item}</li>`).join('')}</ul>`;

  if (view === 'home') {
    return (
      <div className="relative min-h-screen overflow-hidden text-white bg-[radial-gradient(circle_at_12%_8%,rgba(56,189,248,0.14),transparent_34%),radial-gradient(circle_at_88%_5%,rgba(249,115,22,0.12),transparent_30%),linear-gradient(180deg,#0b1220_0%,#111827_100%)] p-6 md:p-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-24 w-[340px] h-[460px] opacity-30" style={{ clipPath: 'polygon(8% 20%, 70% 0%, 98% 30%, 80% 88%, 18% 100%, 0% 60%)', background: 'linear-gradient(160deg, rgba(148,163,184,0.20), rgba(30,41,59,0.08))' }} />
          <div className="absolute -left-10 top-[340px] w-[260px] h-[350px] opacity-20" style={{ clipPath: 'polygon(0% 28%, 60% 0%, 100% 38%, 74% 100%, 18% 92%)', background: 'linear-gradient(160deg, rgba(59,130,246,0.18), rgba(15,23,42,0.08))' }} />
          <div className="absolute right-[-80px] top-[110px] w-[320px] h-[420px] opacity-18" style={{ clipPath: 'polygon(16% 0%, 100% 18%, 82% 100%, 0% 82%)', background: 'linear-gradient(150deg, rgba(249,115,22,0.18), rgba(30,41,59,0.06))' }} />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_38%)]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-6">
              <h1 className="text-3xl font-black text-orange-400">我的简历 ({savedResumes.length})</h1>
              <span className="text-3xl font-black text-white/75">收藏模板</span>
              <span className="text-3xl font-black text-white/75">回收站</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={backupFileInputRef}
                type="file"
                className="hidden"
                accept="application/json,.json"
                onChange={handleImportBackup}
              />
              <button
                type="button"
                onClick={handleExportAllBackups}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                全部导出
              </button>
              <button
                type="button"
                onClick={triggerImportBackup}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                导入恢复
              </button>
              <button
                type="button"
                onClick={createResumeAndEdit}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> 新建简历
              </button>
            </div>
          </div>

          {savedResumes.length === 0 ? (
            <div className="bg-white/10 backdrop-blur rounded-xl border border-white/10 p-8 text-center text-white/80">
              暂无简历，点击右上角“新建简历”开始，或使用“导入恢复”加载备份。
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 justify-items-start">
              {savedResumes.map((doc) => (
                <div key={doc.id} className="w-[240px] bg-white/10 backdrop-blur-[2px] rounded-xl overflow-hidden shadow-[0_10px_26px_rgba(0,0,0,0.35)]">
                  <button
                    type="button"
                    onClick={() => openResume(doc)}
                    className="block w-full text-left"
                  >
                    <ResumeThumbnail
                      data={doc.data}
                      config={doc.config}
                      sectionOrder={ensureSectionOrder(doc.sectionOrder)}
                    />
                  </button>
                  <div className="p-3 border-t border-white/5 bg-slate-800/70">
                    <div className="font-semibold truncate">{doc.name}</div>
                    <div className="text-xs text-white/70 mt-1">
                      最后编辑于：{new Date(doc.updatedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openResume(doc)}
                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        继续编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportSingleResume(doc)}
                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded border border-white/20"
                      >
                        导出
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSavedResume(doc.id)}
                        className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 px-3 py-1 rounded border border-red-400/30"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#d9dbe3] flex flex-col md:flex-row print:block print:bg-white">
      {/* Sidebar */}
      <div className="w-full md:w-[620px] bg-white shadow-lg z-20 print:hidden flex flex-col h-screen sticky top-0 border-r border-gray-200" style={{ flexShrink: 0 }}>
        <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={() => setView('home')}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded"
          >
            返回首页
          </button>
          <span className="text-xs text-gray-500">已自动保存</span>
        </div>

        {/* Sidebar Header / Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'content' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Edit3 className="w-4 h-4" />
            内容编辑
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'design' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Settings className="w-4 h-4" />
            样式配置
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">

          {/* CONTENT TAB */}
          {activeTab === 'content' && (
            <div className="flex flex-col gap-4">
              <div className="relative" ref={orderMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsSectionOrderOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between bg-white hover:bg-gray-50 text-gray-800 rounded-xl px-3 py-3 border border-gray-200 shadow-sm transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold">栏目顺序（基本信息固定在最上方）</span>
                  </div>
                  {isSectionOrderOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </button>

                {isSectionOrderOpen && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-sm p-3 space-y-2">
                    <div className="text-xs text-gray-500 px-1">拖动下列栏目进行排序</div>
                    {sectionOrder.map((sectionId) => (
                      (() => {
                        const isDraggingThis = draggingSection === sectionId;
                        const isDropTargetThis = sectionDropTarget === sectionId && !isDraggingThis;
                        return (
                          <div
                            key={sectionId}
                            draggable
                            onDragStart={() => {
                              setDraggingSection(sectionId);
                              setSectionDropTarget(null);
                            }}
                            onDragEnd={() => {
                              setDraggingSection(null);
                              setSectionDropTarget(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (!draggingSection || draggingSection === sectionId) return;
                              setSectionDropTarget(sectionId);
                            }}
                            onDrop={() => handleSectionDrop(sectionId)}
                            className={`rounded-lg px-3 py-2 border flex items-center justify-between transform-gpu transition-all duration-200 ease-out select-none ${
                              isDraggingThis
                                ? 'bg-white border-blue-200 ring-2 ring-blue-200 shadow-md scale-[1.02] cursor-grabbing opacity-75'
                                : isDropTargetThis
                                  ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-200 translate-x-1 cursor-move'
                                  : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-sm cursor-grab'
                            }`}
                          >
                            <div className="flex items-center gap-2 text-gray-800">
                              <List className={`w-4 h-4 transition-colors ${isDropTargetThis ? 'text-blue-500' : 'text-gray-500'}`} />
                              <span className="font-medium">{sectionLabels[sectionId]}</span>
                            </div>
                            <span className={`text-xs transition-colors ${isDropTargetThis ? 'text-blue-500' : 'text-gray-400'}`}>
                              {isDropTargetThis ? '放到这里' : '拖动'}
                            </span>
                          </div>
                        );
                      })()
                    ))}
                  </div>
                )}
              </div>

              {/* Basic Info Card */}
              <CollapsibleSection
                title="基本信息"
                icon={<User className="w-5 h-5 text-orange-500" />}
                isOpen={sectionsOpen.basic}
                onToggle={() => toggleSection('basic')}
              >
                {/* Avatar Upload */}
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <label className="block text-xs text-gray-500 mb-2">简历照片</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded border border-gray-300 overflow-hidden bg-gray-100 shrink-0">
                      {resumeData.avatarUrl ? (
                        <img src={resumeData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">?</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-3 rounded text-sm font-medium transition-colors inline-flex items-center gap-2">
                        <Upload className="w-3 h-3" />
                        上传/更换照片
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                      <p className="text-[10px] text-gray-400 mt-1">建议尺寸: 1:1.4 (如 295x413px)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">姓名</label>
                    <input
                      type="text"
                      value={resumeData.name}
                      onChange={e => setResumeData({ ...resumeData, name: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">求职意向/标题</label>
                    <input
                      type="text"
                      value={resumeData.title}
                      onChange={e => setResumeData({ ...resumeData, title: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">电话</label>
                      <input
                        type="text"
                        value={resumeData.contact.phone}
                        onChange={e => setResumeData({ ...resumeData, contact: { ...resumeData.contact, phone: e.target.value } })}
                        className="w-full p-2 bg-white border border-gray-200 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">邮箱</label>
                      <input
                        type="text"
                        value={resumeData.contact.email}
                        onChange={e => setResumeData({ ...resumeData, contact: { ...resumeData.contact, email: e.target.value } })}
                        className="w-full p-2 bg-white border border-gray-200 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">个人网站</label>
                      <input
                        type="text"
                        value={resumeData.contact.website}
                        onChange={e => setResumeData({ ...resumeData, contact: { ...resumeData.contact, website: e.target.value } })}
                        className="w-full p-2 bg-white border border-gray-200 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">政治面貌</label>
                      <input
                        type="text"
                        value={resumeData.contact.politicalStatus || ''}
                        onChange={e => setResumeData({ ...resumeData, contact: { ...resumeData.contact, politicalStatus: e.target.value } })}
                        className="w-full p-2 bg-white border border-gray-200 rounded text-sm text-gray-900 focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Education Card */}
              <div style={{ order: sectionOrder.indexOf('education') }}>
              <CollapsibleSection
                title="教育背景"
                icon={<GraduationCap className="w-5 h-5 text-orange-500" />}
                isOpen={sectionsOpen.education}
                onToggle={() => toggleSection('education')}
                action={sectionAction('education')}
              >
                <div className="space-y-4">
                  {resumeData.education.map((edu, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          className="text-left flex-1"
                          onClick={() => toggleItemOpen('education', idx)}
                        >
                          <div className="font-bold text-gray-900">{edu.school} {edu.degree} {edu.major}</div>
                          <div className="text-sm text-gray-600 mt-1">| {edu.duration}</div>
                        </button>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => removeEducation(idx)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                          <button type="button" onClick={() => toggleItemOpen('education', idx)} className="text-gray-400 hover:text-gray-700 p-1">
                            {(itemOpen.education[idx] ?? false) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {(itemOpen.education[idx] ?? false) && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">学校名称</label>
                            <input
                              value={edu.school}
                              onChange={e => updateEducation(idx, 'school', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded p-1.5 text-sm text-gray-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">时间段</label>
                            <input
                              value={edu.duration}
                              onChange={e => updateEducation(idx, 'duration', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded p-1.5 text-sm text-gray-900 text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">学位</label>
                            <input
                              value={edu.degree}
                              onChange={e => updateEducation(idx, 'degree', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded p-1.5 text-sm text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">专业</label>
                            <input
                              value={edu.major}
                              onChange={e => updateEducation(idx, 'major', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded p-1.5 text-sm text-gray-900"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">标签</label>
                            <TagManager
                              tags={edu.tags || []}
                              onChange={(newTags) => updateEducation(idx, 'tags', newTags)}
                            />
                          </div>
                          <div className="col-span-2">
                            <RichTextEditor
                              value={edu.content}
                              onChange={val => updateEducation(idx, 'content', val)}
                              placeholder="主修课程、荣誉奖项等..."
                              linkUnderline={config.linkUnderline}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEducation}
                    className="inline-flex items-center gap-1.5 border border-gray-200 bg-white text-blue-600 hover:bg-blue-50 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors shadow-sm"
                  >
                    <span className="w-4 h-4 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center">
                      <Plus className="w-2.5 h-2.5" />
                    </span>
                    添加一段教育背景
                  </button>
                </div>
              </CollapsibleSection>
              </div>

              {/* Work Experience Card */}
              <div style={{ order: sectionOrder.indexOf('work') }}>
              <CollapsibleSection
                title="实习经历"
                icon={<Briefcase className="w-5 h-5 text-orange-500" />}
                isOpen={sectionsOpen.work}
                onToggle={() => toggleSection('work')}
                action={sectionAction('work')}
              >
                <div className="space-y-4">
                  {resumeData.workExperience.map((work, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          className="text-left flex-1"
                          onClick={() => toggleItemOpen('work', idx)}
                        >
                          <div className="font-bold text-gray-900">{work.company}{work.role ? ` - ${work.role}` : ''}</div>
                          <div className="text-sm text-gray-600 mt-1">| {work.duration}</div>
                        </button>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => removeWork(idx)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                          <button type="button" onClick={() => toggleItemOpen('work', idx)} className="text-gray-400 hover:text-gray-700 p-1">
                            {(itemOpen.work[idx] ?? false) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {(itemOpen.work[idx] ?? false) && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">公司名称</label>
                            <input
                              value={work.company}
                              onChange={e => updateWork(idx, 'company', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded p-1.5 text-sm text-gray-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">时间段</label>
                            <input
                              value={work.duration}
                              onChange={e => updateWork(idx, 'duration', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded p-1.5 text-sm text-gray-900 text-center"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-0.5">职位名称</label>
                            <input
                              value={work.role || ''}
                              onChange={e => updateWork(idx, 'role', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded p-1.5 text-sm text-gray-900"
                            />
                          </div>
                          <div className="col-span-2">
                            <RichTextEditor
                              value={work.content}
                              onChange={val => updateWork(idx, 'content', val)}
                              placeholder="工作内容描述..."
                              linkUnderline={config.linkUnderline}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addWork}
                    className="inline-flex items-center gap-1.5 border border-gray-200 bg-white text-blue-600 hover:bg-blue-50 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors shadow-sm"
                  >
                    <span className="w-4 h-4 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center">
                      <Plus className="w-2.5 h-2.5" />
                    </span>
                    添加一段实习经历
                  </button>
                </div>
              </CollapsibleSection>
              </div>

              {/* Projects Card */}
              <div style={{ order: sectionOrder.indexOf('projects') }}>
              <CollapsibleSection
                title="项目经历"
                icon={<Code className="w-5 h-5 text-orange-500" />}
                isOpen={sectionsOpen.projects}
                onToggle={() => toggleSection('projects')}
                action={sectionAction('projects')}
              >
                <div className="space-y-4">
                  {resumeData.projects.map((proj, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          className="text-left flex-1"
                          onClick={() => toggleItemOpen('projects', idx)}
                        >
                          <div className="font-bold text-gray-900">{proj.company}</div>
                          <div className="text-sm text-gray-600 mt-1">| {proj.duration}</div>
                        </button>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => removeProject(idx)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                          <button type="button" onClick={() => toggleItemOpen('projects', idx)} className="text-gray-400 hover:text-gray-700 p-1">
                            {(itemOpen.projects[idx] ?? false) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {(itemOpen.projects[idx] ?? false) && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">项目名称</label>
                            <input
                              value={proj.company}
                              onChange={e => updateProject(idx, 'company', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded p-1.5 text-sm text-gray-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-0.5">时间段</label>
                            <input
                              value={proj.duration}
                              onChange={e => updateProject(idx, 'duration', e.target.value)}
                              className="w-full bg-white border border-gray-200 rounded p-1.5 text-sm text-gray-900 text-center"
                            />
                          </div>
                          <div className="col-span-2">
                            <RichTextEditor
                              value={proj.content}
                              onChange={val => updateProject(idx, 'content', val)}
                              placeholder="在这里直接编写项目介绍、技术栈、主要贡献，并可使用有序/无序列表"
                              linkUnderline={config.linkUnderline}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addProject}
                    className="inline-flex items-center gap-1.5 border border-gray-200 bg-white text-blue-600 hover:bg-blue-50 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors shadow-sm"
                  >
                    <span className="w-4 h-4 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center">
                      <Plus className="w-2.5 h-2.5" />
                    </span>
                    添加一段项目经历
                  </button>
                </div>
              </CollapsibleSection>
              </div>

              {/* Skills Card */}
              <div style={{ order: sectionOrder.indexOf('skills') }}>
              <CollapsibleSection
                title="专业技能"
                icon={<Sliders className="w-5 h-5 text-orange-500" />}
                isOpen={sectionsOpen.skills}
                onToggle={() => toggleSection('skills')}
                action={sectionAction()}
              >
                <RichTextEditor
                  value={skillsEditorValue}
                  onChange={(val) => {
                    setResumeData((prev) => ({
                      ...prev,
                      skills: { ...prev.skills, items: [val] },
                    }));
                  }}
                  placeholder="请在一个富文本框里编辑全部专业技能内容"
                  linkUnderline={config.linkUnderline}
                />
              </CollapsibleSection>
              </div>
            </div>
          )}

          {/* DESIGN TAB */}
          {activeTab === 'design' && (
            <div className="space-y-8">
              {/* Font Family Control */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Type className="w-4 h-4" />
                  字体选择
                </label>
                <select
                  value={config.fontFamily}
                  onChange={(e) => setConfig({ ...config, fontFamily: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {FONT_OPTIONS.map(font => (
                    <option key={font.name} value={font.value}>{font.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">注：宋体/仿宋等字体依赖本地系统字体库。</p>
              </div>

              {/* Link Underline Control */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <LinkIcon className="w-4 h-4" />
                  链接下划线
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.linkUnderline}
                    onChange={(e) => setConfig({ ...config, linkUnderline: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">显示下划线</span>
                </label>
              </div>

              {/* Font Size Control */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span className="text-lg">A</span>
                  字体大小 ({config.baseFontSize}pt)
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">8</span>
                  <input
                    type="range"
                    min="8"
                    max="14"
                    step="0.5"
                    value={config.baseFontSize}
                    onChange={(e) => setConfig({ ...config, baseFontSize: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-xs text-gray-400">14</span>
                </div>
              </div>

              {/* Line Height Control */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Sliders className="w-4 h-4" />
                  行间距 ({config.lineHeight})
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.1"
                  value={config.lineHeight}
                  onChange={(e) => setConfig({ ...config, lineHeight: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Margin Controls */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 pb-1 border-b">
                  <Layout className="w-4 h-4" />
                  页边距配置
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs text-gray-500">左右边距</label>
                    <span className="text-xs font-mono text-gray-700">{config.pagePaddingX}mm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={config.pagePaddingX}
                    onChange={(e) => setConfig({ ...config, pagePaddingX: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs text-gray-500">上下边距</label>
                    <span className="text-xs font-mono text-gray-700">{config.pagePaddingY}mm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={config.pagePaddingY}
                    onChange={(e) => setConfig({ ...config, pagePaddingY: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 pb-1 border-b">
                    <Sliders className="w-4 h-4" />
                    项目间距
                  </div>
                  <div className="flex justify-between">
                    <label className="text-xs text-gray-500">条目间距</label>
                    <span className="text-xs font-mono text-gray-700">{config.itemSpacing}mm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={config.itemSpacing}
                    onChange={(e) => setConfig({ ...config, itemSpacing: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs text-gray-500">栏目间距</label>
                    <span className="text-xs font-mono text-gray-700">{config.sectionSpacing}mm</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={config.sectionSpacing}
                    onChange={(e) => setConfig({ ...config, sectionSpacing: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Print Button in Sidebar Footer */}
        <div className="p-4 md:p-6 border-t border-gray-200 bg-white">
          <button
            onClick={handlePrint}
            disabled={isExporting}
            className={`w-full flex items-center justify-center gap-2 ${isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black hover:scale-[1.02]'} text-white py-3 px-4 rounded-lg shadow transition-all font-semibold`}
          >
            <Printer size={20} />
            {isExporting ? '准备打印...' : '系统打印 / 导出 PDF'}
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div
        ref={previewRef}
        className={`relative flex-1 bg-[#d9dbe3] p-2 md:p-6 overflow-auto flex flex-col items-center print:p-0 print:bg-white print:block ${
          zoom > 1 ? (isPanningPreview ? 'cursor-grabbing select-none' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        <div
          ref={resumeRef}
          className="print:shadow-none"
          style={{ transform: isSystemPrinting ? 'scale(1)' : `scale(${zoom})`, transformOrigin: 'top center' }}
        >
          <ResumeDocument
            key={`${currentResumeId ?? 'resume'}-${pdfRefreshToken}`}
            data={resumeData}
            config={config}
            sectionOrder={sectionOrder}
            onConfigChange={setConfig}
            isPrintMode={isSystemPrinting}
          />
        </div>
      </div>
    </div>
  );
};

export default App;



