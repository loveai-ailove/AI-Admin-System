"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type TreeNode = {
  id: number;
  name: string;
  children?: TreeNode[];
};

export function TreeSelect({
  value,
  onChange,
  options,
  placeholder = "请选择",
  excludeId,
}: {
  value: string;
  onChange: (value: string) => void;
  options: TreeNode[];
  placeholder?: string;
  excludeId?: number | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const filteredOptions = useMemo(
    () => options.filter((node) => node.id !== excludeId),
    [options, excludeId]
  );

  useEffect(() => {
    if (!initializedRef.current) {
      const allParentIds = new Set<number>();
      const collectParentIds = (nodes: TreeNode[]) => {
        for (const node of nodes) {
          if (node.children && node.children.length > 0) {
            allParentIds.add(node.id);
            collectParentIds(node.children);
          }
        }
      };
      collectParentIds(filteredOptions);
      setExpandedIds(allParentIds);
      initializedRef.current = true;
    }
  }, [filteredOptions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function findNodeName(nodes: TreeNode[], id: number): string | null {
    for (const node of nodes) {
      if (node.id === id) return node.name;
      if (node.children) {
        const found = findNodeName(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  const selectedName = value ? findNodeName(options, Number(value)) : null;

  function renderTree(nodes: TreeNode[], level: number) {
    return nodes.map((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedIds.has(node.id);

      return (
        <div key={node.id}>
          <div
            className={`flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-gray-100 ${
              value === String(node.id) ? "bg-blue-50 text-blue-700" : "text-gray-700"
            }`}
            style={{ paddingLeft: `${12 + level * 24}px` }}
            onClick={() => {
              onChange(String(node.id));
              setIsOpen(false);
            }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(node.id);
                }}
                className="mr-2 flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200"
              >
                <svg
                  className={`h-3 w-3 text-gray-500 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <span className="mr-2 w-5" />
            )}
            {node.name}
          </div>
          {hasChildren && isExpanded && node.children && renderTree(node.children, level + 1)}
        </div>
      );
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="mt-1 flex w-full items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-left text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedName ? "text-gray-900" : "text-gray-500"}>
          {selectedName || placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          <div
            className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 ${
              value === "" ? "bg-blue-50 text-blue-700" : "text-gray-700"
            }`}
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
          >
            {placeholder}
          </div>
          {renderTree(filteredOptions, 0)}
        </div>
      )}
    </div>
  );
}
