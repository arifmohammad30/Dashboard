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
    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      {canEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit && onEdit(e);
          }}
          className="p-1 text-slate-400 hover:text-[#4DA944] transition-colors duration-150 cursor-pointer focus:outline-none"
          title={editTitle}
        >
          <Edit className="w-4 h-4 stroke-[2.2]" />
        </button>
      )}

      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
          }}
          className="p-1 text-slate-400 hover:text-rose-600 transition-colors duration-150 cursor-pointer focus:outline-none"
          title={deleteTitle}
        >
          <Trash2 className="w-4 h-4 stroke-[2.2]" />
        </button>
      )}

      {canMore && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMore && onMore(e);
          }}
          className="p-1 text-slate-400 hover:text-slate-900 transition-colors duration-150 cursor-pointer focus:outline-none"
        >
          <MoreVertical className="w-4 h-4 stroke-[2.2]" />
        </button>
      )}
    </div>
  );
}
