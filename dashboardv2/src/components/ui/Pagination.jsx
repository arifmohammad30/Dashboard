import React, { memo } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = memo(({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const getPageNumbers = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach(i => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 w-full">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 shadow-sm rounded-lg disabled:opacity-50 transition-colors duration-200"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 shadow-sm rounded-lg ml-3 disabled:opacity-50 transition-colors duration-200"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between px-2">
        <div>
          {totalItems !== undefined && (
            <p className="text-xs text-stone-500 font-medium">
              Showing <span className="font-bold text-stone-900">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> to <span className="font-bold text-stone-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
              <span className="font-bold text-stone-900">{totalItems}</span> results
            </p>
          )}
        </div>
        <div>
          <nav className="isolate inline-flex items-center gap-1.5" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-stone-500 hover:text-stone-900 bg-white hover:bg-stone-100/80 border border-stone-200/90 shadow-2xs rounded-xl disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-stone-500 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="flex gap-1.5 mx-1">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center justify-center w-8 h-8 text-xs font-bold text-stone-400"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => onPageChange(page)}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={`relative inline-flex items-center justify-center w-8 h-8 text-xs font-bold transition-all duration-150 outline-none rounded-xl cursor-pointer active:scale-95 ${
                      currentPage === page
                        ? 'bg-stone-900 text-white border border-stone-900 shadow-2xs'
                        : 'text-stone-700 bg-white hover:bg-stone-100/80 hover:text-stone-900 border border-stone-200/90 shadow-2xs'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-stone-500 hover:text-stone-900 bg-white hover:bg-stone-100/80 border border-stone-200/90 shadow-2xs rounded-xl disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-stone-500 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

export default Pagination;
