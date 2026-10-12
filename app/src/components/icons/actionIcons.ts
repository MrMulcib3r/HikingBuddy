import {
  Archive,
  Backpack,
  Camera,
  Check,
  Copy,
  CopyPlus,
  ExternalLink,
  GripVertical,
  HardDrive,
  HardDriveDownload,
  HardDriveUpload,
  Images,
  Map as MapIcon,
  Mountain,
  Plus,
  Search,
  Signpost,
  Trash2,
  Unplug,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react';

/**
 * One place for "which icon means which action" (design system README, Iconography and
 * IconButton). Use these instead of importing Lucide icons ad hoc, so an action looks the
 * same everywhere. Worn uses the custom BootIcon (./HikerIcons).
 */
export const ActionIcon = {
  saveSnapshot: Camera,
  viewSnapshot: Images,
  share: Signpost,
  template: MapIcon,
  delete: Trash2,
  remove: X,
  exportBackup: HardDriveDownload,
  importBackup: HardDriveUpload,
  dataFile: HardDrive,
  disconnect: Unplug,
  search: Search,
  drag: GripVertical,
  total: Mountain,
  base: Backpack,
  consumable: Utensils,
  newGearlist: Plus,
  add: Plus,
  createCopy: CopyPlus,
  copyLink: Copy,
  openPreview: ExternalLink,
  confirm: Check,
  keepInGearlists: Archive,
} satisfies Record<string, LucideIcon>;

/** Stroke width for every Lucide icon in the app (design system: 1.75). */
export const ICON_STROKE = 1.75;
