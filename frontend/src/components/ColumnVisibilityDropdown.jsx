import React, { useState, useRef, useEffect } from 'react';

function ColumnVisibilityDropdown({ columns, onToggle }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="px-3 py-1 border border-gray-300 rounded bg-white shadow hover:bg-gray-100 text-sm"
      >
        Select Columns
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-48 bg-white border border-gray-200 rounded shadow-md p-2">
          {columns.map((col, idx) => (
            <div
              key={col.key}
              className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer rounded"
            >
              <input
                type="checkbox"
                checked={col.visible}
                onChange={() => onToggle(idx)}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-800">{col.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ColumnVisibilityDropdown;
