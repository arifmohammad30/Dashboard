import React, { memo } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = memo(({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  totalRecords,
  itemsPerPage,
  pageSize
}) => {
  const actualTotal = totalItems !== undefined ? totalItems : (totalRecords !== undefined ? totalRecords : 0);
  const actualPageSize = itemsPerPage || pageSize || 10;

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

  const startRecord = actualTotal > 0 ? (currentPage - 1) * actualPageSize + 1 : 0;
  const endRecord = Math.min(currentPage * actualPageSize, actualTotal);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 w-full">
      {/* Mobile Controls */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 shadow-2xs rounded-xl disabled:opacity-40 transition-colors duration-150 cursor-pointer"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 shadow-2xs rounded-xl ml-3 disabled:opacity-40 transition-colors duration-150 cursor-pointer"
        >
          Next
        </button>
      </div>

      {/* Desktop Controls */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between px-1">
        <div>
          {actualTotal > 0 && (
            <p className="text-xs text-stone-500 font-medium">
              Showing <span className="font-bold text-stone-900">{startRecord}</span> to{' '}
              <span className="font-bold text-stone-900">{endRecord}</span> of{' '}
              <span className="font-bold text-stone-900">{actualTotal}</span> results
            </p>
          )}
        </div>

        {totalPages > 1 && (
          <div>
            <nav className="isolate inline-flex items-center gap-1.5" aria-label="Pagination">
              <button
                onClick={() => onPageChange && onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 text-stone-500 hover:text-[#30702a] bg-white hover:bg-[#4DA944]/10 hover:border-[#4DA944]/30 border border-stone-200/90 shadow-2xs rounded-lg disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-stone-500 disabled:hover:border-stone-200/90 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>

              <div className="flex gap-1 mx-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="relative inline-flex items-center justify-center w-7 h-7 text-xs font-bold text-stone-400"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => onPageChange && onPageChange(page)}
                      aria-current={currentPage === page ? 'page' : undefined}
                      className={`relative inline-flex items-center justify-center w-7 h-7 text-xs font-bold transition-all duration-150 outline-none rounded-lg cursor-pointer active:scale-95 ${
                        currentPage === page
                          ? 'bg-[#4DA944] text-white border border-[#4DA944] shadow-xs'
                          : 'text-stone-700 bg-white hover:bg-[#4DA944]/10 hover:text-[#30702a] hover:border-[#4DA944]/30 border border-stone-200/90 shadow-2xs'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => onPageChange && onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5 text-stone-500 hover:text-[#30702a] bg-white hover:bg-[#4DA944]/10 hover:border-[#4DA944]/30 border border-stone-200/90 shadow-2xs rounded-lg disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-stone-500 disabled:hover:border-stone-200/90 cursor-pointer disabled:cursor-not-allowed transition-colors duration-150"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

export default Pagination;
