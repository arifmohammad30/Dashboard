import React from 'react';
import { Edit, Trash2, MoreVertical } from 'lucide-react';

export default function TableActions({
  onEdit,
  onDelete,
  onMore,
  showMore = false,
  editTitle = "Edit",
  deleteTitle = "Delete"
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit && onEdit(e);
        }}
        className="p-1.5 text-orange-500 bg-orange-50/80 border border-orange-200/80 hover:bg-orange-500 hover:text-white hover:border-orange-500 rounded-xl shadow-xs hover:shadow-md transition active:scale-95 duration-200 cursor-pointer"
        title={editTitle}
      >
        <Edit className="w-3 h-3" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete && onDelete(e);
        }}
        className="p-1.5 text-rose-500 bg-white/70 border border-rose-100 hover:bg-rose-500 hover:text-white rounded-xl shadow-xs hover:shadow-md transition active:scale-95 duration-200 cursor-pointer"
        title={deleteTitle}
      >
        <Trash2 className="w-3 h-3" />
      </button>

      {(showMore || onMore) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMore && onMore(e);
          }}
          className="p-1.5 text-stone-500 bg-white/70 border border-stone-200 hover:bg-stone-600 hover:text-white rounded-xl shadow-xs hover:shadow-md transition active:scale-95 duration-200 cursor-pointer"
        >
          <MoreVertical className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
