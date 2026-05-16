import { useState } from 'react';
import { ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import type { FolderNode } from '@/types';
import { cn } from '@/utils/cn';

function TreeRow({ node, depth = 0 }: { node: FolderNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const isFolder = node.type === 'folder';
  return (
    <div>
      <button
        onClick={() => isFolder && setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
          'hover:bg-ink-100 dark:hover:bg-ink-800',
        )}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        {isFolder ? (
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 text-ink-400 transition-transform',
              open && 'rotate-90',
            )}
          />
        ) : (
          <span className="w-3.5" />
        )}
        {isFolder ? (
          open ? (
            <FolderOpen className="h-4 w-4 text-brand-600" />
          ) : (
            <Folder className="h-4 w-4 text-brand-600" />
          )
        ) : (
          <FileText className="h-4 w-4 text-ink-400" />
        )}
        <span className="font-mono text-xs text-ink-700 dark:text-ink-200">{node.name}</span>
        {node.description && (
          <span className="ml-auto truncate text-[10px] text-ink-500 dark:text-ink-400">
            {node.description}
          </span>
        )}
      </button>
      {isFolder && open && node.children && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden"
        >
          {node.children.map((child, i) => (
            <TreeRow key={i} node={child} depth={depth + 1} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

export function FolderTree({ root }: { root: FolderNode }) {
  return (
    <div className="rounded-xl border border-ink-200 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-900/60 p-2">
      <TreeRow node={root} />
    </div>
  );
}
