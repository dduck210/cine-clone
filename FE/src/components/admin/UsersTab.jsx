import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Edit, Trash2, X, Search, Shield, User, Save, Square, CheckSquare } from "lucide-react";

export const UserEditModal = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(user._id, { name });
    setSaving(false);
  };

  const unchanged = name === user.name;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-100"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-slate-800">Chỉnh sửa thành viên</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all duration-150 active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 mb-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">{user.email}</p>
              <p className="text-xs text-slate-400">{user.role === "admin" ? "Quản trị viên" : "Thành viên"}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Họ tên</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-medium outline-none focus:border-[#dc2626] focus:ring-4 focus:ring-red-50 text-sm transition-all duration-150"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 text-sm transition-all duration-150 active:scale-95"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving || unchanged}
            className="flex-1 py-2.5 bg-[#dc2626] rounded-xl text-white font-bold shadow-lg shadow-red-100 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Đang lưu...</>
            ) : (
              <><Save size={14} />Lưu</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const USERS_PAGE_SIZE = 6;

export const UsersManager = ({ users, loading, onUpdate, onDelete, onBulkDelete }) => {
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id) => { setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); };
  const toggleSelectAll = () => {
    const selectable = pagedUsers.filter((u) => u.role !== "admin" && u.email !== currentUser?.email);
    if (selectedIds.size === selectable.length && selectable.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(selectable.map((u) => u._id)));
  };
  const clearSelection = () => setSelectedIds(new Set());
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    await onBulkDelete([...selectedIds]);
    setDeleting(false);
    clearSelection();
  };

  const totalPages = Math.ceil(filtered.length / USERS_PAGE_SIZE);
  const pagedUsers = filtered.slice((currentPage - 1) * USERS_PAGE_SIZE, currentPage * USERS_PAGE_SIZE);

  const handleSearch = (e) => { setSearch(e.target.value); setCurrentPage(1); };

  const formatDate = (d) => new Date(d).toLocaleDateString("vi-VN");

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes deleteIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Thành viên hệ thống</h2>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} tài khoản</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên hoặc email..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#dc2626] focus:ring-4 focus:ring-red-50 font-medium transition-all duration-150"
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-[fadeIn_0.2s_ease_forwards]">
          <span className="text-sm font-bold text-red-700">Đã chọn {selectedIds.size} người dùng</span>
          <div className="flex items-center gap-2">
            <button onClick={clearSelection} className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Bỏ chọn</button>
            <button onClick={handleBulkDelete} disabled={deleting} className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"><Trash2 size={14} /> Xóa {selectedIds.size} người dùng</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="text-left px-6 py-3.5 w-12">
                      <button onClick={toggleSelectAll} className="hover:text-slate-700 transition-colors">
                        {(() => { const sel = pagedUsers.filter((u) => u.role !== "admin" && u.email !== currentUser?.email); return sel.length > 0 && selectedIds.size === sel.length; })() ? <CheckSquare size={16} className="text-red-600" /> : <Square size={16} />}
                      </button>
                    </th>
                    <th className="text-left px-6 py-3.5">Thành viên</th>
                    <th className="text-left px-6 py-3.5">Vai trò</th>
                    <th className="text-left px-6 py-3.5 hidden lg:table-cell">Tham gia</th>
                    <th className="text-right px-6 py-3.5">Thao tác</th>
                  </tr>
                </thead>
                <tbody key={currentPage} className="divide-y divide-slate-50">
                  {pagedUsers.map((user, idx) => (
                    <tr
                      key={user._id}
                      className="hover:bg-slate-50/80 transition-all duration-150"
                      style={{ animation: "rowIn 0.25s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${idx * 40}ms` }}
                    >
                      <td className="px-6 py-4">
                        <button onClick={(e) => { e.stopPropagation(); if (user.role !== "admin" && user.email !== currentUser?.email) toggleSelect(user._id); }} className="hover:text-red-600 transition-colors disabled:opacity-30" disabled={user.role === "admin" || user.email === currentUser?.email}>
                          {selectedIds.has(user._id) ? <CheckSquare size={16} className="text-red-600" /> : <Square size={16} className="text-slate-300 group-hover:text-slate-500" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center font-bold text-[#dc2626] text-sm flex-shrink-0 border border-red-100">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-[#dc2626] border border-red-100">
                            <Shield size={11} /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            <User size={11} /> Thành viên
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs hidden lg:table-cell">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditUser(user)}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-[#dc2626] transition-all duration-150 active:scale-90"
                            title="Chỉnh sửa"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            disabled={user.email === currentUser?.email || user.role === "admin"}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all duration-150 active:scale-90 disabled:opacity-25 disabled:cursor-not-allowed"
                            title={user.role === "admin" ? "Không thể xóa admin" : "Xóa"}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400 font-medium">
                        Không tìm thấy thành viên nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-medium">
                Hiển thị <span className="font-bold text-slate-600">{filtered.length === 0 ? 0 : (currentPage - 1) * USERS_PAGE_SIZE + 1}–{Math.min(currentPage * USERS_PAGE_SIZE, filtered.length)}</span> / <span className="font-bold text-slate-600">{filtered.length}</span> thành viên
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 h-9 rounded-lg text-sm font-bold border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
                >
                  ‹ Trước
                </button>
                {Array.from({ length: totalPages || 1 }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all duration-150 active:scale-95 ${currentPage === p ? "bg-[#dc2626] text-white shadow-sm shadow-red-200" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(Math.max(totalPages, 1), p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 h-9 rounded-lg text-sm font-bold border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
                >
                  Sau ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {editUser && (
        <UserEditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSave={async (id, data) => { await onUpdate(id, data); setEditUser(null); }}
        />
      )}

      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-100"
            style={{ animation: "deleteIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[#dc2626]">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Xác nhận xóa?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Xóa tài khoản <span className="font-bold text-slate-800">"{deleteTarget.name}"</span>?<br />
              <span className="text-xs text-red-500">Hành động này không thể hoàn tác.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 text-sm transition-all duration-150 active:scale-95"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-[#dc2626] rounded-xl text-white font-bold shadow-lg shadow-red-100 hover:bg-red-700 disabled:opacity-50 text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Đang xóa...</>
                ) : "Xóa"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
