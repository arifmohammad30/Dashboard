import React from 'react';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import { useAuthorization } from '../../features/auth/hooks/useAuthorization';

export default function TableActions({
  onEdit,
  onDelete,
  onMore,
  showMore = false,
  editTitle = "Edit",
  deleteTitle = "Delete",
  editPermission,
  deletePermission,
  morePermission
}) {
  const { hasPermission } = useAuthorization();

  const canEdit = onEdit && (!editPermission || hasPermission(editPermission));
  const canDelete = onDelete && (!deletePermission || hasPermission(deletePermission));
  const canMore = (showMore || onMore) && (!morePermission || hasPermission(morePermission));

  if (!canEdit && !canDelete && !canMore) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {canEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit(e);
          }}
          className="p-1.5 text-orange-500 bg-orange-50/80 border border-orange-200/80 hover:bg-orange-500 hover:text-white hover:border-orange-500 rounded-xl shadow-2xs hover:shadow-xs transition active:scale-95 duration-150 cursor-pointer"
          title={editTitle}
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
      )}

      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
          className="p-1.5 text-rose-500 bg-rose-50/80 border border-rose-200/80 hover:bg-rose-500 hover:text-white hover:border-rose-500 rounded-xl shadow-2xs hover:shadow-xs transition active:scale-95 duration-150 cursor-pointer"
          title={deleteTitle}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {canMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMore && onMore(e);
          }}
          className="p-1.5 text-stone-500 bg-stone-50/80 border border-stone-200/80 hover:bg-stone-600 hover:text-white rounded-xl shadow-2xs hover:shadow-xs transition active:scale-95 duration-150 cursor-pointer"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
