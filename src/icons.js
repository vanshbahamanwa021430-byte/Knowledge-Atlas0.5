// Line icons from Lucide (ISC licence, https://lucide.dev), rendered as inline SVG strings so they work offline.
import {
  House, Camera, Image, Library, BookOpen, BookOpenText, ClipboardCheck, LayoutGrid, BrainCircuit, Sparkles, Lightbulb, MessageCircle,
  Send, Share, Upload, Download, Moon, Sun, Monitor, Search, Plus, Ellipsis, EllipsisVertical, Crosshair, Network, X, Eye,
  EyeOff, CircleCheck, Circle, Bookmark, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Settings, FileText,
  NotebookPen, StickyNote, ZoomIn, ZoomOut, Maximize, ListTree, ChartColumn, Trophy, Timer, Trash2, Info, TriangleAlert,
  RotateCcw, Plug, Server, Key, Target, Workflow, MonitorSmartphone, HardDrive, Clock, Check, Map as MapIcon, Lock, Pencil,
  GraduationCap, Flame, Phone, Heart, Layers, CalendarDays, ListTodo, Volume2, VolumeX, Play, Pause, Square, Bell, BellOff,
  Award, TrendingUp, Type, Zap, CircleX, Headphones, SkipForward, Coffee, RefreshCw, Hourglass, Code, Bug, SquareTerminal, FlaskConical, Cloud, CloudOff, LogIn, LogOut, User, ShieldCheck
  , BotMessageSquare, Menu, Mic, MicOff, Route, Flag, Copy, Rocket
} from 'lucide';

const NODES = {
  menu: Menu, mic: Mic, micOff: MicOff, route: Route, flag: Flag, copy: Copy, rocket: Rocket, crosshair: Crosshair, home: House, library: Library, study: BookOpen, read: BookOpenText, test: ClipboardCheck, more: LayoutGrid, brain: BrainCircuit, smarty: BotMessageSquare,
  sparkles: Sparkles, bulb: Lightbulb, chat: MessageCircle, send: Send, share: Share, upload: Upload, download: Download,
  moon: Moon, sun: Sun, monitor: Monitor, search: Search, plus: Plus, dots: Ellipsis, dotsV: EllipsisVertical, focus: Crosshair,
  network: Network, x: X, eye: Eye, eyeOff: EyeOff, checkCircle: CircleCheck, circle: Circle, bookmark: Bookmark,
  back: ArrowLeft, next: ArrowRight, chevL: ChevronLeft, chevR: ChevronRight, chevD: ChevronDown, settings: Settings,
  file: FileText, camera: Camera, image: Image, note: NotebookPen, sticky: StickyNote, zoomIn: ZoomIn, zoomOut: ZoomOut, fit: Maximize, outline: ListTree,
  chart: ChartColumn, trophy: Trophy, timer: Timer, trash: Trash2, info: Info, alert: TriangleAlert, restore: RotateCcw,
  plug: Plug, server: Server, key: Key, target: Target, flow: Workflow, devices: MonitorSmartphone, storage: HardDrive,
  clock: Clock, check: Check, map: MapIcon, lock: Lock, pencil: Pencil, grad: GraduationCap, flame: Flame, phone: Phone, heart: Heart,
  cards: Layers, calendar: CalendarDays, todo: ListTodo, volume: Volume2, mute: VolumeX, play: Play, pause: Pause, stop: Square,
  bell: Bell, bellOff: BellOff, award: Award, trend: TrendingUp, type: Type, zap: Zap, xCircle: CircleX, listen: Headphones,
  skip: SkipForward, coffee: Coffee, refresh: RefreshCw, hourglass: Hourglass, code: Code, bug: Bug, terminal: SquareTerminal, flask: FlaskConical, cloud: Cloud, cloudOff: CloudOff, login: LogIn, logout: LogOut, user: User, shield: ShieldCheck
};

const attr = a => Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ');
const inner = node => (node || []).map(([tag, a]) => `<${tag} ${attr(a)}/>`).join('');

export function icon(name, size = 22, cls = '', stroke = 1.9) {
  return `<svg class="i ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner(NODES[name])}</svg>`;
}

// Raw SVG children of an icon, for drawing it inside another SVG (logo, illustrations).
export const iconPaths = name => inner(NODES[name]);
